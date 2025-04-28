import * as React from 'react';
import { IconProps } from './chartsBaseSlotProps';

export interface ChartsIconSlots {
  /**
   * Icon displayed on the toolbar's export button.
   * @default ChartsDownloadIcon
   */
  exportIcon: React.ComponentType<IconProps>;
}
