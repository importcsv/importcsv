import { useState } from 'react';
import { CSVImporter } from '../../src';
import type { Column } from '../../src';

/**
 * Basic CSV Import Example
 *
 * A simple, clean example showing the core functionality.
 * Perfect for getting started quickly.
 */

export default function BasicExample() {
  const [data, setData] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Define your data structure
  const columns: Column[] = [
    {
      id: 'name',
      label: 'Full Name',
      type: 'string',
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
      label: 'Phone Number',
      type: 'phone',
      transformations: [{ type: 'normalize_phone' }]
    },
    {
      id: 'company',
      label: 'Company',
      type: 'string'
    }
  ];

  const sampleCSV = `Name,Email,Phone,Company
John Doe,john@example.com,555-123-4567,Acme Corp
Jane Smith,jane@example.com,(555) 987-6543,Tech Inc
Bob Johnson,bob@example.com,5555551234,StartupXYZ`;

  const downloadSampleCSV = () => {
    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-contacts.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleComplete = (importedData: any) => {
    console.log('Import completed:', importedData);
    const rows = importedData.rows || [];
    setData(rows.map((r: any) => r.values));
    setIsOpen(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Basic CSV Import
          </h2>
          <p className="text-gray-600">
            Simple example to get you started in under 2 minutes
          </p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Quick Start</h3>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                1
              </div>
              <div>
                <p className="text-sm text-gray-700">Define your column structure</p>
                <code className="text-xs bg-white px-2 py-1 rounded border border-gray-200 block mt-1">
                  columns: Column[]
                </code>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                2
              </div>
              <div>
                <p className="text-sm text-gray-700">Add the CSVImporter component</p>
                <code className="text-xs bg-white px-2 py-1 rounded border border-gray-200 block mt-1">
                  {'<CSVImporter columns={columns} onComplete={...} />'}
                </code>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                3
              </div>
              <div>
                <p className="text-sm text-gray-700">Handle the imported data</p>
                <code className="text-xs bg-white px-2 py-1 rounded border border-gray-200 block mt-1">
                  onComplete={('{data => ...}')}
                </code>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Features in this example:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Required field validation</li>
            <li>✓ Email format validation</li>
            <li>✓ Phone number normalization</li>
            <li>✓ Clean, minimal configuration</li>
          </ul>
        </div>

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setIsOpen(true)}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
          >
            Try Import
          </button>
          <button
            onClick={downloadSampleCSV}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            Download Sample
          </button>
        </div>

        {data.length > 0 && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-semibold mb-3">
              ✓ Successfully imported {data.length} contacts
            </p>
            <div className="space-y-2">
              {data.slice(1).map((contact: any, i: number) => (
                <div key={i} className="bg-white p-3 rounded border border-green-100 text-sm">
                  <div className="font-semibold text-gray-900">
                    {contact[0]}
                  </div>
                  <div className="text-gray-600">
                    {contact[1]} • {contact[2]} • {contact[3]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <CSVImporter
        modalIsOpen={isOpen}
        modalOnCloseTriggered={() => setIsOpen(false)}
        columns={columns}
        onComplete={handleComplete}
        theme="modern"
        primaryColor="#3b82f6"
      />
    </div>
  );
}
