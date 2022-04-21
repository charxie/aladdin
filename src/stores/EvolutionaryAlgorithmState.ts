/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { GeneticAlgorithmParams } from './GeneticAlgorithmParams';
import { ParticleSwarmOptimizationParams } from './ParticleSwarmOptimizationParams';

export interface EvolutionaryAlgorithmState {
  solarPanelTiltAngleGeneticAlgorithmParams: GeneticAlgorithmParams;
  solarPanelTiltAngleParticleSwarmOptimizationParams: ParticleSwarmOptimizationParams;
}
