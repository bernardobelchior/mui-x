'use client';
import * as React from 'react';
import useSlotProps from '@mui/utils/useSlotProps';
import { styled, useTheme, useThemeProps } from '@mui/material/styles';
import { AxisScaleConfig, ChartsXAxisProps, ComputedAxis } from '../models/axis';
import { ChartsSingleXAxisTicks } from './ChartsSingleXAxisTicks';
import { ChartsGroupedXAxisTicks } from './ChartsGroupedXAxisTicks';
import { ChartsText, ChartsTextProps } from '../ChartsText';
import { isOrdinalScale } from '../internals/scaleGuards';
import { isInfinity } from '../internals/isInfinity';
import { defaultProps, useUtilityClasses } from './utilities';
import { useDrawingArea } from '../hooks';
import { getStringSize } from '../internals/domUtils';
import { AxisRoot } from '../internals/components/AxisSharedComponents';
import { useTicks } from '../hooks/useTicks';
import { useAxisTicksProps } from './useAxisTicksProps';
import { getVisibleLabels, measureTickLabels } from './getVisibleLabels';
import { useMounted } from '../hooks/useMounted';
import { useChartContext } from '../context/ChartProvider';
import { degToRad } from '../internals/degToRad';
import { useChartDimensions, useSelector, useStore } from '../internals';

const XAxisRoot = styled(AxisRoot, {
  name: 'MuiChartsXAxis',
  slot: 'Root',
})({});

interface ChartsXAxisImplProps extends Omit<ChartsXAxisProps, 'axis'> {
  axis: ComputedAxis<keyof AxisScaleConfig, any, ChartsXAxisProps>;
}

/**
 * @ignore - internal component. Use `ChartsXAxis` instead.
 */
export function ChartsXAxisImpl({ axis, ...inProps }: ChartsXAxisImplProps) {
  const { scale: xScale, tickNumber, reverse, ...settings } = axis;

  // eslint-disable-next-line material-ui/mui-name-matches-component-name
  const themedProps = useThemeProps({ props: { ...settings, ...inProps }, name: 'MuiChartsXAxis' });
  const defaultizedProps = { ...defaultProps, ...themedProps };

  const {
    position,
    labelStyle,
    offset,
    slots,
    slotProps,
    sx,
    disableLine,
    label,
    height: axisHeight,
  } = defaultizedProps;

  const theme = useTheme();
  const classes = useUtilityClasses(defaultizedProps);
  const { left, top, width, height } = useDrawingArea();

  const positionSign = position === 'bottom' ? 1 : -1;
  const Line = slots?.axisLine ?? 'line';
  const Label = slots?.axisLabel ?? ChartsText;

  const axisLabelProps = useSlotProps({
    elementType: Label,
    externalSlotProps: slotProps?.axisLabel,
    additionalProps: {
      style: {
        ...theme.typography.body1,
        lineHeight: 1,
        fontSize: 14,
        textAnchor: 'middle',
        dominantBaseline: position === 'bottom' ? 'text-after-edge' : 'text-before-edge',
        ...labelStyle,
      },
    } as Partial<ChartsTextProps>,
    ownerState: {},
  });

  const { instance } = useChartContext();
  const isMounted = useMounted();
  const {
    axisTickLabelProps,
    defaultizedProps: {
      valueFormatter,
      tickInterval,
      tickLabelInterval,
      tickPlacement,
      tickLabelPlacement,
      tickLabelMinGap,
    },
  } = useAxisTicksProps(inProps);
  const xTicks = useTicks({
    scale: xScale,
    tickNumber,
    valueFormatter,
    tickInterval,
    tickPlacement,
    tickLabelPlacement,
    direction: 'x',
  });
  const chartHeight = useSelector(useStore(), (state) => state.dimensions.height);
  const visibleLabels = getVisibleLabels(xTicks, {
    tickLabelStyle: axisTickLabelProps.style,
    tickLabelInterval,
    tickLabelMinGap,
    reverse,
    isMounted,
    isXInside: instance.isXInside,
  });
  const measurements = Array.from(
    measureTickLabels(Array.from(visibleLabels), axisTickLabelProps.style).values(),
  ).map((v) => getHeight(v.width, v.height, axisTickLabelProps.style?.angle || 0));
  const maxHeight = measurements.reduce((acc, cur) => Math.max(acc, cur), 0);
  const maxAxisHeight = 0.5 * chartHeight;
  const finalAxisHeight = Math.min(maxHeight, maxAxisHeight);
  console.log(
    axisTickLabelProps.style?.angle,
    visibleLabels,
    measurements,
    Math.min(maxHeight, maxAxisHeight),
    maxHeight,
    maxAxisHeight,
  );

  if (position === 'none') {
    return null;
  }

  const labelHeight = label ? getStringSize(label, axisLabelProps.style).height : 0;

  const domain = xScale.domain();
  const isScaleOrdinal = isOrdinalScale(xScale);
  const skipTickRendering = isScaleOrdinal ? domain.length === 0 : domain.some(isInfinity);
  let children: React.ReactNode = null;

  if (!skipTickRendering) {
    children =
      'groups' in axis && Array.isArray(axis.groups) ? (
        <ChartsGroupedXAxisTicks {...inProps} />
      ) : (
        <ChartsSingleXAxisTicks
          {...inProps}
          axisLabelHeight={labelHeight}
          axisHeight={finalAxisHeight}
        />
      );
  }

  const labelRefPoint = {
    x: left + width / 2,
    y: positionSign * axisHeight,
  };

  return (
    <XAxisRoot
      transform={`translate(0, ${position === 'bottom' ? top + height + offset : top - offset})`}
      className={classes.root}
      sx={sx}
    >
      {!disableLine && (
        <Line x1={left} x2={left + width} className={classes.line} {...slotProps?.axisLine} />
      )}
      {children}
      {label && (
        <g className={classes.label}>
          <Label {...labelRefPoint} {...axisLabelProps} text={label} />
        </g>
      )}
    </XAxisRoot>
  );
}

function getHeight(width: number, height: number, angleDeg: number) {
  const angle = degToRad(angleDeg);

  const angledHeight = Math.abs(width * Math.sin(angle)) + Math.abs(height * Math.cos(angle));

  return angledHeight;
}
