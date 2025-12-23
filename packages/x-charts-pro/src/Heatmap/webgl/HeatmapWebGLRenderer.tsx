'use client';
import * as React from 'react';
import { useRegisterPointerInteractions, WebGLProvider } from '@mui/x-charts/internals';
import { HeatmapWebGLPlot } from './HeatmapWebGLPlot';
import { type HeatmapRendererProps } from '../Heatmap.types';
import { selectorHeatmapItemAtPosition } from '../../plugins/selectors/useChartHeatmapPosition.selectors';

function HeatmapWebGLRenderer({ borderRadius }: HeatmapRendererProps) {
  useRegisterPointerInteractions(selectorHeatmapItemAtPosition);

  return (
    <WebGLProvider>
      <HeatmapWebGLPlot borderRadius={borderRadius} />
    </WebGLProvider>
  );
}

export { HeatmapWebGLRenderer };
