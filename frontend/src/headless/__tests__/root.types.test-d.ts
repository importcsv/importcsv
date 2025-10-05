// frontend/src/headless/__tests__/root.types.test-d.ts
import { z } from 'zod';
import { expectType } from 'tsd';
import type { RootProps } from '../types';

// Test: Zod schema should infer types automatically
const contactSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional()
});

// Type inference test - onComplete should receive correctly typed data
type ContactData = z.infer<typeof contactSchema>;

// Test that RootProps accepts the schema and properly typed onComplete
const props: RootProps<ContactData> = {
  schema: contactSchema,
  onComplete: (data: ContactData[]) => {
    // Should infer: Array<{ name: string; email: string; phone?: string }>
    expectType<{ name: string; email: string; phone?: string }[]>(data);

    // Individual item should have correct shape
    const contact = data[0];
    expectType<string>(contact.name);
    expectType<string>(contact.email);
    expectType<string | undefined>(contact.phone);
  },
  children: null
};
