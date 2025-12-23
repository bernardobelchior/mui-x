'use client';
import * as React from 'react';
import { useDrawingArea, WebGLProvider } from '@mui/x-charts/internals';
import { HeatmapWebGLPlot } from './HeatmapWebGLPlot';
import { useInteractionItemProps } from '../useInteractionItemProps';

function HeatmapWebGLRenderer() {
  const drawingArea = useDrawingArea();
  const eventHandlers = useInteractionItemProps();

  return (
    <foreignObject
      x={drawingArea.left}
      y={drawingArea.top}
      width={drawingArea.width}
      height={drawingArea.height}
      {...eventHandlers}
    >
      <WebGLProvider width={drawingArea.width} height={drawingArea.height}>
        <HeatmapWebGLPlot />
      </WebGLProvider>
    </foreignObject>
  );
}

export { HeatmapWebGLRenderer };
