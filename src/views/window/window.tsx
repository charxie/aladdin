/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import React, { useEffect, useMemo } from 'react';
import { Color, DoubleSide } from 'three';
import { Box } from '@react-three/drei';
import { WindowModel, WindowType } from 'src/models/WindowModel';
import { useStore } from 'src/stores/common';
import { ObjectType } from 'src/types';
import * as Selector from 'src/stores/selector';
import WindowHandleWrapper from './windowHandleWrapper';
import { DEFAULT_WINDOW_SHININESS } from 'src/constants';
import { ThreeEvent } from '@react-three/fiber';
import RectangleWindow from './rectangleWindow';
import ArchedWindow from './archedWindow';
import { RulerOnWall } from '../rulerOnWall';
import { Util } from '../../Util';
import { usePrimitiveStore } from '../../stores/commonPrimitive';

export const defaultShutter = { showLeft: false, showRight: false, color: 'grey', width: 0.5 };

export type MullionDataType = {
  showMullion: boolean;
  width: number;
  spacingX: number;
  spacingY: number;
  color: string;
};

export type FrameDataType = {
  showFrame: boolean;
  width: number;
  color: string;
};

export type WireframeDataType = {
  lineColor: string;
  lineWidth: number;
  selected: boolean;
  locked: boolean;
  opacity: number;
};

interface ShutterProps {
  cx: number;
  cz?: number;
  lx: number;
  lz: number;
  color: string;
  showLeft: boolean;
  showRight: boolean;
  spacing: number;
}

export const Shutter = ({ cx, cz = 0, lx, lz, color, showLeft, showRight, spacing }: ShutterProps) => {
  const shadowEnabled = useStore(Selector.viewState.shadowEnabled);
  const showHeatFluxes = usePrimitiveStore(Selector.showHeatFluxes);
  if (showHeatFluxes) {
    return null;
  }

  return (
    <group name={'Shutter Group'}>
      {showRight && (
        <Box
          args={[lx, 0.1, lz]}
          position={[cx + spacing, 0, cz]}
          castShadow={shadowEnabled}
          receiveShadow={shadowEnabled}
        >
          <meshStandardMaterial color={color} />
        </Box>
      )}
      {showLeft && (
        <Box
          args={[lx, 0.1, lz]}
          position={[-cx - spacing, 0, cz]}
          castShadow={shadowEnabled}
          receiveShadow={shadowEnabled}
        >
          <meshStandardMaterial color={color} />
        </Box>
      )}
    </group>
  );
};

const useUpdataOldFiles = (windowModel: WindowModel) => {
  const fileChanged = useStore(Selector.fileChanged);
  useEffect(() => {
    if (
      windowModel.mullion === undefined ||
      windowModel.mullionWidth === undefined ||
      windowModel.mullionSpacing === undefined ||
      windowModel.tint === undefined ||
      windowModel.opacity === undefined ||
      windowModel.shutter === undefined ||
      windowModel.mullionColor === undefined ||
      windowModel.frame === undefined ||
      windowModel.color === undefined ||
      windowModel.frameWidth === undefined ||
      windowModel.windowType === undefined ||
      windowModel.archHeight === undefined
    ) {
      useStore.getState().set((state) => {
        for (const e of state.elements) {
          if (e.id === windowModel.id) {
            const w = e as WindowModel;
            if (w.mullion === undefined) {
              w.mullion = true;
            }
            if (w.mullionWidth === undefined) {
              w.mullionWidth = 0.06;
            }
            if (w.mullionSpacing === undefined) {
              w.mullionSpacing = 0.5;
            }
            if (w.tint === undefined) {
              w.tint = '#73D8FF';
            }
            if (w.opacity === undefined) {
              w.opacity = 0.5;
            }
            if (w.shutter === undefined) {
              w.shutter = defaultShutter;
            }
            if (w.mullionColor === undefined) {
              w.mullionColor = 'white';
            }
            if (w.frame === undefined) {
              w.frame = false;
            }
            if (w.color === undefined) {
              w.color = 'white';
            }
            if (w.frameWidth === undefined) {
              w.frameWidth = 0.1;
            }
            if (w.windowType === undefined) {
              w.windowType = WindowType.Default;
            }
            if (w.archHeight === undefined) {
              w.archHeight = 1;
            }
            break;
          }
        }
      });
    }
  }, [fileChanged]);
};

const Window = (windowModel: WindowModel) => {
  const {
    id,
    cx,
    cy,
    cz,
    lx,
    ly,
    lz,
    selected,
    locked,
    lineWidth = 0.2,
    lineColor = 'black',
    mullion: showMullion = true,
    mullionWidth = 0.06,
    mullionSpacing = 0.5,
    tint = '#73D8FF',
    opacity = 0.5,
    shutter = defaultShutter,
    mullionColor = 'white',
    frame = false,
    color = 'white',
    frameWidth = 0.1,
    windowType = WindowType.Default,
    archHeight,
  } = windowModel;

  useUpdataOldFiles(windowModel);

  const setCommonStore = useStore(Selector.set);
  const isAddingElement = useStore(Selector.isAddingElement);
  const windowShininess = useStore(Selector.viewState.windowShininess);

  const selectMe = () => {
    setCommonStore((state) => {
      for (const e of state.elements) {
        if (e.id === id) {
          e.selected = true;
          state.selectedElement = e;
        } else {
          e.selected = false;
        }
      }
    });
  };

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (e.button === 2 || useStore.getState().addedWallId) return; // ignore right-click
    if (e.intersections.length > 0 && e.intersections[0].eventObject.name === `Window group ${id}`) {
      if (
        !useStore.getState().moveHandleType &&
        !useStore.getState().resizeHandleType &&
        useStore.getState().objectTypeToAdd === ObjectType.None &&
        !selected &&
        !isAddingElement()
      ) {
        selectMe();
      }
    }
  };

  const onContextMenu = (e: ThreeEvent<MouseEvent>) => {
    if (e.intersections.length > 0 && e.intersections[0].eventObject.name === `Window group ${id}`) {
      if (!selected) {
        selectMe();
      }
      setCommonStore((state) => {
        state.contextMenuObjectType = ObjectType.Window;
      });
    }
  };

  const glassMaterial = useMemo(
    () => (
      <meshPhongMaterial
        specular={new Color('white')}
        shininess={windowShininess ?? DEFAULT_WINDOW_SHININESS}
        color={tint}
        side={DoubleSide}
        opacity={opacity}
        transparent={true}
      />
    ),
    [windowShininess, tint, opacity],
  );

  const dimensionData = useMemo(() => {
    if (archHeight !== undefined) {
      return [lx, ly, lz, archHeight];
    }
    return [lx, ly, lz];
  }, [lx, ly, lz, archHeight]);

  const positionData = useMemo(() => [cx, cy, cz], [cx, cy, cz]);

  const mullionData = useMemo(
    () =>
      ({
        showMullion,
        width: mullionWidth,
        spacingX: mullionSpacing,
        spacingY: mullionSpacing,
        color: mullionColor,
      } as MullionDataType),
    [showMullion, mullionWidth, mullionSpacing, mullionColor],
  );

  const frameData = useMemo(
    () => ({ showFrame: frame, width: frameWidth, color } as FrameDataType),
    [frame, frameWidth, color],
  );

  const wireframeData = useMemo(
    () => ({ lineColor, lineWidth, selected, locked, opacity } as WireframeDataType),
    [lineColor, lineWidth, selected, locked, opacity],
  );

  const showHeatFluxes = usePrimitiveStore(Selector.showHeatFluxes);

  const renderWindow = () => {
    switch (windowType) {
      case WindowType.Default:
        return (
          <RectangleWindow
            id={windowModel.id}
            dimension={dimensionData}
            position={positionData}
            mullionData={mullionData}
            frameData={frameData}
            wireframeData={wireframeData}
            shutter={shutter}
            glassMaterial={glassMaterial}
            showHeatFluxes={showHeatFluxes}
            area={Util.getWindowArea(windowModel)}
          />
        );
      case WindowType.Arched:
        return (
          <ArchedWindow
            id={windowModel.id}
            dimension={dimensionData}
            position={positionData}
            mullionData={mullionData}
            frameData={frameData}
            wireframeData={wireframeData}
            shutter={shutter}
            glassMaterial={glassMaterial}
            showHeatFluxes={showHeatFluxes}
            area={Util.getWindowArea(windowModel)}
          />
        );
    }
  };

  return (
    <group
      key={id}
      name={`Window group ${id}`}
      position={[cx, 0, cz]}
      onPointerDown={onPointerDown}
      onContextMenu={onContextMenu}
    >
      {renderWindow()}

      {/* ruler */}
      {selected && <RulerOnWall element={windowModel} />}

      {/* handles */}
      {selected && !locked && <WindowHandleWrapper lx={lx} lz={lz} windowType={windowType} />}
    </group>
  );
};

export default React.memo(Window);
