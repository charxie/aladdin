/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

export const VERSION = '0.0.1';

export const isProd = process.env.NODE_ENV === 'production';

export const HOME_URL: string = isProd ? 'https://aladdin.intofuture.org' : 'http://aladdin.dev';

export const PRESET_COLORS = [
    '#8884d8',
    '#f97356',
    '#1bc32c',
    '#c6502d',
    '#82ca9d',
    '#3eaec0',
    '#627682',
    '#445111'
];

export const MONTHS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
];
