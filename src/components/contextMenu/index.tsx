import React from 'react';
import { Dropdown, Menu } from 'antd';

import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import {
  CuboidMenu,
  FoundationMenu,
  GroundMenu,
  HumanMenu,
  SensorMenu,
  SkyMenu,
  SolarPanelMenu,
  TreeMenu,
} from './elementMenu';

export interface ContextMenuProps {
  setPvDialogVisible: (visible: boolean) => void;

  [key: string]: any;
}

const DropdownContextMenu: React.FC<ContextMenuProps> = ({ children, setPvDialogVisible }) => {
  const contextMenuObjectType = useStore((state) => state.contextMenuObjectType);

  const contextMenu = (setPvDialogVisible: (visible: boolean) => void) => {
    switch (contextMenuObjectType) {
      case ObjectType.Ground:
        return (
          <Menu>
            <GroundMenu />
          </Menu>
        );
      case ObjectType.Sky:
        return (
          <Menu>
            <SkyMenu />
          </Menu>
        );
      case ObjectType.Foundation:
        return (
          <Menu>
            <FoundationMenu />
          </Menu>
        );
      case ObjectType.Cuboid:
        return (
          <Menu>
            <CuboidMenu />
          </Menu>
        );
      case ObjectType.SolarPanel:
        return (
          <Menu>
            <SolarPanelMenu setPvDialogVisible={setPvDialogVisible} />
          </Menu>
        );
      case ObjectType.Sensor:
        return (
          <Menu>
            <SensorMenu />
          </Menu>
        );
      case ObjectType.Human:
        return (
          <Menu>
            <HumanMenu />
          </Menu>
        );
      case ObjectType.Tree:
        return (
          <Menu>
            <TreeMenu />
          </Menu>
        );
      default:
        return <></>;
    }
  };

  return (
    <Dropdown key={'canvas-context-menu'} trigger={['contextMenu']} overlay={contextMenu(setPvDialogVisible)}>
      {children}
    </Dropdown>
  );
};

export default React.memo(DropdownContextMenu);
