/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { CuboidTexture, FlowerType, FoundationTexture, HumanName, TreeType } from '../types';

export interface ActionState {
  humanName: HumanName;

  flowerType: FlowerType;

  treeType: TreeType;
  treeSpread: number;
  treeHeight: number;

  foundationHeight: number;
  foundationColor: string;
  foundationTexture: FoundationTexture;

  cuboidHeight: number;
  cuboidFaceColors: string[];
  cuboidFaceTextures: CuboidTexture[];
}
