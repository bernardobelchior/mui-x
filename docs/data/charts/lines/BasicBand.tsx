import Box from '@mui/material/Box';
import {
  BarPlot,
  ChartsAxisHighlight,
  LineChart,
  type XAxis,
  type YAxis,
} from '@mui/x-charts';
import { ChartContainer } from '@mui/x-charts/ChartContainer';
import { ChartsTooltip } from '@mui/x-charts/ChartsTooltip';
import { ChartsXAxis } from '@mui/x-charts/ChartsXAxis';
import { ChartsYAxis } from '@mui/x-charts/ChartsYAxis';
import { LinePlot, MarkPlot } from '@mui/x-charts/LineChart';
import Band from './Band';

export type Value = {
  max: number;
  min: number;
  timestamp: string;
  value: number;
};

const data: Value[] = [
  {
    max: 3,
    min: 1,
    timestamp: '1',
    value: 1,
  },
  {
    max: 5,
    min: 3,
    timestamp: '2',
    value: 3,
  },
  {
    max: 7,
    min: 2,
    timestamp: '3',
    value: 2,
  },
  {
    max: 3,
    min: 1,
    timestamp: '4',
    value: 9,
  },
  {
    max: 6,
    min: 2,
    timestamp: '5',
    value: 1,
  },
  {
    max: 6,
    min: 3,
    timestamp: '6',
    value: 0,
  },
  {
    max: 6,
    min: 4,
    timestamp: '7',
    value: 3,
  },
  {
    max: 3,
    min: 1,
    timestamp: '8',
    value: 7,
  },
  {
    max: 2,
    min: 0,
    timestamp: '9',
    value: 3,
  },
];

const xAxis: XAxis<'band', string> = {
  dataKey: 'timestamp',
  id: 'timestamp',
  position: 'bottom',
  scaleType: 'band',
  // categoryGapRatio: 0,
  // barGapRatio: 0.5
};

const yAxis: YAxis = {
  id: 'measurements',
  label: 'Measurements',
  min: 0,
  position: 'left',
};

export default function Demo() {
  return (
    <Box sx={{ height: 400, width: '100%' }}>
      <LineChart
        dataset={data}
        height={400}
        series={[
          {
            dataKey: 'value',
            id: 'value',
            label: 'Value',
            type: 'bar',
            xAxisId: 'timestamp',
            yAxisId: 'measurements',
          },
          {
            curve: 'step',
            dataKey: 'max',
            id: 'max',
            showMark: true,
            label: 'Max',
            type: 'line',
            xAxisId: 'timestamp',
            yAxisId: 'measurements',
          },
          {
            curve: 'step',
            dataKey: 'min',
            id: 'min',
            showMark: true,
            label: 'Min',
            type: 'line',
            xAxisId: 'timestamp',
            yAxisId: 'measurements',
          },
        ]}
        xAxis={[xAxis]}
        yAxis={[yAxis]}
      />
    </Box>
  );
}
