/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import LineGraph from '../components/lineGraph';
import styled from 'styled-components';
import { useStore } from '../stores/common';
import { GraphDataType, ObjectType } from '../types';
import moment from 'moment';
import ReactDraggable, { DraggableEventHandler } from 'react-draggable';
import { Button, Space, Switch } from 'antd';
import { screenshot } from '../helpers';
import { ReloadOutlined, SaveOutlined, UnorderedListOutlined } from '@ant-design/icons';
import i18n from '../i18n/i18n';

const Container = styled.div`
  position: fixed;
  top: 80px;
  right: 10px;
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

export interface DailyPvYieldPanelProps {
  city: string | null;
  individualOutputs: boolean;
  setIndividualOutputs: (b: boolean) => void;
  analyzeDailyPvYield: () => void;
}

const DailyPvYieldPanel = ({
  city,
  individualOutputs = false,
  setIndividualOutputs,
  analyzeDailyPvYield,
}: DailyPvYieldPanelProps) => {
  const language = useStore((state) => state.language);
  const setCommonStore = useStore((state) => state.set);
  const viewState = useStore((state) => state.viewState);
  const countElementsByType = useStore((state) => state.countElementsByType);
  const dailyYield = useStore((state) => state.dailyPvYield);
  const solarPanelLabels = useStore((state) => state.solarPanelLabels);
  const now = new Date(useStore((state) => state.world.date));
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const wOffset = wrapperRef.current ? wrapperRef.current.clientWidth + 40 : 640;
  const hOffset = wrapperRef.current ? wrapperRef.current.clientHeight + 100 : 500;
  const [curPosition, setCurPosition] = useState({
    x: isNaN(viewState.dailyPvYieldPanelX) ? 0 : Math.max(viewState.dailyPvYieldPanelX, wOffset - window.innerWidth),
    y: isNaN(viewState.dailyPvYieldPanelY) ? 0 : Math.min(viewState.dailyPvYieldPanelY, window.innerHeight - hOffset),
  });
  const [sum, setSum] = useState(0);
  const panelSumRef = useRef(new Map<string, number>());

  const lang = { lng: language };
  const responsiveHeight = 100;

  useEffect(() => {
    let s = 0;
    panelSumRef.current.clear();
    for (const datum of dailyYield) {
      for (const prop in datum) {
        if (datum.hasOwnProperty(prop)) {
          if (prop !== 'Hour') {
            s += datum[prop] as number;
            panelSumRef.current.set(prop, (panelSumRef.current.get(prop) ?? 0) + (datum[prop] as number));
          }
        }
      }
    }
    setSum(s);
  }, [dailyYield]);

  // when the window is resized (the code depends on where the panel is originally anchored in the CSS)
  useEffect(() => {
    const handleResize = () => {
      setCurPosition({
        x: Math.max(viewState.dailyPvYieldPanelX, wOffset - window.innerWidth),
        y: Math.min(viewState.dailyPvYieldPanelY, window.innerHeight - hOffset),
      });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
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
      state.viewState.dailyPvYieldPanelX = Math.max(ui.x, wOffset - window.innerWidth);
      state.viewState.dailyPvYieldPanelY = Math.min(ui.y, window.innerHeight - hOffset);
    });
  };

  const closePanel = () => {
    setCommonStore((state) => {
      state.viewState.showDailyPvYieldPanel = false;
    });
  };

  const solarPanelCount = countElementsByType(ObjectType.SolarPanel);
  useEffect(() => {
    if (solarPanelCount < 2 && individualOutputs) {
      setIndividualOutputs(false);
    }
  }, [solarPanelCount]);

  const labelX = 'Hour';
  const labelY = i18n.t('solarPanelYieldPanel.YieldPerHour', lang);
  let totalTooltip = '';
  if (individualOutputs) {
    panelSumRef.current.forEach((value, key) => (totalTooltip += key + ': ' + value.toFixed(2) + '\n'));
    totalTooltip += '——————————\n';
    totalTooltip += i18n.t('word.Total', lang) + ': ' + sum.toFixed(2) + ' ' + i18n.t('word.kWh', lang);
  }

  return (
    <ReactDraggable
      handle={'.handle'}
      bounds={'parent'}
      axis="both"
      position={curPosition}
      onDrag={onDrag}
      onStop={onDragEnd}
    >
      <Container>
        <ColumnWrapper ref={wrapperRef}>
          <Header className="handle">
            <span>
              {i18n.t('solarPanelYieldPanel.SolarPanelDailyYield', lang)}:{i18n.t('sensorPanel.WeatherDataFrom', lang)}
              {city} | {moment(now).format('MM/DD')}
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
            type={GraphDataType.DailyPvYield}
            dataSource={dailyYield}
            labels={solarPanelLabels}
            height={responsiveHeight}
            labelX={labelX}
            labelY={labelY}
            unitY={i18n.t('word.kWh', lang)}
            yMin={0}
            curveType={'linear'}
            fractionDigits={2}
            symbolCount={24}
            referenceX={now.getHours()}
          />
          <Space style={{ alignSelf: 'center' }}>
            {individualOutputs && solarPanelCount > 1 ? (
              <Space title={totalTooltip} style={{ cursor: 'pointer', border: '2px solid #ccc', padding: '4px' }}>
                {i18n.t('solarPanelYieldPanel.HoverForBreakdown', lang)}
              </Space>
            ) : (
              <Space style={{ cursor: 'default' }}>
                {i18n.t('solarPanelYieldPanel.DailyTotal', lang)}:{sum.toFixed(2)} {i18n.t('word.kWh', lang)}
              </Space>
            )}
            {solarPanelCount > 1 && (
              <Switch
                title={i18n.t('solarPanelYieldPanel.ShowOutputsOfIndividualSolarPanels', lang)}
                checkedChildren={<UnorderedListOutlined />}
                unCheckedChildren={<UnorderedListOutlined />}
                checked={individualOutputs}
                onChange={(checked) => {
                  setIndividualOutputs(checked);
                  analyzeDailyPvYield();
                }}
              />
            )}
            <Button
              type="default"
              icon={<ReloadOutlined />}
              title={i18n.t('word.Update', lang)}
              onClick={analyzeDailyPvYield}
            />
            <Button
              type="default"
              icon={<SaveOutlined />}
              title={i18n.t('word.SaveAsImage', lang)}
              onClick={() => {
                screenshot('line-graph-' + labelX + '-' + labelY, 'daily-pv-yield', {});
              }}
            />
          </Space>
        </ColumnWrapper>
      </Container>
    </ReactDraggable>
  );
};

export default React.memo(DailyPvYieldPanel);
