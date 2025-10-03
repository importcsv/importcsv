import { JSX, ComponentChildren } from "preact";

export type AsMap = {
  div: JSX.HTMLAttributes<HTMLDivElement>;
  span: JSX.HTMLAttributes<HTMLSpanElement>;
  p: JSX.HTMLAttributes<HTMLParagraphElement>;
};

export type TooltipProps<T extends keyof AsMap = "span"> = {
  as?: T;
  title?: string | ComponentChildren;
  icon?: ComponentChildren;
} & AsMap[T];
