import generateUtilityClasses from '@mui/utils/generateUtilityClasses';

export interface ChartExportClasses {
  /** Styles applied to the body of the export document. */
  root: string;
}

export const exportClasses: ChartExportClasses = generateUtilityClasses('MuiChartExport', ['root']);

export function createExportIframe(title?: string): HTMLIFrameElement {
  const iframeEl = document.createElement('iframe');
  iframeEl.style.position = 'absolute';
  iframeEl.style.width = '0px';
  iframeEl.style.height = '0px';
  iframeEl.title = title || document.title;
  return iframeEl;
}
