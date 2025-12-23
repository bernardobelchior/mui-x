const canvas = (() => {
  if ('OffscreenCanvas' in global) {
    return new OffscreenCanvas(1, 1);
  }

  const c = document.createElement('canvas')!;
  c.width = 1;
  c.height = 1;
  return c;
})();

/**
 * Parse color string to RGBA object
 */
export function parseColor(color: string) {
  const ctx = canvas.getContext('2d')! as
    | OffscreenCanvasRenderingContext2D
    | CanvasRenderingContext2D;

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);

  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;

  return [r / 255, g / 255, b / 255, a / 255];
}
