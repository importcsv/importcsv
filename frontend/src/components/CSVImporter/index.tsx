import { forwardRef } from 'preact/compat';
import { useRef, useEffect } from 'preact/hooks';
import Importer from "../../importer/features/main";
import Providers from "../../importer/providers";
import useThemeStore from "../../importer/stores/theme";
import { darkenColor, isValidColor } from "../../importer/utils/colorUtils";
import { CSVImporterProps } from "../../types";
// Import styles - with proper scoping under .importcsv, these won't leak
import "../../index.css";
import "./style/csv-importer.css";
import "./style/dark-mode.css";

const CSVImporter = forwardRef((importerProps: CSVImporterProps, forwardRef?: any) => {
  
  // Destructure all known props from CSVImporterProps
  const {
    isModal = true,
    modalIsOpen = true,
    modalOnCloseTriggered = () => null,
    modalCloseOnOutsideClick,
    theme,
    darkMode = false,
    primaryColor = "#2563eb",
    className,
    classNames,
    onComplete,
    customStyles,
    showDownloadTemplateButton,
    skipHeaderRowSelection,
    invalidRowHandling,
    includeUnmatchedColumns,
    language,
    customTranslations,
    importerKey,
    backendUrl,
    user,
    metadata,
    demoData,
    columns,
    // Any remaining props will be valid DOM props
    ...domProps
  } = importerProps;
  const ref = forwardRef ?? useRef(null);

  useEffect(() => {
    const current = ref?.current as any;
    if (isModal && current) {
      if (modalIsOpen) current?.showModal?.();
      else current?.close?.();
    }
  }, [isModal, modalIsOpen, ref]);
  const baseClass = "CSVImporter";
  const themeClass = darkMode ? `${baseClass}-dark` : `${baseClass}-light`;
  // Add importcsv class for proper CSS scoping
  const domElementClass = ["importcsv", "csv-importer", `${baseClass}-${isModal ? "dialog" : "div"}`, themeClass, className, classNames?.root].filter((i) => i).join(" ");

  // Set Light/Dark mode
  const setTheme = useThemeStore((state) => state.setTheme);

  useEffect(() => {
    const theme = darkMode ? "dark" : "light";
    setTheme(theme);
  }, [darkMode]);

  // Apply primary color to component root
  // These variables are needed for components like Stepper that rely on CSS variables
  useEffect(() => {
    if (primaryColor && isValidColor(primaryColor) && ref?.current) {
      // Apply styles to the component's root element
      const componentRoot = ref.current as HTMLElement;
      if (componentRoot) {
        componentRoot.style.setProperty("--color-primary", primaryColor);
        componentRoot.style.setProperty("--color-primary-hover", darkenColor(primaryColor, 20));
      }
    }
  }, [primaryColor, ref]);

  const backdropClick = (event: { target: any }) => {
    if (modalCloseOnOutsideClick && event.target === ref?.current) {
      modalOnCloseTriggered();
    }
  };

  useEffect(() => {
    const current = ref?.current as any;
    if (current && isModal) {
      const handleCancel = () => {
        modalOnCloseTriggered();
      };
      current.addEventListener("cancel", handleCancel);
      return () => {
        current.removeEventListener("cancel", handleCancel);
      };
    }
  }, [isModal, modalOnCloseTriggered, ref]);

  // Since we've already destructured all known props above,
  // domProps should only contain valid DOM attributes
  const elementProps = {
    ref,
    ...(isModal ? { onClick: backdropClick } : {}),
    className: domElementClass,
    "data-theme": darkMode ? "dark" : "light",
    style: { colorScheme: darkMode ? "dark" : "light" },
    ...domProps, // Only contains standard DOM props now
  };

  // Create a new component that properly passes only the props that Importer needs
  const ImporterComponent = () => (
    <Providers 
      theme={darkMode ? 'dark' : theme}
      primaryColor={primaryColor}
      customStyles={customStyles}
      targetElement={ref?.current}
    >
      <Importer
        isModal={isModal}
        modalIsOpen={modalIsOpen}
        modalOnCloseTriggered={modalOnCloseTriggered}
        modalCloseOnOutsideClick={modalCloseOnOutsideClick}
        darkMode={darkMode}
        primaryColor={primaryColor}
        className={classNames?.content || className}
        onComplete={onComplete}
        customStyles={customStyles}
        showDownloadTemplateButton={showDownloadTemplateButton}
        skipHeaderRowSelection={skipHeaderRowSelection}
        invalidRowHandling={invalidRowHandling}
        includeUnmatchedColumns={includeUnmatchedColumns}
        language={language}
        customTranslations={customTranslations}
        importerKey={importerKey}
        backendUrl={backendUrl}
        user={user}
        metadata={metadata}
        demoData={demoData}
        columns={columns}
      />
    </Providers>
  );

  return isModal ? (
    <dialog {...elementProps}>
      <ImporterComponent />
    </dialog>
  ) : (
    <div {...elementProps}>
      <ImporterComponent />
    </div>
  );
});

export default CSVImporter;
