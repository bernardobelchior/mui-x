import type * as React from 'react';

type CommonProps<T = HTMLElement> = React.DOMAttributes<T> & {
  className?: string;
  style?: React.CSSProperties;
  [k: `aria-${string}`]: any;
  [k: `data-${string}`]: any;
};

export type IconProps = CommonProps<SVGSVGElement> & {
  titleAccess?: string;
};

export type TooltipProps = CommonProps & {
  children: React.ReactElement<any, any>;
  enterDelay?: number;
  title: React.ReactNode;
};

interface PopoverVirtualElement {
  getBoundingClientRect: () => DOMRect;
  nodeType: Node['ELEMENT_NODE'];
}
export type MenuProps = CommonProps & {
  anchorEl?:
    | null
    | Element
    | PopoverVirtualElement
    | (() => Element | PopoverVirtualElement | null);
  open: boolean;
  onClose?: (event: {}, reason: 'backdropClick' | 'escapeKeyDown') => void;
};

export type MenuItemProps = CommonProps & {
  children?: React.ReactNode;
};
