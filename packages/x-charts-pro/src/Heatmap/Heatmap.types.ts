import { type HeatmapItemProps } from './HeatmapItem';

export interface HeatmapRendererProps extends Pick<HeatmapItemProps, 'slots' | 'slotProps'> {}
