import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getMappingSuggestions,
  applyMappingSuggestions,
  MappingSuggestion,
} from './mapping';

describe('mapping service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('getMappingSuggestions', () => {
    it('returns empty array when backendUrl is missing', async () => {
      const result = await getMappingSuggestions(
        [{ name: 'Email', sample_data: 'test@example.com' }],
        [{ id: 'email', label: 'Email Address' }],
        undefined,
        'test-key'
      );

      expect(result).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('returns empty array when importerKey is missing', async () => {
      const result = await getMappingSuggestions(
        [{ name: 'Email', sample_data: 'test@example.com' }],
        [{ id: 'email', label: 'Email Address' }],
        'https://api.example.com',
        undefined
      );

      expect(result).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('returns empty array when uploadColumns is empty', async () => {
      const result = await getMappingSuggestions(
        [],
        [{ id: 'email', label: 'Email Address' }],
        'https://api.example.com',
        'test-key'
      );

      expect(result).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('returns empty array when templateColumns is empty', async () => {
      const result = await getMappingSuggestions(
        [{ name: 'Email', sample_data: 'test@example.com' }],
        [],
        'https://api.example.com',
        'test-key'
      );

      expect(result).toEqual([]);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('makes correct API request with valid params', async () => {
      const uploadColumns = [
        { name: 'Email', sample_data: 'test@example.com' },
        { name: 'Name', sample_data: 'John Doe' }
      ];
      const templateColumns = [
        { id: 'email', label: 'Email Address', validators: [{ type: 'required' }] },
        { id: 'name', label: 'Full Name' }
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          mappings: [
            { uploadIndex: 0, templateKey: 'email', confidence: 0.95 },
            { uploadIndex: 1, templateKey: 'name', confidence: 0.9 }
          ]
        })
      });

      const result = await getMappingSuggestions(
        uploadColumns,
        templateColumns,
        'https://api.example.com',
        'test-key'
      );

      const callArgs = (global.fetch as any).mock.calls[0];
      expect(callArgs[0]).toBe('https://api.example.com/api/v1/imports/key/mapping-suggestions');
      expect(callArgs[1].method).toBe('POST');
      expect(callArgs[1].headers).toEqual({ 'Content-Type': 'application/json' });

      const bodyData = JSON.parse(callArgs[1].body);
      expect(bodyData.importerKey).toBe('test-key');
      expect(bodyData.uploadColumns).toEqual(uploadColumns);
      expect(bodyData.templateColumns[0]).toEqual({ key: 'email', name: 'Email Address', required: true });
      expect(bodyData.templateColumns[1].key).toBe('name');
      expect(bodyData.templateColumns[1].name).toBe('Full Name');

      expect(result).toEqual([
        { uploadIndex: 0, templateKey: 'email', confidence: 0.95 },
        { uploadIndex: 1, templateKey: 'name', confidence: 0.9 }
      ]);
    });

    it('returns empty array on API error', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      const result = await getMappingSuggestions(
        [{ name: 'Email', sample_data: 'test@example.com' }],
        [{ id: 'email', label: 'Email Address' }],
        'https://api.example.com',
        'test-key'
      );

      expect(result).toEqual([]);
    });

    it('returns empty array on network error', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      const result = await getMappingSuggestions(
        [{ name: 'Email', sample_data: 'test@example.com' }],
        [{ id: 'email', label: 'Email Address' }],
        'https://api.example.com',
        'test-key'
      );

      expect(result).toEqual([]);
    });

    it('returns empty array when response is invalid', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: false })
      });

      const result = await getMappingSuggestions(
        [{ name: 'Email', sample_data: 'test@example.com' }],
        [{ id: 'email', label: 'Email Address' }],
        'https://api.example.com',
        'test-key'
      );

      expect(result).toEqual([]);
    });
  });

  describe('applyMappingSuggestions', () => {
    const mockHandleChange = vi.fn();

    beforeEach(() => {
      mockHandleChange.mockClear();
    });

    it('applies high-confidence suggestions (>0.8)', () => {
      const suggestions: MappingSuggestion[] = [
        { uploadIndex: 0, templateKey: 'email', confidence: 0.9 },
        { uploadIndex: 1, templateKey: 'name', confidence: 0.85 }
      ];

      const appliedCount = applyMappingSuggestions(
        suggestions,
        {},
        new Set(),
        mockHandleChange
      );

      expect(appliedCount).toBe(2);
      expect(mockHandleChange).toHaveBeenCalledTimes(2);
      expect(mockHandleChange).toHaveBeenCalledWith(0, 'email');
      expect(mockHandleChange).toHaveBeenCalledWith(1, 'name');
    });

    it('skips low-confidence suggestions (≤0.8)', () => {
      const suggestions: MappingSuggestion[] = [
        { uploadIndex: 0, templateKey: 'email', confidence: 0.8 },
        { uploadIndex: 1, templateKey: 'name', confidence: 0.7 }
      ];

      const appliedCount = applyMappingSuggestions(
        suggestions,
        {},
        new Set(),
        mockHandleChange
      );

      expect(appliedCount).toBe(0);
      expect(mockHandleChange).not.toHaveBeenCalled();
    });

    it('skips already mapped columns with strong match', () => {
      const suggestions: MappingSuggestion[] = [
        { uploadIndex: 0, templateKey: 'email', confidence: 0.9 }
      ];

      const currentValues = {
        0: { key: 'other_field', selected: true }
      };

      const appliedCount = applyMappingSuggestions(
        suggestions,
        currentValues,
        new Set(),
        mockHandleChange
      );

      expect(appliedCount).toBe(0);
      expect(mockHandleChange).not.toHaveBeenCalled();
    });

    it('overrides weak string matches', () => {
      const suggestions: MappingSuggestion[] = [
        { uploadIndex: 0, templateKey: 'email', confidence: 0.9 }
      ];

      const currentValues = {
        0: { key: 'other_field', selected: false } // Weak match
      };

      const appliedCount = applyMappingSuggestions(
        suggestions,
        currentValues,
        new Set(),
        mockHandleChange
      );

      expect(appliedCount).toBe(1);
      expect(mockHandleChange).toHaveBeenCalledWith(0, 'email');
    });

    it('skips already used template keys', () => {
      const suggestions: MappingSuggestion[] = [
        { uploadIndex: 0, templateKey: 'email', confidence: 0.9 },
        { uploadIndex: 1, templateKey: 'email', confidence: 0.95 }
      ];

      const usedKeys = new Set<string>();

      const appliedCount = applyMappingSuggestions(
        suggestions,
        {},
        usedKeys,
        mockHandleChange
      );

      // Only one should be applied since they both target 'email'
      expect(appliedCount).toBe(1);
      expect(mockHandleChange).toHaveBeenCalledTimes(1);
    });

    it('applies suggestions in confidence order', () => {
      const suggestions: MappingSuggestion[] = [
        { uploadIndex: 0, templateKey: 'name', confidence: 0.85 },
        { uploadIndex: 1, templateKey: 'email', confidence: 0.95 }
      ];

      const appliedCount = applyMappingSuggestions(
        suggestions,
        {},
        new Set(),
        mockHandleChange
      );

      expect(appliedCount).toBe(2);
      // Higher confidence (0.95) should be applied first
      expect(mockHandleChange).toHaveBeenNthCalledWith(1, 1, 'email');
      expect(mockHandleChange).toHaveBeenNthCalledWith(2, 0, 'name');
    });

    it('returns 0 when no suggestions provided', () => {
      const appliedCount = applyMappingSuggestions(
        [],
        {},
        new Set(),
        mockHandleChange
      );

      expect(appliedCount).toBe(0);
      expect(mockHandleChange).not.toHaveBeenCalled();
    });
  });
});
