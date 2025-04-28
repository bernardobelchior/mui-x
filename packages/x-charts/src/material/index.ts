import { ChartsBaseSlots } from '../models/chartsBaseSlots';
import { ChartsIconSlots } from '../models/chartsIconSlots';
import { ChartsDownloadIcon } from './icons';

const iconSlots: ChartsIconSlots = {
  exportIcon: ChartsDownloadIcon,
};

const materialSlots: ChartsBaseSlots & ChartsIconSlots = iconSlots;

export default materialSlots;
