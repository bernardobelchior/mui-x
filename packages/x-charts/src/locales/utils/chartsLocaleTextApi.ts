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
  /**
   * Text displayed in a menu item with the print action.
   */
  print: string;
  /**
   * Text displayed in a menu item with the export as image action.
   */
  exportAsImage: string;
}

export type ChartsTranslationKeys = keyof ChartsLocaleText;
