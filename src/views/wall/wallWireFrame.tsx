/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Line } from '@react-three/drei';
import { HALF_PI } from '../../constants';
import { useStore } from 'src/stores/common';

interface WallWireFrameProps {
  lineColor: string;
  lineWidth: number;
  hx: number;
  hz: number;
  leftHeight?: number;
  rightHeight?: number;
  center?: number[];
  centerLeft?: number[];
  centerRight?: number[];
}

const WallWireFrame = React.memo(
  ({
    lineColor = 'black',
    lineWidth = 0.2,
    hx,
    hz,
    leftHeight = 2 * hz,
    rightHeight = 2 * hz,
    center,
    centerLeft,
    centerRight,
  }: WallWireFrameProps) => {
    const orthographic = useStore((state) => state.viewState.orthographic);

    const lowerLeft: [number, number, number] = [-hx, -hz + 0.001, 0.001];
    const lowerRight: [number, number, number] = [hx, -hz + 0.001, 0.001];
    const upperLeft: [number, number, number] = [-hx, leftHeight - hz - 0.001, 0.001];
    const upperRight: [number, number, number] = [hx, rightHeight - hz - 0.001, 0.001];

    const lx = hx * 2;
    const points = [];

    if (orthographic) {
      lineWidth = 2;
      points.push(upperRight);
    } else {
      points.push(upperLeft, lowerLeft, lowerRight, upperRight);
      if (centerRight) {
        const cr: [number, number, number] = [centerRight[0] * lx, centerRight[1] - hz, 0.001];
        points.push(cr);
      }

      if (center) {
        const c: [number, number, number] = [center[0] * lx, center[1] - hz, 0.001];
        points.push(c);
      }

      if (centerLeft) {
        const cl: [number, number, number] = [centerLeft[0] * lx, centerLeft[1] - hz, 0.001];
        points.push(cl);
      }
    }

    points.push(upperLeft);

    return (
      <React.Fragment>
        <Line rotation={[HALF_PI, 0, 0]} points={points} color={lineColor} lineWidth={lineWidth} />
      </React.Fragment>
    );
  },
);

export default WallWireFrame;
