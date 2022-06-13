/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { Line, Plane, Sphere } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { HALF_PI } from 'src/constants';
import { ElementModel } from 'src/models/ElementModel';
import { Point2 } from 'src/models/Point2';
import { GambrelRoofModel } from 'src/models/RoofModel';
import { WallModel } from 'src/models/WallModel';
import { useStore } from 'src/stores/common';
import { useStoreRef } from 'src/stores/commonRef';
import * as Selector from 'src/stores/selector';
import { UnoableResizeGambrelAndMansardRoofRidge } from 'src/undo/UndoableResize';
import { Util } from 'src/Util';
import {
  BufferGeometry,
  DoubleSide,
  Euler,
  Float32BufferAttribute,
  Mesh,
  Raycaster,
  Texture,
  Vector2,
  Vector3,
} from 'three';
import {
  ConvexGeoProps,
  getDistance,
  getIntersectionPoint,
  getNormal,
  handleRoofContextMenu,
  handleRoofPointerDown,
  handleUndoableResizeRoofHeight,
  isRoofValid,
  RoofWireframeProps,
  useRoofTexture,
} from './roof';
import { CSG } from 'three-csg-ts';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry';
import { RoofTexture, ObjectType } from 'src/types';

enum RoofHandleType {
  TopMid = 'TopMid',
  TopLeft = 'TopLeft',
  TopRight = 'TopRight',
  FrontLeft = 'FrontLeft',
  FrontRight = 'FrontRight',
  BackLeft = 'BackLeft',
  BackRight = 'BackRight',
  Null = 'Null',
}

const GambrelRoofWirefram = React.memo(({ roofSegments, thickness, lineWidth, lineColor }: RoofWireframeProps) => {
  const peripheryPoints: Vector3[] = [];
  const thicknessVector = new Vector3(0, 0, thickness);

  const frontSideSegmentPoints = roofSegments[0].points;
  const frontTopSegmentPoints = roofSegments[1].points;
  const backTopSegmentPoints = roofSegments[2].points;
  const backSideSegmentPoints = roofSegments[3].points;

  peripheryPoints.push(
    frontTopSegmentPoints[3],
    frontTopSegmentPoints[0],
    frontSideSegmentPoints[0],
    frontSideSegmentPoints[1],
    frontSideSegmentPoints[2],
    frontTopSegmentPoints[2],
    backTopSegmentPoints[2],
    backSideSegmentPoints[0],
    backSideSegmentPoints[1],
    backTopSegmentPoints[3],
    frontTopSegmentPoints[3],
  );

  const isFlat = Math.abs(frontSideSegmentPoints[0].z) < 0.15;

  const periphery = <Line points={peripheryPoints} lineWidth={lineWidth} color={lineColor} />;
  const ridges = (
    <>
      <Line points={[frontTopSegmentPoints[0], frontTopSegmentPoints[1]]} lineWidth={lineWidth} color={lineColor} />
      <Line points={[frontTopSegmentPoints[2], frontTopSegmentPoints[3]]} lineWidth={lineWidth} color={lineColor} />
      <Line points={[backTopSegmentPoints[2], backTopSegmentPoints[3]]} lineWidth={lineWidth} color={lineColor} />
    </>
  );
  return (
    <>
      {periphery}
      {!isFlat && ridges}
      <group position={[0, 0, thickness]}>
        {periphery}
        {!isFlat && ridges}
      </group>
      <Line
        points={[frontSideSegmentPoints[0], frontSideSegmentPoints[0].clone().add(thicknessVector)]}
        lineWidth={lineWidth}
        color={lineColor}
      />
      <Line
        points={[frontSideSegmentPoints[1], frontSideSegmentPoints[1].clone().add(thicknessVector)]}
        lineWidth={lineWidth}
        color={lineColor}
      />
      <Line
        points={[backSideSegmentPoints[0], backSideSegmentPoints[0].clone().add(thicknessVector)]}
        lineWidth={lineWidth}
        color={lineColor}
      />
      <Line
        points={[backSideSegmentPoints[1], backSideSegmentPoints[1].clone().add(thicknessVector)]}
        lineWidth={lineWidth}
        color={lineColor}
      />
    </>
  );
});

const intersectionPlanePosition = new Vector3();
const intersectionPlaneRotation = new Euler();
const zeroVector2 = new Vector2();
const zVector3 = new Vector3(0, 0, 1);

const GambrelRoof = ({
  id,
  cx,
  cy,
  cz,
  lz,
  wallsId,
  parentId,
  topRidgeLeftPoint,
  topRidgeRightPoint,
  frontRidgeLeftPoint,
  frontRidgeRightPoint,
  backRidgeLeftPoint,
  backRidgeRightPoint,
  selected,
  textureType,
  color,
  overhang,
  thickness,
  locked,
  lineColor = 'black',
  lineWidth = 0.2,
}: GambrelRoofModel) => {
  const texture = useRoofTexture(textureType);

  const getElementById = useStore(Selector.getElementById);
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const setCommonStore = useStore(Selector.set);
  const removeElementById = useStore(Selector.removeElementById);
  const elements = useStore(Selector.elements); // todo: could optimize

  const [h, setH] = useState(lz); // todo: should have one when build
  const [minHeight, setMinHeight] = useState(lz / 2);
  const [roofHandleType, setRoofHandleType] = useState(RoofHandleType.Null);
  const [enableIntersectionPlane, setEnableIntersectionPlane] = useState(false);
  const intersectionPlaneRef = useRef<Mesh>(null);
  const { gl, camera } = useThree();
  const ray = useMemo(() => new Raycaster(), []);
  const mouse = useMemo(() => new Vector2(), []);
  const oldHeight = useRef<number>(h);
  const oldRidgeVal = useRef<number>(0);
  const isPointerMovingRef = useRef(false);

  // set position and rotation
  const parent = getElementById(parentId);
  let rotation = 0;
  if (parent) {
    cx = parent.cx;
    cy = parent.cy;
    cz = parent.lz;
    rotation = parent.rotation[2];
  }

  useEffect(() => {
    if (h < minHeight) {
      setH(minHeight);
    }
  }, [minHeight]);

  useEffect(() => {
    setH(lz);
  }, [lz]);

  const updateRidge = (elemId: string, type: string, val: number) => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === elemId) {
          switch (type) {
            case RoofHandleType.FrontLeft:
              (e as GambrelRoofModel).frontRidgeLeftPoint[0] = val;
              break;
            case RoofHandleType.FrontRight:
              (e as GambrelRoofModel).frontRidgeRightPoint[0] = val;
              break;
            case RoofHandleType.TopLeft:
              (e as GambrelRoofModel).topRidgeLeftPoint[0] = val;
              break;
            case RoofHandleType.TopRight:
              (e as GambrelRoofModel).topRidgeRightPoint[0] = val;
              break;
            case RoofHandleType.BackLeft:
              (e as GambrelRoofModel).backRidgeLeftPoint[0] = val;
              break;
            case RoofHandleType.BackRight:
              (e as GambrelRoofModel).backRidgeRightPoint[0] = val;
              break;
          }
          break;
        }
      }
    });
  };

  const handleUnoableResizeRidge = (elemId: string, type: RoofHandleType, oldVal: number, newVal: number) => {
    const undoable = {
      name: 'Resize Gambrel Roof Ridge',
      timestamp: Date.now(),
      resizedElementId: elemId,
      resizedElementType: ObjectType.Roof,
      oldVal: oldVal,
      newVal: newVal,
      type: type,
      undo: () => {
        updateRidge(undoable.resizedElementId, undoable.type, undoable.oldVal);
      },
      redo: () => {
        updateRidge(undoable.resizedElementId, undoable.type, undoable.newVal);
      },
    } as UnoableResizeGambrelAndMansardRoofRidge;
    useStore.getState().addUndoable(undoable);
  };

  const setRayCast = (e: PointerEvent) => {
    mouse.x = (e.offsetX / gl.domElement.clientWidth) * 2 - 1;
    mouse.y = -(e.offsetY / gl.domElement.clientHeight) * 2 + 1;
    ray.setFromCamera(mouse, camera);
  };

  const setInterSectionPlane = (handlePointV3: Vector3, wall: WallModel) => {
    setEnableIntersectionPlane(true);
    useStoreRef.getState().setEnableOrbitController(false);
    intersectionPlanePosition.set(handlePointV3.x, handlePointV3.y, h).add(centroid);
    if (parent && wall) {
      const r = wall.relativeAngle;
      intersectionPlaneRotation.set(-HALF_PI, 0, r, 'ZXY');
    }
  };

  const getRelPos = (foundation: ElementModel, wall: WallModel, point: Vector3) => {
    const foundationCenter = new Vector2(foundation.cx, foundation.cy);
    const wallAbsCenter = new Vector2(wall.cx, wall.cy)
      .rotateAround(zeroVector2, foundation.rotation[2])
      .add(foundationCenter);
    const wallAbsAngle = foundation.rotation[2] + wall.relativeAngle;
    const p = new Vector2(point.x, point.y).sub(wallAbsCenter).rotateAround(zeroVector2, -wallAbsAngle);
    const x = p.x / wall.lx;
    return Math.min(Math.abs(x), 0.5) * (x >= 0 ? 1 : -1);
  };

  const getRidgePoint = (wall: WallModel, px: number, ph: number) => {
    if (!wall) {
      return new Vector3();
    }
    const e = new Euler(0, 0, wall.relativeAngle);
    const v = new Vector3(px * wall.lx, 0, 0);
    const height = ph * (h - minHeight) + minHeight;
    return new Vector3(wall.cx, wall.cy, height).add(v.applyEuler(e));
  };

  const getWallPoint = (wallArray: WallModel[]) => {
    const arr: Point2[] = [];
    for (const w of wallArray) {
      if (w.leftPoint[0] && w.leftPoint[1]) {
        arr.push({ x: w.leftPoint[0], y: w.leftPoint[1] });
      }
    }
    return arr;
  };

  // todo: should determained by wall 0 and 2;
  const getWallHeight = (arr: WallModel[], i: number) => {
    const w = arr[i];
    let lh = 0;
    let rh = 0;
    if (i === 0) {
      lh = Math.max(w.lz, arr[arr.length - 1].lz);
      rh = Math.max(w.lz, arr[i + 1].lz);
    } else if (i === arr.length - 1) {
      lh = Math.max(w.lz, arr[i - 1].lz);
      rh = Math.max(w.lz, arr[0].lz);
    } else {
      lh = Math.max(w.lz, arr[i - 1].lz);
      rh = Math.max(w.lz, arr[i + 1].lz);
    }
    return { lh, rh };
  };

  const currentWallArray = useMemo(() => {
    const array: WallModel[] = [];
    if (wallsId.length > 0) {
      const wall = getElementById(wallsId[0]) as WallModel;
      array.push(wall);
      if (wall) {
        const leftWall = getElementById(wall.leftJoints[0]) as WallModel;
        const rightWall = getElementById(wall.rightJoints[0]) as WallModel;
        if (leftWall && rightWall) {
          const midWall = getElementById(leftWall.leftJoints[0]) as WallModel;
          const checkWall = getElementById(rightWall.rightJoints[0]) as WallModel;
          if (midWall && checkWall && midWall.id === checkWall.id) {
            array.push(rightWall, midWall, leftWall);
          }
        }
      }
    }
    return array;
  }, [elements]);

  const centroid = useMemo(() => {
    if (currentWallArray.length !== 4) {
      return new Vector3();
    }
    const points = getWallPoint(currentWallArray);
    const p = Util.calculatePolygonCentroid(points);
    return new Vector3(p.x, p.y, h);
  }, [currentWallArray, h]);

  // top ridge
  const topRidgeLeftPointV3 = useMemo(() => {
    const wall = currentWallArray[3];
    const [x, h] = topRidgeLeftPoint; // percent
    return getRidgePoint(wall, x, h).sub(centroid);
  }, [currentWallArray, centroid, topRidgeLeftPoint]);

  const topRidgeRightPointV3 = useMemo(() => {
    const wall = currentWallArray[1];
    const [x, h] = topRidgeRightPoint;
    return getRidgePoint(wall, x, h).sub(centroid);
  }, [currentWallArray, centroid, topRidgeRightPoint]);

  const topRidgeMidPointV3 = useMemo(() => {
    return new Vector3().addVectors(topRidgeLeftPointV3, topRidgeRightPointV3).divideScalar(2);
  }, [topRidgeLeftPointV3, topRidgeRightPointV3]);

  // front ridge
  const frontRidgeLeftPointV3 = useMemo(() => {
    const wall = currentWallArray[3];
    const [x, h] = frontRidgeLeftPoint;
    return getRidgePoint(wall, x, h).sub(centroid);
  }, [currentWallArray, centroid, frontRidgeLeftPoint]);

  const frontRidgeRightPointV3 = useMemo(() => {
    const wall = currentWallArray[1];
    const [x, h] = frontRidgeRightPoint;
    return getRidgePoint(wall, x, h).sub(centroid);
  }, [currentWallArray, centroid, frontRidgeRightPoint]);

  // back ridge
  const backRidgeLeftPointV3 = useMemo(() => {
    const wall = currentWallArray[1];
    const [x, h] = backRidgeLeftPoint;
    return getRidgePoint(wall, x, h).sub(centroid);
  }, [currentWallArray, centroid, backRidgeLeftPoint]);

  const backRidgeRightPointV3 = useMemo(() => {
    const wall = currentWallArray[3];
    const [x, h] = backRidgeRightPoint;
    return getRidgePoint(wall, x, h).sub(centroid);
  }, [currentWallArray, centroid, backRidgeRightPoint]);

  const overhangs = useMemo(() => {
    return currentWallArray.map((wall) => getNormal(wall).multiplyScalar(overhang));
  }, [currentWallArray, overhang]);

  const thicknessVector = useMemo(() => {
    return zVector3.clone().multiplyScalar(thickness);
  }, [thickness]);

  const roofSegments = useMemo(() => {
    const segments: ConvexGeoProps[] = [];

    if (currentWallArray.length != 4) {
      return segments;
    }

    const [frontWall, rightWall, backWall, leftWall] = currentWallArray;
    const [frontOverhang, rightOverhang, backOverhang, leftOverhang] = overhangs;

    const wallPoint0 = new Vector3(frontWall.leftPoint[0], frontWall.leftPoint[1]);
    const wallPoint1 = new Vector3(frontWall.rightPoint[0], frontWall.rightPoint[1]);
    const wallPoint2 = new Vector3(backWall.leftPoint[0], backWall.leftPoint[1]);
    const wallPoint3 = new Vector3(backWall.rightPoint[0], backWall.rightPoint[1]);

    const frontWallLeftPointAfterOffset = wallPoint0.clone().add(frontOverhang);
    const frontWallRightPointAfterOffset = wallPoint1.clone().add(frontOverhang);
    const leftWallLeftPointAfterOffset = wallPoint3.clone().add(leftOverhang);
    const leftWallRightPointAfterOffset = wallPoint0.clone().add(leftOverhang);
    const rightWallLeftPointAfterOffset = wallPoint1.clone().add(rightOverhang);
    const rightWallRightPointAfterOffset = wallPoint2.clone().add(rightOverhang);
    const backWallLeftPointAfterOffset = wallPoint2.clone().add(backOverhang);
    const backWallRightPointAfterOffset = wallPoint3.clone().add(backOverhang);

    // front side
    const frontSidePoints: Vector3[] = [];
    const { lh: frontWallLh, rh: frontWallRh } = getWallHeight(currentWallArray, 0);

    const d0 = getDistance(wallPoint0, wallPoint1, frontRidgeLeftPointV3.clone().add(centroid));
    const overhangHeight0 = Math.min(
      (overhang / d0) * (frontRidgeLeftPointV3.clone().add(centroid).z - frontWallLh),
      frontWallLh,
    );

    const d1 = getDistance(wallPoint0, wallPoint1, frontRidgeRightPointV3.clone().add(centroid));
    const overhangHeight1 = Math.min(
      (overhang / d1) * (frontRidgeRightPointV3.clone().add(centroid).z - frontWallRh),
      frontWallRh,
    );

    const frontWallLeftPointAfterOverhang = getIntersectionPoint(
      frontWallLeftPointAfterOffset,
      frontWallRightPointAfterOffset,
      leftWallLeftPointAfterOffset,
      leftWallRightPointAfterOffset,
    )
      .setZ(frontWallLh - overhangHeight0)
      .sub(centroid);

    const frontWallRightPointAfterOverhang = getIntersectionPoint(
      frontWallLeftPointAfterOffset,
      frontWallRightPointAfterOffset,
      rightWallLeftPointAfterOffset,
      rightWallRightPointAfterOffset,
    )
      .setZ(frontWallRh - overhangHeight1)
      .sub(centroid);

    const frontRidgeLeftPointAfterOverhang = getIntersectionPoint(
      frontRidgeLeftPointV3,
      frontRidgeRightPointV3,
      leftWallLeftPointAfterOffset.clone().sub(centroid),
      leftWallRightPointAfterOffset.clone().sub(centroid),
    ).setZ(frontRidgeRightPointV3.z);

    const frontRidgeRightPointAfterOverhang = getIntersectionPoint(
      frontRidgeRightPointV3,
      frontRidgeLeftPointV3,
      rightWallLeftPointAfterOffset.clone().sub(centroid),
      rightWallRightPointAfterOffset.clone().sub(centroid),
    ).setZ(frontRidgeRightPointV3.z);

    frontSidePoints.push(
      frontWallLeftPointAfterOverhang,
      frontWallRightPointAfterOverhang,
      frontRidgeRightPointAfterOverhang,
      frontRidgeLeftPointAfterOverhang,
    );
    frontSidePoints.push(
      frontWallLeftPointAfterOverhang.clone().add(thicknessVector),
      frontWallRightPointAfterOverhang.clone().add(thicknessVector),
      frontRidgeRightPointAfterOverhang.clone().add(thicknessVector),
      frontRidgeLeftPointAfterOverhang.clone().add(thicknessVector),
    );

    const frontDirection = -frontWall.relativeAngle;
    const frontSideLength = new Vector3(frontWall.cx, frontWall.cy).sub(topRidgeMidPointV3.clone().setZ(0)).length();
    segments.push({ points: frontSidePoints, direction: frontDirection, length: frontSideLength });

    // front top
    const frontTopPoints: Vector3[] = [];
    const topRidgeLeftPointAfterOverhang = getIntersectionPoint(
      topRidgeLeftPointV3,
      topRidgeRightPointV3,
      leftWallLeftPointAfterOffset.clone().sub(centroid),
      leftWallRightPointAfterOffset.clone().sub(centroid),
    ).setZ(topRidgeLeftPointV3.z);

    const topRidgeRightPointAfterOverhang = getIntersectionPoint(
      topRidgeLeftPointV3,
      topRidgeRightPointV3,
      rightWallLeftPointAfterOffset.clone().sub(centroid),
      rightWallRightPointAfterOffset.clone().sub(centroid),
    ).setZ(topRidgeRightPointV3.z);

    frontTopPoints.push(
      frontRidgeLeftPointAfterOverhang,
      frontRidgeRightPointAfterOverhang,
      topRidgeRightPointAfterOverhang,
      topRidgeLeftPointAfterOverhang,
    );
    frontTopPoints.push(
      frontRidgeLeftPointAfterOverhang.clone().add(thicknessVector),
      frontRidgeRightPointAfterOverhang.clone().add(thicknessVector),
      topRidgeRightPointAfterOverhang.clone().add(thicknessVector),
      topRidgeLeftPointAfterOverhang.clone().add(thicknessVector),
    );

    segments.push({ points: frontTopPoints, direction: frontDirection, length: frontSideLength });

    // back top
    const backDirection = -backWall.relativeAngle;
    const { lh: backWallLh, rh: backWallRh } = getWallHeight(currentWallArray, 2);

    const d2 = getDistance(wallPoint2, wallPoint3, backRidgeLeftPointV3.clone().add(centroid));
    const overhangHeight2 = Math.min(
      (overhang / d2) * (backRidgeLeftPointV3.clone().add(centroid).z - backWallLh),
      backWallLh,
    );

    const d3 = getDistance(wallPoint2, wallPoint3, backRidgeRightPointV3.clone().add(centroid));
    const overhangHeight3 = Math.min(
      (overhang / d3) * (backRidgeRightPointV3.clone().add(centroid).z - backWallRh),
      backWallRh,
    );

    const backWallLeftPointAfterOverhang = getIntersectionPoint(
      backWallLeftPointAfterOffset,
      backWallRightPointAfterOffset,
      rightWallLeftPointAfterOffset,
      rightWallRightPointAfterOffset,
    )
      .setZ(backWallLh - overhangHeight2)
      .sub(centroid);

    const backWallRightPointAfterOverhang = getIntersectionPoint(
      backWallLeftPointAfterOffset,
      backWallRightPointAfterOffset,
      leftWallLeftPointAfterOffset,
      leftWallRightPointAfterOffset,
    )
      .setZ(backWallRh - overhangHeight3)
      .sub(centroid);

    const backRidgeLeftPointAfterOverhang = getIntersectionPoint(
      backRidgeLeftPointV3,
      backRidgeRightPointV3,
      rightWallLeftPointAfterOffset.clone().sub(centroid),
      rightWallRightPointAfterOffset.clone().sub(centroid),
    ).setZ(backRidgeRightPointV3.z);

    const backRidgeRightPointAfterOverhang = getIntersectionPoint(
      backRidgeRightPointV3,
      backRidgeLeftPointV3,
      leftWallLeftPointAfterOffset.clone().sub(centroid),
      leftWallRightPointAfterOffset.clone().sub(centroid),
    ).setZ(backRidgeRightPointV3.z);

    const backSideLenght = new Vector3(backWall.cx, backWall.cy).sub(topRidgeMidPointV3.clone().setZ(0)).length();

    const backTopPoints: Vector3[] = [];
    backTopPoints.push(
      topRidgeLeftPointAfterOverhang,
      topRidgeRightPointAfterOverhang,
      backRidgeLeftPointAfterOverhang,
      backRidgeRightPointAfterOverhang,
    );
    backTopPoints.push(
      topRidgeLeftPointAfterOverhang.clone().add(thicknessVector),
      topRidgeRightPointAfterOverhang.clone().add(thicknessVector),
      backRidgeLeftPointAfterOverhang.clone().add(thicknessVector),
      backRidgeRightPointAfterOverhang.clone().add(thicknessVector),
    );
    segments.push({ points: backTopPoints, direction: backDirection, length: backSideLenght });

    // back side
    const backSidePoints: Vector3[] = [];
    backSidePoints.push(
      backWallLeftPointAfterOverhang,
      backWallRightPointAfterOverhang,
      backRidgeRightPointAfterOverhang,
      backRidgeLeftPointAfterOverhang,
    );
    backSidePoints.push(
      backWallLeftPointAfterOverhang.clone().add(thicknessVector),
      backWallRightPointAfterOverhang.clone().add(thicknessVector),
      backRidgeRightPointAfterOverhang.clone().add(thicknessVector),
      backRidgeLeftPointAfterOverhang.clone().add(thicknessVector),
    );
    segments.push({ points: backSidePoints, direction: backDirection, length: backSideLenght });

    return segments;
  }, [currentWallArray, h]);

  useEffect(() => {
    if (currentWallArray.length === 4) {
      let minHeight = 0;
      for (let i = 0; i < currentWallArray.length; i++) {
        const { lh, rh } = getWallHeight(currentWallArray, i);
        minHeight = Math.max(minHeight, Math.max(lh, rh));
        setCommonStore((state) => {
          for (const e of state.elements) {
            if (e.id === currentWallArray[i].id) {
              const w = e as WallModel;
              w.roofId = id;
              w.leftRoofHeight = lh;
              w.rightRoofHeight = rh;
              if (i === 1) {
                if (w.centerRoofHeight && w.centerLeftRoofHeight && w.centerRightRoofHeight) {
                  w.centerRoofHeight[0] = topRidgeRightPoint[0];
                  w.centerRoofHeight[1] = topRidgeRightPoint[1] * (h - minHeight) + minHeight;
                  w.centerLeftRoofHeight[0] = frontRidgeRightPoint[0];
                  w.centerLeftRoofHeight[1] = frontRidgeRightPoint[1] * (h - minHeight) + minHeight;
                  w.centerRightRoofHeight[0] = backRidgeLeftPoint[0];
                  w.centerRightRoofHeight[1] = backRidgeLeftPoint[1] * (h - minHeight) + minHeight;
                } else {
                  w.centerRoofHeight = [...topRidgeRightPoint];
                  w.centerLeftRoofHeight = [...frontRidgeRightPoint];
                  w.centerRightRoofHeight = [...backRidgeLeftPoint];
                }
              }
              if (i === 3) {
                if (w.centerRoofHeight && w.centerLeftRoofHeight && w.centerRightRoofHeight) {
                  w.centerRoofHeight[0] = topRidgeLeftPoint[0];
                  w.centerRoofHeight[1] = topRidgeLeftPoint[1] * (h - minHeight) + minHeight;
                  w.centerLeftRoofHeight[0] = backRidgeRightPoint[0];
                  w.centerLeftRoofHeight[1] = backRidgeRightPoint[1] * (h - minHeight) + minHeight;
                  w.centerRightRoofHeight[0] = frontRidgeLeftPoint[0];
                  w.centerRightRoofHeight[1] = frontRidgeLeftPoint[1] * (h - minHeight) + minHeight;
                } else {
                  w.centerRoofHeight = [...topRidgeLeftPoint];
                  w.centerLeftRoofHeight = [...backRidgeRightPoint];
                  w.centerRightRoofHeight = [...frontRidgeLeftPoint];
                }
              }
              break;
            }
          }
        });
      }
      setMinHeight(minHeight);
    } else {
      removeElementById(id, false);
    }
  }, [currentWallArray, h]);

  return (
    <group position={[cx, cy, cz + 0.01]} rotation={[0, 0, rotation]} name={`Gambrel Roof Group ${id}`}>
      {/* roof segments */}
      <group
        name={'Gambrel Roof Segments Group'}
        position={[centroid.x, centroid.y, centroid.z]}
        onPointerDown={(e) => {
          handleRoofPointerDown(e, id);
        }}
        onContextMenu={(e) => {
          handleRoofContextMenu(e, id);
        }}
      >
        {roofSegments.map((segment, i, arr) => {
          const { points, direction, length } = segment;
          const [leftRoof, rightRoof, rightRidge, leftRidge] = points;
          const isFlat = Math.abs(leftRoof.z) < 0.1;
          return (
            <group key={i} name={`Roof segment ${i}`}>
              <mesh castShadow={shadowEnabled} receiveShadow={shadowEnabled}>
                <convexGeometry args={[points, isFlat ? arr[0].direction : direction, isFlat ? 1 : length]} />
                <meshStandardMaterial
                  map={texture}
                  side={DoubleSide}
                  color={textureType === RoofTexture.Default || textureType === RoofTexture.NoTexture ? color : 'white'}
                />
              </mesh>
            </group>
          );
        })}
        <GambrelRoofWirefram
          roofSegments={roofSegments}
          thickness={thickness}
          lineColor={lineColor}
          lineWidth={lineWidth}
        />
      </group>

      {/* handles */}
      {selected && !locked && (
        <group position={[centroid.x, centroid.y, centroid.z + thickness]}>
          <Sphere
            position={[topRidgeLeftPointV3.x, topRidgeLeftPointV3.y, topRidgeLeftPointV3.z]}
            args={[0.3]}
            onPointerDown={() => {
              isPointerMovingRef.current = true;
              oldRidgeVal.current = topRidgeLeftPoint[0];
              setInterSectionPlane(topRidgeLeftPointV3, currentWallArray[3]);
              setRoofHandleType(RoofHandleType.TopLeft);
            }}
          />
          <Sphere
            position={[topRidgeRightPointV3.x, topRidgeRightPointV3.y, topRidgeRightPointV3.z]}
            args={[0.3]}
            onPointerDown={() => {
              isPointerMovingRef.current = true;
              oldRidgeVal.current = topRidgeRightPoint[0];
              setInterSectionPlane(topRidgeRightPointV3, currentWallArray[1]);
              setRoofHandleType(RoofHandleType.TopRight);
            }}
          />
          <Sphere
            position={[topRidgeMidPointV3.x, topRidgeMidPointV3.y, topRidgeMidPointV3.z]}
            args={[0.3]}
            onPointerDown={() => {
              isPointerMovingRef.current = true;
              setEnableIntersectionPlane(true);
              intersectionPlanePosition.set(topRidgeMidPointV3.x, topRidgeMidPointV3.y, h).add(centroid);
              if (parent) {
                const r = -Math.atan2(camera.position.x - cx, camera.position.y - cy) - parent.rotation[2];
                intersectionPlaneRotation.set(-HALF_PI, 0, r, 'ZXY');
              }
              setRoofHandleType(RoofHandleType.TopMid);
              useStoreRef.getState().setEnableOrbitController(false);
              oldHeight.current = h;
            }}
          />

          <Sphere
            position={[frontRidgeLeftPointV3.x, frontRidgeLeftPointV3.y, frontRidgeLeftPointV3.z]}
            args={[0.3]}
            onPointerDown={() => {
              isPointerMovingRef.current = true;
              oldRidgeVal.current = frontRidgeLeftPoint[0];
              setInterSectionPlane(frontRidgeLeftPointV3, currentWallArray[3]);
              setRoofHandleType(RoofHandleType.FrontLeft);
            }}
          />
          <Sphere
            position={[frontRidgeRightPointV3.x, frontRidgeRightPointV3.y, frontRidgeRightPointV3.z]}
            args={[0.3]}
            onPointerDown={() => {
              isPointerMovingRef.current = true;
              oldRidgeVal.current = frontRidgeRightPoint[0];
              setInterSectionPlane(frontRidgeRightPointV3, currentWallArray[1]);
              setRoofHandleType(RoofHandleType.FrontRight);
            }}
          />

          <Sphere
            position={[backRidgeLeftPointV3.x, backRidgeLeftPointV3.y, backRidgeLeftPointV3.z]}
            args={[0.3]}
            onPointerDown={() => {
              isPointerMovingRef.current = true;
              oldRidgeVal.current = backRidgeLeftPoint[0];
              setInterSectionPlane(backRidgeLeftPointV3, currentWallArray[1]);
              setRoofHandleType(RoofHandleType.BackLeft);
            }}
          />
          <Sphere
            position={[backRidgeRightPointV3.x, backRidgeRightPointV3.y, backRidgeRightPointV3.z]}
            args={[0.3]}
            onPointerDown={() => {
              isPointerMovingRef.current = true;
              oldRidgeVal.current = backRidgeRightPoint[0];
              setInterSectionPlane(backRidgeRightPointV3, currentWallArray[3]);
              setRoofHandleType(RoofHandleType.BackRight);
            }}
          />
        </group>
      )}

      {/* intersection plane */}
      {enableIntersectionPlane && (
        <Plane
          name={'Roof Intersection Plane'}
          ref={intersectionPlaneRef}
          args={[1000, 100]}
          visible={false}
          position={intersectionPlanePosition}
          rotation={intersectionPlaneRotation}
          onPointerMove={(e) => {
            if (intersectionPlaneRef.current && isPointerMovingRef.current) {
              setRayCast(e);
              const intersects = ray.intersectObjects([intersectionPlaneRef.current]);
              if (intersects[0] && parent) {
                const point = intersects[0].point;
                if (point.z < 0.001) {
                  return;
                }
                switch (roofHandleType) {
                  case RoofHandleType.TopMid: {
                    const height = Math.max(minHeight, point.z - (parent?.lz ?? 0) - 0.3);
                    if (
                      isRoofValid(id, currentWallArray[3].id, currentWallArray[1].id, [topRidgeLeftPoint[0], height])
                    ) {
                      setH(height);
                    }
                    break;
                  }
                  case RoofHandleType.FrontLeft: {
                    setCommonStore((state) => {
                      for (const e of state.elements) {
                        if (e.id === id) {
                          if (parent && currentWallArray[3]) {
                            const px = Util.clamp(
                              getRelPos(parent, currentWallArray[3], point),
                              topRidgeLeftPoint[0],
                              0.45,
                            );
                            if (
                              isRoofValid(id, currentWallArray[3].id, undefined, undefined, undefined, [
                                px,
                                frontRidgeLeftPoint[1] * (h - minHeight) + minHeight,
                              ])
                            ) {
                              (e as GambrelRoofModel).frontRidgeLeftPoint[0] = px;
                            }
                          }
                          break;
                        }
                      }
                    });

                    break;
                  }
                  case RoofHandleType.TopLeft: {
                    setCommonStore((state) => {
                      for (const e of state.elements) {
                        if (e.id === id) {
                          if (parent && currentWallArray[3]) {
                            const px = Util.clamp(
                              getRelPos(parent, currentWallArray[3], point),
                              backRidgeRightPoint[0],
                              frontRidgeLeftPoint[0],
                            );
                            if (
                              isRoofValid(
                                id,
                                currentWallArray[3].id,
                                undefined,
                                [px, topRidgeLeftPoint[1] * (h - minHeight) + minHeight],
                                undefined,
                                undefined,
                              )
                            ) {
                              (e as GambrelRoofModel).topRidgeLeftPoint[0] = px;
                            }
                          }
                          break;
                        }
                      }
                    });
                    break;
                  }
                  case RoofHandleType.BackRight: {
                    setCommonStore((state) => {
                      for (const e of state.elements) {
                        if (e.id === id) {
                          if (parent && currentWallArray[3]) {
                            const px = Util.clamp(
                              getRelPos(parent, currentWallArray[3], point),
                              -0.45,
                              topRidgeLeftPoint[0],
                            );
                            if (
                              isRoofValid(
                                id,
                                currentWallArray[3].id,
                                undefined,
                                undefined,
                                [px, backRidgeRightPoint[1] * (h - minHeight) + minHeight],
                                undefined,
                              )
                            ) {
                              (e as GambrelRoofModel).backRidgeRightPoint[0] = px;
                            }
                          }
                          break;
                        }
                      }
                    });
                    break;
                  }
                  case RoofHandleType.FrontRight: {
                    setCommonStore((state) => {
                      for (const e of state.elements) {
                        if (e.id === id) {
                          if (parent && currentWallArray[1]) {
                            const px = Util.clamp(
                              getRelPos(parent, currentWallArray[1], point),
                              -0.45,
                              topRidgeRightPoint[0],
                            );
                            if (
                              isRoofValid(
                                id,
                                currentWallArray[1].id,
                                undefined,
                                undefined,
                                [px, frontRidgeRightPoint[1] * (h - minHeight) + minHeight],
                                undefined,
                              )
                            ) {
                              (e as GambrelRoofModel).frontRidgeRightPoint[0] = px;
                            }
                          }
                          break;
                        }
                      }
                    });
                    break;
                  }
                  case RoofHandleType.TopRight: {
                    setCommonStore((state) => {
                      for (const e of state.elements) {
                        if (e.id === id) {
                          if (parent && currentWallArray[1]) {
                            const px = Util.clamp(
                              getRelPos(parent, currentWallArray[1], point),
                              frontRidgeRightPoint[0],
                              backRidgeLeftPoint[0],
                            );
                            if (
                              isRoofValid(
                                id,
                                currentWallArray[1].id,
                                undefined,
                                [px, topRidgeRightPoint[1] * (h - minHeight) + minHeight],
                                undefined,
                                undefined,
                              )
                            ) {
                              (e as GambrelRoofModel).topRidgeRightPoint[0] = px;
                            }
                          }
                          break;
                        }
                      }
                    });
                    break;
                  }
                  case RoofHandleType.BackLeft: {
                    setCommonStore((state) => {
                      for (const e of state.elements) {
                        if (e.id === id) {
                          if (parent && currentWallArray[1]) {
                            const px = Util.clamp(
                              getRelPos(parent, currentWallArray[1], point),
                              topRidgeRightPoint[0],
                              0.45,
                            );
                            if (
                              isRoofValid(id, currentWallArray[1].id, undefined, undefined, undefined, [
                                px,
                                backRidgeLeftPoint[1] * (h - minHeight) + minHeight,
                              ])
                            ) {
                              (e as GambrelRoofModel).backRidgeLeftPoint[0] = px;
                            }
                          }
                          break;
                        }
                      }
                    });
                    break;
                  }
                }
              }
            }
          }}
          onPointerUp={() => {
            switch (roofHandleType) {
              case RoofHandleType.TopMid: {
                handleUndoableResizeRoofHeight(id, oldHeight.current, h);
                break;
              }
              case RoofHandleType.TopLeft: {
                handleUnoableResizeRidge(id, roofHandleType, oldRidgeVal.current, topRidgeLeftPoint[0]);
                break;
              }
              case RoofHandleType.TopRight: {
                handleUnoableResizeRidge(id, roofHandleType, oldRidgeVal.current, topRidgeRightPoint[0]);
                break;
              }
              case RoofHandleType.FrontLeft: {
                handleUnoableResizeRidge(id, roofHandleType, oldRidgeVal.current, frontRidgeLeftPoint[0]);
                break;
              }
              case RoofHandleType.FrontRight: {
                handleUnoableResizeRidge(id, roofHandleType, oldRidgeVal.current, frontRidgeRightPoint[0]);
                break;
              }
              case RoofHandleType.BackLeft: {
                handleUnoableResizeRidge(id, roofHandleType, oldRidgeVal.current, backRidgeLeftPoint[0]);
                break;
              }
              case RoofHandleType.BackRight: {
                handleUnoableResizeRidge(id, roofHandleType, oldRidgeVal.current, backRidgeRightPoint[0]);
                break;
              }
            }
            isPointerMovingRef.current = false;
            setEnableIntersectionPlane(false);
            setRoofHandleType(RoofHandleType.Null);
            useStoreRef.getState().setEnableOrbitController(true);
            setCommonStore((state) => {
              for (const e of state.elements) {
                if (e.id === id) {
                  const r = e as GambrelRoofModel;
                  r.lz = h;
                  break;
                }
              }
            });
          }}
        >
          <meshBasicMaterial side={DoubleSide} transparent={true} opacity={0.5} />
        </Plane>
      )}
    </group>
  );
};

interface RoofSegmentProps {
  points: Vector3[];
  texture: Texture;
}

// window test code
const RoofSegment = ({ texture }: { texture: Texture }) => {
  const ref = useRef<Mesh>(null);
  useEffect(() => {
    if (ref.current) {
      const a = new Vector3(0, 0, 0);
      const b = new Vector3(10, 0, 0);
      const c = new Vector3(10, 10, 0);

      const d = new Vector3(0, 10, 5);
      const e = new Vector3(10, 10, 0);
      const f = new Vector3(0, 0, 0);

      const points = [a, b, c, d, e, f];

      const uvs = [
        a.x / 10,
        a.y / 10,
        b.x / 10,
        b.y / 10,
        c.x / 10,
        c.y / 10,
        d.x / 10,
        d.y / 10,
        e.x / 10,
        e.y / 10,
        f.x / 10,
        f.y / 10,
      ];

      const roofGeometry = new BufferGeometry();
      roofGeometry.setFromPoints(points);
      roofGeometry.computeVertexNormals();
      roofGeometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));

      const roofMesh = new Mesh(roofGeometry);

      const h: Vector3[] = [];
      h.push(new Vector3(4, 4, -1));
      h.push(new Vector3(6, 4, -1));
      h.push(new Vector3(4, 6, -1));
      h.push(new Vector3(6, 6, -1));
      h.push(new Vector3(4, 4, 5));
      h.push(new Vector3(6, 4, 5));
      h.push(new Vector3(4, 6, 5));
      h.push(new Vector3(6, 6, 5));

      const holeMesh = new Mesh(new ConvexGeometry(h));

      const res = CSG.union(roofMesh, holeMesh); // ???
      ref.current.geometry = res.geometry;
    }
  }, []);

  return (
    <mesh position={[0, 0, 8]} ref={ref}>
      <meshBasicMaterial side={DoubleSide} map={texture} />
    </mesh>
  );
};

export default GambrelRoof;
