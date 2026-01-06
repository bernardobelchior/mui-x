'use client';
import * as React from 'react';
import { useRegisterPointerInteractions, WebGLProvider } from '@mui/x-charts/internals';
import { HeatmapWebGLPlot } from './HeatmapWebGLPlot';
import { selectorHeatmapItemAtPosition } from '../../plugins/selectors/useChartHeatmapPosition.selectors';

function HeatmapWebGLRenderer() {
  useRegisterPointerInteractions(selectorHeatmapItemAtPosition);

  return (
    <WebGLProvider>
      <HeatmapWebGLPlot />
    </WebGLProvider>
  );
}

export { HeatmapWebGLRenderer };
