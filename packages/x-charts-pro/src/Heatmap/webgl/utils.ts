const canvas = new OffscreenCanvas(1, 1);

/**
 * Parse color string to RGBA object
 */
export function parseColor(color: string) {
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);

  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;

  return [r / 255, g / 255, b / 255, a / 255];
}
