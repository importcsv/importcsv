import { describe, it, expect } from 'vitest';
import { normalizeColumnName, isExactMatch, findBestColumnMatches } from './columnMatching';

describe('normalizeColumnName', () => {
  it('converts to lowercase', () => {
    expect(normalizeColumnName('Email')).toBe('email');
    expect(normalizeColumnName('FIRST_NAME')).toBe('first name');
  });

  it('replaces underscores with spaces', () => {
    expect(normalizeColumnName('first_name')).toBe('first name');
    expect(normalizeColumnName('email_address')).toBe('email address');
  });

  it('trims whitespace', () => {
    expect(normalizeColumnName('  email  ')).toBe('email');
  });

  it('collapses multiple spaces', () => {
    expect(normalizeColumnName('first   name')).toBe('first name');
  });

  it('handles combined normalization', () => {
    expect(normalizeColumnName('  First_Name  ')).toBe('first name');
    expect(normalizeColumnName('EMAIL__ADDRESS')).toBe('email address');
  });
});

describe('isExactMatch', () => {
  it('matches identical strings', () => {
    expect(isExactMatch('email', 'email')).toBe(true);
    expect(isExactMatch('Email', 'email')).toBe(true);
  });

  it('matches with underscore/space normalization', () => {
    expect(isExactMatch('first_name', 'First Name')).toBe(true);
    expect(isExactMatch('email_address', 'Email Address')).toBe(true);
  });

  it('does not match partial strings', () => {
    expect(isExactMatch('Email', 'Email consent')).toBe(false);
    expect(isExactMatch('Email', 'Email Address')).toBe(false);
    expect(isExactMatch('email', 'email_consent')).toBe(false);
  });

  it('handles empty strings', () => {
    expect(isExactMatch('', '')).toBe(true);
    expect(isExactMatch('a', '')).toBe(false);
  });
});

describe('findBestColumnMatches', () => {
  const templateColumns = [
    { id: 'email', label: 'Email' },
    { id: 'first_name', label: 'First Name' },
    { id: 'consent', label: 'Consent' },
  ];

  describe('exact match priority - the bug fix', () => {
    it('prefers exact match over fuzzy match for Email vs Email consent', () => {
      const sourceColumns = [
        { index: 0, name: 'Email consent' },
        { index: 1, name: 'Email' },
      ];

      const matches = findBestColumnMatches(sourceColumns, templateColumns);

      // "Email" (index 1) should match "email", not "Email consent" (index 0)
      expect(matches['email']).toBe(1);
    });

    it('prefers exact match regardless of source column order', () => {
      const sourceColumns = [
        { index: 0, name: 'Email' },
        { index: 1, name: 'Email consent' },
      ];

      const matches = findBestColumnMatches(sourceColumns, templateColumns);

      expect(matches['email']).toBe(0);
    });

    it('correctly maps Email column among many Email-prefixed columns', () => {
      const sourceColumns = [
        { index: 0, name: 'Email consent' },
        { index: 1, name: 'Email subscription status' },
        { index: 2, name: 'Email opt-in date' },
        { index: 3, name: 'Email' },
        { index: 4, name: 'First Name' },
      ];

      const matches = findBestColumnMatches(sourceColumns, templateColumns);

      expect(matches['email']).toBe(3);
      expect(matches['first_name']).toBe(4);
    });
  });

  describe('normalization in exact matches', () => {
    it('handles underscore/space normalization', () => {
      const sourceColumns = [
        { index: 0, name: 'first_name' },
      ];

      const matches = findBestColumnMatches(sourceColumns, templateColumns);

      expect(matches['first_name']).toBe(0);
    });
  });

  describe('fuzzy fallback', () => {
    it('falls back to fuzzy matching when no exact match exists', () => {
      const sourceColumns = [
        { index: 0, name: 'Email Address' },
      ];

      const matches = findBestColumnMatches(sourceColumns, templateColumns);

      expect(matches['email']).toBe(0);
    });

    it('does not match columns that are too dissimilar', () => {
      const sourceColumns = [
        { index: 0, name: 'Phone Number' },
      ];

      const matches = findBestColumnMatches(sourceColumns, templateColumns);

      expect(matches['email']).toBeUndefined();
    });
  });

  describe('constraint: each source maps to at most one template', () => {
    it('first template wins when source could match multiple', () => {
      const duplicateTemplates = [
        { id: 'email1', label: 'Email' },
        { id: 'email2', label: 'Email' },
      ];
      const sourceColumns = [
        { index: 0, name: 'Email' },
      ];

      const matches = findBestColumnMatches(sourceColumns, duplicateTemplates);

      const mappedTemplates = Object.keys(matches);
      expect(mappedTemplates.length).toBe(1);
    });
  });
});
