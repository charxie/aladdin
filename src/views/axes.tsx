/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { Vector3 } from 'three';
import { Line } from '@react-three/drei';

export interface AxesProps {
  lineWidth?: number;
  endPoint?: number;
}

const Axes = ({ lineWidth = 1, endPoint = 1000 }: AxesProps) => {
  return (
    <mesh name={'Axes'}>
      <Line
        points={[new Vector3(-endPoint, 0, 0), new Vector3(endPoint, 0, 0)]}
        color={'red'}
        lineWidth={lineWidth}
      />
      <Line
        points={[new Vector3(0, -endPoint, 0), new Vector3(0, endPoint, 0)]}
        color={'blue'}
        lineWidth={lineWidth}
      />
      <Line
        points={[new Vector3(0, 0, 0), new Vector3(0, 0, endPoint)]}
        color={'green'}
        lineWidth={lineWidth}
      />
    </mesh>
  );
};

export default React.memo(Axes);
