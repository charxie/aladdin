/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import LineGraph from '../components/lineGraph';
import styled from 'styled-components';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { ChartType, GraphDataType, SolarStructure } from '../types';
import moment from 'moment';
import ReactDraggable, { DraggableEventHandler } from 'react-draggable';
import { Button, Space } from 'antd';
import { screenshot, showInfo } from '../helpers';
import { CaretRightOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import i18n from '../i18n/i18n';
import SutBiaxialLineGraph from '../components/sutBiaxialLineGraph';
import { Rectangle } from '../models/Rectangle';
import { FLOATING_WINDOW_OPACITY } from '../constants';
import { usePrimitiveStore } from '../stores/commonPrimitive';

const Container = styled.div`
  position: fixed;
  top: 80px;
  right: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  z-index: 9;
`;

const ColumnWrapper = styled.div`
  background-color: #f8f8f8;
  position: absolute;
  right: 0;
  top: 0;
  min-width: 400px;
  max-width: 800px;
  min-height: 200px;
  max-height: 600px;
  padding-bottom: 10px;
  border: 2px solid gainsboro;
  border-radius: 10px 10px 10px 10px;
  display: flex;
  flex-direction: column;
  overflow-x: auto;
  overflow-y: auto;
  resize: both;
  direction: rtl;
`;

const Header = styled.div`
  border-radius: 10px 10px 0 0;
  width: 100%;
  height: 24px;
  padding: 10px;
  background-color: #e8e8e8;
  color: #888;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;

  svg.icon {
    height: 16px;
    width: 16px;
    padding: 8px;
    fill: #666;
  }
`;

export interface DailySolarUpdraftTowerYieldPanelProps {
  city: string | null;
}

const DailySolarUpdraftTowerYieldPanel = ({ city }: DailySolarUpdraftTowerYieldPanelProps) => {
  const language = useStore(Selector.language);
  const loggable = useStore(Selector.loggable);
  const opacity = useStore(Selector.floatingWindowOpacity) ?? FLOATING_WINDOW_OPACITY;
  const setCommonStore = useStore(Selector.set);
  const now = new Date(useStore(Selector.world.date));
  const countSolarStructuresByType = useStore(Selector.countSolarStructuresByType);
  const dailyYield = useStore(Selector.dailyUpdraftTowerYield);
  const dailyResults = useStore(Selector.dailyUpdraftTowerResults);
  const individualOutputs = usePrimitiveStore(Selector.dailyUpdraftTowerIndividualOutputs);
  const panelRect = useStore(Selector.viewState.dailyUpdraftTowerYieldPanelRect);
  const updraftTowerLabels = useStore(Selector.updraftTowerLabels);
  const simulationInProgress = usePrimitiveStore(Selector.simulationInProgress);

  // nodeRef is to suppress ReactDOM.findDOMNode() deprecation warning. See:
  // https://github.com/react-grid-layout/react-draggable/blob/v4.4.2/lib/DraggableCore.js#L159-L171
  const nodeRef = React.useRef(null);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver>();
  const wOffset = wrapperRef.current ? wrapperRef.current.clientWidth + 40 : panelRect ? panelRect.width + 40 : 680;
  const hOffset = wrapperRef.current ? wrapperRef.current.clientHeight + 100 : panelRect ? panelRect.height + 100 : 650;
  const [curPosition, setCurPosition] = useState({
    x: panelRect ? Math.max(panelRect.x, wOffset - window.innerWidth) : 0,
    y: panelRect ? Math.min(panelRect.y, window.innerHeight - hOffset) : 0,
  });
  const [sum, setSum] = useState(0);
  const towerSumRef = useRef(new Map<string, number>());

  const lang = { lng: language };

  useEffect(() => {
    let s = 0;
    towerSumRef.current.clear();
    for (const datum of dailyYield) {
      for (const prop in datum) {
        if (datum.hasOwnProperty(prop)) {
          if (prop !== 'Hour') {
            s += datum[prop] as number;
            towerSumRef.current.set(prop, (towerSumRef.current.get(prop) ?? 0) + (datum[prop] as number));
          }
        }
      }
    }
    setSum(s);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyYield]);

  useEffect(() => {
    setCurPosition({
      x: Math.max(panelRect?.x, wOffset - window.innerWidth),
      y: Math.min(panelRect?.y, window.innerHeight - hOffset),
    });
  }, [panelRect, wOffset, hOffset]);

  // when the window is resized (the code depends on where the panel is originally anchored in the CSS)
  useEffect(() => {
    const handleWindowResize = () => {
      setCurPosition({
        x: Math.max(panelRect?.x, wOffset - window.innerWidth),
        y: Math.min(panelRect?.y, window.innerHeight - hOffset),
      });
    };
    window.addEventListener('resize', handleWindowResize);
    if (wrapperRef.current) {
      if (!resizeObserverRef.current) {
        resizeObserverRef.current = new ResizeObserver(() => {
          setCommonStore((state) => {
            if (wrapperRef.current) {
              if (!state.viewState.dailyUpdraftTowerYieldPanelRect) {
                state.viewState.dailyUpdraftTowerYieldPanelRect = new Rectangle(0, 0, 640, 550);
              }
              state.viewState.dailyUpdraftTowerYieldPanelRect.width = wrapperRef.current.offsetWidth;
              state.viewState.dailyUpdraftTowerYieldPanelRect.height = wrapperRef.current.offsetHeight;
            }
          });
        });
      }
      resizeObserverRef.current.observe(wrapperRef.current);
    }
    return () => {
      window.removeEventListener('resize', handleWindowResize);
      resizeObserverRef.current?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelRect, wOffset, hOffset]);

  const onDrag: DraggableEventHandler = (e, ui) => {
    setCurPosition({
      x: Math.max(ui.x, wOffset - window.innerWidth),
      y: Math.min(ui.y, window.innerHeight - hOffset),
    });
  };

  const onDragEnd: DraggableEventHandler = (e, ui) => {
    setCommonStore((state) => {
      if (!state.viewState.dailyUpdraftTowerYieldPanelRect) {
        state.viewState.dailyUpdraftTowerYieldPanelRect = new Rectangle(0, 0, 640, 550);
      }
      state.viewState.dailyUpdraftTowerYieldPanelRect.x = Math.max(ui.x, wOffset - window.innerWidth);
      state.viewState.dailyUpdraftTowerYieldPanelRect.y = Math.min(ui.y, window.innerHeight - hOffset);
    });
  };

  const closePanel = () => {
    setCommonStore((state) => {
      state.viewState.showDailyUpdraftTowerYieldPanel = false;
      if (loggable) {
        state.actionInfo = {
          name: 'Close Solar Updraft Tower Daily Yield Graph',
          timestamp: new Date().getTime(),
        };
      }
    });
  };

  const towerCount = countSolarStructuresByType(SolarStructure.UpdraftTower);
  useEffect(() => {
    if (towerCount < 2 && individualOutputs) {
      usePrimitiveStore.setState((state) => {
        state.dailyUpdraftTowerIndividualOutputs = false;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [towerCount, individualOutputs]);

  const labelHour = i18n.t('word.Hour', lang);
  const labelYield = i18n.t('updraftTowerYieldPanel.YieldPerHour', lang);
  const labelTemperature = i18n.t('updraftTowerYieldPanel.ChimneyAirTemperature', lang);
  const labelSpeed = i18n.t('updraftTowerYieldPanel.ChimneyWindSpeed', lang);
  let totalTooltip = '';
  if (towerCount > 1) {
    towerSumRef.current.forEach((value, key) => (totalTooltip += key + ': ' + value.toFixed(2) + '\n'));
    totalTooltip += '——————————\n';
    totalTooltip += i18n.t('word.Total', lang) + ': ' + sum.toFixed(2) + ' ' + i18n.t('word.kWh', lang);
  }
  const emptyGraph = dailyYield && dailyYield[0] ? Object.keys(dailyYield[0]).length === 0 : true;

  return (
    <ReactDraggable
      nodeRef={nodeRef}
      handle={'.handle'}
      bounds={'parent'}
      axis="both"
      position={curPosition}
      onDrag={onDrag}
      onStop={onDragEnd}
    >
      <Container ref={nodeRef}>
        <ColumnWrapper
          ref={wrapperRef}
          style={{
            opacity: opacity,
            width: (panelRect ? panelRect.width : 640) + 'px',
            height: (panelRect ? panelRect.height : 550) + 'px',
          }}
        >
          <Header className="handle" style={{ direction: 'ltr' }}>
            <span>
              {i18n.t('updraftTowerYieldPanel.UpdraftTowerDailyYield', lang) + ': '}
              <label style={{ fontSize: '10px' }}>
                {i18n.t('sensorPanel.WeatherDataFrom', lang) + ' ' + city + ' | ' + moment(now).format('MM/DD')}
              </label>
            </span>
            <span
              style={{ cursor: 'pointer' }}
              onTouchStart={() => {
                closePanel();
              }}
              onMouseDown={() => {
                closePanel();
              }}
            >
              {i18n.t('word.Close', lang)}
            </span>
          </Header>
          <LineGraph
            type={GraphDataType.DailyUpdraftTowerYield}
            chartType={individualOutputs ? ChartType.Line : ChartType.Area}
            dataSource={dailyYield}
            labels={updraftTowerLabels}
            height={100}
            dataKeyAxisX={'Hour'}
            labelX={labelHour}
            labelY={labelYield}
            unitY={i18n.t('word.kWh', lang)}
            yMin={0}
            curveType={'linear'}
            fractionDigits={2}
            symbolCount={24}
            referenceX={now.getHours()}
          />
          <SutBiaxialLineGraph
            dataSource={dailyResults}
            height={100}
            dataKeyAxisX={'Hour'}
            labelX={labelHour}
            labelY1={labelTemperature}
            labelY2={labelSpeed}
            unitY1={'°C'}
            unitY2={i18n.t('word.MeterPerSecond', lang)}
            yMin1={0}
            yMin2={0}
            curveType={'linear'}
            fractionDigits={2}
            symbolCount={24}
            referenceX={now.getHours()}
          />
          {!simulationInProgress && (
            <Space style={{ alignSelf: 'center', direction: 'ltr' }}>
              {towerCount > 1 ? (
                <Space title={totalTooltip} style={{ cursor: 'pointer', border: '2px solid #ccc', padding: '4px' }}>
                  {i18n.t('updraftTowerYieldPanel.HoverForBreakdown', lang)}
                </Space>
              ) : (
                <Space style={{ cursor: 'default' }}>
                  {i18n.t('updraftTowerYieldPanel.DailyTotal', lang)}:{sum.toFixed(2)} {i18n.t('word.kWh', lang)}
                </Space>
              )}
              <Button
                type="default"
                icon={emptyGraph ? <CaretRightOutlined /> : <ReloadOutlined />}
                title={i18n.t(emptyGraph ? 'word.Run' : 'word.Update', lang)}
                onClick={() => {
                  if (towerCount === 0) {
                    showInfo(i18n.t('analysisManager.NoSolarUpdraftTowerForAnalysis', lang));
                    return;
                  }
                  showInfo(i18n.t('message.SimulationStarted', lang));
                  // give it 0.1 second for the info to show up
                  setTimeout(() => {
                    setCommonStore((state) => {
                      if (loggable) {
                        state.actionInfo = {
                          name: 'Run Daily Simulation For Solar Updraft Tower',
                          timestamp: new Date().getTime(),
                        };
                      }
                    });
                    usePrimitiveStore.setState((state) => {
                      state.runDailySimulationForUpdraftTower = true;
                      state.pauseDailySimulationForUpdraftTower = false;
                      state.simulationInProgress = true;
                    });
                  }, 100);
                }}
              />
              <Button
                type="default"
                icon={<SaveOutlined />}
                title={i18n.t('word.SaveAsImage', lang)}
                onClick={() => {
                  screenshot('line-graph-' + labelHour + '-' + labelYield, 'daily-updraft-tower-yield', {}).then(() => {
                    showInfo(i18n.t('message.ScreenshotSaved', lang));
                  });
                }}
              />
            </Space>
          )}
        </ColumnWrapper>
      </Container>
    </ReactDraggable>
  );
};

export default React.memo(DailySolarUpdraftTowerYieldPanel);
