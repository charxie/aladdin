/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { ChartType, DatumEntry, GraphDataType, ObjectType } from '../types';
import moment from 'moment';
import ReactDraggable, { DraggableEventHandler } from 'react-draggable';
import { Button, Space } from 'antd';
import { ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import { screenshot, showInfo } from '../helpers';
import i18n from '../i18n/i18n';
import { Rectangle } from '../models/Rectangle';
import { FLOATING_WINDOW_OPACITY } from '../constants';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import { useDailyEnergySorter } from '../analysis/energyHooks';
import BuildinEnergyGraph from '../components/buildingEnergyGraph';

const Container = styled.div`
  position: fixed;
  top: 80px;
  right: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  z-index: 9;
`;

const ColumnWrapper = styled.div`
  background-color: #f8f8f8;
  position: absolute;
  right: 0;
  top: 0;
  min-width: 400px;
  max-width: 800px;
  min-height: 200px;
  max-height: 600px;
  padding-bottom: 10px;
  border: 2px solid gainsboro;
  border-radius: 10px 10px 10px 10px;
  display: flex;
  flex-direction: column;
  overflow-x: auto;
  overflow-y: auto;
  resize: both;
  direction: rtl;
`;

const Header = styled.div`
  border-radius: 10px 10px 0 0;
  width: 100%;
  height: 24px;
  padding: 10px;
  background-color: #e8e8e8;
  color: #888;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;

  svg.icon {
    height: 16px;
    width: 16px;
    padding: 8px;
    fill: #666;
  }
`;

export interface DailyBuildingEnergyPanelProps {
  city: string | null;
}

const DailyBuildingEnergyPanel = ({ city }: DailyBuildingEnergyPanelProps) => {
  const language = useStore(Selector.language);
  const loggable = useStore(Selector.loggable);
  const opacity = useStore(Selector.floatingWindowOpacity) ?? FLOATING_WINDOW_OPACITY;
  const setCommonStore = useStore(Selector.set);
  const getWeather = useStore(Selector.getWeather);
  const now = new Date(useStore(Selector.world.date));
  const hourlyHeatExchangeArrayMap = usePrimitiveStore(Selector.hourlyHeatExchangeArrayMap);
  const hourlySolarHeatGainArrayMap = usePrimitiveStore(Selector.hourlySolarHeatGainArrayMap);
  const hourlySolarPanelOutputArrayMap = usePrimitiveStore(Selector.hourlySolarPanelOutputArrayMap);
  const panelRect = useStore(Selector.viewState.dailyBuildingEnergyPanelRect);
  const countElementsByType = useStore(Selector.countElementsByType);
  const flagOfDailySimulation = usePrimitiveStore(Selector.flagOfDailySimulation);

  // nodeRef is to suppress ReactDOM.findDOMNode() deprecation warning. See:
  // https://github.com/react-grid-layout/react-draggable/blob/v4.4.2/lib/DraggableCore.js#L159-L171
  const nodeRef = React.useRef(null);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver>();
  const wOffset = wrapperRef.current ? wrapperRef.current.clientWidth + 40 : panelRect ? panelRect.width + 40 : 640;
  const hOffset = wrapperRef.current ? wrapperRef.current.clientHeight + 100 : panelRect ? panelRect.height + 100 : 460;
  const [curPosition, setCurPosition] = useState({
    x: panelRect ? Math.max(panelRect.x, wOffset - window.innerWidth) : 0,
    y: panelRect ? Math.min(panelRect.y, window.innerHeight - hOffset) : 0,
  });
  const [data, setData] = useState<DatumEntry[]>([]);
  const [heaterSum, setHeaterSum] = useState(0);
  const [acSum, setAcSum] = useState(0);
  const [solarPanelSum, setSolarPanelSum] = useState(0);
  const [netSum, setNetSum] = useState(0);
  const [labels, setLabels] = useState(['Heater', 'AC', 'Net']);

  const lang = { lng: language };
  const weather = getWeather(city ?? 'Boston MA, USA');
  const tooltipHeaterBreakdown = useRef<string>('');
  const tooltipAcBreakdown = useRef<string>('');
  const tooltipSolarPanelBreakdown = useRef<string>('');
  const tooltipNetBreakdown = useRef<string>('');

  const { sum, sumHeaterMap, sumAcMap, sumSolarPanelMap, dataLabels } = useDailyEnergySorter(
    now,
    weather,
    hourlyHeatExchangeArrayMap,
    hourlySolarHeatGainArrayMap,
    hourlySolarPanelOutputArrayMap,
  );

  useEffect(() => {
    setData(sum);
    let sumHeater = 0;
    let sumAc = 0;
    let sumSolarPanel = 0;
    const multiple = sumHeaterMap.size > 1;
    if (sumHeaterMap) {
      tooltipHeaterBreakdown.current = '';
      for (const key of sumHeaterMap.keys()) {
        const val = sumHeaterMap.get(key);
        if (val) {
          sumHeater += val;
          if (multiple) {
            tooltipHeaterBreakdown.current += key + ': ' + val.toFixed(2) + ' ' + i18n.t('word.kWh', lang) + '\n';
          }
        }
      }
    }
    if (sumAcMap) {
      tooltipAcBreakdown.current = '';
      for (const key of sumAcMap.keys()) {
        const val = sumAcMap.get(key);
        if (val) {
          sumAc += val;
          if (multiple) {
            tooltipAcBreakdown.current += key + ': ' + val.toFixed(2) + ' ' + i18n.t('word.kWh', lang) + '\n';
          }
        }
      }
    }
    if (sumSolarPanelMap) {
      tooltipSolarPanelBreakdown.current = '';
      for (const key of sumSolarPanelMap.keys()) {
        const val = sumSolarPanelMap.get(key);
        if (val) {
          sumSolarPanel += val;
          if (multiple) {
            tooltipSolarPanelBreakdown.current += key + ': ' + val.toFixed(2) + ' ' + i18n.t('word.kWh', lang) + '\n';
          }
        }
      }
    }
    if (sumHeaterMap && sumAcMap && sumSolarPanelMap) {
      tooltipNetBreakdown.current = '';
      for (const key of sumHeaterMap.keys()) {
        let net = 0;
        const heater = sumHeaterMap.get(key);
        const ac = sumAcMap.get(key);
        const solarPanel = sumSolarPanelMap.get(key);
        if (heater) net += heater;
        if (ac) net += ac;
        if (solarPanel) net -= solarPanel;
        if (multiple) {
          tooltipNetBreakdown.current += key + ': ' + net.toFixed(2) + ' ' + i18n.t('word.kWh', lang) + '\n';
        }
      }
    }
    setHeaterSum(sumHeater);
    setAcSum(sumAc);
    setSolarPanelSum(sumSolarPanel);
    setNetSum(sumHeater + sumAc - sumSolarPanel);
    const count = countElementsByType(ObjectType.Foundation);
    if (count > 1) {
      const l = [];
      for (let index = 0; index < count; index++) {
        const id = dataLabels[index] ?? index + 1;
        l.push('Heater ' + id, 'AC ' + id, 'Solar ' + id, 'Net ' + id);
      }
      setLabels(l);
    } else {
      setLabels(['Heater', 'AC', 'Solar', 'Net']);
    }
  }, [flagOfDailySimulation]);

  useEffect(() => {
    setCurPosition({
      x: Math.max(panelRect?.x, wOffset - window.innerWidth),
      y: Math.min(panelRect?.y, window.innerHeight - hOffset),
    });
  }, [panelRect, wOffset, hOffset]);

  // when the window is resized (the code depends on where the panel is originally anchored in the CSS)
  useEffect(() => {
    const handleWindowResize = () => {
      setCurPosition({
        x: Math.max(panelRect?.x, wOffset - window.innerWidth),
        y: Math.min(panelRect?.y, window.innerHeight - hOffset),
      });
    };
    window.addEventListener('resize', handleWindowResize);
    if (wrapperRef.current) {
      if (!resizeObserverRef.current) {
        resizeObserverRef.current = new ResizeObserver(() => {
          setCommonStore((state) => {
            if (wrapperRef.current) {
              if (!state.viewState.dailyBuildingEnergyPanelRect) {
                state.viewState.dailyBuildingEnergyPanelRect = new Rectangle(0, 0, 600, 360);
              }
              state.viewState.dailyBuildingEnergyPanelRect.width = wrapperRef.current.offsetWidth;
              state.viewState.dailyBuildingEnergyPanelRect.height = wrapperRef.current.offsetHeight;
            }
          });
        });
      }
      resizeObserverRef.current.observe(wrapperRef.current);
    }
    return () => {
      window.removeEventListener('resize', handleWindowResize);
      resizeObserverRef.current?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelRect, wOffset, hOffset]);

  const onDrag: DraggableEventHandler = (e, ui) => {
    setCurPosition({
      x: Math.max(ui.x, wOffset - window.innerWidth),
      y: Math.min(ui.y, window.innerHeight - hOffset),
    });
  };

  const onDragEnd: DraggableEventHandler = (e, ui) => {
    setCommonStore((state) => {
      if (!state.viewState.dailyBuildingEnergyPanelRect) {
        state.viewState.dailyBuildingEnergyPanelRect = new Rectangle(0, 0, 600, 360);
      }
      state.viewState.dailyBuildingEnergyPanelRect.x = Math.max(ui.x, wOffset - window.innerWidth);
      state.viewState.dailyBuildingEnergyPanelRect.y = Math.min(ui.y, window.innerHeight - hOffset);
    });
  };

  const closePanel = () => {
    setCommonStore((state) => {
      state.viewState.showDailyBuildingEnergyPanel = false;
      if (loggable) {
        state.actionInfo = {
          name: 'Close Daily Building Energy Graph',
          timestamp: new Date().getTime(),
        };
      }
    });
  };

  const labelX = i18n.t('word.Hour', lang);
  const labelY = i18n.t('word.Energy', lang);

  return (
    <ReactDraggable
      nodeRef={nodeRef}
      handle={'.handle'}
      bounds={'parent'}
      axis="both"
      position={curPosition}
      onDrag={onDrag}
      onStop={onDragEnd}
    >
      <Container ref={nodeRef}>
        <ColumnWrapper
          ref={wrapperRef}
          style={{
            opacity: opacity,
            width: (panelRect ? panelRect.width : 600) + 'px',
            height: (panelRect ? panelRect.height : 360) + 'px',
          }}
        >
          <Header className="handle" style={{ direction: 'ltr' }}>
            <span>
              {i18n.t('buildingEnergyPanel.DailyBuildingEnergy', lang) + ': '}
              <label style={{ fontSize: '10px' }}>
                {i18n.t('sensorPanel.WeatherDataFrom', lang) + ' ' + city + ' | ' + moment(now).format('MM/DD')}
              </label>
            </span>
            <span
              style={{ cursor: 'pointer' }}
              onTouchStart={() => {
                closePanel();
              }}
              onMouseDown={() => {
                closePanel();
              }}
            >
              {i18n.t('word.Close', lang)}
            </span>
          </Header>
          <BuildinEnergyGraph
            type={GraphDataType.DailyBuildingEnergy}
            chartType={ChartType.Line}
            dataSource={data}
            labels={labels}
            height={100}
            dataKeyAxisX={'Hour'}
            labelX={labelX}
            labelY={labelY}
            unitY={i18n.t('word.kWh', lang)}
            yMin={0}
            curveType={'linear'}
            fractionDigits={2}
            symbolCount={24}
            referenceX={now.getHours()}
          />
          <Space style={{ alignSelf: 'center', direction: 'ltr' }}>
            <Space
              title={tooltipHeaterBreakdown.current}
              style={{ cursor: tooltipHeaterBreakdown.current === '' ? 'default' : 'help' }}
            >
              {i18n.t('buildingEnergyPanel.Heater', lang) + ': ' + heaterSum.toFixed(1)}
            </Space>
            <Space
              title={tooltipAcBreakdown.current}
              style={{ cursor: tooltipAcBreakdown.current === '' ? 'default' : 'help' }}
            >
              {i18n.t('buildingEnergyPanel.AC', lang) + ': ' + acSum.toFixed(1)}
            </Space>
            <Space
              title={tooltipSolarPanelBreakdown.current}
              style={{ cursor: tooltipSolarPanelBreakdown.current === '' ? 'default' : 'help' }}
            >
              {i18n.t('buildingEnergyPanel.SolarPanel', lang) + ': ' + solarPanelSum.toFixed(1)}
            </Space>
            <Space
              title={tooltipNetBreakdown.current}
              style={{ cursor: tooltipNetBreakdown.current === '' ? 'default' : 'help' }}
            >
              {i18n.t('buildingEnergyPanel.Net', lang) + ': ' + netSum.toFixed(1)}
            </Space>
            <Button
              type="default"
              icon={<ReloadOutlined />}
              title={i18n.t('word.Update', lang)}
              onClick={() => {
                const foundationCount = countElementsByType(ObjectType.Foundation);
                if (foundationCount === 0) {
                  showInfo(i18n.t('analysisManager.NoBuildingForAnalysis', lang));
                  return;
                }
                showInfo(i18n.t('message.SimulationStarted', lang));
                // give it 0.1 second for the info to show up
                setTimeout(() => {
                  setCommonStore((state) => {
                    state.runDailyThermalSimulation = true;
                    state.pauseDailyThermalSimulation = false;
                    state.simulationInProgress = true;
                    if (loggable) {
                      state.actionInfo = { name: 'Run Daily Thermal Simulation', timestamp: new Date().getTime() };
                    }
                  });
                }, 100);
              }}
            />
            <Button
              type="default"
              icon={<SaveOutlined />}
              title={i18n.t('word.SaveAsImage', lang)}
              onClick={() => {
                screenshot('line-graph-' + labelX + '-' + labelY, 'daily-building-energy', {}).then(() => {
                  showInfo(i18n.t('message.ScreenshotSaved', lang));
                  if (loggable) {
                    setCommonStore((state) => {
                      state.actionInfo = {
                        name: 'Take Screenshot of Daily Building Energy Graph',
                        timestamp: new Date().getTime(),
                      };
                    });
                  }
                });
              }}
            />
          </Space>
        </ColumnWrapper>
      </Container>
    </ReactDraggable>
  );
};

export default React.memo(DailyBuildingEnergyPanel);
