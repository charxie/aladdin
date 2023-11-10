/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import LineGraph from '../components/lineGraph';
import styled from 'styled-components';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { ChartType, GraphDataType, ObjectType } from '../types';
import { FLOATING_WINDOW_OPACITY, MONTHS, Z_INDEX_FRONT_PANEL } from '../constants';
import ReactDraggable, { DraggableEventHandler } from 'react-draggable';
import { Button, Col, Row, Space, Switch, Popover } from 'antd';
import { saveCsv, screenshot, showInfo } from '../helpers';
import {
  CameraOutlined,
  CaretRightOutlined,
  ReloadOutlined,
  SaveOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import i18n from '../i18n/i18n';
import { Rectangle } from '../models/Rectangle';
import { usePrimitiveStore } from '../stores/commonPrimitive';
import { useDataStore } from '../stores/commonData';
import { useTranslation } from 'react-i18next';

const Container = styled.div`
  position: fixed;
  top: 85px;
  right: 36px;
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

export interface YearlyParabolicDishYieldPanelProps {
  city: string | null;
}

const YearlyParabolicDishYieldPanel = ({ city }: YearlyParabolicDishYieldPanelProps) => {
  const language = useStore(Selector.language);
  const loggable = useStore(Selector.loggable);
  const opacity = useStore(Selector.floatingWindowOpacity) ?? FLOATING_WINDOW_OPACITY;
  const setCommonStore = useStore(Selector.set);
  const daysPerYear = useStore(Selector.world.cspDaysPerYear) ?? 6;
  const now = new Date(useStore(Selector.world.date));
  const yearlyYield = useDataStore(Selector.yearlyParabolicDishYield);
  const individualOutputs = useStore(Selector.yearlyParabolicDishIndividualOutputs);
  const parabolicDishLabels = useDataStore(Selector.parabolicDishLabels);
  const countElementsByType = useStore(Selector.countElementsByType);
  const panelRect = useStore(Selector.viewState.yearlyParabolicDishYieldPanelRect);
  const simulationInProgress = usePrimitiveStore(Selector.simulationInProgress);
  const selectedFloatingWindow = useStore(Selector.selectedFloatingWindow);

  // nodeRef is to suppress ReactDOM.findDOMNode() deprecation warning. See:
  // https://github.com/react-grid-layout/react-draggable/blob/v4.4.2/lib/DraggableCore.js#L159-L171
  const nodeRef = React.useRef(null);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const resizeObserverRef = useRef<ResizeObserver>();
  const wOffset = wrapperRef.current ? wrapperRef.current.clientWidth + 40 : panelRect ? panelRect.width + 40 : 640;
  const hOffset = wrapperRef.current ? wrapperRef.current.clientHeight + 100 : panelRect ? panelRect.height + 100 : 500;
  const [curPosition, setCurPosition] = useState({
    x: panelRect ? Math.max(panelRect.x, wOffset - window.innerWidth) : 0,
    y: panelRect ? Math.min(panelRect.y, window.innerHeight - hOffset) : 0,
  });
  const [sum, setSum] = useState(0);
  const dishSumRef = useRef(new Map<string, number>());

  const referenceX = MONTHS[now.getMonth()];
  const lang = { lng: language };

  useEffect(() => {
    let s = 0;
    dishSumRef.current.clear();
    for (const datum of yearlyYield) {
      for (const prop in datum) {
        if (datum.hasOwnProperty(prop)) {
          if (prop !== 'Month') {
            s += datum[prop] as number;
            dishSumRef.current.set(prop, (dishSumRef.current.get(prop) ?? 0) + (datum[prop] as number));
          }
        }
      }
    }
    setSum(s);
  }, [yearlyYield]);

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
    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelRect, wOffset, hOffset]);

  useEffect(() => {
    if (wrapperRef.current) {
      if (!resizeObserverRef.current) {
        resizeObserverRef.current = new ResizeObserver(() => {
          setCommonStore((state) => {
            if (wrapperRef.current) {
              if (!state.viewState.dailyPvYieldPanelRect) {
                state.viewState.dailyPvYieldPanelRect = new Rectangle(0, 0, 600, 400);
              }
              state.viewState.dailyPvYieldPanelRect.width = wrapperRef.current.offsetWidth;
              state.viewState.dailyPvYieldPanelRect.height = wrapperRef.current.offsetHeight;
            }
          });
        });
      }
      resizeObserverRef.current.observe(wrapperRef.current);
    }
    return () => {
      resizeObserverRef.current?.disconnect();
    };
  }, []);

  const onDrag: DraggableEventHandler = (e, ui) => {
    setCurPosition({
      x: Math.max(ui.x, wOffset - window.innerWidth),
      y: Math.min(ui.y, window.innerHeight - hOffset),
    });
  };

  const onDragEnd: DraggableEventHandler = (e, ui) => {
    setCommonStore((state) => {
      if (!state.viewState.yearlyParabolicDishYieldPanelRect) {
        state.viewState.yearlyParabolicDishYieldPanelRect = new Rectangle(0, 0, 600, 400);
      }
      state.viewState.yearlyParabolicDishYieldPanelRect.x = Math.max(ui.x, wOffset - window.innerWidth);
      state.viewState.yearlyParabolicDishYieldPanelRect.y = Math.min(ui.y, window.innerHeight - hOffset);
    });
  };

  const closePanel = () => {
    setCommonStore((state) => {
      state.viewState.showYearlyParabolicDishYieldPanel = false;
      if (loggable) {
        state.actionInfo = {
          name: 'Close Parabolic Dish Yearly Yield Graph',
          timestamp: new Date().getTime(),
        };
      }
    });
  };

  const parabolicDishCount = countElementsByType(ObjectType.ParabolicDish);
  useEffect(() => {
    if (parabolicDishCount < 2 && individualOutputs) {
      setCommonStore((state) => {
        if (state.graphState) state.graphState.yearlyParabolicDishIndividualOutputs = false;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parabolicDishCount, individualOutputs]);

  const { t } = useTranslation();
  const labelX = t('word.Month', lang);
  const labelY = t('parabolicDishYieldPanel.Yield', lang);
  const yearScaleFactor = 12 / daysPerYear;
  const emptyGraph = yearlyYield && yearlyYield[0] ? Object.keys(yearlyYield[0]).length === 0 : true;

  return (
    <ReactDraggable
      nodeRef={nodeRef}
      handle={'.handle'}
      bounds={'parent'}
      axis="both"
      position={curPosition}
      onDrag={onDrag}
      onStop={onDragEnd}
      onMouseDown={() => {
        setCommonStore((state) => {
          state.selectedFloatingWindow = 'yearlyParabolicDishYieldPanel';
        });
      }}
    >
      <Container
        ref={nodeRef}
        style={{ zIndex: selectedFloatingWindow === 'yearlyParabolicDishYieldPanel' ? Z_INDEX_FRONT_PANEL : 9 }}
      >
        <ColumnWrapper
          ref={wrapperRef}
          style={{
            opacity: opacity,
            width: (panelRect ? panelRect.width : 600) + 'px',
            height: (panelRect ? panelRect.height : 400) + 'px',
          }}
        >
          <Header className="handle" style={{ direction: 'ltr' }}>
            <span>
              {t('parabolicDishYieldPanel.ParabolicDishYearlyYield', lang) + ': '}
              <span style={{ fontSize: '10px' }}>
                {t('sensorPanel.WeatherDataFrom', lang) + ' ' + city + ' | ' + now.getFullYear()}
              </span>
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
              {t('word.Close', lang)}
            </span>
          </Header>
          <LineGraph
            type={GraphDataType.YearlyParabolicDishYield}
            chartType={individualOutputs ? ChartType.Line : ChartType.Area}
            dataSource={yearlyYield.map(({ Daylight, Clearness, ...item }) => item)}
            labels={parabolicDishLabels}
            height={100}
            dataKeyAxisX={'Month'}
            labelX={labelX}
            labelY={labelY}
            unitY={t('word.kWh', lang)}
            yMin={0}
            curveType={'linear'}
            fractionDigits={2}
            referenceX={referenceX}
          />
          {!simulationInProgress && (
            <Space style={{ alignSelf: 'center', direction: 'ltr' }}>
              {individualOutputs && parabolicDishCount > 1 && dishSumRef.current.size > 0 ? (
                <Popover
                  title={[...dishSumRef.current.entries()].map((e, i) => (
                    <React.Fragment key={i}>
                      <Row style={{ textAlign: 'right' }}>
                        <Col span={16} style={{ textAlign: 'right', paddingRight: '8px' }}>
                          {e[0] + ': '}
                        </Col>
                        <Col span={8}>{(e[1] * yearScaleFactor).toFixed(2)}</Col>
                      </Row>
                      {i === dishSumRef.current.size - 1 && (
                        <>
                          <hr></hr>
                          <div style={{ textAlign: 'right' }}>
                            {t('word.Total', lang) +
                              ': ' +
                              (sum * yearScaleFactor).toFixed(2) +
                              ' ' +
                              t('word.kWh', lang)}
                          </div>
                        </>
                      )}
                    </React.Fragment>
                  ))}
                >
                  <Space style={{ cursor: 'pointer', border: '2px solid #ccc', padding: '4px' }}>
                    {t('shared.OutputBreakdown', lang)}
                  </Space>
                </Popover>
              ) : (
                <Space>
                  {t('parabolicDishYieldPanel.YearlyTotal', lang)}:{(sum * yearScaleFactor).toFixed(2)}{' '}
                  {t('word.kWh', lang)}
                </Space>
              )}
              {parabolicDishCount > 1 && (
                <Switch
                  title={t('parabolicDishYieldPanel.ShowOutputsOfIndividualParabolicDishes', lang)}
                  checkedChildren={<UnorderedListOutlined />}
                  unCheckedChildren={<UnorderedListOutlined />}
                  checked={individualOutputs}
                  onChange={(checked) => {
                    if (parabolicDishCount === 0) {
                      showInfo(t('analysisManager.NoParabolicDishForAnalysis', lang));
                      return;
                    }
                    showInfo(t('message.SimulationStarted', lang));
                    // give it 0.1 second for the info to show up
                    setTimeout(() => {
                      setCommonStore((state) => {
                        if (state.graphState) state.graphState.yearlyParabolicDishIndividualOutputs = checked;
                        if (loggable) {
                          state.actionInfo = {
                            name: 'Run Yearly Simulation For Parabolic Dishes: ' + (checked ? 'Individual' : 'Total'),
                            timestamp: new Date().getTime(),
                          };
                        }
                      });
                      usePrimitiveStore.getState().set((state) => {
                        state.runYearlySimulationForParabolicDishes = true;
                        state.pauseYearlySimulationForParabolicDishes = false;
                        state.simulationInProgress = true;
                      });
                    }, 100);
                  }}
                />
              )}
              <Button
                type="default"
                icon={emptyGraph ? <CaretRightOutlined /> : <ReloadOutlined />}
                title={t(emptyGraph ? 'word.Run' : 'word.Update', lang)}
                onClick={() => {
                  if (parabolicDishCount === 0) {
                    showInfo(t('analysisManager.NoParabolicDishForAnalysis', lang));
                    return;
                  }
                  showInfo(t('message.SimulationStarted', lang));
                  // give it 0.1 second for the info to show up
                  setTimeout(() => {
                    setCommonStore((state) => {
                      if (loggable) {
                        state.actionInfo = {
                          name: 'Run Yearly Simulation For Parabolic Dishes',
                          timestamp: new Date().getTime(),
                        };
                      }
                    });
                    usePrimitiveStore.getState().set((state) => {
                      state.runYearlySimulationForParabolicDishes = true;
                      state.pauseYearlySimulationForParabolicDishes = false;
                      state.simulationInProgress = true;
                    });
                  }, 100);
                }}
              />
              <Button
                type="default"
                icon={<CameraOutlined />}
                title={t('word.SaveAsImage', lang)}
                onClick={() => {
                  screenshot('line-graph-' + labelX + '-' + labelY, 'yearly-parabolic-dish-yield', {}).then(() => {
                    showInfo(t('message.ScreenshotSaved', lang));
                    if (loggable) {
                      setCommonStore((state) => {
                        state.actionInfo = {
                          name: 'Take Screenshot of Yearly Parabolic Dish Yield Graph',
                          timestamp: new Date().getTime(),
                        };
                      });
                    }
                  });
                }}
              />
              {yearlyYield && yearlyYield.length > 0 && (
                <Button
                  type="default"
                  icon={<SaveOutlined />}
                  title={t('word.SaveAsCsv', lang)}
                  onClick={() => {
                    saveCsv(yearlyYield, 'yearly-parabolic-dish-yield.csv');
                    showInfo(t('message.CsvFileSaved', lang));
                    if (loggable) {
                      setCommonStore((state) => {
                        state.actionInfo = {
                          name: 'Export Yearly Parabolic Dish Yield Result as CSV',
                          timestamp: new Date().getTime(),
                        };
                      });
                    }
                  }}
                />
              )}
            </Space>
          )}
        </ColumnWrapper>
      </Container>
    </ReactDraggable>
  );
};

export default React.memo(YearlyParabolicDishYieldPanel);
