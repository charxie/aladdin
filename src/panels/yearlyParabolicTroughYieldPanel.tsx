/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import LineGraph from '../components/lineGraph';
import styled from 'styled-components';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { GraphDataType, ObjectType } from '../types';
import { MONTHS } from '../constants';
import { Util } from '../Util';
import ReactDraggable, { DraggableEventHandler } from 'react-draggable';
import { Button, Space, Switch } from 'antd';
import { screenshot, showInfo } from '../helpers';
import { ReloadOutlined, SaveOutlined, UnorderedListOutlined } from '@ant-design/icons';
import i18n from '../i18n/i18n';

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
  width: 600px;
  height: 400px;
  padding-bottom: 10px;
  border: 2px solid gainsboro;
  border-radius: 10px 10px 10px 10px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
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

export interface YearlyParabolicTroughYieldPanelProps {
  city: string | null;
}

const YearlyParabolicTroughYieldPanel = ({ city }: YearlyParabolicTroughYieldPanelProps) => {
  const language = useStore(Selector.language);
  const setCommonStore = useStore(Selector.set);
  const daysPerYear = useStore(Selector.world.cspDaysPerYear) ?? 6;
  const now = useStore(Selector.world.date);
  const yearlyYield = useStore(Selector.yearlyParabolicTroughYield);
  const individualOutputs = useStore(Selector.yearlyParabolicTroughIndividualOutputs);
  const parabolicTroughLabels = useStore(Selector.parabolicTroughLabels);
  const countElementsByType = useStore(Selector.countElementsByType);
  const panelX = useStore(Selector.viewState.yearlyParabolicTroughYieldPanelX);
  const panelY = useStore(Selector.viewState.yearlyParabolicTroughYieldPanelY);

  // nodeRef is to suppress ReactDOM.findDOMNode() deprecation warning. See:
  // https://github.com/react-grid-layout/react-draggable/blob/v4.4.2/lib/DraggableCore.js#L159-L171
  const nodeRef = React.useRef(null);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const wOffset = wrapperRef.current ? wrapperRef.current.clientWidth + 40 : 640;
  const hOffset = wrapperRef.current ? wrapperRef.current.clientHeight + 100 : 500;
  const [curPosition, setCurPosition] = useState({
    x: isNaN(panelX) ? 0 : Math.max(panelX, wOffset - window.innerWidth),
    y: isNaN(panelY) ? 0 : Math.min(panelY, window.innerHeight - hOffset),
  });
  const [sum, setSum] = useState(0);
  const troughSumRef = useRef(new Map<string, number>());

  const responsiveHeight = 100;
  const referenceX = MONTHS[Math.floor((Util.daysIntoYear(now) / 365) * 12)];
  const lang = { lng: language };

  useEffect(() => {
    let s = 0;
    troughSumRef.current.clear();
    for (const datum of yearlyYield) {
      for (const prop in datum) {
        if (datum.hasOwnProperty(prop)) {
          if (prop !== 'Month') {
            s += datum[prop] as number;
            troughSumRef.current.set(prop, (troughSumRef.current.get(prop) ?? 0) + (datum[prop] as number));
          }
        }
      }
    }
    setSum(s);
  }, [yearlyYield]);

  // when the window is resized (the code depends on where the panel is originally anchored in the CSS)
  useEffect(() => {
    const handleResize = () => {
      setCurPosition({
        x: Math.max(panelX, wOffset - window.innerWidth),
        y: Math.min(panelY, window.innerHeight - hOffset),
      });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onDrag: DraggableEventHandler = (e, ui) => {
    setCurPosition({
      x: Math.max(ui.x, wOffset - window.innerWidth),
      y: Math.min(ui.y, window.innerHeight - hOffset),
    });
  };

  const onDragEnd: DraggableEventHandler = (e, ui) => {
    setCommonStore((state) => {
      state.viewState.yearlyParabolicTroughYieldPanelX = Math.max(ui.x, wOffset - window.innerWidth);
      state.viewState.yearlyParabolicTroughYieldPanelY = Math.min(ui.y, window.innerHeight - hOffset);
    });
  };

  const closePanel = () => {
    setCommonStore((state) => {
      state.viewState.showYearlyParabolicTroughYieldPanel = false;
    });
  };

  const parabolicTroughCount = countElementsByType(ObjectType.ParabolicTrough);
  useEffect(() => {
    if (parabolicTroughCount < 2 && individualOutputs) {
      setCommonStore((state) => {
        state.yearlyParabolicTroughIndividualOutputs = false;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parabolicTroughCount]);

  const labelX = 'Month';
  const labelY = i18n.t('parabolicTroughYieldPanel.Yield', lang);
  let totalTooltip = '';
  if (individualOutputs) {
    troughSumRef.current.forEach((value, key) => (totalTooltip += key + ': ' + value.toFixed(2) + '\n'));
    totalTooltip += '——————————\n';
    totalTooltip +=
      i18n.t('word.Total', lang) + ': ' + ((sum * 12) / daysPerYear).toFixed(2) + ' ' + i18n.t('word.kWh', lang);
  }

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
        <ColumnWrapper ref={wrapperRef}>
          <Header className="handle">
            <span>
              {i18n.t('parabolicTroughYieldPanel.ParabolicTroughYearlyYield', lang)}:{' '}
              {i18n.t('sensorPanel.WeatherDataFrom', lang)}
              {' ' + city}
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
            type={GraphDataType.YearlyParabolicTroughYield}
            dataSource={yearlyYield.map(({ Daylight, Clearness, ...item }) => item)}
            labels={parabolicTroughLabels}
            height={responsiveHeight}
            labelX={labelX}
            labelY={labelY}
            unitY={i18n.t('word.kWh', lang)}
            yMin={0}
            curveType={'natural'}
            fractionDigits={2}
            referenceX={referenceX}
          />
          <Space style={{ alignSelf: 'center' }}>
            {individualOutputs && parabolicTroughCount > 1 ? (
              <Space title={totalTooltip} style={{ cursor: 'pointer', border: '2px solid #ccc', padding: '4px' }}>
                {i18n.t('parabolicTroughYieldPanel.HoverForBreakdown', lang)}
              </Space>
            ) : (
              <Space>
                {i18n.t('parabolicTroughYieldPanel.YearlyTotal', lang)}:{((sum * 12) / daysPerYear).toFixed(2)}{' '}
                {i18n.t('word.kWh', lang)}
              </Space>
            )}
            {parabolicTroughCount > 1 && (
              <Switch
                title={i18n.t('parabolicTroughYieldPanel.ShowOutputsOfIndividualParabolicTroughs', lang)}
                checkedChildren={<UnorderedListOutlined />}
                unCheckedChildren={<UnorderedListOutlined />}
                checked={individualOutputs}
                onChange={(checked) => {
                  if (parabolicTroughCount === 0) {
                    showInfo(i18n.t('analysisManager.NoParabolicTroughForAnalysis', lang));
                    return;
                  }
                  showInfo(i18n.t('message.SimulationStarted', lang));
                  // give it 0.1 second for the info to show up
                  setTimeout(() => {
                    setCommonStore((state) => {
                      state.runYearlySimulationForParabolicTroughs = true;
                      state.pauseYearlySimulationForParabolicTroughs = false;
                      state.simulationInProgress = true;
                      state.yearlyParabolicTroughIndividualOutputs = checked;
                    });
                  }, 100);
                }}
              />
            )}
            <Button
              type="default"
              icon={<ReloadOutlined />}
              title={i18n.t('word.Update', lang)}
              onClick={() => {
                if (parabolicTroughCount === 0) {
                  showInfo(i18n.t('analysisManager.NoParabolicTroughForAnalysis', lang));
                  return;
                }
                showInfo(i18n.t('message.SimulationStarted', lang));
                // give it 0.1 second for the info to show up
                setTimeout(() => {
                  setCommonStore((state) => {
                    state.runYearlySimulationForParabolicTroughs = true;
                    state.pauseYearlySimulationForParabolicTroughs = false;
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
                screenshot('line-graph-' + labelX + '-' + labelY, 'yearly-parabolic-trough-yield', {}).then(() => {
                  showInfo(i18n.t('message:ScreenshotSaved', lang));
                });
              }}
            />
          </Space>
        </ColumnWrapper>
      </Container>
    </ReactDraggable>
  );
};

export default React.memo(YearlyParabolicTroughYieldPanel);
