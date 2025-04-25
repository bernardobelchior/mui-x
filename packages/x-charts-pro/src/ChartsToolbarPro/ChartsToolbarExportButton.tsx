'use client';

import * as React from 'react';
import { createSvgIcon } from '@mui/x-data-grid/material/icons/createSvgIcon';
import { ToolbarButton } from '@mui/x-charts/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import { useChartContext } from '@mui/x-charts/context/ChartProvider';
import { useIsHydrated } from '@mui/x-charts/hooks/useIsHydrated';
import { UseChartProExportSignature } from '../internals/plugins/useChartProExport';

export const GridDownloadIcon = createSvgIcon(
  <path d="M5 20h14v-2H5zM19 9h-4V3H9v6H5l7 7z" />,
  'Download',
);

export function ChartsToolbarExportButton() {
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const handleClose = () => setMenuOpen(false);
  const { publicAPI } = useChartContext<[UseChartProExportSignature]>();
  const isHydrated = useIsHydrated();

  return (
    <React.Fragment>
      <Tooltip title="Export">
        <ToolbarButton ref={buttonRef} onClick={() => setMenuOpen(true)}>
          <GridDownloadIcon />
        </ToolbarButton>
      </Tooltip>
      {isHydrated && (
        <Menu anchorEl={() => buttonRef.current} open={menuOpen} onClose={handleClose}>
          <MenuItem
            onClick={() => {
              publicAPI.exportAsPrint();
              handleClose();
            }}
          >
            Print
          </MenuItem>
          <MenuItem
            onClick={() => {
              publicAPI.exportAsImage();
              handleClose();
            }}
          >
            Export as Image
          </MenuItem>
        </Menu>
      )}
    </React.Fragment>
  );
}
