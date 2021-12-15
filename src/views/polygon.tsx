/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Box, Sphere } from '@react-three/drei';
import { Euler, Mesh, Shape, Vector3 } from 'three';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { ThreeEvent, useThree } from '@react-three/fiber';
import {
  HALF_PI,
  HIGHLIGHT_HANDLE_COLOR,
  MOVE_HANDLE_RADIUS,
  RESIZE_HANDLE_COLOR,
  RESIZE_HANDLE_SIZE,
  UNIT_VECTOR_NEG_X,
  UNIT_VECTOR_NEG_Y,
  UNIT_VECTOR_POS_X,
  UNIT_VECTOR_POS_Y,
  UNIT_VECTOR_POS_Z,
} from '../constants';
import { ActionType, MoveHandleType, ObjectType, ResizeHandleType, RotateHandleType } from '../types';
import { Util } from '../Util';
import i18n from '../i18n/i18n';
import { PolygonModel } from '../models/PolygonModel';
import { Line } from '@react-three/drei';
import { Point2 } from '../models/Point2';

const Polygon = ({
  id,
  cz,
  lx = 0.1,
  ly = 0.1,
  lz = 0.1,
  filled = false,
  rotation = [0, 0, 0],
  normal = [0, 0, 1],
  color = 'yellow',
  lineColor = 'black',
  lineWidth = 1,
  selected = false,
  showLabel = false,
  parentId,
  vertices,
}: PolygonModel) => {
  const setCommonStore = useStore(Selector.set);
  const language = useStore(Selector.language);
  const getElementById = useStore(Selector.getElementById);
  const selectMe = useStore(Selector.selectMe);
  const updatePolygonSelectedIndexById = useStore(Selector.updatePolygonSelectedIndexById);

  const {
    gl: { domElement },
  } = useThree();
  const [hovered, setHovered] = useState(false);
  const [centerX, setCenterX] = useState(0);
  const [centerY, setCenterY] = useState(0);
  const [hoveredHandle, setHoveredHandle] = useState<MoveHandleType | ResizeHandleType | null>(null);

  const baseRef = useRef<Mesh>();
  const handleRef = useRef<Mesh>();

  const lang = { lng: language };
  const ratio = Math.max(1, Math.max(lx, ly) / 8);
  const resizeHandleSize = RESIZE_HANDLE_SIZE * ratio;
  const moveHandleSize = MOVE_HANDLE_RADIUS * ratio;
  const parent = getElementById(parentId);

  const absoluteVertices = useMemo(() => {
    const av = new Array<Point2>();
    if (parent) {
      switch (parent.type) {
        case ObjectType.Foundation:
          let cx = 0;
          let cy = 0;
          for (const v of vertices) {
            const p2 = { x: parent.cx + v.x * parent.lx, y: parent.cy + v.y * parent.ly } as Point2;
            av.push(p2);
            cx += p2.x;
            cy += p2.y;
          }
          setCenterX(cx / vertices.length);
          setCenterY(cy / vertices.length);
          break;
        case ObjectType.Cuboid:
          // TODO
          break;
      }
    }
    return av;
  }, [vertices, parent]);

  const hz = lz / 2;
  const polygonModel = getElementById(id) as PolygonModel;

  const euler = useMemo(() => {
    const v = new Vector3().fromArray(normal);
    if (Util.isSame(v, UNIT_VECTOR_POS_Z)) {
      // top face in model coordinate system
      return new Euler(0, 0, rotation[2]);
    } else if (Util.isSame(v, UNIT_VECTOR_POS_X)) {
      // east face in model coordinate system
      return new Euler(0, HALF_PI, rotation[2], 'ZXY');
    } else if (Util.isSame(v, UNIT_VECTOR_NEG_X)) {
      // west face in model coordinate system
      return new Euler(0, -HALF_PI, rotation[2], 'ZXY');
    } else if (Util.isSame(v, UNIT_VECTOR_POS_Y)) {
      // south face in the model coordinate system
      return new Euler(-HALF_PI, 0, rotation[2], 'ZXY');
    } else if (Util.isSame(v, UNIT_VECTOR_NEG_Y)) {
      // north face in the model coordinate system
      return new Euler(HALF_PI, 0, rotation[2], 'ZXY');
    }
    return new Euler(0, 0, rotation[2]);
  }, [normal, rotation]);

  const points = useMemo(() => {
    const p = new Array<Vector3>(absoluteVertices.length);
    for (const v of absoluteVertices) {
      p.push(new Vector3(v.x, v.y, 0));
    }
    // close the polygon
    p.push(new Vector3(absoluteVertices[0].x, absoluteVertices[0].y, 0));
    return p;
  }, [absoluteVertices]);

  const shape = useMemo(() => {
    const s = new Shape();
    for (const v of absoluteVertices) {
      s.lineTo(v.x, v.y);
    }
    s.lineTo(absoluteVertices[0].x, absoluteVertices[0].y);
    return s;
  }, [absoluteVertices]);

  const hoverHandle = useCallback((e: ThreeEvent<MouseEvent>, handle: MoveHandleType | ResizeHandleType) => {
    if (e.intersections.length > 0) {
      const intersected = e.intersections[0].object === e.eventObject;
      if (intersected) {
        setHoveredHandle(handle);
        if (handle === MoveHandleType.Default) {
          domElement.style.cursor = 'move';
        } else {
          domElement.style.cursor = 'pointer';
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const noHoverHandle = useCallback(() => {
    setHoveredHandle(null);
    domElement.style.cursor = useStore.getState().addedFoundationId ? 'crosshair' : 'default';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <group name={'Polygon Group ' + id} rotation={euler} position={[0, 0, cz + hz]}>
      <mesh
        uuid={id}
        ref={baseRef}
        position={[0, 0, 0]}
        receiveShadow={true}
        castShadow={false}
        visible={filled}
        name={'Polygon'}
        onPointerDown={(e) => {
          if (e.button === 2) return; // ignore right-click
          selectMe(id, e, ActionType.Move);
        }}
        onContextMenu={(e) => {
          selectMe(id, e);
          setCommonStore((state) => {
            if (e.intersections.length > 0) {
              const intersected = e.intersections[0].object === baseRef.current;
              if (intersected) {
                state.contextMenuObjectType = ObjectType.Polygon;
              }
            }
          });
        }}
        onPointerOver={(e) => {
          if (e.intersections.length > 0) {
            const intersected = e.intersections[0].object === baseRef.current;
            if (intersected) {
              setHovered(true);
              domElement.style.cursor = 'move';
            }
          }
        }}
        onPointerOut={() => {
          setHovered(false);
          domElement.style.cursor = 'default';
        }}
      >
        <shapeBufferGeometry attach="geometry" args={[shape]} />
        <meshBasicMaterial color={color} transparent={true} opacity={0.5} />
      </mesh>

      {/* wireframe */}
      <Line
        points={points}
        color={lineColor}
        lineWidth={lineWidth}
        uuid={id}
        receiveShadow={false}
        castShadow={false}
        name={'Polygon Wireframe'}
      />

      {/* draw handle */}
      {selected && (
        <Sphere
          ref={handleRef}
          position={[centerX, centerY, 0]}
          args={[moveHandleSize, 6, 6]}
          name={MoveHandleType.Default}
          onPointerDown={(e) => {
            selectMe(id, e, ActionType.Move);
          }}
        >
          <meshStandardMaterial attach="material" color={'orange'} />
        </Sphere>
      )}
      {selected &&
        absoluteVertices.map((p, i) => {
          return (
            <Box
              key={'resize-handle-' + i}
              position={[p.x, p.y, 0]}
              name={ResizeHandleType.Default}
              args={[resizeHandleSize, resizeHandleSize, lz * 1.2]}
              onPointerDown={(e) => {
                selectMe(id, e, ActionType.Resize);
                updatePolygonSelectedIndexById(polygonModel.id, i);
              }}
              onPointerOver={(e) => {
                updatePolygonSelectedIndexById(polygonModel.id, i);
                hoverHandle(e, ResizeHandleType.Default);
              }}
              onPointerOut={noHoverHandle}
            >
              <meshStandardMaterial
                attach="material"
                color={
                  hoveredHandle === ResizeHandleType.Default && polygonModel.selectedIndex === i
                    ? HIGHLIGHT_HANDLE_COLOR
                    : RESIZE_HANDLE_COLOR
                }
              />
            </Box>
          );
        })}

      {(hovered || showLabel) && !selected && (
        <textSprite
          name={'Label'}
          text={
            (polygonModel?.label ? polygonModel.label : i18n.t('shared.PolygonElement', lang)) +
            (polygonModel.locked ? ' (' + i18n.t('shared.ElementLocked', lang) + ')' : '')
          }
          fontSize={20}
          fontFace={'Times Roman'}
          textHeight={0.2}
          position={[0, 0, lz + 0.2]}
        />
      )}
    </group>
  );
};

// this one may not use React.memo as it needs to move with its parent.
// there may be a way to notify a memorized component when its parent changes
export default Polygon;
