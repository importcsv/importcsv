import React, { forwardRef, useEffect, useRef, useState } from "react";
import Importer from "../../importer/features/main";
import Providers from "../../importer/providers";
import useThemeStore from "../../importer/stores/theme";
import { darkenColor, isValidColor } from "../../importer/utils/utils";
import { CSVImporterProps } from "../../types";
// Import styles so they are available for the importer. We will transfer
// these styles into the iframe and remove them from the host document to
// prevent leakage (handled by IframeWrapper). The base reset is disabled
// in index.css to avoid global overrides before transfer.
// Ensure styles are bundled for injection into iframe
import "../../index.css";
import "../../importer/style/index.scss";
import "./style/csv-importer.css";

const CSVImporter = forwardRef((importerProps: CSVImporterProps, forwardRef?: any) => {
  // Destructure all known props from CSVImporterProps
  const {
    isModal = true,
    modalIsOpen = true,
    modalOnCloseTriggered = () => null,
    modalCloseOnOutsideClick,
    darkMode = false,
    primaryColor = "#2563eb",
    className,
    onComplete,
    customStyles,
    showDownloadTemplateButton,
    skipHeaderRowSelection,
    language,
    customTranslations,
    importerKey,
    backendUrl,
    user,
    metadata,
    useIframe,
    demoData,
    // Any remaining props will be valid DOM props
    ...domProps
  } = importerProps;
  const ref = forwardRef ?? useRef(null);

  const current = ref?.current as any;

  useEffect(() => {
    if (isModal && current) {
      if (modalIsOpen) current?.showModal?.();
      else current?.close?.();
    }
  }, [isModal, modalIsOpen, current]);
  const baseClass = "CSVImporter";
  const themeClass = darkMode ? `${baseClass}-dark` : `${baseClass}-light`;
  const domElementClass = ["csv-importer", `${baseClass}-${isModal ? "dialog" : "div"}`, themeClass, className].filter((i) => i).join(" ");

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
    if (modalCloseOnOutsideClick && event.target === current) {
      modalOnCloseTriggered();
    }
  };

  current?.addEventListener("cancel", () => {
    modalOnCloseTriggered();
  });

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
    <Providers primaryColor={primaryColor}>
      <Importer
        isModal={isModal}
        modalIsOpen={modalIsOpen}
        modalOnCloseTriggered={modalOnCloseTriggered}
        modalCloseOnOutsideClick={modalCloseOnOutsideClick}
        darkMode={darkMode}
        primaryColor={primaryColor}
        className={className}
        onComplete={onComplete}
        customStyles={customStyles}
        showDownloadTemplateButton={showDownloadTemplateButton}
        skipHeaderRowSelection={skipHeaderRowSelection}
        language={language}
        customTranslations={customTranslations}
        importerKey={importerKey}
        backendUrl={backendUrl}
        user={user}
        metadata={metadata}
        useIframe={useIframe}
        demoData={demoData}
      />
    </Providers>
  );

  return isModal ? (
    <div className="csvImporter">
      <dialog {...elementProps}>
        <ImporterComponent />
      </dialog>
    </div>
  ) : (
    <div {...elementProps}>
      <ImporterComponent />
    </div>
  );
});

export default CSVImporter;
