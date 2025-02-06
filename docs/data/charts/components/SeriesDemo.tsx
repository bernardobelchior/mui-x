import * as React from 'react';
import { ChartsXAxis } from '@mui/x-charts/ChartsXAxis';
import { ChartsYAxis } from '@mui/x-charts/ChartsYAxis';
import { LinePlot } from '@mui/x-charts/LineChart';
import { useLineSeries, useXAxis, useXScale, useYScale } from '@mui/x-charts/hooks';
import { ChartsSurface } from '@mui/x-charts/ChartsSurface';
import { ChartDataProvider } from '@mui/x-charts/ChartDataProvider';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { DefaultizedLineSeriesType } from '@mui/x-charts/models';

function ExtremaLabels() {
  const lineSeries = useLineSeries();

  if (!lineSeries) {
    return null;
  }

  return (
    <React.Fragment>
      {lineSeries.seriesOrder.map((seriesId) => (
        <SingleSeriesExtremaLabels series={lineSeries.series[seriesId]} />
      ))}
    </React.Fragment>
  );
}

function SingleSeriesExtremaLabels({
  series,
}: {
  series: DefaultizedLineSeriesType;
}) {
  const xAxis = useXAxis('x');

  const min = series.data.reduce(
    (acc, value) => Math.min(acc ?? Infinity, value ?? Infinity),
    Infinity,
  );
  const max = series.data.reduce(
    (acc, value) => Math.max(acc ?? -Infinity, value ?? -Infinity),
    -Infinity,
  );

  return (
    <React.Fragment>
      {series.data.map((y, index) => {
        const x = xAxis.data?.[index];

        if (x == null || y == null) {
          return null;
        }

        if (y !== min && y !== max) {
          return null;
        }

        return (
          <PointLabel
            x={x}
            y={y}
            placement={y === min ? 'below' : 'above'}
            color={series.color}
          />
        );
      })}
    </React.Fragment>
  );
}

function PointLabel({
  x,
  y,
  placement,
  color,
}: {
  x: number;
  y: number;
  placement: 'above' | 'below';
  color: string;
}) {
  const xAxisScale = useXScale();
  const yAxisScale = useYScale();

  const left = xAxisScale(x) ?? 0;
  const top = (yAxisScale(y) ?? 0) + (placement === 'below' ? 20 : -20);

  return (
    <Box
      sx={{
        position: 'absolute',
        left,
        top,
        translate: '-50% -50%',
        background: color,
        borderRadius: 1,
        px: 1,
      }}
    >
      <Typography variant="caption" sx={{ mixBlendMode: 'difference' }}>
        {y}
      </Typography>
    </Box>
  );
}

export default function SeriesDemo() {
  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <ChartDataProvider
        xAxis={[{ id: 'x', data: [1, 2, 3, 5, 8, 10] }]}
        series={[
          { id: 'a', type: 'line', data: [4, 6, 4, 9, 3, 5] },
          { id: 'b', type: 'line', data: [3, 9, 8, 2, 4, 9] },
        ]}
        yAxis={[{ min: 0, max: 10 }]}
        height={300}
      >
        <ChartsSurface>
          <LinePlot />
          <ChartsXAxis />
          <ChartsYAxis />
        </ChartsSurface>
        <ExtremaLabels />
      </ChartDataProvider>
    </Box>
  );
}
