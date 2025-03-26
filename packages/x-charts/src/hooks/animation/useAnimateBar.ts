import * as React from 'react';
import { interpolateNumber } from '@mui/x-charts-vendor/d3-interpolate';
import { useAnimate } from '../../internals/animation/useAnimate';
import type { BarProps } from '../../BarChart/AnimatedBarElement';

type UseAnimateBarParams = Pick<
  BarProps,
  'x' | 'y' | 'xOrigin' | 'yOrigin' | 'width' | 'height' | 'skipAnimation' | 'layout'
> & {
  ref?: React.Ref<SVGRectElement>;
};
type UseAnimateBarReturnValue = {
  ref: React.Ref<SVGRectElement>;
} & Pick<BarProps, 'x' | 'y' | 'width' | 'height'>;
type BarInterpolatedProps = Pick<UseAnimateBarParams, 'x' | 'y' | 'width' | 'height'>;

function barPropsInterpolator(from: BarInterpolatedProps, to: BarInterpolatedProps) {
  const interpolateX = interpolateNumber(from.x, to.x);
  const interpolateY = interpolateNumber(from.y, to.y);
  const interpolateWidth = interpolateNumber(from.width, to.width);
  const interpolateHeight = interpolateNumber(from.height, to.height);

  return (t: number) => {
    return {
      x: interpolateX(t),
      y: interpolateY(t),
      width: interpolateWidth(t),
      height: interpolateHeight(t),
    };
  };
}

export function useAnimateBar(props: UseAnimateBarParams): UseAnimateBarReturnValue {
  const initialProps = {
    x: props.layout === 'vertical' ? props.x : props.xOrigin,
    y: props.layout === 'vertical' ? props.yOrigin : props.y,
    width: props.layout === 'vertical' ? props.width : 0,
    height: props.layout === 'vertical' ? 0 : props.height,
  };

  const ref = useAnimate<BarInterpolatedProps, SVGRectElement>(
    {
      x: props.x,
      y: props.y,
      width: props.width,
      height: props.height,
    },
    {
      createInterpolator: barPropsInterpolator,
      applyProps(element, animatedProps) {
        element.setAttribute('x', animatedProps.x.toString());
        element.setAttribute('y', animatedProps.y.toString());
        element.setAttribute('width', animatedProps.width.toString());
        element.setAttribute('height', animatedProps.height.toString());
      },
      initialProps,
      skip: props.skipAnimation,
    },
  );

  const usedProps = props.skipAnimation ? props : initialProps;

  return {
    ref,
    x: usedProps.x,
    y: usedProps.y,
    width: usedProps.width,
    height: usedProps.height,
  };
}
