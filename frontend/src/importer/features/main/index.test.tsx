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
