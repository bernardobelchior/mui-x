'use client';
import * as React from 'react';
import { useWebGLContext } from '@mui/x-charts/internals';

function getDevicePixelContentBoxSize(entry: ResizeObserverEntry) {
  // Safari does not support devicePixelContentBoxSize
  if (entry.devicePixelContentBoxSize) {
    return {
      width: entry.devicePixelContentBoxSize[0].inlineSize,
      height: entry.devicePixelContentBoxSize[0].blockSize,
    };
  }
  // These values not correct, but they're as close as you can get in Safari
  return {
    width: entry.contentBoxSize[0].inlineSize * devicePixelRatio,
    height: entry.contentBoxSize[0].blockSize * devicePixelRatio,
  };
}

export function useRerenderWebGLCanvasOnResize() {
  const gl = useWebGLContext();
  const [renderKey, rerender] = React.useReducer((s) => s + 1, 0);

  React.useEffect(() => {
    const canvas = gl?.canvas;

    if (!(canvas instanceof HTMLCanvasElement)) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = getDevicePixelContentBoxSize(entry);
        console.log('observed');

        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

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
