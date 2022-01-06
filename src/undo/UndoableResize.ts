/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';
import { Vector3 } from 'three';
import { Point2 } from '../models/Point2';
import { FlippedWallSide } from './UndoableAdd';
import { WallModel } from 'src/models/WallModel';

export interface UndoableResize extends Undoable {
  oldCx: number;
  oldCy: number;
  oldCz: number;
  newCx: number;
  newCy: number;
  newCz: number;

  oldLx: number;
  oldLy: number;
  oldLz: number;
  newLx: number;
  newLy: number;
  newLz: number;

  resizedElementId: string;

  oldChildrenPositionsMap: Map<string, Vector3>;
  newChildrenPositionsMap: Map<string, Vector3>;
  oldPolygonVerticesMap: Map<string, Point2[]>;
  newPolygonVerticesMap: Map<string, Point2[]>;

  oldChildrenParentIdMap?: Map<string, string>;
  newChildrenParentIdMap?: Map<string, string>;
}

export interface UndoableResizeWall extends Undoable {
  resizedElementId: string;
  oldPosition: Vector3;
  newPosition: Vector3;
  oldDimension: Vector3;
  newDimension: Vector3;
  oldAngle: number;
  newAngle: number;
  oldJoints: string[];
  newJoints: string[];
  oldPoint: number[][];
  newPoint: number[][];
  flippedWallSide: FlippedWallSide;
}
