/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef } from 'react';
import { useStore } from './stores/common';
import * as Selector from './stores/selector';
import { Box3, Group, Vector3 } from 'three';
import { ObjectType } from './types';
import { FoundationModel } from './models/FoundationModel';
import Foundation from './views/foundation';
import { SensorModel } from './models/SensorModel';
import Sensor from './views/sensor';
import { CuboidModel } from './models/CuboidModel';
import Cuboid from './views/cuboid';
import { HumanModel } from './models/HumanModel';
import Human from './views/human';
import { TreeModel } from './models/TreeModel';
import Tree from './views/tree';
import { SolarPanelModel } from './models/SolarPanelModel';
import SolarPanel from './views/solarPanel';
import { WallModel } from './models/WallModel';
import Wall from './views/wall';
import Roof from './views/roof';
import { RoofModel } from './models/RoofModel';

export interface ElementsRendererProps {}

const ElementsRenderer: React.FC<ElementsRendererProps> = ({}: ElementsRendererProps) => {
  const setCommonStore = useStore(Selector.set);
  const heliodon = useStore(Selector.viewState.heliodon);
  const elements = useStore(Selector.elements);
  const groupRef = useRef<Group>();

  useEffect(() => {
    if (heliodon) {
      if (groupRef.current) {
        const boxes = [];
        for (const group of groupRef.current.children) {
          const children = group.children.filter((x) => x.userData['aabb']);
          for (const c of children) {
            boxes.push(new Box3().setFromObject(c));
          }
        }
        if (boxes.length > 0) {
          const min = new Vector3();
          const max = new Vector3();
          for (const box of boxes) {
            min.min(box.min);
            max.max(box.max);
          }

          let r = Math.abs(min.x);
          if (r < Math.abs(min.y)) r = Math.abs(min.y);
          if (r < Math.abs(min.z)) r = Math.abs(min.z);
          if (r < Math.abs(max.x)) r = Math.abs(max.x);
          if (r < Math.abs(max.y)) r = Math.abs(max.y);
          if (r < Math.abs(max.z)) r = Math.abs(max.z);
          setCommonStore((state) => {
            state.aabb = new Box3(min, max);
            if (!isNaN(r) && isFinite(r)) {
              // have to round this, otherwise the result is different even if nothing moved.
              state.heliodonRadius = Math.round(Math.max(10, r * 1.25)); // make it 25% larger than the bounding box
            }
          });
        }
      }
      setCommonStore((state) => {
        state.viewState.showHeliodonAfterBoundingBox = true;
      });
    } else {
      setCommonStore((state) => {
        state.viewState.showHeliodonAfterBoundingBox = false;
      });
    }
  }, [elements, heliodon]);

  return (
    <group name={'Content'} ref={groupRef}>
      {elements.map((e) => {
        switch (e.type) {
          case ObjectType.Foundation:
            return <Foundation key={e.id} {...(e as FoundationModel)} />;
          case ObjectType.Sensor:
            return <Sensor key={e.id} {...(e as SensorModel)} />;
          case ObjectType.Cuboid:
            return <Cuboid key={e.id} {...(e as CuboidModel)} />;
          case ObjectType.Human:
            return <Human key={e.id} {...(e as HumanModel)} />;
          case ObjectType.Tree:
            return <Tree key={e.id} {...(e as TreeModel)} />;
          case ObjectType.SolarPanel:
            return <SolarPanel key={e.id} {...(e as SolarPanelModel)} />;
          case ObjectType.Wall:
            return <Wall key={e.id} {...(e as WallModel)} />;
          case ObjectType.Roof:
            return <Roof key={e.id} {...(e as RoofModel)} />;
        }
      })}
    </group>
  );
};

export default React.memo(ElementsRenderer);
