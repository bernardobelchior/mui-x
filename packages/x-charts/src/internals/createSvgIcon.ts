import * as React from 'react';
import { createSvgIcon as createSvgIconMaterial } from '@mui/material/utils';
import { IconProps } from '../models/slots/chartsBaseSlots';

export const createSvgIcon = createSvgIconMaterial as (
  path: React.ReactNode,
  displayName?: string,
) => (props: IconProps) => React.ReactNode;
