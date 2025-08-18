// Export library CSS as a string so consumers (our iframe) can inject it safely.
// This includes all styles: Tailwind CSS, SCSS themes, and CSS modules
import { bundledCss } from './bundled-styles';

// Export the complete bundled CSS that includes:
// - Tailwind utility classes
// - Theme styles (light/dark)
// - CSS module styles for all components
export const importcsvStyles: string = bundledCss;


