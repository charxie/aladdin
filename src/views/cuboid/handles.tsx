import { Plane } from '@react-three/drei';
import { ThreeEvent, useThree } from '@react-three/fiber';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import MoveHandle from 'src/components/moveHandle';
import ResizeHandle from 'src/components/resizeHandle';
import RotateHandle from 'src/components/rotateHandle';
import { HALF_PI, ORIGIN_VECTOR3, RESIZE_HANDLE_SIZE, TWO_PI } from 'src/constants';
import { useStore } from 'src/stores/common';
import { usePrimitiveStore } from 'src/stores/commonPrimitive';
import { MoveHandleType, ResizeHandleType, RotateHandleType } from 'src/types';
import { Util } from 'src/Util';
import { Euler, Mesh, Vector3 } from 'three';
import * as Selector from '../../stores/selector';
import { useHandleSize } from '../wall/hooks';

interface HandlesProps {
  id: string;
  args: number[];
}

type IntersectionPlaneData = {
  position: Vector3;
  rotation: Euler;
};

const Handles = ({ id, args }: HandlesProps) => {
  const [hx, hy, hz] = args;

  const setCommonStore = useStore(Selector.set);
  const getElementById = useStore(Selector.getElementById);

  const orthographic = useStore(Selector.viewState.orthographic);
  const addedCuboidId = useStore(Selector.addedCuboidId);

  const [intersectionPlaneData, setIntersectionPlaneData] = useState<IntersectionPlaneData | null>(null);

  const { gl, raycaster } = useThree();
  const size = useHandleSize();

  const cuboidWorldBottomHeight = useRef<number | null>(null);
  const cuboidWorldPosition = useRef<number[] | null>(null);
  const cuboidWorldRotation = useRef<number | null>(null);
  const parentWorldRotation = useRef<number | null>(null);
  const parentWorldPosition = useRef<Vector3 | null>(null);

  const intersectionPlaneRef = useRef<Mesh>(null);

  const lowerRotateHandlePosition: [x: number, y: number, z: number] = useMemo(() => {
    return [0, Math.min(-1.2 * hy, -hy - 0.75) - size * 2, RESIZE_HANDLE_SIZE / 2 - hz];
  }, [hy, hz, size]);

  const upperRotateHandlePosition: [x: number, y: number, z: number] = useMemo(() => {
    return [0, Math.max(1.2 * hy, hy + 0.75) + size * 2, RESIZE_HANDLE_SIZE / 2 - hz];
  }, [hy, hz, size]);

  const showIntersectionPlane = intersectionPlaneData !== null;
  const showTopResizeHandles = !orthographic;
  const showMoveAndRotateHandles = !addedCuboidId;

  const hoverHandle = useCallback(
    (e: ThreeEvent<MouseEvent>, handle: MoveHandleType | ResizeHandleType | RotateHandleType) => {
      if (usePrimitiveStore.getState().duringCameraInteraction) return;
      if (e.intersections.length > 0) {
        // QUICK FIX: For some reason, the top one can sometimes be the ground, so we also go to the second one
        const intersected =
          e.intersections[0].object === e.eventObject ||
          (e.intersections.length > 1 && e.intersections[1].object === e.eventObject);
        if (intersected) {
          setCommonStore((state) => {
            state.hoveredHandle = handle;
            const cm = getElementById(id);
            if (cm) {
              state.selectedElementHeight = cm.lz;
            }
          });
          if (Util.isMoveHandle(handle)) {
            gl.domElement.style.cursor = 'move';
          } else if (handle === RotateHandleType.Upper || handle === RotateHandleType.Lower) {
            gl.domElement.style.cursor = 'grab';
          } else {
            gl.domElement.style.cursor = useStore.getState().addedCuboidId ? 'crosshair' : 'pointer';
          }
        }
      }
    },
    [],
  );

  const noHoverHandle = useCallback(() => {
    setCommonStore((state) => {
      state.hoveredHandle = null;
    });
    gl.domElement.style.cursor = useStore.getState().addedCuboidId ? 'crosshair' : 'default';
  }, []);

  const getWorldRotation = (id: string): number => {
    const el = getElementById(id);
    if (!el) return 0;

    const rotation = el.rotation[2];
    if (el.parentId === 'Ground') return rotation;

    return rotation + getWorldRotation(el.parentId);
  };

  const setCuboidHeight = (id: string, newLz: number) => {
    setCommonStore((state) => {
      const cuboid = state.elements.find((e) => e.id === id);
      if (!cuboid) return;
      cuboid.lz = newLz;
      cuboid.cz = newLz / 2;
    });
  };

  const resizeXY = (pointer: Vector3) => {
    setCommonStore((state) => {
      const cuboid = state.elements.find((e) => e.id === id);
      if (!cuboid) return;

      const p = pointer.clone().setZ(0);
      const anchor = useStore.getState().resizeAnchor.clone().setZ(0);
      const distance = anchor.distanceTo(p);
      const angle = Math.atan2(p.x - anchor.x, p.y - anchor.y) + (cuboidWorldRotation.current ?? 0);
      const newLx = Math.abs(distance * Math.sin(angle));
      const newLy = Math.abs(distance * Math.cos(angle));
      const worldCenter = new Vector3().addVectors(p, anchor).multiplyScalar(0.5);

      if (parentWorldPosition.current !== null && parentWorldRotation.current !== null) {
        const center = new Vector3()
          .subVectors(worldCenter, parentWorldPosition.current)
          .applyEuler(new Euler(0, 0, -parentWorldRotation.current));
        cuboid.cx = center.x;
        cuboid.cy = center.y;
      }
      cuboid.lx = newLx;
      cuboid.ly = newLy;
    });
  };

  const resizeLz = (pointer: Vector3) => {
    if (cuboidWorldBottomHeight.current !== null) {
      const newLz = Math.max(1, pointer.z - cuboidWorldBottomHeight.current);
      setCuboidHeight(id, newLz);
    }
  };

  const handleRotate = (pointer: Vector3) => {
    if (cuboidWorldPosition.current) {
      const [cx, cy] = cuboidWorldPosition.current;
      let rotation =
        Math.atan2(cx - pointer.x, pointer.y - cy) +
        (useStore.getState().rotateHandleType === RotateHandleType.Upper ? 0 : Math.PI);
      const offset = Math.abs(rotation) > Math.PI ? -Math.sign(rotation) * TWO_PI : 0;
      if (parentWorldRotation.current) {
        rotation -= parentWorldRotation.current;
      }
      useStore.getState().updateElementRotationById(id, 0, 0, rotation + offset);
    }
  };

  // pointer down events
  const handleBottomResizeHandlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.intersections.length > 0 && e.intersections[0].object.name === e.object.name) {
      const cuboid = getElementById(id);
      if (cuboid && cuboid.parentId !== 'Ground') {
        setIntersectionPlaneData({ position: new Vector3(0, 0, -hz), rotation: new Euler() });
        const { pos: parentWorldPos, rot: parentWorldRot } = Util.getWorldDataOfStackedCuboidById(cuboid.parentId);
        parentWorldPosition.current = parentWorldPos;
        parentWorldRotation.current = parentWorldRot;
        cuboidWorldRotation.current = parentWorldRot + cuboid.rotation[2];
      }
    }
  };

  const handleTopResizeHandlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.intersections.length > 0 && e.intersections[0].object.name === e.object.name) {
      const handleObject = e.intersections[0].object;
      const cameraDirection = useStore.getState().cameraDirection;
      const rotation = Math.atan2(cameraDirection.x, cameraDirection.y) + getWorldRotation(id);
      setIntersectionPlaneData({ position: handleObject.position.clone(), rotation: new Euler(-HALF_PI, rotation, 0) });
      const topHandleWorldPosition = handleObject.localToWorld(new Vector3());
      cuboidWorldBottomHeight.current = topHandleWorldPosition.z - hz * 2;
    }
  };

  const handleRotateHandlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.intersections.length > 0 && e.intersections[0].object.name === e.object.name) {
      setIntersectionPlaneData({ position: new Vector3(0, 0, -hz), rotation: new Euler(0, 0, 0) });
      const handleGroup = e.eventObject;
      cuboidWorldPosition.current = handleGroup.localToWorld(new Vector3()).toArray();
      const cuboid = getElementById(id);
      if (cuboid) {
        parentWorldRotation.current = getWorldRotation(cuboid.parentId);
      }
    }
  };

  // pointer move event
  const handleIntersectionPlaneMove = (e: ThreeEvent<PointerEvent>) => {
    // set ray cast, need change wall together
    if (intersectionPlaneRef.current) {
      const intersections = raycaster.intersectObject(intersectionPlaneRef.current);
      if (intersections.length) {
        const pointer = intersections[0].point;
        // resize
        if (useStore.getState().resizeHandleType) {
          if (Util.isTopResizeHandle(useStore.getState().resizeHandleType)) {
            resizeLz(pointer);
          } else {
            resizeXY(pointer);
          }
        }
        // rotate
        else if (useStore.getState().rotateHandleType) {
          handleRotate(pointer);
        }
      }
    }
  };

  // pointer up
  const handleIntersectionPlanePointerUp = () => {
    setIntersectionPlaneData(null);
    cuboidWorldBottomHeight.current = null;
    cuboidWorldPosition.current = null;
    cuboidWorldRotation.current = null;
    parentWorldRotation.current = null;
    parentWorldPosition.current = null;
  };

  return (
    <React.Fragment>
      {/* intersection plane */}
      {showIntersectionPlane && (
        <Plane
          name="Cuboid Intersection Plane"
          ref={intersectionPlaneRef}
          args={[10000, 10000]}
          position={intersectionPlaneData.position}
          rotation={intersectionPlaneData.rotation}
          visible={false}
          onPointerMove={handleIntersectionPlaneMove}
          onPointerUp={handleIntersectionPlanePointerUp}
        />
      )}

      {/* bottom resize handles */}
      <group name="Bottom Resize Handle Group" onPointerDown={handleBottomResizeHandlePointerDown}>
        <ResizeHandle
          handleType={ResizeHandleType.UpperLeft}
          position={[-hx, hy, -hz]}
          size={size}
          onPointerOver={hoverHandle}
          onPointerOut={noHoverHandle}
        />
        <ResizeHandle
          handleType={ResizeHandleType.UpperRight}
          position={[hx, hy, -hz]}
          size={size}
          onPointerOver={hoverHandle}
          onPointerOut={noHoverHandle}
        />
        <ResizeHandle
          handleType={ResizeHandleType.LowerLeft}
          position={[-hx, -hy, -hz]}
          size={size}
          onPointerOver={hoverHandle}
          onPointerOut={noHoverHandle}
        />
        <ResizeHandle
          handleType={ResizeHandleType.LowerRight}
          position={[hx, -hy, -hz]}
          size={size}
          onPointerOver={hoverHandle}
          onPointerOut={noHoverHandle}
        />
      </group>

      {/* top resize handles */}
      {showTopResizeHandles && (
        <group name="Cuboid Top Resize Handle Group" onPointerDown={handleTopResizeHandlePointerDown}>
          <ResizeHandle
            handleType={ResizeHandleType.LowerLeftTop}
            position={[-hx, -hy, hz]}
            size={size}
            onPointerOver={hoverHandle}
            onPointerOut={noHoverHandle}
          />
          <ResizeHandle
            handleType={ResizeHandleType.UpperLeftTop}
            position={[-hx, hy, hz]}
            size={size}
            onPointerOver={hoverHandle}
            onPointerOut={noHoverHandle}
          />
          <ResizeHandle
            handleType={ResizeHandleType.LowerRightTop}
            position={[hx, -hy, hz]}
            size={size}
            onPointerOver={hoverHandle}
            onPointerOut={noHoverHandle}
          />
          <ResizeHandle
            handleType={ResizeHandleType.UpperRightTop}
            position={[hx, hy, hz]}
            size={size}
            onPointerOver={hoverHandle}
            onPointerOut={noHoverHandle}
          />
        </group>
      )}

      {/* move and rotate handles */}
      {showMoveAndRotateHandles && (
        <React.Fragment>
          {/* move handles */}
          <React.Fragment>
            <MoveHandle
              handleType={MoveHandleType.Lower}
              position={[0, -hy, -hz]}
              size={size}
              onPointerOver={hoverHandle}
              onPointerOut={noHoverHandle}
            />
            <MoveHandle
              handleType={MoveHandleType.Upper}
              position={[0, hy, -hz]}
              size={size}
              onPointerOver={hoverHandle}
              onPointerOut={noHoverHandle}
            />
            <MoveHandle
              handleType={MoveHandleType.Left}
              position={[-hx, 0, -hz]}
              size={size}
              onPointerOver={hoverHandle}
              onPointerOut={noHoverHandle}
            />
            <MoveHandle
              handleType={MoveHandleType.Right}
              position={[hx, 0, -hz]}
              size={size}
              onPointerOver={hoverHandle}
              onPointerOut={noHoverHandle}
            />
            <MoveHandle
              handleType={MoveHandleType.Top}
              position={[0, 0, hz]}
              size={size}
              onPointerOver={hoverHandle}
              onPointerOut={noHoverHandle}
            />
          </React.Fragment>

          {/* rotate handles */}
          <group name="Cuboid Rotate Handle Group" onPointerDown={handleRotateHandlePointerDown}>
            <RotateHandle
              id={id}
              handleType={RotateHandleType.Lower}
              position={lowerRotateHandlePosition}
              ratio={size * 4}
              hoverHandle={hoverHandle}
              noHoverHandle={noHoverHandle}
            />
            <RotateHandle
              id={id}
              position={upperRotateHandlePosition}
              handleType={RotateHandleType.Upper}
              ratio={size * 4}
              hoverHandle={hoverHandle}
              noHoverHandle={noHoverHandle}
            />
          </group>
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

export default React.memo(Handles);
