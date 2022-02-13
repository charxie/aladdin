/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef } from 'react';
import {
  calculateDiffuseAndReflectedRadiation,
  calculatePeakRadiation,
  computeSunriseAndSunsetInMinutes,
  getSunDirection,
} from './sunTools';
import { Euler, Intersection, Object3D, Quaternion, Raycaster, Vector2, Vector3 } from 'three';
import { useThree } from '@react-three/fiber';
import { useStore } from '../stores/common';
import * as Selector from 'src/stores/selector';
import { ObjectType, TrackerType } from '../types';
import { Util } from '../Util';
import { AirMass } from './analysisConstants';
import {
  UNIT_VECTOR_NEG_X,
  UNIT_VECTOR_NEG_Y,
  UNIT_VECTOR_POS_X,
  UNIT_VECTOR_POS_Y,
  UNIT_VECTOR_POS_Z,
  ZERO_TOLERANCE,
} from '../constants';
import { ParabolicTroughModel } from '../models/ParabolicTroughModel';
import { SolarPanelModel } from '../models/SolarPanelModel';
import { FoundationModel } from '../models/FoundationModel';
import { CuboidModel } from '../models/CuboidModel';
import { showInfo } from '../helpers';
import i18n from '../i18n/i18n';
import { ParabolicDishModel } from '../models/ParabolicDishModel';
import { FresnelReflectorModel } from '../models/FresnelReflectorModel';

export interface DynamicSolarRadiationSimulationProps {
  city: string | null;
}

const DynamicSolarRadiationSimulation = ({ city }: DynamicSolarRadiationSimulationProps) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const world = useStore.getState().world;
  const elements = useStore.getState().elements;
  const getWeather = useStore(Selector.getWeather);
  const getParent = useStore(Selector.getParent);
  const setHeatmap = useStore(Selector.setHeatmap);
  const getHeatmap = useStore(Selector.getHeatmap);
  const runSimulation = useStore(Selector.runSimulation);

  const { scene } = useThree();
  const lang = { lng: language };
  const weather = getWeather(city ?? 'Boston MA, USA');
  const elevation = city ? weather.elevation : 0;
  const interval = 60 / world.timesPerHour;
  const ray = useMemo(() => new Raycaster(), []);
  const cellSize = world.solarRadiationHeatmapGridCellSize ?? 0.5;
  const objectsRef = useRef<Object3D[]>([]); // reuse array in intersection detection
  const intersectionsRef = useRef<Intersection[]>([]); // reuse array in intersection detection
  const requestRef = useRef<number>(0);
  const animationCompletedRef = useRef<boolean>(false);
  const dateRef = useRef<Date>(new Date(world.date));
  const originalDateRef = useRef<Date>(new Date(world.date));
  const cellOutputsMapRef = useRef<Map<string, number[][]>>(new Map<string, number[][]>());

  const sunMinutes = useMemo(() => {
    return computeSunriseAndSunsetInMinutes(dateRef.current, world.latitude);
  }, [world.latitude]);

  useEffect(() => {
    if (runSimulation) {
      init();
      requestRef.current = requestAnimationFrame(simulate);
      return () => {
        cancelAnimationFrame(requestRef.current);
        if (!animationCompletedRef.current) {
          showInfo(i18n.t('message.SimulationAborted', lang));
          setCommonStore((state) => {
            state.world.date = originalDateRef.current.toString();
          });
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runSimulation]);

  const init = () => {
    const day = dateRef.current.getDate();
    dateRef.current.setDate(day);
    dateRef.current.setHours(sunMinutes.sunrise / 60, sunMinutes.sunrise % 60);
    originalDateRef.current = new Date(world.date);
    animationCompletedRef.current = false;
    fetchObjects();
    for (const e of elements) {
      switch (e.type) {
        case ObjectType.Foundation:
        case ObjectType.Cuboid:
        case ObjectType.SolarPanel:
        case ObjectType.ParabolicTrough:
        case ObjectType.FresnelReflector:
        case ObjectType.ParabolicDish:
          cellOutputsMapRef.current.delete(e.id);
          break;
      }
    }
  };

  const updateHeatmaps = () => {
    // apply clearness and convert the unit of time step from minute to hour so that we get kWh
    const daylight = (sunMinutes.sunset - sunMinutes.sunrise) / 60;
    // divide by times per hour as the radiation is added up that many times
    const scaleFactor =
      daylight > ZERO_TOLERANCE
        ? weather.sunshineHours[dateRef.current.getMonth()] / (30 * daylight * world.timesPerHour)
        : 0;
    for (const e of elements) {
      switch (e.type) {
        case ObjectType.Foundation:
        case ObjectType.Cuboid:
        case ObjectType.SolarPanel:
        case ObjectType.ParabolicTrough:
        case ObjectType.FresnelReflector:
        case ObjectType.ParabolicDish:
          const data = cellOutputsMapRef.current.get(e.id);
          if (data) {
            for (let i = 0; i < data.length; i++) {
              for (let j = 0; j < data[i].length; j++) {
                data[i][j] *= scaleFactor;
              }
            }
            setHeatmap(
              e.id,
              data.map((a) => [...a]),
            );
          }
          break;
      }
    }
  };

  const simulate = () => {
    if (runSimulation) {
      const totalMinutes = dateRef.current.getMinutes() + dateRef.current.getHours() * 60;
      if (totalMinutes >= sunMinutes.sunset) {
        cancelAnimationFrame(requestRef.current);
        setCommonStore((state) => {
          state.runSimulation = false;
          state.world.date = originalDateRef.current.toString();
        });
        showInfo(i18n.t('message.SimulationCompleted', lang));
        animationCompletedRef.current = true;
        updateHeatmaps();
        // the following must be set with a different callback so that the useEffect hook of app.ts
        // is not triggered to cancel the solar radiation heat map
        setCommonStore((state) => {
          state.showSolarRadiationHeatmap = true;
        });
        return;
      }
      requestRef.current = requestAnimationFrame(simulate);
      dateRef.current.setHours(dateRef.current.getHours(), dateRef.current.getMinutes() + interval);
      setCommonStore((state) => {
        state.world.date = dateRef.current.toString();
      });
      for (const e of elements) {
        switch (e.type) {
          case ObjectType.Foundation:
            calculateFoundation(e as FoundationModel);
            break;
          case ObjectType.Cuboid:
            // calculateCuboid(e as CuboidModel);
            break;
          case ObjectType.SolarPanel:
            // calculateSolarPanel(e as SolarPanelModel);
            break;
          case ObjectType.ParabolicTrough:
            // calculateParabolicTrough(e as ParabolicTroughModel);
            break;
          case ObjectType.FresnelReflector:
            calculateFresnelReflector(e as FresnelReflectorModel);
            break;
          case ObjectType.ParabolicDish:
            // calculateParabolicDish(e as ParabolicDishModel);
            break;
        }
      }
    }
  };

  const inShadow = (elementId: string, position: Vector3, sunDirection: Vector3) => {
    if (objectsRef.current.length > 1) {
      intersectionsRef.current.length = 0;
      ray.set(position, sunDirection);
      const objects = objectsRef.current.filter((obj) => obj.uuid !== elementId);
      ray.intersectObjects(objects, false, intersectionsRef.current);
      return intersectionsRef.current.length > 0;
    }
    return false;
  };

  const fetchObjects = () => {
    const content = scene.children.filter((c) => c.name === 'Content');
    if (content.length > 0) {
      const components = content[0].children;
      objectsRef.current.length = 0;
      for (const c of components) {
        fetchSimulationElements(c, objectsRef.current);
      }
    }
  };

  const fetchSimulationElements = (obj: Object3D, arr: Object3D[]) => {
    if (obj.userData['simulation']) {
      arr.push(obj);
    }
    if (obj.children.length > 0) {
      for (const c of obj.children) {
        fetchSimulationElements(c, arr);
      }
    }
  };

  const calculateFoundation = (foundation: FoundationModel) => {
    const dayOfYear = Util.dayOfYear(dateRef.current);
    const lx = foundation.lx;
    const ly = foundation.ly;
    const lz = foundation.lz;
    const nx = Math.max(2, Math.round(lx / cellSize));
    const ny = Math.max(2, Math.round(ly / cellSize));
    const dx = lx / nx;
    const dy = ly / ny;
    const x0 = foundation.cx - lx / 2;
    const y0 = foundation.cy - ly / 2;
    const center2d = new Vector2(foundation.cx, foundation.cy);
    const v = new Vector3();
    let cellOutputs = cellOutputsMapRef.current.get(foundation.id);
    if (!cellOutputs) {
      cellOutputs = Array(nx)
        .fill(0)
        .map(() => Array(ny).fill(0));
      // send heat map data to common store for visualization
      cellOutputsMapRef.current.set(foundation.id, cellOutputs);
    }
    const sunDirection = getSunDirection(dateRef.current, world.latitude);
    if (sunDirection.z > 0) {
      // when the sun is out
      const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
      const indirectRadiation = calculateDiffuseAndReflectedRadiation(
        world.ground,
        dateRef.current.getMonth(),
        UNIT_VECTOR_POS_Z,
        peakRadiation,
      );
      const dot = UNIT_VECTOR_POS_Z.dot(sunDirection);
      const v2 = new Vector2();
      for (let kx = 0; kx < nx; kx++) {
        for (let ky = 0; ky < ny; ky++) {
          cellOutputs[kx][ky] += indirectRadiation;
          if (dot > 0) {
            v2.set(x0 + kx * dx, y0 + ky * dy);
            v2.rotateAround(center2d, foundation.rotation[2]);
            v.set(v2.x, v2.y, lz);
            if (!inShadow(foundation.id, v, sunDirection)) {
              // direct radiation
              cellOutputs[kx][ky] += dot * peakRadiation;
            }
          }
        }
      }
    }
  };

  const calculateFresnelReflector = (reflector: FresnelReflectorModel) => {
    const parent = getParent(reflector);
    if (!parent) throw new Error('parent of Fresnel reflector does not exist');
    if (parent.type !== ObjectType.Foundation) return;
    const dayOfYear = Util.dayOfYear(dateRef.current);
    const foundation = parent as FoundationModel;
    const center = Util.absoluteCoordinates(reflector.cx, reflector.cy, reflector.cz, parent);
    const normal = new Vector3().fromArray(reflector.normal);
    const originalNormal = normal.clone();
    const lx = reflector.lx;
    const ly = reflector.ly;
    const actualPoleHeight = reflector.poleHeight + lx / 2;
    const nx = Math.max(2, Math.round(reflector.lx / cellSize));
    const ny = Math.max(2, Math.round(reflector.ly / cellSize));
    const dx = lx / nx;
    const dy = ly / ny;
    // shift half cell size to the center of each grid cell
    const x0 = center.x - (lx - cellSize) / 2;
    const y0 = center.y - (ly - cellSize) / 2;
    const z0 = foundation.lz + actualPoleHeight + reflector.lz;
    const center2d = new Vector2(center.x, center.y);
    const v = new Vector3();
    let cellOutputs = cellOutputsMapRef.current.get(reflector.id);
    if (!cellOutputs) {
      cellOutputs = Array(nx)
        .fill(0)
        .map(() => Array(ny).fill(0));
      // send heat map data to common store for visualization
      cellOutputsMapRef.current.set(reflector.id, cellOutputs);
    }
    const rot = parent.rotation[2];
    const zRot = rot + reflector.relativeAzimuth;
    const zRotZero = Util.isZero(zRot);
    const cosRot = zRotZero ? 1 : Math.cos(zRot);
    const sinRot = zRotZero ? 0 : Math.sin(zRot);
    // convert the receiver's coordinates into those relative to the center of this reflector
    const receiverCenter = foundation.solarReceiver
      ? new Vector3(
          foundation.cx - reflector.cx,
          foundation.cy - reflector.cy,
          foundation.lz - reflector.cz + (foundation.solarReceiverTubeMountHeight ?? 10),
        )
      : undefined;
    // the rotation axis is in the north-south direction, so the relative azimuth is zero, which maps to (0, 1, 0)
    const rotationAxis = new Vector3(sinRot, cosRot, 0);
    const shiftedReceiverCenter = new Vector3();
    const sunDirection = getSunDirection(dateRef.current, world.latitude);
    if (sunDirection.z > 0) {
      // when the sun is out
      if (receiverCenter) {
        // the reflector moves only when there is a receiver
        shiftedReceiverCenter.set(receiverCenter.x, receiverCenter.y, receiverCenter.z);
        // how much the reflected light should shift in the direction of the receiver tube?
        const shift =
          sunDirection.z < ZERO_TOLERANCE
            ? 0
            : (-receiverCenter.z * (sunDirection.y * rotationAxis.y + sunDirection.x * rotationAxis.x)) /
              sunDirection.z;
        shiftedReceiverCenter.x += shift * rotationAxis.x;
        shiftedReceiverCenter.y -= shift * rotationAxis.y;
        const reflectorToReceiver = shiftedReceiverCenter.clone().normalize();
        // no need to normalize as both vectors to add have already been normalized
        let normalVector = reflectorToReceiver.add(sunDirection).multiplyScalar(0.5);
        if (Util.isSame(normalVector, UNIT_VECTOR_POS_Z)) {
          normalVector = new Vector3(-0.001, 0, 1).normalize();
        }
        normal.copy(
          originalNormal.clone().applyEuler(new Euler(0, Math.atan2(normalVector.x, normalVector.z), 0, 'ZXY')),
        );
      }
      const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
      const indirectRadiation = calculateDiffuseAndReflectedRadiation(
        world.ground,
        dateRef.current.getMonth(),
        normal,
        peakRadiation,
      );
      const dot = normal.dot(sunDirection);
      const v2 = new Vector2();
      let tmpX = 0;
      for (let ku = 0; ku < nx; ku++) {
        tmpX = x0 + ku * dx;
        for (let kv = 0; kv < ny; kv++) {
          cellOutputs[ku][kv] += indirectRadiation;
          if (dot > 0) {
            v2.set(tmpX, y0 + kv * dy);
            if (!zRotZero) v2.rotateAround(center2d, zRot);
            v.set(v2.x, v2.y, z0);
            if (!inShadow(reflector.id, v, sunDirection)) {
              cellOutputs[ku][kv] += dot * peakRadiation;
            }
          }
        }
      }
    }
  };

  return <></>;
};

export default React.memo(DynamicSolarRadiationSimulation);
