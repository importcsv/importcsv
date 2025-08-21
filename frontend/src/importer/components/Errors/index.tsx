import { sizes } from "../../settings/theme";
import classes from "../../utils/classes";
import style from "./style/Errors.module.scss";
import { Info } from "lucide-react";

export default function Errors({ error, centered = false }: { error?: unknown; centered?: boolean }) {
  return error ? (
    <div className={classes([style.errors, centered ? style.centered : undefined])}>
      <p>
        <Info size={sizes.icon.small} />
        {error.toString()}
      </p>
    </div>
  ) : null;
}
