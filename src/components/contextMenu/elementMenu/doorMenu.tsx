/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Checkbox, Menu, Radio } from 'antd';
import { CommonStoreState, useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { Copy, Cut, Lock } from '../menuItems';
import i18n from 'src/i18n/i18n';
import { DoorModel, DoorType } from 'src/models/DoorModel';
import DoorTextureSelection from './doorTextureSelection';
import DoorColorSelection from './doorColorSelection';
import { DoorTexture, ObjectType } from 'src/types';
import SubMenu from 'antd/lib/menu/SubMenu';
import { radioStyle } from './wallMenu';
import { UndoableChange } from 'src/undo/UndoableChange';
import { UndoableCheck } from 'src/undo/UndoableCheck';
import DoorUValueInput from './doorUValueInput';
import DoorWidthInput from './doorWidthInput';
import DoorHeightInput from './doorHeightInput';
import DoorHeatCapacityInput from './doorHeatCapacityInput';
import DoorOpacityInput from './doorOpacityInput';
import DoorFrameColorSelection from './doorFrameColorSelection';

const getSelectedDoor = (state: CommonStoreState) => {
  for (const el of state.elements) {
    if (el.selected && el.type === ObjectType.Door) {
      return el as DoorModel;
    }
  }
  return null;
};

export const DoorMenu = React.memo(() => {
  const door = useStore(getSelectedDoor);
  const language = useStore(Selector.language);
  const setApplyCount = useStore(Selector.setApplyCount);
  const addUndoable = useStore(Selector.addUndoable);
  const setCommonStore = useStore(Selector.set);

  const [textureDialogVisible, setTextureDialogVisible] = useState(false);
  const [colorDialogVisible, setColorDialogVisible] = useState(false);
  const [frameColorDialogVisible, setFrameColorDialogVisible] = useState(false);
  const [widthDialogVisible, setWidthDialogVisible] = useState(false);
  const [heightDialogVisible, setHeightDialogVisible] = useState(false);
  const [uValueDialogVisible, setUValueDialogVisible] = useState(false);
  const [opacityDialogVisible, setOpacityDialogVisible] = useState(false);
  const [heatCapacityDialogVisible, setHeatCapacityDialogVisible] = useState(false);

  if (!door) return null;

  const lang = { lng: language };
  const paddingLeft = '36px';

  const updateDoorTypeById = (id: string, type: DoorType) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id && e.type === ObjectType.Door) {
          (e as DoorModel).doorType = type;
          break;
        }
      }
    });
  };

  const updateDoorFilledById = (id: string, checked: boolean) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id && e.type === ObjectType.Door) {
          (e as DoorModel).filled = checked;
          break;
        }
      }
    });
  };

  const updateInteriorById = (id: string, interior: boolean) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id && e.type === ObjectType.Door) {
          (e as DoorModel).interior = interior;
          break;
        }
      }
    });
  };

  const renderTypeSubMenu = () => {
    if (!door) {
      return null;
    }
    return (
      <SubMenu key={'door-type'} title={i18n.t('doorMenu.DoorType', lang)} style={{ paddingLeft: '24px' }}>
        <Radio.Group
          value={door.doorType}
          style={{ height: '75px' }}
          onChange={(e) => {
            const undoableChange = {
              name: 'Select Door Type',
              timestamp: Date.now(),
              oldValue: door.doorType,
              newValue: e.target.value,
              changedElementId: door.id,
              changedElementType: door.type,
              undo: () => {
                updateDoorTypeById(undoableChange.changedElementId, undoableChange.oldValue as DoorType);
              },
              redo: () => {
                updateDoorTypeById(undoableChange.changedElementId, undoableChange.newValue as DoorType);
              },
            } as UndoableChange;
            addUndoable(undoableChange);
            updateDoorTypeById(door.id, e.target.value);
            setCommonStore((state) => {
              state.actionState.doorType = e.target.value;
            });
          }}
        >
          <Radio style={radioStyle} value={DoorType.Default}>
            {i18n.t('doorMenu.Default', lang)}
          </Radio>
          <Radio style={radioStyle} value={DoorType.Arched}>
            {i18n.t('doorMenu.Arched', lang)}
          </Radio>
        </Radio.Group>
      </SubMenu>
    );
  };

  return (
    <Menu.ItemGroup>
      <Copy keyName={'door-copy'} />
      {!door.locked && <Cut keyName={'door-cut'} />}
      <Lock keyName={'door-lock'} />

      {!door.locked && (
        <>
          <Menu.Item key={'door-filled'}>
            <Checkbox
              checked={door.filled}
              onChange={(e) => {
                const checked = e.target.checked;
                const undoableCheck = {
                  name: 'Door filled',
                  timestamp: Date.now(),
                  checked: checked,
                  selectedElementId: door.id,
                  selectedElementType: door.type,
                  undo: () => {
                    updateDoorFilledById(door.id, !undoableCheck.checked);
                  },
                  redo: () => {
                    updateDoorFilledById(door.id, undoableCheck.checked);
                  },
                } as UndoableCheck;
                addUndoable(undoableCheck);
                updateDoorFilledById(door.id, checked);
                setCommonStore((state) => {
                  state.actionState.doorFilled = checked;
                });
              }}
            >
              {i18n.t('doorMenu.Filled', lang)}
            </Checkbox>
          </Menu.Item>
          <Menu.Item style={{ paddingLeft: '10px' }}>
            <Checkbox
              checked={!!door.interior}
              onChange={(e) => {
                const undoableChange = {
                  name: 'Set Door Interior',
                  timestamp: Date.now(),
                  oldValue: !!door?.interior,
                  newValue: e.target.checked,
                  changedElementId: door.id,
                  changedElementType: door.type,
                  undo: () => {
                    updateInteriorById(undoableChange.changedElementId, undoableChange.oldValue as boolean);
                  },
                  redo: () => {
                    updateInteriorById(undoableChange.changedElementId, undoableChange.newValue as boolean);
                  },
                } as UndoableChange;
                addUndoable(undoableChange);
                updateInteriorById(door.id, e.target.checked);
              }}
            >
              {i18n.t('doorMenu.Interior', lang)}
            </Checkbox>
          </Menu.Item>
          {renderTypeSubMenu()}
          {widthDialogVisible && <DoorWidthInput setDialogVisible={setWidthDialogVisible} />}
          <Menu.Item
            key={'door-width'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setWidthDialogVisible(true);
            }}
          >
            {i18n.t('word.Width', lang)} ...
          </Menu.Item>
          {heightDialogVisible && <DoorHeightInput setDialogVisible={setHeightDialogVisible} />}
          <Menu.Item
            key={'door-height'}
            style={{ paddingLeft: '36px' }}
            onClick={() => {
              setApplyCount(0);
              setHeightDialogVisible(true);
            }}
          >
            {i18n.t('word.Height', lang)} ...
          </Menu.Item>
          {door.filled && (
            <>
              {uValueDialogVisible && <DoorUValueInput setDialogVisible={setUValueDialogVisible} />}
              <Menu.Item
                key={'door-u-value'}
                style={{ paddingLeft: '36px' }}
                onClick={() => {
                  setApplyCount(0);
                  setUValueDialogVisible(true);
                }}
              >
                {i18n.t('word.UValue', lang)} ...
              </Menu.Item>
              {heatCapacityDialogVisible && <DoorHeatCapacityInput setDialogVisible={setHeatCapacityDialogVisible} />}
              <Menu.Item
                key={'door-heat-capacity'}
                style={{ paddingLeft: '36px' }}
                onClick={() => {
                  setApplyCount(0);
                  setHeatCapacityDialogVisible(true);
                }}
              >
                {i18n.t('word.VolumetricHeatCapacity', lang)} ...
              </Menu.Item>
              <Menu.Item
                key={'door-texture'}
                style={{ paddingLeft: paddingLeft }}
                onClick={() => {
                  setApplyCount(0);
                  setTextureDialogVisible(true);
                }}
              >
                {i18n.t('word.Texture', lang)} ...
              </Menu.Item>
              <Menu.Item
                key={'door-color'}
                style={{ paddingLeft: paddingLeft }}
                onClick={() => {
                  setApplyCount(0);
                  setColorDialogVisible(true);
                }}
              >
                {i18n.t('word.Color', lang)} ...
              </Menu.Item>
              <Menu.Item
                key={'door-frame-color'}
                style={{ paddingLeft: paddingLeft }}
                onClick={() => {
                  setApplyCount(0);
                  setFrameColorDialogVisible(true);
                }}
              >
                {i18n.t('doorMenu.FrameColor', lang)} ...
              </Menu.Item>
              {(door.textureType === DoorTexture.Default || door.textureType === DoorTexture.NoTexture) && (
                <Menu.Item
                  key={'door-opacity'}
                  style={{ paddingLeft: paddingLeft }}
                  onClick={() => {
                    setApplyCount(0);
                    setOpacityDialogVisible(true);
                  }}
                >
                  {i18n.t('wallMenu.Opacity', lang)} ...
                </Menu.Item>
              )}
            </>
          )}
        </>
      )}

      {textureDialogVisible && <DoorTextureSelection setDialogVisible={setTextureDialogVisible} />}
      {colorDialogVisible && <DoorColorSelection setDialogVisible={setColorDialogVisible} />}
      {frameColorDialogVisible && <DoorFrameColorSelection setDialogVisible={setFrameColorDialogVisible} />}
      {opacityDialogVisible && <DoorOpacityInput setDialogVisible={setOpacityDialogVisible} />}
    </Menu.ItemGroup>
  );
});
