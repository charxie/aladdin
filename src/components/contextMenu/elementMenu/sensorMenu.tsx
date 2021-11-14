/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Checkbox, Input, Menu } from 'antd';
import { CheckboxChangeEvent } from 'antd/lib/checkbox';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { Copy, Cut } from '../menuItems';
import i18n from '../../../i18n/i18n';
import { UndoableCheck } from '../../../undo/UndoableCheck';
import { UndoableChange } from '../../../undo/UndoableChange';

export const SensorMenu = () => {
  const language = useStore(Selector.language);
  const updateElementById = useStore(Selector.updateElementById);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const addUndoable = useStore(Selector.addUndoable);

  const selectedElement = getSelectedElement();
  const [labelText, setLabelText] = useState<string>(selectedElement?.label ?? '');
  const lang = { lng: language };

  const updateElementLabelText = () => {
    if (selectedElement) {
      const oldLabel = selectedElement.label;
      const undoableChange = {
        name: 'Set Sensor Label',
        timestamp: Date.now(),
        oldValue: oldLabel,
        newValue: labelText,
        undo: () => {
          updateElementById(selectedElement.id, { label: undoableChange.oldValue as string });
        },
        redo: () => {
          updateElementById(selectedElement.id, { label: undoableChange.newValue as string });
        },
      } as UndoableChange;
      addUndoable(undoableChange);
      updateElementById(selectedElement.id, { label: labelText });
    }
  };

  const showElementLabel = (e: CheckboxChangeEvent) => {
    if (selectedElement) {
      const undoableCheck = {
        name: 'Show Sensor Label',
        timestamp: Date.now(),
        checked: !selectedElement.showLabel,
        undo: () => {
          updateElementById(selectedElement.id, { showLabel: !undoableCheck.checked });
        },
        redo: () => {
          updateElementById(selectedElement.id, { showLabel: undoableCheck.checked });
        },
      } as UndoableCheck;
      addUndoable(undoableCheck);
      updateElementById(selectedElement.id, { showLabel: e.target.checked });
    }
  };

  return (
    <>
      <Copy />
      <Cut />
      <Menu.Item key={'sensor-show-label'}>
        <Checkbox checked={!!selectedElement?.showLabel} onChange={showElementLabel}>
          {i18n.t('sensorMenu.KeepShowingLabel', lang)}
        </Checkbox>
      </Menu.Item>
      <Menu>
        <Menu.Item key={'sensor-label-text'} style={{ paddingLeft: '36px' }}>
          <Input
            addonBefore={i18n.t('sensorMenu.Label', lang) + ':'}
            value={labelText}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLabelText(e.target.value)}
            onPressEnter={updateElementLabelText}
            onBlur={updateElementLabelText}
          />
        </Menu.Item>
      </Menu>
    </>
  );
};
