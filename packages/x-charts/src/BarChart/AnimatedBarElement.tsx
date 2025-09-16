'use client';
import * as React from 'react';
import { styled } from '@mui/material/styles';
import { SeriesId } from '../models/seriesType/common';
import { BarElementOwnerState } from './barElementClasses';
import { useAnimateBar } from '../hooks/animation/useAnimateBar';
import { supportsCSSPathAnimation } from './BarClipPath';

export interface BarProps
  extends Omit<
    React.SVGProps<SVGRectElement>,
    'id' | 'color' | 'ref' | 'x' | 'y' | 'height' | 'width'
  > {
  id: SeriesId;
  dataIndex: number;
  color: string;
  ownerState: BarElementOwnerState;
  /**
   * The position in the x-axis of the stack this bar belongs to.
   */
  xOrigin: number;
  /**
   * The position in the y-axis of the stack this bar belongs to.
   */
  yOrigin: number;
  /**
   * The position of the bar in the x-axis.
   */
  x: number;
  /**
   * The position of the bar in the y-axis.
   */
  y: number;
  /**
   * The height of the bar.
   */
  height: number;
  /**
   * The width of the bar.
   */
  width: number;
  /**
   * The orientation of the bar.
   */
  layout: 'vertical' | 'horizontal';
  /**
   * If true, no animations should be applied.
   */
  skipAnimation: boolean;
}

export function AnimatedBarElement(props: BarProps) {
  const BarElement = supportsCSSPathAnimation() ? CSSAnimatedBarElement : JSAnimatedBarElement;

  return <BarElement {...props} />;
}

function JSAnimatedBarElement(props: BarProps) {
  const { ownerState, skipAnimation, id, dataIndex, xOrigin, yOrigin, ...other } = props;
  const animatedProps = useAnimateBar(props);

  return (
    <rect
      {...other}
      filter={ownerState.isHighlighted ? 'brightness(120%)' : undefined}
      opacity={ownerState.isFaded ? 0.3 : 1}
      data-highlighted={ownerState.isHighlighted || undefined}
      data-faded={ownerState.isFaded || undefined}
      {...animatedProps}
    />
  );
}

const Rect = styled('rect')({
  transitionProperty: 'x, width, y, height, opacity, fill !important',
  transitionDuration: '0.2s !important',
  transitionTimingFunction: 'ease-in !important',
});

function CSSAnimatedBarElement(props: BarProps) {
  const { ownerState, skipAnimation, id, dataIndex, xOrigin, yOrigin, ...other } = props;

  return (
    <Rect
      {...other}
      filter={ownerState.isHighlighted ? 'brightness(120%)' : undefined}
      opacity={ownerState.isFaded ? 0.3 : 1}
      data-highlighted={ownerState.isHighlighted || undefined}
      data-faded={ownerState.isFaded || undefined}
    />
  );
}
