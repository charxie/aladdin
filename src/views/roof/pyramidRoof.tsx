/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PyramidRoofModel, RoofModel } from 'src/models/RoofModel';
import { useStore } from 'src/stores/common';
import { Euler, Mesh, Raycaster, Shape, Vector2, Vector3 } from 'three';
import * as Selector from 'src/stores/selector';
import { WallModel } from 'src/models/WallModel';
import { Extrude, Line, Plane } from '@react-three/drei';
import { ConvexGeometry } from 'src/js/ConvexGeometry.js';
import { HALF_PI, HALF_PI_Z_EULER, TWO_PI } from 'src/constants';
import { useStoreRef } from 'src/stores/commonRef';
import { useThree } from '@react-three/fiber';
import { Point2 } from 'src/models/Point2';
import { Util } from 'src/Util';
import { ObjectType, RoofTexture } from 'src/types';
import {
  addUndoableResizeRoofHeight,
  ConvexGeoProps,
  handleContextMenu,
  handlePointerDown,
  handlePointerMove,
  handlePointerUp,
  RoofHandle,
  RoofWireframeProps,
  updateRooftopElements,
} from './roofRenderer';
import { RoofUtil } from './RoofUtil';
import { useMultiCurrWallArray, useRoofHeight, useRoofTexture, useElementUndoable, useTransparent } from './hooks';

const intersectionPlanePosition = new Vector3();
const intersectionPlaneRotation = new Euler();
const zeroVector = new Vector3();
const zVector3 = new Vector3(0, 0, 1);

interface FlatRoofProps {
  roofSegments: ConvexGeoProps[];
  thickness: number;
  children: React.ReactNode;
  lineWidth: number;
  lineColor: string;
}

const FlatRoof = ({ roofSegments, thickness, lineColor, lineWidth, children }: FlatRoofProps) => {
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const { transparent } = useTransparent();

  const wireFramePoints = useMemo(() => {
    // this can still be triggered when the roof is deleted because all walls are removed
    if (roofSegments.length === 0) return [new Vector3()];
    const startPoint = roofSegments[0].points[0];
    const points = [startPoint];
    for (const segment of roofSegments) {
      const rightPoint = segment.points[1];
      points.push(rightPoint);
    }
    return points;
  }, [roofSegments]);

  const shape = useMemo(() => {
    const s = new Shape();
    // this can still be triggered when the roof is deleted because all walls are removed
    if (roofSegments.length === 0) return s;
    const startPoint = roofSegments[0].points[0];
    s.moveTo(startPoint.x, startPoint.y);
    for (const segment of roofSegments) {
      const rightPoint = segment.points[1];
      s.lineTo(rightPoint.x, rightPoint.y);
    }
    return s;
  }, [roofSegments]);

  const thicknessVector = useMemo(() => {
    return new Vector3(0, 0, thickness);
  }, [thickness]);

  const periphery = <Line points={wireFramePoints} lineWidth={lineWidth} color={lineColor} />;

  return (
    <>
      <Extrude
        name={'Pyramid Roof Extrude'}
        args={[shape, { steps: 1, depth: thickness, bevelEnabled: false }]}
        castShadow={shadowEnabled && !transparent}
        receiveShadow={shadowEnabled}
        userData={{ simulation: true }}
      >
        {children}
      </Extrude>

      {/* wireframe */}
      {periphery}
      <group position={[0, 0, thickness]}>
        {periphery}
        {wireFramePoints.map((point, idx) => {
          const points = [point.clone().sub(thicknessVector), point];
          return <Line key={idx} points={points} lineWidth={lineWidth} color={lineColor} />;
        })}
      </group>
    </>
  );
};

const PyramidRoofWireframe = React.memo(({ roofSegments, thickness, lineWidth, lineColor }: RoofWireframeProps) => {
  if (roofSegments.length === 0) {
    return null;
  }
  const peripheryPoints: Vector3[] = [];
  const thicknessVector = new Vector3(0, 0, thickness);

  for (let i = 0; i < roofSegments.length; i++) {
    const [leftPoint, rightPoint] = roofSegments[i].points;
    peripheryPoints.push(leftPoint);
    if (i === roofSegments.length - 1) {
      peripheryPoints.push(rightPoint);
    }
  }

  const periphery = <Line points={peripheryPoints} lineWidth={lineWidth} color={lineColor} />;

  return (
    <>
      {periphery}
      <group position={[0, 0, thickness]}>
        {periphery}
        {roofSegments.map((segment, idx) => {
          const [leftPoint, rightPoint, zeroVector] = segment.points;
          const isFlat = Math.abs(leftPoint.z) < 0.015;
          const points = [leftPoint.clone().sub(thicknessVector), leftPoint];
          if (!isFlat) {
            points.push(zeroVector);
          }
          return <Line key={idx} points={points} lineWidth={lineWidth} color={lineColor} />;
        })}
      </group>
    </>
  );
});

const PyramidRoof = ({
  cx,
  cy,
  cz,
  lz,
  id,
  parentId,
  wallsId,
  selected,
  textureType,
  color,
  overhang,
  thickness,
  locked,
  lineWidth = 0.2,
  lineColor = 'black',
  roofType,
  foundationId,
}: PyramidRoofModel) => {
  const texture = useRoofTexture(textureType);
  const { transparent, opacity } = useTransparent();
  const { currentWallArray, isLoopRef } = useMultiCurrWallArray(foundationId, id, wallsId);

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

  const getMinHeight = () => {
    let minHeight = 0;
    for (let i = 0; i < currentWallArray.length; i++) {
      const { lh, rh } = getWallHeight(currentWallArray, i);
      minHeight = Math.max(minHeight, Math.max(lh, rh));
    }
    return minHeight;
  };

  const setCommonStore = useStore(Selector.set);
  const getElementById = useStore(Selector.getElementById);
  const removeElementById = useStore(Selector.removeElementById);
  const updateRoofHeight = useStore(Selector.updateRoofHeightById);
  const updateRoofFlag = useStore(Selector.updateRoofFlag);
  const fileChanged = useStore(Selector.fileChanged);

  const { camera, gl } = useThree();
  const ray = useMemo(() => new Raycaster(), []);
  const mouse = useMemo(() => new Vector2(), []);

  const { h, setH, minHeight, setMinHeight, relHeight, setRelHeight } = useRoofHeight(lz, getMinHeight());

  const [showIntersectionPlane, setShowIntersectionPlane] = useState(false);

  const intersectionPlaneRef = useRef<Mesh>(null);
  const oldHeight = useRef<number>(h);
  const oldRelativeHeightRef = useRef<number>(relHeight.current);
  const isFirstMountRef = useRef(true);

  const prevWallsIdSet = new Set<string>(wallsId);

  useEffect(() => {
    const minHeight = getMinHeight();
    setMinHeight(minHeight);
    setRelHeight(lz - minHeight);
  }, [fileChanged]);

  useEffect(() => {
    if (lz !== h) {
      setH(lz);
    }
  }, [lz]);

  const setRayCast = (e: PointerEvent) => {
    mouse.x = (e.offsetX / gl.domElement.clientWidth) * 2 - 1;
    mouse.y = -(e.offsetY / gl.domElement.clientHeight) * 2 + 1;
    ray.setFromCamera(mouse, camera);
  };

  const getWallPoint = (wallArray: WallModel[]) => {
    const arr: Point2[] = [];
    const length = wallArray.length;
    for (const w of wallArray) {
      if (w.leftPoint[0] && w.leftPoint[1]) {
        arr.push({ x: w.leftPoint[0], y: w.leftPoint[1] });
      }
    }
    if (!isLoopRef.current) {
      if (
        (wallArray[length - 1].rightPoint[0] || wallArray[length - 1].rightPoint[0] === 0) &&
        (wallArray[length - 1].rightPoint[1] || wallArray[length - 1].rightPoint[1] === 0)
      ) {
        arr.push({ x: wallArray[length - 1].rightPoint[0], y: wallArray[length - 1].rightPoint[1] });
      }
    }
    return arr;
  };

  const needUpdateWallsId = (wallArray: WallModel[], wallsIdSet: Set<string>) => {
    if (wallArray.length !== wallsIdSet.size) {
      return true;
    }
    for (const w of wallArray) {
      if (!wallsIdSet.has(w.id)) {
        return true;
      }
    }
    return false;
  };

  const getOverhangHeight = () => {
    let height = Infinity;

    for (let i = 0; i < currentWallArray.length; i++) {
      const w = currentWallArray[i];
      const leftPoint = new Vector3(w.leftPoint[0], w.leftPoint[1]);
      const rightPoint = new Vector3(w.rightPoint[0], w.rightPoint[1]);
      const { lh, rh } = getWallHeight(currentWallArray, i);
      const dLeft = RoofUtil.getDistance(leftPoint, rightPoint, centerPointV3);
      const overhangHeightLeft = Math.min((overhang / dLeft) * (centerPointV3.z - lh), lh);
      const dRight = RoofUtil.getDistance(leftPoint, rightPoint, centerPointV3);
      const overhangHeightRight = Math.min((overhang / dRight) * (centerPointV3.z - rh), rh);
      height = Math.min(Math.min(overhangHeightLeft, overhangHeightRight), height);
    }

    return Number.isNaN(height) ? 0 : height;
  };

  const centerPoint = useMemo(() => {
    if (currentWallArray.length < 2) {
      return { x: 0, y: 0 };
    }
    const points = getWallPoint(currentWallArray);
    if (points.length < 3) {
      return { x: 0, y: 0 };
    }
    const p = Util.calculatePolygonCentroid(points);
    if (Number.isNaN(p.x) || Number.isNaN(p.y)) {
      return { x: 0, y: 0 };
    }
    return p;
  }, [currentWallArray, h]);

  const centerPointV3 = useMemo(() => {
    return new Vector3(centerPoint.x, centerPoint.y, h);
  }, [centerPoint, h]);

  const overhangs = useMemo(() => {
    const res = currentWallArray.map((wall) => RoofUtil.getWallNormal(wall).multiplyScalar(overhang));
    if (!isLoopRef.current && res.length !== 0) {
      const n = new Vector3()
        .subVectors(
          new Vector3(
            currentWallArray[currentWallArray.length - 1].rightPoint[0],
            currentWallArray[currentWallArray.length - 1].rightPoint[1],
          ),
          new Vector3(currentWallArray[0].leftPoint[0], currentWallArray[0].leftPoint[1]),
        )
        .applyEuler(HALF_PI_Z_EULER)
        .normalize()
        .multiplyScalar(overhang);
      res.push(n);
    }
    return res;
  }, [currentWallArray, overhang]);

  const wallPointsAfterOffset = useMemo(() => {
    const res = currentWallArray.map((wall, idx) => ({
      leftPoint: new Vector3(wall.leftPoint[0], wall.leftPoint[1]).add(overhangs[idx]),
      rightPoint: new Vector3(wall.rightPoint[0], wall.rightPoint[1]).add(overhangs[idx]),
    }));
    if (!isLoopRef.current && res.length !== 0) {
      res.push({
        leftPoint: new Vector3(
          currentWallArray[currentWallArray.length - 1].rightPoint[0],
          currentWallArray[currentWallArray.length - 1].rightPoint[1],
        ).add(overhangs[overhangs.length - 1]),
        rightPoint: new Vector3(currentWallArray[0].leftPoint[0], currentWallArray[0].leftPoint[1]).add(
          overhangs[overhangs.length - 1],
        ),
      });
    }
    return res;
  }, [currentWallArray, overhangs]);

  const thicknessVector = useMemo(() => {
    return zVector3.clone().multiplyScalar(thickness);
  }, [thickness]);

  const roofSegments = useMemo(() => {
    const segments: ConvexGeoProps[] = [];
    if (currentWallArray.length < 2) {
      return segments;
    }

    const overhangHeight = getOverhangHeight();

    for (let i = 0; i < currentWallArray.length; i++) {
      const w = currentWallArray[i];
      if (
        w.leftPoint.length > 0 &&
        w.rightPoint.length > 0 &&
        (w.leftPoint[0] !== w.rightPoint[0] || w.leftPoint[1] !== w.rightPoint[1])
      ) {
        const points = [];
        let { lh, rh } = getWallHeight(currentWallArray, i);
        if (!isLoopRef.current) {
          if (i === 0) {
            lh = currentWallArray[0].lz;
          }
          if (i === currentWallArray.length - 1) {
            rh = currentWallArray[currentWallArray.length - 1].lz;
          }
        }

        const wallLeftPointAfterOverhang = RoofUtil.getIntersectionPoint(
          wallPointsAfterOffset[(i + wallPointsAfterOffset.length - 1) % wallPointsAfterOffset.length].leftPoint,
          wallPointsAfterOffset[(i + wallPointsAfterOffset.length - 1) % wallPointsAfterOffset.length].rightPoint,
          wallPointsAfterOffset[i].leftPoint,
          wallPointsAfterOffset[i].rightPoint,
        )
          .setZ(lh - overhangHeight)
          .sub(centerPointV3);

        const wallRightPointAfterOverhang = RoofUtil.getIntersectionPoint(
          wallPointsAfterOffset[i].leftPoint,
          wallPointsAfterOffset[i].rightPoint,
          wallPointsAfterOffset[(i + 1) % wallPointsAfterOffset.length].leftPoint,
          wallPointsAfterOffset[(i + 1) % wallPointsAfterOffset.length].rightPoint,
        )
          .setZ(rh - overhangHeight)
          .sub(centerPointV3);

        const direction = -w.relativeAngle;
        const length = new Vector3(w.cx, w.cy).sub(centerPointV3.clone().setZ(0)).length();
        points.push(wallLeftPointAfterOverhang, wallRightPointAfterOverhang, zeroVector, zeroVector);
        points.push(
          wallLeftPointAfterOverhang.clone().add(thicknessVector),
          wallRightPointAfterOverhang.clone().add(thicknessVector),
          zeroVector.clone().add(thicknessVector),
          zeroVector.clone().add(thicknessVector),
        );
        segments.push({ points, direction, length });
      }
    }
    if (!isLoopRef.current) {
      const idx = wallPointsAfterOffset.length - 1;
      const leftPointAfterOverhang = RoofUtil.getIntersectionPoint(
        wallPointsAfterOffset[idx - 1].leftPoint,
        wallPointsAfterOffset[idx - 1].rightPoint,
        wallPointsAfterOffset[idx].leftPoint,
        wallPointsAfterOffset[idx].rightPoint,
      )
        .setZ(currentWallArray[currentWallArray.length - 1].lz - overhangHeight)
        .sub(centerPointV3);
      const rightPointAfterOverhang = RoofUtil.getIntersectionPoint(
        wallPointsAfterOffset[idx].leftPoint,
        wallPointsAfterOffset[idx].rightPoint,
        wallPointsAfterOffset[0].leftPoint,
        wallPointsAfterOffset[0].rightPoint,
      )
        .setZ(currentWallArray[0].lz - overhangHeight)
        .sub(centerPointV3);

      let angle = Math.atan2(
        rightPointAfterOverhang.y - leftPointAfterOverhang.y,
        rightPointAfterOverhang.x - leftPointAfterOverhang.x,
      );
      angle = angle >= 0 ? angle : (TWO_PI + angle) % TWO_PI;

      const length = new Vector3()
        .addVectors(leftPointAfterOverhang, rightPointAfterOverhang)
        .setZ(0)
        .divideScalar(2)
        .length();

      const points = [];
      points.push(leftPointAfterOverhang, rightPointAfterOverhang, zeroVector, zeroVector);
      points.push(
        leftPointAfterOverhang.clone().add(thicknessVector),
        rightPointAfterOverhang.clone().add(thicknessVector),
        zeroVector.clone().add(thicknessVector),
        zeroVector.clone().add(thicknessVector),
      );
      segments.push({ points, direction: -angle, length });
    }

    return segments;
  }, [currentWallArray, updateRoofFlag, centerPoint, overhang, thickness]);

  // set position and rotation
  const foundation = getElementById(parentId);
  let rotation = 0;
  if (foundation) {
    cx = foundation.cx;
    cy = foundation.cy;
    cz = foundation.lz;
    rotation = foundation.rotation[2];

    const r = -Math.atan2(camera.position.x - cx, camera.position.y - cy) - rotation;
    intersectionPlanePosition.set(centerPoint.x, centerPoint.y, h);
    intersectionPlaneRotation.set(-HALF_PI, 0, r, 'ZXY');
  }

  // update new roofId
  useEffect(() => {
    if (!isFirstMountRef.current) {
      if (currentWallArray.length >= 2 && needUpdateWallsId(currentWallArray, prevWallsIdSet)) {
        const newWallsIdAray = currentWallArray.map((v) => v.id);
        const newWallsIdSet = new Set(newWallsIdAray);
        setCommonStore((state) => {
          for (const e of state.elements) {
            if (e.type === ObjectType.Roof) {
              if (e.id === id) {
                (e as RoofModel).wallsId = newWallsIdAray;
              }
            } else if (e.type === ObjectType.Wall) {
              if (prevWallsIdSet.has(e.id) && !newWallsIdSet.has(e.id)) {
                const w = e as WallModel;
                w.roofId = null;
                w.leftRoofHeight = undefined;
                w.rightRoofHeight = undefined;
              }
            }
          }
        });
      }
    }
  }, [updateRoofFlag, prevWallsIdSet]);

  useEffect(() => {
    if (!isFirstMountRef.current || useStore.getState().addedRoofId === id) {
      if (currentWallArray.length > 1) {
        let minHeight = 0;
        for (let i = 0; i < currentWallArray.length; i++) {
          const { lh, rh } = getWallHeight(currentWallArray, i);
          minHeight = Math.max(minHeight, Math.max(lh, rh));
          setCommonStore((state) => {
            for (const e of state.elements) {
              if (e.id === currentWallArray[i].id && e.type === ObjectType.Wall) {
                const w = e as WallModel;
                w.roofId = id;
                w.leftRoofHeight = lh;
                w.rightRoofHeight = rh;
                break;
              }
            }
          });
        }
        setMinHeight(minHeight);
        setH(minHeight + relHeight.current);
        useStore.getState().updateRoofHeightById(id, minHeight + relHeight.current);
        updateRooftopElements(foundation, id, roofSegments, centerPointV3, h, thickness);
      } else {
        removeElementById(id, false);
      }
    }
  }, [currentWallArray, updateRoofFlag, h]);

  const { grabRef, addUndoableMove, undoMove, setOldRefData } = useElementUndoable();

  const updateElementOnRoofFlag = useStore(Selector.updateElementOnRoofFlag);

  useEffect(() => {
    if (!isFirstMountRef.current) {
      updateRooftopElements(foundation, id, roofSegments, centerPointV3, h, thickness);
    }
  }, [updateElementOnRoofFlag, h, thickness]);

  useEffect(() => {
    isFirstMountRef.current = false;
  }, []);

  const checkIsFlatRoof = () => {
    if (currentWallArray.length < 2) {
      return false;
    }
    const height = currentWallArray[0].lz;

    for (const wall of currentWallArray) {
      if (Math.abs(wall.lz - height) > 0.01) {
        return false;
      }
    }

    for (const segment of roofSegments) {
      const [leftPoint, rightPoint] = segment.points;
      if (Math.abs(leftPoint.z) > 0.01 || Math.abs(rightPoint.z) > 0.01) {
        return false;
      }
    }

    return true;
  };

  const [isFlatRoof, setIsFlatRoof] = useState(checkIsFlatRoof);

  useEffect(() => {
    setIsFlatRoof(checkIsFlatRoof());
  }, [currentWallArray, h]);

  const material = useMemo(
    () => (
      <meshStandardMaterial
        map={texture}
        color={textureType === RoofTexture.Default || textureType === RoofTexture.NoTexture ? color : 'white'}
        transparent={transparent}
        opacity={opacity}
      />
    ),
    [texture, textureType, color, transparent, opacity],
  );

  return (
    <group position={[cx, cy, cz]} rotation={[0, 0, rotation]} name={`Pyramid Roof Group ${id}`}>
      {/* roof segments group */}
      <group
        name={`Pyramid Roof Segments Group`}
        position={[centerPoint.x, centerPoint.y, h]}
        onPointerDown={(e) => {
          handlePointerDown(e, id, foundation, roofSegments, centerPointV3, setOldRefData);
        }}
        onPointerMove={(e) => {
          handlePointerMove(e, grabRef.current, foundation, roofType, roofSegments, centerPointV3);
        }}
        onPointerUp={() => {
          handlePointerUp(grabRef, foundation, currentWallArray[0], id, overhang, undoMove, addUndoableMove);
        }}
        onContextMenu={(e) => {
          handleContextMenu(e, id);
        }}
      >
        {isFlatRoof ? (
          <FlatRoof roofSegments={roofSegments} thickness={thickness} lineWidth={lineWidth} lineColor={lineColor}>
            {material}
          </FlatRoof>
        ) : (
          <>
            {roofSegments.map((segment, idx) => {
              const { points, direction, length } = segment;
              if (points.length > 0) {
                const [leftPoint, rightPoint] = points;
                const isFlat = Math.abs(leftPoint.z) < 0.01;
                if (leftPoint.distanceTo(rightPoint) > 0.1) {
                  return (
                    <group name={`Roof segment ${idx}`} key={idx}>
                      <RoofSegment points={points} direction={isFlat ? 0 : direction} length={isFlat ? 1 : length}>
                        {material}
                      </RoofSegment>
                    </group>
                  );
                }
              }
            })}
            <PyramidRoofWireframe
              roofSegments={roofSegments}
              thickness={thickness}
              lineColor={lineColor}
              lineWidth={lineWidth}
            />
          </>
        )}
      </group>

      {/* handle */}
      {selected && !locked && (
        <RoofHandle
          position={[centerPoint.x, centerPoint.y, h + thickness + 0.15]}
          onPointerDown={() => {
            oldHeight.current = h;
            oldRelativeHeightRef.current = relHeight.current;
            setShowIntersectionPlane(true);
            useStoreRef.getState().setEnableOrbitController(false);
          }}
          onPointerUp={() => {
            setShowIntersectionPlane(false);
            useStoreRef.getState().setEnableOrbitController(true);
          }}
        />
      )}

      {/* intersection plane */}
      {showIntersectionPlane && (
        <Plane
          name="Roof Intersection Plane"
          ref={intersectionPlaneRef}
          args={[1000, 100]}
          visible={false}
          rotation={intersectionPlaneRotation}
          position={intersectionPlanePosition}
          onPointerMove={(e) => {
            if (intersectionPlaneRef.current) {
              setRayCast(e);
              const intersects = ray.intersectObjects([intersectionPlaneRef.current]);
              if (intersects[0]) {
                const point = intersects[0].point;
                if (point.z < 0.001) {
                  return;
                }
                const h = Math.max(minHeight.current, point.z - (foundation?.lz ?? 0) - 0.3);
                setH(h);
                setRelHeight(h - minHeight.current);
                updateRooftopElements(foundation, id, roofSegments, centerPointV3, h, thickness);
              }
            }
          }}
          onPointerUp={(e) => {
            updateRoofHeight(id, h);
            addUndoableResizeRoofHeight(
              id,
              oldHeight.current,
              h,
              oldRelativeHeightRef.current,
              relHeight.current,
              setRelHeight,
            );
            setShowIntersectionPlane(false);
            useStoreRef.getState().setEnableOrbitController(true);
            updateRooftopElements(foundation, id, roofSegments, centerPointV3, h, thickness);
          }}
        />
      )}
    </group>
  );
};

const RoofSegment = ({
  points,
  direction,
  length,
  children,
}: {
  points: Vector3[];
  direction: number;
  length: number;
  children: React.ReactNode;
}) => {
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const meshRef = useRef<Mesh>(null);
  const { transparent } = useTransparent();
  const { invalidate } = useThree();

  useEffect(() => {
    if (meshRef.current) {
      points.push(new Vector3(0, 0, -0.001));

      const geo = new ConvexGeometry(points, direction, length);

      // TODO: if has window
      if (false) {
        // const h: Vector3[] = [];
        // h.push(new Vector3(0, 0, -3));
        // h.push(new Vector3(0, 0, 3));
        // h.push(new Vector3(1, 1, -3));
        // h.push(new Vector3(1, 1, 3));
        // h.push(new Vector3(1, -1, -3));
        // h.push(new Vector3(1, -1, 3));
        // const holeMesh = new Mesh(new ConvexGeometry(h), mat);
        // const res = CSG.subtract(roofMesh, holeMesh);
        // meshRef.current.geometry = res.geometry;
      } else {
        meshRef.current.geometry = geo;
        invalidate();
      }
    }
  }, [points, direction, length]);

  return (
    <mesh
      ref={meshRef}
      name={'Pyramid Roof Segment'}
      castShadow={shadowEnabled && !transparent}
      receiveShadow={shadowEnabled}
      userData={{ simulation: true }}
    >
      {children}
    </mesh>
  );
};

export default React.memo(PyramidRoof);
