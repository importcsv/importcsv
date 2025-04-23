import { Resource } from "i18next";

type ModalParams = {
  isModal?: boolean;
  modalIsOpen?: boolean;
  modalOnCloseTriggered?: () => void;
  modalCloseOnOutsideClick?: boolean;
};

export type CSVImporterProps = {
  darkMode?: boolean;
  primaryColor?: string;
  className?: string; // Keep className as it's often used for styling wrappers
  onComplete?: (data: any) => void;
  waitOnComplete?: boolean;
  customStyles?: Record<string, string> | string;
  showDownloadTemplateButton?: boolean;
  skipHeaderRowSelection?: boolean;
  language?: string;
  customTranslations?: Resource;
  importerId?: string; // ID of the importer from the admin/backend
  backendUrl?: string; // URL of the backend API
  // You might want to explicitly allow specific data-* attributes if needed
  // 'data-testid'?: string; 
} & ModalParams;
