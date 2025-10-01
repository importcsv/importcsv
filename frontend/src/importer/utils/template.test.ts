import { describe, it, expect } from 'vitest';
import { convertRawTemplate } from './template';

describe('template utilities', () => {
  describe('convertRawTemplate', () => {
    it('converts valid template object', () => {
      const rawTemplate = {
        columns: [
          { label: 'First Name', required: true },
          { label: 'Email', type: 'email' },
        ],
      };

      const [template, error] = convertRawTemplate(rawTemplate);

      expect(error).toBeNull();
      expect(template).not.toBeNull();
      expect(template?.columns).toHaveLength(2);
      expect(template?.columns[0].id).toBe('first_name');
      expect(template?.columns[0].label).toBe('First Name');
    });

    it('converts JSON string template', () => {
      const rawTemplate = JSON.stringify({
        columns: [{ label: 'Name' }],
      });

      const [template, error] = convertRawTemplate(rawTemplate);

      expect(error).toBeNull();
      expect(template?.columns).toHaveLength(1);
    });

    it('returns error for missing columns', () => {
      const rawTemplate = { other: 'data' };

      const [template, error] = convertRawTemplate(rawTemplate);

      expect(template).toBeNull();
      expect(error).toContain('No columns provided');
    });

    it('returns error for invalid columns format', () => {
      const rawTemplate = { columns: 'not an array' };

      const [template, error] = convertRawTemplate(rawTemplate);

      expect(template).toBeNull();
      expect(error).toContain('should be an array');
    });

    it('generates ID from label when missing', () => {
      const rawTemplate = {
        columns: [{ label: 'First Name' }],
      };

      const [template] = convertRawTemplate(rawTemplate);

      expect(template?.columns[0].id).toBe('first_name');
    });

    it('detects duplicate IDs', () => {
      const rawTemplate = {
        columns: [
          { id: 'name', label: 'Name' },
          { id: 'name', label: 'Full Name' },
        ],
      };

      const [template, error] = convertRawTemplate(rawTemplate);

      expect(template).toBeNull();
      expect(error).toContain('Duplicate ids');
    });

    it('supports legacy key/name format', () => {
      const rawTemplate = {
        columns: [{ key: 'email', name: 'Email Address' }],
      };

      const [template] = convertRawTemplate(rawTemplate);

      expect(template?.columns[0].id).toBe('email');
      expect(template?.columns[0].label).toBe('Email Address');
    });

    it('converts required field to validator', () => {
      const rawTemplate = {
        columns: [{ label: 'Email', required: true }],
      };

      const [template] = convertRawTemplate(rawTemplate);

      expect(template?.columns[0].validators).toContainEqual({
        type: 'required',
      });
    });

    it('converts validation_format to regex validator', () => {
      const rawTemplate = {
        columns: [
          { label: 'Email', type: 'email', validation_format: '^\\S+@\\S+$' },
        ],
      };

      const [template] = convertRawTemplate(rawTemplate);

      expect(template?.columns[0].validators).toContainEqual({
        type: 'regex',
        pattern: '^\\S+@\\S+$',
      });
    });

    it('handles select type with options', () => {
      const rawTemplate = {
        columns: [
          { label: 'Status', type: 'select', validation_format: 'Active, Inactive, Pending' },
        ],
      };

      const [template] = convertRawTemplate(rawTemplate);

      expect(template?.columns[0].type).toBe('select');
      expect(template?.columns[0].options).toEqual(['Active', 'Inactive', 'Pending']);
    });

    it('returns error for empty template', () => {
      const [template, error] = convertRawTemplate({});

      expect(template).toBeNull();
      expect(error).toContain('required');
    });

    it('returns error for undefined template', () => {
      const [template, error] = convertRawTemplate(undefined);

      expect(template).toBeNull();
      expect(error).toContain('required');
    });

    it('returns error for column without label', () => {
      const rawTemplate = {
        columns: [{ id: 'test' }],
      };

      const [template, error] = convertRawTemplate(rawTemplate);

      expect(template).toBeNull();
      expect(error).toContain('label');
    });
  });
});
