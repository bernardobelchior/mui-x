'use client';
import PropTypes from 'prop-types';
import { HeatmapSVGRenderer } from './HeatmapSVGRenderer';
import { HeatmapWebGLRenderer } from './webgl';
import { type HeatmapRendererProps } from './Heatmap.types';

export interface HeatmapPlotProps extends HeatmapRendererProps {
  renderer: 'svg-single' | 'webgl';
}

function HeatmapPlot({ renderer, ...props }: HeatmapPlotProps) {
  if (renderer === 'webgl') {
    return <HeatmapWebGLRenderer />;
  }

  return <HeatmapSVGRenderer {...props} />;
}

HeatmapPlot.propTypes = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // | To update them edit the TypeScript types and run "pnpm proptypes"  |
  // ----------------------------------------------------------------------
  /**
   * The props used for each component slot.
   * @default {}
   */
  slotProps: PropTypes.object,
  /**
   * Overridable component slots.
   * @default {}
   */
  slots: PropTypes.object,
} as any;

export { HeatmapPlot };
