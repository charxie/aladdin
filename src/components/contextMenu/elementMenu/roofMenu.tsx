/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Menu, Modal, Radio } from 'antd';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { Lock, Paste } from '../menuItems';
import i18n from 'src/i18n/i18n';
import { ObjectType, RoofTexture } from 'src/types';
import RoofTextureSelection from './roofTextureSelection';
import RoofColorSelection from './roofColorSelection';
import { RoofModel, RoofStructure, RoofType } from 'src/models/RoofModel';
import RoofOverhangInput from './roofOverhangInput';
import RoofThicknessInput from './roofThicknessInput';
import RoofRafterSpacingInput from './roofRafterSpacingInput';
import RoofOpacityInput from './roofOpacityInput';
import SubMenu from 'antd/lib/menu/SubMenu';
import GlassTintSelection from './glassTintSelection';
import { UndoableChange } from 'src/undo/UndoableChange';
import RoofRafterColorSelection from './roofRafterColorSelection';
import RoofRafterWidthInput from './roofRafterWidthInput';
import { ElementCounter } from '../../../stores/ElementCounter';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';
import { UndoableRemoveAllChildren } from '../../../undo/UndoableRemoveAllChildren';

export const RoofMenu = () => {
  const setCommonStore = useStore(Selector.set);
  const elements = useStore(Selector.elements);
  const roof = useStore(Selector.selectedElement) as RoofModel;
  const language = useStore(Selector.language);
  const updateRoofStructureById = useStore(Selector.updateRoofStructureById);
  const countAllOffspringsByType = useStore(Selector.countAllOffspringsByTypeAtOnce);
  const removeAllChildElementsByType = useStore(Selector.removeAllChildElementsByType);
  const updateElementLockById = useStore(Selector.updateElementLockById);
  const updateElementUnlockByParentId = useStore(Selector.updateElementLockByParentId);
  const setApplyCount = useStore(Selector.setApplyCount);
  const addUndoable = useStore(Selector.addUndoable);

  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [rafterSpacingDialogVisible, setRafterSpacingDialogVisible] = useState(false);
  const [rafterWidthDialogVisible, setRafterWidthDialogVisible] = useState(false);
  const [rafterColorDialogVisible, setRafterColorDialogVisible] = useState(false);
  const [overhangDialogVisible, setOverhangDialogVisible] = useState(false);
  const [thicknessDialogVisible, setThicknessDialogVisible] = useState(false);
  const [textureDialogVisible, setTextureDialogVisible] = useState(false);
  const [roofColorDialogVisible, setRoofColorDialogVisible] = useState(false);
  const [glassTintDialogVisible, setGlassTintDialogVisible] = useState(false);
  const [opacityDialogVisible, setOpacityDialogVisible] = useState(false);

  const lang = { lng: language };
  const paddingLeft = '36px';
  const radioStyle = {
    display: 'block',
    height: '30px',
    paddingLeft: '10px',
    lineHeight: '30px',
  };

  const legalToPaste = () => {
    const elementsToPaste = useStore.getState().elementsToPaste;
    if (elementsToPaste && elementsToPaste.length > 0) {
      const e = elementsToPaste[0];
      if (e.type === ObjectType.SolarPanel) {
        return true;
      }
    }
    return false;
  };

  // for some reason, roof properties are not updated in the radio group action,
  // so we have to get the updated version here
  const updatedRoof = roof?.id ? (useStore.getState().getElementById(roof.id) as RoofModel) : roof;

  const handleClearOk = (objectType: ObjectType) => {
    if (roof) {
      const removed = useStore
        .getState()
        .elements.filter((e) => !e.locked && e.type === objectType && e.parentId === roof.id);
      removeAllChildElementsByType(roof.id, objectType);
      const removedElements = JSON.parse(JSON.stringify(removed));
      const undoableRemoveAllChildren = {
        name: `Remove All ${objectType}s on Roof`,
        timestamp: Date.now(),
        parentId: roof.id,
        removedElements: removedElements,
        undo: () => {
          setCommonStore((state) => {
            state.elements.push(...undoableRemoveAllChildren.removedElements);
          });
        },
        redo: () => {
          removeAllChildElementsByType(undoableRemoveAllChildren.parentId, objectType);
        },
      } as UndoableRemoveAllChildren;
      addUndoable(undoableRemoveAllChildren);
    }
  };

  const renderClearItem = (objectType: ObjectType, count: number) => {
    if (count === 0) return null;
    const titleText = (type: string, count: number) =>
      `${i18n.t(`roofMenu.DoYouReallyWantToRemoveAll${type}sOnThisRoof`, lang)} (${count} ${i18n.t(
        `roofMenu.${type}s`,
        lang,
      )})?`;
    const objectTypeText = objectType.replaceAll(' ', '');
    return (
      <Menu.Item
        key={`remove-all-${objectTypeText}s-on-roof`}
        onClick={() => {
          Modal.confirm({
            title: titleText(objectTypeText, count),
            icon: <ExclamationCircleOutlined />,
            onOk: () => {
              handleClearOk(objectType);
            },
          });
        }}
      >
        {i18n.t(`roofMenu.RemoveAllUnlocked${objectTypeText}s`, lang)} ({count})
      </Menu.Item>
    );
  };

  const renderLockItem = (objectType: ObjectType, count: number) => {
    if (count === 0) return null;
    const objectTypeText = objectType.replaceAll(' ', '');
    return (
      <Menu.Item
        key={`lock-all-${objectTypeText}s-on-roof`}
        onClick={() => {
          if (!roof) return;
          const oldLocks = new Map<string, boolean>();
          for (const elem of elements) {
            if (elem.parentId === roof.id && elem.type === objectType) {
              oldLocks.set(elem.id, !!elem.locked);
            }
          }
          updateElementUnlockByParentId(roof.id, objectType, true);
          const undoableLockAllElementsOfType = {
            name: 'Lock All ' + objectTypeText + ' on Roof',
            timestamp: Date.now(),
            oldValues: oldLocks,
            newValue: true,
            undo: () => {
              for (const [id, locked] of undoableLockAllElementsOfType.oldValues.entries()) {
                updateElementLockById(id, locked as boolean);
              }
            },
            redo: () => {
              updateElementUnlockByParentId(roof.id, objectType, true);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableLockAllElementsOfType);
        }}
      >
        {i18n.t(`roofMenu.LockAll${objectTypeText}s`, lang)} ({count})
      </Menu.Item>
    );
  };

  const renderUnlockItem = (objectType: ObjectType, count: number) => {
    if (count === 0) return null;
    const objectTypeText = objectType.replaceAll(' ', '');
    return (
      <Menu.Item
        key={`unlock-all-${objectTypeText}s-on-roof`}
        onClick={() => {
          if (!roof) return;
          const oldLocks = new Map<string, boolean>();
          for (const elem of elements) {
            if (elem.parentId === roof.id && elem.type === objectType) {
              oldLocks.set(elem.id, !!elem.locked);
            }
          }
          updateElementUnlockByParentId(roof.id, objectType, false);
          const undoableUnlockAllElementsOfType = {
            name: 'Unlock All ' + objectTypeText + ' on Roof',
            timestamp: Date.now(),
            oldValues: oldLocks,
            newValue: true,
            undo: () => {
              for (const [id, locked] of undoableUnlockAllElementsOfType.oldValues.entries()) {
                updateElementLockById(id, locked as boolean);
              }
            },
            redo: () => {
              updateElementUnlockByParentId(roof.id, objectType, false);
            },
          } as UndoableChangeGroup;
          addUndoable(undoableUnlockAllElementsOfType);
        }}
      >
        {i18n.t(`roofMenu.UnlockAll${objectTypeText}s`, lang)}
      </Menu.Item>
    );
  };

  const renderElementsSubMenu = () => {
    const counterAll = roof ? countAllOffspringsByType(roof.id, true) : new ElementCounter();
    if (counterAll.gotSome() && useStore.getState().contextMenuObjectType) {
      const counterUnlocked = roof ? countAllOffspringsByType(roof.id, false) : new ElementCounter();
      return (
        <SubMenu
          key={'lock-unlock-clear-on-roof'}
          title={i18n.t('word.Elements', lang)}
          style={{ paddingLeft: '24px' }}
        >
          {renderClearItem(ObjectType.Window, counterUnlocked.windowCount)}
          {renderClearItem(ObjectType.SolarPanel, counterUnlocked.solarPanelCount)}
          {renderClearItem(ObjectType.Sensor, counterUnlocked.sensorCount)}
          {renderClearItem(ObjectType.Light, counterUnlocked.lightCount)}
          {renderLockItem(ObjectType.Window, counterUnlocked.windowCount)}
          {renderUnlockItem(ObjectType.Window, counterAll.windowCount)}
          {renderLockItem(ObjectType.SolarPanel, counterUnlocked.solarPanelCount)}
          {renderUnlockItem(ObjectType.SolarPanel, counterAll.solarPanelCount)}
          {renderLockItem(ObjectType.Sensor, counterUnlocked.sensorCount)}
          {renderUnlockItem(ObjectType.Sensor, counterAll.sensorCount)}
        </SubMenu>
      );
    }
    return null;
  };

  return (
    roof && (
      <Menu.ItemGroup>
        {legalToPaste() && <Paste keyName={'roof-paste'} />}
        <Lock keyName={'roof-lock'} />

        {renderElementsSubMenu()}

        {!roof.locked && roof.roofType === RoofType.Gable && updatedRoof && (
          <SubMenu
            key={'roof-structure'}
            title={i18n.t('roofMenu.RoofStructure', lang)}
            style={{ paddingLeft: '24px' }}
          >
            <Radio.Group
              value={updatedRoof.roofStructure ?? RoofStructure.Default}
              style={{ height: '110px' }}
              onChange={(e) => {
                const undoableChange = {
                  name: 'Select Roof Structure',
                  timestamp: Date.now(),
                  oldValue: updatedRoof.roofStructure ?? RoofStructure.Default,
                  newValue: e.target.value,
                  changedElementId: roof.id,
                  changedElementType: roof.type,
                  undo: () => {
                    updateRoofStructureById(undoableChange.changedElementId, undoableChange.oldValue as RoofStructure);
                  },
                  redo: () => {
                    updateRoofStructureById(undoableChange.changedElementId, undoableChange.newValue as RoofStructure);
                  },
                } as UndoableChange;
                addUndoable(undoableChange);
                updateRoofStructureById(roof.id, e.target.value);
                setUpdateFlag(!updateFlag);
              }}
            >
              <Radio style={radioStyle} value={RoofStructure.Default}>
                {i18n.t('roofMenu.DefaultStructure', lang)}
              </Radio>
              <Radio style={radioStyle} value={RoofStructure.Rafter}>
                {i18n.t('roofMenu.RafterStructure', lang)}
              </Radio>
              <Radio style={radioStyle} value={RoofStructure.Glass}>
                {i18n.t('roofMenu.GlassStructure', lang)}
              </Radio>
            </Radio.Group>
          </SubMenu>
        )}

        {!roof.locked && updatedRoof && (
          <>
            {(updatedRoof.roofStructure === RoofStructure.Rafter ||
              updatedRoof.roofStructure === RoofStructure.Glass) && (
              <>
                {opacityDialogVisible && <RoofOpacityInput setDialogVisible={setOpacityDialogVisible} />}
                <Menu.Item
                  key={'roof-opacityInput'}
                  style={{ paddingLeft: paddingLeft }}
                  onClick={() => {
                    setApplyCount(0);
                    setOpacityDialogVisible(true);
                  }}
                >
                  {i18n.t('roofMenu.Opacity', lang)} ...
                </Menu.Item>
              </>
            )}

            {updatedRoof.roofStructure === RoofStructure.Rafter && roof.roofType === RoofType.Gable && (
              <>
                {rafterColorDialogVisible && (
                  <RoofRafterColorSelection setDialogVisible={setRafterColorDialogVisible} />
                )}
                <Menu.Item
                  key={'roof-rafter-color'}
                  style={{ paddingLeft: paddingLeft }}
                  onClick={() => {
                    setApplyCount(0);
                    setRafterColorDialogVisible(true);
                  }}
                >
                  {i18n.t('roofMenu.RafterColor', lang)} ...
                </Menu.Item>

                {rafterSpacingDialogVisible && (
                  <RoofRafterSpacingInput setDialogVisible={setRafterSpacingDialogVisible} />
                )}
                <Menu.Item
                  key={'roof-rafter-spacing'}
                  style={{ paddingLeft: paddingLeft }}
                  onClick={() => {
                    setApplyCount(0);
                    setRafterSpacingDialogVisible(true);
                  }}
                >
                  {i18n.t('roofMenu.RafterSpacing', lang)} ...
                </Menu.Item>

                {rafterWidthDialogVisible && <RoofRafterWidthInput setDialogVisible={setRafterWidthDialogVisible} />}
                <Menu.Item
                  key={'roof-rafter-width'}
                  style={{ paddingLeft: paddingLeft }}
                  onClick={() => {
                    setApplyCount(0);
                    setRafterWidthDialogVisible(true);
                  }}
                >
                  {i18n.t('roofMenu.RafterWidth', lang)} ...
                </Menu.Item>
              </>
            )}

            {thicknessDialogVisible && <RoofThicknessInput setDialogVisible={setThicknessDialogVisible} />}
            <Menu.Item
              key={'roof-thickness'}
              style={{ paddingLeft: paddingLeft }}
              onClick={() => {
                setApplyCount(0);
                setThicknessDialogVisible(true);
              }}
            >
              {i18n.t(
                updatedRoof.roofStructure === RoofStructure.Rafter ? 'roofMenu.RafterThickness' : 'word.Thickness',
                lang,
              )}{' '}
              ...
            </Menu.Item>

            {updatedRoof.roofStructure === RoofStructure.Glass && roof.roofType === RoofType.Gable && (
              <>
                {glassTintDialogVisible && <GlassTintSelection setDialogVisible={setGlassTintDialogVisible} />}
                <Menu.Item
                  key={'roof-glass-tint-selection'}
                  style={{ paddingLeft: paddingLeft }}
                  onClick={() => {
                    setApplyCount(0);
                    setGlassTintDialogVisible(true);
                  }}
                >
                  {i18n.t('roofMenu.GlassTint', lang)} ...
                </Menu.Item>
              </>
            )}

            {overhangDialogVisible && <RoofOverhangInput setDialogVisible={setOverhangDialogVisible} />}
            <Menu.Item
              key={'roof-overhang'}
              style={{ paddingLeft: paddingLeft }}
              onClick={() => {
                setApplyCount(0);
                setOverhangDialogVisible(true);
              }}
            >
              {i18n.t('roofMenu.OverhangLength', lang)} ...
            </Menu.Item>

            {updatedRoof.roofStructure !== RoofStructure.Rafter && (
              <>
                {textureDialogVisible && <RoofTextureSelection setDialogVisible={setTextureDialogVisible} />}
                <Menu.Item
                  key={'roof-texture'}
                  style={{ paddingLeft: paddingLeft }}
                  onClick={() => {
                    setApplyCount(0);
                    setTextureDialogVisible(true);
                  }}
                >
                  {i18n.t('word.Texture', lang)} ...
                </Menu.Item>
              </>
            )}

            {(updatedRoof.roofStructure !== RoofStructure.Rafter ||
              updatedRoof.opacity === undefined ||
              updatedRoof.opacity > 0) && (
              <>
                {roofColorDialogVisible && <RoofColorSelection setDialogVisible={setRoofColorDialogVisible} />}
                {(roof.textureType === RoofTexture.NoTexture || roof.textureType === RoofTexture.Default) && (
                  <Menu.Item
                    key={'roof-color'}
                    style={{ paddingLeft: paddingLeft }}
                    onClick={() => {
                      setApplyCount(0);
                      setRoofColorDialogVisible(true);
                    }}
                  >
                    {i18n.t('roofMenu.RoofColor', lang)} ...
                  </Menu.Item>
                )}
              </>
            )}
          </>
        )}
      </Menu.ItemGroup>
    )
  );
};
