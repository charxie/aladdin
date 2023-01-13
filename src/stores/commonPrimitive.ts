/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */
import create from 'zustand';

// avoid using undefined value in the store for now.
export interface PrimitiveStoreState {
  setPrimitiveStore: <K extends keyof PrimitiveStoreState, V extends PrimitiveStoreState[K]>(key: K, val: V) => void;

  duringCameraInteraction: boolean;

  flagOfDailySimulation: boolean; // used as a flag to notify that daily results are ready

  // store the calculated hourly heat exchange result between inside and outside through an element of a building
  hourlyHeatExchangeArrayMap: Map<string, number[]>;
  setHourlyHeatExchangeArray: (id: string, data: number[]) => void;

  // store the calculated results for hourly solar heat gains of a building through windows
  hourlySolarHeatGainArrayMap: Map<string, number[]>;
  setHourlySolarHeatGainArray: (id: string, data: number[]) => void;

  // store the calculated results for hourly solar panel outputs of a building through windows
  hourlySolarPanelOutputArrayMap: Map<string, number[]>;
  setHourlySolarPanelOutputArray: (id: string, data: number[]) => void;
}

export const usePrimitiveStore = create<PrimitiveStoreState>((set, get) => {
  return {
    setPrimitiveStore(key, val) {
      set((state) => {
        if (state[key] !== undefined) {
          state[key] = val;
        } else {
          console.error(`key ${key} is not defined in PrimitiveStoreState`);
        }
      });
    },

    duringCameraInteraction: false,

    flagOfDailySimulation: false,

    hourlyHeatExchangeArrayMap: new Map<string, number[]>(),
    setHourlyHeatExchangeArray(id, data) {
      const map = get().hourlyHeatExchangeArrayMap;
      map.set(id, data);
      set((state) => {
        // must create a new map in order to trigger re-rendering
        state.hourlyHeatExchangeArrayMap = new Map(map);
      });
    },

    hourlySolarHeatGainArrayMap: new Map<string, number[]>(),
    setHourlySolarHeatGainArray(id, data) {
      const map = get().hourlySolarHeatGainArrayMap;
      map.set(id, data);
      set((state) => {
        // must create a new map in order to trigger re-rendering
        state.hourlySolarHeatGainArrayMap = new Map(map);
      });
    },

    hourlySolarPanelOutputArrayMap: new Map<string, number[]>(),
    setHourlySolarPanelOutputArray(id, data) {
      const map = get().hourlySolarPanelOutputArrayMap;
      map.set(id, data);
      set((state) => {
        // must create a new map in order to trigger re-rendering
        state.hourlySolarPanelOutputArrayMap = new Map(map);
      });
    },
  };
});
