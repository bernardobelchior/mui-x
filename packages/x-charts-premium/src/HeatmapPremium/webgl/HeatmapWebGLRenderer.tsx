'use client';
import * as React from 'react';
import { useRegisterPointerInteractions, WebGLProvider } from '@mui/x-charts/internals';
import {
  type HeatmapRendererProps,
  selectorHeatmapItemAtPosition,
} from '@mui/x-charts-pro/internals';
import { HeatmapWebGLPlot } from './HeatmapWebGLPlot';

export function HeatmapWebGLRenderer({ borderRadius }: HeatmapRendererProps) {
  useRegisterPointerInteractions(selectorHeatmapItemAtPosition);

  return (
    <WebGLProvider>
      <HeatmapWebGLPlot borderRadius={borderRadius} />
    </WebGLProvider>
  );
}
