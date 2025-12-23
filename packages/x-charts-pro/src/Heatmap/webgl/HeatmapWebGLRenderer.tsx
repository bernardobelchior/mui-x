'use client';
import * as React from 'react';
import { useDrawingArea, WebGLProvider } from '@mui/x-charts/internals';
import { HeatmapWebGLPlot } from './HeatmapWebGLPlot';

function HeatmapWebGLRenderer() {
  const drawingArea = useDrawingArea();

  return (
    <foreignObject
      x={drawingArea.left}
      y={drawingArea.top}
      width={drawingArea.width}
      height={drawingArea.height}
    >
      <WebGLProvider width={drawingArea.width} height={drawingArea.height}>
        <HeatmapWebGLPlot />
      </WebGLProvider>
    </foreignObject>
  );
}

export { HeatmapWebGLRenderer };
