'use client';
import * as React from 'react';
import useEnhancedEffect from '@mui/utils/useEnhancedEffect';
import useEventCallback from '@mui/utils/useEventCallback';
import { PointerGestureEventData } from '@mui/x-internal-gestures/core';
import Flatbush from 'flatbush';
import { ChartPlugin } from '../../models';
import { getValueToPositionMapper } from '../../../../hooks/useScale';
import { SeriesId } from '../../../../models/seriesType/common';
import { UseChartVoronoiSignature } from './useChartVoronoi.types';
import { getSVGPoint } from '../../../getSVGPoint';
import { useSelector } from '../../../store/useSelector';
import {
  selectorChartAxisZoomData,
  selectorChartXAxis,
  selectorChartYAxis,
  selectorChartZoomIsInteracting,
} from '../useChartCartesianAxis';
import { selectorChartSeriesProcessed } from '../../corePlugins/useChartSeries/useChartSeries.selectors';
import { selectorChartDrawingArea } from '../../corePlugins/useChartDimensions';

type VoronoiSeries = { seriesId: SeriesId; startIndex: number; endIndex: number };

export const useChartVoronoi: ChartPlugin<UseChartVoronoiSignature> = ({
  svgRef,
  params,
  store,
  instance,
}) => {
  const { disableVoronoi, voronoiMaxRadius, onItemClick } = params;
  const drawingArea = useSelector(store, selectorChartDrawingArea);

  const { axis: xAxis, axisIds: xAxisIds } = useSelector(store, selectorChartXAxis);
  const { axis: yAxis, axisIds: yAxisIds } = useSelector(store, selectorChartYAxis);
  const zoomIsInteracting = useSelector(store, selectorChartZoomIsInteracting);

  const { series, seriesOrder } = useSelector(store, selectorChartSeriesProcessed)?.scatter ?? {};
  const voronoiRef = React.useRef<Record<string, VoronoiSeries>>({});
  const flatbushRef = React.useRef<Flatbush | undefined>(undefined);

  const defaultXAxisId = xAxisIds[0];
  const defaultYAxisId = yAxisIds[0];

  useEnhancedEffect(() => {
    store.update((prev) =>
      prev.voronoi.isVoronoiEnabled === !disableVoronoi
        ? prev
        : {
            ...prev,
            voronoi: {
              isVoronoiEnabled: !disableVoronoi,
            },
          },
    );
  }, [store, disableVoronoi]);

  useEnhancedEffect(() => {
    // This effect generate and store the data structure that's used to obtain the closest point to a given coordinate.

    if (zoomIsInteracting || seriesOrder === undefined || series === undefined || disableVoronoi) {
      // If there is no scatter chart series
      return;
    }

    voronoiRef.current = {};
    const dataPoints = Object.values(series).reduce((acc, aSeries) => acc + aSeries.data.length, 0);
    const flatbush = new Flatbush(dataPoints);
    let seriesStartIndex = 0;
    let currentIndex = 0;

    seriesOrder.forEach((seriesId) => {
      const { data, xAxisId, yAxisId } = series[seriesId];

      const xScale = xAxis[xAxisId ?? defaultXAxisId].scale;
      const yScale = yAxis[yAxisId ?? defaultYAxisId].scale;
      const originalXScale = xScale.copy();
      const originalYScale = yScale.copy();
      originalXScale.range([0, 1]);
      originalYScale.range([0, 1]);

      seriesStartIndex = currentIndex;

      for (const datum of data) {
        // Add the points using a [0, 1]. This makes it so that we don't need to recreate the Flatbush structure when zooming.
        flatbush.add(originalXScale(datum.x)!, originalYScale(datum.y)!);

        currentIndex += 1;
      }

      voronoiRef.current[seriesId] = {
        seriesId,
        startIndex: seriesStartIndex,
        endIndex: seriesStartIndex + currentIndex,
      };
    });

    // FIXME: This is slightly incorrect because we'll need one flatbush per series. Or more, accurately, one flatbush per xAxisId and yAxisId combination.
    flatbush.finish();
    flatbushRef.current = flatbush;
  }, [
    zoomIsInteracting,
    defaultXAxisId,
    defaultYAxisId,
    series,
    seriesOrder,
    xAxis,
    yAxis,
    drawingArea,
    instance,
    disableVoronoi,
  ]);

  React.useEffect(() => {
    if (svgRef.current === null || disableVoronoi) {
      return undefined;
    }
    const element = svgRef.current;

    function getClosestPoint(
      event: MouseEvent,
    ):
      | { seriesId: SeriesId; dataIndex: number }
      | 'outside-chart'
      | 'outside-voronoi-max-radius'
      | 'no-point-found' {
      // Get mouse coordinate in global SVG space
      const svgPoint = getSVGPoint(element, event);

      if (!instance.isPointInside(svgPoint.x, svgPoint.y)) {
        return 'outside-chart';
      }

      const flatbush = flatbushRef.current;

      if (!flatbush) {
        return 'no-point-found';
      }

      const xAxisZoom = selectorChartAxisZoomData(
        store.getSnapshot(),
        Object.values(series)[0].xAxisId ?? xAxisIds[0],
      );
      const yAxisZoom = selectorChartAxisZoomData(
        store.getSnapshot(),
        Object.values(series)[0].yAxisId ?? yAxisIds[0],
      );
      const xZoomStart = (xAxisZoom?.start ?? 0) / 100;
      const xZoomEnd = (xAxisZoom?.end ?? 100) / 100;
      const yZoomStart = (yAxisZoom?.start ?? 0) / 100;
      const yZoomEnd = (yAxisZoom?.end ?? 100) / 100;

      const excludeIfOutsideDrawingArea = function excludeIfOutsideDrawingArea(index: number) {
        // eslint-disable-next-line no-underscore-dangle
        const boxes = flatbush._boxes;
        const x = boxes[index * 4];
        const y = boxes[index * 4 + 1];

        return x >= xZoomStart && x <= xZoomEnd && y >= yZoomStart && y <= yZoomEnd;
      };

      const pointX =
        xZoomStart +
        ((svgPoint.x - drawingArea.left) / drawingArea.width) * (xZoomEnd - xZoomStart);
      const pointY =
        yZoomStart +
        (1 - (svgPoint.y - drawingArea.top) / drawingArea.height) * (yZoomEnd - yZoomStart);
      const closestPointIndex = flatbush.neighbors(
        pointX,
        pointY,
        1,
        Infinity,
        excludeIfOutsideDrawingArea,
      )[0];

      if (closestPointIndex === undefined) {
        return 'no-point-found';
      }

      const closestSeries = Object.values(voronoiRef.current).find((value) => {
        return closestPointIndex >= value.startIndex && closestPointIndex < value.endIndex;
      });

      if (closestSeries === undefined) {
        return 'no-point-found';
      }

      const dataIndex = closestPointIndex - voronoiRef.current[closestSeries.seriesId].startIndex;

      return { seriesId: closestSeries.seriesId, dataIndex };
    }

    // Clean the interaction when the mouse leaves the chart.
    const moveEndHandler = instance.addInteractionListener('moveEnd', (event) => {
      if (!event.detail.activeGestures.pan) {
        instance.cleanInteraction?.();
        instance.clearHighlight?.();
      }
    });
    const panEndHandler = instance.addInteractionListener('panEnd', (event) => {
      if (!event.detail.activeGestures.move) {
        instance.cleanInteraction?.();
        instance.clearHighlight?.();
      }
    });
    const pressEndHandler = instance.addInteractionListener('quickPressEnd', (event) => {
      if (!event.detail.activeGestures.move && !event.detail.activeGestures.pan) {
        instance.cleanInteraction?.();
        instance.clearHighlight?.();
      }
    });

    const gestureHandler = (event: CustomEvent<PointerGestureEventData>) => {
      const closestPoint = getClosestPoint(event.detail.srcEvent);

      if (closestPoint === 'outside-chart') {
        instance.cleanInteraction?.();
        instance.clearHighlight?.();
        return;
      }

      if (closestPoint === 'outside-voronoi-max-radius' || closestPoint === 'no-point-found') {
        instance.removeItemInteraction?.();
        instance.clearHighlight?.();
        return;
      }

      const { seriesId, dataIndex } = closestPoint;
      instance.setItemInteraction?.({ type: 'scatter', seriesId, dataIndex });
      instance.setHighlight?.({
        seriesId,
        dataIndex,
      });
    };

    const tapHandler = instance.addInteractionListener('tap', (event) => {
      const closestPoint = getClosestPoint(event.detail.srcEvent);

      if (typeof closestPoint !== 'string' && onItemClick) {
        const { seriesId, dataIndex } = closestPoint;
        onItemClick(event.detail.srcEvent, { type: 'scatter', seriesId, dataIndex });
      }
    });

    const moveHandler = instance.addInteractionListener('move', gestureHandler);
    const panHandler = instance.addInteractionListener('pan', gestureHandler);
    const pressHandler = instance.addInteractionListener('quickPress', gestureHandler);

    return () => {
      tapHandler.cleanup();
      moveHandler.cleanup();
      moveEndHandler.cleanup();
      panHandler.cleanup();
      panEndHandler.cleanup();
      pressHandler.cleanup();
      pressEndHandler.cleanup();
    };
  }, [svgRef, yAxis, xAxis, voronoiMaxRadius, onItemClick, disableVoronoi, drawingArea, instance]);

  // Instance implementation
  const enableVoronoiCallback = useEventCallback(() => {
    store.update((prev) => ({
      ...prev,
      voronoi: {
        ...prev.voronoi,
        isVoronoiEnabled: true,
      },
    }));
  });

  const disableVoronoiCallback = useEventCallback(() => {
    store.update((prev) => ({
      ...prev,
      voronoi: {
        ...prev.voronoi,
        isVoronoiEnabled: false,
      },
    }));
  });

  return {
    instance: {
      enableVoronoi: enableVoronoiCallback,
      disableVoronoi: disableVoronoiCallback,
    },
  };
};

useChartVoronoi.getDefaultizedParams = ({ params }) => ({
  ...params,
  disableVoronoi: params.disableVoronoi ?? !params.series.some((item) => item.type === 'scatter'),
});

useChartVoronoi.getInitialState = (params) => ({
  voronoi: {
    isVoronoiEnabled: !params.disableVoronoi,
  },
});

useChartVoronoi.params = {
  disableVoronoi: true,
  voronoiMaxRadius: true,
  onItemClick: true,
};
