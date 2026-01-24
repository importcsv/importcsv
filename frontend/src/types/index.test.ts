import { describe, it, expect } from 'vitest';
import type { CSVImporterProps, Column, ImportResult } from './index';

describe('CSVImporterProps types', () => {
  it('accepts dynamicColumns prop', () => {
    const props: CSVImporterProps = {
      columns: [{ id: 'name', label: 'Name' }],
      dynamicColumns: [{ id: 'custom1', label: 'Custom Field' }],
    };
    expect(props.dynamicColumns).toHaveLength(1);
  });

  it('ImportResult includes column metadata', () => {
    const result: ImportResult<{ name: string }> = {
      rows: [{ name: 'test', _custom_fields: { custom1: 'value' } }],
      columns: {
        predefined: [{ id: 'name', label: 'Name' }],
        dynamic: [{ id: 'custom1', label: 'Custom Field' }],
        unmatched: ['unmapped_col'],
      },
    };
    expect(result.columns.dynamic).toHaveLength(1);
  });
});
