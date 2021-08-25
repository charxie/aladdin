import React from 'react';
import { Menu, Modal } from 'antd';
import { ColorPicker, Copy, Cut, Lock, Paste } from '../menuItems';
import SubMenu from 'antd/lib/menu/SubMenu';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import ReshapeElementMenu from 'src/components/reshapeElementMenu';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';

export const FoundationMenu = () => {
  const getSelectedElement = useStore((state) => state.getSelectedElement);
  const countAllChildElementsByType = useStore((state) => state.countAllChildElementsByType);
  const removeAllChildElementsByType = useStore((state) => state.removeAllChildElementsByType);

  const contextMenuObjectType = useStore((state) => state.contextMenuObjectType);
  const selectedElement = getSelectedElement();
  const sensorCountFoundation = selectedElement
    ? countAllChildElementsByType(selectedElement.id, ObjectType.Sensor)
    : 0;
  const solarPanelCountFoundation = selectedElement
    ? countAllChildElementsByType(selectedElement.id, ObjectType.SolarPanel)
    : 0;

  return (
    <Menu.ItemGroup>
      <Paste />
      <Copy />
      <Cut />
      <Lock />
      {(sensorCountFoundation > 0 || solarPanelCountFoundation > 0) && contextMenuObjectType && (
        <SubMenu key={'clear'} title={'Clear'} style={{ paddingLeft: '24px' }}>
          {sensorCountFoundation > 0 && (
            <Menu.Item
              key={'remove-all-sensors'}
              onClick={() => {
                Modal.confirm({
                  title:
                    'Do you really want to remove all the ' + sensorCountFoundation + ' sensors on this foundation?',
                  icon: <ExclamationCircleOutlined />,
                  okText: 'OK',
                  cancelText: 'Cancel',
                  onOk: () => {
                    if (selectedElement) {
                      removeAllChildElementsByType(selectedElement.id, ObjectType.Sensor);
                    }
                  },
                });
              }}
            >
              Remove All {sensorCountFoundation} Sensors
            </Menu.Item>
          )}
          {solarPanelCountFoundation > 0 && (
            <Menu.Item
              key={'remove-all-solar-panels'}
              onClick={() => {
                Modal.confirm({
                  title:
                    'Do you really want to remove all the ' +
                    solarPanelCountFoundation +
                    ' solar panels on this foundation?',
                  icon: <ExclamationCircleOutlined />,
                  okText: 'OK',
                  cancelText: 'Cancel',
                  onOk: () => {
                    if (selectedElement) {
                      removeAllChildElementsByType(selectedElement.id, ObjectType.SolarPanel);
                    }
                  },
                });
              }}
            >
              Remove All {solarPanelCountFoundation} Solar Panels
            </Menu.Item>
          )}
        </SubMenu>
      )}
      <ColorPicker />
      {selectedElement && contextMenuObjectType && (
        <ReshapeElementMenu elementId={selectedElement.id} name={'foundation'} style={{ paddingLeft: '24px' }} />
      )}
    </Menu.ItemGroup>
  );
};
