/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';
import { Vector2 } from 'three';

export interface UndoableSizeGroupChange extends Undoable {
  // old values might be different, so we store their IDs and values in a map
  oldSizes: Map<string, number>;
  // but there is only one new value, so no need to use a map.
  newSize: number;

  oldChildrenPositionsMap: Map<string, Vector2>;
  newChildrenPositionsMap: Map<string, Vector2>;
}
