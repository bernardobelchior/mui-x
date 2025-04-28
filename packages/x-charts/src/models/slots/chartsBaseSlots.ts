import type * as React from 'react';
import { MenuProps, MenuItemProps, TooltipProps } from './chartsBaseSlotProps';

export interface ChartsBaseSlots {
  baseTooltip: React.ComponentType<TooltipProps>;
  baseMenu: React.ComponentType<MenuProps>;
  baseMenuItem: React.ComponentType<MenuItemProps>;
}
