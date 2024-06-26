/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { Util } from 'src/Util';
import { Object3D, Object3DEventMap, Vector3 } from 'three';
import { RoofSegmentGroupUserData } from '../roof/roofRenderer';
import { useStore } from 'src/stores/common';
import { HALF_PI } from 'src/constants';
import { Operation, SurfaceType } from './refSolarPanel';
import { ObjectType, Orientation, TrackerType } from 'src/types';
import { SolarPanelModel } from 'src/models/SolarPanelModel';
import { UndoableMove } from 'src/undo/UndoableMove';
import { UnoableResizeSolarPanel } from 'src/undo/UndoableResize';
import { UndoableChange } from 'src/undo/UndoableChange';

export class SolarPanelUtil {
  static setSelected(id: string, b: boolean) {
    useStore.getState().set((state) => {
      if (!state.multiSelectionsMode) {
        if (b) {
          state.selectedElement = state.elements.find((e) => e.id === id) ?? null;
          state.selectedElementIdSet.clear();
          state.selectedElementIdSet.add(id);
        } else {
          if (state.selectedElement?.id === id) {
            state.selectedElement = null;
          }
          if (state.selectedElementIdSet.has(id)) {
            state.selectedElementIdSet.delete(id);
          }
        }
      }
    });
  }

  static getSurfaceType(parentType?: ObjectType, normal?: Vector3) {
    if (!normal || !parentType) return SurfaceType.Horizontal;
    if (parentType === ObjectType.Wall) {
      return SurfaceType.Vertical;
    } else if (Util.isEqual(normal.z, 1)) {
      return SurfaceType.Horizontal;
    } else if (parentType === ObjectType.Cuboid) {
      return SurfaceType.Vertical;
    } else {
      return SurfaceType.Inclined;
    }
  }

  static findParentGroup(obj: Object3D<Object3DEventMap>, names: string[]): Object3D<Object3DEventMap> | null {
    const parent = obj.parent;
    if (!parent) return null;
    for (const name of names) {
      if (parent.name.includes(name)) return parent;
    }
    return SolarPanelUtil.findParentGroup(parent, names);
  }

  static getRoofId(object: Object3D<Object3DEventMap> | null): string | null {
    if (!object) return null;
    const roofId = object.userData.roofId as string;
    if (roofId) return roofId;
    return SolarPanelUtil.getRoofId(object.parent);
  }

  static getRoofSegmentData(object: Object3D<Object3DEventMap> | null): RoofSegmentGroupUserData | null {
    if (!object) return null;
    const { roofId, foundation, centroid, roofSegments } = object.userData;
    if (!roofId || !foundation || !centroid || !roofSegments) return SolarPanelUtil.getRoofSegmentData(object.parent);
    return { roofId, foundation, centroid, roofSegments } as RoofSegmentGroupUserData;
  }

  static getRelativeAzimuth(angle: number) {
    if (angle > Math.PI) return angle - Math.PI * 2;
    if (angle < -Math.PI) return angle + Math.PI * 2;
    return angle;
  }

  static isTrackerEnabled(surfaceType: SurfaceType, trackerType: TrackerType) {
    return surfaceType === SurfaceType.Horizontal && trackerType !== TrackerType.NO_TRACKER;
  }

  static getUnitSize(orientation: Orientation, moduleLength: number, moduleWidth: number) {
    if (orientation === Orientation.landscape) {
      return { length: moduleLength, width: moduleWidth };
    } else {
      return { length: moduleWidth, width: moduleLength };
    }
  }

  static getRotationOnCuboid(normal: Vector3) {
    const { x, y, z } = normal;
    // top face
    if (Util.isEqual(z, 1)) {
      return [0, 0, 0];
    }
    // north face
    if (Util.isEqual(x, 0) && Util.isEqual(y, 1)) {
      return [HALF_PI, 0, Math.PI];
    }
    // south face
    else if (Util.isEqual(x, 0) && Util.isEqual(y, -1)) {
      return [HALF_PI, 0, 0];
    }
    // west face
    else if (Util.isEqual(x, -1) && Util.isEqual(y, 0)) {
      return [HALF_PI, 0, -HALF_PI];
    }
    // east face
    else if (Util.isEqual(x, 1) && Util.isEqual(y, 0)) {
      return [HALF_PI, 0, HALF_PI];
    }
    return [0, 0, 0];
  }

  static addUndoable(oldElement: SolarPanelModel | undefined, operation: Operation) {
    if (!oldElement) return;

    switch (operation) {
      case Operation.Move: {
        SolarPanelUtil.addUndoableMove(oldElement);
        break;
      }
      case Operation.ResizeX:
      case Operation.ResizeY: {
        SolarPanelUtil.addUndoableResize(oldElement);
        break;
      }
      case Operation.RotateLower:
      case Operation.RotateUpper: {
        SolarPanelUtil.addUndoableRotate(oldElement);
        break;
      }
      case Operation.Tilt: {
        SolarPanelUtil.addUndoableTilt(oldElement);
        break;
      }
    }
  }

  static addUndoableMove(oldElement: SolarPanelModel) {
    const newElement = useStore
      .getState()
      .elements.find((e) => e.id === oldElement.id && e.type === ObjectType.SolarPanel) as SolarPanelModel;
    if (!newElement) return;

    const undoableMove = {
      name: 'Move',
      timestamp: Date.now(),
      movedElementId: newElement.id,
      movedElementType: newElement.type,
      oldCx: oldElement.cx,
      oldCy: oldElement.cy,
      oldCz: oldElement.cz,
      newCx: newElement.cx,
      newCy: newElement.cy,
      newCz: newElement.cz,
      oldParentType: oldElement.parentType,
      newParentType: newElement.parentType,
      oldParentId: oldElement.parentId,
      newParentId: newElement.parentId,
      oldFoundationId: oldElement.foundationId,
      newFoundationId: newElement.foundationId,
      oldNormal: new Vector3().fromArray(oldElement.normal),
      newNormal: new Vector3().fromArray(newElement.normal),
      oldRotation: [...oldElement.rotation],
      newRotation: [...newElement.rotation],
      undo() {
        setUndoRedoMove(
          this.movedElementId,
          [this.oldCx, this.oldCy, this.oldCz],
          this.oldParentId,
          this.oldFoundationId,
          this.oldParentType,
          this.oldRotation,
          this.oldNormal,
        );
      },
      redo() {
        setUndoRedoMove(
          this.movedElementId,
          [this.newCx, this.newCy, this.newCz],
          this.newParentId,
          this.newFoundationId,
          this.newParentType,
          this.newRotation,
          this.newNormal,
        );
      },
    } as UndoableMove;
    useStore.getState().addUndoable(undoableMove);

    const setUndoRedoMove = (
      id: string,
      pos: number[],
      parentId?: string,
      foundationId?: string | null,
      parentType?: ObjectType,
      rotation?: number[],
      normal?: Vector3,
    ) => {
      useStore.getState().set((state) => {
        const el = state.elements.find((e) => e.id === id);
        if (!el || el.type !== ObjectType.SolarPanel) return;
        [el.cx, el.cy, el.cz] = [...pos];
        if (parentId) {
          el.parentId = parentId;
        }
        if (foundationId) {
          el.foundationId = foundationId;
        }
        if (parentType) {
          (el as SolarPanelModel).parentType = parentType;
        }
        if (rotation) {
          el.rotation = [...rotation];
        }
        if (normal) {
          el.normal = [normal.x, normal.y, normal.z];
        }
      });
    };
  }

  static addUndoableResize(oldElement: SolarPanelModel) {
    const newElement = useStore
      .getState()
      .elements.find((e) => e.id === oldElement.id && e.type === ObjectType.SolarPanel) as SolarPanelModel;
    if (!newElement) return;

    const undoableResize = {
      name: 'Resize Solar Panel',
      timestamp: Date.now(),
      id: newElement.id,
      oldPos: [oldElement.cx, oldElement.cy, oldElement.cz],
      oldDms: [oldElement.lx, oldElement.ly, oldElement.lz],
      oldRot: [...oldElement.rotation],
      oldNor: [...oldElement.normal],
      newPos: [newElement.cx, newElement.cy, newElement.cz],
      newDms: [newElement.lx, newElement.ly, newElement.lz],
      newRot: [...newElement.rotation],
      newNor: [...newElement.normal],
      undo() {
        useStore.getState().set((state) => {
          for (const e of state.elements) {
            if (e.id === undoableResize.id) {
              [e.cx, e.cy, e.cz] = [...undoableResize.oldPos];
              [e.lx, e.ly, e.lz] = [...undoableResize.oldDms];
              e.normal = [...undoableResize.oldNor];
              e.rotation = [...undoableResize.oldRot];
              break;
            }
          }
        });
      },
      redo() {
        useStore.getState().set((state) => {
          for (const e of state.elements) {
            if (e.id === undoableResize.id) {
              [e.cx, e.cy, e.cz] = [...undoableResize.newPos];
              [e.lx, e.ly, e.lz] = [...undoableResize.newDms];
              e.normal = [...undoableResize.newNor];
              e.rotation = [...undoableResize.newRot];
              break;
            }
          }
        });
      },
    } as UnoableResizeSolarPanel;
    useStore.getState().addUndoable(undoableResize);
  }

  static addUndoableRotate(oldElement: SolarPanelModel) {
    const newElement = useStore
      .getState()
      .elements.find((e) => e.id === oldElement.id && e.type === ObjectType.SolarPanel) as SolarPanelModel;
    if (!newElement) return;

    const undoableChange = {
      name: 'Set Solar Panel Relative Azimuth',
      timestamp: Date.now(),
      changedElementId: newElement.id,
      oldValue: oldElement.relativeAzimuth,
      newValue: newElement.relativeAzimuth,
      changedElementType: ObjectType.SolarPanel,
      undo: () => {
        setState(undoableChange.oldValue as number);
      },
      redo: () => {
        setState(undoableChange.newValue as number);
      },
    } as UndoableChange;
    useStore.getState().addUndoable(undoableChange);

    const setState = (auzimuth: number) => {
      useStore.getState().set((state) => {
        const sp = state.elements.find(
          (e) => e.id === undoableChange.changedElementId && e.type === ObjectType.SolarPanel,
        );
        if (!sp) return;
        (sp as SolarPanelModel).relativeAzimuth = auzimuth;
      });
    };
  }

  static addUndoableTilt(oldElement: SolarPanelModel) {
    const newElement = useStore
      .getState()
      .elements.find((e) => e.id === oldElement.id && e.type === ObjectType.SolarPanel) as SolarPanelModel;
    if (!newElement) return;

    const undoableChange = {
      name: 'Set Solar Panel Tilt',
      timestamp: Date.now(),
      changedElementId: newElement.id,
      oldValue: oldElement.tiltAngle,
      newValue: newElement.tiltAngle,
      changedElementType: ObjectType.SolarPanel,
      undo: () => {
        setState(undoableChange.oldValue as number);
      },
      redo: () => {
        setState(undoableChange.newValue as number);
      },
    } as UndoableChange;
    useStore.getState().addUndoable(undoableChange);

    const setState = (tilt: number) => {
      useStore.getState().set((state) => {
        const sp = state.elements.find(
          (e) => e.id === undoableChange.changedElementId && e.type === ObjectType.SolarPanel,
        );
        if (!sp) return;
        (sp as SolarPanelModel).tiltAngle = tilt;
      });
    };
  }
}
