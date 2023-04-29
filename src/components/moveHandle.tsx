/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { Sphere } from '@react-three/drei';
import { ThreeEvent } from '@react-three/fiber';
import { useRef } from 'react';
import { HIGHLIGHT_HANDLE_COLOR, MOVE_HANDLE_COLOR_1, MOVE_HANDLE_COLOR_2, MOVE_HANDLE_COLOR_3 } from 'src/constants';
import { useStore } from 'src/stores/common';
import { useRefStore } from 'src/stores/commonRef';
import { MoveHandleType, ResizeHandleType, RotateHandleType } from 'src/types';
import { Mesh } from 'three';
import * as Selector from '../stores/selector';

interface MoveHandleProps {
  position: number[];
  size: number;
  handleType: MoveHandleType;
  onPointerDown?: () => void;
  onPointerOver: (e: ThreeEvent<MouseEvent>, handle: MoveHandleType | ResizeHandleType | RotateHandleType) => void;
  onPointerOut: () => void;
}

const MoveHandle = ({ handleType, position, size, onPointerOver, onPointerOut }: MoveHandleProps) => {
  const movehandleType = useStore(Selector.moveHandleType);
  const hoveredHandle = useStore(Selector.hoveredHandle);

  const handleRef = useRef<Mesh>();

  const [cx, cy, cz] = position;

  let handleColor = MOVE_HANDLE_COLOR_1;
  if (cx === 0 && cy === 0) {
    handleColor = MOVE_HANDLE_COLOR_3;
  } else if (cx === 0) {
    handleColor = MOVE_HANDLE_COLOR_2;
  } else if (cy === 0) {
    handleColor = MOVE_HANDLE_COLOR_1;
  }

  const color = hoveredHandle === handleType || movehandleType === handleType ? HIGHLIGHT_HANDLE_COLOR : handleColor;

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.intersections.length > 0 && e.intersections[0].eventObject.name === handleType) {
      useStore.getState().set((state) => {
        state.moveHandleType = handleType;
        state.selectedElement = state.elements.find((e) => e.selected) ?? null;
      });
      useRefStore.getState().setEnableOrbitController(false);
    }
  };

  return (
    <Sphere
      ref={handleRef}
      name={handleType}
      args={[size / 2, 6, 6, 0, Math.PI]}
      position={[cx, cy, cz]}
      onPointerDown={handlePointerDown}
      onPointerOver={(e) => {
        onPointerOver(e, handleType);
      }}
      onPointerOut={onPointerOut}
    >
      <meshBasicMaterial color={color} />
    </Sphere>
  );
};

export default MoveHandle;
