'use client';
import PropTypes from 'prop-types';
import { HeatmapSVGPlot } from './svg/HeatmapSVGPlot';
import { type HeatmapRendererProps } from './Heatmap.types';

export interface HeatmapPlotProps extends HeatmapRendererProps {}

function HeatmapPlot({ borderRadius, ...props }: HeatmapPlotProps) {
  return <HeatmapSVGPlot borderRadius={borderRadius} {...props} />;
}

HeatmapPlot.propTypes = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // | To update them edit the TypeScript types and run "pnpm proptypes"  |
  // ----------------------------------------------------------------------
  /**
   * The border radius of the heatmap cells in pixels.
   */
  borderRadius: PropTypes.number,
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
