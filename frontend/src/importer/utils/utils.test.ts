import { describe, it, expect } from 'vitest';
import {
  parseJSON,
  sanitizeKey,
  validateJSON,
  strToBoolean,
  strToOptionalBoolean,
  strToDefaultBoolean,
  parseOptionalBoolean,
} from './utils';

describe('utils', () => {
  describe('parseJSON', () => {
    it('parses JSON string to object', () => {
      const result = parseJSON('{"name":"test","value":123}');
      expect(result).toEqual({ name: 'test', value: 123 });
    });

    it('returns object as-is', () => {
      const obj = { name: 'test' };
      const result = parseJSON(obj);
      expect(result).toEqual(obj);
    });

    it('returns empty object for undefined', () => {
      const result = parseJSON(undefined);
      expect(result).toEqual({});
    });

    it('returns empty object for invalid JSON', () => {
      const result = parseJSON('invalid json');
      expect(result).toEqual({});
    });

    it('returns JSON string when returnType is string', () => {
      const result = parseJSON({ name: 'test' }, { returnType: 'string' });
      expect(result).toBe('{"name":"test"}');
    });

    it('escapes percent signs when requested', () => {
      const result = parseJSON(
        { text: 'test%value' },
        { returnType: 'string', escapePercent: true }
      );
      expect(result).toContain('%25');
    });
  });

  describe('sanitizeKey', () => {
    it('converts to lowercase', () => {
      expect(sanitizeKey('TestKey')).toBe('testkey');
    });

    it('replaces spaces with underscores', () => {
      expect(sanitizeKey('First Name')).toBe('first_name');
    });

    it('removes special characters', () => {
      expect(sanitizeKey('test@#$key')).toBe('testkey');
    });

    it('handles complex strings', () => {
      expect(sanitizeKey('User ID (Primary)')).toBe('user_id_primary');
    });
  });

  describe('validateJSON', () => {
    it('validates and returns valid JSON', () => {
      const result = validateJSON('{"name":"test"}', 'param');
      expect(result).toBe('{"name":"test"}');
    });

    it('returns empty string for invalid JSON', () => {
      const result = validateJSON('not json', 'param');
      expect(result).toBe('');
    });

    it('returns empty string for undefined', () => {
      const result = validateJSON('undefined', 'param');
      expect(result).toBe('');
    });
  });

  describe('strToBoolean', () => {
    it('converts "true" to true', () => {
      expect(strToBoolean('true')).toBe(true);
      expect(strToBoolean('True')).toBe(true);
      expect(strToBoolean('TRUE')).toBe(true);
    });

    it('converts "1" to true', () => {
      expect(strToBoolean('1')).toBe(true);
    });

    it('converts other strings to false', () => {
      expect(strToBoolean('false')).toBe(false);
      expect(strToBoolean('0')).toBe(false);
      expect(strToBoolean('')).toBe(false);
    });
  });

  describe('strToOptionalBoolean', () => {
    it('returns true for "true"', () => {
      expect(strToOptionalBoolean('true')).toBe(true);
    });

    it('returns false for "false"', () => {
      expect(strToOptionalBoolean('false')).toBe(false);
    });

    it('returns undefined for empty string', () => {
      expect(strToOptionalBoolean('')).toBeUndefined();
    });
  });

  describe('strToDefaultBoolean', () => {
    it('returns true for "true"', () => {
      expect(strToDefaultBoolean('true', false)).toBe(true);
    });

    it('returns default for empty string', () => {
      expect(strToDefaultBoolean('', true)).toBe(true);
      expect(strToDefaultBoolean('', false)).toBe(false);
    });
  });

  describe('parseOptionalBoolean', () => {
    it('returns "true" for true', () => {
      expect(parseOptionalBoolean(true)).toBe('true');
    });

    it('returns "false" for false', () => {
      expect(parseOptionalBoolean(false)).toBe('false');
    });

    it('returns empty string for undefined', () => {
      expect(parseOptionalBoolean(undefined)).toBe('');
    });
  });
});
