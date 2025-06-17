import * as React from 'react';
import { LineChartPro } from '@mui/x-charts-pro/LineChartPro';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { exportClasses } from '@mui/x-charts-pro/models';
import { lineElementClasses } from '@mui/x-charts/LineChart';
import { legendClasses } from '@mui/x-charts/ChartsLegend';
import { inflationData } from '../dataset/inflationRates';

const yAxisFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
  maximumSignificantDigits: 1,
});
const percentageFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const seriesValueFormatter = (value) => percentageFormatter.format(value / 100);

const xAxis = [
  {
    data: inflationData.map((p) => p.year),
    valueFormatter: (value) => `${value}`,
    zoom: true,
  },
];

const yAxis = [{ valueFormatter: (value) => yAxisFormatter.format(value / 100) }];

const settings = {
  height: 300,
  xAxis,
  yAxis,
  series: [
    {
      id: 'germany',
      label: 'Germany',
      data: inflationData.map((p) => p.rateDE),
      valueFormatter: seriesValueFormatter,
      showMark: false,
    },
    {
      id: 'uk',
      label: 'United Kingdom',
      data: inflationData.map((p) => p.rateUK),
      valueFormatter: seriesValueFormatter,
      showMark: false,
    },
    {
      id: 'france',
      label: 'France',
      data: inflationData.map((p) => p.rateFR),
      valueFormatter: seriesValueFormatter,
      showMark: false,
    },
  ],
  grid: { horizontal: true },
  showToolbar: true,
};

export default function ExportRemoveElements() {
  const [series, setSeries] = React.useState({
    germany: true,
    france: true,
    uk: true,
  });
  const enabledSeries = Object.entries(series)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  const handleChange = (event) => {
    setSeries((prev) => ({
      ...prev,
      [event.target.name]: event.target.checked,
    }));
  };

  return (
    <Stack width="100%">
      <FormControl fullWidth sx={{ alignItems: 'center', mb: 1 }}>
        <FormLabel>Series to export</FormLabel>
        <FormGroup row>
          <FormControlLabel
            label="Germany"
            control={
              <Checkbox
                name="germany"
                checked={series.germany}
                onChange={handleChange}
              />
            }
          />
          <FormControlLabel
            label="United Kingdom"
            control={
              <Checkbox name="uk" checked={series.uk} onChange={handleChange} />
            }
          />
          <FormControlLabel
            label="France"
            control={
              <Checkbox
                name="france"
                checked={series.france}
                onChange={handleChange}
              />
            }
          />
        </FormGroup>
      </FormControl>
      <LineChartPro
        {...settings}
        sx={{
          [`&.${exportClasses.root}`]: {
            ...enabledSeries.reduce(
              (acc, seriesId) => ({
                ...acc,
                [`.${lineElementClasses.root}[data-series="${seriesId}"], .${legendClasses.series}[data-series="${seriesId}"]`]:
                  {
                    display: 'none',
                  },
              }),
              {},
            ),
          },
        }}
      />
      <Typography variant="caption">Source: World Bank</Typography>
    </Stack>
  );
}
