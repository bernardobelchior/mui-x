import ownerDocument from '@mui/utils/ownerDocument';
import { createExportIframe, loadStyleSheets } from './common';
import { ChartImageExportOptions } from './useChartProExport.types';

export const getDrawDocument = async () => {
  const module = await import('rasterizehtml');

  return module.drawDocument;
};

export async function exportImage(
  element: HTMLElement | SVGElement,
  { fileName, type, quality }: ChartImageExportOptions = { type: 'image/png', quality: 0.9 },
) {
  const drawDocumentPromise = getDrawDocument();
  const { width, height } = element.getBoundingClientRect();
  const doc = ownerDocument(element);
  const canvas = document.createElement('canvas');
  const ratio = window.devicePixelRatio || 1;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  const iframe = createExportIframe(fileName);

  let resolve;
  const iframeLoadPromise = new Promise((res) => {
    resolve = res;
  });

  iframe.onload = async () => {
    const exportDoc = iframe.contentDocument!;
    const elementClone = element.cloneNode(true) as HTMLElement;
    const container = document.createElement('div');
    // TODO: Handle disabling animations.
    elementClone.classList.add('skipAnimation');
    container.appendChild(elementClone);
    exportDoc.body.innerHTML = container.innerHTML;
    exportDoc.body.style.margin = '0px';

    await loadStyleSheets(exportDoc, element);

    resolve();
  };

  doc.body.appendChild(iframe);

  const [drawDocument] = await Promise.all([drawDocumentPromise, iframeLoadPromise]);

  try {
    await drawDocument(iframe.contentDocument!, canvas, {
      // Handle retina displays: https://github.com/cburgmer/rasterizeHTML.js/blob/262b3404d1c469ce4a7750a2976dec09b8ae2d6c/examples/retina.html#L71
      zoom: ratio,
    });
  } finally {
    doc.body.removeChild(iframe);
  }

  const blobPromise = new Promise<Blob | null>((res) => {
    resolve = res;
  });
  canvas.toBlob((blob) => resolve(blob), type, quality);

  const blob = await blobPromise;

  if (!blob) {
    throw new Error('Failed to create blob from canvas');
  }

  const url = URL.createObjectURL(blob);

  triggerDownload(url, fileName || document.title);

  URL.revokeObjectURL(url);
}

function triggerDownload(url: string, name: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
}
