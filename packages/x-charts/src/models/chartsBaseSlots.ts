type CommonProps<T = HTMLElement> = React.DOMAttributes<T> & {
  className?: string;
  style?: React.CSSProperties;
  [k: `aria-${string}`]: any;
  [k: `data-${string}`]: any;
};

export type IconProps = CommonProps<SVGSVGElement> & {
  titleAccess?: string;
};

export interface ChartsBaseSlots {}
