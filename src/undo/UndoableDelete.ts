/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { Undoable } from './Undoable';
import { ElementModel } from '../models/ElementModel';

export interface UndoableDelete extends Undoable {
  deletedElements: ElementModel[];
}
