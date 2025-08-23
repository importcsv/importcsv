import { InputHTMLAttributes, ReactElement } from "preact/hooks";

export type CheckboxProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string | ReactElement;
};
