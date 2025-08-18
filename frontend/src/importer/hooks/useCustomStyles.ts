import { useEffect, useRef } from "react";

export default function useCustomStyles(customStyles?: string, targetElement?: HTMLElement | null) {
  useEffect(() => {
    if (customStyles && targetElement) {
      const parsedStyles = JSON.parse(customStyles);
      if (parsedStyles) {
        Object.keys(parsedStyles).forEach((key) => {
          const value = parsedStyles?.[key as any];
          targetElement.style.setProperty("--" + key, value);
        });
      }
    }
  }, [customStyles, targetElement]);
}
