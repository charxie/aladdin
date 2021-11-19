/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useState } from 'react';
import { Checkbox, Input, InputNumber, Menu, Space } from 'antd';
import { Vector3 } from 'three';
import { SolarPanelModel } from '../../../models/SolarPanelModel';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { ObjectType } from '../../../types';
import { Util } from '../../../Util';
import { Copy, Cut } from '../menuItems';
import i18n from '../../../i18n/i18n';
import { UndoableCheck } from '../../../undo/UndoableCheck';
import { UndoableChange } from '../../../undo/UndoableChange';
import PvModelSelection from './pvModelSelection';
import SolarPanelOrientationSelection from './solarPanelOrientationSelection';
import SolarPanelWidthInput from './solarPanelWidthInput';
import SolarPanelLengthInput from './solarPanelLengthInput';
import SolarPanelTiltAngleInput from './solarPanelTiltAngleInput';
import SolarPanelRelativeAzimuthInput from './solarPanelRelativeAzimuthInput';
import SolarPanelTrackerSelection from './solarPanelTrackerSelection';

export const SolarPanelMenu = () => {
  const language = useStore(Selector.language);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const updateElementLabelById = useStore(Selector.updateElementLabelById);
  const updateElementShowLabelById = useStore(Selector.updateElementShowLabelById);
  const updateSolarPanelPoleHeightById = useStore(Selector.updateSolarPanelPoleHeightById);
  const updateSolarPanelPoleSpacingById = useStore(Selector.updateSolarPanelPoleSpacingById);
  const updateSolarPanelDrawSunBeamById = useStore(Selector.updateSolarPanelDrawSunBeamById);
  const addUndoable = useStore(Selector.addUndoable);

  const [solarPanel, setSolarPanel] = useState<SolarPanelModel>();
  const [panelNormal, setPanelNormal] = useState<Vector3>();
  const [labelText, setLabelText] = useState<string>('');
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [pvModelDialogVisible, setPvModelDialogVisible] = useState(false);
  const [orientationDialogVisible, setOrientationDialogVisible] = useState(false);
  const [widthDialogVisible, setWidthDialogVisible] = useState(false);
  const [lengthDialogVisible, setLengthDialogVisible] = useState(false);
  const [tiltDialogVisible, setTiltDialogVisible] = useState(false);
  const [azimuthDialogVisible, setAzimuthDialogVisible] = useState(false);
  const [trackerDialogVisible, setTrackerDialogVisible] = useState(false);
  const element = getSelectedElement();
  const lang = { lng: language };

  useEffect(() => {
    if (element && element.type === ObjectType.SolarPanel) {
      const panel = element as SolarPanelModel;
      setSolarPanel(panel);
      setPanelNormal(new Vector3().fromArray(element.normal));
      setLabelText(element.label ?? '');
    }
  }, [element]);

  const showLabel = (checked: boolean) => {
    if (solarPanel) {
      const undoableCheck = {
        name: 'Show Solar Panel Label',
        timestamp: Date.now(),
        checked: !solarPanel.showLabel,
        undo: () => {
          updateElementShowLabelById(solarPanel.id, !undoableCheck.checked);
        },
        redo: () => {
          updateElementShowLabelById(solarPanel.id, undoableCheck.checked);
        },
      } as UndoableCheck;
      addUndoable(undoableCheck);
      updateElementShowLabelById(solarPanel.id, checked);
      setUpdateFlag(!updateFlag);
    }
  };

  const updateLabelText = () => {
    if (solarPanel) {
      const oldLabel = solarPanel.label;
      const undoableChange = {
        name: 'Set Solar Panel Label',
        timestamp: Date.now(),
        oldValue: oldLabel,
        newValue: labelText,
        undo: () => {
          updateElementLabelById(solarPanel.id, undoableChange.oldValue as string);
        },
        redo: () => {
          updateElementLabelById(solarPanel.id, undoableChange.newValue as string);
        },
      } as UndoableChange;
      addUndoable(undoableChange);
      updateElementLabelById(solarPanel.id, labelText);
      setUpdateFlag(!updateFlag);
    }
  };

  const updatePoleHeight = (value: number) => {
    if (solarPanel) {
      const oldHeight = solarPanel.poleHeight;
      const undoableChange = {
        name: 'Set Solar Panel Pole Height',
        timestamp: Date.now(),
        oldValue: oldHeight,
        newValue: value,
        undo: () => {
          updateSolarPanelPoleHeightById(solarPanel.id, undoableChange.oldValue as number);
        },
        redo: () => {
          updateSolarPanelPoleHeightById(solarPanel.id, undoableChange.newValue as number);
        },
      } as UndoableChange;
      addUndoable(undoableChange);
      updateSolarPanelPoleHeightById(solarPanel.id, value);
      setUpdateFlag(!updateFlag);
    }
  };

  const updatePoleSpacing = (value: number) => {
    if (solarPanel) {
      const oldSpacing = solarPanel.poleSpacing;
      const undoableChange = {
        name: 'Set Solar Panel Pole Spacing',
        timestamp: Date.now(),
        oldValue: oldSpacing,
        newValue: value,
        undo: () => {
          updateSolarPanelPoleSpacingById(solarPanel.id, undoableChange.oldValue as number);
        },
        redo: () => {
          updateSolarPanelPoleSpacingById(solarPanel.id, undoableChange.newValue as number);
        },
      } as UndoableChange;
      addUndoable(undoableChange);
      updateSolarPanelPoleSpacingById(solarPanel.id, value ?? 1);
      setUpdateFlag(!updateFlag);
    }
  };

  const drawSunBeam = (checked: boolean) => {
    if (solarPanel) {
      const undoableCheck = {
        name: 'Show Sun Beam',
        timestamp: Date.now(),
        checked: !solarPanel.drawSunBeam,
        undo: () => {
          updateSolarPanelDrawSunBeamById(solarPanel.id, !undoableCheck.checked);
        },
        redo: () => {
          updateSolarPanelDrawSunBeamById(solarPanel.id, undoableCheck.checked);
        },
      } as UndoableCheck;
      addUndoable(undoableCheck);
      updateSolarPanelDrawSunBeamById(solarPanel.id, checked);
      setUpdateFlag(!updateFlag);
    }
  };

  return (
    <>
      <Copy paddingLeft={'40px'} />
      <Cut paddingLeft={'40px'} />
      {solarPanel && (
        <>
          {/* pv model */}
          <PvModelSelection
            pvModelDialogVisible={pvModelDialogVisible}
            setPvModelDialogVisible={setPvModelDialogVisible}
          />
          <Menu.Item
            key={'solar-panel-change'}
            onClick={() => {
              setPvModelDialogVisible(true);
            }}
            style={{ paddingLeft: '40px' }}
          >
            {i18n.t('solarPanelMenu.ChangePvModel', lang)} ({solarPanel.pvModelName}) ...
          </Menu.Item>

          {/* orientation: landscape or portrait */}
          <SolarPanelOrientationSelection
            orientationDialogVisible={orientationDialogVisible}
            setOrientationDialogVisible={setOrientationDialogVisible}
          />
          <Menu.Item
            key={'solar-panel-orientation'}
            style={{ paddingLeft: '40px', width: '150px' }}
            onClick={() => {
              setOrientationDialogVisible(true);
            }}
          >
            {i18n.t('solarPanelMenu.Orientation', lang)} ...
          </Menu.Item>

          {/* array width */}
          <SolarPanelWidthInput widthDialogVisible={widthDialogVisible} setWidthDialogVisible={setWidthDialogVisible} />
          <Menu.Item
            key={'solar-panel-width'}
            style={{ paddingLeft: '40px' }}
            onClick={() => {
              setWidthDialogVisible(true);
            }}
          >
            {i18n.t('word.Width', lang)} ...
          </Menu.Item>

          {/* array length */}
          <SolarPanelLengthInput
            lengthDialogVisible={lengthDialogVisible}
            setLengthDialogVisible={setLengthDialogVisible}
          />
          <Menu.Item
            key={'solar-panel-length'}
            style={{ paddingLeft: '40px' }}
            onClick={() => {
              setLengthDialogVisible(true);
            }}
          >
            {i18n.t('word.Length', lang)} ...
          </Menu.Item>

          {/* tilt angle */}
          <SolarPanelTiltAngleInput tiltDialogVisible={tiltDialogVisible} setTiltDialogVisible={setTiltDialogVisible} />
          <Menu.Item
            key={'solar-panel-tilt-angle'}
            style={{ paddingLeft: '40px' }}
            onClick={() => {
              setTiltDialogVisible(true);
            }}
          >
            {i18n.t('solarPanelMenu.TiltAngle', lang)} ...
          </Menu.Item>

          {/* relative azimuth to the parent element */}
          <SolarPanelRelativeAzimuthInput
            azimuthDialogVisible={azimuthDialogVisible}
            setAzimuthDialogVisible={setAzimuthDialogVisible}
          />
          <Menu.Item
            key={'solar-panel-relative-azimuth'}
            style={{ paddingLeft: '40px' }}
            onClick={() => {
              setAzimuthDialogVisible(true);
            }}
          >
            {i18n.t('solarPanelMenu.RelativeAzimuth', lang)} ...
          </Menu.Item>

          {/* solar tracker type */}
          <SolarPanelTrackerSelection
            trackerDialogVisible={trackerDialogVisible}
            setTrackerDialogVisible={setTrackerDialogVisible}
          />
          <Menu.Item
            key={'solar-panel-tracker'}
            style={{ paddingLeft: '40px' }}
            onClick={() => {
              setTrackerDialogVisible(true);
            }}
          >
            {i18n.t('solarPanelMenu.Tracker', lang)} ...
          </Menu.Item>

          <Menu>
            {panelNormal && Util.isSame(panelNormal, Util.UNIT_VECTOR_POS_Z) && (
              <>
                {/* pole height */}
                <Menu.Item key={'solar-panel-pole-height'} style={{ paddingLeft: '40px' }}>
                  <Space style={{ width: '150px' }}>
                    {i18n.t('solarPanelMenu.PoleHeight', lang) +
                      ' (' +
                      i18n.t('word.MeterAbbreviation', lang) +
                      ')' +
                      ':'}
                  </Space>
                  <InputNumber
                    min={0}
                    max={5}
                    style={{ width: 120 }}
                    step={0.1}
                    precision={2}
                    value={solarPanel.poleHeight}
                    formatter={(a) => Number(a).toFixed(2)}
                    onChange={(value) => updatePoleHeight(value)}
                  />
                </Menu.Item>

                {/* pole spacing */}
                <Menu.Item key={'solar-panel-pole-spacing'} style={{ paddingLeft: '40px' }}>
                  <Space style={{ width: '150px' }}>
                    {i18n.t('solarPanelMenu.PoleSpacing', lang) +
                      ' (' +
                      i18n.t('word.MeterAbbreviation', lang) +
                      ')' +
                      ':'}
                  </Space>
                  <InputNumber
                    min={1}
                    max={10}
                    step={1}
                    style={{ width: 120 }}
                    precision={2}
                    value={solarPanel.poleSpacing}
                    formatter={(a) => Number(a).toFixed(2)}
                    onChange={(value) => updatePoleSpacing(value)}
                  />
                </Menu.Item>
              </>
            )}

            {/* draw sun beam or not */}
            <Menu.Item key={'solar-panel-draw-sun-beam'}>
              <Checkbox checked={!!solarPanel?.drawSunBeam} onChange={(e) => drawSunBeam(e.target.checked)}>
                {i18n.t('solarPanelMenu.DrawSunBeam', lang)}
              </Checkbox>
            </Menu.Item>

            {/* show label or not */}
            <Menu.Item key={'solar-panel-show-label'}>
              <Checkbox checked={!!solarPanel?.showLabel} onChange={(e) => showLabel(e.target.checked)}>
                {i18n.t('solarPanelMenu.KeepShowingLabel', lang)}
              </Checkbox>
            </Menu.Item>

            {/* label text */}
            <Menu.Item key={'solar-panel-label-text'} style={{ paddingLeft: '40px' }}>
              <Input
                addonBefore={i18n.t('solarPanelMenu.Label', lang) + ':'}
                value={labelText}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLabelText(e.target.value)}
                onPressEnter={updateLabelText}
                onBlur={updateLabelText}
              />
            </Menu.Item>
          </Menu>
        </>
      )}
    </>
  );
};
