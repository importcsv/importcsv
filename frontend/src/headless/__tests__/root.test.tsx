// frontend/src/headless/__tests__/root.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/preact';
import { z } from 'zod';
import { Root, useCSV } from '../root';

describe('CSV.Root - Zod Schema Support', () => {
  it('should provide context with Zod schema', () => {
    const schema = z.object({
      name: z.string(),
      email: z.string().email()
    });

    const TestComponent = () => {
      const ctx = useCSV();
      return <div data-testid="schema">{ctx.schema ? 'has schema' : 'no schema'}</div>;
    };

    render(
      <Root schema={schema} onComplete={() => {}}>
        <TestComponent />
      </Root>
    );

    expect(screen.getByTestId('schema')).toHaveTextContent('has schema');
  });

  it('should convert Zod schema to Column[] for internal use', () => {
    const schema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
      age: z.number().optional()
    });

    const TestComponent = () => {
      const ctx = useCSV();
      return (
        <div>
          {ctx.columns.map(col => (
            <div key={col.id} data-testid={`col-${col.id}`}>
              {col.id}:{col.required ? 'required' : 'optional'}
            </div>
          ))}
        </div>
      );
    };

    render(
      <Root schema={schema} onComplete={() => {}}>
        <TestComponent />
      </Root>
    );

    expect(screen.getByTestId('col-name')).toHaveTextContent('name:required');
    expect(screen.getByTestId('col-email')).toHaveTextContent('email:required');
    expect(screen.getByTestId('col-age')).toHaveTextContent('age:optional');
  });

  it('should validate data using Zod schema', () => {
    const schema = z.object({
      email: z.string().email()
    });

    const TestComponent = () => {
      const ctx = useCSV();
      const result = ctx.validate({ email: 'invalid' });
      return <div data-testid="valid">{result.success ? 'valid' : 'invalid'}</div>;
    };

    render(
      <Root schema={schema} onComplete={() => {}}>
        <TestComponent />
      </Root>
    );

    expect(screen.getByTestId('valid')).toHaveTextContent('invalid');
  });

  it('should support legacy columns array (backward compatibility)', () => {
    const columns = [
      { id: 'name', label: 'Name', type: 'string', required: true },
      { id: 'email', label: 'Email', type: 'email', required: true }
    ];

    const TestComponent = () => {
      const ctx = useCSV();
      return <div data-testid="cols">{ctx.columns.length}</div>;
    };

    render(
      <Root columns={columns} onComplete={() => {}}>
        <TestComponent />
      </Root>
    );

    expect(screen.getByTestId('cols')).toHaveTextContent('2');
  });

  it('should validate data without schema (legacy columns)', () => {
    const columns = [
      { id: 'name', label: 'Name', type: 'string', required: true }
    ];

    const TestComponent = () => {
      const ctx = useCSV();
      const result = ctx.validate({ name: 'John' });
      return <div data-testid="valid">{result.success ? 'valid' : 'invalid'}</div>;
    };

    render(
      <Root columns={columns} onComplete={() => {}}>
        <TestComponent />
      </Root>
    );

    // Without schema, validation should always succeed
    expect(screen.getByTestId('valid')).toHaveTextContent('valid');
  });

  it('should throw error when useCSV is used outside Root', () => {
    const TestComponent = () => {
      try {
        useCSV();
        return <div data-testid="error">no error</div>;
      } catch (error) {
        return <div data-testid="error">{(error as Error).message}</div>;
      }
    };

    render(<TestComponent />);

    expect(screen.getByTestId('error')).toHaveTextContent('useCSV must be used within a CSV.Root component');
  });
});
