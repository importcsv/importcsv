/**
 * Financial Transaction Importer Template
 *
 * A production-ready CSV importer for financial transaction data with
 * amount validation, date parsing, and account masking.
 *
 * Features:
 * - Type-safe with Zod schema
 * - Transaction ID validation (UUID)
 * - Date/time validation
 * - Amount validation (non-zero)
 * - Account number masking (last 4 digits)
 * - Transaction type enumeration
 *
 * Sample CSV: templates/sample-data/transactions.csv
 */

'use client'; // Remove if not using Next.js App Router

import { CSVImporter } from '@importcsv/react';
import { z } from 'zod';

/**
 * Transaction schema with comprehensive validation
 */
const transactionSchema = z.object({
  transactionId: z.string()
    .uuid('Transaction ID must be a valid UUID'),
  date: z.string()
    .datetime('Invalid date format (must be ISO 8601)'),
  amount: z.number()
    .refine(
      (val) => Math.abs(val) > 0,
      'Amount cannot be zero'
    ),
  type: z.enum(['debit', 'credit'], {
    errorMap: () => ({ message: 'Type must be either "debit" or "credit"' })
  }),
  category: z.string().min(1, 'Category is required'),
  description: z.string()
    .max(200, 'Description must be at most 200 characters'),
  merchant: z.string().optional(),
  accountNumber: z.string()
    .regex(/^\d{4}$/, 'Account number must be last 4 digits only')
    .transform(n => `****${n}`), // Mask account number
  status: z.enum(['pending', 'completed', 'failed']).default('completed'),
  reference: z.string().optional()
});

/**
 * Infer TypeScript type from schema
 */
export type Transaction = z.infer<typeof transactionSchema>;

/**
 * Transaction Importer Component
 *
 * Usage:
 * ```tsx
 * import { TransactionImporter } from './templates/transaction-importer';
 *
 * <TransactionImporter
 *   onComplete={(transactions) => {
 *     console.log('Imported transactions:', transactions);
 *   }}
 * />
 * ```
 */
interface TransactionImporterProps {
  onComplete: (transactions: Transaction[]) => void | Promise<void>;
  isOpen?: boolean;
  onClose?: () => void;
}

export function TransactionImporter({
  onComplete,
  isOpen = false,
  onClose
}: TransactionImporterProps) {
  return (
    <CSVImporter
      modalIsOpen={isOpen}
      modalOnCloseTriggered={onClose}
      schema={transactionSchema}
      onComplete={onComplete}
      theme="professional"
      primaryColor="#0ea5e9"
    />
  );
}

/**
 * Example usage with summary statistics
 */
export function TransactionImportPage() {
  const handleComplete = async (transactions: Transaction[]) => {
    // Calculate summary statistics
    const totalDebit = transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalCredit = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);

    const netAmount = totalCredit - totalDebit;

    console.log('Import Summary:');
    console.log(`Total Transactions: ${transactions.length}`);
    console.log(`Total Credits: $${totalCredit.toFixed(2)}`);
    console.log(`Total Debits: $${totalDebit.toFixed(2)}`);
    console.log(`Net Amount: $${netAmount.toFixed(2)}`);

    try {
      // Send to API
      const response = await fetch('/api/transactions/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions,
          summary: {
            totalDebit,
            totalCredit,
            netAmount,
            count: transactions.length
          }
        })
      });

      if (response.ok) {
        alert(
          `Successfully imported ${transactions.length} transactions\n` +
          `Net Amount: $${netAmount.toFixed(2)}`
        );
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
      <h1 className="text-2xl font-bold mb-4">Import Transactions</h1>
      <p className="text-gray-600 mb-4">
        Import financial transactions from CSV. All amounts and dates will be validated.
      </p>
      <TransactionImporter onComplete={handleComplete} />
    </div>
  );
}

/**
 * Sample CSV data
 *
 * Save as: templates/sample-data/transactions.csv
 *
transactionId,date,amount,type,category,description,merchant,accountNumber,status,reference
550e8400-e29b-41d4-a716-446655440000,2024-01-15T10:30:00Z,125.50,debit,groceries,Weekly grocery shopping,Whole Foods,1234,completed,REF-001
6ba7b810-9dad-11d1-80b4-00c04fd430c8,2024-01-15T14:20:00Z,3500.00,credit,salary,Monthly salary deposit,Acme Corp,1234,completed,PAY-JAN-2024
7c9e6679-7425-40de-944b-e07fc1f90ae7,2024-01-16T09:15:00Z,89.99,debit,utilities,Electric bill payment,Power Co,1234,completed,UTIL-JAN
8e7f8c5d-4f2e-4d1c-8a3b-1c5d6e7f8a9b,2024-01-17T16:45:00Z,1200.00,debit,rent,Monthly rent payment,Landlord LLC,1234,completed,RENT-JAN
9f8e9d6c-5e3f-4e2d-9b4c-2d6e7f8e9c0a,2024-01-18T11:00:00Z,45.00,debit,entertainment,Movie tickets and snacks,AMC Theaters,1234,completed,
a0f9e8d7-6f4e-5f3d-0c5b-3e7f8e9d0b1a,2024-01-19T08:30:00Z,250.00,credit,refund,Product return refund,Amazon,1234,completed,AMZ-RET-456
 */
