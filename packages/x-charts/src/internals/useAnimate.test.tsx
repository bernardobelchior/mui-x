import { createRenderer } from '@mui/internal-test-utils';
import { expect } from 'chai';
import * as React from 'react';
import { useAnimate } from '@mui/x-charts/internals/useAnimate';
import { interpolateNumber } from '@mui/x-charts-vendor/d3-interpolate';

describe('useAnimate', () => {
  const { render } = createRenderer();

  it('starts animating from initial props', async () => {
    const { promise: animatedFinished, resolve } = Promise.withResolvers<void>();
    let calls = 0;
    let firstCall: number | null = null;

    function applyProps(element: SVGPathElement, props: { width: number }) {
      calls += 1;

      if (firstCall === null) {
        firstCall = props.width;
      }

      if (props.width === 100) {
        resolve();
      }
    }

    function TestComponent() {
      const ref = useAnimate(
        { width: 100 },
        {
          initialProps: { width: 0 },
          createInterpolator: (lastProps, newProps) => {
            const interpolate = interpolateNumber(lastProps.width, newProps.width);
            return (t) => ({ width: interpolate(t) });
          },
          applyProps,
        },
      );

      return (
        <svg>
          <path ref={ref} />
        </svg>
      );
    }

    render(<TestComponent />);

    await animatedFinished;

    expect(calls).to.be.greaterThan(0);
    expect(firstCall).to.be.lessThan(10);
  });
});
