#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the bundled CSS file
const cssPath = path.join(__dirname, '../build/bundle.css');
const outputPath = path.join(__dirname, '../src/bundled-styles.ts');

if (fs.existsSync(cssPath)) {
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  
  // Create TypeScript module that exports the CSS as a string
  const tsContent = `// Auto-generated file - DO NOT EDIT
// This file contains all bundled CSS including CSS modules
export const bundledCss = \`${cssContent.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`;
`;
  
  fs.writeFileSync(outputPath, tsContent);
  console.log('✅ CSS bundled successfully to src/bundled-styles.ts');
} else {
  console.error('❌ CSS bundle not found at', cssPath);
  process.exit(1);
}