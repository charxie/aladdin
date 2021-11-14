/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 *
 * @author Charles Xie, Xiaotong Ding
 */

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useStore } from './stores/common';
import * as Selector from 'src/stores/selector';
import './app.css';
import { Camera, Canvas } from '@react-three/fiber';
import OrbitController from './orbitController';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import Sky from './views/sky';
import Axes from './views/axes';
import ElementsRenderer from './elementsRenderer';
import Ground from './views/ground';
import Heliodon from './views/heliodon';
import ifiLogo from './assets/ifi-logo.png';
import MainMenu from './mainMenu';
import MapPanel from './panels/mapPanel';
import HeliodonPanel from './panels/heliodonPanel';
import { DEFAULT_FAR, DEFAULT_FOV, VERSION } from './constants';
import { visitHomepage, visitIFI } from './helpers';
import AcceptCookie from './acceptCookie';
import GroundImage from './views/groundImage';
import { Modal, ConfigProvider } from 'antd';
import DropdownContextMenu from './components/contextMenu';
import WeatherPanel from './panels/weatherPanel';
import { GraphDataType, ObjectType } from './types';
import SensorSimulation from './analysis/sensorSimulation';
import SolarPanelSimulation from './analysis/solarPanelSimulation';
import YearlyLightSensorPanel from './panels/yearlyLightSensorPanel';
import DailyLightSensorPanel from './panels/dailyLightSensorPanel';
import MainToolBar from './mainToolBar';
import Spinner from './components/spinner';
import StickyNotePanel from './panels/stickyNotePanel';
import InfoPanel from './panels/infoPanel';
import InstructionPanel from './panels/instructionPanel';
import PvModelPanel from './panels/pvModelPanel';
import YearlyPvYieldPanel from './panels/yearlyPvYieldPanel';
import DailyPvYieldPanel from './panels/dailyPvYieldPanel';
import Lights from './lights';
import { Grid } from './grid';
import CompassContainer from './compassContainer';
import { OrthographicCamera, PerspectiveCamera } from '@react-three/drei';
import ErrorPage from './ErrorPage';
import i18n from './i18n/i18n';
import KeyboardEventHandler from 'react-keyboard-event-handler';
import KeyboardListener from './keyboardListener';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloud } from '@fortawesome/free-solid-svg-icons';
import LocalFileManager from './localFileManager';
import AnalysisManager from './analysisManager';

const App = () => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const locale = useStore(Selector.locale);
  const loadWeatherData = useStore(Selector.loadWeatherData);
  const getClosestCity = useStore(Selector.getClosestCity);
  const worldLatitude = useStore(Selector.world.latitude);
  const worldLongitude = useStore(Selector.world.longitude);
  const orthographic = useStore(Selector.viewState.orthographic) ?? false;
  const orthographicChanged = useStore(Selector.orthographicChanged);
  const simulationInProgress = useStore(Selector.simulationInProgress);
  const objectTypeToAdd = useStore(Selector.objectTypeToAdd);
  const loadPvModules = useStore(Selector.loadPvModules);
  const heliodonRadius = useStore(Selector.heliodonRadius);
  const cameraZoom = useStore(Selector.viewState.cameraZoom) ?? 20;
  const cloudFile = useStore(Selector.cloudFile);
  const axes = useStore(Selector.viewState.axes);
  const theme = useStore(Selector.viewState.theme);
  const groundImage = useStore(Selector.viewState.groundImage);
  const showInfoPanel = useStore(Selector.viewState.showInfoPanel);
  const showInstructionPanel = useStore(Selector.viewState.showInstructionPanel);
  const showMapPanel = useStore(Selector.viewState.showMapPanel);
  const showHeliodonPanel = useStore(Selector.viewState.showHeliodonPanel);
  const showStickyNotePanel = useStore(Selector.viewState.showStickyNotePanel);
  const showWeatherPanel = useStore(Selector.viewState.showWeatherPanel);
  const showDailyLightSensorPanel = useStore(Selector.viewState.showDailyLightSensorPanel);
  const showYearlyLightSensorPanel = useStore(Selector.viewState.showYearlyLightSensorPanel);
  const showDailyPvYieldPanel = useStore(Selector.viewState.showDailyPvYieldPanel);
  const showYearlyPvYieldPanel = useStore(Selector.viewState.showYearlyPvYieldPanel);

  const [loading, setLoading] = useState(true);
  const [update, setUpdate] = useState(false);
  const [city, setCity] = useState<string | null>('Boston MA, USA');
  const [pvModelDialogVisible, setPvModelDialogVisible] = useState<boolean>(false);
  const keyName = useRef<string | undefined>(undefined);
  const keyDown = useRef<boolean>(false);
  const keyUp = useRef<boolean>(false);
  const [keyFlag, setKeyFlag] = useState<boolean>(false);

  const orbitControlsRef = useRef<OrbitControls>();
  const canvasRef = useRef<HTMLCanvasElement>();
  const camRef = useRef<Camera>();
  const lang = { lng: language };

  useEffect(() => {
    loadWeatherData();
    loadPvModules();
    setLoading(false);
  }, []);

  useEffect(() => {
    setCity(getClosestCity(worldLatitude, worldLongitude));
  }, [worldLatitude, worldLongitude]);

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.style.cursor = objectTypeToAdd === ObjectType.None ? 'default' : 'crosshair';
    }
  }, [objectTypeToAdd]);

  useEffect(() => {
    setUpdate(!update);
  }, [orthographic]);

  const handleKeyEvent = (key: string, down: boolean, e: KeyboardEvent) => {
    keyName.current = key;
    keyDown.current = down;
    keyUp.current = !down;
    setKeyFlag(!keyFlag);
  };

  const zoomView = (scale: number) => {
    if (orthographic) {
      setCommonStore((state) => {
        state.viewState.cameraZoom = cameraZoom * scale;
      });
    } else {
      if (orbitControlsRef.current) {
        const p = orbitControlsRef.current.object.position;
        const x = p.x * scale;
        const y = p.y * scale;
        const z = p.z * scale;
        orbitControlsRef.current.object.position.set(x, y, z);
        orbitControlsRef.current.update();
        setCommonStore((state) => {
          const v = state.viewState;
          // FIXME: why can't set function be used with a proxy?
          // Using set or copy will result in crash in run time.
          v.cameraPosition.x = x;
          v.cameraPosition.y = y;
          v.cameraPosition.z = z;
        });
      }
    }
  };

  const resetView = () => {
    if (orbitControlsRef.current) {
      // I don't know why the reset method results in a black screen.
      // So we are resetting it here to a predictable position.
      const z = Math.min(50, heliodonRadius * 4);
      orbitControlsRef.current.object.position.set(z, z, z);
      orbitControlsRef.current.target.set(0, 0, 0);
      orbitControlsRef.current.update();
      setCommonStore((state) => {
        // FIXME: why can't set function be used with a proxy?
        // Using set or copy will result in crash in run time.
        const v = state.viewState;
        v.cameraPosition.x = z;
        v.cameraPosition.y = z;
        v.cameraPosition.z = z;
        v.panCenter.x = 0;
        v.panCenter.y = 0;
        v.panCenter.z = 0;
      });
    }
  };

  const set2DView = (selected: boolean) => {
    setCommonStore((state) => {
      state.viewState.orthographic = selected;
      state.viewState.enableRotate = !selected;
      state.orthographicChanged = true;
      if (selected) {
        // save camera position and pan center before switching to 2D
        state.savedCameraPosition.x = state.viewState.cameraPosition.x;
        state.savedCameraPosition.y = state.viewState.cameraPosition.y;
        state.savedCameraPosition.z = state.viewState.cameraPosition.z;
        state.savedPanCenter.x = state.viewState.panCenter.x;
        state.savedPanCenter.y = state.viewState.panCenter.y;
        state.savedPanCenter.z = state.viewState.panCenter.z;
        state.viewState.cameraPosition.x = 0;
        state.viewState.cameraPosition.y = 0;
        state.viewState.cameraPosition.z = Math.min(50, heliodonRadius * 4);
        state.viewState.panCenter.x = 0;
        state.viewState.panCenter.y = 0;
        state.viewState.panCenter.z = 0;
      } else {
        // restore camera position and pan center
        state.viewState.cameraPosition.x = state.savedCameraPosition.x;
        state.viewState.cameraPosition.y = state.savedCameraPosition.y;
        state.viewState.cameraPosition.z = state.savedCameraPosition.z;
        state.viewState.panCenter.x = state.savedPanCenter.x;
        state.viewState.panCenter.y = state.savedPanCenter.y;
        state.viewState.panCenter.z = state.savedPanCenter.z;
      }
    });
  };

  console.log('x');

  return (
    <ConfigProvider locale={locale}>
      <ErrorPage>
        <div className="App">
          {(loading || simulationInProgress) && <Spinner />}
          <div
            style={{
              backgroundColor: 'lightblue',
              height: '72px',
              paddingTop: '10px',
              textAlign: 'start',
              userSelect: 'none',
              fontSize: '30px',
            }}
          >
            <span
              style={{
                marginLeft: '120px',
                verticalAlign: 'middle',
                cursor: 'pointer',
                userSelect: 'none',
              }}
              title={i18n.t('tooltip.visitAladdinHomePage', lang)}
              onClick={visitHomepage}
            >
              {i18n.t('name.Aladdin', lang)}
            </span>
            {cloudFile && (
              <span
                style={{
                  marginLeft: '20px',
                  fontSize: '14px',
                  verticalAlign: 'center',
                  userSelect: 'none',
                }}
                title={i18n.t('toolbar.CloudFile', lang)}
              >
                <FontAwesomeIcon
                  title={i18n.t('toolbar.CloudFile', lang)}
                  icon={faCloud}
                  size={'lg'}
                  color={'#888888'}
                  style={{ paddingRight: '8px' }}
                />
                {cloudFile}
              </span>
            )}
          </div>
          <div
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              zIndex: 999,
              fontSize: '12px',
              userSelect: 'none',
              color: 'antiquewhite',
            }}
          >
            <img
              alt="IFI Logo"
              src={ifiLogo}
              height="40px"
              style={{ verticalAlign: 'bottom', cursor: 'pointer' }}
              title={i18n.t('tooltip.gotoIFI', lang)}
              onClick={visitIFI}
            />
            &nbsp;&nbsp; &copy;{new Date().getFullYear()} {i18n.t('name.IFI', lang)}
            &nbsp;{i18n.t('word.Version', lang) + ' ' + VERSION + '. ' + i18n.t('word.AllRightsReserved', lang) + '. '}
          </div>
          <LocalFileManager />
          <AnalysisManager />
          <MainMenu canvas={canvasRef.current} set2DView={set2DView} resetView={resetView} zoomView={zoomView} />
          <MainToolBar />
          <Modal
            width={600}
            visible={pvModelDialogVisible}
            title={i18n.t('pvModelPanel.SolarPanelSpecs', lang)}
            onOk={() => {
              setPvModelDialogVisible(false);
            }}
            onCancel={() => {
              setPvModelDialogVisible(false);
            }}
          >
            <PvModelPanel />
          </Modal>
          {showMapPanel && <MapPanel />}
          {showHeliodonPanel && <HeliodonPanel />}
          {showStickyNotePanel && <StickyNotePanel />}
          {showInfoPanel && <InfoPanel city={city} />}
          {showInstructionPanel && <InstructionPanel />}
          {showWeatherPanel && (
            <WeatherPanel city={city} graphs={[GraphDataType.MonthlyTemperatures, GraphDataType.SunshineHours]} />
          )}
          {showYearlyLightSensorPanel && <YearlyLightSensorPanel city={city} />}
          {showDailyLightSensorPanel && <DailyLightSensorPanel city={city} />}
          {showYearlyPvYieldPanel && <YearlyPvYieldPanel city={city} />}
          {showDailyPvYieldPanel && <DailyPvYieldPanel city={city} />}
          <DropdownContextMenu setPvDialogVisible={setPvModelDialogVisible}>
            <div>
              <Canvas
                orthographic={orthographic}
                camera={{ zoom: orthographic ? cameraZoom : 1, fov: DEFAULT_FOV, far: DEFAULT_FAR }}
                shadows={true}
                gl={{ preserveDrawingBuffer: true }}
                frameloop={'demand'}
                style={{ height: 'calc(100vh - 70px)', backgroundColor: 'black' }}
              >
                {/*
            The following is for switching camera between the orthographic and perspective modes from the menu.
            For some reason, the above code does not trigger the camera to change unless we reload the entire page,
             which is not desirable. So we have to do it this way.
             */}
                {orthographicChanged &&
                  (orthographic ? (
                    <OrthographicCamera
                      zoom={cameraZoom}
                      position={[0, 0, Math.min(50, heliodonRadius * 4)]}
                      makeDefault={true}
                      ref={camRef}
                    />
                  ) : (
                    <PerspectiveCamera zoom={1} fov={DEFAULT_FOV} far={DEFAULT_FAR} makeDefault={true} ref={camRef} />
                  ))}
                <OrbitController
                  orbitControlsRef={orbitControlsRef}
                  canvasRef={canvasRef}
                  currentCamera={camRef.current}
                />
                <Lights />

                <ElementsRenderer />
                <Heliodon />
                {axes && <Axes />}

                <SensorSimulation city={city} />
                <SolarPanelSimulation city={city} />
                <Suspense fallback={null}>
                  <Ground />
                  <Grid />
                  {groundImage && <GroundImage />}
                  {/* <Obj/> */}
                </Suspense>
                <Suspense fallback={null}>
                  <Sky theme={theme} />
                </Suspense>
              </Canvas>
              <KeyboardListener
                keyFlag={keyFlag}
                keyName={keyName.current}
                keyDown={keyDown.current}
                keyUp={keyUp.current}
                canvas={canvasRef.current}
                set2DView={set2DView}
                resetView={resetView}
                zoomView={zoomView}
              />
              <KeyboardEventHandler
                handleKeys={[
                  'left',
                  'up',
                  'right',
                  'down',
                  'ctrl+o',
                  'meta+o',
                  'ctrl+s',
                  'meta+s',
                  'ctrl+c',
                  'meta+c',
                  'ctrl+x',
                  'meta+x',
                  'ctrl+v',
                  'meta+v',
                  'ctrl+[',
                  'meta+[',
                  'ctrl+]',
                  'meta+]',
                  'ctrl+z',
                  'meta+z',
                  'ctrl+y',
                  'meta+y',
                  'shift',
                  'esc',
                ]}
                handleEventType={'keydown'}
                onKeyEvent={(key, e) => {
                  e.preventDefault();
                  handleKeyEvent(key, true, e);
                }}
              />
              <KeyboardEventHandler
                handleKeys={[
                  'ctrl+v', // we want the paste action to be fired only when the key is up, but we also need to add
                  'meta+v', // these keyboard shortcuts to the keydown handler so that the browser's default can be prevented
                  'ctrl+z',
                  'meta+z',
                  'ctrl+y',
                  'meta+y',
                  'ctrl+home',
                  'meta+home',
                  'ctrl+shift+s',
                  'meta+shift+s',
                  'delete',
                  'f2',
                  'f4',
                  'shift',
                ]}
                handleEventType={'keyup'}
                onKeyEvent={(key, e) => {
                  e.preventDefault();
                  handleKeyEvent(key, false, e);
                }}
              />
            </div>
          </DropdownContextMenu>
          {!orthographic && <CompassContainer />}
          <AcceptCookie />
        </div>
      </ErrorPage>
    </ConfigProvider>
  );
};

export default App;
