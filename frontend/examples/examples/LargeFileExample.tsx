import { useState } from 'react';
import { CSVImporter } from '../../src';
import type { Column } from '../../src';

// Generate a large CSV string for testing
const generateLargeCSV = (rows: number) => {
  const headers = ['ID', 'Name', 'Email', 'Age', 'Department', 'Salary', 'Join Date', 'Status'];
  const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'];
  const statuses = ['Active', 'Inactive', 'On Leave'];
  
  let csv = headers.join(',') + '\n';
  
  for (let i = 1; i <= rows; i++) {
    const row = [
      i,
      `Employee ${i}`,
      `employee${i}@company.com`,
      Math.floor(Math.random() * 40) + 25,
      departments[Math.floor(Math.random() * departments.length)],
      Math.floor(Math.random() * 100000) + 40000,
      `2020-0${Math.floor(Math.random() * 9) + 1}-${Math.floor(Math.random() * 28) + 1}`,
      statuses[Math.floor(Math.random() * statuses.length)]
    ];
    csv += row.join(',') + '\n';
  }
  
  return csv;
};

export default function LargeFileExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [dataSize, setDataSize] = useState(10000);
  const [isGenerating, setIsGenerating] = useState(false);

  const columns: Column[] = [
    { 
      id: 'id', 
      label: 'ID', 
      type: 'number',
      validators: [{ type: 'required' }] 
    },
    { 
      id: 'name', 
      label: 'Name', 
      type: 'string',
      validators: [{ type: 'required' }] 
    },
    { 
      id: 'email', 
      label: 'Email', 
      type: 'email',
      validators: [
        { type: 'required' },
        { type: 'email', message: 'Valid email required' }
      ] 
    },
    { 
      id: 'age', 
      label: 'Age', 
      type: 'number',
      validators: [
        { type: 'min', value: 18, message: 'Must be 18 or older' },
        { type: 'max', value: 100, message: 'Invalid age' }
      ]
    },
    { 
      id: 'department', 
      label: 'Department', 
      type: 'select',
      options: ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'] 
    },
    { 
      id: 'salary', 
      label: 'Salary', 
      type: 'number',
      validators: [
        { type: 'min', value: 0, message: 'Salary cannot be negative' }
      ]
    },
    { 
      id: 'join_date', 
      label: 'Join Date', 
      type: 'date' 
    },
    { 
      id: 'status', 
      label: 'Status', 
      type: 'select',
      options: ['Active', 'Inactive', 'On Leave'] 
    }
  ];

  const downloadLargeCSV = () => {
    setIsGenerating(true);
    
    // Use setTimeout to prevent UI blocking
    setTimeout(() => {
      const csvContent = generateLargeCSV(dataSize);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `large_dataset_${dataSize}_rows.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      setIsGenerating(false);
    }, 100);
  };

  const handleComplete = (data: any) => {
    console.log('Import completed:', data);
    setResult(data);
    setIsOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Large Dataset Performance Test</h2>
        <p className="text-gray-600 mb-6">
          Test the CSV importer with large datasets to verify virtual scrolling and performance optimization.
        </p>
        
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold mb-2 text-blue-900">Performance Features:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
            <li>Virtual scrolling for smooth navigation through thousands of rows</li>
            <li>Progressive validation to prevent UI blocking</li>
            <li>Efficient memory management for large files</li>
            <li>Chunked processing for better responsiveness</li>
          </ul>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select dataset size:
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[100, 1000, 5000, 10000, 25000, 50000, 100000].map((size) => (
              <button
                key={size}
                onClick={() => setDataSize(size)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  dataSize === size
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {size.toLocaleString()} rows
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={downloadLargeCSV}
            disabled={isGenerating}
            className={`px-4 py-2 rounded-md transition-colors ${
              isGenerating
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isGenerating ? 'Generating...' : `Download ${dataSize.toLocaleString()} Row CSV`}
          </button>
          <button 
            onClick={() => setIsOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Open Importer
          </button>
        </div>

        <div className="mt-4 p-3 bg-yellow-50 rounded-md border border-yellow-300">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> For files with 50,000+ rows, the download may take a moment to generate. 
            The importer uses virtual scrolling to maintain smooth performance even with very large datasets.
          </p>
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

      {result && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Import Results</h3>
          
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Status</p>
              <p className="text-xl font-semibold text-green-600">
                {result.success ? '✓ Success' : '✗ Failed'}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Rows Imported</p>
              <p className="text-xl font-semibold text-gray-800">
                {(result.num_rows || result.data?.length || 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Columns</p>
              <p className="text-xl font-semibold text-gray-800">
                {result.num_columns || result.headers?.length || 0}
              </p>
            </div>
          </div>

          {result.data && result.data.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Sample Data (First 5 rows):</p>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {result.headers?.map((header: string, idx: number) => (
                        <th key={idx} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {result.data.slice(0, 5).map((row: any, rowIdx: number) => (
                      <tr key={rowIdx} className="hover:bg-gray-50">
                        {row.values?.map((cell: any, cellIdx: number) => (
                          <td key={cellIdx} className="px-3 py-2 text-gray-900 whitespace-nowrap">
                            {cell || ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}