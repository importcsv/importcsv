import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import prefixSelector from 'postcss-prefix-selector';

export default {
  plugins: [
    tailwindcss,
    prefixSelector({
      prefix: '.importcsv',
      // Don't add prefix to already prefixed selectors and Modal selectors (rendered via Portal)
      exclude: [
        '.importcsv',
        /^\.importcsv/,
        // Exclude Modal-related CSS since it's rendered outside the component via Portal
        /^\.csv-importer-modal/,
        /^@keyframes csv-importer/
      ],
      // Transform all selectors including global ones
      transform: function (prefix, selector, prefixedSelector, filepath, rule) {
        // Special handling for global selectors
        if (selector === '*' || selector === '::before' || selector === '::after') {
          return `.importcsv ${selector}`;
        }
        
        // Special handling for multiple global selectors
        if (selector.match(/^\*,|^::before,|^::after,/)) {
          return `.importcsv ${selector}`;
        }
        
        // Handle html and body selectors
        if (selector === 'html' || selector === 'body') {
          return `.importcsv`;
        }
        
        // Handle selectors that include html or body
        if (selector.includes('html') || selector.includes('body')) {
          return selector.replace(/html|body/g, '.importcsv');
        }
        
        // Handle :root selector
        if (selector === ':root') {
          return '.importcsv';
        }
        
        // Handle ::backdrop
        if (selector === '::backdrop') {
          return `.importcsv ${selector}`;
        }
        
        // Default transformation
        return prefixedSelector;
      }
    }),
    autoprefixer,
  ],
};