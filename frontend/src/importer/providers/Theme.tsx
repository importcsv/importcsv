import { useEffect } from "preact/hooks";
import type { JSX } from 'preact';
import { Toaster } from "../components/ui/toaster";
import { ThemeProps } from "./types";
import { applyColorPalette } from "../utils/colorUtils";

export interface ThemeProviderProps extends ThemeProps {
  primaryColor?: string;
}

export default function ThemeProvider({ children, primaryColor }: ThemeProviderProps): JSX.Element {
  useEffect(() => {
    if (primaryColor) {
      applyColorPalette(primaryColor);
    }
  }, [primaryColor]);

  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
