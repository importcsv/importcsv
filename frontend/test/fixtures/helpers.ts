// test/fixtures/helpers.ts
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Loads a CSV fixture file and parses it into rows
 */
export function loadCSVFixture(filename: string): { headers: string[]; rows: Record<string, any>[] } {
  const filepath = join(__dirname, 'csv', filename);
  const content = readFileSync(filepath, 'utf-8');
  const lines = content.trim().split('\n');

  const headers = lines[0].split(',');
  const rows = lines.slice(1).map(line => {
    const values = line.split(',');
    const row: Record<string, any> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  });

  return { headers, rows };
}

/**
 * Sample data generators for common use cases
 */
export const fixtures = {
  valid: () => loadCSVFixture('valid.csv'),
  malformed: () => loadCSVFixture('malformed.csv'),
  empty: () => loadCSVFixture('empty.csv'),
  large: () => loadCSVFixture('large.csv'),
};
