/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useRef, useState } from 'react';
import { DoubleSide, Euler, Mesh, Vector3 } from 'three';
import { Box, Plane } from '@react-three/drei';
import { MoveHandleType, ObjectType, ResizeHandleType } from 'src/types';
import { WindowModel, WindowType } from 'src/models/WindowModel';
import WindowResizeHandle from './windowResizeHandle';
import WindowMoveHandle from './windowMoveHandle';
import { HALF_PI } from 'src/constants';
import { ThreeEvent } from '@react-three/fiber';
import { useStore } from 'src/stores/common';
import { FoundationModel } from 'src/models/FoundationModel';
import * as Selector from 'src/stores/selector';
import { RoofUtil } from '../roof/RoofUtil';
import { useRefStore } from 'src/stores/commonRef';
import { RoofSegmentGroupUserData, RoofSegmentProps } from '../roof/roofRenderer';
import { RoofModel } from 'src/models/RoofModel';
import { Util } from 'src/Util';

interface WindowHandleWrapperProps {
  id: string;
  parentId: string;
  foundationId?: string;
  lx: number;
  lz: number;
  rotation: number[];
  windowType: WindowType;
  parentType: ObjectType;
}

type HandleType = MoveHandleType | ResizeHandleType;

const INTERSECTION_PLANE_NAME = 'Handles Intersection Plane';

const getPointerOnIntersectionPlane = (e: ThreeEvent<PointerEvent>) => {
  if (e.intersections.length > 0) {
    for (const intersection of e.intersections) {
      if (intersection.eventObject.name === INTERSECTION_PLANE_NAME) {
        return intersection.point;
      }
    }
  }
  return null;
};

const getPosRelToFoundation = (p: Vector3, foundation: FoundationModel) => {
  return new Vector3()
    .subVectors(p, new Vector3(foundation.cx, foundation.cy, foundation.cz))
    .applyEuler(new Euler(0, 0, -foundation.rotation[2]));
};

const isWindowInsideSegment = (center: Vector3, lx: number, ly: number, rotation: number[], vertices: Vector3[]) => {
  const [hx, hy] = [lx / 2, ly / 2];
  const [a, b, c] = rotation;
  const euler = new Euler().fromArray([a - HALF_PI, b, c, 'ZXY']);
  const boundaryPoint2 = vertices.map((v) => ({ x: v.x, y: v.y }));
  for (let i = -1; i <= 1; i += 2) {
    for (let j = -1; j <= 1; j += 2) {
      const v = new Vector3(hx * i, 0, hy * j).applyEuler(euler);
      const vertex = new Vector3().addVectors(center, v);
      if (!Util.isPointInside(vertex.x, vertex.y, boundaryPoint2)) {
        return false;
      }
    }
  }
  return true;
};

const getResizeAnchor = (
  event: ThreeEvent<PointerEvent>,
  foundationId: string | undefined,
  rotation: number[],
  lx: number,
  lz: number,
) => {
  if (!foundationId) return null;
  const foundationModel = useStore
    .getState()
    .elements.find((e) => e.id === foundationId && e.type === ObjectType.Foundation);
  if (!foundationModel) return null;
  const worldPosition = event.object.localToWorld(new Vector3());
  const [a, b, c] = rotation;
  const euler = new Euler().fromArray([a - HALF_PI, b, c + foundationModel.rotation[2], 'ZXY']);
  const v = new Vector3(lx, 0, lz).applyEuler(euler);
  return new Vector3().addVectors(worldPosition, v);
};

const getDataOnRoof = (e: ThreeEvent<PointerEvent>, windowId: string, roofId: string) => {
  if (e.intersections.length > 0) {
    for (const intersection of e.intersections) {
      const eventObjectName = intersection.eventObject.name;
      if (
        eventObjectName.includes('Window') &&
        eventObjectName.includes(windowId) &&
        intersection.object.name !== INTERSECTION_PLANE_NAME
      ) {
        return null;
      }
      if (eventObjectName.includes('Roof') && eventObjectName.includes(roofId)) {
        const pointer = intersection.point.clone();
        const segmentIdx = Number.parseInt(intersection.object.name.split(' ').pop() ?? '-1');
        return { pointer, segmentIdx };
      }
    }
  }
  return null;
};

const isResizeHandle = (handleType: HandleType | null) => {
  switch (handleType) {
    case ResizeHandleType.LowerLeft:
    case ResizeHandleType.LowerRight:
    case ResizeHandleType.UpperLeft:
    case ResizeHandleType.UpperRight:
      return true;
  }
  return false;
};

const getNewResizedData = (anchor: Vector3, pointer: Vector3, r: number) => {
  const diffVector = new Vector3().subVectors(pointer, anchor).applyEuler(new Euler(0, 0, -r));
  const newLx = Math.abs(diffVector.x);
  const newLz = Math.hypot(diffVector.y, diffVector.z);
  const newCenter = new Vector3().addVectors(anchor, pointer).divideScalar(2);
  return { newLx, newLz, newCenter };
};

const setResizedData = (id: string, center: Vector3, lx: number, lz: number, fLz: number) => {
  useStore.getState().set((state) => {
    const window = state.elements.find((e) => e.id === id && e.type === ObjectType.Window);
    if (!window) return;
    window.cx = center.x;
    window.cy = center.y;
    window.cz = center.z - fLz / 2;
    window.lx = lx;
    window.lz = lz;
  });
};

export const ArchResizeHandle = ({ z }: { z: number }) => {
  const ref = useRef<Mesh>();

  const [color, setColor] = useState('white');
  return (
    <Box
      ref={ref}
      name={ResizeHandleType.Arch}
      args={[0.2, 0.2, 0.2]}
      position={[0, 0, z]}
      onPointerEnter={() => {
        setColor('red');
      }}
      onPointerLeave={() => {
        setColor('white');
      }}
    >
      <meshBasicMaterial color={color} />
    </Box>
  );
};

const WindowHandleWrapper = ({
  id,
  parentId,
  foundationId,
  lx,
  lz,
  rotation,
  windowType,
  parentType,
}: WindowHandleWrapperProps) => {
  const addedWindowId = useStore((state) => state.addedWindowId);

  const isSettingNewWindow = addedWindowId === id;
  const isOnRoof = parentType === ObjectType.Roof;

  const handleTypeRef = useRef<HandleType | null>(null);
  const foundationModelRef = useRef<FoundationModel | undefined | null>(null);
  const roofModelRef = useRef<RoofModel | undefined | null>(null);
  const roofSegmentsRef = useRef<RoofSegmentProps[] | undefined | null>(null);
  const roofCentroidRef = useRef<Vector3 | undefined | null>(null);
  const currRoofSegmentIdxRef = useRef<number | null>(null);
  const resizeAnchorWorldPosRef = useRef<Vector3 | null>(null);

  const [showIntersectionPlane, setShowIntersectionPlane] = useState(false);

  const setCommonStore = useStore(Selector.set);

  const setRefDataForPointerMove = (handleType: HandleType) => {
    const windowModel = useStore
      .getState()
      .elements.find((e) => e.id === id && e.type === ObjectType.Window) as WindowModel;
    const foundationModel = useStore
      .getState()
      .elements.find((e) => e.id === foundationId && e.type === ObjectType.Foundation) as FoundationModel;
    const groupRef = useRefStore.getState().contentRef;
    if (!windowModel || !foundationModel || !groupRef || !groupRef.current) return;

    const roofGroup = groupRef.current.children.find((obj) => obj.name.includes('Roof') && obj.name.includes(parentId));
    if (!roofGroup) return;

    const segmentGroup = roofGroup.children[0];
    if (!segmentGroup) return;

    const { centroid, roofSegments } = segmentGroup.userData as RoofSegmentGroupUserData;
    const posRelToFoundation = new Vector3(windowModel.cx, windowModel.cy, windowModel.cz + foundationModel.lz);
    const posRelToCentroid = posRelToFoundation.clone().sub(centroid);

    handleTypeRef.current = handleType;
    foundationModelRef.current = foundationModel;
    currRoofSegmentIdxRef.current = RoofUtil.getSegmentIdx(roofSegments, posRelToCentroid);
    roofCentroidRef.current = centroid;
    roofSegmentsRef.current = roofSegments;
  };

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    if (!isOnRoof || isSettingNewWindow) return;

    const handleType = event.object.name as HandleType;

    switch (handleType) {
      case MoveHandleType.Mid: {
        roofModelRef.current = useStore
          .getState()
          .elements.find((e) => e.id === parentId && e.type === ObjectType.Roof) as RoofModel;
        break;
      }
      case ResizeHandleType.LowerLeft: {
        resizeAnchorWorldPosRef.current = getResizeAnchor(event, foundationId, rotation, lx, lz);
        break;
      }
      case ResizeHandleType.LowerRight: {
        resizeAnchorWorldPosRef.current = getResizeAnchor(event, foundationId, rotation, -lx, lz);
        break;
      }
      case ResizeHandleType.UpperLeft: {
        resizeAnchorWorldPosRef.current = getResizeAnchor(event, foundationId, rotation, lx, -lz);
        break;
      }
      case ResizeHandleType.UpperRight: {
        resizeAnchorWorldPosRef.current = getResizeAnchor(event, foundationId, rotation, -lx, -lz);
        break;
      }
      default:
        return;
    }

    setRefDataForPointerMove(handleType);
    setShowIntersectionPlane(true);
  };

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (handleTypeRef.current === null || !foundationModelRef.current) return;

    const foundation = foundationModelRef.current;

    if (handleTypeRef.current === MoveHandleType.Mid) {
      if (!roofModelRef.current || !roofSegmentsRef.current || !roofCentroidRef.current) return;

      const roof = roofModelRef.current;
      const dataOnRoof = getDataOnRoof(event, id, parentId);
      const pointer = new Vector3();

      // segment changed
      if (dataOnRoof && dataOnRoof.segmentIdx !== currRoofSegmentIdxRef.current) {
        const pointerOnRoof = dataOnRoof.pointer;
        pointer.copy(pointerOnRoof);
      }
      // segment not changed
      else {
        const pointerOnIntersectionPlane = getPointerOnIntersectionPlane(event);
        if (!pointerOnIntersectionPlane) return;
        pointer.copy(pointerOnIntersectionPlane);
      }

      const newPosition = getPosRelToFoundation(pointer, foundation);
      const posRelToCentroid = newPosition.clone().sub(roofCentroidRef.current);
      const { rotation, segmentVertices, segmentIdx } = RoofUtil.computeState(
        roofSegmentsRef.current,
        posRelToCentroid,
      );
      if (segmentVertices) {
        newPosition.setZ(
          RoofUtil.getRooftopElementZ(segmentVertices, posRelToCentroid, roofCentroidRef.current.z + roof.thickness),
        );
      } else {
        newPosition.setZ(roofCentroidRef.current.z + roof.thickness);
      }

      setCommonStore((state) => {
        const window = state.elements.find((e) => e.id === id && e.type === ObjectType.Window) as WindowModel;
        if (!window) return;
        const segmentVertices = useStore.getState().getRoofSegmentVertices(parentId);
        if (segmentVertices) {
          const vertices = segmentVertices[segmentIdx];
          if (isWindowInsideSegment(newPosition, window.lx, window.lz, window.rotation, vertices)) {
            window.cx = newPosition.x;
            window.cy = newPosition.y;
            window.cz = newPosition.z;
            window.rotation = [...rotation];
            if (dataOnRoof && dataOnRoof.segmentIdx !== currRoofSegmentIdxRef.current) {
              currRoofSegmentIdxRef.current = dataOnRoof.segmentIdx;
            }
          }
        }
      });
    } else if (isResizeHandle(handleTypeRef.current)) {
      const pointerOnIntersectionPlane = getPointerOnIntersectionPlane(event);
      const anchorWorldPos = resizeAnchorWorldPosRef.current;
      const segmentIdx = currRoofSegmentIdxRef.current;
      if (!pointerOnIntersectionPlane || !anchorWorldPos || segmentIdx === null) return;

      const pointerRelToFoundation = getPosRelToFoundation(pointerOnIntersectionPlane, foundation);
      const anchorRelToFoundation = getPosRelToFoundation(anchorWorldPos, foundation);
      const { newLx, newLz, newCenter } = getNewResizedData(anchorRelToFoundation, pointerRelToFoundation, rotation[2]);

      const segmentVertices = useStore.getState().getRoofSegmentVertices(parentId);
      if (segmentVertices) {
        const vertices = segmentVertices[segmentIdx];

        if (vertices && isWindowInsideSegment(newCenter, newLx, newLz, rotation, vertices)) {
          setResizedData(id, newCenter, newLx, newLz, foundation.lz);
        }
      }
    }
  };

  const handlePointerUp = () => {
    handleTypeRef.current = null;
    foundationModelRef.current = null;
    roofModelRef.current = null;
    roofSegmentsRef.current = null;
    roofCentroidRef.current = null;
    currRoofSegmentIdxRef.current = null;
    resizeAnchorWorldPosRef.current = null;
    setShowIntersectionPlane(false);
  };

  return (
    <>
      <group name={'Handle Wrapper'} onPointerDown={handlePointerDown}>
        {!isSettingNewWindow && (
          <>
            <WindowResizeHandle x={-lx / 2} z={lz / 2} handleType={ResizeHandleType.UpperLeft} />
            <WindowResizeHandle x={lx / 2} z={lz / 2} handleType={ResizeHandleType.UpperRight} />
            <WindowResizeHandle x={-lx / 2} z={-lz / 2} handleType={ResizeHandleType.LowerLeft} />
            <WindowResizeHandle x={lx / 2} z={-lz / 2} handleType={ResizeHandleType.LowerRight} />

            {/* arch resize handle */}
            {windowType === WindowType.Arched && <ArchResizeHandle z={lz / 2} />}
          </>
        )}
        <WindowMoveHandle handleType={MoveHandleType.Mid} />
      </group>

      {isOnRoof && showIntersectionPlane && (
        <Plane
          name={INTERSECTION_PLANE_NAME}
          args={[1000, 1000]}
          rotation={[HALF_PI, 0, 0]}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          visible={false}
        >
          <meshBasicMaterial color={'red'} side={DoubleSide} transparent opacity={0.5} />
        </Plane>
      )}
    </>
  );
};

export default React.memo(WindowHandleWrapper);
