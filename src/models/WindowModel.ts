/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { ObjectType } from 'src/types';
import { ElementModel } from './ElementModel';

export interface WindowModel extends ElementModel {
  // solar heat gain coefficient (https://en.wikipedia.org/wiki/Solar_gain) = 1 - opacity
  opacity: number;
  tint: string;
  uValue: number;

  shutter: ShutterProps;

  mullion: boolean;
  mullionWidth: number;
  mullionSpacing: number;
  mullionColor: string;

  // frameColor is using color
  frame: boolean;
  frameWidth: number;
  sillWidth: number;

  windowType: WindowType;
  archHeight: number;

  parentType?: ObjectType.Wall | ObjectType.Roof;

  // polygonal window top vertex position [x, h], x is relative to center(from -0.5 to 0.5), h is absolute
  polygonTop?: number[];

  // if empty, it is a hole on its parent (roof or window)
  empty?: boolean;

  // Is this window inside a building? If yes, this will be no heat exchange. By default, it is not.
  interior?: boolean;
}

export interface ShutterProps {
  showLeft: boolean;
  showRight: boolean;
  color: string;
  width: number;
}

export enum WindowType {
  Default = 'Default',
  Arched = 'Arched',
  Circular = 'Circular',
  Polygonal = 'Polygonal',
}
