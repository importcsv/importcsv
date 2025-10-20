/**
 * Compile-Time Type Error Tests for CSVImporter
 *
 * This file tests that TypeScript CORRECTLY REJECTS invalid code.
 * These tests use @ts-expect-error to verify that certain code patterns
 * produce TypeScript errors as expected.
 *
 * These tests ensure type safety by verifying that:
 * 1. Invalid property access is caught at compile time
 * 2. Wrong type assignments are rejected
 * 3. Type inference properly constrains the API
 *
 * NOTE: If these tests fail, it means TypeScript is NOT catching
 * errors that it should catch - which is a regression in type safety.
 */

import { z } from 'zod';
import type { CSVImporterProps } from '../../types';

describe('CSVImporter Type Error Tests', () => {
  describe('Invalid Property Access', () => {
    it('should error on non-existent properties', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      });

      type Props = CSVImporterProps<z.infer<typeof schema>>;

      // Valid callback - should compile
      const validCallback: Props['onComplete'] = (data) => {
        console.log(data[0].name);
        console.log(data[0].age);
      };

      // Invalid callback - should NOT compile
      const invalidCallback: Props['onComplete'] = (data) => {
        // @ts-expect-error - Property 'email' does not exist on type
        console.log(data[0].email);

        // @ts-expect-error - Property 'invalidProp' does not exist on type
        console.log(data[0].invalidProp);

        // @ts-expect-error - Property 'firstName' does not exist on type
        const firstName = data[0].firstName;
      };

      // Suppress unused variable warnings
      void validCallback;
      void invalidCallback;
    });

    it('should error on accessing optional properties incorrectly', () => {
      const schema = z.object({
        required: z.string(),
        optional: z.string().optional(),
      });

      type Props = CSVImporterProps<z.infer<typeof schema>>;

      const callback: Props['onComplete'] = (data) => {
        // Valid - optional exists
        const opt = data[0].optional;

        // @ts-expect-error - 'notOptional' does not exist
        const invalid = data[0].notOptional;

        void opt;
        void invalid;
      };

      void callback;
    });
  });

  describe('Wrong Type Assignments', () => {
    it('should error when assigning to wrong types', () => {
      const schema = z.object({
        age: z.number(),
        name: z.string(),
        isActive: z.boolean(),
      });

      type Props = CSVImporterProps<z.infer<typeof schema>>;

      const callback: Props['onComplete'] = (data) => {
        // Valid assignments
        const age: number = data[0].age;
        const name: string = data[0].name;
        const isActive: boolean = data[0].isActive;

        // @ts-expect-error - Type 'number' is not assignable to type 'string'
        const wrongAge: string = data[0].age;

        // @ts-expect-error - Type 'string' is not assignable to type 'number'
        const wrongName: number = data[0].name;

        // @ts-expect-error - Type 'boolean' is not assignable to type 'string'
        const wrongActive: string = data[0].isActive;

        void age;
        void name;
        void isActive;
        void wrongAge;
        void wrongName;
        void wrongActive;
      };

      void callback;
    });

    it('should error on enum type mismatches', () => {
      const schema = z.object({
        category: z.enum(['electronics', 'clothing', 'home']),
      });

      type Props = CSVImporterProps<z.infer<typeof schema>>;

      const callback: Props['onComplete'] = (data) => {
        // Valid assignment
        const cat: 'electronics' | 'clothing' | 'home' = data[0].category;

        // @ts-expect-error - Type 'electronics' | 'clothing' | 'home' is not assignable to type 'string'
        // (more specific type cannot be assigned to broader type in strict mode)
        const wrongCat: 'invalid' = data[0].category;

        void cat;
        void wrongCat;
      };

      void callback;
    });
  });

  describe('Optional Field Type Errors', () => {
    it('should error when treating optional as required', () => {
      const schema = z.object({
        name: z.string(),
        nickname: z.string().optional(),
      });

      type Props = CSVImporterProps<z.infer<typeof schema>>;

      const callback: Props['onComplete'] = (data) => {
        // Valid - required field
        const name: string = data[0].name;

        // Valid - optional with undefined
        const nickname: string | undefined = data[0].nickname;

        // @ts-expect-error - Type 'string | undefined' is not assignable to type 'string'
        const wrongNickname: string = data[0].nickname;

        void name;
        void nickname;
        void wrongNickname;
      };

      void callback;
    });

    it('should error on missing required fields', () => {
      const schema = z.object({
        id: z.string(),
        email: z.string().email(),
      });

      type Data = z.infer<typeof schema>;

      // @ts-expect-error - Property 'email' is missing in type
      const invalidData: Data = { id: '123' };

      // @ts-expect-error - Property 'id' is missing in type
      const invalidData2: Data = { email: 'test@test.com' };

      // Valid
      const validData: Data = { id: '123', email: 'test@test.com' };

      void invalidData;
      void invalidData2;
      void validData;
    });
  });

  describe('Schema Type Mismatch', () => {
    it('should error when schema does not match generic', () => {
      const stringSchema = z.object({
        name: z.string(),
      });

      const numberSchema = z.object({
        age: z.number(),
      });

      // Valid
      type ValidProps = CSVImporterProps<z.infer<typeof stringSchema>>;
      const validProps: ValidProps = {
        schema: stringSchema,
        onComplete: (data) => {
          console.log(data[0].name);
        },
      };

      // Invalid - schema doesn't match the generic type
      type InvalidProps = CSVImporterProps<z.infer<typeof stringSchema>>;
      const invalidProps: InvalidProps = {
        // @ts-expect-error - Type mismatch between schema and generic
        schema: numberSchema,
        onComplete: (data) => {
          console.log(data[0].name);
        },
      };

      void validProps;
      void invalidProps;
    });
  });

  describe('onComplete Callback Type Errors', () => {
    it('should error when callback parameter type is wrong', () => {
      const schema = z.object({
        id: z.string(),
        value: z.number(),
      });

      type Props = CSVImporterProps<z.infer<typeof schema>>;

      // Valid
      const validCallback: Props['onComplete'] = (data) => {
        console.log(data[0].id, data[0].value);
      };

      // @ts-expect-error - Parameter type doesn't match
      const invalidCallback: Props['onComplete'] = (data: string[]) => {
        console.log(data);
      };

      // @ts-expect-error - Wrong object shape
      const invalidCallback2: Props['onComplete'] = (data: { wrongProp: string }[]) => {
        console.log(data);
      };

      void validCallback;
      void invalidCallback;
      void invalidCallback2;
    });

    // Note: TypeScript allows functions returning any type to be assigned to void-returning functions
    // This is by design, so we cannot test for return type errors
  });

  describe('Transform Type Errors', () => {
    it('should error when using input type instead of output type', () => {
      const schema = z.object({
        // Transforms string to number
        age: z.string().transform(val => parseInt(val, 10)),
      });

      type Props = CSVImporterProps<z.infer<typeof schema>>;

      const callback: Props['onComplete'] = (data) => {
        // Valid - age is number after transform
        const age: number = data[0].age;

        // @ts-expect-error - age is number, not string (after transform)
        const wrongAge: string = data[0].age;

        void age;
        void wrongAge;
      };

      void callback;
    });
  });

  describe('Nullable Type Errors', () => {
    it('should error when not handling null correctly', () => {
      const schema = z.object({
        name: z.string(),
        middleName: z.string().nullable(),
      });

      type Props = CSVImporterProps<z.infer<typeof schema>>;

      const callback: Props['onComplete'] = (data) => {
        // Valid
        const name: string = data[0].name;
        const middleName: string | null = data[0].middleName;

        // @ts-expect-error - middleName can be null
        const wrongMiddleName: string = data[0].middleName;

        void name;
        void middleName;
        void wrongMiddleName;
      };

      void callback;
    });
  });

  describe('Array Method Type Errors', () => {
    it('should error when using array methods with wrong types', () => {
      const schema = z.object({
        price: z.number(),
      });

      type Props = CSVImporterProps<z.infer<typeof schema>>;

      const callback: Props['onComplete'] = (data) => {
        // Valid
        const total = data.reduce((sum, item) => sum + item.price, 0);

        // @ts-expect-error - Cannot access non-existent property
        const invalid = data.map(item => item.invalidProp);

        void total;
        void invalid;
      };

      void callback;
    });
  });

  describe('Complex Schema Type Errors', () => {
    it('should error on deeply nested property access', () => {
      const schema = z.object({
        user: z.object({
          name: z.string(),
          email: z.string(),
        }),
      });

      // Note: This test documents current limitation
      // Nested objects are not yet supported in the conversion
      // But the type system should still work correctly

      type Data = z.infer<typeof schema>;

      const data: Data = {
        user: {
          name: 'John',
          email: 'john@example.com',
        },
      };

      // Valid
      const name: string = data.user.name;

      // @ts-expect-error - Property does not exist
      const invalid = data.user.invalidProp;

      void name;
      void invalid;
    });

    it('should error with refined schemas on wrong types', () => {
      const schema = z
        .object({
          price: z.number(),
          cost: z.number(),
        })
        .refine(data => data.price > data.cost);

      type Props = CSVImporterProps<z.infer<typeof schema>>;

      const callback: Props['onComplete'] = (data) => {
        // Valid
        const price: number = data[0].price;
        const cost: number = data[0].cost;

        // @ts-expect-error - Wrong type
        const wrongPrice: string = data[0].price;

        void price;
        void cost;
        void wrongPrice;
      };

      void callback;
    });
  });
});
