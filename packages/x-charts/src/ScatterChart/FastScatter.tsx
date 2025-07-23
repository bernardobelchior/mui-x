'use client';
import * as React from 'react';
import { DefaultizedScatterSeriesType, ScatterItemIdentifier } from '../models/seriesType/scatter';
import { useStore } from '../internals/store/useStore';
import { useSelector } from '../internals/store/useSelector';
import { D3Scale } from '../models/axis';
import {
  selectorChartsVoronoiIsVoronoiEnabled,
  UseChartVoronoiSignature,
} from '../internals/plugins/featurePlugins/useChartVoronoi';
import { ColorGetter } from '../internals/plugins/models/seriesConfig';
import { ScatterClasses, useUtilityClasses } from './scatterClasses';
import { useChartContext } from '../context/ChartProvider';
import { UseChartInteractionSignature } from '../internals/plugins/featurePlugins/useChartInteraction';
import {
  selectorChartsHighlightedItem,
  selectorChartsHighlightedState,
  UseChartHighlightSignature,
} from '../internals/plugins/featurePlugins/useChartHighlight';
import { getValueToPositionMapper } from '../hooks/useScale';
import { useInteractionGroupProps } from '../hooks/useInteractionItemProps';

export interface FastScatterProps {
  series: DefaultizedScatterSeriesType;
  xScale: D3Scale;
  yScale: D3Scale;
  color: string;
  colorGetter?: ColorGetter<'scatter'>;
  /**
   * Callback fired when clicking on a scatter item.
   * @param {MouseEvent} event Mouse event recorded on the `<svg/>` element.
   * @param {ScatterItemIdentifier} scatterItemIdentifier The scatter item identifier.
   */
  onItemClick?: (
    event: React.MouseEvent<SVGElement, MouseEvent>,
    scatterItemIdentifier: ScatterItemIdentifier,
  ) => void;
  classes?: Partial<ScatterClasses>;
}

/**
 * Demos:
 *
 * - [Scatter](https://mui.com/x/react-charts/scatter/)
 * - [Scatter demonstration](https://mui.com/x/react-charts/scatter-demo/)
 *
 * API:
 *
 * - [Scatter API](https://mui.com/x/api/charts/scatter/)
 */
function FastScatter(props: FastScatterProps) {
  const { series, xScale, yScale, color, classes: inClasses } = props;

  const groupRef = React.useRef<SVGGElement>(null);
  const { instance } =
    useChartContext<[UseChartInteractionSignature, UseChartHighlightSignature]>();
  const store = useStore<[UseChartVoronoiSignature]>();
  const isVoronoiEnabled = useSelector(store, selectorChartsVoronoiIsVoronoiEnabled);
  const skipInteractionHandlers = Boolean(isVoronoiEnabled || series.disableHover);

  const getXPosition = getValueToPositionMapper(xScale);
  const getYPosition = getValueToPositionMapper(yScale);
  const eventHandlers = useInteractionGroupProps(
    series.id,
    series.data,
    getXPosition,
    getYPosition,
    series.markerSize,
    skipInteractionHandlers,
  );
  const highlightedItem = useSelector(store, selectorChartsHighlightedState);

  const MAX_POINTS_PER_PATH = 1000;
  let fadedPoints = 0;
  const fadedPaths: string[] = [];
  let fadedPath = '';

  let highlightedPoints = 0;
  const highlightedPaths: string[] = [];
  let highlightedPath = '';

  let regularPoints = 0;
  const regularPaths: string[] = [];
  let regularPath = '';

  const radius = series.markerSize;
  for (let i = 0; i < series.data.length; i += 1) {
    const scatterPoint = series.data[i];

    const x = getXPosition(scatterPoint.x);
    const y = getYPosition(scatterPoint.y);

    const isInRange = instance.isPointInside(x, y);

    const isHighlighted =
      highlightedItem && highlightedItem.seriesId === series.id && highlightedItem.dataIndex === i;
    const isFaded = highlightedItem && !isHighlighted;

    if (isInRange) {
      if (isHighlighted) {
        highlightedPoints += 1;
        highlightedPath += `M${x + radius * 1.2} ${y + radius * 1.2} A${radius * 1.2} ${radius * 1.2} 0 1 1 ${x + radius * 1.2} ${y + radius * 1.2 - 0.01}`;
      } else if (isFaded) {
        fadedPoints += 1;
        fadedPath += `M${x + radius} ${y + radius} A${radius} ${radius} 0 1 1 ${x + radius} ${y + radius - 0.01}`;
      } else {
        regularPoints += 1;
        regularPath += `M${x + radius} ${y + radius} A${radius} ${radius} 0 1 1 ${x + radius} ${y + radius - 0.01}`;
      }
    }

    const points = isHighlighted ? highlightedPoints : isFaded ? fadedPoints : regularPoints;
    if (points >= MAX_POINTS_PER_PATH) {
      if (isHighlighted) {
        highlightedPaths.push(highlightedPath);
        highlightedPath = '';
        highlightedPoints = 0;
      } else if (isFaded) {
        fadedPaths.push(fadedPath);
        fadedPath = '';
        fadedPoints = 0;
      } else {
        regularPaths.push(regularPath);
        regularPath = '';
        regularPoints = 0;
      }
    }
  }

  if (regularPath !== '') {
    regularPaths.push(regularPath);
  }

  if (fadedPath !== '') {
    fadedPaths.push(fadedPath);
  }

  if (highlightedPath !== '') {
    highlightedPaths.push(highlightedPath);
  }

  const classes = useUtilityClasses(inClasses);

  return (
    <g
      ref={groupRef}
      data-series={series.id}
      className={classes.root}
      onPointerMove={eventHandlers?.onPointerMove}
      onPointerLeave={eventHandlers?.onPointerLeave}
    >
      {regularPaths.map((d, i) => (
        <path key={i} fill={color} d={d} />
      ))}
      {highlightedPaths.map((d, i) => (
        <path key={`highlighted-${i}`} fill={color} d={d} />
      ))}
      {fadedPaths.map((d, i) => (
        <path key={`faded-${i}`} fill={color} d={d} opacity={0.3} />
      ))}
    </g>
  );
}

export { FastScatter };
