import classes from "../../utils/classes";
import { CheckboxProps } from "./types";

export default function Checkbox({ label, className, ...props }: CheckboxProps) {
  const containerClasses = classes(["flex items-center", className]);

  return (
    <label className={containerClasses}>
      <input type="checkbox" className="mr-2" {...props} />
      <span>{label}</span>
    </label>
  );
}
