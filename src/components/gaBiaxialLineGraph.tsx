/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useMemo, useRef, useState } from 'react';
import {
  CartesianGrid,
  Label,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { createSymbol, SYMBOLS } from './symbols';
import { PRESET_COLORS } from '../constants';
import { DatumEntry } from '../types';
import { CurveType } from 'recharts/types/shape/Curve';

export interface GaBiaxialLineGraphProps {
  dataSource: DatumEntry[];
  labels?: (string | undefined)[];
  height: number;
  dataKeyAxisX?: string;
  labelX?: string;
  labelY1?: string;
  labelY2?: string;
  unitX?: string;
  unitY1?: string;
  unitY2?: string;
  yMin1?: string | number;
  yMax1?: string | number;
  yMin2?: string | number;
  yMax2?: string | number;
  curveType?: CurveType;
  referenceX?: number | string;
  fractionDigits?: number;
}

const GaBiaxialLineGraph = ({
  dataSource,
  labels,
  height,
  dataKeyAxisX,
  labelX,
  labelY1,
  labelY2,
  unitX,
  unitY1,
  unitY2,
  yMin1 = 'auto',
  yMax1 = 'auto',
  yMin2 = 'auto',
  yMax2 = 'auto',
  curveType = 'linear',
  referenceX,
  fractionDigits = 2,
}: GaBiaxialLineGraphProps) => {
  const [legendDataKey, setLegendDataKey] = useState<string | null>(null);
  const horizontalGridLines = true;
  const verticalGridLines = true;
  const lineWidth = 2;
  const symbolSize = 1;
  const payloadRef = useRef<any[]>([]);

  // data source format starts from the genes of the fittest of each generation, followed by the best objective
  // and then the genes of all the individuals from each generation:
  // Generation, Gene1, Gene2, ..., Objective, I1, I2, I3, ...
  const getLines = useMemo(() => {
    if (!dataSource || dataSource.length === 0) return [];
    // the first column is for the x-axis, the last is for the objective
    const fittestLineCount = Object.keys(dataSource[0]).length - 1;
    const totalLineCount = dataSource[1] ? Object.keys(dataSource[1]).length - 1 : fittestLineCount;
    const symbolCount = dataSource.length;
    const lines = [];
    const lastFittestLineIndex = fittestLineCount - 1;
    const individualCount = (totalLineCount - fittestLineCount) / lastFittestLineIndex;
    let defaultSymbol;
    payloadRef.current.length = 0;
    for (let i = 0; i < totalLineCount; i++) {
      if (i < lastFittestLineIndex) {
        const name = labels && labels[i] && labels[i] !== '' ? labels[i] : 'Gene' + (i + 1);
        const opacity = legendDataKey === null ? 1 : legendDataKey === name ? 1 : 0.25;
        const symbol = createSymbol(SYMBOLS[i], symbolSize, symbolCount, opacity);
        if (i === 0) defaultSymbol = symbol;
        lines.push(
          <Line
            yAxisId="left"
            key={'left-' + i}
            type={curveType}
            name={name}
            dataKey={name}
            stroke={PRESET_COLORS[i]}
            strokeDasharray={'5 3'}
            opacity={opacity}
            strokeWidth={lineWidth / 2}
            dot={symbolCount > 0 ? (symbol ? symbol : defaultSymbol) : false}
            isAnimationActive={false}
          />,
        );
        payloadRef.current.push({ id: name, type: 'line', value: name, color: PRESET_COLORS[i] });
      } else if (i === lastFittestLineIndex) {
        const name = 'Objective';
        const opacity = legendDataKey === null ? 1 : legendDataKey === name ? 1 : 0.25;
        const symbol = createSymbol(SYMBOLS[i], symbolSize, symbolCount, opacity);
        lines.push(
          <Line
            yAxisId="right"
            key={'right'}
            type={curveType}
            name={name}
            dataKey={name}
            stroke={PRESET_COLORS[i]}
            opacity={opacity}
            strokeWidth={lineWidth}
            dot={symbolCount > 0 ? (symbol ? symbol : defaultSymbol) : false}
            isAnimationActive={false}
          />,
        );
        payloadRef.current.push({ id: name, type: 'line', value: name, color: PRESET_COLORS[lastFittestLineIndex] });
      } else {
        const geneIndex = Math.floor((i - fittestLineCount) / individualCount);
        const name = 'Individual' + (i + 1);
        const opacity = 0.5;
        const symbol = createSymbol(
          SYMBOLS[geneIndex],
          (symbolSize * 2) / 3,
          symbolCount,
          opacity,
          PRESET_COLORS[geneIndex],
        );
        lines.push(
          <Line
            yAxisId="left"
            key={'left-' + i}
            type={curveType}
            name={name}
            dataKey={name}
            opacity={opacity}
            stroke={PRESET_COLORS[geneIndex]}
            strokeWidth={0}
            dot={symbol ? symbol : defaultSymbol}
            isAnimationActive={false}
          />,
        );
      }
    }
    return lines;
  }, [dataSource, curveType, lineWidth, symbolSize, legendDataKey]);

  // @ts-ignore
  const onMouseDown = () => {};

  // @ts-ignore
  const onMouseEnterLegend = (o) => {
    setLegendDataKey(o.dataKey);
  };

  // @ts-ignore
  const onMouseLeaveLegend = () => {
    setLegendDataKey(null);
  };

  return (
    <>
      {dataSource && (
        // need two div wrappers to disable the responsiveness of ResponsiveContainer
        <div
          id={'biaxial-line-graph-' + labelX + '-' + labelY1 + '-' + labelY2}
          style={{ width: '100%', height: `${height}%`, position: 'relative' }}
        >
          <div
            style={{
              userSelect: 'none',
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              left: 0,
            }}
          >
            <ResponsiveContainer width="100%" height={`100%`}>
              <LineChart
                data={dataSource}
                onMouseDown={onMouseDown}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 30,
                }}
              >
                <Tooltip
                  formatter={(value: number) => value.toFixed(fractionDigits)}
                  content={({ active, payload }) => {
                    if (!active || !payload) return null;
                    return payload.map((p) => {
                      if (!p.name?.toString().startsWith('Individual')) {
                        return (
                          <div key={p.name}>
                            {p.name}: {(p.value as number).toFixed(fractionDigits)}
                          </div>
                        );
                      }
                      return null;
                    });
                  }}
                />
                <CartesianGrid
                  vertical={verticalGridLines}
                  horizontal={horizontalGridLines}
                  stroke={'rgba(128, 128, 128, 0.3)'}
                />
                <ReferenceLine yAxisId="left" x={referenceX} stroke="orange" strokeWidth={2} />
                <XAxis dataKey={dataKeyAxisX ?? labelX}>
                  <Label value={labelX + (unitX ? ' (' + unitX + ')' : '')} offset={0} position="bottom" />
                </XAxis>
                <YAxis domain={[yMin1, yMax1]} yAxisId="left">
                  <Label
                    dx={-15}
                    value={labelY1 + (unitY1 ? ' (' + unitY1 + ')' : '')}
                    offset={0}
                    angle={-90}
                    position="center"
                  />
                </YAxis>
                <YAxis domain={[yMin2, yMax2]} yAxisId="right" orientation={'right'}>
                  <Label
                    dx={15}
                    value={labelY2 + (unitY2 ? ' (' + unitY2 + ')' : '')}
                    offset={0}
                    angle={-90}
                    position="center"
                  />
                </YAxis>
                {getLines}
                <Legend
                  payload={payloadRef.current}
                  iconType="plainline"
                  verticalAlign="top"
                  height={36}
                  onMouseLeave={onMouseLeaveLegend}
                  onMouseEnter={onMouseEnterLegend}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </>
  );
};

export default GaBiaxialLineGraph;
