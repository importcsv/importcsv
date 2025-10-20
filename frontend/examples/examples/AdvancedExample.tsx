import { useState } from 'react';
import { CSVImporter } from '../../src';
import type { Column } from '../../src';

/**
 * Advanced Example
 *
 * Comprehensive showcase of validation, transformations, and error handling.
 * Shows real-world data cleaning and validation scenarios.
 */

export default function AdvancedExample() {
  const [data, setData] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [validationMode, setValidationMode] = useState<'include' | 'exclude' | 'block'>('block');

  const columns: Column[] = [
    {
      id: 'employee_id',
      label: 'Employee ID',
      type: 'string',
      validators: [
        { type: 'required' },
        { type: 'unique' },
        { type: 'regex', pattern: '^EMP\\d{3,6}$', message: 'Must follow pattern EMP### (3-6 digits)' }
      ],
      transformations: [
        { type: 'trim' },
        { type: 'uppercase' }
      ]
    },
    {
      id: 'name',
      label: 'Full Name',
      type: 'string',
      validators: [
        { type: 'required' },
        { type: 'min_length', value: 2 },
        { type: 'max_length', value: 100 }
      ],
      transformations: [
        { type: 'trim' },
        { type: 'capitalize' }
      ]
    },
    {
      id: 'email',
      label: 'Email',
      type: 'email',
      validators: [
        { type: 'required' },
        { type: 'unique' }
      ],
      transformations: [
        { type: 'trim' },
        { type: 'lowercase' }
      ]
    },
    {
      id: 'department',
      label: 'Department',
      type: 'select',
      options: ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'],
      validators: [
        { type: 'required' }
      ]
    },
    {
      id: 'salary',
      label: 'Salary',
      type: 'number',
      validators: [
        { type: 'required' },
        { type: 'min', value: 30000 },
        { type: 'max', value: 500000 }
      ],
      transformations: [
        { type: 'trim' },
        { type: 'remove_special_chars' }
      ]
    },
    {
      id: 'hire_date',
      label: 'Hire Date',
      type: 'date',
      validators: [
        { type: 'required' }
      ],
      transformations: [
        { type: 'normalize_date', format: 'YYYY-MM-DD' }
      ]
    }
  ];

  const messyCSV = `Employee ID,Full Name,Email,Department,Salary,Hire Date
  emp001  ,  john doe  ,JOHN.DOE@EXAMPLE.COM,Engineering,$65,000,2023/01/15
EMP002,JANE SMITH,Jane.Smith@Example.Com,Sales,75000,02-20-2023
emp003,robert johnson  ,Robert@Example.com,Marketing,45000,March 10 2023
  EMP004,Sarah Wilson,sarah@EXAMPLE.COM,HR,85000,2023-05-12
emp005  ,Michael Brown,MICHAEL.BROWN@EXAMPLE.COM,Finance,55000,06/01/2023`;

  const downloadSampleCSV = () => {
    const blob = new Blob([messyCSV], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee-data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleComplete = (importedData: any) => {
    console.log('Import completed:', importedData);
    setData(importedData);
    setIsOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">
          Advanced Validation & Transformations
        </h2>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Validations */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Validations Applied:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ Required fields</li>
              <li>✓ Unique constraints (ID, Email)</li>
              <li>✓ Pattern matching (Employee ID)</li>
              <li>✓ Min/Max length (Name)</li>
              <li>✓ Number ranges (Salary)</li>
              <li>✓ Email format validation</li>
              <li>✓ Dropdown options (Department)</li>
            </ul>
          </div>

          {/* Transformations */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-900 mb-2">Auto-Transformations:</h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>✓ Trim whitespace</li>
              <li>✓ Uppercase (Employee ID)</li>
              <li>✓ Lowercase (Email)</li>
              <li>✓ Capitalize (Names)</li>
              <li>✓ Remove special chars (Salary)</li>
              <li>✓ Normalize dates (Multiple formats)</li>
            </ul>
          </div>
        </div>

        {/* Error Handling Mode */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold mb-3 text-gray-800">Error Handling Mode:</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setValidationMode('include')}
              className={`px-3 py-2 rounded text-sm transition-colors ${
                validationMode === 'include'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Include (Warn)
            </button>
            <button
              onClick={() => setValidationMode('exclude')}
              className={`px-3 py-2 rounded text-sm transition-colors ${
                validationMode === 'exclude'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Exclude (Filter)
            </button>
            <button
              onClick={() => setValidationMode('block')}
              className={`px-3 py-2 rounded text-sm transition-colors ${
                validationMode === 'block'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Block (Strict)
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            {validationMode === 'include' && 'Import all rows with warnings for invalid data'}
            {validationMode === 'exclude' && 'Filter out invalid rows automatically'}
            {validationMode === 'block' && 'Prevent import if any errors exist'}
          </p>
        </div>

        {/* Sample Data Info */}
        <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h3 className="font-semibold text-yellow-900 mb-2">Sample Data Issues (All Auto-Fixed!):</h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>✓ Extra whitespace: "  emp001  " → trimmed</li>
            <li>✓ Inconsistent case: "emp001" → "EMP001"</li>
            <li>✓ Mixed email case → normalized to lowercase</li>
            <li>✓ Currency symbols: "$65,000" → 65000</li>
            <li>✓ Multiple date formats → YYYY-MM-DD</li>
            <li>✓ Names in all caps → Title Case</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setIsOpen(true)}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
          >
            Import Employee Data
          </button>
          <button
            onClick={downloadSampleCSV}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            Download Sample
          </button>
        </div>
      </div>

      {/* Results */}
      {data && data.rows && data.rows.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Imported & Transformed Data ({data.rows.length - 1} employees):
          </h3>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {data.rows[0]?.values?.map((header: string, idx: number) => (
                    <th key={idx} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.rows.slice(1).map((row: any, rowIdx: number) => (
                  <tr key={rowIdx} className="hover:bg-gray-50">
                    {row.values?.map((cell: string, cellIdx: number) => (
                      <td key={cellIdx} className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-3 bg-green-50 rounded-md border border-green-200">
            <p className="font-medium text-green-900 text-sm">
              ✓ All transformations applied successfully!
            </p>
          </div>
        </div>
      )}

      <CSVImporter
        modalIsOpen={isOpen}
        modalOnCloseTriggered={() => setIsOpen(false)}
        columns={columns}
        onComplete={handleComplete}
        invalidRowHandling={validationMode}
        theme="professional"
        primaryColor="#3b82f6"
      />
    </div>
  );
}
