import * as React from 'react';
import { styled } from '@mui/material/styles';

const ToolbarRoot = styled('div', {
  name: 'MuiChartsToolbar',
  slot: 'Root',
})(({ theme }) => ({
  flex: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'end',
  gap: theme.spacing(0.25),
  padding: theme.spacing(0.75),
  minHeight: 52,
  boxSizing: 'border-box',
  border: `1px solid ${(theme.vars || theme).palette.grey[300]}`,
  borderRadius: 4,
}));

export interface ToolbarProps extends React.PropsWithChildren {}

export function Toolbar({ children }: ToolbarProps) {
  return <ToolbarRoot data-test="hello">{children}</ToolbarRoot>;
}
