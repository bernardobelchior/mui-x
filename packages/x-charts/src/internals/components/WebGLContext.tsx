'use client';
import * as React from 'react';
import useForkRef from '@mui/utils/useForkRef';

const WebGLContext = React.createContext<WebGL2RenderingContext | null>(null);

export function useWebGLContext(): WebGL2RenderingContext | null {
  return React.useContext(WebGLContext);
}

export const WebGLProvider = React.forwardRef<
  HTMLCanvasElement,
  React.PropsWithChildren<React.ComponentProps<'canvas'>>
>(function CanvasProvider({ children, ...props }, ref) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [context, setContext] = React.useState<WebGL2RenderingContext | null>(null);
  const handleRef = useForkRef(canvasRef, ref);

  React.useEffect(() => {
    const canvas = canvasRef.current;

    if (canvas) {
      const ctx = canvas.getContext('webgl2', { antialias: false });

      if (!ctx) {
        return;
      }

      setContext(ctx);
    }
  }, []);

  return (
    <WebGLContext.Provider value={context}>
      {/* This div with position fixed is necessary to work around https://bugs.webkit.org/show_bug.cgi?id=23113 which
       * would incorrectly position the canvas when using browser zoom.
       */}
      <div style={{ position: 'fixed', inset: 0 }}>
        <canvas ref={handleRef} {...props} style={{ width: '100%', height: '100%' }} />
      </div>
      {children}
    </WebGLContext.Provider>
  );
});
