/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Menu } from 'antd';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import i18n from '../../../i18n/i18n';
import { PolygonModel } from '../../../models/PolygonModel';
import { UndoableChange } from '../../../undo/UndoableChange';
import { Point2 } from '../../../models/Point2';
import { PolygonVertexAction } from '../../../types';

export const PolygonVertexMenu = () => {
  const language = useStore(Selector.language);
  const getSelectedElement = useStore(Selector.getSelectedElement);
  const deletePolygonVertexByIndex = useStore(Selector.deletePolygonVertexByIndex);
  const insertPolygonVertexBeforeIndex = useStore(Selector.insertPolygonVertexBeforeIndex);
  const insertPolygonVertexAfterIndex = useStore(Selector.insertPolygonVertexAfterIndex);
  const updatePolygonVerticesById = useStore(Selector.updatePolygonVerticesById);
  const addUndoable = useStore(Selector.addUndoable);

  const polygon = getSelectedElement() as PolygonModel;
  const lang = { lng: language };

  const insertVertexBeforeIndex = () => {
    changeVertex(PolygonVertexAction.InsertBeforeIndex);
  };

  const insertVertexAfterIndex = () => {
    changeVertex(PolygonVertexAction.InsertAfterIndex);
  };

  const deleteVertex = () => {
    changeVertex(PolygonVertexAction.Delete);
  };

  const changeVertex = (action: PolygonVertexAction) => {
    if (polygon && polygon.selectedIndex >= 0) {
      const oldVertices = polygon.vertices.map((a) => ({ ...a })); // deep copy
      switch (action) {
        case PolygonVertexAction.Delete:
          deletePolygonVertexByIndex(polygon.id, polygon.selectedIndex);
          break;
        case PolygonVertexAction.InsertBeforeIndex:
          insertPolygonVertexBeforeIndex(polygon.id, polygon.selectedIndex);
          break;
        case PolygonVertexAction.InsertAfterIndex:
          insertPolygonVertexAfterIndex(polygon.id, polygon.selectedIndex);
          break;
      }
      const newVertices = (useStore.getState().getSelectedElement() as PolygonModel).vertices.map((a) => ({ ...a }));
      const undoableChange = {
        name: action,
        timestamp: Date.now(),
        oldValue: oldVertices,
        newValue: newVertices,
        undo: () => {
          if (undoableChange.oldValue && Array.isArray(undoableChange.oldValue)) {
            updatePolygonVerticesById(polygon.id, oldVertices as Point2[]);
          }
        },
        redo: () => {
          updatePolygonVerticesById(polygon.id, newVertices as Point2[]);
        },
      } as UndoableChange;
      addUndoable(undoableChange);
    }
  };

  return (
    <>
      <Menu.Item key={'polygon-vertex-insert-before-index'} onClick={insertVertexBeforeIndex}>
        {i18n.t('polygonMenu.InsertVertexBeforeIndex', lang)}
      </Menu.Item>
      <Menu.Item key={'polygon-vertex-insert-after-index'} onClick={insertVertexAfterIndex}>
        {i18n.t('polygonMenu.InsertVertexAfterIndex', lang)}
      </Menu.Item>
      {polygon && polygon.vertices.length > 3 && (
        <Menu.Item key={'polygon-vertex-delete'} onClick={deleteVertex}>
          {i18n.t('polygonMenu.DeleteVertex', lang)}
        </Menu.Item>
      )}
    </>
  );
};
