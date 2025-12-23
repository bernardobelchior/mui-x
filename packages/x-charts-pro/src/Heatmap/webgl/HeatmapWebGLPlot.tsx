'use client';
import * as React from 'react';
import { useXScale, useYScale, useZColorScale, useDrawingArea } from '@mui/x-charts/hooks';
import {
  selectorChartsIsFadedCallback,
  selectorChartsIsHighlightedCallback,
  useStore,
  useWebGLContext,
} from '@mui/x-charts/internals';
import { useHeatmapSeriesContext } from '../../hooks';
import { parseColor } from './utils';

const vertexShaderSource = `
    precision mediump float;
    
    attribute vec2 a_position;
    attribute vec2 a_center;
    attribute vec4 a_color;
    attribute float a_saturation;
    
    varying vec4 v_color;
    varying vec2 v_pos;
    
    uniform vec2 u_dimensions;
    uniform vec2 u_resolution;
    
    // https://tsev.dev/posts/2020-06-19-colour-correction-with-webgl/
    vec3 adjust_saturation(vec3 color, float value) {
      // https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
      const vec3 luminosityFactor = vec3(0.2126, 0.7152, 0.0722);
      vec3 grayscale = vec3(dot(color, luminosityFactor));
    
      return mix(grayscale, color, 1.0 + value);
    }
    
    void main() {
      // Convert from pixels to clip space (-1 to 1)
      vec2 position = a_center + a_position * u_dimensions / 2.0;
      vec2 clipSpace = (position / u_resolution) * 2.0 - 1.0;
      gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
      
      v_color = vec4(adjust_saturation(a_color.rgb, a_saturation), 1.0);
      v_pos = a_position;
    }
  `;

const fragmentShaderSource = `
    precision mediump float;
    
    varying vec4 v_color;
    varying vec2 v_pos;
    
    uniform vec2 u_dimensions;
    
    void main() {
      float alpha_x = 1.0 - step(u_dimensions.x, v_pos.x);
      float alpha_y = 1.0 - step(u_dimensions.y, v_pos.y);
      float alpha = alpha_x * alpha_y;
      gl_FragColor = vec4(v_color.rgb, v_color.a * alpha);
    }
  `;

function useRerenderOnResize() {
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
  const vertexShaderRef = React.useRef<WebGLShader | null>(null);
  const fragmentShaderRef = React.useRef<WebGLShader | null>(null);
  const programRef = React.useRef<WebGLProgram | null>(null);

  const renderKey = useRerenderOnResize();

  React.useEffect(() => {
    if (!gl) {
      return;
    }

    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);
    vertexShaderRef.current = vertexShader;

    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', gl.getShaderInfoLog(vertexShader));
    }

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);
    fragmentShaderRef.current = fragmentShader;

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', gl.getShaderInfoLog(fragmentShader));
    }

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program linking error:', gl.getProgramInfoLog(program));
    }

    // eslint-disable-next-line react-compiler/react-compiler
    gl.useProgram(program);

    if (gl.getError()) {
      console.error('WebGL error during program setup');
    }

    const quadVertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);

    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

    const aPosition = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

    // Enable blending for transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    programRef.current = program;
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
