import { Toolbar } from '@mui/x-charts/Toolbar';
import * as React from 'react';
import { ChartsToolbarExportButton } from './ChartsToolbarExportButton';

export function ChartsToolbarPro() {
  return (
    <Toolbar>
      <ChartsToolbarExportButton />
    </Toolbar>
  );
}
