/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { ObjectType, Orientation, TrackerType } from '../types';
import { FoundationModel } from './FoundationModel';
import { SolarCollector } from './SolarCollector';

export interface SolarPanelModel extends SolarCollector {
  pvModelName: string;
  monthlyTiltAngles: number[]; // seasonally adjusted tilt angles
  orientation: Orientation;
  trackerType: TrackerType;
  poleSpacing: number;
  parentType?: ObjectType;
  foundationModel?: FoundationModel;
  frameColor?: string;
  backsheetColor?: string;
  inverterEfficiency?: number;
  dcToAcRatio?: number;
  bifacial?: boolean; // 8-29-2023
}

export interface SolarPanelModelOnWall extends SolarPanelModel {
  absRotation: number;
}
