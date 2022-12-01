/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Box, Plane } from '@react-three/drei';
import { DoubleSide, Euler, Mesh, Vector3 } from 'three';
import { useStore } from 'src/stores/common';
import { useStoreRef } from 'src/stores/commonRef';
import { ObjectType, ResizeHandleType } from 'src/types';
import { HALF_PI, HIGHLIGHT_HANDLE_COLOR, RESIZE_HANDLE_COLOR } from 'src/constants';
import * as Selector from 'src/stores/selector';
import { ThreeEvent, useThree } from '@react-three/fiber';
import { WallModel, WallDisplayMode } from 'src/models/WallModel';
import { useHandleSize } from './hooks';
import { Util } from 'src/Util';
import { UndoableResizeWallHeight } from 'src/undo/UndoableResize';

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
  x: number;
  z: number;
  highLight: boolean;
  displayMode: WallDisplayMode;
  bottomHeight: number;
}

const WallResizeHandle = React.memo(({ x, z, handleType, highLight, handleSize }: ResizeHandlesProps) => {
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
      }}
      onPointerOut={() => {
        setHovered(false);
      }}
    >
      <meshBasicMaterial color={color} />
    </Box>
  );
});

const WallResizeHandleWarpper = React.memo(
  ({ id, parentLz, x, z, bottomHeight, displayMode, highLight }: WallResizeHandleWarpperProps) => {
    const setCommonStore = useStore(Selector.set);
    const orthographic = useStore(Selector.viewState.orthographic);

    const handleSize = useHandleSize();
    const [showIntersectionPlane, setShowIntersectionPlane] = useState(false);
    const [intersectionPlanePosition, setIntersectionPlanePosition] = useState(new Vector3());
    const [intersectionPlaneRotation, setIntersectionPlaneRotation] = useState(new Euler());
    const [handleType, setHandleType] = useState<'upper' | 'partial' | null>(null);

    const intersectionPlaneRef = useRef<Mesh>(null);
    const pointerDownRef = useRef(false);
    const oldHeightsRef = useRef<number[]>([z * 2, bottomHeight]);

    if (orthographic) {
      z = -z;
    }

    const setIntersectionPlane = (x: number) => {
      const dir = useStore.getState().cameraDirection;
      const r = Math.atan2(dir.x, dir.y);
      setIntersectionPlanePosition(new Vector3(x, 0, 0));
      setIntersectionPlaneRotation(new Euler(HALF_PI, 0, -r, 'ZXY'));
      setShowIntersectionPlane(true);
    };

    const updateUndoChange = (id: string, vals: number[]) => {
      const [lz, bottomHeight] = vals;
      setCommonStore((state) => {
        for (const e of state.elements) {
          if (e.id === id && e.type === ObjectType.Wall) {
            e.lz = lz;
            (e as WallModel).bottomHeight = bottomHeight;
            break;
          }
        }
      });
    };

    const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
      if (useStore.getState().addedWallId) return;

      const resizeHandleObject = e.object;
      switch (resizeHandleObject.name) {
        case ResizeHandleType.LowerLeft: {
          setCommonStore((state) => {
            state.resizeAnchor.copy(resizeHandleObject.localToWorld(new Vector3(x * 2, 0, 0)));
            state.resizeHandleType = ResizeHandleType.LowerLeft;
          });
          break;
        }
        case ResizeHandleType.LowerRight: {
          setCommonStore((state) => {
            state.resizeAnchor.copy(resizeHandleObject.localToWorld(new Vector3(-x * 2, 0, 0)));
            state.resizeHandleType = ResizeHandleType.LowerRight;
          });
          break;
        }
        case ResizeHandleType.UpperLeft: {
          setIntersectionPlane(-x);
          setHandleType('upper');
          break;
        }
        case ResizeHandleType.WallPartialResizeLeft: {
          setIntersectionPlane(-x);
          setHandleType('partial');
          break;
        }
        case ResizeHandleType.UpperRight: {
          setIntersectionPlane(x);
          setHandleType('upper');
          break;
        }
        case ResizeHandleType.WallPartialResizeRight: {
          setIntersectionPlane(x);
          setHandleType('partial');
          break;
        }
        default:
          console.error('Wall resize handle unknown');
      }
      useStoreRef.getState().setEnableOrbitController(false);
      pointerDownRef.current = true;
      oldHeightsRef.current = [z * 2, bottomHeight];
    };

    const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
      if (e.intersections.length === 0 || !pointerDownRef.current) return;
      const p = e.intersections[0].point;
      if (handleType === 'upper') {
        setCommonStore((state) => {
          for (const e of state.elements) {
            if (e.id === id && e.type === ObjectType.Wall) {
              const wall = e as WallModel;
              const newLz = Math.max(wall.bottomHeight + handleSize, p.z - parentLz);
              wall.lz = newLz;
              wall.cz = newLz / 2;
              state.actionState.wallHeight = newLz;
              break;
            }
          }
          state.updateRoofFlag = !state.updateRoofFlag;
        });
      } else if (handleType === 'partial') {
        setCommonStore((state) => {
          for (const e of state.elements) {
            if (e.id === id && e.type === ObjectType.Wall) {
              const newBottomHeight = Util.clamp(p.z - parentLz, handleSize, e.lz - handleSize);
              (e as WallModel).bottomHeight = newBottomHeight;
              state.actionState.wallBottomHeight = newBottomHeight;
              break;
            }
          }
        });
      }
    };

    const handlePointerUp = () => {
      useStoreRef.getState().setEnableOrbitController(true);
      setShowIntersectionPlane(false);
      setHandleType(null);
      pointerDownRef.current = false;

      const undoableChangeHeight = {
        name: 'Change Wall Height',
        timestamp: Date.now(),
        resizedElementId: id,
        resizedElementType: ObjectType.Wall,
        oldHeights: [...oldHeightsRef.current],
        newHeights: [z * 2, bottomHeight],
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
        state.actionState.wallBottomHeight = bottomHeight;
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
              {displayMode === WallDisplayMode.Partial && (
                <>
                  <WallResizeHandle
                    x={-x}
                    z={-z + bottomHeight}
                    handleType={ResizeHandleType.WallPartialResizeLeft}
                    highLight={highLight}
                    handleSize={handleSize}
                  />
                  <WallResizeHandle
                    x={x}
                    z={-z + bottomHeight}
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

export default WallResizeHandleWarpper;
