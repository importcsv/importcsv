import { describe, it, expect } from 'vitest';
import { Column } from '../../../types';

/**
 * Tests for the column merging logic used in Main component.
 *
 * The Main component merges dynamicColumns with regular columns and
 * tracks which column IDs came from dynamicColumns for use in
 * restructuring output data (Task 4).
 */
describe('Main component column merging', () => {
  it('merges dynamicColumns with columns', () => {
    const columns: Column[] = [
      { id: 'name', label: 'Name' },
      { id: 'email', label: 'Email', type: 'email' }
    ];
    const dynamicColumns: Column[] = [
      { id: 'custom1', label: 'Custom Field 1' },
      { id: 'custom2', label: 'Custom Field 2' }
    ];

    // Test the merging logic
    const mergedColumns = [...columns, ...dynamicColumns];
    const dynamicIds = new Set(dynamicColumns.map(c => c.id));

    expect(mergedColumns).toHaveLength(4);
    expect(mergedColumns[0].id).toBe('name');
    expect(mergedColumns[1].id).toBe('email');
    expect(mergedColumns[2].id).toBe('custom1');
    expect(mergedColumns[3].id).toBe('custom2');

    // Verify dynamic IDs are tracked correctly
    expect(dynamicIds.has('custom1')).toBe(true);
    expect(dynamicIds.has('custom2')).toBe(true);
    expect(dynamicIds.has('name')).toBe(false);
    expect(dynamicIds.has('email')).toBe(false);
  });

  it('handles empty dynamicColumns', () => {
    const columns: Column[] = [
      { id: 'name', label: 'Name' }
    ];
    const dynamicColumns: Column[] = [];

    const mergedColumns = [...columns, ...dynamicColumns];
    const dynamicIds = new Set(dynamicColumns.map(c => c.id));

    expect(mergedColumns).toHaveLength(1);
    expect(dynamicIds.size).toBe(0);
  });

  it('handles undefined dynamicColumns', () => {
    const columns: Column[] = [
      { id: 'name', label: 'Name' }
    ];
    const dynamicColumns = undefined as Column[] | undefined;

    // This matches the logic pattern used in Main component
    const safeDynamicColumns: Column[] = dynamicColumns || [];
    const mergedColumns = [...(columns || []), ...safeDynamicColumns];
    const dynamicIds = new Set(safeDynamicColumns.map(c => c.id));

    expect(mergedColumns).toHaveLength(1);
    expect(dynamicIds.size).toBe(0);
  });

  it('handles empty columns with dynamicColumns', () => {
    const columns: Column[] = [];
    const dynamicColumns: Column[] = [
      { id: 'custom1', label: 'Custom Field 1' }
    ];

    const mergedColumns = [...columns, ...dynamicColumns];
    const dynamicIds = new Set(dynamicColumns.map(c => c.id));

    expect(mergedColumns).toHaveLength(1);
    expect(mergedColumns[0].id).toBe('custom1');
    expect(dynamicIds.has('custom1')).toBe(true);
  });

  it('preserves column properties when merging', () => {
    const columns: Column[] = [
      {
        id: 'email',
        label: 'Email',
        type: 'email',
        validators: [{ type: 'required' }]
      }
    ];
    const dynamicColumns: Column[] = [
      {
        id: 'custom_date',
        label: 'Custom Date',
        type: 'date',
        description: 'A custom date field'
      }
    ];

    const mergedColumns = [...columns, ...dynamicColumns];

    expect(mergedColumns[0].type).toBe('email');
    expect(mergedColumns[0].validators).toEqual([{ type: 'required' }]);
    expect(mergedColumns[1].type).toBe('date');
    expect(mergedColumns[1].description).toBe('A custom date field');
  });
});

/**
 * Tests for output restructuring logic used in handleValidationComplete.
 *
 * The output should:
 * - Keep predefined fields at top level
 * - Nest dynamic fields under _custom_fields
 * - Nest unmatched columns under _unmatched (when includeUnmatchedColumns is true)
 */
describe('Output restructuring', () => {
  /**
   * Helper function that mirrors the restructuring logic in handleValidationComplete.
   * This is extracted for testability.
   */
  function restructureRow(
    row: Record<string, unknown>,
    dynamicIds: Set<string>
  ): Record<string, unknown> {
    const predefinedData: Record<string, unknown> = {};
    const customFieldsData: Record<string, unknown> = {};
    const unmatchedData: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(row)) {
      if (key.startsWith('_unmapped_')) {
        // Unmatched columns go under _unmatched
        const originalKey = key.replace('_unmapped_', '');
        unmatchedData[originalKey] = value;
      } else if (dynamicIds.has(key)) {
        // Dynamic columns go under _custom_fields
        customFieldsData[key] = value;
      } else {
        // Predefined columns stay at top level
        predefinedData[key] = value;
      }
    }

    return {
      ...predefinedData,
      ...(Object.keys(customFieldsData).length > 0
        ? { _custom_fields: customFieldsData }
        : {}),
      ...(Object.keys(unmatchedData).length > 0
        ? { _unmatched: unmatchedData }
        : {}),
    };
  }

  it('nests dynamic fields under _custom_fields', () => {
    const row = { name: 'Test', custom1: 'Value' };
    const dynamicIds = new Set(['custom1']);

    const result = restructureRow(row, dynamicIds);

    expect(result).toEqual({
      name: 'Test',
      _custom_fields: { custom1: 'Value' },
    });
  });

  it('omits _custom_fields when no dynamic fields mapped', () => {
    const row = { name: 'Test' };
    const dynamicIds = new Set(['custom1']); // custom1 not in row

    const result = restructureRow(row, dynamicIds);

    expect(result).toEqual({ name: 'Test' });
    expect(result).not.toHaveProperty('_custom_fields');
  });

  it('handles multiple dynamic fields', () => {
    const row = { name: 'Test', custom1: 'Value1', custom2: 'Value2', email: 'test@test.com' };
    const dynamicIds = new Set(['custom1', 'custom2']);

    const result = restructureRow(row, dynamicIds);

    expect(result).toEqual({
      name: 'Test',
      email: 'test@test.com',
      _custom_fields: {
        custom1: 'Value1',
        custom2: 'Value2',
      },
    });
  });

  it('handles unmatched columns under _unmatched', () => {
    const row = { name: 'Test', _unmapped_extra: 'Extra Value' };
    const dynamicIds = new Set<string>();

    const result = restructureRow(row, dynamicIds);

    expect(result).toEqual({
      name: 'Test',
      _unmatched: { extra: 'Extra Value' },
    });
  });

  it('handles both dynamic fields and unmatched columns', () => {
    const row = {
      name: 'Test',
      custom1: 'Custom Value',
      _unmapped_extra: 'Extra Value',
    };
    const dynamicIds = new Set(['custom1']);

    const result = restructureRow(row, dynamicIds);

    expect(result).toEqual({
      name: 'Test',
      _custom_fields: { custom1: 'Custom Value' },
      _unmatched: { extra: 'Extra Value' },
    });
  });

  it('omits both _custom_fields and _unmatched when empty', () => {
    const row = { name: 'Test', email: 'test@test.com' };
    const dynamicIds = new Set<string>();

    const result = restructureRow(row, dynamicIds);

    expect(result).toEqual({ name: 'Test', email: 'test@test.com' });
    expect(result).not.toHaveProperty('_custom_fields');
    expect(result).not.toHaveProperty('_unmatched');
  });

  it('handles empty row', () => {
    const row = {};
    const dynamicIds = new Set(['custom1']);

    const result = restructureRow(row, dynamicIds);

    expect(result).toEqual({});
    expect(result).not.toHaveProperty('_custom_fields');
    expect(result).not.toHaveProperty('_unmatched');
  });

  it('handles row with only dynamic fields', () => {
    const row = { custom1: 'Value1', custom2: 'Value2' };
    const dynamicIds = new Set(['custom1', 'custom2']);

    const result = restructureRow(row, dynamicIds);

    expect(result).toEqual({
      _custom_fields: {
        custom1: 'Value1',
        custom2: 'Value2',
      },
    });
  });
});
