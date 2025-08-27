'use client';

import { useState } from 'react';
import type { ExtendedColumn } from './ImporterPlayground';

interface DataGeneratorProps {
  columns: ExtendedColumn[];
}

// Sample data pools
const firstNames = ['John', 'Jane', 'Bob', 'Alice', 'Charlie', 'Emma', 'David', 'Sarah', 'Michael', 'Lisa'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Martinez'];
const domains = ['example.com', 'email.com', 'company.org', 'business.net', 'mail.co'];
const streetNames = ['Main St', 'Oak Ave', 'Elm Dr', 'Park Blvd', 'First Ave', 'Second St', 'Market St'];
const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio'];
const accountTypes = ['Basic', 'Premium', 'Enterprise'];

// Data generation functions by type
const generateValue = (
  column: ExtendedColumn,
  index: number,
  quality: 'clean' | 'errors' | 'messy' | 'mixed',
  isEdgeCase: boolean = false
): string => {
  const errorRate = 0.3; // 30% chance of error in 'errors' mode
  const shouldError = quality === 'errors' && Math.random() < errorRate;
  const shouldMessy = quality === 'messy' || (quality === 'mixed' && Math.random() < 0.3);

  // Handle required field errors
  if (shouldError && column.validators?.some(v => v.type === 'required') && Math.random() < 0.3) {
    return '';
  }

  // Handle edge cases
  if (isEdgeCase && index === 0) {
    if (column.type === 'number') {
      const minValidator = column.validators?.find(v => v.type === 'min');
      const maxValidator = column.validators?.find(v => v.type === 'max');
      if (minValidator) return String((minValidator as any).value);
      if (maxValidator) return String((maxValidator as any).value);
    }
    if (column.type === 'string') {
      const minLengthValidator = column.validators?.find(v => v.type === 'minLength');
      if (minLengthValidator) {
        return 'x'.repeat((minLengthValidator as any).value);
      }
    }
  }

  switch (column.type) {
    case 'email': {
      const firstName = firstNames[index % firstNames.length];
      const lastName = lastNames[index % lastNames.length];
      const domain = domains[index % domains.length];
      let email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;

      if (shouldError) {
        email = Math.random() < 0.5 ? 'invalid-email' : `${firstName}@`;
      } else if (shouldMessy) {
        email = Math.random() < 0.5
          ? `  ${firstName.toUpperCase()}.${lastName.toUpperCase()}@${domain.toUpperCase()}  `
          : email;
      }
      return email;
    }

    case 'phone': {
      let phone = `+1${String(2000000000 + index).padStart(10, '0')}`;

      if (shouldError) {
        phone = Math.random() < 0.5 ? '123' : 'invalid-phone';
      } else if (shouldMessy) {
        // Different formats that need normalization
        const formats = [
          `${phone.slice(2, 5)}-${phone.slice(5, 8)}-${phone.slice(8)}`,
          `(${phone.slice(2, 5)}) ${phone.slice(5, 8)}-${phone.slice(8)}`,
          phone.slice(2), // No country code
          `  ${phone}  ` // Extra spaces
        ];
        phone = formats[Math.floor(Math.random() * formats.length)];
      } else {
        phone = `+1 (${phone.slice(2, 5)}) ${phone.slice(5, 8)}-${phone.slice(8)}`;
      }
      return phone;
    }

    case 'number': {
      const minValidator = column.validators?.find(v => v.type === 'min');
      const maxValidator = column.validators?.find(v => v.type === 'max');
      const min = (minValidator as any)?.value ?? 0;
      const max = (maxValidator as any)?.value ?? 100;

      let value = min + (index % (max - min + 1));

      if (shouldError) {
        // Generate values outside the valid range
        value = Math.random() < 0.5 ? min - 10 : max + 10;
      } else if (shouldMessy) {
        // Add spaces or decimals
        return `  ${value}  `;
      }
      return String(value);
    }

    case 'date': {
      const year = 2020 + (index % 5);
      const month = (index % 12) + 1;
      const day = (index % 28) + 1;
      const isoDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      if (shouldError) {
        return 'invalid-date';
      } else if (shouldMessy) {
        // Different date formats
        const formats = [
          `${month}/${day}/${year}`,
          `${day}/${month}/${year}`,
          `${year}/${month}/${day}`,
          `  ${isoDate}  `
        ];
        return formats[Math.floor(Math.random() * formats.length)];
      }
      return isoDate;
    }

    case 'boolean': {
      const value = index % 2 === 0;
      if (shouldError) {
        return 'maybe';
      } else if (shouldMessy) {
        return value ? 'YES' : 'NO';
      }
      return value ? 'true' : 'false';
    }

    default: {
      // Generic string handling
      let value = '';

      // Check for specific patterns
      if (column.label.toLowerCase().includes('name')) {
        const firstName = firstNames[index % firstNames.length];
        const lastName = lastNames[index % lastNames.length];
        value = `${firstName} ${lastName}`;

        if (shouldMessy) {
          value = Math.random() < 0.5
            ? `  ${value.toLowerCase()}  `
            : value.toUpperCase();
        }
      } else if (column.label.toLowerCase().includes('address')) {
        value = `${100 + index} ${streetNames[index % streetNames.length]}`;
        if (shouldMessy) {
          value = `  ${value}  `;
        }
      } else if (column.label.toLowerCase().includes('city')) {
        value = cities[index % cities.length];
      } else if (column.label.toLowerCase().includes('zip')) {
        value = String(10000 + index).padStart(5, '0');
        if (shouldError && Math.random() < 0.5) {
          value = 'ABC123'; // Invalid zip
        }
      } else if (column.validators?.some(v => v.type === 'regex')) {
        // Handle specific regex patterns
        const regexValidator = column.validators.find(v => v.type === 'regex');
        const pattern = (regexValidator as any)?.value;

        if (pattern?.includes('CUST-')) {
          value = `CUST-${String(100000 + index).padStart(6, '0')}`;
          if (shouldError) {
            value = `CUSTOMER-${index}`;
          }
        } else if (pattern?.includes('Basic|Premium|Enterprise')) {
          value = accountTypes[index % accountTypes.length];
          if (shouldError) {
            value = 'Gold'; // Invalid option
          }
        } else {
          // Generic string
          value = `Value ${index + 1}`;
        }
      } else {
        // Default string value
        value = `${column.label} ${index + 1}`;
        if (shouldMessy) {
          value = `  ${value}  `;
        }
      }

      // Handle length validators
      if (shouldError) {
        const minLength = column.validators?.find(v => v.type === 'minLength');
        const maxLength = column.validators?.find(v => v.type === 'maxLength');

        if (minLength && Math.random() < 0.5) {
          value = 'x'; // Too short
        } else if (maxLength && Math.random() < 0.5) {
          value = 'x'.repeat(((maxLength as any).value || 10) + 10); // Too long
        }
      }

      return value;
    }
  }
};

// Generate CSV content
const generateCSV = (
  columns: ExtendedColumn[],
  rowCount: number,
  quality: 'clean' | 'errors' | 'messy' | 'mixed',
  includeEdgeCases: boolean
): string => {
  // Generate headers
  const headers = columns.map(col => col.label).join(',');

  // Generate rows
  const rows: string[] = [];
  for (let i = 0; i < rowCount; i++) {
    const row = columns.map(col => {
      const value = generateValue(col, i, quality, includeEdgeCases && i < 3);
      // Escape values containing commas or quotes
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
    rows.push(row);
  }

  // Add duplicates for unique validation testing
  if (quality === 'errors' && columns.some(col => col.validators?.some(v => v.type === 'unique'))) {
    // Duplicate first row at 25% position
    const duplicateIndex = Math.floor(rowCount * 0.25);
    if (rows.length > duplicateIndex) {
      rows[duplicateIndex] = rows[0];
    }
  }

  return `${headers}\n${rows.join('\n')}`;
};

export default function DataGenerator({ columns }: DataGeneratorProps) {
  const [rowCount, setRowCount] = useState(50);
  const [quality, setQuality] = useState<'clean' | 'errors' | 'messy' | 'mixed'>('clean');
  const [includeEdgeCases, setIncludeEdgeCases] = useState(false);
  const [generatedData, setGeneratedData] = useState<string>('');

  const generateData = () => {
    const csv = generateCSV(columns, rowCount, quality, includeEdgeCases);
    setGeneratedData(csv);
  };

  const downloadCSV = () => {
    if (!generatedData) {
      generateData();
    }
    const csv = generatedData || generateCSV(columns, rowCount, quality, includeEdgeCases);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sample-${quality}-${rowCount}rows.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (columns.length === 0) {
    return (
      <div className="p-4 border border-fd-border/50 rounded-lg bg-fd-muted/20 text-center">
        <p className="text-sm text-fd-muted-foreground">
          Add columns above to generate sample data
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm text-fd-foreground">Generate Sample Data</h3>

      <div className="space-y-3">
        {/* Row count slider */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-fd-foreground/70">
            Number of rows: {rowCount}
          </label>
          <input
            type="range"
            min="1"
            max="1000"
            value={rowCount}
            onChange={(e) => setRowCount(Number(e.target.value))}
            className="w-full accent-fd-primary"
          />
          <div className="flex justify-between text-xs text-fd-muted-foreground">
            <span>1</span>
            <span>100</span>
            <span>500</span>
            <span>1000</span>
          </div>
        </div>

        {/* Data quality options */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-fd-foreground/70">Data Quality</label>
          <div className="grid grid-cols-2 gap-2">
            {(['clean', 'errors', 'messy', 'mixed'] as const).map((q) => (
              <button
                key={q}
                onClick={() => setQuality(q)}
                className={`px-3 py-1.5 text-xs rounded-md border transition-colors capitalize ${
                  quality === q
                    ? 'bg-fd-primary text-fd-primary-foreground border-fd-primary'
                    : 'border-fd-border/50 bg-fd-card/30 hover:bg-fd-muted/50 text-fd-foreground'
                }`}
              >
                {q === 'clean' && '✓ Clean'}
                {q === 'errors' && '⚠ With Errors'}
                {q === 'messy' && '🔄 Needs Transformations'}
                {q === 'mixed' && '🎲 Mixed'}
              </button>
            ))}
          </div>
        </div>

        {/* Quality descriptions */}
        <div className="p-2 rounded-md bg-fd-muted/20 border border-fd-border/30">
          <p className="text-xs text-fd-foreground/60">
            {quality === 'clean' && 'All data will be valid according to your validators'}
            {quality === 'errors' && 'Includes invalid emails, out-of-range numbers, missing required fields (30% error rate)'}
            {quality === 'messy' && 'Valid data but needs transformations: wrong case, extra spaces, unformatted phones'}
            {quality === 'mixed' && 'Combination of clean, errors, and messy data'}
          </p>
        </div>

        {/* Edge cases toggle */}
        <label className="flex items-center gap-2 text-sm text-fd-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={includeEdgeCases}
            onChange={(e) => setIncludeEdgeCases(e.target.checked)}
            className="rounded border-fd-border text-fd-primary focus:ring-2 focus:ring-fd-primary focus:ring-offset-2 cursor-pointer"
          />
          Include edge cases (boundary values, minimum/maximum lengths)
        </label>

        {/* Generate and download buttons */}
        <div className="flex gap-2">
          <button
            onClick={generateData}
            className="flex-1 px-3 py-2 text-sm bg-fd-card/30 border border-fd-border/50 rounded-md hover:bg-fd-muted/50 text-fd-foreground font-medium transition-colors"
          >
            Generate Preview
          </button>
          <button
            onClick={downloadCSV}
            className="flex-1 px-3 py-2 text-sm bg-fd-primary text-fd-primary-foreground rounded-md hover:bg-fd-primary/90 transition-colors font-medium"
          >
            ↓ Download CSV
          </button>
        </div>

        {/* Data preview */}
        {generatedData && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-medium text-fd-foreground/70">Preview (first 5 rows)</span>
              <button
                onClick={() => setGeneratedData('')}
                className="text-xs text-fd-muted-foreground hover:text-fd-foreground"
              >
                Clear
              </button>
            </div>
            <pre className="p-3 rounded-md border border-fd-border/30 bg-fd-muted/20 overflow-x-auto text-xs text-fd-foreground font-mono">
              {generatedData.split('\n').slice(0, 6).join('\n')}
              {generatedData.split('\n').length > 6 && '\n...'}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}