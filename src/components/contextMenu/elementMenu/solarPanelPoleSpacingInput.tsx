/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Col, InputNumber, Modal, Radio, RadioChangeEvent, Row, Space } from 'antd';
import Draggable, { DraggableBounds, DraggableData, DraggableEvent } from 'react-draggable';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { SolarPanelModel } from '../../../models/SolarPanelModel';
import { ObjectType, Scope } from '../../../types';
import i18n from '../../../i18n/i18n';
import { UndoableChange } from '../../../undo/UndoableChange';
import { UndoableChangeGroup } from '../../../undo/UndoableChangeGroup';
import { Util } from '../../../Util';

const SolarPanelPoleSpacingInput = ({
  poleSpacingDialogVisible,
  setPoleSpacingDialogVisible,
}: {
  poleSpacingDialogVisible: boolean;
  setPoleSpacingDialogVisible: (b: boolean) => void;
}) => {
  const language = useStore(Selector.language);
  const elements = useStore(Selector.elements);
  const updateSolarPanelPoleSpacingById = useStore(Selector.updateSolarPanelPoleSpacingById);
  const updateSolarPanelPoleSpacingOnSurface = useStore(Selector.updateSolarPanelPoleSpacingOnSurface);
  const updateSolarPanelPoleSpacingAboveFoundation = useStore(Selector.updateSolarPanelPoleSpacingAboveFoundation);
  const updateSolarPanelPoleSpacingForAll = useStore(Selector.updateSolarPanelPoleSpacingForAll);
  const getElementById = useStore(Selector.getElementById);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const addUndoable = useStore(Selector.addUndoable);
  const solarPanelActionScope = useStore(Selector.solarPanelActionScope);
  const setSolarPanelActionScope = useStore(Selector.setSolarPanelActionScope);

  const solarPanel = getSelectedElement() as SolarPanelModel;
  const [inputPoleSpacing, setInputPoleSpacing] = useState<number>(solarPanel?.poleSpacing ?? 0);
  const [updateFlag, setUpdateFlag] = useState<boolean>(false);
  const [dragEnabled, setDragEnabled] = useState<boolean>(false);
  const [bounds, setBounds] = useState<DraggableBounds>({ left: 0, top: 0, bottom: 0, right: 0 } as DraggableBounds);
  const dragRef = useRef<HTMLDivElement | null>(null);

  const lang = { lng: language };

  useEffect(() => {
    if (solarPanel) {
      setInputPoleSpacing(solarPanel.poleSpacing);
    }
  }, [solarPanel]);

  const onScopeChange = (e: RadioChangeEvent) => {
    setSolarPanelActionScope(e.target.value);
    setUpdateFlag(!updateFlag);
  };

  const setPoleSpacing = (value: number) => {
    switch (solarPanelActionScope) {
      case Scope.AllObjectsOfThisType:
        const oldPoleSpacingsAll = new Map<string, number>();
        for (const elem of elements) {
          if (elem.type === ObjectType.SolarPanel) {
            oldPoleSpacingsAll.set(elem.id, (elem as SolarPanelModel).poleSpacing);
          }
        }
        const undoableChangeAll = {
          name: 'Set Pole Spacing for All Solar Panel Arrays',
          timestamp: Date.now(),
          oldValues: oldPoleSpacingsAll,
          newValue: value,
          undo: () => {
            for (const [id, ps] of undoableChangeAll.oldValues.entries()) {
              updateSolarPanelPoleSpacingById(id, ps as number);
            }
          },
          redo: () => {
            updateSolarPanelPoleSpacingForAll(undoableChangeAll.newValue as number);
          },
        } as UndoableChangeGroup;
        addUndoable(undoableChangeAll);
        updateSolarPanelPoleSpacingForAll(value);
        break;
      case Scope.AllObjectsOfThisTypeAboveFoundation:
        if (solarPanel.foundationId) {
          const oldPoleSpacingsAboveFoundation = new Map<string, number>();
          for (const elem of elements) {
            if (elem.type === ObjectType.SolarPanel && elem.foundationId === solarPanel.foundationId) {
              oldPoleSpacingsAboveFoundation.set(elem.id, (elem as SolarPanelModel).poleSpacing);
            }
          }
          const undoableChangeAboveFoundation = {
            name: 'Set Pole Spacing for All Solar Panel Arrays Above Foundation',
            timestamp: Date.now(),
            oldValues: oldPoleSpacingsAboveFoundation,
            newValue: value,
            groupId: solarPanel.foundationId,
            undo: () => {
              for (const [id, ps] of undoableChangeAboveFoundation.oldValues.entries()) {
                updateSolarPanelPoleSpacingById(id, ps as number);
              }
            },
            redo: () => {
              if (undoableChangeAboveFoundation.groupId) {
                updateSolarPanelPoleSpacingAboveFoundation(
                  undoableChangeAboveFoundation.groupId,
                  undoableChangeAboveFoundation.newValue as number,
                );
              }
            },
          } as UndoableChangeGroup;
          addUndoable(undoableChangeAboveFoundation);
          updateSolarPanelPoleSpacingAboveFoundation(solarPanel.foundationId, value);
        }
        break;
      case Scope.AllObjectsOfThisTypeOnSurface:
        if (solarPanel.parentId) {
          const parent = getElementById(solarPanel.parentId);
          if (parent) {
            const oldPoleSpacingsOnSurface = new Map<string, number>();
            const isParentCuboid = parent.type === ObjectType.Cuboid;
            if (isParentCuboid) {
              for (const elem of elements) {
                if (
                  elem.type === ObjectType.SolarPanel &&
                  elem.parentId === solarPanel.parentId &&
                  Util.isIdentical(elem.normal, solarPanel.normal)
                ) {
                  oldPoleSpacingsOnSurface.set(elem.id, (elem as SolarPanelModel).poleSpacing);
                }
              }
            } else {
              for (const elem of elements) {
                if (elem.type === ObjectType.SolarPanel && elem.parentId === solarPanel.parentId) {
                  oldPoleSpacingsOnSurface.set(elem.id, (elem as SolarPanelModel).poleSpacing);
                }
              }
            }
            const normal = isParentCuboid ? solarPanel.normal : undefined;
            const undoableChangeOnSurface = {
              name: 'Set Pole Spacing for All Solar Panel Arrays on Surface',
              timestamp: Date.now(),
              oldValues: oldPoleSpacingsOnSurface,
              newValue: value,
              groupId: solarPanel.parentId,
              normal: normal,
              undo: () => {
                for (const [id, ps] of undoableChangeOnSurface.oldValues.entries()) {
                  updateSolarPanelPoleSpacingById(id, ps as number);
                }
              },
              redo: () => {
                if (undoableChangeOnSurface.groupId) {
                  updateSolarPanelPoleSpacingOnSurface(
                    undoableChangeOnSurface.groupId,
                    undoableChangeOnSurface.normal,
                    undoableChangeOnSurface.newValue as number,
                  );
                }
              },
            } as UndoableChangeGroup;
            addUndoable(undoableChangeOnSurface);
            updateSolarPanelPoleSpacingOnSurface(solarPanel.parentId, normal, value);
          }
        }
        break;
      default:
        if (solarPanel) {
          const oldPoleSpacing = solarPanel.poleSpacing;
          const undoableChange = {
            name: 'Set Solar Panel Array Pole Spacing',
            timestamp: Date.now(),
            oldValue: oldPoleSpacing,
            newValue: value,
            undo: () => {
              updateSolarPanelPoleSpacingById(solarPanel.id, undoableChange.oldValue as number);
            },
            redo: () => {
              updateSolarPanelPoleSpacingById(solarPanel.id, undoableChange.newValue as number);
            },
          } as UndoableChange;
          addUndoable(undoableChange);
          updateSolarPanelPoleSpacingById(solarPanel.id, value);
          setUpdateFlag(!updateFlag);
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
        visible={poleSpacingDialogVisible}
        title={
          <div
            style={{ width: '100%', cursor: 'move' }}
            onMouseOver={() => setDragEnabled(true)}
            onMouseOut={() => setDragEnabled(false)}
          >
            {i18n.t('solarPanelMenu.PoleSpacing', lang)}
          </div>
        }
        footer={[
          <Button
            key="Apply"
            onClick={() => {
              setPoleSpacing(inputPoleSpacing);
            }}
          >
            {i18n.t('word.Apply', lang)}
          </Button>,
          <Button
            key="Cancel"
            onClick={() => {
              setInputPoleSpacing(solarPanel.poleSpacing);
              setPoleSpacingDialogVisible(false);
            }}
          >
            {i18n.t('word.Cancel', lang)}
          </Button>,
          <Button
            key="OK"
            type="primary"
            onClick={() => {
              setPoleSpacing(inputPoleSpacing);
              setPoleSpacingDialogVisible(false);
            }}
          >
            {i18n.t('word.OK', lang)}
          </Button>,
        ]}
        // this must be specified for the x button at the upper-right corner to work
        onCancel={() => {
          setInputPoleSpacing(solarPanel.poleSpacing);
          setPoleSpacingDialogVisible(false);
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
              max={10}
              step={1}
              style={{ width: 120 }}
              precision={2}
              value={inputPoleSpacing}
              formatter={(a) => Number(a).toFixed(2)}
              onChange={(value) => setInputPoleSpacing(value)}
              onPressEnter={(event) => {
                setPoleSpacing(inputPoleSpacing);
                setPoleSpacingDialogVisible(false);
              }}
            />
            <div style={{ paddingTop: '20px', textAlign: 'left', fontSize: '11px' }}>
              {i18n.t('word.Range', lang)}: [1, 10] {i18n.t('word.MeterAbbreviation', lang)}
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
            <Radio.Group onChange={onScopeChange} value={solarPanelActionScope}>
              <Space direction="vertical">
                <Radio value={Scope.OnlyThisObject}>{i18n.t('solarPanelMenu.OnlyThisSolarPanel', lang)}</Radio>
                <Radio value={Scope.AllObjectsOfThisTypeOnSurface}>
                  {i18n.t('solarPanelMenu.AllSolarPanelsOnSurface', lang)}
                </Radio>
                <Radio value={Scope.AllObjectsOfThisTypeAboveFoundation}>
                  {i18n.t('solarPanelMenu.AllSolarPanelsAboveFoundation', lang)}
                </Radio>
                <Radio value={Scope.AllObjectsOfThisType}>{i18n.t('solarPanelMenu.AllSolarPanels', lang)}</Radio>
              </Space>
            </Radio.Group>
          </Col>
        </Row>
      </Modal>
    </>
  );
};

export default SolarPanelPoleSpacingInput;
