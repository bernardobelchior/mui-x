'use client';
import * as React from 'react';
import { useWebGLContext } from '@mui/x-charts/internals';

export function useRerenderWebGLCanvasOnResize() {
  const gl = useWebGLContext();
  const [renderKey, rerender] = React.useReducer((s) => s + 1, 0);

  React.useEffect(() => {
    const canvas = gl?.canvas;

    if (!(canvas instanceof HTMLCanvasElement)) {
      return;
    }

    // FIXME: This is broken in Safari, need to find a cross-browser way to handle this
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width =
          entry.devicePixelContentBoxSize?.[0].inlineSize ||
          entry.contentBoxSize[0].inlineSize * devicePixelRatio;
        const height =
          entry.devicePixelContentBoxSize?.[0].blockSize ||
          entry.contentBoxSize[0].blockSize * devicePixelRatio;

        canvas.width = width;
        canvas.height = height;

        // Update WebGL viewport
        gl?.viewport(0, 0, width, height);

        rerender();
      }
    });

    try {
      // Throws in Safari
      observer.observe(canvas, { box: 'device-pixel-content-box' });
    } catch {
      observer.observe(canvas, { box: 'content-box' });
    }
  }, [gl, gl?.canvas]);

  return renderKey;
}
