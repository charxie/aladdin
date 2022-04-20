/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 *
 * A particle has the following properties
 *
 * solarPanel[0].tiltAngle, solarPanel[1].tiltAngle, ..., solarPanel[n].tiltAngle
 *
 */

import { FoundationModel } from '../../models/FoundationModel';
import { SolarPanelModel } from '../../models/SolarPanelModel';
import { HALF_PI } from '../../constants';
import { Util } from '../../Util';
import { Random } from '../../Random';
import { OptimizerSPO } from './OptimizerSPO';
import { Particle } from './Particle';
import { SearchMethod } from '../../types';

export class SolarPanelTiltAngleOptimizerSPO extends OptimizerSPO {
  solarPanels: SolarPanelModel[];

  constructor(
    solarPanels: SolarPanelModel[],
    foundation: FoundationModel,
    swarmSize: number,
    maximumSteps: number,
    convergenceThreshold: number,
    searchMethod: SearchMethod,
    localSearchRadius: number,
  ) {
    super(
      foundation,
      swarmSize,
      maximumSteps,
      solarPanels.length,
      convergenceThreshold,
      searchMethod,
      localSearchRadius,
    );
    this.solarPanels = solarPanels;
    // set the firstborn to be the current design
    const firstParticle: Particle = this.swarm.particles[0];
    for (const [i, panel] of solarPanels.entries()) {
      const normalizedValue = 0.5 * (1.0 + panel.tiltAngle / HALF_PI);
      firstParticle.position[i] = normalizedValue;
      if (this.searchMethod === SearchMethod.LOCAL_SEARCH_RANDOM_OPTIMIZATION) {
        for (let k = 1; k < this.swarm.particles.length; k++) {
          const particle: Particle = this.swarm.particles[k];
          let v = Random.gaussian() * this.localSearchRadius + normalizedValue;
          while (v < 0 || v > 1) {
            v = Random.gaussian() * this.localSearchRadius + normalizedValue;
          }
          particle.position[i] = v;
        }
      }
    }
  }

  applyBest(): void {
    const best = this.swarm.bestPositionOfSwarm;
    if (best) {
      for (let i = 0; i < best.length; i++) {
        this.solarPanels[i].tiltAngle = (2 * best[i] - 1) * HALF_PI;
      }
      console.log('Best: ' + SolarPanelTiltAngleOptimizerSPO.individualToString(best, this.swarm.bestFitness));
    }
  }

  private static individualToString(position: number[], bestFitness: number): string {
    let s = '(';
    for (let i = 0; i < position.length; i++) {
      s += Util.toDegrees((2 * position[i] - 1) * HALF_PI).toFixed(3) + ', ';
    }
    return s.substring(0, s.length - 2) + ') = ' + bestFitness.toFixed(5);
  }

  startEvolving(): void {
    this.outsideStepCounter = 0;
    this.computeCounter = 0;
    this.bestPositionOfSteps.fill(null);
  }

  // translate position to structure for the specified particle
  translateParticle(indexOfParticle: number): void {
    const particle: Particle = this.swarm.particles[indexOfParticle];
    for (let i = 0; i < particle.position.length; i++) {
      const p = particle.position[i];
      this.solarPanels[i].tiltAngle = (2 * p - 1) * HALF_PI;
    }
  }

  moveParticle(indexOfParticle: number, fitness: number): boolean {
    const swarmSize = this.swarm.particles.length;
    if (!this.converged) {
      const particle: Particle = this.swarm.particles[indexOfParticle];
      particle.fitness = fitness;
      // the first particle at the first step is used as a baseline
      if (this.computeCounter === 0 && indexOfParticle === 0) {
        this.bestPositionOfSteps[0] = [...particle.position];
      }
      const step = Math.floor(this.computeCounter / swarmSize);
      console.log(
        'Step ' +
          (step + 1) +
          ', particle ' +
          indexOfParticle +
          ' : ' +
          SolarPanelTiltAngleOptimizerSPO.individualToString(particle.position, fitness),
      );
      const savedParticle = this.swarmOfSteps[step]?.particles[indexOfParticle];
      if (savedParticle) {
        for (let k = 0; k < particle.position.length; k++) {
          savedParticle.position[k] = particle.position[k];
        }
        savedParticle.fitness = particle.fitness;
      }
      const isAtTheEndOfStep = this.computeCounter % swarmSize === swarmSize - 1;
      if (isAtTheEndOfStep) {
        this.swarm.evolve();
        const best = this.swarm.bestPositionOfSwarm;
        if (best) {
          this.bestPositionOfSteps[step + 1] = [...best];
        }
        this.converged = this.swarm.isNominallyConverged(this.convergenceThreshold);
      }
      this.computeCounter++;
    }
    return this.converged;
  }
}
