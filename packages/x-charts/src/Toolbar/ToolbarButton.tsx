import { IconButton } from '@mui/material';
import { createSvgIcon } from '@mui/x-data-grid/material/icons/createSvgIcon';
import * as React from 'react';

export const GridDownloadIcon = createSvgIcon(
  <path d="M5 20h14v-2H5zM19 9h-4V3H9v6H5l7 7z" />,
  'Download',
);

export function ToolbarButton() {
  return (
    <IconButton>
      <GridDownloadIcon />
    </IconButton>
  );
}
