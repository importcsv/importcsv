import { JSX, VNode } from "preact";

export type inputTypes =
  | "date"
  | "datetime-local"
  | "email"
  | "file"
  | "month"
  | "number"
  | "password"
  | "search"
  | "tel"
  | "text"
  | "time"
  | "url"
  | "week";

export type InputVariants = "fluid" | "small";
export type InputOption = JSX.HTMLAttributes<HTMLButtonElement> & {
  required?: boolean;
  value?: string;
};

export type InputProps = Omit<JSX.HTMLAttributes<HTMLInputElement>, 'label'> &
  Omit<JSX.HTMLAttributes<HTMLSelectElement>, 'label'> &
  Omit<JSX.HTMLAttributes<HTMLTextAreaElement>, 'label'> & {
    as?: "input" | "textarea";
    label?: string | VNode;
    icon?: VNode;
    iconAfter?: VNode;
    error?: string;
    options?: { [key: string]: InputOption };
    variants?: InputVariants[];
    type?: inputTypes;
    name?: string;
    disabled?: boolean;
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
  };
