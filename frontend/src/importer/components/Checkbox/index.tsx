import type { JSX } from "preact";
import { cn } from "../../../utils/cn";
import { CheckboxProps } from "./types";

export default function Checkbox({ label, className, ...props }: CheckboxProps): JSX.Element {
  return (
    <label className={cn("flex items-center", className)}>
      <input type="checkbox" className="mr-2" {...props} />
      <span>{label}</span>
    </label>
  );
}
