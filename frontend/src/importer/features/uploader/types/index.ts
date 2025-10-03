import { Column } from "../../../../types";
import { StateUpdater } from 'preact/hooks';

export type UploaderProps = {
  columns?: Column[];
  skipHeaderRowSelection: boolean;
  onSuccess: (file: File) => void;
  showDownloadTemplateButton?: boolean;
  setDataError: StateUpdater<string | null>;
};
