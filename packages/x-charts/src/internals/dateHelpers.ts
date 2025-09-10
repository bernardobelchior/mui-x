import { scaleTime } from '@mui/x-charts-vendor/d3-scale';
import { AxisConfig } from '../models';
import { ChartsAxisProps } from '../models/axis';

/**
 * Checks if the provided data array contains Date objects.
 * @param data The data array to check.
 * @returns A type predicate indicating if the data is an array of Date objects.
 */
export const isDateData = (data?: readonly any[]): data is Date[] => data?.[0] instanceof Date;

/**
 * Creates a formatter function for date values.
 * @param data The data array containing date values.
 * @param range The range for the time scale.
 * @param tickNumber The number of ticks to format (optional).
 * @returns A formatter function for date values.
 */
export function createDateFormatter(
  data: readonly any[],
  range: number[],
  tickNumber?: number,
): AxisConfig<'band' | 'point', any, ChartsAxisProps>['valueFormatter'] {
  const timeScale = scaleTime(data, range);

  return (v, { location }) =>
    location === 'tick' ? timeScale.tickFormat(tickNumber)(v) : `${v.toLocaleString()}`;
}
