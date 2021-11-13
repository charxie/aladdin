/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useState } from 'react';
import { Checkbox, Input, InputNumber, Menu, Select, Space } from 'antd';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { Vector3 } from 'three';
import { SolarPanelModel } from '../../../models/SolarPanelModel';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { ObjectType, Orientation, TrackerType } from '../../../types';
import { Util } from '../../../Util';
import { Copy, Cut } from '../menuItems';
import i18n from '../../../i18n/i18n';

const { Option } = Select;

export const SolarPanelMenu = ({ setPvDialogVisible }: { setPvDialogVisible: (visible: boolean) => void }) => {
  const language = useStore(Selector.language);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const setElementSize = useStore(Selector.setElementSize);
  const updateElementById = useStore(Selector.updateElementById);
  const getPvModule = useStore(Selector.getPvModule);

  const [solarPanel, setSolarPanel] = useState<SolarPanelModel>();
  const [dx, setDx] = useState<number>(0);
  const [dy, setDy] = useState<number>(0);
  const [panelNormal, setPanelNormal] = useState<Vector3>();
  const [labelText, setLabelText] = useState<string>('');
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const element = getSelectedElement();
  const lang = { lng: language };

  useEffect(() => {
    if (element && element.type === ObjectType.SolarPanel) {
      const panel = element as SolarPanelModel;
      const pvModel = getPvModule(panel.pvModelName) ?? getPvModule('SPR-X21-335-BLK');
      setSolarPanel(panel);
      setDx(panel.orientation === Orientation.portrait ? pvModel.width : pvModel.length);
      setDy(panel.orientation === Orientation.portrait ? pvModel.length : pvModel.width);
      setPanelNormal(new Vector3().fromArray(element.normal));
      setLabelText(element.label ?? '');
    }
  }, [element]);

  const showElementLabel = (e: CheckboxChangeEvent) => {
    if (solarPanel) {
      updateElementById(solarPanel.id, { showLabel: e.target.checked });
      setUpdateFlag(!updateFlag);
    }
  };

  const updateElementLabelText = () => {
    if (solarPanel) {
      updateElementById(solarPanel.id, { label: labelText });
      setUpdateFlag(!updateFlag);
    }
  };

  return (
    <>
      <Copy paddingLeft={'40px'} />
      <Cut paddingLeft={'40px'} />
      {solarPanel && (
        <>
          <Menu.Item
            key={'solar-panel-change'}
            onClick={() => {
              setPvDialogVisible(true);
            }}
            style={{ paddingLeft: '40px' }}
          >
            {i18n.t('solarPanelMenu.ChangePvModel', lang)} ({solarPanel.pvModelName})...
          </Menu.Item>
          <Menu>
            <Menu.Item key={'solar-panel-orientation'} style={{ paddingLeft: '40px' }}>
              <Space style={{ width: '150px' }}>{i18n.t('solarPanelMenu.Orientation', lang) + ':'}</Space>
              <Select
                style={{ width: '120px' }}
                value={solarPanel.orientation}
                onChange={(value) => {
                  if (solarPanel) {
                    const pvModel = getPvModule(solarPanel.pvModelName);
                    if (value === Orientation.portrait) {
                      // calculate the current x-y layout
                      const nx = Math.max(1, Math.round(solarPanel.lx / pvModel.width));
                      const ny = Math.max(1, Math.round(solarPanel.ly / pvModel.length));
                      setElementSize(solarPanel.id, nx * pvModel.width, ny * pvModel.length);
                    } else {
                      // calculate the current x-y layout
                      const nx = Math.max(1, Math.round(solarPanel.lx / pvModel.length));
                      const ny = Math.max(1, Math.round(solarPanel.ly / pvModel.width));
                      setElementSize(solarPanel.id, nx * pvModel.length, ny * pvModel.width);
                    }
                    updateElementById(solarPanel.id, { orientation: value });
                    setUpdateFlag(!updateFlag);
                  }
                }}
              >
                <Option key={Orientation.portrait} value={Orientation.portrait}>
                  {i18n.t('solarPanelMenu.Portrait', lang)}
                </Option>
                )
                <Option key={Orientation.landscape} value={Orientation.landscape}>
                  {i18n.t('solarPanelMenu.Landscape', lang)}
                </Option>
                )
              </Select>
            </Menu.Item>
            <Menu.Item key={'solar-panel-width'} style={{ paddingLeft: '40px' }}>
              <Space style={{ width: '150px' }}>
                {i18n.t('word.Width', lang) +
                  ' (' +
                  Math.round(solarPanel.lx / dx) +
                  ' ' +
                  i18n.t('solarPanelMenu.Panels', lang) +
                  '):'}
              </Space>
              <InputNumber
                min={dx}
                max={100 * dx}
                step={dx}
                style={{ width: 120 }}
                precision={2}
                value={solarPanel.lx}
                formatter={(a) => Number(a).toFixed(2) + ' m'}
                onChange={(value) => {
                  if (solarPanel) {
                    updateElementById(solarPanel.id, { lx: value ?? 1 });
                    setUpdateFlag(!updateFlag);
                  }
                }}
              />
            </Menu.Item>
            <Menu.Item key={'solar-panel-length'} style={{ paddingLeft: '40px' }}>
              <Space style={{ width: '150px' }}>
                {i18n.t('word.Length', lang) +
                  ' (' +
                  Math.round(solarPanel.ly / dy) +
                  ' ' +
                  i18n.t('solarPanelMenu.Panels', lang) +
                  '):'}
              </Space>
              <InputNumber
                min={dy}
                max={100 * dy}
                step={dy}
                style={{ width: 120 }}
                precision={2}
                value={solarPanel.ly}
                formatter={(a) => Number(a).toFixed(2) + ' m'}
                onChange={(value) => {
                  if (solarPanel) {
                    updateElementById(solarPanel.id, { ly: value ?? 2 });
                    setUpdateFlag(!updateFlag);
                  }
                }}
              />
            </Menu.Item>
            {panelNormal && Util.isSame(panelNormal, Util.UNIT_VECTOR_POS_Z) && (
              <>
                <Menu.Item key={'solar-panel-tilt-angle'} style={{ paddingLeft: '40px' }}>
                  <Space style={{ width: '150px' }}>{i18n.t('solarPanelMenu.TiltAngle', lang) + ':'}</Space>
                  <InputNumber
                    min={-90}
                    max={90}
                    style={{ width: 120 }}
                    precision={1}
                    value={Util.toDegrees(solarPanel.tiltAngle)}
                    step={1}
                    formatter={(a) => Number(a).toFixed(1) + '°'}
                    onChange={(value) => {
                      if (solarPanel) {
                        updateElementById(solarPanel.id, { tiltAngle: Util.toRadians(value ?? 0) });
                        setUpdateFlag(!updateFlag);
                      }
                    }}
                  />
                </Menu.Item>
                <Menu.Item key={'solar-panel-relative-azimuth'} style={{ paddingLeft: '40px' }}>
                  <Space style={{ width: '150px' }}>{i18n.t('solarPanelMenu.RelativeAzimuth', lang) + ':'}</Space>
                  <InputNumber
                    min={-180}
                    max={180}
                    style={{ width: 120 }}
                    precision={1}
                    value={Util.toDegrees(solarPanel.relativeAzimuth)}
                    step={1}
                    formatter={(a) => Number(a).toFixed(1) + '°'}
                    onChange={(value) => {
                      if (solarPanel) {
                        updateElementById(solarPanel.id, {
                          relativeAzimuth: Util.toRadians(value ?? 0),
                        });
                        setUpdateFlag(!updateFlag);
                      }
                    }}
                  />
                </Menu.Item>
                <Menu.Item key={'solar-panel-tracker'} style={{ paddingLeft: '40px' }}>
                  <Space style={{ width: '150px' }}>{i18n.t('solarPanelMenu.Tracker', lang) + ':'}</Space>
                  <Select
                    style={{ width: '120px' }}
                    value={solarPanel.trackerType}
                    onChange={(value) => {
                      if (solarPanel) {
                        updateElementById(solarPanel.id, { trackerType: value });
                        setUpdateFlag(!updateFlag);
                      }
                    }}
                  >
                    <Option key={'NONE'} value={TrackerType.NO_TRACKER} title={'No tracker'}>
                      None
                    </Option>
                    )
                    <Option
                      key={'HSAT'}
                      value={TrackerType.HORIZONTAL_SINGLE_AXIS_TRACKER}
                      title={'Horizontal single axis tracker'}
                    >
                      HSAT
                    </Option>
                    )
                    <Option
                      key={'VSAT'}
                      value={TrackerType.VERTICAL_SINGLE_AXIS_TRACKER}
                      title={'Vertical single axis tracker'}
                    >
                      VSAT
                    </Option>
                    )
                    <Option
                      key={'AADAT'}
                      value={TrackerType.ALTAZIMUTH_DUAL_AXIS_TRACKER}
                      title={'Altazimuth single axis tracker'}
                    >
                      AADAT
                    </Option>
                    )
                  </Select>
                </Menu.Item>
                <Menu.Item key={'solar-panel-pole-height'} style={{ paddingLeft: '40px' }}>
                  <Space style={{ width: '150px' }}>{i18n.t('solarPanelMenu.PoleHeight', lang) + ':'}</Space>
                  <InputNumber
                    min={0}
                    max={5}
                    style={{ width: 120 }}
                    step={0.1}
                    precision={1}
                    value={solarPanel.poleHeight}
                    formatter={(a) => Number(a).toFixed(1) + ' m'}
                    onChange={(e) => {
                      if (solarPanel) {
                        updateElementById(solarPanel.id, { poleHeight: e });
                        setUpdateFlag(!updateFlag);
                      }
                    }}
                  />
                </Menu.Item>
                <Menu.Item key={'solar-panel-pole-spacing'} style={{ paddingLeft: '40px' }}>
                  <Space style={{ width: '150px' }}>{i18n.t('solarPanelMenu.PoleSpacing', lang) + ':'}</Space>
                  <InputNumber
                    min={2}
                    max={10}
                    step={1}
                    style={{ width: 120 }}
                    precision={0}
                    value={solarPanel.poleSpacing}
                    formatter={(a) => Number(a).toFixed(0) + ' m'}
                    onChange={(value) => {
                      if (solarPanel) {
                        updateElementById(solarPanel.id, { poleSpacing: value ?? 1 });
                        setUpdateFlag(!updateFlag);
                      }
                    }}
                  />
                </Menu.Item>
              </>
            )}

            <Menu.Item key={'solar-panel-draw-sun-beam'}>
              <Checkbox
                checked={!!solarPanel?.drawSunBeam}
                onChange={(e) => {
                  if (solarPanel) {
                    updateElementById(solarPanel.id, { drawSunBeam: e.target.checked });
                    setUpdateFlag(!updateFlag);
                  }
                }}
              >
                {i18n.t('solarPanelMenu.DrawSunBeam', lang)}
              </Checkbox>
            </Menu.Item>
            <Menu.Item key={'solar-panel-show-label'}>
              <Checkbox checked={!!solarPanel?.showLabel} onChange={showElementLabel}>
                {i18n.t('solarPanelMenu.KeepShowingLabel', lang)}
              </Checkbox>
            </Menu.Item>
            <Menu.Item key={'solar-panel-label-text'} style={{ paddingLeft: '40px' }}>
              <Input
                addonBefore={i18n.t('solarPanelMenu.Label', lang) + ':'}
                value={labelText}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLabelText(e.target.value)}
                onPressEnter={updateElementLabelText}
                onBlur={updateElementLabelText}
              />
            </Menu.Item>
          </Menu>
        </>
      )}
    </>
  );
};
