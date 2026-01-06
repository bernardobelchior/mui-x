'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import useForkRef from '@mui/utils/useForkRef';
import { useChartRootRef, useDrawingArea } from '../../hooks';

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
  const chartRootRef = useChartRootRef();
  const drawingArea = useDrawingArea();

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

  if (!chartRootRef.current) {
    return null;
  }

  return (
    <WebGLContext.Provider value={context}>
      {ReactDOM.createPortal(
        <canvas
          ref={handleRef}
          {...props}
          style={{
            position: 'absolute',
            left: drawingArea.left,
            top: drawingArea.top,
            width: drawingArea.width,
            height: drawingArea.height,
            pointerEvents: 'none',
          }}
        />,
        chartRootRef.current,
      )}
      {children}
    </WebGLContext.Provider>
  );
});
