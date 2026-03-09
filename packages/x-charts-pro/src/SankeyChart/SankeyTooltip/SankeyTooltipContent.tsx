'use client';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import {
  ChartsTooltipPaper,
  ChartsTooltipTable,
  ChartsTooltipRow,
  ChartsTooltipCell,
  useItemTooltip,
} from '@mui/x-charts/ChartsTooltip';
import { ChartsLabelMark } from '@mui/x-charts/internals';
import * as React from 'react';
import { type SankeyTooltipProps } from './SankeyTooltip.types';
import { useUtilityClasses } from './SankeyTooltip.classes';

export interface SankeyTooltipContentProps extends Pick<SankeyTooltipProps, 'classes'> {}

export function SankeyTooltipContent(props: SankeyTooltipContentProps) {
  const classes = useUtilityClasses(props);

  const tooltipData = useItemTooltip<'sankey'>();

  if (!tooltipData) {
    return null;
  }

  const { color, formattedValue, markType } = tooltipData;

  const valueArray = Array.isArray(formattedValue)
    ? formattedValue
    : [formattedValue].filter((v) => v != null);

  return (
    <ChartsTooltipPaper className={classes.paper}>
      <ChartsTooltipTable className={classes.table}>
        <tbody>
          {valueArray.map((value, index) => {
            const label = typeof value === 'object' ? value.label : tooltipData.label;
            const cellValue = typeof value === 'object' ? value.value : value;

            return (
              <ChartsTooltipRow key={index} className={classes.row}>
                <ChartsTooltipCell className={clsx(classes.labelCell, classes.cell)} component="th">
                  <div className={classes.markContainer}>
                    {index === 0 && (
                      <ChartsLabelMark type={markType} color={color} className={classes.mark} />
                    )}
                  </div>
                  {label}
                </ChartsTooltipCell>
                <ChartsTooltipCell className={clsx(classes.valueCell, classes.cell)} component="td">
                  {cellValue}
                </ChartsTooltipCell>
              </ChartsTooltipRow>
            );
          })}
        </tbody>
      </ChartsTooltipTable>
    </ChartsTooltipPaper>
  );
}

SankeyTooltipContent.propTypes = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // | To update them edit the TypeScript types and run "pnpm proptypes"  |
  // ----------------------------------------------------------------------
  /**
   * Override or extend the styles applied to the component.
   */
  classes: PropTypes.object,
} as any;
