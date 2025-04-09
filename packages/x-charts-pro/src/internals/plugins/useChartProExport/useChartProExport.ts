import { ChartPlugin } from '@mui/x-charts/internals';
import { printChart } from './print';
import { ChartPrintExportOptions, UseChartProExportSignature } from './useChartProExport.types';

export const useChartProExport: ChartPlugin<UseChartProExportSignature> = ({ chartRootRef }) => {
  const print = (options?: ChartPrintExportOptions) => {
    const chartRoot = chartRootRef.current;

    if (chartRoot) {
      printChart(chartRoot, options);
    }
  };

  return {
    publicAPI: {
      print,
    },
    instance: {
      print,
    },
  };
};

useChartProExport.params = {};

useChartProExport.getDefaultizedParams = ({ params }) => ({ ...params });

useChartProExport.getInitialState = () => ({ export: {} });
