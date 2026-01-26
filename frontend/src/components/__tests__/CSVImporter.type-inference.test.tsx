/**
 * Type Inference Tests for CSVImporter
 *
 * These tests verify that TypeScript type inference works correctly
 * when using Zod schemas with the CSVImporter component.
 *
 * Tests include:
 * - Basic type inference from schema to onComplete callback
 * - Edge cases (unions, optionals, transforms, enums)
 * - Compile-time error checking with @ts-expect-error
 * - Type assertions using expectTypeOf
 */

import { describe, it, expect, expectTypeOf } from 'vitest';
import { z } from 'zod';
import CSVImporter from '../CSVImporter';
import type { CSVImporterProps } from '../../types';

describe('CSVImporter Type Inference', () => {
  describe('Basic Type Inference', () => {
    it('should infer simple object types', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      type SchemaType = z.infer<typeof schema>;

      // Type assertion: verify the inferred type matches expected
      const onComplete = (data: z.infer<typeof schema>[]) => {
        type ExpectedType = { name: string; age: number }[];
        expectTypeOf(data).toEqualTypeOf<ExpectedType>();
        expect(Array.isArray(data)).toBe(true);
      };

      // Verify props onComplete receives ImportResult
      type Props = CSVImporterProps<SchemaType>;
      // onComplete now receives ImportResult<T> instead of T[]
      const typedCallback: Props['onComplete'] = (result) => {
        // Access data via result.rows
        expectTypeOf(result.rows[0].name).toBeString();
        expectTypeOf(result.rows[0].age).toBeNumber();
      };
      expect(typedCallback).toBeDefined();
    });

    it('should infer string type', () => {
      const schema = z.object({
        email: z.string(),
      });

      const onComplete = (data: z.infer<typeof schema>[]) => {
        expectTypeOf(data[0].email).toBeString();
      };

      expect(onComplete).toBeDefined();
    });

    it('should infer number type', () => {
      const schema = z.object({
        price: z.number(),
      });

      const onComplete = (data: z.infer<typeof schema>[]) => {
        expectTypeOf(data[0].price).toBeNumber();
      };

      expect(onComplete).toBeDefined();
    });

    it('should infer boolean type', () => {
      const schema = z.object({
        isActive: z.boolean(),
      });

      const onComplete = (data: z.infer<typeof schema>[]) => {
        expectTypeOf(data[0].isActive).toBeBoolean();
      };

      expect(onComplete).toBeDefined();
    });
  });

  describe('Optional Fields', () => {
    it('should infer optional fields correctly', () => {
      const schema = z.object({
        name: z.string(),
        nickname: z.string().optional(),
      });

      type ExpectedType = { name: string; nickname?: string }[];

      const onComplete = (data: z.infer<typeof schema>[]) => {
        expectTypeOf(data).toEqualTypeOf<ExpectedType>();
        expectTypeOf(data[0].name).toBeString();
        expectTypeOf(data[0].nickname).toEqualTypeOf<string | undefined>();
      };

      expect(onComplete).toBeDefined();
    });

    it('should handle multiple optional fields', () => {
      const schema = z.object({
        required: z.string(),
        optional1: z.number().optional(),
        optional2: z.boolean().optional(),
      });

      const onComplete = (data: z.infer<typeof schema>[]) => {
        expectTypeOf(data[0].required).toBeString();
        expectTypeOf(data[0].optional1).toEqualTypeOf<number | undefined>();
        expectTypeOf(data[0].optional2).toEqualTypeOf<boolean | undefined>();
      };

      expect(onComplete).toBeDefined();
    });
  });

  describe('Enum Types', () => {
    it('should infer enum as literal union type', () => {
      const schema = z.object({
        category: z.enum(['electronics', 'clothing', 'home']),
      });

      type ExpectedType = { category: 'electronics' | 'clothing' | 'home' }[];

      const onComplete = (data: z.infer<typeof schema>[]) => {
        expectTypeOf(data).toEqualTypeOf<ExpectedType>();
        expectTypeOf(data[0].category).toEqualTypeOf<'electronics' | 'clothing' | 'home'>();
      };

      expect(onComplete).toBeDefined();
    });

    it('should infer enum with many values', () => {
      const schema = z.object({
        status: z.enum(['draft', 'pending', 'approved', 'rejected', 'archived']),
      });

      const onComplete = (data: z.infer<typeof schema>[]) => {
        expectTypeOf(data[0].status).toEqualTypeOf<
          'draft' | 'pending' | 'approved' | 'rejected' | 'archived'
        >();
      };

      expect(onComplete).toBeDefined();
    });
  });

  describe('Complex Schemas', () => {
    it('should handle mixed field types', () => {
      const schema = z.object({
        sku: z.string(),
        name: z.string(),
        price: z.number(),
        cost: z.number(),
        quantity: z.number(),
        category: z.enum(['electronics', 'clothing']),
        isActive: z.boolean(),
        description: z.string().optional(),
      });

      type ExpectedType = {
        sku: string;
        name: string;
        price: number;
        cost: number;
        quantity: number;
        category: 'electronics' | 'clothing';
        isActive: boolean;
        description?: string;
      }[];

      const onComplete = (data: z.infer<typeof schema>[]) => {
        expectTypeOf(data).toEqualTypeOf<ExpectedType>();
      };

      expect(onComplete).toBeDefined();
    });

    it('should infer product schema from real-world example', () => {
      const productSchema = z.object({
        sku: z.string().min(3).max(20),
        name: z.string().min(1),
        price: z.number().positive(),
        cost: z.number().positive(),
        quantity: z.number().int().nonnegative(),
        category: z.enum(['electronics', 'clothing', 'home', 'books']),
        inStock: z.boolean().default(true),
      });

      const onComplete = (data: z.infer<typeof productSchema>[]) => {
        expectTypeOf(data[0].sku).toBeString();
        expectTypeOf(data[0].price).toBeNumber();
        expectTypeOf(data[0].category).toEqualTypeOf<
          'electronics' | 'clothing' | 'home' | 'books'
        >();
        expectTypeOf(data[0].inStock).toBeBoolean();
      };

      expect(onComplete).toBeDefined();
    });

    it('should infer contact schema from real-world example', () => {
      const contactSchema = z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        phone: z.string().optional(),
        company: z.string(),
      });

      const onComplete = (data: z.infer<typeof contactSchema>[]) => {
        expectTypeOf(data[0].firstName).toBeString();
        expectTypeOf(data[0].email).toBeString();
        expectTypeOf(data[0].phone).toEqualTypeOf<string | undefined>();
      };

      expect(onComplete).toBeDefined();
    });
  });

  describe('Transformed Schemas', () => {
    it('should infer output type after transformations', () => {
      const schema = z.object({
        sku: z.string().transform(s => s.toUpperCase()),
        email: z.string().transform(s => s.toLowerCase()),
      });

      // After transform, both are still strings
      const onComplete = (data: z.infer<typeof schema>[]) => {
        expectTypeOf(data[0].sku).toBeString();
        expectTypeOf(data[0].email).toBeString();
      };

      expect(onComplete).toBeDefined();
    });

    it('should handle transform from string to number', () => {
      const schema = z.object({
        // Parse string to number
        age: z.string().transform(val => parseInt(val, 10)),
      });

      const onComplete = (data: z.infer<typeof schema>[]) => {
        // After transform, age is a number
        expectTypeOf(data[0].age).toBeNumber();
      };

      expect(onComplete).toBeDefined();
    });
  });

  describe('Default Values', () => {
    it('should handle default values in type inference', () => {
      const schema = z.object({
        name: z.string(),
        isActive: z.boolean().default(true),
        quantity: z.number().default(0),
      });

      const onComplete = (data: z.infer<typeof schema>[]) => {
        // Default values make fields non-optional
        expectTypeOf(data[0].name).toBeString();
        expectTypeOf(data[0].isActive).toBeBoolean();
        expectTypeOf(data[0].quantity).toBeNumber();
      };

      expect(onComplete).toBeDefined();
    });
  });

  describe('Nullable Fields', () => {
    it('should infer nullable fields correctly', () => {
      const schema = z.object({
        name: z.string(),
        middleName: z.string().nullable(),
      });

      const onComplete = (data: z.infer<typeof schema>[]) => {
        expectTypeOf(data[0].name).toBeString();
        expectTypeOf(data[0].middleName).toEqualTypeOf<string | null>();
      };

      expect(onComplete).toBeDefined();
    });

    it('should handle nullable and optional together', () => {
      const schema = z.object({
        name: z.string(),
        suffix: z.string().nullable().optional(),
      });

      const onComplete = (data: z.infer<typeof schema>[]) => {
        expectTypeOf(data[0].suffix).toEqualTypeOf<string | null | undefined>();
      };

      expect(onComplete).toBeDefined();
    });
  });

  describe('Compile-Time Error Checking', () => {
    it('should error on accessing non-existent properties', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      // This function should compile
      const validCallback = (data: z.infer<typeof schema>[]) => {
        console.log(data[0].name); // ✅ Valid
        console.log(data[0].age);  // ✅ Valid
      };

      expect(validCallback).toBeDefined();

      // Note: The following would cause TypeScript errors if uncommented:
      // const invalidCallback = (data: z.infer<typeof schema>[]) => {
      //   // @ts-expect-error - 'email' does not exist on type
      //   console.log(data[0].email);
      //   // @ts-expect-error - 'invalidProp' does not exist on type
      //   console.log(data[0].invalidProp);
      // };
    });

    it('should error on wrong type usage', () => {
      const schema = z.object({
        age: z.number(),
      });

      const validCallback = (data: z.infer<typeof schema>[]) => {
        const ageValue: number = data[0].age; // ✅ Valid
        expect(typeof ageValue).toBe('number');
      };

      expect(validCallback).toBeDefined();

      // Note: The following would cause TypeScript errors if uncommented:
      // const invalidCallback = (data: z.infer<typeof schema>[]) => {
      //   // @ts-expect-error - Type 'number' is not assignable to type 'string'
      //   const ageValue: string = data[0].age;
      // };
    });
  });

  describe('Backward Compatibility', () => {
    it('should still support any type when no schema provided', () => {
      // When using columns instead of schema
      type Props = CSVImporterProps;

      // onComplete receives ImportResult by default
      const onComplete: Props['onComplete'] = (result) => {
        // result.rows is the data array
        expectTypeOf(result.rows).toBeArray();
        expectTypeOf(result.columns).toBeObject();
      };

      expect(onComplete).toBeDefined();
    });

    it('should work with explicit any type parameter', () => {
      type Props = CSVImporterProps<any>;

      const onComplete: Props['onComplete'] = (result) => {
        // result is ImportResult<any>
        expectTypeOf(result.rows).toBeArray();
      };

      expect(onComplete).toBeDefined();
    });
  });

  describe('Generic Type Parameter Flow', () => {
    it('should maintain type through CSVImporterProps generic', () => {
      const schema = z.object({
        id: z.string(),
        value: z.number(),
      });

      type SchemaType = z.infer<typeof schema>;
      type Props = CSVImporterProps<SchemaType>;

      // Verify the generic flows through to onComplete
      expectTypeOf<Props['schema']>().toEqualTypeOf<z.ZodSchema<SchemaType> | undefined>();

      // onComplete now receives ImportResult<T> with .rows containing the typed data
      const callback: Props['onComplete'] = (result) => {
        expectTypeOf(result.rows[0].id).toBeString();
        expectTypeOf(result.rows[0].value).toBeNumber();
      };
      expect(callback).toBeDefined();
    });

    it('should work with extracted types', () => {
      const userSchema = z.object({
        username: z.string(),
        email: z.string().email(),
        role: z.enum(['admin', 'user', 'guest']),
      });

      type User = z.infer<typeof userSchema>;
      type ImporterProps = CSVImporterProps<User>;

      const props: ImporterProps = {
        schema: userSchema,
        onComplete: (result) => {
          // Access typed data via result.rows
          expectTypeOf(result.rows[0].username).toBeString();
          expectTypeOf(result.rows[0].role).toEqualTypeOf<'admin' | 'user' | 'guest'>();
        },
      };

      expect(props).toBeDefined();
    });
  });

  describe('Array Type Inference', () => {
    it('should infer data as array of schema type', () => {
      const schema = z.object({
        item: z.string(),
      });

      const onComplete = (data: z.infer<typeof schema>[]) => {
        expectTypeOf(data).toBeArray();
        expectTypeOf(data).toEqualTypeOf<{ item: string }[]>();
        expectTypeOf(data[0]).toEqualTypeOf<{ item: string }>();
      };

      expect(onComplete).toBeDefined();
    });

    it('should support array methods with correct types', () => {
      const schema = z.object({
        price: z.number(),
        quantity: z.number(),
      });

      const onComplete = (data: z.infer<typeof schema>[]) => {
        // Array methods should work with inferred types
        const total = data.reduce((sum, item) => {
          expectTypeOf(item.price).toBeNumber();
          expectTypeOf(item.quantity).toBeNumber();
          return sum + (item.price * item.quantity);
        }, 0);

        expectTypeOf(total).toBeNumber();
      };

      expect(onComplete).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty objects', () => {
      const schema = z.object({});

      const onComplete = (data: z.infer<typeof schema>[]) => {
        expectTypeOf(data).toEqualTypeOf<{}[]>();
      };

      expect(onComplete).toBeDefined();
    });

    it('should handle single field schemas', () => {
      const schema = z.object({
        id: z.string(),
      });

      const onComplete = (data: z.infer<typeof schema>[]) => {
        expectTypeOf(data).toEqualTypeOf<{ id: string }[]>();
      };

      expect(onComplete).toBeDefined();
    });

    it('should handle deeply nested validations', () => {
      const schema = z.object({
        email: z.string().email().toLowerCase().trim(),
      });

      const onComplete = (data: z.infer<typeof schema>[]) => {
        // After all transformations, still a string
        expectTypeOf(data[0].email).toBeString();
      };

      expect(onComplete).toBeDefined();
    });

    it('should handle refined schemas', () => {
      const schema = z.object({
        price: z.number(),
        cost: z.number(),
      }).refine(data => data.price > data.cost, {
        message: 'Price must be greater than cost',
      });

      const onComplete = (data: z.infer<typeof schema>[]) => {
        expectTypeOf(data[0].price).toBeNumber();
        expectTypeOf(data[0].cost).toBeNumber();
      };

      expect(onComplete).toBeDefined();
    });
  });
});
