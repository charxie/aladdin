/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { CommonStoreState } from '../common';

export const latitude = (state: CommonStoreState) => state.world.latitude;

export const longitude = (state: CommonStoreState) => state.world.longitude;

export const date = (state: CommonStoreState) => state.world.date;

export const address = (state: CommonStoreState) => state.world.address;

export const discretization = (state: CommonStoreState) => state.world.discretization;

export const solarPanelGridCellSize = (state: CommonStoreState) => state.world.solarPanelGridCellSize;

export const timesPerHour = (state: CommonStoreState) => state.world.timesPerHour;
