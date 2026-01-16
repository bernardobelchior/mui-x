import { interpolateOrRd } from 'd3-scale-chromatic';
import {
  HeatmapPremium,
  HeatmapPremiumProps,
} from '@mui/x-charts-premium/HeatmapPremium';
import data from '../dataset/nyc-yellow-taxi-2024-trip-count.json';

const seriesData = data as [number, number, number][];
const max = Math.max(...seriesData.map(([, , value]) => value));
const xData = Array.from({ length: 366 }, (_, i) => {
  const date = new Date(2024, 0, 1);

  date.setDate(i + 1);

  return date;
});
const yData = Array.from({ length: 24 }, (_, i) => i);

const settings: HeatmapPremiumProps = {
  xAxis: [
    {
      data: xData,
      ordinalTimeTicks: ['months', 'biweekly', 'weeks', 'days'],
      zoom: true,
    },
  ],
  yAxis: [{ data: yData, valueFormatter: (hour: number) => `${hour}:00` }],
  zAxis: [
    {
      min: 0,
      max,
      colorMap: {
        type: 'continuous',
        color: interpolateOrRd,
      },
    },
  ],
  series: [{ data: seriesData }],
  height: 400,
};

export default function WebGLHeatmap() {
  return <HeatmapPremium renderer="webgl" {...settings} />;
}
