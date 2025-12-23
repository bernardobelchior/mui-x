const canvas = (() => {
  if (typeof window === 'undefined') {
    // No canvas in SSR
    return null as unknown as HTMLCanvasElement;
  }

  if ('OffscreenCanvas' in window) {
    return new OffscreenCanvas(1, 1);
  }

  const c = document.createElement('canvas')!;
  c.width = 1;
  c.height = 1;
  return c;
})();

const colorCache = new Map<string, [number, number, number, number]>();

/**
 * Parse color string to RGBA object. Each channel is normalized to [0, 1].
 * This function does not work in SSR.
 */
export function parseColor(color: string) {
  const cached = colorCache.get(color);

  if (cached) {
    return cached;
  }

  const ctx = canvas.getContext('2d')! as
    | OffscreenCanvasRenderingContext2D
    | CanvasRenderingContext2D;

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);

  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;

  const result: [number, number, number, number] = [r / 255, g / 255, b / 255, a / 255];

  colorCache.set(color, result);

  return result;
}
