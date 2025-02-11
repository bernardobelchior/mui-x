// DOM utils taken from
// https://github.com/recharts/recharts/blob/master/src/util/DOMUtils.ts

function isSsr(): boolean {
  return typeof window === 'undefined';
}

interface StringCache {
  widthCache: Record<string, any>;
  cacheCount: number;
}

const stringCache: StringCache = {
  widthCache: {},
  cacheCount: 0,
};
const canvasStringCache: StringCache = {
  widthCache: {},
  cacheCount: 0,
};
const MAX_CACHE_NUM = 2000;
const SPAN_STYLE = {
  position: 'absolute',
  top: '-20000px',
  left: 0,
  padding: 0,
  margin: 0,
  border: 'none',
  whiteSpace: 'pre',
} satisfies React.CSSProperties;
const STYLE_LIST = [
  'minWidth',
  'maxWidth',
  'width',
  'minHeight',
  'maxHeight',
  'height',
  'top',
  'left',
  'fontSize',
  'padding',
  'margin',
  'paddingLeft',
  'paddingRight',
  'paddingTop',
  'paddingBottom',
  'marginLeft',
  'marginRight',
  'marginTop',
  'marginBottom',
];
export const MEASUREMENT_SPAN_ID = 'mui_measurement_span';
export const MEASUREMENT_CANVAS_ID = 'mui_measurement_canvas';

/**
 *
 * @param name CSS property name
 * @param value
 * @returns add 'px' for distance properties
 */
function autoCompleteStyle(name: string, value: number) {
  if (STYLE_LIST.indexOf(name) >= 0 && value === +value) {
    return `${value}px`;
  }

  return value;
}

/**
 *
 * @param text camelcase css property
 * @returns css property
 */
function camelToMiddleLine(text: string) {
  const strs = text.split('');

  const formatStrs = strs.reduce((result: string[], entry) => {
    if (entry === entry.toUpperCase()) {
      return [...result, '-', entry.toLowerCase()];
    }

    return [...result, entry];
  }, []);

  return formatStrs.join('');
}

/**
 *
 * @param style React style object
 * @returns CSS styling string
 */
export const getStyleString = (style: React.CSSProperties) =>
  Object.keys(style)
    .sort()
    .reduce(
      (result, s) =>
        `${result}${camelToMiddleLine(s)}:${autoCompleteStyle(
          s,
          (style as Record<string, any>)[s],
        )};`,
      '',
    );

let domCleanTimeout: NodeJS.Timeout | undefined;
const domResults = { count: 0, time: 0 };

if (typeof window !== 'undefined') {
  window.domResults = domResults;
}

/**
 *
 * @param text The string to estimate
 * @param style The style applied
 * @returns width and height of the text
 */
export const getStringSize = (text: string | number, style: React.CSSProperties = {}) => {
  if (text === undefined || text === null || isSsr()) {
    return { width: 0, height: 0 };
  }

  const str = `${text}`;
  const styleString = getStyleString(style);
  const cacheKey = `${str}-${styleString}`;

  if (stringCache.widthCache[cacheKey]) {
    return stringCache.widthCache[cacheKey];
  }

  domResults.count++;

  const startTime = performance.now();
  try {
    let measurementSpan = document.getElementById(MEASUREMENT_SPAN_ID);
    if (measurementSpan === null) {
      measurementSpan = document.createElement('span');
      measurementSpan.setAttribute('id', MEASUREMENT_SPAN_ID);
      measurementSpan.setAttribute('aria-hidden', 'true');
      document.body.appendChild(measurementSpan);
    }
    // Need to use CSS Object Model (CSSOM) to be able to comply with Content Security Policy (CSP)
    // https://en.wikipedia.org/wiki/Content_Security_Policy
    const measurementSpanStyle: Record<string, any> = { ...SPAN_STYLE, ...style };

    Object.keys(measurementSpanStyle).map((styleKey) => {
      (measurementSpan!.style as Record<string, any>)[camelToMiddleLine(styleKey)] =
        autoCompleteStyle(styleKey, measurementSpanStyle[styleKey]);
      return styleKey;
    });
    measurementSpan.textContent = str;
    const rect = measurementSpan.getBoundingClientRect();
    const result = { width: rect.width, height: rect.height };

    stringCache.widthCache[cacheKey] = result;

    if (stringCache.cacheCount + 1 > MAX_CACHE_NUM) {
      stringCache.cacheCount = 0;
      stringCache.widthCache = {};
    } else {
      stringCache.cacheCount += 1;
    }

    if (domCleanTimeout) {
      clearTimeout(domCleanTimeout);
    }
    domCleanTimeout = setTimeout(() => {
      // Limit node cleaning to once per render cycle
      measurementSpan.textContent = '';
    }, 0);

    return result;
  } catch {
    return { width: 0, height: 0 };
  } finally {
    domResults.time += performance.now() - startTime;
  }
};

function applyCSSStyleToCanvas(
  canvasContext: CanvasRenderingContext2D,
  style: React.CSSProperties,
) {
  canvasContext.font = style.font
    ? style.font
    : `${style.fontWeight} ${style.fontVariant} ${style.fontStyle} ${style.fontSize}px/${style.lineHeight} ${style.fontStretch} ${style.fontFamily}`;
  canvasContext.letterSpacing = style.letterSpacing ?? 'normal';
  const defaultBaseline = style.writingMode?.startsWith('vertical') ? 'central' : 'alphabetic';
  canvasContext.textBaseline =
    style.dominantBaseline === 'auto'
      ? defaultBaseline
      : (style.dominantBaseline ?? defaultBaseline);
}

export function measureTextWidth(text: string | number, style: React.CSSProperties = {}) {
  const str = `${text}`;
  const styleString = getStyleString(style);
  const cacheKey = `${str}-${styleString}`;

  if (canvasStringCache.widthCache[cacheKey]) {
    return canvasStringCache.widthCache[cacheKey];
  }

  domResults.count++;

  const startTime = performance.now();
  try {
    let measurementCanvas = document.getElementById(MEASUREMENT_CANVAS_ID) as HTMLCanvasElement;
    if (measurementCanvas === null) {
      measurementCanvas = document.createElement('canvas');
      measurementCanvas.setAttribute('id', MEASUREMENT_CANVAS_ID);
      measurementCanvas.setAttribute('aria-hidden', 'true');
      Object.entries(SPAN_STYLE).forEach(([key, value]) => {
        measurementCanvas.style[key] = value;
      });
      document.body.appendChild(measurementCanvas);
    }

    const canvasContext = measurementCanvas.getContext('2d')!;
    applyCSSStyleToCanvas(canvasContext, style);

    const metrics = canvasContext.measureText(str);
    const result = {
      width: metrics.width,
      height: metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent,
    };

    canvasStringCache.widthCache[cacheKey] = result;

    if (canvasStringCache.cacheCount + 1 > MAX_CACHE_NUM) {
      canvasStringCache.cacheCount = 0;
      canvasStringCache.widthCache = {};
    } else {
      canvasStringCache.cacheCount += 1;
    }

    return result;
  } catch {
    return { width: 0, height: 0 };
  } finally {
    domResults.time += performance.now() - startTime;
  }
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export function unstable_cleanupDOM() {
  // const measurementSpan = document.getElementById(MEASUREMENT_SPAN_ID);
  // measurementSpan?.remove();
}
