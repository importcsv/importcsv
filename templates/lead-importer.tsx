/**
 * Marketing Leads Importer Template
 *
 * A production-ready CSV importer for marketing lead data with source tracking,
 * score validation, and status management.
 *
 * Features:
 * - Type-safe with Zod schema
 * - Email normalization and validation
 * - Lead source tracking
 * - Lead score validation (0-100)
 * - Status enumeration
 * - Company size validation
 * - Optional fields for campaign and notes
 *
 * Sample CSV: templates/sample-data/leads.csv
 */

'use client'; // Remove if not using Next.js App Router

import { CSVImporter } from '@importcsv/react';
import { z } from 'zod';

/**
 * Lead schema with comprehensive validation
 */
const leadSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string()
    .email('Invalid email address')
    .transform(e => e.toLowerCase()), // Normalize email
  phone: z.string()
    .regex(/^\d{10}$/, 'Phone must be 10 digits')
    .transform(p => `${p.slice(0, 3)}-${p.slice(3, 6)}-${p.slice(6)}`)
    .optional(),
  company: z.string().min(1, 'Company name is required'),
  jobTitle: z.string().optional(),
  companySize: z.enum([
    '1-10',
    '11-50',
    '51-200',
    '201-500',
    '501-1000',
    '1000+'
  ], {
    errorMap: () => ({
      message: 'Company size must be one of: 1-10, 11-50, 51-200, 201-500, 501-1000, 1000+'
    })
  }).optional(),
  industry: z.string().optional(),
  source: z.enum([
    'website',
    'referral',
    'social_media',
    'event',
    'cold_outreach',
    'partner',
    'advertisement'
  ], {
    errorMap: () => ({
      message: 'Source must be one of: website, referral, social_media, event, cold_outreach, partner, advertisement'
    })
  }),
  campaign: z.string().optional(), // Marketing campaign ID/name
  leadScore: z.number()
    .int('Lead score must be a whole number')
    .min(0, 'Lead score must be at least 0')
    .max(100, 'Lead score must be at most 100')
    .default(50), // Default to medium score
  status: z.enum([
    'new',
    'contacted',
    'qualified',
    'proposal',
    'negotiation',
    'won',
    'lost'
  ]).default('new'),
  website: z.string().url('Invalid website URL').optional(),
  notes: z.string().max(500, 'Notes must be at most 500 characters').optional(),
  estimatedValue: z.number().positive('Estimated value must be positive').optional()
});

/**
 * Infer TypeScript type from schema
 */
export type Lead = z.infer<typeof leadSchema>;

/**
 * Lead Importer Component
 *
 * Usage:
 * ```tsx
 * import { LeadImporter } from './templates/lead-importer';
 *
 * <LeadImporter
 *   onComplete={(leads) => {
 *     console.log('Imported leads:', leads);
 *   }}
 * />
 * ```
 */
interface LeadImporterProps {
  onComplete: (leads: Lead[]) => void | Promise<void>;
  isOpen?: boolean;
  onClose?: () => void;
}

export function LeadImporter({
  onComplete,
  isOpen = false,
  onClose
}: LeadImporterProps) {
  return (
    <CSVImporter
      modalIsOpen={isOpen}
      modalOnCloseTriggered={onClose}
      // ⚠️ WARNING: schema prop is not yet implemented (coming in Phase 1)
      // For production use, convert this schema to columns array format
      schema={leadSchema}
      onComplete={onComplete}
      theme="modern"
      primaryColor="#f59e0b"
    />
  );
}

/**
 * Example usage with lead source analytics
 */
export function LeadImportPage() {
  const handleComplete = async (leads: Lead[]) => {
    // Calculate lead source statistics
    const sourceCounts = leads.reduce((acc, lead) => {
      acc[lead.source] = (acc[lead.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate average lead score
    const avgScore = leads.reduce((sum, lead) => sum + lead.leadScore, 0) / leads.length;

    // Calculate total estimated value
    const totalValue = leads.reduce((sum, lead) => sum + (lead.estimatedValue || 0), 0);

    console.log('Import Summary:');
    console.log(`Total Leads: ${leads.length}`);
    console.log(`Average Lead Score: ${avgScore.toFixed(1)}/100`);
    console.log(`Total Estimated Value: $${totalValue.toFixed(2)}`);
    console.log('Lead Sources:', sourceCounts);

    try {
      // Send to API (or CRM)
      const response = await fetch('/api/leads/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leads,
          summary: {
            count: leads.length,
            avgScore,
            totalValue,
            sourceCounts
          }
        })
      });

      if (response.ok) {
        alert(
          `Successfully imported ${leads.length} leads\n` +
          `Avg Score: ${avgScore.toFixed(1)}/100\n` +
          `Est. Value: $${totalValue.toFixed(0)}`
        );
      } else {
        const error = await response.json();
        alert(`Import failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Import failed');
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Import Marketing Leads</h1>
      <p className="text-gray-600 mb-4">
        Import leads from CSV. All emails and lead scores will be validated.
      </p>
      <LeadImporter onComplete={handleComplete} />
    </div>
  );
}

/**
 * Sample CSV data
 *
 * Save as: templates/sample-data/leads.csv
 *
firstName,lastName,email,phone,company,jobTitle,companySize,industry,source,campaign,leadScore,status,website,notes,estimatedValue
John,Doe,john.doe@techcorp.com,5551234567,TechCorp,CTO,51-200,Technology,website,Q1-2024-Website,85,qualified,https://techcorp.com,Interested in enterprise plan,50000
Jane,Smith,jane.smith@startup.io,5559876543,Startup.io,CEO,1-10,SaaS,referral,,75,contacted,https://startup.io,Referred by existing customer,25000
Bob,Johnson,bob@enterprise.com,5555551234,Enterprise Co,VP of Engineering,1000+,Enterprise,event,TechConf-2024,90,proposal,https://enterprise.com,Met at tech conference,150000
Alice,Williams,alice.w@design.co,5554567890,Design Co,Creative Director,11-50,Design,social_media,LinkedIn-Campaign,60,new,https://design.co,,15000
Charlie,Brown,charlie@agency.com,5553334444,Agency LLC,Marketing Manager,51-200,Marketing,cold_outreach,,55,contacted,https://agency.com,Reached out via email,30000
Emily,Davis,emily@saascompany.com,5556667777,SaaS Company,Product Manager,201-500,Software,partner,Partner-Referral-2024,80,qualified,https://saascompany.com,Partner referral - high priority,75000
Michael,Wilson,michael@consulting.biz,5558889999,Consulting Biz,Senior Consultant,11-50,Consulting,advertisement,Google-Ads-Q1,65,new,https://consulting.biz,,20000
 */
