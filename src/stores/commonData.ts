/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */
import create from 'zustand';
import { produce } from 'immer';
import { DatumEntry } from '../types';

export interface DataStoreState {
  set: (fn: (state: DataStoreState) => void) => void;

  dailyLightSensorData: DatumEntry[];
  setDailyLightSensorData: (data: DatumEntry[]) => void;
  yearlyLightSensorData: DatumEntry[];
  setYearlyLightSensorData: (data: DatumEntry[]) => void;
  sensorLabels: string[];
  setSensorLabels: (labels: string[]) => void;

  dailyParabolicDishYield: DatumEntry[];
  setDailyParabolicDishYield: (data: DatumEntry[]) => void;
  sumDailyParabolicDishYield: () => number;
  yearlyParabolicDishYield: DatumEntry[];
  setYearlyParabolicDishYield: (data: DatumEntry[]) => void;
  sumYearlyParabolicDishYield: () => number;
  parabolicDishLabels: string[];
  setParabolicDishLabels: (labels: string[]) => void;

  dailyParabolicTroughYield: DatumEntry[];
  setDailyParabolicTroughYield: (data: DatumEntry[]) => void;
  sumDailyParabolicTroughYield: () => number;
  yearlyParabolicTroughYield: DatumEntry[];
  setYearlyParabolicTroughYield: (data: DatumEntry[]) => void;
  sumYearlyParabolicTroughYield: () => number;
  parabolicTroughLabels: string[];
  setParabolicTroughLabels: (labels: string[]) => void;

  dailyFresnelReflectorYield: DatumEntry[];
  setDailyFresnelReflectorYield: (data: DatumEntry[]) => void;
  sumDailyFresnelReflectorYield: () => number;
  yearlyFresnelReflectorYield: DatumEntry[];
  setYearlyFresnelReflectorYield: (data: DatumEntry[]) => void;
  sumYearlyFresnelReflectorYield: () => number;
  fresnelReflectorLabels: string[];
  setFresnelReflectorLabels: (labels: string[]) => void;

  dailyHeliostatYield: DatumEntry[];
  setDailyHeliostatYield: (data: DatumEntry[]) => void;
  sumDailyHeliostatYield: () => number;
  yearlyHeliostatYield: DatumEntry[];
  setYearlyHeliostatYield: (data: DatumEntry[]) => void;
  sumYearlyHeliostatYield: () => number;
  heliostatLabels: string[];
  setHeliostatLabels: (labels: string[]) => void;

  dailyUpdraftTowerResults: DatumEntry[];
  dailyUpdraftTowerYield: DatumEntry[];
  setDailyUpdraftTowerResults: (data: DatumEntry[]) => void;
  setDailyUpdraftTowerYield: (data: DatumEntry[]) => void;
  sumDailyUpdraftTowerYield: () => number;
  yearlyUpdraftTowerYield: DatumEntry[];
  setYearlyUpdraftTowerYield: (data: DatumEntry[]) => void;
  sumYearlyUpdraftTowerYield: () => number;
  updraftTowerLabels: string[];
  setUpdraftTowerLabels: (labels: string[]) => void;

  // store the calculated heat map on the surface of an element
  heatmaps: Map<string, number[][]>;
  setHeatmap: (id: string, data: number[][]) => void;
  getHeatmap: (id: string) => number[][] | undefined;
  clearHeatmaps: () => void;

  // store the calculated hourly heat exchange result between inside and outside through an element of a building
  hourlyHeatExchangeArrayMap: Map<string, number[]>;
  setHourlyHeatExchangeArray: (id: string, data: number[]) => void;

  // store the calculated results for hourly solar heat gains of a building through windows
  hourlySolarHeatGainArrayMap: Map<string, number[]>;
  setHourlySolarHeatGainArray: (id: string, data: number[]) => void;

  // store the calculated results for hourly solar panel outputs of a building through windows
  hourlySolarPanelOutputArrayMap: Map<string, number[]>;
  setHourlySolarPanelOutputArray: (id: string, data: number[]) => void;

  clearDataStore: () => void;
}

export const useDataStore = create<DataStoreState>((set, get) => {
  const immerSet: DataStoreState['set'] = (fn) => set(produce(fn));
  return {
    set: (fn) => {
      try {
        immerSet(fn);
      } catch (e) {
        console.log(e);
      }
    },

    dailyLightSensorData: [],
    setDailyLightSensorData(data) {
      immerSet((state) => {
        state.dailyLightSensorData = [...data];
      });
    },
    yearlyLightSensorData: [],
    setYearlyLightSensorData(data) {
      immerSet((state) => {
        state.yearlyLightSensorData = [...data];
      });
    },
    sensorLabels: [],
    setSensorLabels(labels) {
      immerSet((state) => {
        state.sensorLabels = [...labels];
      });
    },

    dailyParabolicDishYield: [],
    setDailyParabolicDishYield(data) {
      immerSet((state) => {
        state.dailyParabolicDishYield = [...data];
      });
    },
    sumDailyParabolicDishYield() {
      let sum = 0;
      for (const datum of this.dailyParabolicDishYield) {
        for (const prop in datum) {
          if (datum.hasOwnProperty(prop)) {
            if (prop !== 'Hour') {
              sum += datum[prop] as number;
            }
          }
        }
      }
      return sum;
    },
    yearlyParabolicDishYield: [],
    setYearlyParabolicDishYield(data) {
      immerSet((state) => {
        state.yearlyParabolicDishYield = [...data];
      });
    },
    sumYearlyParabolicDishYield() {
      let sum = 0;
      for (const datum of this.yearlyParabolicDishYield) {
        for (const prop in datum) {
          if (datum.hasOwnProperty(prop)) {
            if (prop !== 'Month') {
              sum += datum[prop] as number;
            }
          }
        }
      }
      return sum;
    },
    parabolicDishLabels: [],
    setParabolicDishLabels(labels) {
      immerSet((state) => {
        state.parabolicDishLabels = [...labels];
      });
    },

    dailyParabolicTroughYield: [],
    setDailyParabolicTroughYield(data) {
      immerSet((state) => {
        state.dailyParabolicTroughYield = [...data];
      });
    },
    sumDailyParabolicTroughYield() {
      let sum = 0;
      for (const datum of this.dailyParabolicTroughYield) {
        for (const prop in datum) {
          if (datum.hasOwnProperty(prop)) {
            if (prop !== 'Hour') {
              sum += datum[prop] as number;
            }
          }
        }
      }
      return sum;
    },
    yearlyParabolicTroughYield: [],
    setYearlyParabolicTroughYield(data) {
      immerSet((state) => {
        state.yearlyParabolicTroughYield = [...data];
      });
    },
    sumYearlyParabolicTroughYield() {
      let sum = 0;
      for (const datum of this.yearlyParabolicTroughYield) {
        for (const prop in datum) {
          if (datum.hasOwnProperty(prop)) {
            if (prop !== 'Month') {
              sum += datum[prop] as number;
            }
          }
        }
      }
      return sum;
    },
    parabolicTroughLabels: [],
    setParabolicTroughLabels(labels) {
      immerSet((state) => {
        state.parabolicTroughLabels = [...labels];
      });
    },

    dailyFresnelReflectorYield: [],
    setDailyFresnelReflectorYield(data) {
      immerSet((state) => {
        state.dailyFresnelReflectorYield = [...data];
      });
    },
    sumDailyFresnelReflectorYield() {
      let sum = 0;
      for (const datum of this.dailyFresnelReflectorYield) {
        for (const prop in datum) {
          if (datum.hasOwnProperty(prop)) {
            if (prop !== 'Hour') {
              sum += datum[prop] as number;
            }
          }
        }
      }
      return sum;
    },
    yearlyFresnelReflectorYield: [],
    setYearlyFresnelReflectorYield(data) {
      immerSet((state) => {
        state.yearlyFresnelReflectorYield = [...data];
      });
    },
    sumYearlyFresnelReflectorYield() {
      let sum = 0;
      for (const datum of this.yearlyFresnelReflectorYield) {
        for (const prop in datum) {
          if (datum.hasOwnProperty(prop)) {
            if (prop !== 'Month') {
              sum += datum[prop] as number;
            }
          }
        }
      }
      return sum;
    },
    fresnelReflectorLabels: [],
    setFresnelReflectorLabels(labels) {
      immerSet((state) => {
        state.fresnelReflectorLabels = [...labels];
      });
    },

    dailyHeliostatYield: [],
    setDailyHeliostatYield(data) {
      immerSet((state) => {
        state.dailyHeliostatYield = [...data];
      });
    },
    sumDailyHeliostatYield() {
      let sum = 0;
      for (const datum of this.dailyHeliostatYield) {
        for (const prop in datum) {
          if (datum.hasOwnProperty(prop)) {
            if (prop !== 'Hour') {
              sum += datum[prop] as number;
            }
          }
        }
      }
      return sum;
    },
    yearlyHeliostatYield: [],
    setYearlyHeliostatYield(data) {
      immerSet((state) => {
        state.yearlyHeliostatYield = [...data];
      });
    },
    sumYearlyHeliostatYield() {
      let sum = 0;
      for (const datum of this.yearlyHeliostatYield) {
        for (const prop in datum) {
          if (datum.hasOwnProperty(prop)) {
            if (prop !== 'Month') {
              sum += datum[prop] as number;
            }
          }
        }
      }
      return sum;
    },
    heliostatLabels: [],
    setHeliostatLabels(labels) {
      immerSet((state) => {
        state.heliostatLabels = [...labels];
      });
    },

    dailyUpdraftTowerResults: [],
    dailyUpdraftTowerYield: [],
    setDailyUpdraftTowerResults(data) {
      immerSet((state) => {
        state.dailyUpdraftTowerResults = [...data];
      });
    },
    setDailyUpdraftTowerYield(data) {
      immerSet((state) => {
        state.dailyUpdraftTowerYield = [...data];
      });
    },
    sumDailyUpdraftTowerYield() {
      let sum = 0;
      for (const datum of this.dailyUpdraftTowerYield) {
        for (const prop in datum) {
          if (datum.hasOwnProperty(prop)) {
            if (prop !== 'Hour') {
              sum += datum[prop] as number;
            }
          }
        }
      }
      return sum;
    },
    yearlyUpdraftTowerYield: [],
    setYearlyUpdraftTowerYield(data) {
      immerSet((state) => {
        state.yearlyUpdraftTowerYield = [...data];
      });
    },
    sumYearlyUpdraftTowerYield() {
      let sum = 0;
      for (const datum of this.yearlyUpdraftTowerYield) {
        for (const prop in datum) {
          if (datum.hasOwnProperty(prop)) {
            if (prop !== 'Month') {
              sum += datum[prop] as number;
            }
          }
        }
      }
      return sum;
    },
    updraftTowerLabels: [],
    setUpdraftTowerLabels(labels) {
      immerSet((state) => {
        state.updraftTowerLabels = [...labels];
      });
    },

    heatmaps: new Map<string, number[][]>(),
    setHeatmap(id, data) {
      immerSet((state) => {
        state.heatmaps.set(id, data);
      });
    },
    getHeatmap(id) {
      return get().heatmaps.get(id);
    },

    hourlyHeatExchangeArrayMap: new Map<string, number[]>(),
    setHourlyHeatExchangeArray(id, data) {
      immerSet((state) => {
        state.hourlyHeatExchangeArrayMap.set(id, data);
      });
    },

    hourlySolarHeatGainArrayMap: new Map<string, number[]>(),
    setHourlySolarHeatGainArray(id, data) {
      immerSet((state) => {
        state.hourlySolarHeatGainArrayMap.set(id, data);
      });
    },

    hourlySolarPanelOutputArrayMap: new Map<string, number[]>(),
    setHourlySolarPanelOutputArray(id, data) {
      immerSet((state) => {
        state.hourlySolarPanelOutputArrayMap.set(id, data);
      });
    },

    clearHeatmaps() {
      immerSet((state) => {
        state.heatmaps.clear();
      });
    },

    clearDataStore() {
      immerSet((state) => {
        state.heatmaps.clear();
        state.hourlyHeatExchangeArrayMap.clear();
        state.hourlySolarHeatGainArrayMap.clear();
        state.hourlySolarPanelOutputArrayMap.clear();

        state.dailyLightSensorData.length = 0;
        state.yearlyLightSensorData.length = 0;

        state.dailyParabolicDishYield.length = 0;
        state.yearlyParabolicDishYield.length = 0;

        state.dailyParabolicTroughYield.length = 0;
        state.yearlyParabolicTroughYield.length = 0;

        state.dailyFresnelReflectorYield.length = 0;
        state.yearlyFresnelReflectorYield.length = 0;

        state.dailyHeliostatYield.length = 0;
        state.yearlyHeliostatYield.length = 0;

        state.dailyUpdraftTowerYield.length = 0;
        state.dailyUpdraftTowerResults.length = 0;
        state.yearlyUpdraftTowerYield.length = 0;
      });
    },
  };
});
