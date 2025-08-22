import React, { useState } from 'react';
import { CSVImporter } from '../../src';
import { Column } from '../../src/types';

export default function EmployeeImportWithTransformations() {
  const [data, setData] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [testDataType, setTestDataType] = useState<'messy' | 'clean'>('messy');

  // Column definitions with both validators AND transformations
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
        { type: 'min_length', value: 2, message: 'Name must be at least 2 characters' },
        { type: 'max_length', value: 100, message: 'Name cannot exceed 100 characters' }
      ],
      transformations: [
        { type: 'trim' },
        { type: 'capitalize' }
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
        { type: 'trim' },
        { type: 'lowercase' }
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
        { type: 'capitalize' }
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
    },
    {
      id: 'phone',
      label: 'Phone Number',
      type: 'phone',
      validators: [],
      transformations: [
        { type: 'normalize_phone' }
      ]
    },
    {
      id: 'status',
      label: 'Employment Status',
      type: 'string',
      validators: [],
      transformations: [
        { type: 'default', value: 'active' },
        { type: 'lowercase' }
      ]
    },
    {
      id: 'notes',
      label: 'Notes',
      type: 'string',
      validators: [],
      transformations: [
        { type: 'trim' },
        { type: 'replace', find: '\\btemp\\b', replace: 'temporary' }
      ]
    }
  ];

  // Generate test CSV with messy data
  const generateMessyCSV = () => {
    const csvContent = `Employee ID,Full Name,Email Address,Department,Annual Salary,Hire Date,Phone Number,Employment Status,Notes
  emp001  ,  john doe  ,JOHN.DOE@EXAMPLE.COM,marketing,65000,2023/01/15,555.123.4567,,New hire - temp contract
EMP002,JANE SMITH,Jane.Smith@Example.Com,ENGINEERING,75000,02-20-2023,(555) 987-6543,ACTIVE,Senior developer
emp003,robert johnson  ,Robert@Example.com,sales,45000,March 10 2023,555-555-5555,Active,temp to perm
  EMP004,Sarah Wilson,sarah@EXAMPLE.COM,finance,85000,2023-05-12,+1 555 444 3333,,Remote worker
emp005  ,Michael Brown,MICHAEL.BROWN@EXAMPLE.COM,hr,55000,06/01/2023,555.222.1111,active,Part-time temp`;
    
    return csvContent;
  };

  // Generate clean CSV for comparison
  const generateCleanCSV = () => {
    const csvContent = `Employee ID,Full Name,Email Address,Department,Annual Salary,Hire Date,Phone Number,Employment Status,Notes
EMP001,John Doe,john.doe@example.com,Marketing,65000,2023-01-15,(555) 123-4567,active,New hire - temporary contract
EMP002,Jane Smith,jane.smith@example.com,Engineering,75000,2023-02-20,(555) 987-6543,active,Senior developer
EMP003,Robert Johnson,robert@example.com,Sales,45000,2023-03-10,(555) 555-5555,active,temporary to perm
EMP004,Sarah Wilson,sarah@example.com,Finance,85000,2023-05-12,(555) 444-3333,active,Remote worker
EMP005,Michael Brown,michael.brown@example.com,HR,55000,2023-06-01,(555) 222-1111,active,Part-time temporary`;
    
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
    console.log('=== DATA RECEIVED IN PARENT ===');
    console.log('importedData structure:', importedData);
    
    // Handle the standalone mode data structure
    // Standalone mode now returns {data: [...rows with values...], headers: [...], ...}
    let processedData;
    
    if (importedData.data && Array.isArray(importedData.data)) {
      // Standalone mode: data contains rows with values property
      const headers = importedData.headers || [];
      const dataRows = importedData.data;
      
      // Create rows structure with headers as first row
      processedData = {
        rows: [
          { values: headers },
          ...dataRows
        ]
      };
      
      console.log('Processed data with', processedData.rows.length, 'rows');
      console.log('First row (headers):', processedData.rows[0]?.values);
      console.log('First data row:', processedData.rows[1]?.values);
    } else if (importedData.rows) {
      // Direct rows structure
      processedData = importedData;
    } else {
      // Fallback: create empty structure
      processedData = { rows: [] };
      console.warn('No data found in imported data');
    }
    
    setData(processedData);
    setIsOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Employee Import with Transformations</h2>
        
        <div className="mb-4 p-4 bg-blue-50 rounded">
          <h3 className="font-semibold mb-2">How Transformations Work:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Upload messy data with inconsistent formatting</li>
            <li>Data validates against the original upload (you see what you uploaded)</li>
            <li>When you click Submit, transformations are applied silently</li>
            <li>Parent application receives clean, standardized data</li>
          </ol>
        </div>

        <div className="mb-4 flex space-x-4">
          <button
            onClick={() => setTestDataType('messy')}
            className={`px-4 py-2 rounded ${testDataType === 'messy' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Messy Data
          </button>
          <button
            onClick={() => setTestDataType('clean')}
            className={`px-4 py-2 rounded ${testDataType === 'clean' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Clean Data
          </button>
        </div>

        {testDataType === 'messy' && (
          <div className="mb-4 p-3 bg-yellow-50 rounded text-sm">
            <strong>Messy data includes:</strong>
            <ul className="list-disc list-inside mt-1">
              <li>Mixed case: "emp001", "JANE SMITH"</li>
              <li>Extra spaces: "  john doe  "</li>
              <li>Various phone formats: "555.123.4567", "(555) 987-6543"</li>
              <li>Different date formats: "2023/01/15", "March 10 2023"</li>
              <li>Plain numbers for salary: "65000" (no commas)</li>
              <li>Abbreviations: "temp" → "temporary"</li>
            </ul>
          </div>
        )}

        <div className="flex space-x-4">
          <button
            onClick={downloadCSV}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Download {testDataType === 'messy' ? 'Messy' : 'Clean'} Test CSV
          </button>
          <button
            onClick={() => setIsOpen(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Open Importer
          </button>
        </div>
      </div>

      {isOpen && (
        <CSVImporter
          columns={columns}
          onComplete={handleComplete}
          isModal={true}
          modalIsOpen={isOpen}
          modalOnCloseTriggered={() => setIsOpen(false)}
          modalCloseOnOutsideClick={true}
        />
      )}

      {data && data.rows && data.rows.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Transformed Data Received (After Submit):</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {data.rows[0]?.values && Array.isArray(data.rows[0].values) && 
                    data.rows[0].values.map((header: string, idx: number) => (
                      <th key={idx} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        {header}
                      </th>
                    ))
                  }
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.rows.slice(1).map((row: any, rowIdx: number) => (
                  <tr key={rowIdx}>
                    {row.values && Array.isArray(row.values) && 
                      row.values.map((cell: string, cellIdx: number) => (
                        <td key={cellIdx} className="px-3 py-2 text-sm text-gray-900">
                          {cell || ''}
                        </td>
                      ))
                    }
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 p-3 bg-green-50 rounded">
            <strong>Notice the transformations applied:</strong>
            <ul className="list-disc list-inside text-sm mt-1">
              <li>Employee IDs: All uppercase (EMP001, EMP002...)</li>
              <li>Names: Properly capitalized (John Doe, Jane Smith...)</li>
              <li>Emails: All lowercase (john.doe@example.com...)</li>
              <li>Departments: Capitalized (Marketing, Engineering...)</li>
              <li>Phones: Consistent format ((555) 123-4567...)</li>
              <li>Dates: ISO format (2023-01-15...)</li>
              <li>Status: Default "active" applied where empty</li>
              <li>Notes: "temp" replaced with "temporary"</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}