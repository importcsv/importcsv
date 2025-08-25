import { useState } from 'react';
import { CSVImporter } from '../../src';
import type { Column } from '../../src';

export default function ValidationExample() {
  const [data, setData] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [testDataType, setTestDataType] = useState<'messy' | 'clean'>('messy');
  const [validationMode, setValidationMode] = useState<'include' | 'exclude' | 'block'>('block');
  const [includeUnmatched, setIncludeUnmatched] = useState(false);

  // Column definitions with smart auto-detection of transformation stages
  // Pre-validation transformations (trim, uppercase, etc.) run BEFORE validation
  // Post-validation transformations (default, capitalize) run AFTER validation
  const columns: Column[] = [
    {
      id: 'employee_id',
      label: 'Employee ID',
      type: 'string',
      validators: [
        { type: 'required' },
        { type: 'unique' },
        { type: 'regex', pattern: '^EMP\\d{3,6}$', message: 'Employee ID must follow pattern EMP### (3-6 digits)' }
      ],
      transformations: [
        { type: 'trim' },        // Auto-detected as pre-validation: removes whitespace before validation
        { type: 'uppercase' }    // Auto-detected as pre-validation: converts to uppercase before regex check
      ]
    },
    {
      id: 'name',
      label: 'Full Name',
      type: 'string',
      validators: [
        { type: 'required' },
        { type: 'min_length', value: 2, message: 'Name must be at least 2 characters' },
        { type: 'max_length', value: 100, message: 'Name cannot exceed 100 characters' }
      ],
      transformations: [
        { type: 'trim' },        // Auto-detected as pre-validation: removes whitespace
        { type: 'capitalize' }   // Auto-detected as post-validation: formats for display
      ]
    },
    {
      id: 'email',
      label: 'Email Address',
      type: 'email',
      validators: [
        { type: 'required' },
        { type: 'unique' }
      ],
      transformations: [
        { type: 'trim' },        // Auto-detected as pre-validation: removes whitespace
        { type: 'lowercase' }    // Auto-detected as pre-validation: normalizes email before validation
      ]
    },
    {
      id: 'department',
      label: 'Department',
      type: 'select',
      options: ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations'],
      validators: [
        { type: 'required' }
      ],
      transformations: [
        { type: 'capitalize' }   // Auto-detected as post-validation: formats for display
      ]
    },
    {
      id: 'salary',
      label: 'Annual Salary',
      type: 'number',
      validators: [
        { type: 'required' },
        { type: 'min', value: 30000, message: 'Salary must be at least $30,000' },
        { type: 'max', value: 500000, message: 'Salary cannot exceed $500,000' }
      ],
      transformations: [
        { type: 'trim' },                 // Auto-detected as pre-validation
        { type: 'remove_special_chars' }  // Auto-detected as pre-validation: cleans before number validation
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
        { type: 'normalize_date', format: 'YYYY-MM-DD' }  // Auto-detected as pre-validation: parses dates
      ]
    },
    {
      id: 'phone',
      label: 'Phone Number',
      type: 'phone',
      validators: [],
      transformations: [
        { type: 'normalize_phone' }  // Auto-detected as pre-validation: formats phone numbers
      ]
    },
    {
      id: 'status',
      label: 'Employment Status',
      type: 'string',
      validators: [],
      transformations: [
        { type: 'lowercase' },              // Auto-detected as pre-validation
        { type: 'default', value: 'active' } // Auto-detected as post-validation: adds default for empty
      ]
    }
  ];

  // Generate test CSV with messy data (includes extra columns to test includeUnmatchedColumns)
  const generateMessyCSV = () => {
    const csvContent = `Employee ID,Full Name,Email Address,Department,Annual Salary,Hire Date,Phone Number,Employment Status,Manager,Office Location
  emp001  ,  john doe  ,JOHN.DOE@EXAMPLE.COM,marketing,65000,2023/01/15,555.123.4567,,Jane Smith,Building A
EMP002,JANE SMITH,Jane.Smith@Example.Com,ENGINEERING,75000,02-20-2023,(555) 987-6543,ACTIVE,Bob Jones,Building B
emp003,robert johnson  ,Robert@Example.com,sales,45000,March 10 2023,555-555-5555,Active,Jane Smith,Building A
  EMP004,Sarah Wilson,sarah@EXAMPLE.COM,finance,85000,2023-05-12,+1 555 444 3333,,Bob Jones,Building C
emp005  ,Michael Brown,MICHAEL.BROWN@EXAMPLE.COM,hr,55000,06/01/2023,555.222.1111,active,Sarah Wilson,Building A
INVALID,  ,not-an-email,unknown-dept,not-a-number,invalid-date,bad-phone,,Unknown,`;

    return csvContent;
  };

  // Generate clean CSV for comparison
  const generateCleanCSV = () => {
    const csvContent = `Employee ID,Full Name,Email Address,Department,Annual Salary,Hire Date,Phone Number,Employment Status
EMP001,John Doe,john.doe@example.com,Marketing,65000,2023-01-15,(555) 123-4567,active
EMP002,Jane Smith,jane.smith@example.com,Engineering,75000,2023-02-20,(555) 987-6543,active
EMP003,Robert Johnson,robert@example.com,Sales,45000,2023-03-10,(555) 555-5555,active
EMP004,Sarah Wilson,sarah@example.com,Finance,85000,2023-05-12,(555) 444-3333,active
EMP005,Michael Brown,michael.brown@example.com,HR,55000,2023-06-01,(555) 222-1111,active`;

    return csvContent;
  };

  const downloadCSV = () => {
    const csvContent = testDataType === 'messy' ? generateMessyCSV() : generateCleanCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employee_data_${testDataType}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleComplete = (importedData: any) => {
    console.log('Import completed:', importedData);

    // Handle the standalone mode data structure
    let processedData;

    if (importedData.data && Array.isArray(importedData.data)) {
      const headers = importedData.headers || [];
      const dataRows = importedData.data;

      processedData = {
        rows: [
          { values: headers },
          ...dataRows
        ]
      };
    } else if (importedData.rows) {
      processedData = importedData;
    } else {
      processedData = { rows: [] };
    }

    setData(processedData);
    setIsOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Validation & Transformation Example</h2>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold mb-2 text-blue-900">Features Demonstrated:</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-blue-800 mb-1">Validations:</h4>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Required fields</li>
                <li>Unique constraints</li>
                <li>Pattern matching (regex)</li>
                <li>Min/max length</li>
                <li>Number ranges</li>
                <li>Email validation</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-1">Smart Transformations:</h4>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li><strong>Pre-validation:</strong> trim, uppercase, lowercase</li>
                <li><strong>Pre-validation:</strong> normalize_date, normalize_phone</li>
                <li><strong>Pre-validation:</strong> remove_special_chars</li>
                <li><strong>Post-validation:</strong> capitalize, default values</li>
              </ul>
              <p className="mt-2 text-xs text-blue-600 italic">
                ✨ Transformations automatically run at the optimal stage!
              </p>
            </div>
          </div>
        </div>

        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h3 className="font-semibold mb-3 text-gray-800">Import Options:</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invalid Row Handling:</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setValidationMode('include')}
                  className={`px-3 py-1.5 rounded text-sm transition-colors ${
                    validationMode === 'include' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  title="Import all rows, show warnings for invalid ones"
                >
                  Include (Warn)
                </button>
                <button
                  onClick={() => setValidationMode('exclude')}
                  className={`px-3 py-1.5 rounded text-sm transition-colors ${
                    validationMode === 'exclude' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  title="Filter out invalid rows, import only valid ones"
                >
                  Exclude (Filter)
                </button>
                <button
                  onClick={() => setValidationMode('block')}
                  className={`px-3 py-1.5 rounded text-sm transition-colors ${
                    validationMode === 'block' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  title="Block import if any invalid rows exist"
                >
                  Block (Strict)
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {validationMode === 'include' && "All rows will be imported with warnings shown for invalid data"}
                {validationMode === 'exclude' && "Invalid rows will be filtered out, only valid rows imported"}
                {validationMode === 'block' && "Import will be blocked if any validation errors exist (default)"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeUnmatched"
                checked={includeUnmatched}
                onChange={(e) => setIncludeUnmatched(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="includeUnmatched" className="text-sm text-gray-700">
                Include unmatched columns (e.g., Manager, Office Location)
              </label>
            </div>
          </div>
        </div>

        <div className="mb-4 flex gap-2">
          <button
            onClick={() => setTestDataType('messy')}
            className={`px-4 py-2 rounded-md transition-colors ${
              testDataType === 'messy' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Messy Data
          </button>
          <button
            onClick={() => setTestDataType('clean')}
            className={`px-4 py-2 rounded-md transition-colors ${
              testDataType === 'clean' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Clean Data
          </button>
        </div>

        {testDataType === 'messy' && (
          <div className="mb-4 p-3 bg-yellow-50 rounded-md border border-yellow-300">
            <p className="text-sm font-medium text-yellow-900 mb-1">Messy data includes:</p>
            <ul className="list-disc list-inside text-xs text-yellow-800 space-y-0.5">
              <li>Inconsistent case: "emp001" → auto-fixed to "EMP001" before validation ✅</li>
              <li>Extra whitespace: "  john doe  " → auto-trimmed before validation ✅</li>
              <li>Various phone formats: "555.123.4567" → auto-normalized ✅</li>
              <li>Different date formats: "2023/01/15" → auto-parsed to YYYY-MM-DD ✅</li>
              <li>Missing status values → auto-filled with "active" after validation ✅</li>
              <li>Invalid row with bad data → handled based on validation mode ⚠️</li>
              <li>Extra columns (Manager, Office) → {includeUnmatched ? 'will be included' : 'will be ignored'} 📊</li>
            </ul>
            <p className="mt-2 text-xs font-medium text-green-700">
              🎯 All these issues are now automatically handled!
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={downloadCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Download {testDataType === 'messy' ? 'Messy' : 'Clean'} Test CSV
          </button>
          <button
            onClick={() => setIsOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Open Importer
          </button>
        </div>
      </div>

      {isOpen && (
        <CSVImporter
          columns={columns}
          onComplete={handleComplete}
          invalidRowHandling={validationMode}
          includeUnmatchedColumns={includeUnmatched}
          isModal={true}
          modalIsOpen={isOpen}
          modalOnCloseTriggered={() => setIsOpen(false)}
          modalCloseOnOutsideClick={true}
        />
      )}

      {data && data.rows && data.rows.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Transformed Data (After Import):</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {data.rows[0]?.values && Array.isArray(data.rows[0].values) &&
                    data.rows[0].values.map((header: string, idx: number) => (
                      <th key={idx} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {header}
                      </th>
                    ))
                  }
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.rows.slice(1).map((row: any, rowIdx: number) => (
                  <tr key={rowIdx} className="hover:bg-gray-50">
                    {row.values && Array.isArray(row.values) &&
                      row.values.map((cell: string, cellIdx: number) => (
                        <td key={cellIdx} className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">
                          {cell || ''}
                        </td>
                      ))
                    }
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-3 bg-green-50 rounded-md border border-green-200">
            <p className="font-medium text-green-900 text-sm mb-1">Transformations Applied:</p>
            <ul className="list-disc list-inside text-xs text-green-800 space-y-0.5">
              <li>Employee IDs: All uppercase (EMP001, EMP002...)</li>
              <li>Names: Properly capitalized</li>
              <li>Emails: All lowercase</li>
              <li>Departments: Capitalized</li>
              <li>Phones: Consistent format</li>
              <li>Dates: ISO format (YYYY-MM-DD)</li>
              <li>Status: Default "active" where empty</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}