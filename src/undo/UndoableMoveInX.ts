/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';
import { ObjectType } from '../types';

export interface UndoableMoveInX extends Undoable {
  displacement: number;
  movedElementId: string;
  movedElementType: ObjectType;
}
