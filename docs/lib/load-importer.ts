/**
 * Dynamically load CSVImporter based on environment
 * - Development: Load from local source files
 * - Production: Load from npm package
 */
export async function loadCSVImporter() {
  const source = process.env.NEXT_PUBLIC_IMPORTER_SOURCE || 'npm';
  
  console.log(`Loading CSVImporter from: ${source}`);
  
  // Always use npm package for now since dynamic imports of local files
  // are complex with Next.js bundling
  return import('@importcsv/react');
}

/**
 * Load types for TypeScript
 */
export type { Column, Validator, Transformer } from '@importcsv/react';