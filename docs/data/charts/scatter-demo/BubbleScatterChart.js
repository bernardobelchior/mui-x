import * as React from 'react';
import { ScatterChart } from '@mui/x-charts/ScatterChart';

const data = [
  {
    country: 'USA',
    gdpPerCapita: 65000,
    lifeExpectancy: 78.9,
    population: 331000000,
    region: 'North America',
  },
  {
    country: 'China',
    gdpPerCapita: 10000,
    lifeExpectancy: 76.7,
    population: 1440000000,
    region: 'Asia',
  },
  {
    country: 'Norway',
    gdpPerCapita: 75000,
    lifeExpectancy: 82.5,
    population: 5400000,
    region: 'Europe',
  },
  {
    country: 'India',
    gdpPerCapita: 2100,
    lifeExpectancy: 69.4,
    population: 1390000000,
    region: 'Asia',
  },
  {
    country: 'Brazil',
    gdpPerCapita: 8700,
    lifeExpectancy: 75.7,
    population: 213000000,
    region: 'South America',
  },
];

const data1 = [
  { x: 100, y: 200, id: 1 },
  { x: 120, y: 100, id: 2 },
  { x: 170, y: 300, id: 3 },
  { x: 140, y: 250, id: 4 },
  { x: 150, y: 400, id: 5 },
  { x: 110, y: 280, id: 6 },
];

const data2 = [
  { x: 300, y: 300, id: 1 },
  { x: 400, y: 500, id: 2 },
  { x: 200, y: 700, id: 3 },
  { x: 340, y: 350, id: 4 },
  { x: 560, y: 500, id: 5 },
  { x: 230, y: 780, id: 6 },
  { x: 500, y: 400, id: 7 },
  { x: 300, y: 500, id: 8 },
  { x: 240, y: 300, id: 9 },
  { x: 320, y: 550, id: 10 },
  { x: 500, y: 400, id: 11 },
  { x: 420, y: 280, id: 12 },
];

export default function MultipleYAxesScatterChart() {
  return (
    <ScatterChart
      height={300}
      series={[
        {
          data: data.map((d) => ({
            x: d.gdpPerCapita,
            y: d.lifeExpectancy,
            id: d.country,
          })),
        },
      ]}
    />
  );
}
