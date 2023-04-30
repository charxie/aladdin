/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef } from 'react';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import { ObjectType } from './types';
import { FoundationModel } from './models/FoundationModel';
import Foundation from './views/foundation';
import { SensorModel } from './models/SensorModel';
import Sensor from './views/sensor';
import { CuboidModel } from './models/CuboidModel';
import { HumanModel } from './models/HumanModel';
import Human from './views/human';
import { TreeModel } from './models/TreeModel';
import Tree from './views/tree';
import { SolarPanelModel } from './models/SolarPanelModel';
import { WallModel } from './models/WallModel';
import RoofRenderer from './views/roof/roofRenderer';
import { RoofModel } from './models/RoofModel';
import Polygon from './views/polygon';
import { PolygonModel } from './models/PolygonModel';
import { Group } from 'three';
import { useRefStore } from './stores/commonRef';
import ParabolicTrough from './views/parabolicTrough';
import { ParabolicTroughModel } from './models/ParabolicTroughModel';
import ParabolicDish from './views/parabolicDish';
import { ParabolicDishModel } from './models/ParabolicDishModel';
import FresnelReflector from './views/fresnelReflector';
import { FresnelReflectorModel } from './models/FresnelReflectorModel';
import Heliostat from './views/heliostat';
import { HeliostatModel } from './models/HeliostatModel';
import SolarPanel from './views/solarPanel/solarPanel';
import Flower from './views/flower';
import { FlowerModel } from './models/FlowerModel';
import Light from './views/light';
import { LightModel } from './models/LightModel';
import WallRenderer from './views/wall/wallRenderer';
import CuboidRenderer from './views/cuboid';
import { GROUND_ID } from './constants';

const ElementsRenderer: React.FC = () => {
  const elements = useStore(Selector.elements);
  const loadingFile = useStore(Selector.loadingFile);

  const groupRef = useRef<Group>(null);

  useEffect(() => {
    if (groupRef) {
      useRefStore.setState((state) => {
        state.contentRef = groupRef;
      });
    }
  }, []);

  useEffect(() => {
    if (loadingFile) {
      useStore.getState().set((state) => {
        state.loadingFile = false;
      });
    }
  }, [loadingFile]);

  // console.log(groupRef);
  // console.log(elements);
  console.debug(elements);

  return (
    <group ref={groupRef} name={'Content'}>
      {elements.map((e) => {
        switch (e.type) {
          case ObjectType.Foundation:
            return <Foundation key={e.id} {...(e as FoundationModel)} />;
          case ObjectType.Sensor: {
            const sensor = e as SensorModel;
            if (sensor.parentType === ObjectType.Cuboid) {
              return null;
            }
            return <Sensor key={e.id} {...sensor} />;
          }
          case ObjectType.Light: {
            const light = e as LightModel;
            if (light.parentType === ObjectType.Cuboid) {
              return null;
            }
            return <Light key={e.id} {...light} />;
          }
          case ObjectType.Cuboid:
            // only base cuboid will be rendered here
            if (e.parentId !== GROUND_ID) return null;
            return <CuboidRenderer key={e.id} elements={elements} cuboidModel={e as CuboidModel} />;
          case ObjectType.Human:
            return <Human key={e.id} {...(e as HumanModel)} />;
          case ObjectType.Tree:
            return <Tree key={e.id} {...(e as TreeModel)} />;
          case ObjectType.Flower:
            return <Flower key={e.id} {...(e as FlowerModel)} />;
          case ObjectType.SolarPanel:
            switch ((e as SolarPanelModel).parentType) {
              case ObjectType.Roof:
              case ObjectType.Wall:
              case ObjectType.Cuboid:
                return null;
              default:
                return <SolarPanel key={e.id} {...(e as SolarPanelModel)} />;
            }
          case ObjectType.ParabolicDish:
            return <ParabolicDish key={e.id} {...(e as ParabolicDishModel)} />;
          case ObjectType.ParabolicTrough:
            return <ParabolicTrough key={e.id} {...(e as ParabolicTroughModel)} />;
          case ObjectType.FresnelReflector:
            return <FresnelReflector key={e.id} {...(e as FresnelReflectorModel)} />;
          case ObjectType.Heliostat:
            return <Heliostat key={e.id} {...(e as HeliostatModel)} />;
          case ObjectType.Wall:
            return <WallRenderer key={e.id} {...(e as WallModel)} />;
          case ObjectType.Roof:
            return <RoofRenderer key={e.id} {...(e as RoofModel)} />;
          case ObjectType.Polygon:
            switch ((e as PolygonModel).parentType) {
              case ObjectType.Wall:
                return null;
              default:
                return <Polygon key={e.id} {...(e as PolygonModel)} />;
            }
          default:
            if (e.id) return <React.Fragment key={e.id} />;
        }
        return null;
      })}
    </group>
  );
};

export default React.memo(ElementsRenderer);
