import { Column } from "../../../../types";
import { Dispatch, SetStateAction } from "react";

export type UploaderProps = {
  columns?: Column[];
  skipHeaderRowSelection: boolean;
  onSuccess: (file: File) => void;
  showDownloadTemplateButton?: boolean;
  setDataError: Dispatch<SetStateAction<string | null>>;
};
