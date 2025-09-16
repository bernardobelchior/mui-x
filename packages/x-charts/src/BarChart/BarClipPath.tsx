'use client';
import * as React from 'react';
import { interpolateNumber } from '@mui/x-charts-vendor/d3-interpolate';
import { styled } from '@mui/material/styles';
import { useAnimate } from '../hooks/animation';

interface UseAnimateBarClipPathParams {
  ref?: React.Ref<SVGPathElement>;
  layout: 'vertical' | 'horizontal';
  hasNegative: boolean;
  hasPositive: boolean;
  xOrigin: number;
  yOrigin: number;
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius: number;
  skipAnimation: boolean;
}

type BarClipPathInterpolatedProps = Pick<
  UseAnimateBarClipPathParams,
  'x' | 'y' | 'width' | 'height' | 'borderRadius'
>;

function barClipPathPropsInterpolator(
  from: BarClipPathInterpolatedProps,
  to: BarClipPathInterpolatedProps,
) {
  const interpolateX = interpolateNumber(from.x, to.x);
  const interpolateY = interpolateNumber(from.y, to.y);
  const interpolateWidth = interpolateNumber(from.width, to.width);
  const interpolateHeight = interpolateNumber(from.height, to.height);
  const interpolateBorderRadius = interpolateNumber(from.borderRadius, to.borderRadius);

  return (t: number) => {
    return {
      x: interpolateX(t),
      y: interpolateY(t),
      width: interpolateWidth(t),
      height: interpolateHeight(t),
      borderRadius: interpolateBorderRadius(t),
    };
  };
}

export function useAnimateBarClipPath(props: UseAnimateBarClipPathParams) {
  const initialProps = {
    x: props.layout === 'vertical' ? props.x : props.xOrigin,
    y: props.layout === 'vertical' ? props.yOrigin : props.y,
    width: props.layout === 'vertical' ? props.width : 0,
    height: props.layout === 'vertical' ? 0 : props.height,
    borderRadius: props.borderRadius,
  };

  return useAnimate(
    {
      x: props.x,
      y: props.y,
      width: props.width,
      height: props.height,
      borderRadius: props.borderRadius,
    },
    {
      createInterpolator: barClipPathPropsInterpolator,
      transformProps: (p) => ({
        d: generateClipPath(
          props.hasNegative,
          props.hasPositive,
          props.layout,
          p.x,
          p.y,
          p.width,
          p.height,
          props.xOrigin,
          props.yOrigin,
          p.borderRadius,
        ),
      }),
      applyProps(element: SVGPathElement, { d }) {
        if (d) {
          element.setAttribute('d', d);
        }
      },
      initialProps,
      skip: props.skipAnimation,
      ref: props.ref,
    },
  );
}

export interface BarClipPathProps {
  maskId: string;
  borderRadius?: number;
  hasNegative: boolean;
  hasPositive: boolean;
  layout?: 'vertical' | 'horizontal';
  x: number;
  y: number;
  xOrigin: number;
  yOrigin: number;
  width: number;
  height: number;
  skipAnimation: boolean;
}

const Path = styled('path')({
  transition: 'd 0.2s ease-in !important',
  animation: 'animateBar 0.2s ease-in',

  '@keyframes animateBar': {
    from: { d: 'var(--initial-d)' },
  },
});

export function supportsCSSPathAnimation() {
  return typeof window !== 'object' || CSS.supports('d', 'path("M0 0")');
}

/**
 * @ignore - internal component.
 */
function BarClipPath(props: BarClipPathProps) {
  if (!props.borderRadius || props.borderRadius <= 0) {
    return null;
  }

  return (
    <clipPath id={props.maskId}>
      {supportsCSSPathAnimation() ? (
        <BarClipPathCSSAnimation {...props} />
      ) : (
        <BarClipPathJSAnimation {...props} />
      )}
    </clipPath>
  );
}

function BarClipPathCSSAnimation(props: BarClipPathProps) {
  const { x, y, width, height, skipAnimation } = props;

  const layout = props.layout ?? 'vertical';
  const d = generateClipPath(
    props.hasNegative,
    props.hasPositive,
    layout,
    x,
    y,
    width,
    height,
    props.xOrigin,
    props.yOrigin,
    props.borderRadius ?? 0,
  );

  return (
    <Path
      d={d}
      style={
        skipAnimation
          ? { transition: 'none' }
          : {
              // @ts-expect-error
              '--initial-d': `path("${generateClipPath(
                props.hasNegative,
                props.hasPositive,
                layout,
                layout === 'vertical' ? x : props.xOrigin,
                layout === 'vertical' ? props.yOrigin : y,
                layout === 'vertical' ? width : 0,
                layout === 'vertical' ? 0 : height,
                props.xOrigin,
                props.yOrigin,
                props.borderRadius ?? 0,
              )}")`,
            }
      }
    />
  );
}

function BarClipPathJSAnimation(props: BarClipPathProps) {
  const { x, y, width, height, skipAnimation } = props;
  const { ref, d } = useAnimateBarClipPath({
    layout: props.layout ?? 'vertical',
    hasNegative: props.hasNegative,
    hasPositive: props.hasPositive,
    xOrigin: props.xOrigin,
    yOrigin: props.yOrigin,
    x,
    y,
    width,
    height,
    borderRadius: props.borderRadius ?? 0,
    skipAnimation,
  });

  return <path ref={ref} d={d} />;
}

export function generateClipPath(
  hasNegative: boolean,
  hasPositive: boolean,
  layout: 'vertical' | 'horizontal',
  x: number,
  y: number,
  width: number,
  height: number,
  xOrigin: number,
  yOrigin: number,
  borderRadius: number,
) {
  if (layout === 'vertical') {
    if (hasPositive && hasNegative) {
      const bR = Math.min(borderRadius, width / 2, height / 2);
      return `M${x},${y + height / 2} v${-(height / 2 - bR)} a${bR},${bR} 0 0 1 ${bR},${-bR} h${width - bR * 2} a${bR},${bR} 0 0 1 ${bR},${bR} v${height - 2 * bR} a${bR},${bR} 0 0 1 ${-bR},${bR} h${-(width - bR * 2)} a${bR},${bR} 0 0 1 ${-bR},${-bR} v${-(height / 2 - bR)}`;
    }

    const bR = Math.min(borderRadius, width / 2);
    if (hasPositive) {
      return `M${x},${Math.max(yOrigin, y + bR)} v${Math.min(0, -(yOrigin - y - bR))} a${bR},${bR} 0 0 1 ${bR},${-bR} h${width - bR * 2} a${bR},${bR} 0 0 1 ${bR},${bR} v${Math.max(0, yOrigin - y - bR)} Z`;
    }

    if (hasNegative) {
      return `M${x},${Math.min(yOrigin, y + height - bR)} v${Math.max(0, height - bR)} a${bR},${bR} 0 0 0 ${bR},${bR} h${width - bR * 2} a${bR},${bR} 0 0 0 ${bR},${-bR} v${-Math.max(0, height - bR)} Z`;
    }
  }

  if (layout === 'horizontal') {
    if (hasPositive && hasNegative) {
      const bR = Math.min(borderRadius, width / 2, height / 2);
      return `M${x + width / 2},${y} h${width / 2 - bR} a${bR},${bR} 0 0 1 ${bR},${bR} v${height - bR * 2} a${bR},${bR} 0 0 1 ${-bR},${bR} h${-(width - 2 * bR)} a${bR},${bR} 0 0 1 ${-bR},${-bR} v${-(height - bR * 2)} a${bR},${bR} 0 0 1 ${bR},${-bR} h${width / 2 - bR}`;
    }

    const bR = Math.min(borderRadius, height / 2);
    if (hasPositive) {
      return `M${Math.min(xOrigin, x - bR)},${y} h${width} a${bR},${bR} 0 0 1 ${bR},${bR} v${height - bR * 2} a${bR},${bR} 0 0 1 ${-bR},${bR} h${-width} Z`;
    }

    if (hasNegative) {
      return `M${Math.max(xOrigin, x + width + bR)},${y} h${-width} a${bR},${bR} 0 0 0 ${-bR},${bR} v${height - bR * 2} a${bR},${bR} 0 0 0 ${bR},${bR} h${width} Z`;
    }
  }

  return undefined;
}

export { BarClipPath };
