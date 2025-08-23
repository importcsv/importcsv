import { Column } from "../../../../types";
import { Dispatch, SetStateAction } from 'preact/hooks';

export type UploaderProps = {
  columns?: Column[];
  skipHeaderRowSelection: boolean;
  onSuccess: (file: File) => void;
  showDownloadTemplateButton?: boolean;
  setDataError: Dispatch<SetStateAction<string | null>>;
};
