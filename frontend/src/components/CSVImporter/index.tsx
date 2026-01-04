import { forwardRef, JSX } from 'preact/compat';
import { useRef, useEffect, useState, useMemo } from 'preact/hooks';
import Importer from "../../importer/features/main";
import Providers from "../../importer/providers";
import useThemeStore from "../../importer/stores/theme";
import { darkenColor, isValidColor } from "../../importer/utils/colorUtils";
import { CSVImporterProps } from "../../types";
import Modal from "../Modal";
import { zodSchemaToColumns } from "../../headless/utils/zodSchemaToColumns";
// Import styles - with proper scoping under .importcsv, these won't leak
import "../../index.css";
import "./style/csv-importer.css";
import "./style/dark-mode.css";
import "../Modal/style.css";

const CSVImporter = forwardRef(<TSchema = any,>(importerProps: CSVImporterProps<TSchema>, forwardRef?: any) => {
  
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
    schema,
    columns: propColumns,
    // Any remaining props will be valid DOM props
    ...domProps
  } = importerProps;
  const ref = forwardRef ?? useRef(null);
  // Control modal state internally if needed
  const [internalModalOpen, setInternalModalOpen] = useState(modalIsOpen);

  // Convert schema to columns internally
  const derivedColumns = useMemo(() => {
    if (schema) {
      // Deprecation warning if both provided
      if (propColumns) {
        console.warn(
          'ImportCSV: Both `schema` and `columns` props provided. Using `schema`. ' +
          'The `columns` prop is deprecated and will be removed in v2.0.'
        );
      }
      const columns = zodSchemaToColumns(schema);
      if (columns.length === 0) {
        console.error(
          'ImportCSV: Failed to extract columns from schema. ' +
          'Ensure schema is z.object({...}) and you have a single Zod version installed.'
        );
      }
      return columns;
    }

    // Deprecation warning for columns-only usage
    if (propColumns) {
      console.warn(
        'ImportCSV: The `columns` prop is deprecated. Use `schema` prop with Zod schemas instead. ' +
        'See migration guide: https://docs.importcsv.com/guides/zod-schemas'
      );
    }

    return propColumns;
  }, [schema, propColumns]);

  // Sync internal state with prop
  useEffect(() => {
    setInternalModalOpen(modalIsOpen);
  }, [modalIsOpen]);

  const baseClass = "CSVImporter";
  const themeClass = darkMode ? `${baseClass}-dark` : `${baseClass}-light`;
  // Add importcsv class for proper CSS scoping
  const domElementClass = ["importcsv", "csv-importer", `${baseClass}-${isModal ? "modal" : "div"}`, themeClass, className, classNames?.root].filter((i) => i).join(" ");

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

  // Handle modal close
  const handleModalClose = () => {
    setInternalModalOpen(false);
    modalOnCloseTriggered();
  };

  // Since we've already destructured all known props above,
  // domProps should only contain valid DOM attributes
  const elementProps = {
    ref,
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
        columns={derivedColumns}
        schema={schema}
      />
    </Providers>
  );

  return isModal ? (
    <Modal
      isOpen={internalModalOpen}
      onClose={handleModalClose}
      closeOnOutsideClick={modalCloseOnOutsideClick}
      className={domElementClass}
      contentClassName="csv-importer-modal-container"
      dataTheme={darkMode ? 'dark' : 'light'}
    >
      <div {...elementProps}>
        <ImporterComponent />
      </div>
    </Modal>
  ) : (
    <div {...elementProps}>
      <ImporterComponent />
    </div>
  );
}) as <TSchema = any>(
  props: CSVImporterProps<TSchema> & { ref?: any }
) => JSX.Element;

export default CSVImporter;
