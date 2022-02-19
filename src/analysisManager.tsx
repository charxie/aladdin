/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef } from 'react';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';

const AnalysisManager = () => {
  const setCommonStore = useStore(Selector.set);
  const dailyPvFlag = useStore(Selector.dailyPvFlag);
  const yearlyPvFlag = useStore(Selector.yearlyPvFlag);
  const solarPanelVisibilityFlag = useStore(Selector.solarPanelVisibilityFlag);

  const firstCallSolarPanelVisibilityFlag = useRef<boolean>(true);
  const firstCallDailyPvFlag = useRef<boolean>(true);
  const firstCallYearlyPvFlag = useRef<boolean>(true);

  useEffect(() => {
    if (firstCallSolarPanelVisibilityFlag.current) {
      firstCallSolarPanelVisibilityFlag.current = false;
    } else {
      setCommonStore((state) => {
        state.viewState.showSolarPanelVisibilityResultsPanel = true;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solarPanelVisibilityFlag]);

  useEffect(() => {
    if (firstCallDailyPvFlag.current) {
      firstCallDailyPvFlag.current = false;
    } else {
      setCommonStore((state) => {
        state.viewState.showDailyPvYieldPanel = true;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyPvFlag]);

  useEffect(() => {
    if (firstCallYearlyPvFlag.current) {
      firstCallYearlyPvFlag.current = false;
    } else {
      setCommonStore((state) => {
        state.viewState.showYearlyPvYieldPanel = true;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearlyPvFlag]);

  return <></>;
};

export default React.memo(AnalysisManager);
