/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import React, { useCallback } from 'react';
import { ObjectType } from 'src/types';
import { useStore } from 'src/stores/common';
import { shallow } from 'zustand/shallow';
import { ElementModel } from 'src/models/ElementModel';
import { WaterHeaterModel } from 'src/models/WaterHeaterModel';
import WaterHeater from './waterHeater';

export const WATER_HEATER_WRAPPER_NAME = 'Water_Heater_Wrapper_Group';

interface Props {
  foundationId: string;
  wrapperType: ObjectType;
}

/**
 * roof: position is absolute to foundation top surface, rotation is relative to foundation.
 * foundation: position is absolute to center of foundation, rotation is relative to foundation.
 * cuboid: position is absolute to center of cuboid, rotation is relative to parent cuboid.
 */
const WaterHeaterWrapper = React.memo(({ foundationId, wrapperType }: Props) => {
  const filterFn = useCallback(
    (e: ElementModel) => {
      if (e.type !== ObjectType.WaterHeater) return false;

      const wh = e as WaterHeaterModel;

      switch (wrapperType) {
        case ObjectType.Foundation: {
          return wh.foundationId === foundationId && wh.parentType === ObjectType.Roof;
        }
        case ObjectType.Cuboid:
        case ObjectType.Wall:
      }

      return false;
    },
    [foundationId, wrapperType],
  );

  const waterHeaters = useStore((state) => state.elements.filter(filterFn) as WaterHeaterModel[], shallow);

  switch (wrapperType) {
    case ObjectType.Foundation: {
      return (
        <group name={WATER_HEATER_WRAPPER_NAME}>
          {waterHeaters.map((sp) => (
            <WaterHeater key={sp.id} {...sp} />
          ))}
        </group>
      );
    }
    default:
      return null;
  }
});

export default WaterHeaterWrapper;
