'use client';
import { HeatmapSVGPlot, type HeatmapRendererProps } from '@mui/x-charts-pro/internals';
import { HeatmapWebGLRenderer } from './webgl';

export interface HeatmapPlotPremiumProps extends HeatmapRendererProps {
  renderer: 'svg-single' | 'webgl';
}

export function HeatmapPlotPremium({ renderer, borderRadius, ...props }: HeatmapPlotPremiumProps) {
  if (renderer === 'webgl') {
    return <HeatmapWebGLRenderer borderRadius={borderRadius} />;
  }

  return <HeatmapSVGPlot borderRadius={borderRadius} {...props} />;
}
