/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { extend, Object3DNode } from '@react-three/fiber';
import TextSprite from 'three-spritetext';
import { MyOrbitControls } from './js/MyOrbitControls';

// Extend makes these JSX elements (with the first character lower-cased)
extend({ TextSprite });
extend({ MyOrbitControls });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      textSprite: Object3DNode<TextSprite, typeof TextSprite>;
      myOrbitControls: Object3DNode<MyOrbitControls, typeof MyOrbitControls>;
    }
  }
}

export interface User {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  uid: string | null;
  signFile: boolean;
}

export interface CloudFileInfo {
  readonly timestamp: number;
  readonly fileName: string;
  readonly owner: string;
  readonly email: string;
  readonly uuid: string;
  readonly userid: string;
}

export enum LineStyle {
  Solid = 1,
  Dashed = 2,
  Dotted = 3,
}

export interface DatumEntry {
  [key: string]: number | undefined | string;
}

export enum GraphDataType {
  HourlyTemperatures = 0,
  MonthlyTemperatures = 1,
  SunshineHours = 2,
  DaylightData = 3,
  ClearnessData = 4,
  YearlyRadiationSensorData = 5,
  DailyRadiationSensorData = 6,
  YearlyPvYeild = 7,
  DailyPvYield = 8,
}

export enum Theme {
  Default = 'Default',
  Desert = 'Desert',
  Forest = 'Forest',
  Grassland = 'Grassland',
}

export enum Language {
  English = 'English',
  ChineseSimplified = '简体中文',
  ChineseTraditional = '繁体中文',
  Turkish = 'Türk',
  Spanish = 'Español',
}

export enum ObjectType {
  Sky = 'Sky',
  Ground = 'Ground',
  Foundation = 'Foundation',
  Wall = 'Wall',
  Window = 'Window',
  Roof = 'Roof',
  Sensor = 'Sensor',
  SolarPanel = 'Solar Panel',
  Cuboid = 'Cuboid',
  Human = 'Human',
  Tree = 'Tree',
  Polygon = 'Polygon',
  PolygonVertex = 'Polygon Vertex',
  None = 'None',
}

export enum ActionType {
  Select = 'Select',
  Move = 'Move',
  Resize = 'Resize',
  Rotate = 'Rotate',
}

export enum MoveHandleType {
  Default = 'Move Handle', // used when there is only one handle for moving
  Lower = 'Move Handle Lower',
  Upper = 'Move Handle Upper',
  Left = 'Move Handle Left',
  Right = 'Move Handle Right',
  Top = 'Move Handle Top',
  Mid = 'Move Handle Mid',
}

export enum ResizeHandleType {
  LowerLeft = 'Resize Handle Lower Left',
  UpperLeft = 'Resize Handle Upper Left',
  LowerRight = 'Resize Handle Lower Right',
  UpperRight = 'Resize Handle Upper Right',
  LowerLeftTop = 'Resize Handle Lower Left Top',
  UpperLeftTop = 'Resize Handle Upper Left Top',
  LowerRightTop = 'Resize Handle Lower Right Top',
  UpperRightTop = 'Resize Handle Upper Right Top',
  Lower = 'Resize Handle Lower',
  Upper = 'Resize Handle Upper',
  Left = 'Resize Handle Left',
  Right = 'Resize Handle Right',
  Top = 'Resize Handle Top',
  Default = 'Resize Handle', // used for resizing a polygon
}

export enum RotateHandleType {
  Lower = 'Rotate Handle Lower',
  Upper = 'Rotate Handle Upper',
  Tilt = 'Rotate Handle Tilt',
}

export enum PolygonVertexAction {
  Delete = 'Delete Vertex',
  InsertBeforeIndex = 'Insert Vertex Before Index',
  InsertAfterIndex = 'Insert Vertex After Index',
}

export enum IntersectionPlaneType {
  Horizontal = 'Horizontal',
  Vertical = 'Vertical',
  Ground = 'Ground',
  Sky = 'Sky',
}

export enum Scope {
  OnlyThisObject = 1,
  AllObjectsOfThisTypeOnSurface = 2,
  AllObjectsOfThisTypeAboveFoundation = 3,
  AllObjectsOfThisType = 4,
  AllConnectedObjects = 5,
  OnlyThisSide = 6,
}

export enum Orientation {
  portrait = 'Portrait',
  landscape = 'Landscape',
}

export enum RowAxis {
  zonal = 'Zonal', // east-west
  meridional = 'Meridional', // north-south
}

export enum TrackerType {
  NO_TRACKER = 'None',
  HORIZONTAL_SINGLE_AXIS_TRACKER = 'HSAT',
  ALTAZIMUTH_DUAL_AXIS_TRACKER = 'AADAT',
  VERTICAL_SINGLE_AXIS_TRACKER = 'VSAT',
  TILTED_SINGLE_AXIS_TRACKER = 'TSAT',
}

export enum ShadeTolerance {
  NONE = 'None',
  HIGH = 'High',
  PARTIAL = 'Partial',
}

export enum Discretization {
  EXACT = 'Exact',
  APPROXIMATE = 'Approximate',
}

export enum TreeType {
  Cottonwood = 'Cottonwood',
  Dogwood = 'Dogwood',
  Elm = 'Elm',
  Linden = 'Linden',
  Maple = 'Maple',
  Oak = 'Oak',
  Pine = 'Pine',
}

export enum HumanName {
  Jack = 'Jack',
  Jade = 'Jade',
  Jane = 'Jane',
  Jaye = 'Jaye',
  Jean = 'Jean',
  Jedi = 'Jedi',
  Jeff = 'Jeff',
  Jena = 'Jena',
  Jeni = 'Jeni',
  Jess = 'Jess',
  Jett = 'Jett',
  Jill = 'Jill',
  Joan = 'Joan',
  Joel = 'Joel',
  John = 'John',
  Jose = 'Jose',
  Judd = 'Judd',
  Judy = 'Judy',
  June = 'June',
  Juro = 'Juro',
  Xiaoli = 'Xiaoli',
  Xiaoming = 'Xiaoming',
}

export enum PolygonTexture {
  Texture01 = 'Polygon Texture #1',
  Texture02 = 'Polygon Texture #2',
  Texture03 = 'Polygon Texture #3',
  Texture04 = 'Polygon Texture #4',
  Texture05 = 'Polygon Texture #5',
  Texture06 = 'Polygon Texture #6',
  Texture07 = 'Polygon Texture #7',
  Texture08 = 'Polygon Texture #8',
  Texture09 = 'Polygon Texture #9',
  Texture10 = 'Polygon Texture #10',
  NoTexture = 'No Polygon Texture',
}

export enum FoundationTexture {
  Texture01 = 'Foundation Texture #1',
  Texture02 = 'Foundation Texture #2',
  Texture03 = 'Foundation Texture #3',
  Texture04 = 'Foundation Texture #4',
  Texture05 = 'Foundation Texture #5',
  Texture06 = 'Foundation Texture #6',
  Texture07 = 'Foundation Texture #7',
  Texture08 = 'Foundation Texture #8',
  Texture09 = 'Foundation Texture #9',
  Texture10 = 'Foundation Texture #10',
  NoTexture = 'No Foundation Texture',
}

export enum CuboidTexture {
  Facade01 = 'Facade #1',
  Facade02 = 'Facade #2',
  Facade03 = 'Facade #3',
  Facade04 = 'Facade #4',
  Facade05 = 'Facade #5',
  Facade06 = 'Facade #6',
  Facade07 = 'Facade #7',
  Facade08 = 'Facade #8',
  Facade09 = 'Facade #9',
  Facade10 = 'Facade #10',
  NoTexture = 'No Facade Texture',
}

export enum WallTexture {
  Default = 'Wall Texture Default',
  Texture01 = 'Wall Texture #1',
  Texture02 = 'Wall Texture #2',
  Texture03 = 'Wall Texture #3',
  Texture04 = 'Wall Texture #4',
  Texture05 = 'Wall Texture #5',
  Texture06 = 'Wall Texture #6',
  Texture07 = 'Wall Texture #7',
  Texture08 = 'Wall Texture #8',
  Texture09 = 'Wall Texture #9',
  Texture10 = 'Wall Texture #10',
  NoTexture = 'No Wall Texture',
}

export enum WallSide {
  Left = 'Left',
  Right = 'Right',
}
