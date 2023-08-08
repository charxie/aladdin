/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import { ElementModel } from 'src/models/ElementModel';
import { FoundationModel } from 'src/models/FoundationModel';
import { SolarPanelModel } from 'src/models/SolarPanelModel';
import { WindowModel } from 'src/models/WindowModel';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import SolarPanelOnRoof from '../solarPanel/solarPanelOnRoof';
import shallow from 'zustand/shallow';
import Window from '../window/window';
import WallRenderer from '../wall/wallRenderer';
import { WallModel } from 'src/models/WallModel';

const BuildingRenderer = ({ foundationModel }: { foundationModel: FoundationModel }) => {
  const { id, cx, cy, lx, ly, lz, rotation } = foundationModel;

  const isBuildingParts = (e: ElementModel) => {
    return (
      e.foundationId === id &&
      (e.type === ObjectType.Wall ||
        (e.type === ObjectType.SolarPanel && (e as SolarPanelModel).parentType === ObjectType.Roof) ||
        (e.type === ObjectType.Window && (e as WindowModel).parentType === ObjectType.Roof))
    );
  };

  const buildingParts = useStore((state) => state.elements.filter(isBuildingParts), shallow);

  return (
    <group name={'Building Parts'} position={[cx, cy, lz]} rotation={[0, 0, rotation[2]]}>
      {buildingParts.map((e) => {
        switch (e.type) {
          case ObjectType.Wall: {
            return <WallRenderer key={e.id} wallModel={e as WallModel} foundationModel={foundationModel} />;
          }
          case ObjectType.SolarPanel:
            return (
              <SolarPanelOnRoof
                key={e.id}
                {...(e as SolarPanelModel)}
                cx={e.cx * lx}
                cy={e.cy * ly}
                cz={e.cz}
                foundationModel={foundationModel}
              />
            );
          case ObjectType.Window:
            return <Window key={e.id} {...(e as WindowModel)} cz={e.cz} />;
          default:
            return null;
        }
      })}
    </group>
  );
};

export default BuildingRenderer;
