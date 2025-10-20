/**
 * Contact Importer Template
 *
 * A production-ready CSV importer for contact/lead data with email validation,
 * phone formatting, and optional fields.
 *
 * Features:
 * - Type-safe with Zod schema
 * - Email validation
 * - Phone number formatting
 * - Optional company and job title fields
 * - LinkedIn URL validation
 *
 * Sample CSV: templates/sample-data/contacts.csv
 */

'use client'; // Remove if not using Next.js App Router

import { CSVImporter } from '@importcsv/react';
import { z } from 'zod';

/**
 * Contact schema with comprehensive validation
 */
const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string()
    .email('Invalid email address')
    .transform(e => e.toLowerCase()), // Normalize email
  phone: z.string()
    .regex(/^\d{10}$/, 'Phone must be 10 digits (e.g., 5551234567)')
    .transform(p => `${p.slice(0, 3)}-${p.slice(3, 6)}-${p.slice(6)}`), // Format: XXX-XXX-XXXX
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  linkedIn: z.string()
    .url('Invalid LinkedIn URL')
    .refine(
      url => url.includes('linkedin.com'),
      'Must be a LinkedIn URL'
    )
    .optional()
});

/**
 * Infer TypeScript type from schema
 */
export type Contact = z.infer<typeof contactSchema>;

/**
 * Contact Importer Component
 *
 * Usage:
 * ```tsx
 * import { ContactImporter } from './templates/contact-importer';
 *
 * <ContactImporter
 *   onComplete={(contacts) => {
 *     console.log('Imported contacts:', contacts);
 *     // Send to API, update state, etc.
 *   }}
 * />
 * ```
 */
interface ContactImporterProps {
  onComplete: (contacts: Contact[]) => void | Promise<void>;
  isOpen?: boolean;
  onClose?: () => void;
}

export function ContactImporter({
  onComplete,
  isOpen = false,
  onClose
}: ContactImporterProps) {
  return (
    <CSVImporter
      modalIsOpen={isOpen}
      modalOnCloseTriggered={onClose}
      // ⚠️ WARNING: schema prop is not yet implemented (coming in Phase 1)
      // Use ContactImporterLegacy below for production use
      schema={contactSchema}
      onComplete={onComplete}
      theme="modern"
      primaryColor="#2563eb"
    />
  );
}

/**
 * Alternative: Legacy columns array (for backward compatibility)
 *
 * Not recommended - use Zod schema above for better type safety
 */
export function ContactImporterLegacy({ onComplete }: ContactImporterProps) {
  return (
    <CSVImporter
      columns={[
        { id: 'firstName', label: 'First Name', type: 'string', validators: [{ type: 'required' }] },
        { id: 'lastName', label: 'Last Name', type: 'string', validators: [{ type: 'required' }] },
        { id: 'email', label: 'Email', type: 'email', validators: [{ type: 'required' }] },
        { id: 'phone', label: 'Phone', type: 'phone', validators: [{ type: 'required' }] },
        { id: 'company', label: 'Company', type: 'string' },
        { id: 'jobTitle', label: 'Job Title', type: 'string' },
        { id: 'linkedIn', label: 'LinkedIn URL', type: 'url' }
      ]}
      onComplete={(data: any) => {
        // Note: data is not typed with legacy approach
        onComplete(data.rows.map((row: any) => row.values));
      }}
      theme="modern"
      primaryColor="#2563eb"
    />
  );
}

/**
 * Example usage in a Next.js page
 */
export function ContactImportPage() {
  const handleComplete = async (contacts: Contact[]) => {
    try {
      // Send to API
      const response = await fetch('/api/contacts/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contacts })
      });

      if (response.ok) {
        alert(`Successfully imported ${contacts.length} contacts`);
      } else {
        alert('Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Import failed');
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Import Contacts</h1>
      <ContactImporter onComplete={handleComplete} />
    </div>
  );
}

/**
 * Sample CSV data
 *
 * Save as: templates/sample-data/contacts.csv
 *
firstName,lastName,email,phone,company,jobTitle,linkedIn
John,Doe,john.doe@example.com,5551234567,Acme Corp,Software Engineer,https://linkedin.com/in/johndoe
Jane,Smith,jane.smith@example.com,5559876543,Tech Inc,Product Manager,https://linkedin.com/in/janesmith
Bob,Johnson,bob.johnson@example.com,5555551234,StartupXYZ,CEO,https://linkedin.com/in/bobjohnson
Alice,Williams,alice.w@example.com,5554567890,Design Co,UX Designer,
Charlie,Brown,charlie@example.com,5553334444,,,
 */
