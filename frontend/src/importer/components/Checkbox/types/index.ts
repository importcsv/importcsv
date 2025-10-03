import { JSX, VNode } from "preact";

export type CheckboxProps = Omit<JSX.HTMLAttributes<HTMLInputElement>, 'label'> & {
  label?: string | VNode;
  name?: string;
  checked?: boolean;
  disabled?: boolean;
  onChange?: (e: JSX.TargetedEvent<HTMLInputElement, Event>) => void;
};
