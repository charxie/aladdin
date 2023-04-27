/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useMemo, useRef, useState } from 'react';
import { Box, Plane } from '@react-three/drei';
import { DoubleSide, Euler, Mesh, Vector3 } from 'three';
import { useStore } from 'src/stores/common';
import { useRefStore } from 'src/stores/commonRef';
import { ObjectType, ResizeHandleType } from 'src/types';
import { HALF_PI, HIGHLIGHT_HANDLE_COLOR, RESIZE_HANDLE_COLOR } from 'src/constants';
import * as Selector from 'src/stores/selector';
import { ThreeEvent } from '@react-three/fiber';
import { WallFill, WallModel } from 'src/models/WallModel';
import { useHandleSize } from './hooks';
import { Util } from 'src/Util';
import { UndoableResizeWallHeight } from 'src/undo/UndoableResize';
import { RoofModel, RoofType } from 'src/models/RoofModel';
import { ElementModel } from 'src/models/ElementModel';
import { Point2 } from 'src/models/Point2';

interface ResizeHandlesProps {
  x: number;
  z: number;
  handleType: ResizeHandleType;
  highLight: boolean;
  handleSize: number;
}

interface WallResizeHandleWarpperProps {
  id: string;
  parentLz: number;
  roofId: string | null | undefined;
  x: number;
  z: number;
  absAngle: number;
  highLight: boolean;
  fill: WallFill;
  leftUnfilledHeight: number;
  rightUnfilledHeight: number;
  leftJoints: string[];
  rightJoints: string[];
}

const WallResizeHandle = React.memo(({ x, z, handleType, highLight, handleSize }: ResizeHandlesProps) => {
  const setCommonStore = useStore(Selector.set);
  const resizeHandleType = useStore(Selector.resizeHandleType);
  const addedWallID = useStore(Selector.addedWallId);

  const [hovered, setHovered] = useState(false);

  const color = // handleType === RType.UpperRight ? 'blue' : 'white';
    highLight ||
    hovered ||
    handleType === resizeHandleType ||
    (addedWallID && (handleType === ResizeHandleType.LowerRight || handleType === ResizeHandleType.UpperRight))
      ? HIGHLIGHT_HANDLE_COLOR
      : RESIZE_HANDLE_COLOR;

  let lx = handleSize,
    ly = handleSize,
    lz = handleSize;
  if (handleType === ResizeHandleType.LowerRight || handleType === ResizeHandleType.LowerLeft) {
    lx = handleSize * 1.7;
  } else {
    ly = handleSize / 2;
    lz = handleSize * 1.7;
  }
  return (
    <Box
      name={handleType}
      args={[lx, ly, lz]}
      position={[x, 0, z]}
      onPointerOver={() => {
        setHovered(true);
        setCommonStore((state) => {
          state.hoveredHandle = handleType;
        });
      }}
      onPointerLeave={() => {
        setHovered(false);
        setCommonStore((state) => {
          state.hoveredHandle = null;
        });
      }}
    >
      <meshBasicMaterial color={color} />
    </Box>
  );
});

const WallResizeHandleWrapper = React.memo(
  ({
    id,
    parentLz,
    roofId,
    x,
    z,
    absAngle,
    leftUnfilledHeight,
    rightUnfilledHeight,
    fill,
    highLight,
    leftJoints,
    rightJoints,
  }: WallResizeHandleWarpperProps) => {
    const setCommonStore = useStore(Selector.set);
    const orthographic = useStore(Selector.viewState.orthographic);

    const handleSize = useHandleSize();
    const [showIntersectionPlane, setShowIntersectionPlane] = useState(false);
    const [intersectionPlanePosition, setIntersectionPlanePosition] = useState(new Vector3());
    const [intersectionPlaneRotation, setIntersectionPlaneRotation] = useState(new Euler());

    const intersectionPlaneRef = useRef<Mesh>(null);
    const pointerDownRef = useRef(false);
    const oldHeightsRef = useRef<number[]>([z * 2, leftUnfilledHeight, rightUnfilledHeight]);
    const leftWallLzRef = useRef<number | null>(null);
    const rightWallLzRef = useRef<number | null>(null);
    const childElements = useRef<ElementModel[]>([]);

    const roofType = useMemo(() => {
      if (!roofId) return null;
      const roof = useStore.getState().elements.find((e) => e.id === roofId && e.type === ObjectType.Roof);
      if (!roof) return null;
      return (roof as RoofModel).roofType;
    }, [roofId]);

    if (orthographic) {
      z = -z;
    }

    const setIntersectionPlane = (x: number) => {
      const dir = useStore.getState().cameraDirection;
      const r = Math.atan2(dir.x, dir.y);
      setIntersectionPlanePosition(new Vector3(x, 0, 0));
      setIntersectionPlaneRotation(new Euler(HALF_PI, 0, -r - absAngle, 'ZXY'));
      setShowIntersectionPlane(true);
    };

    const updateUndoChange = (id: string, vals: number[]) => {
      const [lz, leftUnfilledHeight, rightUnfilledHeight] = vals;
      setCommonStore((state) => {
        for (const e of state.elements) {
          if (e.id === id && e.type === ObjectType.Wall) {
            e.lz = lz;
            (e as WallModel).leftUnfilledHeight = leftUnfilledHeight;
            (e as WallModel).rightUnfilledHeight = rightUnfilledHeight;
            break;
          }
        }
      });
    };

    const getJointedWallLz = () => {
      if (leftJoints.length > 0 || rightJoints.length > 0) {
        useStore.getState().elements.forEach((e) => {
          if (e.id === leftJoints[0]) leftWallLzRef.current = e.lz;
          if (e.id === rightJoints[0]) rightWallLzRef.current = e.lz;
        });
      }
    };

    const getChildElements = () => {
      childElements.current = useStore.getState().elements.filter((e) => e.parentId === id);
    };

    const getWallShapePoints = (wall: WallModel, newLeftUnfilledHeight: number, newRightUnfilledHeight: number) => {
      const {
        lx,
        lz,
        roofId,
        leftRoofHeight,
        rightRoofHeight,
        centerLeftRoofHeight,
        centerRightRoofHeight,
        centerRoofHeight,
      } = wall;
      const [hx, hy] = [lx / 2, lz / 2];

      const points: Point2[] = [];

      // from lower left, counter-clockwise
      points.push({ x: -hx, y: -hy + newLeftUnfilledHeight }, { x: hx, y: -hy + newRightUnfilledHeight });

      if (!roofId) {
        points.push({ x: hx, y: hy }, { x: -hx, y: hy });
      } else {
        if (rightRoofHeight) {
          points.push({ x: hx, y: -hy + rightRoofHeight });
        } else {
          points.push({ x: hx, y: hy });
        }
        if (centerRightRoofHeight) {
          points.push({ x: centerRightRoofHeight[0] * lx, y: -hy + centerRightRoofHeight[1] });
        }
        if (centerRoofHeight) {
          points.push({ x: centerRoofHeight[0] * lx, y: -hy + centerRoofHeight[1] });
        }
        if (centerLeftRoofHeight) {
          points.push({ x: centerLeftRoofHeight[0] * lx, y: -hy + centerLeftRoofHeight[1] });
        }
        if (leftRoofHeight) {
          points.push({ x: -hx, y: -hy + leftRoofHeight });
        } else {
          points.push({ x: -hx, y: hy });
        }
      }

      return points;
    };

    const isValid = (wall: WallModel, newLeftUnfilledHeight: number, newRightUnfilledHeight: number) => {
      const wallShapePoints = getWallShapePoints(wall, newLeftUnfilledHeight, newRightUnfilledHeight);

      if (childElements.current.length > 0) {
        for (const el of childElements.current) {
          let { cx, cz, lx, ly, lz } = el;
          cx *= wall.lx;
          cz *= wall.lz;
          if (el.type !== ObjectType.SolarPanel) {
            lx *= wall.lx;
            lz *= wall.lz;
          } else {
            lz = ly;
          }
          if (!Util.isElementInsideWall(new Vector3(cx, 0, cz), lx, lz, wallShapePoints)) {
            return false;
          }
        }
      }

      return true;
    };

    const resetJointedWallLz = () => {
      leftWallLzRef.current = null;
      rightWallLzRef.current = null;
    };

    const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
      if (useStore.getState().addedWallId) return;

      const resizeHandleObject = e.object;
      switch (resizeHandleObject.name) {
        case ResizeHandleType.LowerLeft: {
          setCommonStore((state) => {
            state.resizeAnchor.copy(resizeHandleObject.localToWorld(new Vector3(x * 2, 0, 0)));
          });
          break;
        }
        case ResizeHandleType.LowerRight: {
          setCommonStore((state) => {
            state.resizeAnchor.copy(resizeHandleObject.localToWorld(new Vector3(-x * 2, 0, 0)));
          });
          break;
        }
        case ResizeHandleType.UpperLeft:
        case ResizeHandleType.WallPartialResizeLeft: {
          setIntersectionPlane(-x);
          getJointedWallLz();
          getChildElements();
          break;
        }
        case ResizeHandleType.UpperRight:
        case ResizeHandleType.WallPartialResizeRight: {
          setIntersectionPlane(x);
          getJointedWallLz();
          getChildElements();
          break;
        }
        default:
          console.error('Wall resize handle unknown');
          return;
      }
      setCommonStore((state) => {
        state.resizeHandleType = resizeHandleObject.name as ResizeHandleType;
      });
      useRefStore.getState().setEnableOrbitController(false);
      pointerDownRef.current = true;
      oldHeightsRef.current = [z * 2, leftUnfilledHeight, rightUnfilledHeight];
    };

    const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
      if (e.intersections.length === 0 || !pointerDownRef.current) return;
      const p = e.intersections[0].point;
      switch (useStore.getState().resizeHandleType) {
        case ResizeHandleType.UpperLeft:
        case ResizeHandleType.UpperRight: {
          setCommonStore((state) => {
            const minZ = fill === WallFill.Partial ? Math.max(leftUnfilledHeight, rightUnfilledHeight) : 0;
            let newLz = Math.max(minZ + handleSize, p.z - parentLz);
            if (roofType === null || roofType === RoofType.Gable || roofType === RoofType.Gambrel) {
              if (leftWallLzRef.current || rightWallLzRef.current) {
                const leftDiff = Math.abs(newLz - (leftWallLzRef.current ?? Infinity));
                const rightDiff = Math.abs(newLz - (rightWallLzRef.current ?? Infinity));
                if (leftDiff < rightDiff && leftDiff < 0.5 && leftWallLzRef.current) {
                  newLz = leftWallLzRef.current;
                } else if (rightDiff <= leftDiff && rightDiff < 0.5 && rightWallLzRef.current) {
                  newLz = rightWallLzRef.current;
                }
              }
              for (const e of state.elements) {
                if (e.type === ObjectType.Wall && e.id === id) {
                  const wall = e as WallModel;
                  wall.lz = newLz;
                  wall.cz = newLz / 2;
                  if (newLz < wall.leftUnfilledHeight + handleSize) {
                    wall.leftUnfilledHeight = newLz - handleSize;
                  }
                  if (newLz < wall.rightUnfilledHeight + handleSize) {
                    wall.rightUnfilledHeight = newLz - handleSize;
                  }
                  break;
                }
              }
            } else {
              for (const e of state.elements) {
                if (e.type === ObjectType.Wall && (e as WallModel).roofId === roofId) {
                  const wall = e as WallModel;
                  wall.lz = newLz;
                  wall.cz = newLz / 2;
                  if (newLz < wall.leftUnfilledHeight + handleSize) {
                    wall.leftUnfilledHeight = newLz - handleSize;
                  }
                  if (newLz < wall.rightUnfilledHeight + handleSize) {
                    wall.rightUnfilledHeight = newLz - handleSize;
                  }
                }
              }
            }
            state.selectedElementHeight = Math.max(0.1, p.z);
            state.actionState.wallHeight = newLz;
            state.updateRoofFlag = !state.updateRoofFlag;
          });
          break;
        }
        case ResizeHandleType.WallPartialResizeLeft: {
          setCommonStore((state) => {
            for (const e of state.elements) {
              if (e.id === id && e.type === ObjectType.Wall) {
                const wall = e as WallModel;
                let newUnfilledHeight = Util.clamp(p.z - parentLz, 0.1, e.lz - handleSize);
                if (wall.leftJoints.length > 0) {
                  const leftWall = state.elements.find(
                    (e) => e.id === wall.leftJoints[0] && e.type === ObjectType.Wall,
                  ) as WallModel;
                  if (leftWall && leftWall.fill === WallFill.Partial) {
                    const leftWallRightUnfilledHeight = leftWall.rightUnfilledHeight;
                    if (Math.abs(newUnfilledHeight - leftWallRightUnfilledHeight) < 0.5) {
                      newUnfilledHeight = leftWallRightUnfilledHeight;
                    }
                  }
                }
                if (
                  isValid(wall, newUnfilledHeight, state.enableFineGrid ? newUnfilledHeight : wall.rightUnfilledHeight)
                ) {
                  wall.leftUnfilledHeight = newUnfilledHeight;
                  if (state.enableFineGrid) {
                    wall.rightUnfilledHeight = newUnfilledHeight;
                  }
                }
                break;
              }
            }
          });
          break;
        }
        case ResizeHandleType.WallPartialResizeRight: {
          setCommonStore((state) => {
            for (const e of state.elements) {
              if (e.id === id && e.type === ObjectType.Wall) {
                const wall = e as WallModel;
                let newUnfilledHeight = Util.clamp(p.z - parentLz, 0.1, e.lz - handleSize);
                if (wall.rightJoints.length > 0) {
                  const rightWall = state.elements.find(
                    (e) => e.id === wall.rightJoints[0] && e.type === ObjectType.Wall,
                  ) as WallModel;
                  if (rightWall && rightWall.fill === WallFill.Partial) {
                    const rightWallLeftUnfilledHeight = rightWall.leftUnfilledHeight;
                    if (Math.abs(newUnfilledHeight - rightWallLeftUnfilledHeight) < 0.5) {
                      newUnfilledHeight = rightWallLeftUnfilledHeight;
                    }
                  }
                }
                if (
                  isValid(wall, state.enableFineGrid ? newUnfilledHeight : wall.leftUnfilledHeight, newUnfilledHeight)
                ) {
                  wall.rightUnfilledHeight = newUnfilledHeight;
                  if (state.enableFineGrid) {
                    wall.leftUnfilledHeight = newUnfilledHeight;
                  }
                }
                break;
              }
            }
          });
          break;
        }
      }
    };

    const handlePointerUp = () => {
      useRefStore.getState().setEnableOrbitController(true);
      setShowIntersectionPlane(false);
      resetJointedWallLz();
      pointerDownRef.current = false;

      const undoableChangeHeight = {
        name: 'Change Wall Height',
        timestamp: Date.now(),
        resizedElementId: id,
        resizedElementType: ObjectType.Wall,
        oldHeights: [...oldHeightsRef.current],
        newHeights: [z * 2, leftUnfilledHeight, rightUnfilledHeight],
        undo() {
          updateUndoChange(this.resizedElementId, this.oldHeights);
        },
        redo() {
          updateUndoChange(this.resizedElementId, this.newHeights);
        },
      } as UndoableResizeWallHeight;
      useStore.getState().addUndoable(undoableChangeHeight);
      setCommonStore((state) => {
        state.actionState.wallHeight = z * 2;
        state.resizeHandleType = null;
      });
    };

    return (
      <>
        <group name={'Wall Resize Handle Group'} onPointerDown={handlePointerDown}>
          <WallResizeHandle
            x={-x}
            z={-z}
            handleType={ResizeHandleType.LowerLeft}
            highLight={highLight}
            handleSize={handleSize}
          />
          <WallResizeHandle
            x={x}
            z={-z}
            handleType={ResizeHandleType.LowerRight}
            highLight={highLight}
            handleSize={handleSize}
          />
          {!orthographic && (
            <>
              <WallResizeHandle
                x={-x}
                z={z}
                handleType={ResizeHandleType.UpperLeft}
                highLight={highLight}
                handleSize={handleSize}
              />
              <WallResizeHandle
                x={x}
                z={z}
                handleType={ResizeHandleType.UpperRight}
                highLight={highLight}
                handleSize={handleSize}
              />

              {/* partial resize */}
              {fill === WallFill.Partial && (
                <>
                  <WallResizeHandle
                    x={-x}
                    z={-z + leftUnfilledHeight}
                    handleType={ResizeHandleType.WallPartialResizeLeft}
                    highLight={highLight}
                    handleSize={handleSize}
                  />
                  <WallResizeHandle
                    x={x}
                    z={-z + rightUnfilledHeight}
                    handleType={ResizeHandleType.WallPartialResizeRight}
                    highLight={highLight}
                    handleSize={handleSize}
                  />
                </>
              )}
            </>
          )}
        </group>

        {/* intersection plane */}
        {showIntersectionPlane && (
          <Plane
            ref={intersectionPlaneRef}
            position={intersectionPlanePosition}
            rotation={intersectionPlaneRotation}
            args={[10000, 10000]}
            visible={false}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <meshBasicMaterial side={DoubleSide} />
          </Plane>
        )}
      </>
    );
  },
);

export default WallResizeHandleWrapper;
