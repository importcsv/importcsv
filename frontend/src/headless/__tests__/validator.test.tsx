// frontend/src/headless/__tests__/validator.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/preact';
import { z } from 'zod';
import { Root } from '../root';
import { Validator } from '../validator';
import { fixtures } from '../../test/helpers';

describe('CSV.Validator - Zod Integration', () => {
  it('should validate data using Zod schema and return errors', async () => {
    const schema = z.object({
      email: z.string().email(),
      age: z.number().positive()
    });

    const mockData = {
      rows: [
        { email: 'valid@example.com', age: 25 },
        { email: 'invalid-email', age: 25 },
        { email: 'valid@example.com', age: -5 }
      ]
    };

    let validateFn: any;

    render(
      <Root schema={schema} onComplete={() => {}} data={mockData}>
        <Validator>
          {({ validate }) => {
            validateFn = validate;
            return null;
          }}
        </Validator>
      </Root>
    );

    // Call validate after render
    const errors = await validateFn();
    expect(errors).toHaveLength(2);
    expect(errors[0].column).toBe('email');
    expect(errors[1].column).toBe('age');
  });

  it('should validate real CSV fixture data', async () => {
    const schema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
      age: z.coerce.number().positive().max(120),
      company: z.string().min(1)
    });

    // Load malformed CSV fixture
    const fixtureData = fixtures.malformed();

    let validateFn: any;

    render(
      <Root schema={schema} onComplete={() => {}} data={fixtureData}>
        <Validator>
          {({ validate }) => {
            validateFn = validate;
            return null;
          }}
        </Validator>
      </Root>
    );

    const errors = await validateFn();

    // Malformed CSV should have validation errors
    expect(errors.length).toBeGreaterThan(0);

    // Check specific errors exist
    const emailErrors = errors.filter((e: any) => e.column === 'email');
    expect(emailErrors.length).toBeGreaterThan(0);
  });

  it('should handle valid data without errors', async () => {
    const schema = z.object({
      name: z.string(),
      email: z.string().email()
    });

    const mockData = {
      rows: [
        { name: 'John Doe', email: 'john@example.com' },
        { name: 'Jane Smith', email: 'jane@example.com' }
      ]
    };

    let validateFn: any;

    render(
      <Root schema={schema} onComplete={() => {}} data={mockData}>
        <Validator>
          {({ validate }) => {
            validateFn = validate;
            return null;
          }}
        </Validator>
      </Root>
    );

    // Call validate after render
    const errors = await validateFn();
    expect(errors).toHaveLength(0);
  });

  it('should validate valid CSV fixture without errors', async () => {
    const schema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
      phone: z.string().optional(),
      company: z.string().min(1)
    });

    // Load valid CSV fixture
    const fixtureData = fixtures.valid();

    let validateFn: any;

    render(
      <Root schema={schema} onComplete={() => {}} data={fixtureData}>
        <Validator>
          {({ validate }) => {
            validateFn = validate;
            return null;
          }}
        </Validator>
      </Root>
    );

    const errors = await validateFn();

    // Valid CSV should have no errors
    expect(errors).toHaveLength(0);
  });

  it('should handle large CSV files efficiently', async () => {
    const schema = z.object({
      name: z.string(),
      email: z.string().email(),
      phone: z.string(),
      company: z.string()
    });

    // Load large CSV fixture (1000 rows)
    const fixtureData = fixtures.large();

    let validateFn: any;

    render(
      <Root schema={schema} onComplete={() => {}} data={fixtureData}>
        <Validator>
          {({ validate }) => {
            validateFn = validate;
            return null;
          }}
        </Validator>
      </Root>
    );

    // Performance test: should validate 1000 rows in reasonable time
    const startTime = performance.now();
    const errors = await validateFn();
    const endTime = performance.now();

    const duration = endTime - startTime;

    // Should complete in less than 1 second
    expect(duration).toBeLessThan(1000);

    // Large CSV should validate successfully (all rows are valid)
    expect(errors).toHaveLength(0);
  });

  it('should handle validation without schema or data', async () => {
    let validateFn: any;

    render(
      <Root columns={[{ id: 'name', label: 'Name' }]} onComplete={() => {}}>
        <Validator>
          {({ validate }) => {
            validateFn = validate;
            return null;
          }}
        </Validator>
      </Root>
    );

    // Should return empty errors when no schema or data
    const errors = await validateFn();
    expect(errors).toHaveLength(0);
  });

  it('should expose isValidating state during validation', async () => {
    const schema = z.object({
      email: z.string().email()
    });

    const mockData = {
      rows: [{ email: 'test@example.com' }]
    };

    let validateFn: any;
    let validatingStates: boolean[] = [];

    const TestComponent = ({ isValidating }: { isValidating: boolean }) => {
      validatingStates.push(isValidating);
      return null;
    };

    render(
      <Root schema={schema} onComplete={() => {}} data={mockData}>
        <Validator>
          {({ validate, isValidating }) => {
            validateFn = validate;
            return <TestComponent isValidating={isValidating} />;
          }}
        </Validator>
      </Root>
    );

    // Initial state should be false
    expect(validatingStates[validatingStates.length - 1]).toBe(false);

    // Validate
    await validateFn();

    // Should have captured validating state changes
    expect(validatingStates.length).toBeGreaterThan(1);
  });
});
