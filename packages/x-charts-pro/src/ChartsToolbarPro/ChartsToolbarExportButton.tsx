'use client';

import * as React from 'react';
import { ToolbarButton } from '@mui/x-charts/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import Menu from '@mui/material/Menu';
import { useChartContext } from '@mui/x-charts/context/ChartProvider';
import { useIsHydrated } from '@mui/x-charts/hooks/useIsHydrated';
import materialSlots from '@mui/x-charts/material';
import { ChartsIconSlots } from '@mui/x-charts/models/chartsIconSlots';
import { UseChartProExportSignature } from '../internals/plugins/useChartProExport';

type ChartsToolbarExportButtonSlots = Partial<Pick<ChartsIconSlots, 'exportIcon'>>;

type ChartsToolbarExportButtonSlotProp = Partial<
  Record<
    keyof ChartsToolbarExportButtonSlots,
    React.ComponentProps<
      NonNullable<ChartsToolbarExportButtonSlots[keyof ChartsToolbarExportButtonSlots]>
    >
  >
>;

interface ChartsToolbarExportButtonProps {
  slots?: ChartsToolbarExportButtonSlots;
  slotProps?: ChartsToolbarExportButtonSlotProp;
}

export function ChartsToolbarExportButton({ slots, slotProps }: ChartsToolbarExportButtonProps) {
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const handleClose = () => setMenuOpen(false);
  const { publicAPI } = useChartContext<[UseChartProExportSignature]>();
  const isHydrated = useIsHydrated();
  const ExportIcon = slots?.exportIcon ?? materialSlots.exportIcon;

  return (
    <React.Fragment>
      <Tooltip title="Export">
        <ToolbarButton ref={buttonRef} onClick={() => setMenuOpen(true)}>
          <ExportIcon {...slotProps?.exportIcon} />
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
