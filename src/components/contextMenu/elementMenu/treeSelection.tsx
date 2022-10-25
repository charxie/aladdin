/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Select } from 'antd';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { TreeType } from '../../../types';
import AppleImage from '../../../resources/apple_summer.png';
import BirchImage from '../../../resources/birch_summer.png';
import CoconutImage from '../../../resources/coconut.png';
import DogwoodImage from '../../../resources/dogwood_summer.png';
import ElmImage from '../../../resources/elm_summer.png';
import LindenImage from '../../../resources/linden_summer.png';
import MagnoliaImage from '../../../resources/magnolia_summer.png';
import MapleImage from '../../../resources/maple_summer.png';
import OakImage from '../../../resources/oak_summer.png';
import FanPalmImage from '../../../resources/fan_palm.png';
import PineImage from '../../../resources/pine.png';
import SpruceImage from '../../../resources/spruce.png';
import { UndoableChange } from '../../../undo/UndoableChange';
import i18n from '../../../i18n/i18n';
import { TreeModel } from '../../../models/TreeModel';

const { Option } = Select;

const TreeSelection = () => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const updateTreeTypeById = useStore(Selector.updateTreeTypeById);
  const addUndoable = useStore(Selector.addUndoable);
  const tree = useStore.getState().getSelectedElement() as TreeModel;

  const [updateFlag, setUpdateFlag] = useState(false);
  const lang = { lng: language };

  return (
    <Select
      style={{ width: '160px' }}
      value={tree?.name ?? TreeType.Pine}
      onChange={(value) => {
        if (tree) {
          const oldTree = tree.name;
          if (oldTree !== value) {
            const undoableChange = {
              name: 'Change Tree',
              timestamp: Date.now(),
              oldValue: oldTree,
              newValue: value,
              changedElementId: tree.id,
              changedElementType: tree.type,
              undo: () => {
                updateTreeTypeById(undoableChange.changedElementId, undoableChange.oldValue as TreeType);
              },
              redo: () => {
                updateTreeTypeById(undoableChange.changedElementId, undoableChange.newValue as TreeType);
              },
            } as UndoableChange;
            addUndoable(undoableChange);
            updateTreeTypeById(tree.id, value);
            setCommonStore((state) => {
              state.actionState.treeType = value;
            });
            setUpdateFlag(!updateFlag);
          }
        }
      }}
    >
      <Option key={TreeType.Apple} value={TreeType.Apple}>
        <img alt={TreeType.Apple} src={AppleImage} height={20} style={{ paddingRight: '8px' }} />{' '}
        {i18n.t('tree.Apple', lang)}
      </Option>
      <Option key={TreeType.Birch} value={TreeType.Birch}>
        <img alt={TreeType.Birch} src={BirchImage} height={20} style={{ paddingRight: '20px' }} />{' '}
        {i18n.t('tree.Birch', lang)}
      </Option>
      <Option key={TreeType.Coconut} value={TreeType.Coconut}>
        <img alt={TreeType.Coconut} src={CoconutImage} height={20} style={{ paddingRight: '18px' }} />{' '}
        {i18n.t('tree.Coconut', lang)}
      </Option>
      <Option key={TreeType.Dogwood} value={TreeType.Dogwood}>
        <img alt={TreeType.Dogwood} src={DogwoodImage} height={20} style={{ paddingRight: '10px' }} />{' '}
        {i18n.t('tree.Dogwood', lang)}
      </Option>
      <Option key={TreeType.Elm} value={TreeType.Elm}>
        <img alt={TreeType.Elm} src={ElmImage} height={20} style={{ paddingRight: '20px' }} />
        {i18n.t('tree.Elm', lang)}
      </Option>
      <Option key={TreeType.FanPalm} value={TreeType.FanPalm}>
        <img alt={TreeType.FanPalm} src={FanPalmImage} height={20} style={{ paddingRight: '18px' }} />{' '}
        {i18n.t('tree.FanPalm', lang)}
      </Option>
      <Option key={TreeType.Linden} value={TreeType.Linden}>
        <img alt={TreeType.Linden} src={LindenImage} height={20} style={{ paddingRight: '10px' }} />{' '}
        {i18n.t('tree.Linden', lang)}
      </Option>
      <Option key={TreeType.Magnolia} value={TreeType.Magnolia}>
        <img alt={TreeType.Magnolia} src={MagnoliaImage} height={20} style={{ paddingRight: '10px' }} />{' '}
        {i18n.t('tree.Magnolia', lang)}
      </Option>
      <Option key={TreeType.Maple} value={TreeType.Maple}>
        <img alt={TreeType.Maple} src={MapleImage} height={20} style={{ paddingRight: '12px' }} />{' '}
        {i18n.t('tree.Maple', lang)}
      </Option>
      <Option key={TreeType.Oak} value={TreeType.Oak}>
        <img alt={TreeType.Oak} src={OakImage} height={20} style={{ paddingRight: '17px' }} />
        {i18n.t('tree.Oak', lang)}
      </Option>
      <Option key={TreeType.Pine} value={TreeType.Pine}>
        <img alt={TreeType.Pine} src={PineImage} height={20} style={{ paddingRight: '18px' }} />{' '}
        {i18n.t('tree.Pine', lang)}
      </Option>
      <Option key={TreeType.Spruce} value={TreeType.Spruce}>
        <img alt={TreeType.Spruce} src={SpruceImage} height={20} style={{ paddingRight: '20px' }} />{' '}
        {i18n.t('tree.Spruce', lang)}
      </Option>
    </Select>
  );
};

export default TreeSelection;
