import { ProvidersProps } from "./types";
import ThemeContextProvider, { ThemeProviderProps } from "./Theme";

export interface ProvidersWithThemeProps extends ProvidersProps, ThemeProviderProps {}

export default function Providers({ children, theme, primaryColor, customStyles, targetElement }: ProvidersWithThemeProps) {
  return (
    <ThemeContextProvider 
      theme={theme}
      primaryColor={primaryColor}
      customStyles={customStyles}
      targetElement={targetElement}
    >
      {children}
    </ThemeContextProvider>
  );
}
