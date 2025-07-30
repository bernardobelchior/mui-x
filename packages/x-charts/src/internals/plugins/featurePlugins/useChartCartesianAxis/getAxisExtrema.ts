import { AxisConfig } from '../../../../models';
import { CartesianChartSeriesType } from '../../../../models/seriesType/config';
import { ChartSeriesConfig } from '../../models/seriesConfig';
import { ProcessedSeries } from '../../corePlugins/useChartSeries/useChartSeries.types';
import { CartesianExtremumGetter } from '../../models/seriesConfig/cartesianExtremumGetter.types';
import { GetZoomAxisFilters } from './zoom.types';
import { isCartesianSeriesType } from '../../../isCartesian';
import { findMinMax } from '../../../findMinMax';

/**
 * Returns the minimum and maximum values for the given axis.
 */
export function getAxisExtrema<T extends CartesianChartSeriesType>(
  axis: AxisConfig,
  axisDirection: 'x' | 'y',
  seriesConfig: ChartSeriesConfig<T>,
  axisIndex: number,
  formattedSeries: ProcessedSeries<T>,
  getFilters?: GetZoomAxisFilters,
): [number, number] {
  let [min, max] = findMinMax(axis.data ?? []);

  for (const seriesType in formattedSeries) {
    if (!Object.hasOwn(formattedSeries, seriesType)) {
      continue;
    }

    if (!isCartesianSeriesType(seriesType)) {
      continue;
    }

    const getter =
      axisDirection === 'x'
        ? seriesConfig[seriesType].xExtremumGetter
        : seriesConfig[seriesType].yExtremumGetter;
    const series = formattedSeries[seriesType]?.series ?? {};

    const extrema = (getter as CartesianExtremumGetter<typeof seriesType>)?.({
      series,
      axis,
      axisIndex,
      isDefaultAxis: axisIndex === 0,
      getFilters,
    }) ?? [Infinity, -Infinity];

    min = Math.min(min, extrema[0]);
    max = Math.max(max, extrema[1]);
  }

  if (Number.isNaN(min) || Number.isNaN(max)) {
    return [Infinity, -Infinity];
  }

  return [min, max];
}
