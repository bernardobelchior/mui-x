import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { ChartsBaseSlots } from '../models/slots/chartsBaseSlots';
import { ChartsIconSlots } from '../models/slots/chartsIconSlots';
import { ChartsDownloadIcon } from './icons';

const baseSlots: ChartsBaseSlots = {
  baseTooltip: Tooltip,
  baseMenu: Menu,
  baseMenuItem: MenuItem,
};

const iconSlots: ChartsIconSlots = {
  exportIcon: ChartsDownloadIcon,
};

export type ChartsSlots = ChartsBaseSlots & ChartsIconSlots;

const materialSlots: ChartsSlots = { ...baseSlots, ...iconSlots };

export default materialSlots;
