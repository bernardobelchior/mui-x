export function createExportIframe(title?: string): HTMLIFrameElement {
  const iframeEl = document.createElement('iframe');
  iframeEl.style.position = 'absolute';
  iframeEl.style.width = '0px';
  iframeEl.style.height = '0px';
  iframeEl.title = title || document.title;
  return iframeEl;
}

/**
 * Applies styles to an element and returns the previous styles.
 */
export function applyStyles(
  element: HTMLElement | SVGElement,
  styles: Record<string, string | null>,
) {
  const previousStyles: Record<string, string | null> = {};

  Object.entries(styles).forEach(([key, value]) => {
    const prev = element.style.getPropertyValue(key);

    previousStyles[key] = prev;

    element.style.setProperty(key, value);
  });

  return previousStyles;
}

/**
 * Copies the content of all canvases from the original element to the cloned element.
 */
export function copyCanvasesContent(
  original: HTMLElement | SVGElement,
  clone: HTMLElement | SVGElement,
) {
  const originalCanvases = original.querySelectorAll('canvas');
  const cloneCanvases = clone.querySelectorAll('canvas');

  originalCanvases.forEach((originalCanvas, index) => {
    const cloneCanvas = cloneCanvases[index];
    if (cloneCanvas) {
      const context2d = cloneCanvas.getContext('2d');

      if (context2d) {
        context2d.drawImage(originalCanvas, 0, 0);
      }
    }
  });
}
