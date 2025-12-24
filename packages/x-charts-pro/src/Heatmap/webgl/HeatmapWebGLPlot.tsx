'use client';
import * as React from 'react';
import { useDrawingArea, useXScale, useYScale, useZColorScale } from '@mui/x-charts/hooks';
import {
  selectorChartsIsFadedCallback,
  selectorChartsIsHighlightedCallback,
  useStore,
  useWebGLContext,
} from '@mui/x-charts/internals';
import { useHeatmapSeriesContext } from '../../hooks';
import { parseColor } from './parseColor';
import { heatmapFragmentShaderSource, heatmapVertexShaderSource } from './shaders';
import { initializeWebGLProgram } from './initializeWebGLProgram';
import { useRerenderWebGLCanvasOnResize } from './useRerenderWebGLCanvasOnResize';

export function HeatmapWebGLPlot() {
  const drawingArea = useDrawingArea();
  const xScale = useXScale<'band'>();
  const yScale = useYScale<'band'>();
  const colorScale = useZColorScale()!;
  const series = useHeatmapSeriesContext();
  const store = useStore();
  const isHighlighted = store.use(selectorChartsIsHighlightedCallback);
  const isFaded = store.use(selectorChartsIsFadedCallback);

  const gl = useWebGLContext();
  const programRef = React.useRef<WebGLProgram | null>(null);

  const renderKey = useRerenderWebGLCanvasOnResize();

  React.useEffect(() => {
    if (!gl) {
      return;
    }

    programRef.current = initializeWebGLProgram(
      gl,
      heatmapVertexShaderSource,
      heatmapFragmentShaderSource,
    );
  }, [gl]);

  React.useEffect(() => {
    const program = programRef.current;

    if (!gl || !program) {
      return;
    }

    if (!series || series.seriesOrder.length === 0) {
      return;
    }

    // Setup resolution uniform
    const uResolution = gl.getUniformLocation(program, 'u_resolution');
    gl.uniform2f(uResolution, drawingArea.width, drawingArea.height);

    const seriesToDisplay = series.series[series.seriesOrder[0]];

    const centers = new Float32Array(seriesToDisplay.data.length * 2);
    const colors = new Float32Array(seriesToDisplay.data.length * 4);
    const saturations = new Float32Array(seriesToDisplay.data.length);

    const xDomain = xScale.domain();
    const yDomain = yScale.domain();
    const width = xScale.bandwidth();
    const height = yScale.bandwidth();

    for (let dataIndex = 0; dataIndex < seriesToDisplay.data.length; dataIndex += 1) {
      const [xIndex, yIndex, value] = seriesToDisplay.data[dataIndex];

      const x = xScale(xDomain[xIndex]);
      const y = yScale(yDomain[yIndex]);
      const color = colorScale?.(value);

      if (x === undefined || y === undefined || !color) {
        continue;
      }

      centers[dataIndex * 2] = x + width / 2 - drawingArea.left;
      centers[dataIndex * 2 + 1] = y + height / 2 - drawingArea.top;

      const rgbColor = parseColor(color);

      colors[dataIndex * 4] = rgbColor[0];
      colors[dataIndex * 4 + 1] = rgbColor[1];
      colors[dataIndex * 4 + 2] = rgbColor[2];
      colors[dataIndex * 4 + 3] = 1.0;

      if (isHighlighted({ seriesId: seriesToDisplay.id, dataIndex })) {
        saturations[dataIndex] = 0.2;
      } else if (isFaded({ seriesId: seriesToDisplay.id, dataIndex })) {
        saturations[dataIndex] = -0.2;
      }
    }

    const uDimensions = gl.getUniformLocation(program, 'u_dimensions');
    gl.uniform2f(uDimensions, width, height);

    // Upload rectangle centers
    const centerBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, centerBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, centers, gl.STATIC_DRAW);

    const aCenter = gl.getAttribLocation(program, 'a_center');
    gl.enableVertexAttribArray(aCenter);
    gl.vertexAttribPointer(aCenter, 2, gl.FLOAT, false, 0, 0);

    // This makes the attribute instanced (one value per rectangle, not per vertex)
    gl.vertexAttribDivisor(aCenter, 1);

    // Upload colors
    const colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);

    const aColor = gl.getAttribLocation(program, 'a_color');
    gl.enableVertexAttribArray(aColor);
    gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(aColor, 1);

    // Upload saturations
    const saturationBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, saturationBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, saturations, gl.STATIC_DRAW);

    const aSaturation = gl.getAttribLocation(program, 'a_saturation');
    gl.enableVertexAttribArray(aSaturation);
    gl.vertexAttribPointer(aSaturation, 1, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(aSaturation, 1);

    // Clear and draw
    gl.clearColor(1, 1, 1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw all rectangles with one instanced draw call
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, seriesToDisplay.data.length);
  }, [
    renderKey,
    gl,
    drawingArea.left,
    drawingArea.top,
    drawingArea.width,
    drawingArea.height,
    series,
    xScale,
    yScale,
    colorScale,
    isHighlighted,
    isFaded,
  ]);

  return null;
}
