/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import { ViewState } from './ViewState';

export class DefaultViewState implements ViewState {
  orthographic: boolean;
  enableRotate: boolean;
  ambientLightIntensity: number;
  cameraPosition: number[];
  cameraPosition2D: number[];
  panCenter: number[];
  panCenter2D: number[];
  cameraZoom: number;

  axes: boolean;
  solarRadiationHeatMapMaxValue: number;
  shadowEnabled: boolean;
  theme: string;
  heliodon: boolean;
  showSunAngles: boolean;
  groundImage: boolean;
  groundColor: string;

  showMapPanel: boolean;
  showHeliodonPanel: boolean;
  showWeatherPanel: boolean;
  showStickyNotePanel: boolean;
  showSiteInfoPanel: boolean;
  showDesignInfoPanel: boolean;
  showInstructionPanel: boolean;
  showDailyLightSensorPanel: boolean;
  showYearlyLightSensorPanel: boolean;
  showDailyPvYieldPanel: boolean;
  showYearlyPvYieldPanel: boolean;
  showSolarPanelVisibilityResultsPanel: boolean;
  showDailyParabolicTroughYieldPanel: boolean;
  showYearlyParabolicTroughYieldPanel: boolean;
  showDailyParabolicDishYieldPanel: boolean;
  showYearlyParabolicDishYieldPanel: boolean;
  showDailyFresnelReflectorYieldPanel: boolean;
  showYearlyFresnelReflectorYieldPanel: boolean;
  showDailyHeliostatYieldPanel: boolean;
  showYearlyHeliostatYieldPanel: boolean;
  autoRotate: boolean;

  heliodonPanelX: number;
  heliodonPanelY: number;
  mapPanelX: number;
  mapPanelY: number;
  weatherPanelX: number;
  weatherPanelY: number;
  stickyNotePanelX: number;
  stickyNotePanelY: number;
  dailyLightSensorPanelX: number;
  dailyLightSensorPanelY: number;
  yearlyLightSensorPanelX: number;
  yearlyLightSensorPanelY: number;
  dailyPvYieldPanelX: number;
  dailyPvYieldPanelY: number;
  yearlyPvYieldPanelX: number;
  yearlyPvYieldPanelY: number;
  visibilityResultsPanelX: number;
  visibilityResultsPanelY: number;
  dailyParabolicTroughYieldPanelX: number;
  dailyParabolicTroughYieldPanelY: number;
  yearlyParabolicTroughYieldPanelX: number;
  yearlyParabolicTroughYieldPanelY: number;
  dailyParabolicDishYieldPanelX: number;
  dailyParabolicDishYieldPanelY: number;
  yearlyParabolicDishYieldPanelX: number;
  yearlyParabolicDishYieldPanelY: number;
  dailyFresnelReflectorYieldPanelX: number;
  dailyFresnelReflectorYieldPanelY: number;
  yearlyFresnelReflectorYieldPanelX: number;
  yearlyFresnelReflectorYieldPanelY: number;
  dailyHeliostatYieldPanelX: number;
  dailyHeliostatYieldPanelY: number;
  yearlyHeliostatYieldPanelX: number;
  yearlyHeliostatYieldPanelY: number;

  mapZoom: number;
  mapType: string;
  mapTilt: number;
  mapWeatherStations: boolean;

  constructor() {
    this.orthographic = false;
    this.enableRotate = true;
    this.ambientLightIntensity = 0.1;
    this.cameraPosition = [5, -30, 1];
    this.cameraPosition2D = [0, 0, 20];
    this.panCenter = [0, 0, 0];
    this.panCenter2D = [0, 0, 0];
    this.cameraZoom = 20;

    this.axes = true;
    this.solarRadiationHeatMapMaxValue = 5;
    this.shadowEnabled = true;
    this.theme = 'Default';
    this.heliodon = false;
    this.showSunAngles = false;
    this.groundImage = false;
    this.groundColor = 'forestgreen';

    this.showMapPanel = false;
    this.showHeliodonPanel = false;
    this.showWeatherPanel = false;
    this.showStickyNotePanel = false;
    this.showSiteInfoPanel = true;
    this.showDesignInfoPanel = false;
    this.showInstructionPanel = true;
    this.showDailyLightSensorPanel = false;
    this.showYearlyLightSensorPanel = false;
    this.showDailyPvYieldPanel = false;
    this.showYearlyPvYieldPanel = false;
    this.showSolarPanelVisibilityResultsPanel = false;
    this.showDailyParabolicTroughYieldPanel = false;
    this.showYearlyParabolicTroughYieldPanel = false;
    this.showDailyParabolicDishYieldPanel = false;
    this.showYearlyParabolicDishYieldPanel = false;
    this.showDailyFresnelReflectorYieldPanel = false;
    this.showYearlyFresnelReflectorYieldPanel = false;
    this.showDailyHeliostatYieldPanel = false;
    this.showYearlyHeliostatYieldPanel = false;
    this.autoRotate = false;

    this.heliodonPanelX = 0;
    this.heliodonPanelY = 0;
    this.mapPanelX = 0;
    this.mapPanelY = 0;
    this.weatherPanelX = 0;
    this.weatherPanelY = 0;
    this.stickyNotePanelX = 0;
    this.stickyNotePanelY = 0;
    this.dailyLightSensorPanelX = 0;
    this.dailyLightSensorPanelY = 0;
    this.yearlyLightSensorPanelX = 0;
    this.yearlyLightSensorPanelY = 0;
    this.dailyPvYieldPanelX = 0;
    this.dailyPvYieldPanelY = 0;
    this.yearlyPvYieldPanelX = 0;
    this.yearlyPvYieldPanelY = 0;
    this.visibilityResultsPanelX = 0;
    this.visibilityResultsPanelY = 0;
    this.dailyParabolicTroughYieldPanelX = 0;
    this.dailyParabolicTroughYieldPanelY = 0;
    this.yearlyParabolicTroughYieldPanelX = 0;
    this.yearlyParabolicTroughYieldPanelY = 0;
    this.dailyParabolicDishYieldPanelX = 0;
    this.dailyParabolicDishYieldPanelY = 0;
    this.yearlyParabolicDishYieldPanelX = 0;
    this.yearlyParabolicDishYieldPanelY = 0;
    this.dailyFresnelReflectorYieldPanelX = 0;
    this.dailyFresnelReflectorYieldPanelY = 0;
    this.yearlyFresnelReflectorYieldPanelX = 0;
    this.yearlyFresnelReflectorYieldPanelY = 0;
    this.dailyHeliostatYieldPanelX = 0;
    this.dailyHeliostatYieldPanelY = 0;
    this.yearlyHeliostatYieldPanelX = 0;
    this.yearlyHeliostatYieldPanelY = 0;

    this.mapZoom = 18;
    this.mapType = 'roadmap';
    this.mapTilt = 0;
    this.mapWeatherStations = false;
  }

  static resetViewState(viewState: ViewState) {
    viewState.orthographic = false;
    viewState.enableRotate = true;
    viewState.cameraPosition = [5, -30, 1];
    viewState.panCenter = [0, 0, 0];
    viewState.cameraZoom = 20;
    viewState.cameraPosition2D = [0, 0, 20];
    viewState.panCenter2D = [0, 0, 0];

    viewState.axes = true;
    viewState.solarRadiationHeatMapMaxValue = 5;
    viewState.shadowEnabled = true;
    viewState.theme = 'Default';
    viewState.heliodon = false;
    viewState.showSunAngles = false;
    viewState.groundImage = false;
    viewState.groundColor = 'forestgreen';

    viewState.showMapPanel = false;
    viewState.showHeliodonPanel = false;
    viewState.showWeatherPanel = false;
    viewState.showStickyNotePanel = false;
    viewState.showSiteInfoPanel = true;
    viewState.showDesignInfoPanel = true;
    viewState.showInstructionPanel = true;
    viewState.showDailyLightSensorPanel = false;
    viewState.showYearlyLightSensorPanel = false;
    viewState.showDailyPvYieldPanel = false;
    viewState.showYearlyPvYieldPanel = false;
    viewState.showSolarPanelVisibilityResultsPanel = false;
    viewState.showDailyParabolicTroughYieldPanel = false;
    viewState.showYearlyParabolicTroughYieldPanel = false;
    viewState.showDailyParabolicDishYieldPanel = false;
    viewState.showYearlyParabolicDishYieldPanel = false;
    viewState.showDailyFresnelReflectorYieldPanel = false;
    viewState.showYearlyFresnelReflectorYieldPanel = false;
    viewState.showDailyHeliostatYieldPanel = false;
    viewState.showYearlyHeliostatYieldPanel = false;
    viewState.autoRotate = false;

    viewState.heliodonPanelX = 0;
    viewState.heliodonPanelY = 0;
    viewState.mapPanelX = 0;
    viewState.mapPanelY = 0;
    viewState.weatherPanelX = 0;
    viewState.weatherPanelY = 0;
    viewState.stickyNotePanelX = 0;
    viewState.stickyNotePanelY = 0;
    viewState.dailyLightSensorPanelX = 0;
    viewState.dailyLightSensorPanelY = 0;
    viewState.yearlyLightSensorPanelX = 0;
    viewState.yearlyLightSensorPanelY = 0;
    viewState.dailyPvYieldPanelX = 0;
    viewState.dailyPvYieldPanelY = 0;
    viewState.yearlyPvYieldPanelX = 0;
    viewState.yearlyPvYieldPanelY = 0;
    viewState.visibilityResultsPanelX = 0;
    viewState.visibilityResultsPanelY = 0;
    viewState.dailyParabolicTroughYieldPanelX = 0;
    viewState.dailyParabolicTroughYieldPanelY = 0;
    viewState.yearlyParabolicTroughYieldPanelX = 0;
    viewState.yearlyParabolicTroughYieldPanelY = 0;
    viewState.dailyParabolicDishYieldPanelX = 0;
    viewState.dailyParabolicDishYieldPanelY = 0;
    viewState.yearlyParabolicDishYieldPanelX = 0;
    viewState.yearlyParabolicDishYieldPanelY = 0;
    viewState.dailyFresnelReflectorYieldPanelX = 0;
    viewState.dailyFresnelReflectorYieldPanelY = 0;
    viewState.yearlyFresnelReflectorYieldPanelX = 0;
    viewState.yearlyFresnelReflectorYieldPanelY = 0;
    viewState.dailyHeliostatYieldPanelX = 0;
    viewState.dailyHeliostatYieldPanelY = 0;
    viewState.yearlyHeliostatYieldPanelX = 0;
    viewState.yearlyHeliostatYieldPanelY = 0;

    viewState.mapZoom = 18;
    viewState.mapType = 'roadmap';
    viewState.mapTilt = 0;
    viewState.mapWeatherStations = false;
  }
}
