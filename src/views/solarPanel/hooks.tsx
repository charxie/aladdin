/*
 * @Copyright 2022. Institute for Future Intelligence, Inc.
 */

import { useThree } from '@react-three/fiber';
import { useEffect, useMemo, useState } from 'react';
import {
  GAP_PERCENT,
  MARGIN_PERCENT,
  RESOLUTION,
  SOLAR_PANEL_CELL_COLOR_BLACK,
  SOLAR_PANEL_CELL_COLOR_BLUE,
} from 'src/constants';
import { PvModel } from 'src/models/PvModel';
import { useStore } from 'src/stores/common';
import { Orientation } from 'src/types';
import { Util } from 'src/Util';
import { CanvasTexture, RepeatWrapping } from 'three';
import * as Selector from '../../stores/selector';

export const useSolarPanelHeatmapTexture = (id: string) => {
  const showSolarRadiationHeatmap = useStore(Selector.showSolarRadiationHeatmap);
  const solarRadiationHeatmapMaxValue = useStore(Selector.viewState.solarRadiationHeatmapMaxValue);
  const [heatmapTexture, setHeatmapTexture] = useState<CanvasTexture | null>(null);

  useEffect(() => {
    if (showSolarRadiationHeatmap) {
      const heatmap = useStore.getState().getHeatmap(id);
      if (heatmap) {
        setHeatmapTexture(Util.fetchHeatmapTexture(heatmap, solarRadiationHeatmapMaxValue ?? 5));
      }
    }
  }, [showSolarRadiationHeatmap, solarRadiationHeatmapMaxValue]);

  return heatmapTexture;
};

export const useSolarPanelTexture = (
  lx: number,
  ly: number,
  pvModel: PvModel,
  orientation: Orientation,
  customizedFrameColor: string | undefined,
) => {
  const [texture, setTexture] = useState<CanvasTexture | null>(null);
  const { invalidate } = useThree();

  const frameColor =
    customizedFrameColor ?? (pvModel?.color === 'Black' && pvModel?.cellType === 'Monocrystalline' ? 'black' : 'white');

  const canvasTexture = useMemo(() => {
    if (!pvModel) return null;
    const { cellType, length, width, m, n, color } = pvModel;
    if (orientation === Orientation.portrait) {
      return drawSolarPanelCanvasTexture(cellType, width, length, n, m, color, frameColor);
    } else {
      return drawSolarPanelCanvasTexture(cellType, length, width, m, n, color, frameColor);
    }
  }, [pvModel, orientation, frameColor]);

  useEffect(() => {
    if (canvasTexture && pvModel) {
      const { length, width } = pvModel;
      const nx = Math.max(1, Math.round(lx / (orientation === Orientation.landscape ? length : width)));
      const ny = Math.max(1, Math.round(ly / (orientation === Orientation.landscape ? width : length)));
      canvasTexture.repeat.set(nx, ny);
      canvasTexture.wrapS = canvasTexture.wrapT = RepeatWrapping;
      setTexture(canvasTexture);
      invalidate();
    }
  }, [canvasTexture, lx, ly]);

  return texture;
};

const drawSolarPanelCanvasTexture = (
  cellType: string,
  length: number, // x
  width: number, // y
  m: number,
  n: number,
  color: string,
  frameColor: string,
) => {
  length *= RESOLUTION;
  width *= RESOLUTION;

  const canvas = document.createElement('canvas') as HTMLCanvasElement;
  [canvas.width, canvas.height] = [length, width];

  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = frameColor;
    ctx.fillRect(0, 0, length, width);

    const margin = Math.max(length, width) * MARGIN_PERCENT;
    ctx.fillStyle = 'gray';
    ctx.fillRect(margin, margin, length - 2 * margin, width - 2 * margin);

    // cell color
    ctx.fillStyle = color === 'Black' ? SOLAR_PANEL_CELL_COLOR_BLACK : SOLAR_PANEL_CELL_COLOR_BLUE;

    if (cellType === 'Thin Film') {
      const tfMargin = margin * 0.6;
      ctx.fillRect(tfMargin, tfMargin, length - tfMargin * 2, width - tfMargin * 2);
      ctx.strokeStyle = 'rgb(255,255,255, 0.5)';
      ctx.lineWidth = 0.5;
      for (let x = tfMargin; x < length - tfMargin; x += 3) {
        ctx.beginPath();
        ctx.moveTo(x, tfMargin);
        ctx.lineTo(x, width - tfMargin);
        ctx.stroke();
      }
    } else {
      const gap = Math.max(length, width) * GAP_PERCENT;
      const padding = margin + gap;
      const cellSizeX = (length - padding * 2 - gap * (m - 1)) / m;
      const cellSizeY = (width - padding * 2 - gap * (n - 1)) / n;
      const offsetX = cellSizeX * 0.1;
      const offsetY = cellSizeY * 0.1;
      if (cellType === 'Monocrystalline') {
        for (let i = 0; i < n; i++) {
          const y = padding + (cellSizeY + gap) * i;
          for (let j = 0; j < m; j++) {
            const x = padding + (cellSizeX + gap) * j;
            ctx.beginPath();
            ctx.moveTo(x, y + offsetY);
            ctx.lineTo(x, y + cellSizeY - offsetY);
            ctx.lineTo(x + offsetX, y + cellSizeY);
            ctx.lineTo(x + cellSizeX - offsetX, y + cellSizeY);
            ctx.lineTo(x + cellSizeX, y + cellSizeY - offsetY);
            ctx.lineTo(x + cellSizeX, y + offsetY);
            ctx.lineTo(x + cellSizeX - offsetX, y);
            ctx.lineTo(x + offsetX, y);
            ctx.closePath();
            ctx.fill();
          }
        }
      } else if (cellType === 'Polycrystalline') {
        for (let i = 0; i < n; i++) {
          const y = padding + (cellSizeY + gap) * i;
          for (let j = 0; j < m; j++) {
            const x = padding + (cellSizeX + gap) * j;
            ctx.fillRect(x, y, cellSizeX, cellSizeY);
          }
        }
      }
    }
  }

  return new CanvasTexture(canvas);
};
