import { describe, it, expect } from 'vitest';
import {
  analyzeValidationErrors,
  getErrorSummary,
  getSelectedErrors,
  toggleErrorGroup,
  setAllErrorGroups,
  countSelectedErrors,
  ValidationError,
} from './errorAnalysis';

describe('errorAnalysis', () => {
  const mockErrors: ValidationError[] = [
    {
      rowIndex: 0,
      columnKey: 'email',
      message: 'Invalid email format',
      value: 'notanemail',
    },
    {
      rowIndex: 1,
      columnKey: 'email',
      message: 'Invalid email format',
      value: 'another bad email',
    },
    {
      rowIndex: 2,
      columnKey: 'firstName',
      message: 'Field is required',
      value: null,
    },
    {
      rowIndex: 3,
      columnKey: 'phone',
      message: 'Invalid phone number',
      value: '123',
    },
  ];

  describe('analyzeValidationErrors', () => {
    it('groups errors by type', () => {
      const groups = analyzeValidationErrors(mockErrors);

      expect(groups.length).toBeGreaterThan(0);
      const emailGroup = groups.find((g) => g.type === 'email');
      expect(emailGroup).toBeDefined();
      expect(emailGroup?.count).toBe(2);
    });

    it('tracks unique columns in each group', () => {
      const groups = analyzeValidationErrors(mockErrors);
      const emailGroup = groups.find((g) => g.type === 'email');

      expect(emailGroup?.columns).toContain('email');
    });

    it('sorts groups by error count', () => {
      const groups = analyzeValidationErrors(mockErrors);

      for (let i = 0; i < groups.length - 1; i++) {
        expect(groups[i].count).toBeGreaterThanOrEqual(groups[i + 1].count);
      }
    });

    it('generates examples for each group', () => {
      const groups = analyzeValidationErrors(mockErrors);
      const requiredGroup = groups.find((g) => g.type === 'required');

      expect(requiredGroup?.example).toBeDefined();
      expect(requiredGroup?.example?.before).toBe('empty');
    });

    it('selects all groups by default', () => {
      const groups = analyzeValidationErrors(mockErrors);

      groups.forEach((group) => {
        expect(group.selected).toBe(true);
      });
    });

    it('handles empty error array', () => {
      const groups = analyzeValidationErrors([]);
      expect(groups).toEqual([]);
    });

    it('categorizes date format errors', () => {
      const dateErrors: ValidationError[] = [
        {
          rowIndex: 0,
          columnKey: 'date',
          message: 'Invalid date format',
          value: '13/25/2024',
        },
      ];

      const groups = analyzeValidationErrors(dateErrors);
      const dateGroup = groups.find((g) => g.type === 'date_format');

      expect(dateGroup).toBeDefined();
      expect(dateGroup?.count).toBe(1);
    });

    it('categorizes number format errors', () => {
      const numberErrors: ValidationError[] = [
        {
          rowIndex: 0,
          columnKey: 'age',
          message: 'Invalid number',
          value: 'abc',
        },
      ];

      const groups = analyzeValidationErrors(numberErrors);
      const numberGroup = groups.find((g) => g.type === 'number');

      expect(numberGroup).toBeDefined();
    });
  });

  describe('getErrorSummary', () => {
    it('returns summary for multiple errors', () => {
      const groups = analyzeValidationErrors(mockErrors);
      const summary = getErrorSummary(groups);

      expect(summary).toContain('4 errors');
    });

    it('returns "No errors found" for empty array', () => {
      const summary = getErrorSummary([]);
      expect(summary).toBe('No errors found');
    });

    it('returns single category summary', () => {
      const singleTypeErrors: ValidationError[] = [
        {
          rowIndex: 0,
          columnKey: 'email',
          message: 'Invalid email',
          value: 'test',
        },
        {
          rowIndex: 1,
          columnKey: 'email',
          message: 'Invalid email',
          value: 'test2',
        },
      ];

      const groups = analyzeValidationErrors(singleTypeErrors);
      const summary = getErrorSummary(groups);

      expect(summary).toContain('2');
      expect(summary).not.toContain('categories');
    });
  });

  describe('getSelectedErrors', () => {
    it('returns only selected errors', () => {
      const groups = analyzeValidationErrors(mockErrors);
      groups[0].selected = false; // Deselect first group

      const selected = getSelectedErrors(groups);

      expect(selected.length).toBeLessThan(mockErrors.length);
    });

    it('returns all errors when all groups selected', () => {
      const groups = analyzeValidationErrors(mockErrors);
      const selected = getSelectedErrors(groups);

      expect(selected.length).toBe(mockErrors.length);
    });

    it('returns empty array when no groups selected', () => {
      const groups = analyzeValidationErrors(mockErrors);
      const deselectedGroups = groups.map((g) => ({ ...g, selected: false }));

      const selected = getSelectedErrors(deselectedGroups);

      expect(selected).toEqual([]);
    });
  });

  describe('toggleErrorGroup', () => {
    it('toggles selection for specified group', () => {
      const groups = analyzeValidationErrors(mockErrors);
      const emailGroup = groups.find((g) => g.type === 'email')!;
      const initialSelection = emailGroup.selected;

      const updated = toggleErrorGroup(groups, 'email');
      const updatedEmailGroup = updated.find((g) => g.type === 'email')!;

      expect(updatedEmailGroup.selected).toBe(!initialSelection);
    });

    it('does not affect other groups', () => {
      const groups = analyzeValidationErrors(mockErrors);
      const updated = toggleErrorGroup(groups, 'email');

      const otherGroups = updated.filter((g) => g.type !== 'email');
      otherGroups.forEach((group) => {
        const original = groups.find((g) => g.type === group.type);
        expect(group.selected).toBe(original?.selected);
      });
    });
  });

  describe('setAllErrorGroups', () => {
    it('selects all groups', () => {
      const groups = analyzeValidationErrors(mockErrors);
      const allSelected = setAllErrorGroups(groups, true);

      allSelected.forEach((group) => {
        expect(group.selected).toBe(true);
      });
    });

    it('deselects all groups', () => {
      const groups = analyzeValidationErrors(mockErrors);
      const allDeselected = setAllErrorGroups(groups, false);

      allDeselected.forEach((group) => {
        expect(group.selected).toBe(false);
      });
    });
  });

  describe('countSelectedErrors', () => {
    it('counts all errors when all groups selected', () => {
      const groups = analyzeValidationErrors(mockErrors);
      const count = countSelectedErrors(groups);

      expect(count).toBe(mockErrors.length);
    });

    it('returns 0 when no groups selected', () => {
      const groups = analyzeValidationErrors(mockErrors);
      const deselected = setAllErrorGroups(groups, false);
      const count = countSelectedErrors(deselected);

      expect(count).toBe(0);
    });

    it('counts only selected group errors', () => {
      const groups = analyzeValidationErrors(mockErrors);
      const toggled = toggleErrorGroup(groups, 'email');
      const count = countSelectedErrors(toggled);

      expect(count).toBeLessThan(mockErrors.length);
    });
  });
});
