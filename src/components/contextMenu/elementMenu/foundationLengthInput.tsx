/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, InputNumber, Modal, Radio, RadioChangeEvent, Row, Space } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { ObjectType, Scope } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableChange } from '../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';
import { FoundationModel } from '../../../models/FoundationModel';
import { Util } from '../../../Util';
import { ElementModel } from '../../../models/ElementModel';
import { Vector2 } from 'three';

const FoundationLengthInput = ({
  lengthDialogVisible,
  setLengthDialogVisible,
}: {
  lengthDialogVisible: boolean;
  setLengthDialogVisible: (b: boolean) => void;
}) => {
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const updateElementLyById = useStore(Selector.updateElementLyById);
  const updateElementLyForAll = useStore(Selector.updateElementLyForAll);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const addUndoable = useStore(Selector.addUndoable);
  const foundationActionScope = useStore(Selector.foundationActionScope);
  const setFoundationActionScope = useStore(Selector.setFoundationActionScope);

  const foundation = getSelectedElement() as FoundationModel;
  const [inputLy, setInputLy] = useState<number>(foundation?.ly ?? 0);
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const rejectRef = useRef<boolean>(false);
  const rejectedValue = useRef<number | undefined>();

  const lang = { lng: language };

  useEffect(() => {
    if (foundation) {
      setInputLy(foundation.ly);
    }
  }, [foundation]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setFoundationActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const containsAllChildren = (ly: number) => {
    if (foundation) {
      const children: ElementModel[] = [];
      for (const c of elements) {
        if (c.parentId === foundation.id) {
          children.push(c);
        }
      }
      if (children.length === 0) {
        return true;
      }
      const oldFoundationCenter = new Vector2(foundation.cx, foundation.cy);
      const newFoundationCenter = new Vector2(foundation.cx, foundation.cy + (ly - foundation.ly) / 2);
      const childAbsPosMap = new Map<string, Vector2>();
      const v0 = new Vector2(0, 0);
      for (const c of children) {
        switch (c.type) {
          case ObjectType.Wall:
            // TODO
            break;
          case ObjectType.SolarPanel:
          case ObjectType.Sensor:
            const absPos = new Vector2(c.cx * foundation.lx, c.cy * foundation.ly).rotateAround(
              v0,
              foundation.rotation[2],
            );
            absPos.add(oldFoundationCenter);
            childAbsPosMap.set(c.id, absPos);
            break;
        }
      }
      const childrenClone: ElementModel[] = [];
      for (const c of children) {
        const childClone = JSON.parse(JSON.stringify(c));
        childrenClone.push(childClone);
        const childAbsPos = childAbsPosMap.get(c.id);
        if (childAbsPos) {
          const relativePos = new Vector2()
            .subVectors(childAbsPos, newFoundationCenter)
            .rotateAround(v0, -c.rotation[2]);
          childClone.cy = relativePos.y / ly;
        }
      }
      const parentClone = JSON.parse(JSON.stringify(foundation)) as FoundationModel;
      parentClone.ly = ly;
      return Util.doesParentContainAllChildren(parentClone, childrenClone);
    }
    return false;
  };

  const rejectChange = (ly: number) => {
    // check if the new length will still contain all children
    if (!containsAllChildren(ly)) {
      return true;
    }
    // other check?
    return false;
  };

  const setLy = (value: number) => {
    rejectedValue.current = undefined;
    switch (foundationActionScope) {
      case Scope.AllObjectsOfThisType:
        const oldLysAll = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Foundation) {
            oldLysAll.set(elem.id, elem.ly);
          }
        }
        const undoableChangeAll = {
          name: 'Set Length for All Foundations',
          timestamp: Date.now(),
          oldValues: oldLysAll,
          newValue: value,
          undo: () => {
            for (const [id, ly] of undoableChangeAll.oldValues.entries()) {
              updateElementLyById(id, ly as number);
            }
          },
          redo: () => {
            updateElementLyForAll(ObjectType.Foundation, undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateElementLyForAll(ObjectType.Foundation, value);
        break;
      default:
        if (foundation) {
          const oldLy = foundation.ly;
          rejectRef.current = rejectChange(value);
          if (rejectRef.current) {
            rejectedValue.current = value;
            setInputLy(oldLy);
          } else {
            const undoableChange = {
              name: 'Set Foundation Length',
              timestamp: Date.now(),
              oldValue: oldLy,
              newValue: value,
              undo: () => {
                updateElementLyById(foundation.id, undoableChange.oldValue as number);
              },
              redo: () => {
                updateElementLyById(foundation.id, undoableChange.newValue as number);
              },
            } as UndoableChange;
            addUndoable(undoableChange);
            updateElementLyById(foundation.id, value);
          }
        }
    }
    setUpdateFlag(!updateFlag);
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

  return (
    <>
      <Modal
        width={550}
        visible={lengthDialogVisible}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('word.Length', lang)}
            <label style={{ color: 'red', fontWeight: 'bold' }}>
              {rejectRef.current
                ? ': ' +
                  i18n.t('shared.NotApplicableToSelectedAction', lang) +
                  (rejectedValue.current !== undefined ? ' (' + rejectedValue.current.toFixed(2) + ')' : '')
                : ''}
            </label>
          </div>
        }
        footer={[
          <Button
            key="Apply"
            onClick={() => {
              setLy(inputLy);
            }}
          >
            {i18n.t('word.Apply', lang)}
          </Button>,
          <Button
            key="Cancel"
            onClick={() => {
              setInputLy(foundation?.ly);
              rejectRef.current = false;
              setLengthDialogVisible(false);
            }}
          >
            {i18n.t('word.Cancel', lang)}
          </Button>,
          <Button
            key="OK"
            type="primary"
            onClick={() => {
              setLy(inputLy);
              if (!rejectRef.current) {
                setLengthDialogVisible(false);
              }
            }}
          >
            {i18n.t('word.OK', lang)}
          </Button>,
        ]}
        // this must be specified for the x button in the upper-right corner to work
        onCancel={() => {
          setInputLy(foundation?.ly);
          rejectRef.current = false;
          setLengthDialogVisible(false);
        }}
        destroyOnClose={false}
        modalRender={(modal) => (
          <Draggable disabled={!dragEnabled} bounds={bounds} onStart={(event, uiData) => onStart(event, uiData)}>
            <div ref={dragRef}>{modal}</div>
          </Draggable>
        )}
      >
        <Row gutter={6}>
          <Col className="gutter-row" span={6}>
            <InputNumber
              min={1}
              max={1000}
              style={{ width: 120 }}
              step={0.5}
              precision={1}
              value={inputLy}
              formatter={(a) => Number(a).toFixed(1)}
              onChange={(value) => setInputLy(value)}
              onPressEnter={() => {
                setLy(inputLy);
                if (!rejectRef.current) {
                  setLengthDialogVisible(false);
                }
              }}
            />
            <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
              {i18n.t('word.Range', lang)}: [1, 1000] {i18n.t('word.MeterAbbreviation', lang)}
            </div>
          </Col>
          <Col className="gutter-row" span={1} style={{ verticalAlign: 'middle', paddingTop: '6px' }}>
            {i18n.t('word.MeterAbbreviation', lang)}
          </Col>
          <Col
            className="gutter-row"
            style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
            span={16}
          >
            <Radio.Group onChange={onScopeChange} value={foundationActionScope}>
              <Space direction="vertical">
                <Radio value={Scope.OnlyThisObject}>{i18n.t('foundationMenu.OnlyThisFoundation', lang)}</Radio>
                <Radio value={Scope.AllConnectedObjects}>
                  {i18n.t('foundationMenu.AllConnectedFoundations', lang)}
                </Radio>
                <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('foundationMenu.AllFoundations', lang)}</Radio>
              </Space>
            </Radio.Group>
          </Col>
        </Row>
      </Modal>
    </>
  );
};

export default FoundationLengthInput;
