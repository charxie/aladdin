/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Select } from 'antd';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { TreeType } from '../../../types';
import CottonwoodImage from '../../../resources/cottonwood.png';
import DogwoodImage from '../../../resources/dogwood.png';
import ElmImage from '../../../resources/elm.png';
import LindenImage from '../../../resources/linden.png';
import MapleImage from '../../../resources/maple.png';
import OakImage from '../../../resources/oak.png';
import PineImage from '../../../resources/pine.png';
import { UndoableChange } from '../../../undo/UndoableChange';
import i18n from '../../../i18n/i18n';
import { TreeModel } from '../../../models/TreeModel';

const { Option } = Select;

const TreeSelection = () => {
  const language = useStore(Selector.language);
  const updateTreeTypeById = useStore(Selector.updateTreeTypeById);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const addUndoable = useStore(Selector.addUndoable);

  const lang = { lng: language };
  const tree = getSelectedElement() as TreeModel;
  const [selectValue, setSelectValue] = useState<TreeType>(tree?.name ?? '');

  return (
    <Select
      style={{ width: '160px' }}
      value={selectValue}
      onChange={(value) => {
        if (tree) {
          const oldTree = tree.name;
          if (oldTree !== value) {
            const undoableChange = {
              name: 'Change Tree',
              timestamp: Date.now(),
              oldValue: oldTree,
              newValue: value,
              undo: () => {
                updateTreeTypeById(tree.id, undoableChange.oldValue as TreeType);
              },
              redo: () => {
                updateTreeTypeById(tree.id, undoableChange.newValue as TreeType);
              },
            } as UndoableChange;
            addUndoable(undoableChange);
            updateTreeTypeById(tree.id, value);
            setSelectValue(value);
          }
        }
      }}
    >
      <Option key={TreeType.Cottonwood} value={TreeType.Cottonwood}>
        <img alt={TreeType.Cottonwood} src={CottonwoodImage} height={20} style={{ paddingRight: '16px' }} />{' '}
        {i18n.t('tree.Cottonwood', lang)}
      </Option>
      <Option key={TreeType.Dogwood} value={TreeType.Dogwood}>
        <img alt={TreeType.Dogwood} src={DogwoodImage} height={20} style={{ paddingRight: '16px' }} />{' '}
        {i18n.t('tree.Dogwood', lang)}
      </Option>
      <Option key={TreeType.Elm} value={TreeType.Elm}>
        <img alt={TreeType.Elm} src={ElmImage} height={20} style={{ paddingRight: '22px' }} />
        {i18n.t('tree.Elm', lang)}
      </Option>
      <Option key={TreeType.Linden} value={TreeType.Linden}>
        <img alt={TreeType.Linden} src={LindenImage} height={20} style={{ paddingRight: '18px' }} />{' '}
        {i18n.t('tree.Linden', lang)}
      </Option>
      <Option key={TreeType.Maple} value={TreeType.Maple}>
        <img alt={TreeType.Maple} src={MapleImage} height={20} style={{ paddingRight: '18px' }} />{' '}
        {i18n.t('tree.Maple', lang)}
      </Option>
      <Option key={TreeType.Oak} value={TreeType.Oak}>
        <img alt={TreeType.Oak} src={OakImage} height={20} style={{ paddingRight: '16px' }} />
        {i18n.t('tree.Oak', lang)}
      </Option>
      <Option key={TreeType.Pine} value={TreeType.Pine}>
        <img alt={TreeType.Pine} src={PineImage} height={20} style={{ paddingRight: '22px' }} />{' '}
        {i18n.t('tree.Pine', lang)}
      </Option>
    </Select>
  );
};

export default TreeSelection;
