/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { GroundModel } from './GroundModel';
import { Discretization } from '../types';

export interface WorldModel {
  name: string;
  date: string;
  latitude: number;
  longitude: number;
  address: string;
  ground: GroundModel;

  timesPerHour: number;
  solarRadiationHeatmapGridCellSize: number;
  solarPanelGridCellSize: number;
  discretization: Discretization;
  solarPanelVisibilityGridCellSize: number;

  parabolicTroughTimesPerHour: number;
  parabolicTroughGridCellSize: number;
}
