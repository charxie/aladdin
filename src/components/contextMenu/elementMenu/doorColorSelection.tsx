/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, Modal, Radio, Row, Space } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, Scope } from 'src/types';
import i18n from 'src/i18n/i18n';
import { UndoableChange } from 'src/undo/UndoableChange';
import { UndoableChangeGroup } from 'src/undo/UndoableChangeGroup';
import { CompactPicker } from 'react-color';
import { DoorModel } from 'src/models/DoorModel';
import { useSelectedElement } from './menuHooks';

const DoorColorSelection = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.doorActionScope);
  const setActionScope = useStore(Selector.setDoorActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);
  const getElementById = useStore(Selector.getElementById);

  const door = useSelectedElement(ObjectType.Door) as DoorModel | undefined;

  const [selectedColor, setSelectedColor] = useState<string>(door?.color ?? '#ffffff');
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const okButtonRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    okButtonRef.current?.focus();
  });

  const lang = { lng: language };

  useEffect(() => {
    if (door) {
      setSelectedColor(door?.color ?? '#ffffff');
    }
  }, [door]);

  const updateColorById = (id: string, color: string) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          if (!e.locked) {
            e.color = color;
          }
          break;
        }
      }
    });
  };

  const updateColorInMap = (map: Map<string, string>, color: string) => {
    for (const id of map.keys()) {
      updateColorById(id, color as string);
    }
  };

  const undoColorInMap = (map: Map<string, string>) => {
    for (const [id, color] of map.entries()) {
      updateColorById(id, color as string);
    }
  };

  const needChange = (color: string) => {
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.Door && color !== e.color && !e.locked) {
            return true;
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.Door && e.foundationId === door?.foundationId && color !== e.color && !e.locked) {
            return true;
          }
        }
        break;
      case Scope.OnlyThisSide:
        for (const e of elements) {
          if (e.type === ObjectType.Door && e.parentId === door?.parentId && color !== e.color && !e.locked) {
            return true;
          }
        }
        break;
      default:
        if (color !== door?.color) {
          return true;
        }
        break;
    }
    return false;
  };

  const setColor = (value: string) => {
    if (!door) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        const oldColorsAll = new Map<string, string>();
        for (const elem of useStore.getState().elements) {
          if (elem.type === ObjectType.Door && !elem.locked) {
            oldColorsAll.set(elem.id, elem.color ?? '#ffffff');
          }
        }
        const undoableChangeAll = {
          name: 'Set Color for All Doors',
          timestamp: Date.now(),
          oldValues: oldColorsAll,
          newValue: value,
          undo: () => {
            undoColorInMap(undoableChangeAll.oldValues as Map<string, string>);
          },
          redo: () => {
            updateColorInMap(undoableChangeAll.oldValues as Map<string, string>, undoableChangeAll.newValue as string);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateColorInMap(oldColorsAll, value);
        setApplyCount(applyCount + 1);
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (door.foundationId) {
          const oldColorsAboveFoundation = new Map<string, string>();
          for (const elem of useStore.getState().elements) {
            if (elem.type === ObjectType.Door && elem.foundationId === door.foundationId && !door.locked) {
              oldColorsAboveFoundation.set(elem.id, elem.color ?? '#ffffff');
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Color for All Doors Above Foundation',
            timestamp: Date.now(),
            oldValues: oldColorsAboveFoundation,
            newValue: value,
            groupId: door.foundationId,
            undo: () => {
              undoColorInMap(undoableChangeAboveFoundation.oldValues as Map<string, string>);
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateColorInMap(
                  undoableChangeAboveFoundation.oldValues as Map<string, string>,
                  undoableChangeAboveFoundation.newValue as string,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateColorInMap(oldColorsAboveFoundation, value);
          setApplyCount(applyCount + 1);
        }
        break;
      case Scope.OnlyThisSide:
        if (door.parentId) {
          const oldColorsOnSameWall = new Map<string, string>();
          for (const elem of useStore.getState().elements) {
            if (elem.type === ObjectType.Door && elem.parentId === door.parentId && !door.locked) {
              oldColorsOnSameWall.set(elem.id, elem.color ?? '#ffffff');
            }
          }
          const undoableChangeOnSameWall = {
            name: 'Set Color for All Doors On the Same Wall',
            timestamp: Date.now(),
            oldValues: oldColorsOnSameWall,
            newValue: value,
            groupId: door.parentId,
            undo: () => {
              undoColorInMap(undoableChangeOnSameWall.oldValues as Map<string, string>);
            },
            redo: () => {
              if (undoableChangeOnSameWall.groupId) {
                updateColorInMap(
                  undoableChangeOnSameWall.oldValues as Map<string, string>,
                  undoableChangeOnSameWall.newValue as string,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeOnSameWall);
          updateColorInMap(oldColorsOnSameWall, value);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        if (door) {
          const updatedDoor = getElementById(door.id) as DoorModel;
          const oldColor = (updatedDoor ? updatedDoor.color : door.color) ?? '#ffffff';
          const undoableChange = {
            name: 'Set Color of Selected Door',
            timestamp: Date.now(),
            oldValue: oldColor,
            newValue: value,
            changedElementId: door.id,
            changedElementType: door.type,
            undo: () => {
              updateColorById(undoableChange.changedElementId, undoableChange.oldValue as string);
            },
            redo: () => {
              updateColorById(undoableChange.changedElementId, undoableChange.newValue as string);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateColorById(door.id, value);
          setApplyCount(applyCount + 1);
        }
    }
    setCommonStore((state) => {
      state.actionState.doorColor = value;
    });
  };

  const onStart = (event: DraggableEvent, uiData: DraggableData) => {
    if (dragRef.current) {
      const { clientWidth, clientHeight } = window.document.documentElement;
      const targetRect = dragRef.current.getBoundingClientRect();
      setBounds({
        left: -targetRect.left + uiData.x,
        right: clientWidth - (targetRect.right - uiData.x),
        top: -targetRect.top + uiData.y,
        bottom: clientHeight - (targetRect?.bottom - uiData.y),
      });
    }
  };

  const close = () => {
    if (door?.color) {
      setSelectedColor(door.color);
    }
    setDialogVisible(false);
  };

  const handleCancel = () => {
    close();
    revertApply();
  };

  const handleOk = () => {
    if (!door) return;
    const updatedDoor = getElementById(door.id) as DoorModel;
    if (updatedDoor && updatedDoor.color !== selectedColor) {
      setColor(selectedColor);
    }
    setDialogVisible(false);
    setApplyCount(0);
  };

  const handleApply = () => {
    setColor(selectedColor);
  };

  return (
    <>
      <Modal
        width={640}
        visible={true}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('word.Color', lang)}
          </div>
        }
        footer={[
          <Button key="Apply" onClick={handleApply}>
            {i18n.t('word.Apply', lang)}
          </Button>,
          <Button key="Cancel" onClick={handleCancel}>
            {i18n.t('word.Cancel', lang)}
          </Button>,
          <Button key="OK" type="primary" ref={okButtonRef} onClick={handleOk}>
            {i18n.t('word.OK', lang)}
          </Button>,
        ]}
        // this must be specified for the x button in the upper-right corner to work
        onCancel={close}
        maskClosable={false}
        destroyOnClose={false}
        modalRender={(modal) => (
          <Draggable disabled={!dragEnabled} bounds={bounds} onStart={(event, uiData) => onStart(event, uiData)}>
            <div ref={dragRef}>{modal}</div>
          </Draggable>
        )}
      >
        <Row gutter={6}>
          <Col className="gutter-row" span={11}>
            <CompactPicker
              color={selectedColor ?? door?.color ?? '#ffffff'}
              onChangeComplete={(colorResult) => {
                setSelectedColor(colorResult.hex);
              }}
            />
          </Col>
          <Col
            className="gutter-row"
            style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
            span={13}
          >
            <Radio.Group onChange={(e) => setActionScope(e.target.value)} value={actionScope}>
              <Space direction="vertical">
                <Radio value={Scope.OnlyThisObject}>{i18n.t('doorMenu.OnlyThisDoor', lang)}</Radio>
                <Radio value={Scope.OnlyThisSide}>{i18n.t('doorMenu.AllDoorsOnWall', lang)}</Radio>
                <Radio value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                  {i18n.t('doorMenu.AllDoorsAboveFoundation', lang)}
                </Radio>
                <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('doorMenu.AllDoors', lang)}</Radio>
              </Space>
            </Radio.Group>
          </Col>
        </Row>
      </Modal>
    </>
  );
};

export default DoorColorSelection;
