/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useEffect, useMemo, useState} from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Label,
    Legend,
    ReferenceLine,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {MONTHS, PRESET_COLORS} from "../constants";
import {WeatherDataType, GraphDatumEntry} from "../types";
import {useStore} from "../stores/common";
import {Util} from "../util";

export interface BarGraphProps {
    type: WeatherDataType;
    dataSource: GraphDatumEntry[];
    height: number;
    labelX?: string,
    labelY?: string,
    unitX?: string;
    unitY?: string;
    fractionDigits?: number;
    color?: string;

    [key: string]: any;
}

const BarGraph = ({
                      type,
                      dataSource,
                      height,
                      labelX,
                      labelY,
                      unitX,
                      unitY,
                      fractionDigits = 2,
                      color,
                      ...rest
                  }: BarGraphProps) => {

    const [dataSetCount, setDataSetCount] = useState<number>(0);
    const [horizontalGridLines, setHorizontalGridLines] = useState<boolean>(true);
    const [verticalGridLines, setVerticalGridLines] = useState<boolean>(true);
    const [legendDataKey, setLegendDataKey] = useState<string | null>(null);
    const now = useStore(state => state.date);

    //init
    useEffect(() => {
        if (!dataSource) {
            return;
        }
        const len = Array.isArray(dataSource) ? Object.keys(dataSource[0]).length - 1 : Object.keys(dataSource).length - 1;
        if (dataSetCount !== len) {
            setDataSetCount(len);
        }
    }, [dataSource]);

    const getBars = useMemo(() => {
        const bars = [];
        for (let i = 0; i < dataSetCount; i++) {
            let name = '';
            switch (type) {
                case WeatherDataType.MonthlyTemperatures:
                    name = i === 0 ? `Low` : 'High';
                    break;
                case WeatherDataType.SunshineHours:
                    name = 'Sunshine';
                    break;
                case WeatherDataType.HourlyTemperatures:
                    name = 'Temperature';
                    break;
            }
            const opacity = legendDataKey === null ? 1 : (legendDataKey === name ? 1 : 0.25);
            bars.push(
                <Bar
                    key={i}
                    name={name}
                    dataKey={name}
                    fill={color ? color : PRESET_COLORS[i]}
                    opacity={opacity}
                    isAnimationActive={false}
                />,
            );
        }
        return bars;
    }, [dataSetCount, legendDataKey]);

    // @ts-ignore
    const onMouseDown = (e) => {
    };

    // @ts-ignore
    const onMouseEnterLegend = (o) => {
        setLegendDataKey(o.dataKey);
    };

    // @ts-ignore
    const onMouseLeaveLegend = (o) => {
        setLegendDataKey(null);
    };

    return (
        <>
            {dataSource && (
                // need two div wrappers to disable the responsiveness of ResponsiveContainer
                <div id={'bar-graph-' + labelX + '-' + labelY}
                     style={{width: '100%', height: `${height}%`, position: 'relative'}}>
                    <div
                        style={{
                            userSelect: 'none',
                            width: '100%',
                            height: '100%',
                            position: 'absolute',
                            top: 0,
                            left: 0
                        }}
                    >
                        <ResponsiveContainer width="100%" height={`100%`}>
                            <BarChart
                                data={dataSource}
                                onMouseDown={onMouseDown}
                                margin={{
                                    top: 5,
                                    right: 30,
                                    left: 20,
                                    bottom: 30,
                                }}>
                                <Tooltip formatter={(value: number) => value.toFixed(fractionDigits) + ' ' + unitY}/>
                                <CartesianGrid
                                    vertical={verticalGridLines}
                                    horizontal={horizontalGridLines}
                                    stroke={"rgba(128, 128, 128, 0.3)"}
                                />
                                <ReferenceLine
                                    x={MONTHS[Math.floor(Util.daysIntoYear(now) / 365 * 12)]}
                                    stroke="orange"
                                    strokeWidth={2}
                                />
                                <XAxis dataKey={labelX}>
                                    <Label
                                        value={labelX + (unitX ? ' (' + unitX + ')' : '')}
                                        offset={0}
                                        position="bottom"
                                    />
                                </XAxis>
                                <YAxis domain={[0, 'auto']}>
                                    <Label
                                        dx={-15}
                                        value={labelY + (unitY ? ' (' + unitY + ')' : '')}
                                        offset={0}
                                        angle={-90}
                                        position="center"
                                    />
                                </YAxis>
                                {getBars}
                                {dataSetCount > 1 &&
                                <Legend iconType='plainline'
                                        verticalAlign='top'
                                        height={36}
                                        onMouseLeave={onMouseLeaveLegend}
                                        onMouseEnter={onMouseEnterLegend}/>}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )
            }
        </>
    );
};

export default BarGraph;
