/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { CommonStoreState } from '../common';

export const pvModelName = (state: CommonStoreState) => state.solarPanelArrayLayoutParams.pvModelName;
export const rowAxis = (state: CommonStoreState) => state.solarPanelArrayLayoutParams.rowAxis;
export const rowWidth = (state: CommonStoreState) => state.solarPanelArrayLayoutParams.rowWidthInPanels;
export const interRowSpacing = (state: CommonStoreState) => state.solarPanelArrayLayoutParams.interRowSpacing;
export const poleHeight = (state: CommonStoreState) => state.solarPanelArrayLayoutParams.poleHeight;
export const poleSpacing = (state: CommonStoreState) => state.solarPanelArrayLayoutParams.poleSpacing;
export const tiltAngle = (state: CommonStoreState) => state.solarPanelArrayLayoutParams.tiltAngle;
export const orientation = (state: CommonStoreState) => state.solarPanelArrayLayoutParams.orientation;
