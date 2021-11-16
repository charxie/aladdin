/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useState } from 'react';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { SolarPanelModel } from '../models/SolarPanelModel';
import { Row, Select, Col, Input, Radio, Space, RadioChangeEvent, Modal } from 'antd';
import { SolarPanelNominalSize } from '../models/SolarPanelNominalSize';
import { ObjectType, Orientation, Scope, ShadeTolerance } from '../types';
import i18n from '../i18n/i18n';

const { Option } = Select;

const PvModelPanel = () => {
  const language = useStore(Selector.language);
  const updateElementById = useStore(Selector.updateElementById);
  const getElementById = useStore(Selector.getElementById);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const setElementSize = useStore(Selector.setElementSize);
  const pvModules = useStore(Selector.pvModules);
  const getPvModule = useStore(Selector.getPvModule);

  const [prevPvModel, setPrevPvModel] = useState('SPR-X21-335-BLK');
  const [scope, setScope] = useState<Scope>(Scope.OnlyThisObject);
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [panelSizeString, setPanelSizeString] = useState<string>();

  const lang = { lng: language };
  const solarPanel = getSelectedElement() as SolarPanelModel;
  const pvModel = getPvModule(solarPanel.pvModelName) ?? getPvModule('SPR-X21-335-BLK');
  const parentType = getElementById(solarPanel.parentId)?.type;

  useEffect(() => {
    setPanelSizeString(
      pvModel.nominalWidth.toFixed(2) +
        'm×' +
        pvModel.nominalLength.toFixed(2) +
        'm (' +
        pvModel.n +
        '×' +
        pvModel.m +
        ' ' +
        i18n.t('pvModelPanel.Cells', lang) +
        ')',
    );
  }, [pvModel]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setScope(e.target.value);
  };

  const onChangePvModel = (value: string) => {
    if (solarPanel) {
      setPrevPvModel(pvModel.name);
      if (solarPanel.orientation === Orientation.portrait) {
        // calculate the current x-y layout
        const nx = Math.max(1, Math.round(solarPanel.lx / pvModel.width));
        const ny = Math.max(1, Math.round(solarPanel.ly / pvModel.length));
        setElementSize(solarPanel.id, nx * pvModules[value].width, ny * pvModules[value].length);
      } else {
        // calculate the current x-y layout
        const nx = Math.max(1, Math.round(solarPanel.lx / pvModel.length));
        const ny = Math.max(1, Math.round(solarPanel.ly / pvModel.width));
        setElementSize(solarPanel.id, nx * pvModules[value].length, ny * pvModules[value].width);
      }
      updateElementById(solarPanel.id, { pvModelName: pvModules[value].name });
      setUpdateFlag(!updateFlag);
    }
  };

  return (
    <>
      <Row gutter={6} style={{ paddingBottom: '4px' }}>
        <Col className="gutter-row" span={14}>
          {i18n.t('pvModelPanel.Model', lang) + ':'}
        </Col>
        <Col className="gutter-row" span={10}>
          <Select
            defaultValue="Custom"
            style={{ width: '100%' }}
            value={pvModel.name}
            onChange={(value) => onChangePvModel(value)}
          >
            {Object.keys(pvModules).map((key) => (
              <Option key={key} value={key}>
                {key}
              </Option>
            ))}
          </Select>
        </Col>
      </Row>
      <Row gutter={6} style={{ paddingBottom: '4px' }}>
        <Col className="gutter-row" span={14}>
          {i18n.t('pvModelPanel.PanelSize', lang) + ':'}
        </Col>
        <Col className="gutter-row" span={10}>
          <Select
            disabled={true}
            style={{ width: '100%' }}
            value={panelSizeString}
            onChange={(value) => {
              if (solarPanel) {
                // TODO for custom solar panel
              }
            }}
          >
            {SolarPanelNominalSize.instance.nominalStrings.map((key) => (
              <Option key={key} value={key}>
                {key}
              </Option>
            ))}
          </Select>
        </Col>
      </Row>
      <Row gutter={6} style={{ paddingBottom: '4px' }}>
        <Col className="gutter-row" span={14}>
          {i18n.t('pvModelPanel.CellType', lang) + ':'}
        </Col>
        <Col className="gutter-row" span={10}>
          <Select
            disabled={true}
            style={{ width: '100%' }}
            value={pvModel.cellType}
            onChange={(value) => {
              if (solarPanel) {
                // TODO for custom solar panel
              }
            }}
          >
            <Option key={'Monocrystalline'} value={'Monocrystalline'}>
              {i18n.t('pvModelPanel.Monocrystalline', lang)}
            </Option>
            )
            <Option key={'Polycrystalline'} value={'Polycrystalline'}>
              {i18n.t('pvModelPanel.Polycrystalline', lang)}
            </Option>
            )
            <Option key={'Thin Film'} value={'Thin Film'}>
              {i18n.t('pvModelPanel.ThinFilm', lang)}
            </Option>
            )
          </Select>
        </Col>
      </Row>
      <Row gutter={6} style={{ paddingBottom: '4px' }}>
        <Col className="gutter-row" span={14}>
          {i18n.t('word.Color', lang) + ':'}
        </Col>
        <Col className="gutter-row" span={10}>
          <Select
            disabled={true}
            style={{ width: '100%' }}
            value={pvModel.color}
            onChange={(value) => {
              if (solarPanel) {
                // TODO for custom solar panel
              }
            }}
          >
            <Option key={'Black'} value={'Black'}>
              {i18n.t('pvModelPanel.Black', lang)}
            </Option>
            )
            <Option key={'Blue'} value={'Blue'}>
              {i18n.t('pvModelPanel.Blue', lang)}
            </Option>
            )
          </Select>
        </Col>
      </Row>
      <Row gutter={6} style={{ paddingBottom: '4px' }}>
        <Col className="gutter-row" span={14}>
          {i18n.t('pvModelPanel.SolarCellEfficiency', lang) + ' (%):'}
        </Col>
        <Col className="gutter-row" span={10}>
          <Input
            disabled={true}
            style={{ width: '100%' }}
            value={100 * pvModel.efficiency}
            onChange={(value) => {
              if (solarPanel) {
                // TODO for custom solar panel
              }
            }}
          />
        </Col>
      </Row>
      <Row gutter={6} style={{ paddingBottom: '4px' }}>
        <Col className="gutter-row" span={14}>
          {i18n.t('pvModelPanel.NominalOperatingCellTemperature', lang) + ' (°C):'}
        </Col>
        <Col className="gutter-row" span={10}>
          <Input
            disabled={true}
            style={{ width: '100%' }}
            value={pvModel.noct}
            onChange={(value) => {
              if (solarPanel) {
                // TODO for custom solar panel
              }
            }}
          />
        </Col>
      </Row>
      <Row gutter={6} style={{ paddingBottom: '4px' }}>
        <Col className="gutter-row" span={14}>
          {i18n.t('pvModelPanel.TemperatureCoefficientOfPmax', lang) + ' (%/°C):'}
        </Col>
        <Col className="gutter-row" span={10}>
          <Input
            disabled={true}
            style={{ width: '100%' }}
            value={pvModel.pmaxTC}
            onChange={(value) => {
              if (solarPanel) {
                // TODO for custom solar panel
              }
            }}
          />
        </Col>
      </Row>
      <Row gutter={6} style={{ paddingBottom: '4px' }}>
        <Col className="gutter-row" span={14}>
          {i18n.t('pvModelPanel.ShadeTolerance', lang) + ':'}
        </Col>
        <Col className="gutter-row" span={10}>
          <Select
            disabled={true}
            style={{ width: '100%' }}
            value={pvModel.shadeTolerance}
            onChange={(value) => {
              if (solarPanel) {
                // TODO for custom solar panel
              }
            }}
          >
            <Option key={ShadeTolerance.HIGH} value={ShadeTolerance.HIGH}>
              {ShadeTolerance.HIGH}
            </Option>
            )
            <Option key={ShadeTolerance.NONE} value={ShadeTolerance.NONE}>
              {ShadeTolerance.NONE}
            </Option>
            )
            <Option key={ShadeTolerance.PARTIAL} value={ShadeTolerance.PARTIAL}>
              {ShadeTolerance.PARTIAL}
            </Option>
            )
          </Select>
        </Col>
      </Row>
      <Row
        gutter={6}
        style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
      >
        <Col className="gutter-row" span={3}>
          {i18n.t('word.ApplyTo', lang) + ':'}
        </Col>
        <Col className="gutter-row" span={21}>
          <Radio.Group onChange={onScopeChange} value={scope}>
            <Space direction="vertical">
              <Radio value={Scope.OnlyThisObject}>{i18n.t('solarPanelMenu.OnlyThisSolarPanel', lang)}</Radio>
              {parentType !== ObjectType.Foundation && (
                <Radio value={Scope.AllObjectsOfThisTypeOnSurface}>
                  {i18n.t('solarPanelMenu.AllSolarPanelsOnSurface', lang)}
                </Radio>
              )}
              <Radio value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                {i18n.t('solarPanelMenu.AllSolarPanelsAboveFoundation', lang)}
              </Radio>
              <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('solarPanelMenu.AllSolarPanels', lang)}</Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </>
  );
};

export default PvModelPanel;
