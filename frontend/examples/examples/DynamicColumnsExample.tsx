import { useState } from 'react';
import { CSVImporter } from '../../src';
import type { Column, ImportResult } from '../../src';

/**
 * Dynamic Columns Example
 *
 * Shows how to pass customer-specific fields at runtime.
 * Dynamic column values are nested under `_custom_fields` in the output.
 */

// Simulate fetching customer-specific fields from an API
const fetchCustomerFields = async (customerId: string): Promise<Column[]> => {
  // In a real app, this would be an API call:
  // const response = await fetch(`/api/customers/${customerId}/fields`);
  // return response.json();

  const customerConfigs: Record<string, Column[]> = {
    'acme-corp': [
      { id: 'department', label: 'Department', type: 'string' },
      { id: 'cost_center', label: 'Cost Center', type: 'string' },
    ],
    'tech-startup': [
      { id: 'team', label: 'Team', type: 'string' },
      { id: 'role_level', label: 'Role Level', type: 'select', options: ['Junior', 'Mid', 'Senior', 'Lead'] },
      { id: 'remote', label: 'Remote Worker', type: 'string' },
    ],
    'enterprise-inc': [
      { id: 'division', label: 'Division', type: 'string' },
      { id: 'employee_id', label: 'Employee ID', type: 'string' },
      { id: 'badge_number', label: 'Badge Number', type: 'string' },
      { id: 'building', label: 'Building', type: 'string' },
    ],
  };

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  return customerConfigs[customerId] || [];
};

export default function DynamicColumnsExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState('acme-corp');
  const [dynamicColumns, setDynamicColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(false);

  // Predefined columns - same for all customers
  const predefinedColumns: Column[] = [
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
  ];

  const customers = [
    { id: 'acme-corp', name: 'Acme Corp', description: '2 custom fields: Department, Cost Center' },
    { id: 'tech-startup', name: 'Tech Startup', description: '3 custom fields: Team, Role Level, Remote' },
    { id: 'enterprise-inc', name: 'Enterprise Inc', description: '4 custom fields: Division, Employee ID, Badge, Building' },
  ];

  const loadCustomerFields = async (customerId: string) => {
    setLoading(true);
    setSelectedCustomer(customerId);
    const fields = await fetchCustomerFields(customerId);
    setDynamicColumns(fields);
    setLoading(false);
  };

  // Load initial customer fields
  useState(() => {
    loadCustomerFields('acme-corp');
  });

  const sampleCSVs: Record<string, string> = {
    'acme-corp': `Name,Email,Department,Cost Center
John Doe,john@acme.com,Engineering,ENG-001
Jane Smith,jane@acme.com,Marketing,MKT-002`,
    'tech-startup': `Name,Email,Team,Role Level,Remote
Alice,alice@startup.io,Platform,Senior,Yes
Bob,bob@startup.io,Product,Mid,No`,
    'enterprise-inc': `Name,Email,Division,Employee ID,Badge Number,Building
Carol,carol@enterprise.com,Finance,E12345,B-9876,Building A
Dave,dave@enterprise.com,IT,E12346,B-9877,Building B`,
  };

  const downloadSampleCSV = () => {
    const csv = sampleCSVs[selectedCustomer];
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sample-${selectedCustomer}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleComplete = (importResult: ImportResult) => {
    console.log('Import completed:', importResult);
    setResult(importResult);
    setIsOpen(false);
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Dynamic Columns
          </h2>
          <p className="text-gray-600">
            Pass customer-specific fields at runtime. Values are nested under <code className="bg-gray-100 px-1 rounded">_custom_fields</code>.
          </p>
        </div>

        {/* Customer Selector */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">1. Select a customer (simulates runtime context)</h3>
          <div className="grid grid-cols-3 gap-3">
            {customers.map(customer => (
              <button
                key={customer.id}
                onClick={() => loadCustomerFields(customer.id)}
                disabled={loading}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  selectedCustomer === customer.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-900">{customer.name}</div>
                <div className="text-xs text-gray-500 mt-1">{customer.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Column Display */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-700 mb-2">Predefined Columns</h4>
            <p className="text-xs text-gray-500 mb-2">Same for all customers</p>
            <div className="space-y-1">
              {predefinedColumns.map(col => (
                <div key={col.id} className="text-sm bg-white px-2 py-1 rounded border">
                  {col.label} <span className="text-gray-400">({col.id})</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <h4 className="font-semibold text-purple-700 mb-2">Dynamic Columns</h4>
            <p className="text-xs text-purple-500 mb-2">Customer-specific, passed at runtime</p>
            <div className="space-y-1">
              {loading ? (
                <div className="text-sm text-purple-400">Loading...</div>
              ) : dynamicColumns.length > 0 ? (
                dynamicColumns.map(col => (
                  <div key={col.id} className="text-sm bg-white px-2 py-1 rounded border border-purple-200">
                    {col.label} <span className="text-purple-400">({col.id})</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-400">No dynamic columns</div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setIsOpen(true)}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-md disabled:opacity-50"
          >
            Import CSV
          </button>
          <button
            onClick={downloadSampleCSV}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            Download Sample CSV
          </button>
        </div>

        {/* Result Display */}
        {result && (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-semibold mb-2">
                ✓ Imported {result.rows.length} rows
              </p>

              {/* Column Metadata */}
              <div className="grid grid-cols-3 gap-2 text-xs mb-4">
                <div className="bg-white p-2 rounded">
                  <span className="font-semibold">Predefined:</span> {result.columns.predefined.map(c => c.id).join(', ')}
                </div>
                <div className="bg-purple-100 p-2 rounded">
                  <span className="font-semibold">Dynamic:</span> {result.columns.dynamic.map(c => c.id).join(', ')}
                </div>
                <div className="bg-gray-100 p-2 rounded">
                  <span className="font-semibold">Unmatched:</span> {result.columns.unmatched.join(', ') || 'none'}
                </div>
              </div>
            </div>

            {/* Row Data */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Output Structure</h4>
              <div className="space-y-3">
                {result.rows.slice(0, 3).map((row, i) => (
                  <div key={i} className="bg-white p-3 rounded border text-sm font-mono">
                    <div className="text-gray-600">{'{'}</div>
                    {/* Predefined fields */}
                    {Object.entries(row)
                      .filter(([key]) => !key.startsWith('_'))
                      .map(([key, value]) => (
                        <div key={key} className="ml-4">
                          <span className="text-blue-600">"{key}"</span>: <span className="text-green-600">"{String(value)}"</span>,
                        </div>
                      ))}
                    {/* Custom fields */}
                    {row._custom_fields && Object.keys(row._custom_fields).length > 0 && (
                      <>
                        <div className="ml-4">
                          <span className="text-purple-600">"_custom_fields"</span>: {'{'}
                        </div>
                        {Object.entries(row._custom_fields).map(([key, value]) => (
                          <div key={key} className="ml-8">
                            <span className="text-purple-500">"{key}"</span>: <span className="text-green-600">"{String(value)}"</span>,
                          </div>
                        ))}
                        <div className="ml-4">{'}'}</div>
                      </>
                    )}
                    <div className="text-gray-600">{'}'}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Raw JSON */}
            <details className="bg-gray-900 rounded-lg p-4">
              <summary className="text-gray-300 cursor-pointer font-semibold">View Raw JSON</summary>
              <pre className="mt-2 text-xs text-green-400 overflow-auto max-h-64">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>

      <CSVImporter
        modalIsOpen={isOpen}
        modalOnCloseTriggered={() => setIsOpen(false)}
        columns={predefinedColumns}
        dynamicColumns={dynamicColumns}
        onComplete={handleComplete}
        theme="modern"
        primaryColor="#9333ea"
      />
    </div>
  );
}
