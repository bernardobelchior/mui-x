import { CandlestickChart } from '@mui/x-charts-premium/CandlestickChart';
import { OHLCValueType } from '@mui/x-charts-premium/models';
import sp500 from '../dataset/sp500-intraday.json';

const xData = sp500.map((entry) => new Date(Date.parse(entry.date)));

const data: Array<OHLCValueType> = sp500.map((entry) => [
  entry.open,
  entry.high,
  entry.low,
  entry.close,
]);

export default function BasicCandlestick() {
  return (
    <CandlestickChart
      xAxis={[{ id: 'x', data: xData, zoom: { minSpan: 1, filterMode: 'discard' } }]}
      series={[
        {
          data,
          label: 'S&P500',
          valueFormatter: (v) => [
            { label: 'Open', value: v[0].toFixed(2) },
            { label: 'High', value: v[1].toFixed(2) },
            { label: 'Low', value: v[2].toFixed(2) },
            { label: 'Close', value: v[3].toFixed(2) },
          ],
        },
      ]}
      height={400}
      tooltipAxis={[{ axisId: 'x', dataIndex: 0 }]}
    />
  );
}
