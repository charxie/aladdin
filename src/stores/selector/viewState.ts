/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { CommonStoreState } from '../common';
import { DiurnalTemperaturePanelProps } from '../../panels/diurnalTemperaturePanel';

export const shadowEnabled = (state: CommonStoreState) => state.viewState.shadowEnabled;

export const solarRadiationHeatmapMaxValue = (state: CommonStoreState) => state.viewState.solarRadiationHeatMapMaxValue;

export const solarRadiationHeatmapReflectionOnly = (state: CommonStoreState) =>
  state.viewState.solarRadiationHeatMapReflectionOnly;

export const axes = (state: CommonStoreState) => state.viewState.axes;

export const ambientLightIntensity = (state: CommonStoreState) => state.viewState.ambientLightIntensity;

export const theme = (state: CommonStoreState) => state.viewState.theme;

export const showAzimuthAngle = (state: CommonStoreState) => state.viewState.showAzimuthAngle;

export const showElevationAngle = (state: CommonStoreState) => state.viewState.showElevationAngle;

export const showZenithAngle = (state: CommonStoreState) => state.viewState.showZenithAngle;

export const autoRotate = (state: CommonStoreState) => state.viewState.autoRotate;

export const groundImage = (state: CommonStoreState) => state.viewState.groundImage;

export const groundColor = (state: CommonStoreState) => state.viewState.groundColor;

export const orthographic = (state: CommonStoreState) => state.viewState.orthographic;

export const enableRotate = (state: CommonStoreState) => state.viewState.enableRotate;

export const cameraPosition = (state: CommonStoreState) => state.viewState.cameraPosition;

export const cameraPosition2D = (state: CommonStoreState) => state.viewState.cameraPosition2D;

export const panCenter = (state: CommonStoreState) => state.viewState.panCenter;

export const panCenter2D = (state: CommonStoreState) => state.viewState.panCenter2D;

export const cameraZoom = (state: CommonStoreState) => state.viewState.cameraZoom;

export const heliodon = (state: CommonStoreState) => state.viewState.heliodon;

export const showSunAngles = (state: CommonStoreState) => state.viewState.showSunAngles;

export const mapZoom = (state: CommonStoreState) => state.viewState.mapZoom;

export const mapTilt = (state: CommonStoreState) => state.viewState.mapTilt;

export const mapType = (state: CommonStoreState) => state.viewState.mapType;

export const mapWeatherStations = (state: CommonStoreState) => state.viewState.mapWeatherStations;

export const showSiteInfoPanel = (state: CommonStoreState) => state.viewState.showSiteInfoPanel;

export const showDesignInfoPanel = (state: CommonStoreState) => state.viewState.showDesignInfoPanel;

export const showInstructionPanel = (state: CommonStoreState) => state.viewState.showInstructionPanel;

export const showHeliodonPanel = (state: CommonStoreState) => state.viewState.showHeliodonPanel;

export const heliodonPanelX = (state: CommonStoreState) => state.viewState.heliodonPanelX;

export const heliodonPanelY = (state: CommonStoreState) => state.viewState.heliodonPanelY;

export const showMapPanel = (state: CommonStoreState) => state.viewState.showMapPanel;

export const mapPanelX = (state: CommonStoreState) => state.viewState.mapPanelX;

export const mapPanelY = (state: CommonStoreState) => state.viewState.mapPanelY;

export const showWeatherPanel = (state: CommonStoreState) => state.viewState.showWeatherPanel;

export const weatherPanelX = (state: CommonStoreState) => state.viewState.weatherPanelX;

export const weatherPanelY = (state: CommonStoreState) => state.viewState.weatherPanelY;

export const showDiurnalTemperaturePanel = (state: CommonStoreState) => state.viewState.showDiurnalTemperaturePanel;

export const diurnalTemperaturePanelX = (state: CommonStoreState) => state.viewState.diurnalTemperaturePanelX;

export const diurnalTemperaturePanelY = (state: CommonStoreState) => state.viewState.diurnalTemperaturePanelY;

export const showEconomicsPanel = (state: CommonStoreState) => state.viewState.showEconomicsPanel;

export const showStickyNotePanel = (state: CommonStoreState) => state.viewState.showStickyNotePanel;

export const stickyNotePanelX = (state: CommonStoreState) => state.viewState.stickyNotePanelX;

export const stickyNotePanelY = (state: CommonStoreState) => state.viewState.stickyNotePanelY;

export const showDailyLightSensorPanel = (state: CommonStoreState) => state.viewState.showDailyLightSensorPanel;

export const dailyLightSensorPanelRect = (state: CommonStoreState) => state.viewState.dailyLightSensorPanelRect;

export const showYearlyLightSensorPanel = (state: CommonStoreState) => state.viewState.showYearlyLightSensorPanel;

export const yearlyLightSensorPanelRect = (state: CommonStoreState) => state.viewState.yearlyLightSensorPanelRect;

export const yearlyLightSensorPanelShowDaylight = (state: CommonStoreState) =>
  state.viewState.yearlyLightSensorPanelShowDaylight;

export const yearlyLightSensorPanelShowClearness = (state: CommonStoreState) =>
  state.viewState.yearlyLightSensorPanelShowClearness;

export const showDailyPvYieldPanel = (state: CommonStoreState) => state.viewState.showDailyPvYieldPanel;

export const dailyPvYieldPanelRect = (state: CommonStoreState) => state.viewState.dailyPvYieldPanelRect;

export const showYearlyPvYieldPanel = (state: CommonStoreState) => state.viewState.showYearlyPvYieldPanel;

export const yearlyPvYieldPanelRect = (state: CommonStoreState) => state.viewState.yearlyPvYieldPanelRect;

export const showVisibilityResultsPanel = (state: CommonStoreState) =>
  state.viewState.showSolarPanelVisibilityResultsPanel;

export const visibilityResultsPanelX = (state: CommonStoreState) => state.viewState.visibilityResultsPanelX;

export const visibilityResultsPanelY = (state: CommonStoreState) => state.viewState.visibilityResultsPanelY;

export const showDailyParabolicTroughYieldPanel = (state: CommonStoreState) =>
  state.viewState.showDailyParabolicTroughYieldPanel;

export const dailyParabolicTroughYieldPanelX = (state: CommonStoreState) =>
  state.viewState.dailyParabolicTroughYieldPanelX;

export const dailyParabolicTroughYieldPanelY = (state: CommonStoreState) =>
  state.viewState.dailyParabolicTroughYieldPanelY;

export const showYearlyParabolicTroughYieldPanel = (state: CommonStoreState) =>
  state.viewState.showYearlyParabolicTroughYieldPanel;

export const yearlyParabolicTroughYieldPanelX = (state: CommonStoreState) =>
  state.viewState.yearlyParabolicTroughYieldPanelX;

export const yearlyParabolicTroughYieldPanelY = (state: CommonStoreState) =>
  state.viewState.yearlyParabolicTroughYieldPanelY;

export const showDailyParabolicDishYieldPanel = (state: CommonStoreState) =>
  state.viewState.showDailyParabolicDishYieldPanel;

export const dailyParabolicDishYieldPanelX = (state: CommonStoreState) => state.viewState.dailyParabolicDishYieldPanelX;

export const dailyParabolicDishYieldPanelY = (state: CommonStoreState) => state.viewState.dailyParabolicDishYieldPanelY;

export const showYearlyParabolicDishYieldPanel = (state: CommonStoreState) =>
  state.viewState.showYearlyParabolicDishYieldPanel;

export const yearlyParabolicDishYieldPanelX = (state: CommonStoreState) =>
  state.viewState.yearlyParabolicDishYieldPanelX;

export const yearlyParabolicDishYieldPanelY = (state: CommonStoreState) =>
  state.viewState.yearlyParabolicDishYieldPanelY;

export const showDailyFresnelReflectorYieldPanel = (state: CommonStoreState) =>
  state.viewState.showDailyFresnelReflectorYieldPanel;

export const dailyFresnelReflectorYieldPanelX = (state: CommonStoreState) =>
  state.viewState.dailyFresnelReflectorYieldPanelX;

export const dailyFresnelReflectorYieldPanelY = (state: CommonStoreState) =>
  state.viewState.dailyFresnelReflectorYieldPanelY;

export const showYearlyFresnelReflectorYieldPanel = (state: CommonStoreState) =>
  state.viewState.showYearlyFresnelReflectorYieldPanel;

export const yearlyFresnelReflectorYieldPanelX = (state: CommonStoreState) =>
  state.viewState.yearlyFresnelReflectorYieldPanelX;

export const yearlyFresnelReflectorYieldPanelY = (state: CommonStoreState) =>
  state.viewState.yearlyFresnelReflectorYieldPanelY;

export const showDailyHeliostatYieldPanel = (state: CommonStoreState) => state.viewState.showDailyHeliostatYieldPanel;

export const dailyHeliostatYieldPanelX = (state: CommonStoreState) => state.viewState.dailyHeliostatYieldPanelX;

export const dailyHeliostatYieldPanelY = (state: CommonStoreState) => state.viewState.dailyHeliostatYieldPanelY;

export const showYearlyHeliostatYieldPanel = (state: CommonStoreState) => state.viewState.showYearlyHeliostatYieldPanel;

export const yearlyHeliostatYieldPanelX = (state: CommonStoreState) => state.viewState.yearlyHeliostatYieldPanelX;

export const yearlyHeliostatYieldPanelY = (state: CommonStoreState) => state.viewState.yearlyHeliostatYieldPanelY;

export const showDailyUpdraftTowerYieldPanel = (state: CommonStoreState) =>
  state.viewState.showDailyUpdraftTowerYieldPanel;

export const dailyUpdraftTowerYieldPanelX = (state: CommonStoreState) => state.viewState.dailyUpdraftTowerYieldPanelX;

export const dailyUpdraftTowerYieldPanelY = (state: CommonStoreState) => state.viewState.dailyUpdraftTowerYieldPanelY;

export const showYearlyUpdraftTowerYieldPanel = (state: CommonStoreState) =>
  state.viewState.showYearlyUpdraftTowerYieldPanel;

export const yearlyUpdraftTowerYieldPanelX = (state: CommonStoreState) => state.viewState.yearlyUpdraftTowerYieldPanelX;

export const yearlyUpdraftTowerYieldPanelY = (state: CommonStoreState) => state.viewState.yearlyUpdraftTowerYieldPanelY;

export const showEvolutionPanel = (state: CommonStoreState) => state.viewState.showEvolutionPanel;

export const evolutionPanelX = (state: CommonStoreState) => state.viewState.evolutionPanelX;

export const evolutionPanelY = (state: CommonStoreState) => state.viewState.evolutionPanelY;
