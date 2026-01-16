import Box from '@mui/material/Box';
import { Heatmap } from '@mui/x-charts-pro/Heatmap';
import data from '../dataset/nyc-yellow-taxi-2024-trip-count.json';

const dayFormatter = (day) => {
  const date = new Date(2024, 0, 1);

  date.setDate(day);

  return date.toLocaleString('en-US', {
    month: 'narrow',
    day: 'numeric',
  });
};

export default function WebGLHeatmap() {
  return (
    <Box sx={{ width: '100%', maxWidth: 400 }}>
      <Heatmap
        dataset={data}
        xAxis={[{ dataKey: '0', valueFormatter: dayFormatter }]}
        yAxis={[{ dataKey: '1', valueFormatter: (hour) => `${hour}:00` }]}
        series={[
          { dataKey: '2', highlightScope: { highlight: 'item', fade: 'global' } },
        ]}
        height={300}
      />
    </Box>
  );
}
