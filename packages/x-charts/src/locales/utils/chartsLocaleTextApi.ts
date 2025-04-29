export interface ChartsLocaleText {
  /**
   * Title displayed in the overlay if `loading` is `true`.
   */
  loading: string;
  /**
   * Title displayed in the overlay if there is no data to display.
   */
  noData: string;
  /**
   * Tooltip text shown when hovering over the export button.
   */
  export: string;
}

export type ChartsTranslationKeys = keyof ChartsLocaleText;
