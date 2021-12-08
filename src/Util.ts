/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import { UNIT_VECTOR_POS_Z, UNIT_VECTOR_POS_Z_ARRAY, ZERO_TOLERANCE } from './constants';
import { Euler, Vector2, Vector3 } from 'three';
import { ObjectType, Orientation } from './types';
import { ElementModel } from './models/ElementModel';
import { PvModel } from './models/PvModel';
import { SolarPanelModel } from './models/SolarPanelModel';
import { SensorModel } from './models/SensorModel';
import { FoundationModel } from './models/FoundationModel';

export class Util {
  static panelizeLx(solarPanel: SolarPanelModel, pvModel: PvModel, value: number) {
    const dx = solarPanel.orientation === Orientation.portrait ? pvModel.width : pvModel.length;
    let lx = value ?? 1;
    const n = Math.max(1, Math.ceil((lx - dx / 2) / dx));
    lx = n * dx;
    return lx;
  }

  static panelizeLy(solarPanel: SolarPanelModel, pvModel: PvModel, value: number) {
    const dy = solarPanel.orientation === Orientation.portrait ? pvModel.length : pvModel.width;
    let ly = value ?? 1;
    const n = Math.max(1, Math.ceil((ly - dy / 2) / dy));
    ly = n * dy;
    return ly;
  }

  static doesNewSizeContainAllChildren(parent: ElementModel, children: ElementModel[], lx: number, ly: number) {
    const oldFoundationCenter = new Vector2(parent.cx, parent.cy);
    const newFoundationCenter = new Vector2(parent.cx + (lx - parent.lx) / 2, parent.cy + (ly - parent.ly) / 2);
    const childAbsPosMap = new Map<string, Vector2>();
    const v0 = new Vector2(0, 0);
    for (const c of children) {
      switch (c.type) {
        case ObjectType.Wall:
          // TODO
          break;
        case ObjectType.SolarPanel:
        case ObjectType.Sensor:
          const absPos = new Vector2(c.cx * parent.lx, c.cy * parent.ly).rotateAround(v0, parent.rotation[2]);
          absPos.add(oldFoundationCenter);
          childAbsPosMap.set(c.id, absPos);
          break;
      }
    }
    const childrenClone: ElementModel[] = [];
    for (const c of children) {
      const childClone = JSON.parse(JSON.stringify(c));
      childrenClone.push(childClone);
      const childAbsPos = childAbsPosMap.get(c.id);
      if (childAbsPos) {
        const relativePos = new Vector2().subVectors(childAbsPos, newFoundationCenter).rotateAround(v0, -c.rotation[2]);
        childClone.cx = relativePos.y / lx;
        childClone.cy = relativePos.y / ly;
      }
    }
    const parentClone = JSON.parse(JSON.stringify(parent)) as FoundationModel;
    parentClone.lx = lx;
    parentClone.ly = ly;
    return Util.doesParentContainAllChildren(parentClone, childrenClone);
  }

  // TODO: Vertical surfaces
  static doesParentContainAllChildren(parent: ElementModel, children: ElementModel[]) {
    for (const e of children) {
      switch (e.type) {
        case ObjectType.SolarPanel:
          if (Util.isIdentical(e.normal, UNIT_VECTOR_POS_Z_ARRAY)) {
            if (!Util.isSolarPanelWithinHorizontalSurface(e as SolarPanelModel, parent)) {
              return false;
            }
          }
          break;
        case ObjectType.Sensor:
          if (Util.isIdentical(e.normal, UNIT_VECTOR_POS_Z_ARRAY)) {
            if (!Util.isSensorWithin(e as SensorModel, parent)) {
              return false;
            }
          }
          break;
        case ObjectType.Wall:
          break;
      }
    }
    return true;
  }

  static isSensorWithin(sensor: SensorModel, parent: ElementModel) {
    return Math.abs(sensor.cx) < 0.5 - sensor.lx / parent.lx && Math.abs(sensor.cy) < 0.5 - sensor.ly / parent.ly;
  }

  static isSolarPanelWithinHorizontalSurface(solarPanel: SolarPanelModel, parent: ElementModel) {
    const x0 = solarPanel.cx * parent.lx;
    const y0 = solarPanel.cy * parent.ly;
    const cosaz = Math.cos(solarPanel.relativeAzimuth);
    const sinaz = Math.sin(solarPanel.relativeAzimuth);
    const dx = parent.lx * 0.5;
    const dy = parent.ly * 0.5;
    const rx = solarPanel.lx * 0.5;
    const ry = solarPanel.ly * 0.5;
    // vertex 1
    let x = x0 + rx * cosaz - ry * sinaz;
    let y = y0 + rx * sinaz + ry * cosaz;
    if (Math.abs(x) > dx || Math.abs(y) > dy) return false;
    // vertex 2
    x = x0 + rx * cosaz + ry * sinaz;
    y = y0 + rx * sinaz - ry * cosaz;
    if (Math.abs(x) > dx || Math.abs(y) > dy) return false;
    // vertex 3
    x = x0 - rx * cosaz - ry * sinaz;
    y = y0 - rx * sinaz + ry * cosaz;
    if (Math.abs(x) > dx || Math.abs(y) > dy) return false;
    // vertex 4
    x = x0 - rx * cosaz + ry * sinaz;
    y = y0 - rx * sinaz - ry * cosaz;
    if (Math.abs(x) > dx || Math.abs(y) > dy) return false;
    // all in
    return true;
  }

  static isSame(u: Vector3, v: Vector3) {
    return (
      Math.abs(u.x - v.x) < ZERO_TOLERANCE &&
      Math.abs(u.y - v.y) < ZERO_TOLERANCE &&
      Math.abs(u.z - v.z) < ZERO_TOLERANCE
    );
  }

  static isIdentical(u?: number[], v?: number[]) {
    if (!u || !v || u.length !== v.length) return false;
    if (u === v) return true;
    for (let i = 0; i < u.length; i++) {
      if (Math.abs(u[i] - v[i]) > ZERO_TOLERANCE) return false;
    }
    return true;
  }

  static isZero(x: number) {
    return Math.abs(x) < ZERO_TOLERANCE;
  }

  static deleteElement(a: any[], e: any) {
    const i = a.indexOf(e, 0);
    if (i > -1) {
      a.splice(i, 1);
    }
  }

  static relativeCoordinates(x: number, y: number, z: number, parent: ElementModel) {
    const v = new Vector3(x - parent.cx, y - parent.cy, z - parent.cz);
    v.applyEuler(new Euler().fromArray(parent.rotation.map((x) => -x)));
    v.x /= parent.lx;
    v.y /= parent.ly;
    v.z /= parent.lz;
    return v;
  }

  static absoluteCoordinates(x: number, y: number, z: number, parent: ElementModel) {
    const v = new Vector3(x * parent.lx, y * parent.ly, z * parent.lz);
    v.applyEuler(new Euler().fromArray(parent.rotation));
    v.x += parent.cx;
    v.y += parent.cy;
    v.z += parent.cz;
    return v;
  }

  static wallAbsolutePosition(v: Vector3, parent: ElementModel) {
    const parentPos = new Vector3(parent.cx, parent.cy);
    return new Vector3().addVectors(
      parentPos,
      new Vector3(v.x, v.y).applyAxisAngle(UNIT_VECTOR_POS_Z, parent.rotation[2]),
    );
  }

  static wallRelativePosition(v: Vector3, parent: ElementModel) {
    const parentPos = new Vector3(parent.cx, parent.cy);
    return new Vector3()
      .subVectors(new Vector3(v.x, v.y), parentPos)
      .applyAxisAngle(UNIT_VECTOR_POS_Z, -parent.rotation[2]);
  }

  static toRadians(degrees: number) {
    return degrees * (Math.PI / 180);
  }

  static toDegrees(radians: number) {
    return radians * (180 / Math.PI);
  }

  static sphericalToCartesianZ(sphereCoords: Vector3) {
    let a = sphereCoords.x * Math.cos(sphereCoords.z);
    let x = a * Math.cos(sphereCoords.y);
    let y = a * Math.sin(sphereCoords.y);
    let z = sphereCoords.x * Math.sin(sphereCoords.z);
    sphereCoords.set(x, y, z);
    return sphereCoords;
  }

  // the spherical law of cosines: https://en.wikipedia.org/wiki/Spherical_law_of_cosines
  static getDistance(lng1: number, lat1: number, lng2: number, lat2: number) {
    lng1 = Util.toRadians(lng1);
    lat1 = Util.toRadians(lat1);
    lng2 = Util.toRadians(lng2);
    lat2 = Util.toRadians(lat2);
    return Math.acos(
      Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(Math.abs(lng1 - lng2)),
    );
  }

  static minutesIntoDay(date: Date) {
    return date.getHours() * 60 + date.getMinutes();
  }

  static daysIntoYear(date: string) {
    return Util.dayOfYear(new Date(date));
  }

  static dayOfYear(date: Date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  }

  static daysOfMonth(month: number, year: number) {
    return new Date(year, month + 1, 0).getDate();
  }

  static fahrenheitToCelsius(temp: number) {
    return ((temp - 32) * 5) / 9;
  }

  static celsiusToFahrenheit(temp: number) {
    return temp * (9 / 5) + 32;
  }

  static getOS() {
    const userAgent = window.navigator.userAgent;
    const platform = window.navigator.platform;
    const macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'];
    const windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'];
    const iosPlatforms = ['iPhone', 'iPad', 'iPod'];
    let os = null;
    if (macosPlatforms.indexOf(platform) !== -1) {
      os = 'Mac OS';
    } else if (iosPlatforms.indexOf(platform) !== -1) {
      os = 'iOS';
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
      os = 'Windows';
    } else if (/Android/.test(userAgent)) {
      os = 'Android';
    } else if (!os && /Linux/.test(platform)) {
      os = 'Linux';
    }
    return os;
  }
}
