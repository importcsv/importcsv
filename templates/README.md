# ImportCSV Templates

Production-ready CSV importer templates with sample data. Copy, customize, and use in your projects.

> **⚠️ Important Note:** These templates show Zod schemas for type definitions and future API reference. The `schema` prop is **not yet implemented** (coming in Phase 1).
> **To use templates today:** Replace `schema={...}` with the `columns` array (shown in "Legacy" versions in each template).

## 📋 Available Templates

### 1. Contact Importer
**File**: `contact-importer.tsx`
**Sample Data**: `sample-data/contacts.csv`

Import contact/lead data with:
- Email validation
- Phone number formatting (XXX-XXX-XXXX)
- Optional company and job title
- LinkedIn URL validation

**Use Cases**: CRM systems, contact management, lead generation

---

### 2. Product Catalog Importer
**File**: `product-importer.tsx`
**Sample Data**: `sample-data/products.csv`

Import product catalog data with:
- SKU normalization (uppercase)
- Price/cost validation (price > cost)
- Category enumeration
- Quantity validation (non-negative)
- Optional dimensions and weight

**Use Cases**: E-commerce, inventory management, product databases

---

### 3. Financial Transaction Importer
**File**: `transaction-importer.tsx`
**Sample Data**: `sample-data/transactions.csv`

Import financial transactions with:
- Transaction ID validation (UUID)
- Date/time validation (ISO 8601)
- Amount validation (non-zero)
- Account number masking (****1234)
- Transaction type (debit/credit)

**Use Cases**: Banking apps, expense tracking, financial reporting

---

### 4. Employee / HR Importer
**File**: `employee-importer.tsx`
**Sample Data**: `sample-data/employees.csv`

Import employee data with:
- Employee ID normalization (uppercase)
- Email normalization (lowercase)
- Department validation
- Salary validation (minimum $30,000)
- Skills parsing (comma-separated)

**Use Cases**: HR systems, employee onboarding, payroll management

---

### 5. Marketing Leads Importer
**File**: `lead-importer.tsx`
**Sample Data**: `sample-data/leads.csv`

Import marketing leads with:
- Email normalization
- Lead source tracking
- Lead score validation (0-100)
- Status management
- Company size categorization
- Estimated value tracking

**Use Cases**: Marketing automation, CRM, lead management

---

## 🚀 Quick Start

### 1. Choose a Template

```bash
# Copy the template you need
cp templates/contact-importer.tsx src/components/
```

### 2. Install Dependencies

```bash
npm install @importcsv/react zod
```

### 3. Use in Your App

```tsx
import { ContactImporter } from './components/contact-importer';

function MyPage() {
  const handleComplete = (contacts) => {
    console.log('Imported:', contacts);
    // Send to API, update state, etc.
  };

  return <ContactImporter onComplete={handleComplete} />;
}
```

### 4. Test with Sample Data

Download the corresponding sample CSV from `sample-data/` and test the import flow.

---

## 🎨 Customization

### Change Theme

```tsx
<CSVImporter
  schema={schema}
  onComplete={handleComplete}
  theme="dark"              // "modern", "professional", "dark"
  primaryColor="#f59e0b"    // Your brand color
/>
```

### Modify Validation

Update the Zod schema to match your requirements:

```tsx
const customSchema = z.object({
  // Add, remove, or modify fields
  email: z.string().email(),
  // Add custom validation
  age: z.number().min(18).max(120),
  // Add transforms
  name: z.string().transform(s => s.trim().toUpperCase())
});
```

### Add API Integration

```tsx
const handleComplete = async (data) => {
  const response = await fetch('/api/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data })
  });

  if (response.ok) {
    alert('Import successful!');
  }
};
```

---

## 🛡️ Type Safety

All templates use Zod for runtime validation with automatic TypeScript inference:

```tsx
const schema = z.object({
  name: z.string(),
  email: z.string().email()
});

type Contact = z.infer<typeof schema>; // Automatic type!

const handleComplete = (data: Contact[]) => {
  // `data` is fully typed
  data.forEach(contact => {
    console.log(contact.name);  // ✓ TypeScript knows this exists
    console.log(contact.email); // ✓ TypeScript knows this exists
  });
};
```

---

## 📊 Sample Data Format

Each template includes a sample CSV file in `sample-data/`. Use these to:

1. **Test the importer** - Verify validation rules work correctly
2. **Demonstrate to users** - Show what format is expected
3. **Generate documentation** - Use as examples in your docs

---

## 🔗 Framework Integration

### Next.js App Router

```tsx
'use client';

import { ContactImporter } from '@/components/contact-importer';

export default function ImportPage() {
  return <ContactImporter onComplete={handleComplete} />;
}
```

### Next.js Pages Router

```tsx
import dynamic from 'next/dynamic';

const ContactImporter = dynamic(
  () => import('@/components/contact-importer').then(m => m.ContactImporter),
  { ssr: false }
);
```

### React (Vite, CRA)

```tsx
import { ContactImporter } from './components/contact-importer';

function App() {
  return <ContactImporter onComplete={handleComplete} />;
}
```

---

## 📚 Additional Resources

- [Full Documentation](../docs/README.md)
- [Zod Schema Guide](../docs/content/docs/guides/zod-schemas.mdx)
- [Headless Components](../docs/content/docs/headless.mdx)
- [API Reference](../docs/content/docs/api.mdx)

---

## 💡 Tips

1. **Start with a template** - Don't build from scratch, customize an existing template
2. **Use Zod schemas** - Better type safety and validation than legacy columns
3. **Test with sample data** - Verify your validation rules work correctly
4. **Customize themes** - Match your brand colors and styling
5. **Add error handling** - Show user-friendly messages on import failures

---

## 🤝 Contributing

Have a template idea? Submit a PR with:
- TypeScript component file
- Zod schema with validation
- Sample CSV data (10 rows minimum)
- README section documenting the template

---

**Made with ImportCSV** | [Documentation](../docs) | [GitHub](https://github.com/importcsv/importcsv)
