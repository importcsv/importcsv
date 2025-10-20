import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { zodSchemaToColumns } from './zodSchemaToColumns';
import type { Column } from '../../types';

describe('zodSchemaToColumns', () => {
  describe('basic field extraction', () => {
    it('extracts basic string and number fields', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number()
      });

      const columns = zodSchemaToColumns(schema);

      expect(columns).toHaveLength(2);
      expect(columns[0]).toMatchObject({
        id: 'name',
        label: 'Name',
        type: 'string'
      });
      expect(columns[0].validators).toContainEqual({ type: 'required' });

      expect(columns[1]).toMatchObject({
        id: 'age',
        label: 'Age',
        type: 'number'
      });
      expect(columns[1].validators).toContainEqual({ type: 'required' });
    });

    it('extracts date fields', () => {
      const schema = z.object({
        birthDate: z.date()
      });

      const columns = zodSchemaToColumns(schema);

      expect(columns[0]).toMatchObject({
        id: 'birthDate',
        label: 'Birth Date',
        type: 'date'
      });
      expect(columns[0].validators).toContainEqual({ type: 'required' });
    });

    it('formats labels correctly', () => {
      const schema = z.object({
        firstName: z.string(),
        email_address: z.string(),
        phoneNumber: z.string()
      });

      const columns = zodSchemaToColumns(schema);

      expect(columns[0].label).toBe('First Name');
      expect(columns[1].label).toBe('Email address');
      expect(columns[2].label).toBe('Phone Number');
    });
  });

  describe('optional fields', () => {
    it('detects optional fields (no required validator)', () => {
      const schema = z.object({
        phone: z.string().optional()
      });

      const columns: Column[] = zodSchemaToColumns(schema);

      // Optional fields should NOT have required validator
      expect(columns[0].validators || []).not.toContainEqual({ type: 'required' });
    });

    it('detects required fields (has required validator)', () => {
      const schema = z.object({
        email: z.string()
      });

      const columns: Column[] = zodSchemaToColumns(schema);

      // Required fields should have required validator
      expect(columns[0].validators).toContainEqual({ type: 'required' });
    });

    it('handles nullable fields (still required)', () => {
      const schema = z.object({
        middleName: z.string().nullable()
      });

      const columns: Column[] = zodSchemaToColumns(schema);

      // Nullable is still required unless also optional
      expect(columns[0].validators).toContainEqual({ type: 'required' });
    });
  });

  describe('validator extraction', () => {
    it('extracts min_length validator from string', () => {
      const schema = z.object({
        name: z.string().min(5, 'Too short')
      });

      const columns = zodSchemaToColumns(schema);

      expect(columns[0].validators).toContainEqual({
        type: 'min_length',
        value: 5,
        message: 'Too short'
      });
    });

    it('extracts max_length validator from string', () => {
      const schema = z.object({
        username: z.string().max(20, 'Too long')
      });

      const columns = zodSchemaToColumns(schema);

      expect(columns[0].validators).toContainEqual({
        type: 'max_length',
        value: 20,
        message: 'Too long'
      });
    });

    it('extracts min validator from number', () => {
      const schema = z.object({
        age: z.number().min(18, 'Must be 18+')
      });

      const columns = zodSchemaToColumns(schema);

      expect(columns[0].validators).toContainEqual({
        type: 'min',
        value: 18,
        message: 'Must be 18+'
      });
    });

    it('extracts max validator from number', () => {
      const schema = z.object({
        score: z.number().max(100, 'Max is 100')
      });

      const columns = zodSchemaToColumns(schema);

      expect(columns[0].validators).toContainEqual({
        type: 'max',
        value: 100,
        message: 'Max is 100'
      });
    });

    it('extracts regex validator', () => {
      const schema = z.object({
        code: z.string().regex(/^[A-Z]+$/, 'Must be uppercase')
      });

      const columns = zodSchemaToColumns(schema);

      expect(columns[0].validators).toContainEqual({
        type: 'regex',
        pattern: '^[A-Z]+$',
        message: 'Must be uppercase'
      });
    });

    it('includes required validator for required fields', () => {
      const schema = z.object({
        name: z.string()
      });

      const columns = zodSchemaToColumns(schema);

      expect(columns[0].validators).toContainEqual({
        type: 'required'
      });
    });

    it('excludes required validator for optional fields', () => {
      const schema = z.object({
        name: z.string().optional()
      });

      const columns = zodSchemaToColumns(schema);

      expect(columns[0].validators || []).not.toContainEqual({
        type: 'required'
      });
    });

    it('extracts multiple validators', () => {
      const schema = z.object({
        password: z.string().min(8).max(100).regex(/^(?=.*[A-Z])/)
      });

      const columns = zodSchemaToColumns(schema);

      expect(columns[0].validators).toHaveLength(4); // required + min_length + max_length + regex
      expect(columns[0].validators).toContainEqual({ type: 'required' });
      expect(columns[0].validators).toContainEqual(
        expect.objectContaining({ type: 'min_length', value: 8 })
      );
      expect(columns[0].validators).toContainEqual(
        expect.objectContaining({ type: 'max_length', value: 100 })
      );
      expect(columns[0].validators).toContainEqual(
        expect.objectContaining({ type: 'regex' })
      );
    });
  });

  describe('type inference', () => {
    it('detects email type', () => {
      const schema = z.object({
        email: z.string().email()
      });

      const columns = zodSchemaToColumns(schema);

      expect(columns[0].type).toBe('email');
    });

    it('detects email type on optional fields', () => {
      const schema = z.object({
        email: z.string().email().optional()
      });

      const columns = zodSchemaToColumns(schema);

      expect(columns[0].type).toBe('email');
    });

    it('defaults to string for boolean', () => {
      const schema = z.object({
        active: z.boolean()
      });

      const columns = zodSchemaToColumns(schema);

      expect(columns[0].type).toBe('string');
    });
  });

  describe('enum handling', () => {
    it('converts enum to select type with options', () => {
      const schema = z.object({
        role: z.enum(['admin', 'user', 'guest'])
      });

      const columns = zodSchemaToColumns(schema);

      expect(columns[0]).toMatchObject({
        type: 'select',
        options: ['admin', 'user', 'guest']
      });
    });

    it('handles optional enums', () => {
      const schema = z.object({
        department: z.enum(['engineering', 'sales', 'marketing']).optional()
      });

      const columns = zodSchemaToColumns(schema);

      expect(columns[0]).toMatchObject({
        type: 'select',
        options: ['engineering', 'sales', 'marketing']
      });
      expect(columns[0].validators || []).not.toContainEqual({ type: 'required' });
    });
  });

  describe('transformation extraction', () => {
    it('detects trim transformation', () => {
      const schema = z.object({
        email: z.string().transform(s => s.trim())
      });

      const columns = zodSchemaToColumns(schema);

      expect(columns[0].transformations).toContainEqual({
        type: 'trim'
      });
    });

    it('detects lowercase transformation', () => {
      const schema = z.object({
        email: z.string().transform(s => s.toLowerCase())
      });

      const columns = zodSchemaToColumns(schema);

      expect(columns[0].transformations).toContainEqual({
        type: 'lowercase'
      });
    });

    it('detects uppercase transformation', () => {
      const schema = z.object({
        code: z.string().transform(s => s.toUpperCase())
      });

      const columns = zodSchemaToColumns(schema);

      expect(columns[0].transformations).toContainEqual({
        type: 'uppercase'
      });
    });

    it('detects multiple transformations', () => {
      const schema = z.object({
        email: z.string().transform(s => s.trim()).transform(s => s.toLowerCase())
      });

      const columns = zodSchemaToColumns(schema);

      expect(columns[0].transformations).toHaveLength(2);
      expect(columns[0].transformations).toContainEqual({ type: 'trim' });
      expect(columns[0].transformations).toContainEqual({ type: 'lowercase' });
    });
  });

  describe('description extraction', () => {
    it('extracts description from describe()', () => {
      const schema = z.object({
        email: z.string().describe('User email address')
      });

      const columns = zodSchemaToColumns(schema);

      expect(columns[0].description).toBe('User email address');
    });

    it('extracts description from optional field', () => {
      const schema = z.object({
        phone: z.string().optional().describe('Contact phone number')
      });

      const columns = zodSchemaToColumns(schema);

      expect(columns[0].description).toBe('Contact phone number');
    });

    it('returns undefined when no description', () => {
      const schema = z.object({
        name: z.string()
      });

      const columns = zodSchemaToColumns(schema);

      expect(columns[0].description).toBeUndefined();
    });
  });

  describe('complex schemas', () => {
    it('handles comprehensive user schema', () => {
      const schema = z.object({
        firstName: z.string().min(1, 'Required'),
        lastName: z.string().min(1, 'Required'),
        email: z.string().email('Invalid email'),
        age: z.number().min(18, 'Must be 18+').max(120, 'Invalid age'),
        department: z.enum(['engineering', 'sales', 'marketing']),
        phone: z.string().optional().describe('Contact phone number'),
        bio: z.string().max(500, 'Too long').optional()
      });

      const columns = zodSchemaToColumns(schema);

      expect(columns).toHaveLength(7);

      // firstName
      expect(columns[0]).toMatchObject({
        id: 'firstName',
        label: 'First Name',
        type: 'string'
      });
      expect(columns[0].validators).toContainEqual({ type: 'required' });

      // email
      expect(columns[2]).toMatchObject({
        id: 'email',
        type: 'email'
      });
      expect(columns[2].validators).toContainEqual({ type: 'required' });

      // age
      expect(columns[3]).toMatchObject({
        id: 'age',
        type: 'number'
      });
      expect(columns[3].validators).toHaveLength(3); // required + min + max

      // department
      expect(columns[4]).toMatchObject({
        type: 'select',
        options: ['engineering', 'sales', 'marketing']
      });
      expect(columns[4].validators).toContainEqual({ type: 'required' });

      // phone (optional)
      expect(columns[5]).toMatchObject({
        id: 'phone',
        description: 'Contact phone number'
      });
      expect(columns[5].validators || []).not.toContainEqual({ type: 'required' });

      // bio (optional with max)
      expect(columns[6]).toMatchObject({
        id: 'bio'
      });
      expect(columns[6].validators || []).not.toContainEqual({ type: 'required' });
      expect(columns[6].validators).toContainEqual(
        expect.objectContaining({ type: 'max_length', value: 500 })
      );
    });
  });

  describe('edge cases', () => {
    it('returns empty array for non-object schema', () => {
      const schema = z.string();
      const columns = zodSchemaToColumns(schema);
      expect(columns).toEqual([]);
    });

    it('returns empty array for array schema', () => {
      const schema = z.array(z.string());
      const columns = zodSchemaToColumns(schema);
      expect(columns).toEqual([]);
    });

    it('handles empty object schema', () => {
      const schema = z.object({});
      const columns = zodSchemaToColumns(schema);
      expect(columns).toEqual([]);
    });

    it('handles fields without validators', () => {
      const schema = z.object({
        name: z.string()
      });

      const columns = zodSchemaToColumns(schema);

      // Should only have required validator
      expect(columns[0].validators).toHaveLength(1);
      expect(columns[0].validators).toContainEqual({ type: 'required' });
    });

    it('handles validators without custom messages', () => {
      const schema = z.object({
        name: z.string().min(5)
      });

      const columns = zodSchemaToColumns(schema);

      const minValidator = columns[0].validators?.find(v => v.type === 'min_length');
      expect(minValidator).toBeDefined();
      expect(minValidator?.message).toBeUndefined();
    });
  });
});
