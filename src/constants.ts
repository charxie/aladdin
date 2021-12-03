/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { Vector3 } from 'three';

export const VERSION = '0.0.2';

export const isProd = process.env.NODE_ENV === 'production';

export const HOME_URL: string = isProd
  ? 'https://institute-for-future-intelligence.github.io/aladdin/'
  : 'http://localhost:3000/aladdin';

export const PRESET_COLORS = ['#8884d8', '#f97356', '#1bc32c', '#c6502d', '#82ca9d', '#3eaec0', '#627682', '#445111'];

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const DEFAULT_SKY_RADIUS = 5000;
export const DEFAULT_FOV = 45;
export const DEFAULT_FAR = 1000000;

export const MOVE_HANDLE_OFFSET = 0.12;
export const MOVE_HANDLE_RADIUS = 0.1;
export const RESIZE_HANDLE_SIZE = 0.16;

export const MOVE_HANDLE_COLOR_1 = 'orange';
export const MOVE_HANDLE_COLOR_2 = 'orchid';
export const MOVE_HANDLE_COLOR_3 = 'pink';
export const RESIZE_HANDLE_COLOR = 'white';
export const HIGHLIGHT_HANDLE_COLOR = 'red';

export const GROUND_ID = 'Ground';

export const HALF_PI = Math.PI / 2;

export const TWO_PI = Math.PI * 2;

export const ZERO_TOLERANCE = 0.0001;

export const UNIT_VECTOR_POS_Z_ARRAY = [0, 0, 1];

export const UNIT_VECTOR_POS_X = new Vector3(1, 0, 0);

export const UNIT_VECTOR_NEG_X = new Vector3(-1, 0, 0);

export const UNIT_VECTOR_POS_Y = new Vector3(0, 1, 0);

export const UNIT_VECTOR_NEG_Y = new Vector3(0, -1, 0);

export const UNIT_VECTOR_POS_Z = new Vector3(0, 0, 1);

export const UNIT_VECTOR_NEG_Z = new Vector3(0, 0, -1);
