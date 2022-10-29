/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Menu, Modal, Radio } from 'antd';
import SubMenu from 'antd/lib/menu/SubMenu';
import { CommonStoreState, useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { Copy, Cut, Lock, Paste } from '../menuItems';
import i18n from '../../../i18n/i18n';
import WallTextureSelection from './wallTextureSelection';
import WallBodyColorSelection from './wallColorSelection';
import { WallModel, WallStructure } from 'src/models/WallModel';
import { ObjectType, WallTexture } from 'src/types';
import { ElementCounter } from '../../../stores/ElementCounter';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { UndoableRemoveAllChildren } from '../../../undo/UndoableRemoveAllChildren';
import { Util } from 'src/Util';
import { UndoableChange } from 'src/undo/UndoableChange';
import WallStructureColorSelection from './wallStructureColorSelection';
import WallNumberInput from './wallNumberInput';

enum DataType {
  Height = 'Height',
  Opacity = 'Opacity',
  StructureSpacing = 'StructureSpacing',
  StructureWidth = 'StructureWidth',
  Thickness = 'Thickness',
  StructureColor = 'StructureColor',
  Color = 'Color',
  Texture = 'Texture',
}

type NumberDialogSettingType = {
  attributeKey: keyof WallModel;
  range: [min: number, max: number];
  step: number;
  unit?: string;
};

const DialogSetting = {
  Height: { attributeKey: 'lz', range: [0.1, 100], step: 0.1, unit: 'word.MeterAbbreviation' },
  Opacity: { attributeKey: 'opacity', range: [0, 1], step: 0.01 },
  StructureSpacing: { attributeKey: 'structureSpacing', range: [0.1, 1000], step: 0.1, unit: 'word.MeterAbbreviation' },
  StructureWidth: { attributeKey: 'structureWidth', range: [0.01, 1], step: 0.1, unit: 'word.MeterAbbreviation' },
  Thickness: { attributeKey: 'ly', range: [0.1, 1], step: 0.01, unit: 'word.MeterAbbreviation' },
};

const radioStyle = {
  display: 'block',
  height: '30px',
  paddingLeft: '10px',
  lineHeight: '30px',
};

const getSelectedWall = (state: CommonStoreState) => {
  for (const el of state.elements) {
    if (el.selected && el.type === ObjectType.Wall) {
      return el as WallModel;
    }
  }
  return null;
};

export const WallMenu = () => {
  const wall = useStore(getSelectedWall);

  const language = useStore(Selector.language);
  const setCommonStore = useStore(Selector.set);
  const setApplyCount = useStore(Selector.setApplyCount);
  const countAllOffspringsByType = useStore(Selector.countAllOffspringsByTypeAtOnce);
  const removeAllChildElementsByType = useStore(Selector.removeAllChildElementsByType);
  const addUndoable = useStore(Selector.addUndoable);
  const updateWallStructureById = useStore(Selector.updateWallStructureById);

  const [visibleType, setVisibleType] = useState<DataType | null>(null);

  const lang = { lng: language };
  const paddingLeft = '36px';

  const legalToPaste = () => {
    const elementsToPaste = useStore.getState().elementsToPaste;
    if (elementsToPaste && elementsToPaste.length > 0) {
      const e = elementsToPaste[0];
      if (Util.isLegalOnWall(e.type)) {
        return true;
      }
    }
    return false;
  };

  const handleClearOk = (objectType: ObjectType) => {
    if (wall) {
      const removed = useStore
        .getState()
        .elements.filter((e) => !e.locked && e.type === objectType && e.parentId === wall.id);
      removeAllChildElementsByType(wall.id, objectType);
      const removedElements = JSON.parse(JSON.stringify(removed));
      const undoableRemoveAllWindowChildren = {
        name: `Remove All ${objectType}s on Wall`,
        timestamp: Date.now(),
        parentId: wall.id,
        removedElements: removedElements,
        undo: () => {
          setCommonStore((state) => {
            state.elements.push(...undoableRemoveAllWindowChildren.removedElements);
          });
        },
        redo: () => {
          removeAllChildElementsByType(undoableRemoveAllWindowChildren.parentId, objectType);
        },
      } as UndoableRemoveAllChildren;
      addUndoable(undoableRemoveAllWindowChildren);
    }
  };

  const renderCopy = () => <Copy keyName={'wall-copy'} />;

  const renderLock = () => <Lock keyName={'wall-lock'} />;

  const renderCut = () => {
    if (!wall || wall.locked) {
      return null;
    }
    return <Cut keyName={'wall-cut'} />;
  };

  const renderPaste = () => {
    if (!legalToPaste()) {
      return null;
    }
    return <Paste keyName={'wall-paste'} />;
  };

  const renderSturctureSubMenu = () => {
    if (!wall) {
      return null;
    }
    return (
      <SubMenu key={'wall-structure'} title={i18n.t('wallMenu.WallStructure', lang)} style={{ paddingLeft: '24px' }}>
        <Radio.Group
          value={wall.wallStructure ?? WallStructure.Default}
          style={{ height: '75px' }}
          onChange={(e) => {
            const undoableChange = {
              name: 'Select Wall Structure',
              timestamp: Date.now(),
              oldValue: wall.wallStructure,
              newValue: e.target.value,
              changedElementId: wall.id,
              changedElementType: wall.type,
              undo: () => {
                updateWallStructureById(undoableChange.changedElementId, undoableChange.oldValue as WallStructure);
              },
              redo: () => {
                updateWallStructureById(undoableChange.changedElementId, undoableChange.newValue as WallStructure);
              },
            } as UndoableChange;
            addUndoable(undoableChange);
            updateWallStructureById(wall.id, e.target.value);
            setCommonStore((state) => {
              state.actionState.wallStructure = e.target.value;
              if (
                state.actionState.wallStructure === WallStructure.Stud ||
                state.actionState.wallStructure === WallStructure.Pillar
              ) {
                state.actionState.wallOpacity = 0;
              }
            });
          }}
        >
          <Radio style={radioStyle} value={WallStructure.Default}>
            {i18n.t('wallMenu.DefaultStructure', lang)}
          </Radio>
          <Radio style={radioStyle} value={WallStructure.Stud}>
            {i18n.t('wallMenu.StudStructure', lang)}
          </Radio>
          <Radio style={radioStyle} value={WallStructure.Pillar}>
            {i18n.t('wallMenu.PillarStructure', lang)}
          </Radio>
        </Radio.Group>
      </SubMenu>
    );
  };

  const renderStructureItems = () => {
    if (wall?.wallStructure === WallStructure.Stud || wall?.wallStructure === WallStructure.Pillar) {
      return (
        <>
          {renderMenuItem(DataType.StructureSpacing)}

          {renderMenuItem(DataType.StructureWidth)}

          {renderMenuItem(DataType.StructureColor)}

          {renderMenuItem(DataType.Opacity)}
        </>
      );
    }
    return null;
  };

  const renderMenuItem = (dataType: DataType) => {
    return (
      <Menu.Item
        key={`wall-${dataType}`}
        style={{ paddingLeft: paddingLeft }}
        onClick={() => {
          setApplyCount(0);
          setVisibleType(dataType);
        }}
      >
        {i18n.t(`wallMenu.${dataType}`, lang)} ...
      </Menu.Item>
    );
  };

  const renderTexture = () => {
    if (wall?.wallStructure === WallStructure.Default) {
      return renderMenuItem(DataType.Texture);
    }
    return null;
  };

  const renderWallColor = () => {
    if (
      (wall?.wallStructure === WallStructure.Default || wall?.opacity === undefined || wall?.opacity > 0) &&
      (wall?.textureType === WallTexture.NoTexture || wall?.textureType === WallTexture.Default)
    ) {
      return renderMenuItem(DataType.Color);
    }
    return null;
  };

  const renderClearItem = (objectType: ObjectType, count: number) => {
    if (count === 0) return null;

    const titleText = (type: string, count: number) =>
      `${i18n.t(`wallMenu.DoYouReallyWantToRemoveAll${type}sOnThisWall`, lang)} (${count} ${i18n.t(
        `wallMenu.${type}s`,
        lang,
      )})?`;

    const objectTypeText = objectType.replaceAll(' ', '');

    return (
      <Menu.Item
        key={`remove-all-${objectTypeText}s-on-wall`}
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
        {i18n.t(`wallMenu.RemoveAllUnlocked${objectTypeText}s`, lang)} ({count})
      </Menu.Item>
    );
  };

  const renderClearSubMenu = () => {
    const counter = wall ? countAllOffspringsByType(wall.id) : new ElementCounter();

    if (counter.gotSome() && useStore.getState().contextMenuObjectType) {
      return (
        <SubMenu key={'clear'} title={i18n.t('word.Clear', lang)} style={{ paddingLeft: '24px' }}>
          {renderClearItem(ObjectType.Window, counter.windowCount)}
          {renderClearItem(ObjectType.Door, counter.doorCount)}
          {renderClearItem(ObjectType.SolarPanel, counter.solarPanelCount)}
        </SubMenu>
      );
    }
    return null;
  };

  const renderDialogs = () => {
    switch (visibleType) {
      case DataType.Height:
      case DataType.Opacity:
      case DataType.Thickness:
      case DataType.StructureSpacing:
      case DataType.StructureWidth:
        const setting = DialogSetting[visibleType] as NumberDialogSettingType;
        if (!setting) return null;
        return (
          <WallNumberInput
            wall={wall!}
            dataType={visibleType}
            attributeKey={setting.attributeKey}
            range={setting.range}
            step={setting.step}
            setDialogVisible={() => setVisibleType(null)}
            unit={setting.unit ? i18n.t(setting.unit, lang) : undefined}
          />
        );
      case DataType.Color:
        return <WallBodyColorSelection setDialogVisible={() => setVisibleType(null)} />;
      case DataType.StructureColor:
        return <WallStructureColorSelection setDialogVisible={() => setVisibleType(null)} />;
      case DataType.Texture:
        return <WallTextureSelection setDialogVisible={() => setVisibleType(null)} />;
    }
  };

  if (!wall) return null;

  return (
    <Menu.ItemGroup>
      {renderPaste()}

      {renderCopy()}

      {renderCut()}

      {renderLock()}

      {!wall.locked && (
        <>
          {renderDialogs()}

          {renderSturctureSubMenu()}

          {renderStructureItems()}

          {renderMenuItem(DataType.Thickness)}

          {renderMenuItem(DataType.Height)}

          {renderTexture()}

          {renderWallColor()}

          {renderClearSubMenu()}
        </>
      )}
    </Menu.ItemGroup>
  );
};
