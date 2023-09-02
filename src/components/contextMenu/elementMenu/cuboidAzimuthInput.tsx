/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Col, InputNumber, Radio, RadioChangeEvent, Row, Space } from 'antd';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { ObjectType, Scope } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableChange } from '../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';
import { Util } from '../../../Util';
import { CuboidModel } from '../../../models/CuboidModel';
import { ZERO_TOLERANCE } from '../../../constants';
import { useSelectedElement } from './menuHooks';
import Dialog from '../dialog';
import { useLanguage } from 'src/views/hooks';

const CuboidAzimuthInput = ({ setDialogVisible }: { setDialogVisible: (b: boolean) => void }) => {
  const elements = useStore(Selector.elements);
  const getElementById = useStore(Selector.getElementById);
  const updateElementRotationById = useStore(Selector.updateElementRotationById);
  const addUndoable = useStore(Selector.addUndoable);
  const actionScope = useStore(Selector.cuboidActionScope);
  const setActionScope = useStore(Selector.setCuboidActionScope);
  const applyCount = useStore(Selector.applyCount);
  const setApplyCount = useStore(Selector.setApplyCount);

  const cuboid = useSelectedElement(ObjectType.Cuboid) as CuboidModel | undefined;

  // reverse the sign because rotation angle is positive counterclockwise whereas azimuth is positive clockwise
  const [inputValue, setInputValue] = useState<number>(cuboid ? -cuboid.rotation[2] ?? 0 : 0);

  const lang = useLanguage();

  const onScopeChange = (e: RadioChangeEvent) => {
    setActionScope(e.target.value);
  };

  const updateOnSurface = (value: number) => {
    for (const e of elements) {
      if (e.type === ObjectType.Cuboid && !e.locked && e.parentId === cuboid?.parentId) {
        updateElementRotationById(e.id, 0, 0, -value);
      }
    }
  };

  const needChange = (azimuth: number) => {
    switch (actionScope) {
      case Scope.AllObjectsOfThisTypeOnSurface:
        for (const e of elements) {
          if (e.type === ObjectType.Cuboid && e.parentId === cuboid?.parentId && !e.locked) {
            const c = e as CuboidModel;
            if (Math.abs(-c.rotation[2] - azimuth) > ZERO_TOLERANCE) {
              return true;
            }
          }
        }
        break;
      case Scope.AllObjectsOfThisType:
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        // should list here, so it doesn't go to default, but ignore
        break;
      default:
        if (Math.abs((cuboid ? -cuboid.rotation[2] ?? 0 : 0) - azimuth) > ZERO_TOLERANCE) {
          return true;
        }
    }
    return false;
  };

  const setAzimuth = (value: number) => {
    if (!cuboid) return;
    if (!needChange(value)) return;
    switch (actionScope) {
      case Scope.AllObjectsOfThisTypeOnSurface:
        const oldAzimuthsAll = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.Cuboid && elem.parentId === cuboid.parentId && !elem.locked) {
            oldAzimuthsAll.set(elem.id, -elem.rotation[2]);
          }
        }
        const undoableChangeAll = {
          name: 'Set Azimuth for All Cuboids on Surface',
          timestamp: Date.now(),
          oldValues: oldAzimuthsAll,
          newValue: value,
          undo: () => {
            for (const [id, az] of undoableChangeAll.oldValues.entries()) {
              updateElementRotationById(id, 0, 0, -(az as number));
            }
          },
          redo: () => {
            updateOnSurface(undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateOnSurface(value);
        setApplyCount(applyCount + 1);
        break;
      case Scope.AllObjectsOfThisType:
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        // should list here, so it doesn't go to default, but ignore
        break;
      default:
        // cuboid via selected element may be outdated, make sure that we get the latest
        const c = getElementById(cuboid.id);
        const oldAzimuth = c ? -c.rotation[2] : -cuboid.rotation[2];
        const undoableChange = {
          name: 'Set Cuboid Azimuth',
          timestamp: Date.now(),
          oldValue: oldAzimuth,
          newValue: value,
          changedElementId: cuboid.id,
          changedElementType: cuboid.type,
          undo: () => {
            updateElementRotationById(undoableChange.changedElementId, 0, 0, -(undoableChange.oldValue as number));
          },
          redo: () => {
            updateElementRotationById(undoableChange.changedElementId, 0, 0, -(undoableChange.newValue as number));
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        updateElementRotationById(cuboid.id, 0, 0, -value);
        setApplyCount(applyCount + 1);
    }
  };

  const close = () => {
    setDialogVisible(false);
  };

  const apply = () => {
    setAzimuth(inputValue);
  };

  return (
    <Dialog width={550} title={i18n.t('word.Azimuth', lang)} onApply={apply} onClose={close}>
      <Row gutter={6}>
        <Col className="gutter-row" span={7}>
          <InputNumber
            min={-180}
            max={180}
            style={{ width: 120 }}
            step={0.5}
            precision={2}
            // make sure that we round up the number because toDegrees may cause things like .999999999
            value={parseFloat(Util.toDegrees(inputValue).toFixed(2))}
            formatter={(value) => `${value}°`}
            onChange={(value) => {
              setInputValue(Util.toRadians(value));
            }}
          />
          <div style={{ paddingTop: '20px', paddingRight: '6px', textAlign: 'left', fontSize: '11px' }}>
            {i18n.t('word.Range', lang)}: [-180°, 180°]
            <br />
            {i18n.t('message.AzimuthOfNorthIsZero', lang)}
            <br />
            {i18n.t('message.CounterclockwiseAzimuthIsPositive', lang)}
          </div>
        </Col>
        <Col
          className="gutter-row"
          style={{ border: '2px dashed #ccc', paddingTop: '8px', paddingLeft: '12px', paddingBottom: '8px' }}
          span={17}
        >
          <Radio.Group onChange={onScopeChange} value={actionScope}>
            <Space direction="vertical">
              <Radio value={Scope.OnlyThisObject}>{i18n.t('cuboidMenu.OnlyThisCuboid', lang)}</Radio>
              <Radio value={Scope.AllObjectsOfThisTypeOnSurface}>
                {i18n.t('cuboidMenu.AllCuboidsOnSameSurface', lang)}
              </Radio>
            </Space>
          </Radio.Group>
        </Col>
      </Row>
    </Dialog>
  );
};

export default CuboidAzimuthInput;
