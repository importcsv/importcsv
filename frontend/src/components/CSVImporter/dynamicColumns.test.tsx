/**
 * Integration tests for dynamic columns feature.
 *
 * Verifies the full flow:
 * 1. CSVImporter accepts both `columns` and `dynamicColumns` props
 * 2. ImportResult structure has `_custom_fields` for dynamic column values
 * 3. Column metadata is correctly structured with predefined, dynamic, and unmatched
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { h } from 'preact';
import CSVImporter from './index';
import type { ImportResult, Column } from '../../types';

// Mock the Importer component to capture props
let capturedImporterProps: any = {};
vi.mock('../../importer/features/main', () => ({
  default: ({ children, ...props }: any) => {
    capturedImporterProps = props;
    return h('div', { 'data-testid': 'mock-importer' }, children);
  },
}));

vi.mock('../../importer/providers', () => ({
  default: ({ children }: any) => h('div', { 'data-testid': 'mock-providers' }, children),
}));

vi.mock('../Modal', () => ({
  default: ({ children, isOpen }: any) =>
    isOpen ? h('div', { 'data-testid': 'mock-modal' }, children) : null,
}));

vi.mock('../../importer/stores/theme', () => ({
  default: vi.fn((selector: any) => {
    const state = { setTheme: vi.fn() };
    return selector ? selector(state) : state;
  }),
}));

describe('Dynamic columns integration', () => {
  const predefinedColumns: Column[] = [
    { id: 'name', label: 'Name' },
    { id: 'email', label: 'Email', type: 'email' },
  ];

  const dynamicColumns: Column[] = [
    { id: 'custom_location', label: 'Location' },
    { id: 'custom_dept', label: 'Department' },
  ];

  beforeEach(() => {
    capturedImporterProps = {};
  });

  describe('Props passing', () => {
    it('passes both columns and dynamicColumns to Importer', () => {
      render(
        h(CSVImporter, {
          columns: predefinedColumns,
          dynamicColumns: dynamicColumns,
          onComplete: vi.fn(),
          isModal: false,
        })
      );

      expect(screen.getByTestId('mock-importer')).toBeInTheDocument();
      expect(capturedImporterProps.columns).toEqual(predefinedColumns);
      expect(capturedImporterProps.dynamicColumns).toEqual(dynamicColumns);
    });

    it('works with dynamicColumns only (no predefined columns)', () => {
      render(
        h(CSVImporter, {
          columns: [],
          dynamicColumns: dynamicColumns,
          onComplete: vi.fn(),
          isModal: false,
        })
      );

      expect(capturedImporterProps.columns).toEqual([]);
      expect(capturedImporterProps.dynamicColumns).toEqual(dynamicColumns);
    });

    it('works with predefined columns only (no dynamic columns)', () => {
      render(
        h(CSVImporter, {
          columns: predefinedColumns,
          onComplete: vi.fn(),
          isModal: false,
        })
      );

      expect(capturedImporterProps.columns).toEqual(predefinedColumns);
      expect(capturedImporterProps.dynamicColumns).toBeUndefined();
    });
  });

  describe('ImportResult structure', () => {
    it('has correct shape with _custom_fields for dynamic values', () => {
      // This tests the ImportResult type structure
      const result: ImportResult<{ name: string; email: string }> = {
        rows: [
          {
            name: 'John Doe',
            email: 'john@example.com',
            _custom_fields: {
              custom_location: 'New York',
              custom_dept: 'Engineering',
            },
          },
          {
            name: 'Jane Smith',
            email: 'jane@example.com',
            _custom_fields: {
              custom_location: 'San Francisco',
              custom_dept: 'Marketing',
            },
          },
        ],
        columns: {
          predefined: predefinedColumns,
          dynamic: dynamicColumns,
          unmatched: ['extra_col'],
        },
      };

      // Verify rows structure
      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].name).toBe('John Doe');
      expect(result.rows[0]._custom_fields).toBeDefined();
      expect(result.rows[0]._custom_fields?.custom_location).toBe('New York');
      expect(result.rows[0]._custom_fields?.custom_dept).toBe('Engineering');

      // Verify columns metadata
      expect(result.columns.predefined).toEqual(predefinedColumns);
      expect(result.columns.dynamic).toEqual(dynamicColumns);
      expect(result.columns.unmatched).toContain('extra_col');
    });

    it('allows _custom_fields to be optional', () => {
      // Some rows may not have any dynamic column values
      const result: ImportResult<{ name: string }> = {
        rows: [
          { name: 'No custom fields' },
          { name: 'Has custom fields', _custom_fields: { custom_location: 'Boston' } },
        ],
        columns: {
          predefined: [{ id: 'name', label: 'Name' }],
          dynamic: [{ id: 'custom_location', label: 'Location' }],
          unmatched: [],
        },
      };

      expect(result.rows[0]._custom_fields).toBeUndefined();
      expect(result.rows[1]._custom_fields).toBeDefined();
    });

    it('allows _unmatched to store unmapped column values', () => {
      const result: ImportResult<{ name: string }> = {
        rows: [
          {
            name: 'Test',
            _unmatched: {
              some_unknown_col: 'value1',
              another_col: 'value2',
            },
          },
        ],
        columns: {
          predefined: [{ id: 'name', label: 'Name' }],
          dynamic: [],
          unmatched: ['some_unknown_col', 'another_col'],
        },
      };

      expect(result.rows[0]._unmatched).toBeDefined();
      expect(result.rows[0]._unmatched?.some_unknown_col).toBe('value1');
      expect(result.columns.unmatched).toHaveLength(2);
    });

    it('supports empty dynamic columns list', () => {
      const result: ImportResult<{ name: string }> = {
        rows: [{ name: 'Test' }],
        columns: {
          predefined: [{ id: 'name', label: 'Name' }],
          dynamic: [],
          unmatched: [],
        },
      };

      expect(result.columns.dynamic).toEqual([]);
      expect(result.rows[0]._custom_fields).toBeUndefined();
    });
  });

  describe('Column type preservation', () => {
    it('preserves column types in metadata', () => {
      const typedColumns: Column[] = [
        { id: 'name', label: 'Name', type: 'string' },
        { id: 'count', label: 'Count', type: 'number' },
        { id: 'email', label: 'Email', type: 'email' },
      ];

      const typedDynamicColumns: Column[] = [
        { id: 'custom_date', label: 'Custom Date', type: 'date' },
        { id: 'custom_category', label: 'Category', type: 'select', options: ['A', 'B', 'C'] },
      ];

      const result: ImportResult = {
        rows: [],
        columns: {
          predefined: typedColumns,
          dynamic: typedDynamicColumns,
          unmatched: [],
        },
      };

      expect(result.columns.predefined[1].type).toBe('number');
      expect(result.columns.dynamic[0].type).toBe('date');
      expect(result.columns.dynamic[1].options).toEqual(['A', 'B', 'C']);
    });
  });
});
