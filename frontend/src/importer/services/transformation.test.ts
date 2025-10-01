import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateTransformations,
  applyTransformations,
  countSelectedChanges,
  toggleChangeSelection,
  setAllChangesSelection,
  TransformationChange,
  TransformationResponse,
} from './transformation';

describe('transformation service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('generateTransformations', () => {
    const mockData = [
      { values: ['test@example.com', 'John Doe'] },
      { values: ['jane@example.com', 'Jane Smith'] }
    ];
    const mockColumnMapping = { 0: 'email', 1: 'name' };

    it('returns error when prompt is empty', async () => {
      const result = await generateTransformations(
        '',
        mockData,
        mockColumnMapping,
        'https://api.example.com',
        'test-key'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Please describe the transformation you want to apply');
      expect(result.changes).toEqual([]);
    });

    it('returns error when prompt is too short', async () => {
      const result = await generateTransformations(
        'ab',
        mockData,
        mockColumnMapping,
        'https://api.example.com',
        'test-key'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Please describe the transformation you want to apply');
    });

    it('returns error when backendUrl is missing', async () => {
      const result = await generateTransformations(
        'capitalize names',
        mockData,
        mockColumnMapping,
        '',
        'test-key'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing configuration');
    });

    it('returns error when importerKey is missing', async () => {
      const result = await generateTransformations(
        'capitalize names',
        mockData,
        mockColumnMapping,
        'https://api.example.com',
        ''
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Missing configuration');
    });

    it('makes correct API request with valid params', async () => {
      const mockResponse: TransformationResponse = {
        success: true,
        changes: [
          {
            rowIndex: 0,
            columnKey: 'name',
            columnIndex: 1,
            oldValue: 'John Doe',
            newValue: 'JOHN DOE',
            confidence: 0.95,
            selected: true
          }
        ],
        summary: 'Capitalized 1 name'
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await generateTransformations(
        'capitalize names',
        mockData,
        mockColumnMapping,
        'https://api.example.com',
        'test-key'
      );

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/api/v1/imports/key/transform',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            importerKey: 'test-key',
            prompt: 'capitalize names',
            data: mockData,
            columnMapping: mockColumnMapping,
            targetColumns: undefined,
            validationErrors: undefined
          })
        }
      );

      expect(result.success).toBe(true);
      expect(result.changes).toHaveLength(1);
    });

    it('includes targetColumns when provided', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          changes: [],
          summary: 'No changes'
        })
      });

      await generateTransformations(
        'capitalize names',
        mockData,
        mockColumnMapping,
        'https://api.example.com',
        'test-key',
        ['name']
      );

      const callArgs = (global.fetch as any).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);

      expect(body.targetColumns).toEqual(['name']);
    });

    it('includes validationErrors when provided', async () => {
      const validationErrors = [
        { rowIndex: 0, columnKey: 'email', message: 'Invalid email' }
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          changes: [],
          summary: 'No changes'
        })
      });

      await generateTransformations(
        'fix invalid emails',
        mockData,
        mockColumnMapping,
        'https://api.example.com',
        'test-key',
        undefined,
        validationErrors
      );

      const callArgs = (global.fetch as any).mock.calls[0][1];
      const body = JSON.parse(callArgs.body);

      expect(body.validationErrors).toEqual(validationErrors);
    });

    it('handles 429 rate limit error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 429
      });

      const result = await generateTransformations(
        'capitalize names',
        mockData,
        mockColumnMapping,
        'https://api.example.com',
        'test-key'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Rate limit exceeded. Please try again later.');
    });

    it('handles other API errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' })
      });

      const result = await generateTransformations(
        'capitalize names',
        mockData,
        mockColumnMapping,
        'https://api.example.com',
        'test-key'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Internal server error');
    });

    it('handles API errors without error message', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({})
      });

      const result = await generateTransformations(
        'capitalize names',
        mockData,
        mockColumnMapping,
        'https://api.example.com',
        'test-key'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to generate transformations');
    });

    it('handles network error', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await generateTransformations(
        'capitalize names',
        mockData,
        mockColumnMapping,
        'https://api.example.com',
        'test-key'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error. Please check your connection.');
    });

    it('ensures all changes have selected property (default true)', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          changes: [
            { rowIndex: 0, columnKey: 'name', oldValue: 'John', newValue: 'JOHN', confidence: 0.9 },
            { rowIndex: 1, columnKey: 'name', oldValue: 'Jane', newValue: 'JANE', confidence: 0.9, selected: false }
          ],
          summary: 'Capitalized names'
        })
      });

      const result = await generateTransformations(
        'capitalize names',
        mockData,
        mockColumnMapping,
        'https://api.example.com',
        'test-key'
      );

      expect(result.changes[0].selected).toBe(true);
      expect(result.changes[1].selected).toBe(false);
    });
  });

  describe('applyTransformations', () => {
    const mockData = [
      { values: ['test@example.com', 'john doe'] },
      { values: ['jane@example.com', 'jane smith'] }
    ];

    it('applies selected changes only by default', () => {
      const changes: TransformationChange[] = [
        {
          rowIndex: 0,
          columnKey: 'name',
          columnIndex: 1,
          oldValue: 'john doe',
          newValue: 'John Doe',
          confidence: 0.9,
          selected: true
        },
        {
          rowIndex: 1,
          columnKey: 'name',
          columnIndex: 1,
          oldValue: 'jane smith',
          newValue: 'Jane Smith',
          confidence: 0.9,
          selected: false
        }
      ];

      const result = applyTransformations(mockData, changes);

      expect(result[0].values[1]).toBe('John Doe');
      expect(result[1].values[1]).toBe('jane smith'); // Unchanged
    });

    it('applies all changes when onlySelected is false', () => {
      const changes: TransformationChange[] = [
        {
          rowIndex: 0,
          columnKey: 'name',
          columnIndex: 1,
          oldValue: 'john doe',
          newValue: 'John Doe',
          confidence: 0.9,
          selected: true
        },
        {
          rowIndex: 1,
          columnKey: 'name',
          columnIndex: 1,
          oldValue: 'jane smith',
          newValue: 'Jane Smith',
          confidence: 0.9,
          selected: false
        }
      ];

      const result = applyTransformations(mockData, changes, false);

      expect(result[0].values[1]).toBe('John Doe');
      expect(result[1].values[1]).toBe('Jane Smith');
    });

    it('creates a deep copy of the data', () => {
      const changes: TransformationChange[] = [
        {
          rowIndex: 0,
          columnKey: 'name',
          columnIndex: 1,
          oldValue: 'john doe',
          newValue: 'John Doe',
          confidence: 0.9,
          selected: true
        }
      ];

      const result = applyTransformations(mockData, changes);

      expect(result).not.toBe(mockData);
      expect(result[0]).not.toBe(mockData[0]);
      expect(result[0].values[1]).toBe('John Doe');
      expect(mockData[0].values[1]).toBe('john doe'); // Original unchanged
    });

    it('skips invalid row indices', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const changes: TransformationChange[] = [
        {
          rowIndex: 999,
          columnKey: 'name',
          columnIndex: 1,
          oldValue: 'john doe',
          newValue: 'John Doe',
          confidence: 0.9,
          selected: true
        }
      ];

      const result = applyTransformations(mockData, changes);

      expect(consoleWarnSpy).toHaveBeenCalledWith('Invalid row index: 999');
      expect(result).toEqual(mockData);

      consoleWarnSpy.mockRestore();
    });

    it('handles negative row indices', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const changes: TransformationChange[] = [
        {
          rowIndex: -1,
          columnKey: 'name',
          columnIndex: 1,
          oldValue: 'john doe',
          newValue: 'John Doe',
          confidence: 0.9,
          selected: true
        }
      ];

      const result = applyTransformations(mockData, changes);

      expect(consoleWarnSpy).toHaveBeenCalledWith('Invalid row index: -1');
      expect(result).toEqual(mockData);

      consoleWarnSpy.mockRestore();
    });

    it('handles empty changes array', () => {
      const result = applyTransformations(mockData, []);

      expect(result).toEqual(mockData);
    });
  });

  describe('countSelectedChanges', () => {
    it('counts only selected changes', () => {
      const changes: TransformationChange[] = [
        {
          rowIndex: 0,
          columnKey: 'name',
          oldValue: 'john',
          newValue: 'John',
          confidence: 0.9,
          selected: true
        },
        {
          rowIndex: 1,
          columnKey: 'name',
          oldValue: 'jane',
          newValue: 'Jane',
          confidence: 0.9,
          selected: false
        },
        {
          rowIndex: 2,
          columnKey: 'name',
          oldValue: 'bob',
          newValue: 'Bob',
          confidence: 0.9,
          selected: true
        }
      ];

      expect(countSelectedChanges(changes)).toBe(2);
    });

    it('returns 0 for empty array', () => {
      expect(countSelectedChanges([])).toBe(0);
    });

    it('returns 0 when no changes selected', () => {
      const changes: TransformationChange[] = [
        {
          rowIndex: 0,
          columnKey: 'name',
          oldValue: 'john',
          newValue: 'John',
          confidence: 0.9,
          selected: false
        }
      ];

      expect(countSelectedChanges(changes)).toBe(0);
    });
  });

  describe('toggleChangeSelection', () => {
    it('toggles selection at specified index', () => {
      const changes: TransformationChange[] = [
        {
          rowIndex: 0,
          columnKey: 'name',
          oldValue: 'john',
          newValue: 'John',
          confidence: 0.9,
          selected: true
        },
        {
          rowIndex: 1,
          columnKey: 'name',
          oldValue: 'jane',
          newValue: 'Jane',
          confidence: 0.9,
          selected: false
        }
      ];

      const result = toggleChangeSelection(changes, 0);

      expect(result[0].selected).toBe(false);
      expect(result[1].selected).toBe(false);
    });

    it('does not mutate original array', () => {
      const changes: TransformationChange[] = [
        {
          rowIndex: 0,
          columnKey: 'name',
          oldValue: 'john',
          newValue: 'John',
          confidence: 0.9,
          selected: true
        }
      ];

      const result = toggleChangeSelection(changes, 0);

      expect(result).not.toBe(changes);
      expect(changes[0].selected).toBe(true);
      expect(result[0].selected).toBe(false);
    });

    it('handles invalid index gracefully', () => {
      const changes: TransformationChange[] = [
        {
          rowIndex: 0,
          columnKey: 'name',
          oldValue: 'john',
          newValue: 'John',
          confidence: 0.9,
          selected: true
        }
      ];

      const result = toggleChangeSelection(changes, 999);

      expect(result).toEqual(changes);
    });
  });

  describe('setAllChangesSelection', () => {
    it('selects all changes when true', () => {
      const changes: TransformationChange[] = [
        {
          rowIndex: 0,
          columnKey: 'name',
          oldValue: 'john',
          newValue: 'John',
          confidence: 0.9,
          selected: false
        },
        {
          rowIndex: 1,
          columnKey: 'name',
          oldValue: 'jane',
          newValue: 'Jane',
          confidence: 0.9,
          selected: false
        }
      ];

      const result = setAllChangesSelection(changes, true);

      expect(result[0].selected).toBe(true);
      expect(result[1].selected).toBe(true);
    });

    it('deselects all changes when false', () => {
      const changes: TransformationChange[] = [
        {
          rowIndex: 0,
          columnKey: 'name',
          oldValue: 'john',
          newValue: 'John',
          confidence: 0.9,
          selected: true
        },
        {
          rowIndex: 1,
          columnKey: 'name',
          oldValue: 'jane',
          newValue: 'Jane',
          confidence: 0.9,
          selected: true
        }
      ];

      const result = setAllChangesSelection(changes, false);

      expect(result[0].selected).toBe(false);
      expect(result[1].selected).toBe(false);
    });

    it('does not mutate original array', () => {
      const changes: TransformationChange[] = [
        {
          rowIndex: 0,
          columnKey: 'name',
          oldValue: 'john',
          newValue: 'John',
          confidence: 0.9,
          selected: false
        }
      ];

      const result = setAllChangesSelection(changes, true);

      expect(result).not.toBe(changes);
      expect(changes[0].selected).toBe(false);
      expect(result[0].selected).toBe(true);
    });

    it('handles empty array', () => {
      const result = setAllChangesSelection([], true);

      expect(result).toEqual([]);
    });
  });
});
