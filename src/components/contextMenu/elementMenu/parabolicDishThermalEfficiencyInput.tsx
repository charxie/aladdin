/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, InputNumber, Modal, Radio, RadioChangeEvent, Row, Space } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { ParabolicDishModel } from '../../../models/ParabolicDishModel';
import { ObjectType, Scope } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableChange } from '../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';
import { ZERO_TOLERANCE } from '../../../constants';

const ParabolicDishThermalEfficiencyInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const updateById = useStore(Selector.updateParabolicCollectorThermalEfficiencyById);
  const updateAboveFoundation = useStore(Selector.updateParabolicCollectorThermalEfficiencyAboveFoundation);
  const updateForAll = useStore(Selector.updateParabolicCollectorThermalEfficiencyForAll);
  const parabolicDish = useStore(Selector.selectedElement) as ParabolicDishModel;
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.parabolicDishActionScope);
  const setActionScope = useStore(Selector.setParabolicDishActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);
  const revertApply = useStore(Selector.revertApply);

  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);
  const inputThermalEfficiencyRef = useRef<number>(parabolicDish?.thermalEfficiency ?? 0.3);

  const lang = { lng: language };

  useEffect(() => {
    if (parabolicDish) {
      inputThermalEfficiencyRef.current = parabolicDish.thermalEfficiency;
    }
  }, [parabolicDish]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const needChange = (thermalEfficiency: number) => {
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        for (const e of elements) {
          if (e.type === ObjectType.ParabolicDish && !e.locked) {
            const pt = e as ParabolicDishModel;
            if (Math.abs(pt.thermalEfficiency - thermalEfficiency) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        for (const e of elements) {
          if (e.type === ObjectType.ParabolicDish && e.foundationId === parabolicDish?.foundationId && !e.locked) {
            const pt = e as ParabolicDishModel;
            if (Math.abs(pt.thermalEfficiency - thermalEfficiency) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      default:
        if (Math.abs(parabolicDish?.thermalEfficiency - thermalEfficiency) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const setThermalEfficiency = (value: number) => {
    if (!parabolicDish) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllObjectsOfThisType:
        const oldThermalEfficienciesAll = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.ParabolicDish) {
            oldThermalEfficienciesAll.set(elem.id, (elem as ParabolicDishModel).thermalEfficiency);
          }
        }
        const undoableChangeAll = {
          name: 'Set Thermal Efficiency for All Parabolic Dishes',
          timestamp: Date.now(),
          oldValues: oldThermalEfficienciesAll,
          newValue: value,
          undo: () => {
            for (const [id, ab] of undoableChangeAll.oldValues.entries()) {
              updateById(id, ab as number);
            }
          },
          redo: () => {
            updateForAll(ObjectType.ParabolicDish, undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateForAll(ObjectType.ParabolicDish, value);
        setApplyCount(applyCount + 1);
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (parabolicDish.foundationId) {
          const oldThermalEfficienciesAboveFoundation = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.ParabolicDish && elem.foundationId === parabolicDish.foundationId) {
              oldThermalEfficienciesAboveFoundation.set(elem.id, (elem as ParabolicDishModel).thermalEfficiency);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Thermal Efficiency for All Parabolic Dishes Above Foundation',
            timestamp: Date.now(),
            oldValues: oldThermalEfficienciesAboveFoundation,
            newValue: value,
            groupId: parabolicDish.foundationId,
            undo: () => {
              for (const [id, ab] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateById(id, ab as number);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateAboveFoundation(
                  ObjectType.ParabolicDish,
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as number,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateAboveFoundation(ObjectType.ParabolicDish, parabolicDish.foundationId, value);
          setApplyCount(applyCount + 1);
        }
        break;
      default:
        const p = getElementById(parabolicDish.id) as ParabolicDishModel;
        const oldThermalEfficiency = p ? p.thermalEfficiency : parabolicDish.thermalEfficiency;
        const undoableChange = {
          name: 'Set Parabolic Dish Thermal Efficiency',
          timestamp: Date.now(),
          oldValue: oldThermalEfficiency,
          newValue: value,
          changedElementId: parabolicDish.id,
          changedElementType: parabolicDish.type,
          undo: () => {
            updateById(undoableChange.changedElementId, undoableChange.oldValue as number);
          },
          redo: () => {
            updateById(undoableChange.changedElementId, undoableChange.newValue as number);
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateById(parabolicDish.id, value);
        setApplyCount(applyCount + 1);
    }
    setCommonStore((state) => {
      state.actionState.parabolicDishThermalEfficiency = value;
    });
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

  const close = () => {
    inputThermalEfficiencyRef.current = parabolicDish.thermalEfficiency;
    setDialogVisible(false);
  };

  const cancel = () => {
    close();
    revertApply();
  };

  const ok = () => {
    setThermalEfficiency(inputThermalEfficiencyRef.current);
    setDialogVisible(false);
    setApplyCount(0);
  };

  return parabolicDish?.type === ObjectType.ParabolicDish ? (
    <>
      <Modal
        width={600}
        visible={true}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('concentratedSolarPowerCollectorMenu.ReceiverThermalEfficiency', lang)}
          </div>
        }
        footer={[
          <Button
            key="Apply"
            onClick={() => {
              setThermalEfficiency(inputThermalEfficiencyRef.current);
            }}
          >
            {i18n.t('word.Apply', lang)}
          </Button>,
          <Button key="Cancel" onClick={cancel}>
            {i18n.t('word.Cancel', lang)}
          </Button>,
          <Button key="OK" type="primary" onClick={ok}>
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
          <Col className="gutter-row" span={7}>
            <InputNumber
              min={0}
              max={1}
              style={{ width: 120 }}
              precision={2}
              step={0.01}
              value={inputThermalEfficiencyRef.current}
              onChange={(value) => {
                inputThermalEfficiencyRef.current = value;
                setUpdateFlag(!updateFlag);
              }}
              onPressEnter={ok}
            />
            <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
              {i18n.t('word.Range', lang)}: [0, 1]
            </div>
          </Col>
          <Col
            className="gutter-row"
            style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
            span={17}
          >
            <Radio.Group onChange={onScopeChange} value={actionScope}>
              <Space direction="vertical">
                <Radio value={Scope.OnlyThisObject}>{i18n.t('parabolicDishMenu.OnlyThisParabolicDish', lang)}</Radio>
                <Radio value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                  {i18n.t('parabolicDishMenu.AllParabolicDishesAboveFoundation', lang)}
                </Radio>
                <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('parabolicDishMenu.AllParabolicDishes', lang)}</Radio>
              </Space>
            </Radio.Group>
          </Col>
        </Row>
      </Modal>
    </>
  ) : (
    <></>
  );
};

export default ParabolicDishThermalEfficiencyInput;
