/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';
import { CuboidTexture } from '../types';
import { Point2 } from '../models/Point2';
import { Vector3 } from 'three';

export interface UndoableChange extends Undoable {
  oldValue: string | number | string[] | CuboidTexture[] | Point2[];
  newValue: string | number | string[] | CuboidTexture[] | Point2[];
  changedElementId: string;
  changedSideIndex: number;
  oldChildrenParentIdMap?: Map<string, string>;
  newChildrenParentIdMap?: Map<string, string>;
  oldChildrenPositionsMap?: Map<string, Vector3>;
  newChildrenPositionsMap?: Map<string, Vector3>;
}
