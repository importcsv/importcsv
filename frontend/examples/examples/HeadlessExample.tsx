import { useState } from 'react';
import { CSVImporter } from '../../src';

/**
 * Headless Components Demonstration
 *
 * This example shows inline mode with custom styling to demonstrate
 * the concept of customizable CSV importing.
 *
 * TRUE HEADLESS: Full headless primitives (<CSV.Root>, <CSV.UploadTrigger>, etc.)
 * are in development as part of Phase 0 implementation.
 */

export default function HeadlessExample() {
  const [importedData, setImportedData] = useState<any[]>([]);
  const [showImporter, setShowImporter] = useState(false);

  const sampleCSV = `firstName,lastName,email,phone,company
John,Doe,john.doe@example.com,5551234567,Acme Corp
Jane,Smith,jane.smith@example.com,5559876543,Tech Inc
Bob,Johnson,bob@example.com,5555551234,StartupXYZ
Alice,Williams,alice.w@example.com,5554567890,Design Co
Charlie,Brown,charlie@example.com,5553334444,`;

  const downloadSampleCSV = () => {
    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-contacts.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Define columns with validation
  const columns = [
    {
      id: 'firstName',
      label: 'First Name',
      type: 'string' as const,
      validators: [{ type: 'required' as const, message: 'First name is required' }]
    },
    {
      id: 'lastName',
      label: 'Last Name',
      type: 'string' as const,
      validators: [{ type: 'required' as const, message: 'Last name is required' }]
    },
    {
      id: 'email',
      label: 'Email',
      type: 'email' as const,
      validators: [{ type: 'required' as const, message: 'Email is required' }]
    },
    {
      id: 'phone',
      label: 'Phone',
      type: 'phone' as const,
      transformations: [{ type: 'normalize_phone' as const }]
    },
    {
      id: 'company',
      label: 'Company',
      type: 'string' as const
    }
  ];

  const handleComplete = (data: any) => {
    console.log('Imported data:', data);
    const rows = data.rows || [];
    setImportedData(rows.map((r: any) => r.values));
    setShowImporter(false);
  };

  if (!showImporter) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              🎨 Customizable CSV Import
            </h2>
            <p className="text-gray-600">
              Inline mode with validation and transformations
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Headless Components in Development
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    This demonstrates inline mode with custom styling. Full headless primitives
                    (<code className="bg-blue-100 px-1 rounded">{'<CSV.Root>'}</code>,
                    <code className="bg-blue-100 px-1 rounded mx-1">{'<CSV.UploadTrigger>'}</code>,
                    <code className="bg-blue-100 px-1 rounded">{'<CSV.Validator>'}</code>)
                    are being built in Phase 0 and will provide complete UI control.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Inline Mode</h3>
                <p className="text-gray-600 text-sm">No modal - embeds directly in your page</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Validation Rules</h3>
                <p className="text-gray-600 text-sm">Required fields, email validation, phone formatting</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Custom Styling</h3>
                <p className="text-gray-600 text-sm">Themed to match your brand</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Column Configuration</h3>
            <pre className="text-xs text-gray-700 overflow-x-auto">
{`const columns = [
  {
    id: 'firstName',
    label: 'First Name',
    validators: [{ type: 'required' }]
  },
  {
    id: 'email',
    label: 'Email',
    type: 'email',
    validators: [{ type: 'required' }]
  },
  {
    id: 'phone',
    transformations: [{ type: 'normalize_phone' }]
  }
];`}
            </pre>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowImporter(true)}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
            >
              Try Import →
            </button>
            <button
              onClick={downloadSampleCSV}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Download Sample CSV
            </button>
          </div>

          {importedData.length > 0 && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-semibold mb-3">
                ✓ Successfully imported {importedData.length} contacts
              </p>
              <div className="space-y-2">
                {importedData.map((contact, i) => (
                  <div key={i} className="bg-white p-3 rounded border border-green-100 text-sm">
                    <div className="font-semibold text-gray-900">
                      {contact.firstName} {contact.lastName}
                    </div>
                    <div className="text-gray-600">
                      {contact.email}
                      {contact.phone && ` • ${contact.phone}`}
                      {contact.company && ` • ${contact.company}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Import Contacts
          </h2>
          <p className="text-gray-600">
            Upload a CSV file with contact information
          </p>
        </div>

        {/* Use inline mode with columns */}
        <CSVImporter
          isModal={false}
          columns={columns}
          onComplete={handleComplete}
          theme="modern"
          primaryColor="#3b82f6"
        />

        <div className="mt-4 flex gap-3">
          <button
            onClick={() => setShowImporter(false)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}
