import React, { useState } from 'react';
import { CSVImporter } from '../../src';
import type { Column } from '../../src';

const columns: Column[] = [
  {
    id: 'name',
    label: 'Full Name',
    type: 'string',
    validators: [
      { type: 'required' },
      { type: 'min_length', value: 2, message: 'Name must be at least 2 characters' }
    ],
  },
  {
    id: 'email',
    label: 'Email Address',
    type: 'email',
    validators: [
      { type: 'required' },
      { type: 'email' }
    ],
  },
  {
    id: 'department',
    label: 'Department',
    type: 'select',
    options: ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations'],
    validators: [{ type: 'required' }]
  },
  {
    id: 'role',
    label: 'Job Role',
    type: 'string',
    validators: [{ type: 'required' }]
  },
  {
    id: 'start_date',
    label: 'Start Date',
    type: 'date',
    validators: [{ type: 'required' }]
  }
];

export default function DarkModeExample() {
  const [selectedTheme, setSelectedTheme] = useState<'light' | 'dark' | 'custom'>('light');
  const [isOpen, setIsOpen] = useState(false);
  const [importedData, setImportedData] = useState<any>(null);

  const handleComplete = (data: any) => {
    setIsOpen(false);
    setImportedData(data);
    console.log('Import completed:', data);
  };

  const generateSampleCSV = () => {
    const csvContent = `Full Name,Email Address,Department,Job Role,Start Date
John Smith,john.smith@example.com,Engineering,Senior Developer,2023-01-15
Jane Doe,jane.doe@example.com,Marketing,Marketing Manager,2023-02-20
Bob Johnson,bob.j@example.com,Sales,Sales Representative,2023-03-10
Alice Williams,alice.w@example.com,HR,HR Specialist,2023-04-05
Charlie Brown,charlie.b@example.com,Finance,Financial Analyst,2023-05-12`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_employees.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Custom theme configuration
  const getThemeConfig = () => {
    if (selectedTheme === 'custom') {
      return {
        primaryColor: '#8B5CF6', // Purple
        darkMode: false,
      };
    }
    return {
      darkMode: selectedTheme === 'dark',
    };
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Theme & Dark Mode Example</h2>
        <p className="text-gray-600 mb-6">
          Test different visual themes including light mode, dark mode, and custom color schemes.
        </p>

        <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
          <h3 className="font-semibold mb-2 text-gray-800">Available Themes:</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-3 rounded-md shadow-sm">
              <h4 className="font-medium text-gray-700 mb-1">Light Mode</h4>
              <p className="text-gray-600 text-xs">Clean, professional appearance with high contrast</p>
            </div>
            <div className="bg-gray-800 p-3 rounded-md shadow-sm">
              <h4 className="font-medium text-gray-100 mb-1">Dark Mode</h4>
              <p className="text-gray-300 text-xs">Reduced eye strain in low-light environments</p>
            </div>
            <div className="bg-purple-600 p-3 rounded-md shadow-sm">
              <h4 className="font-medium text-white mb-1">Custom Theme</h4>
              <p className="text-purple-100 text-xs">Brand-specific colors (Purple primary)</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Select Theme:
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => setSelectedTheme('light')}
              className={`px-4 py-2 rounded-md transition-all transform ${
                selectedTheme === 'light'
                  ? 'bg-gray-100 text-gray-900 ring-2 ring-gray-400 scale-105'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              ☀️ Light Mode
            </button>
            <button
              onClick={() => setSelectedTheme('dark')}
              className={`px-4 py-2 rounded-md transition-all transform ${
                selectedTheme === 'dark'
                  ? 'bg-gray-800 text-white ring-2 ring-gray-600 scale-105'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              🌙 Dark Mode
            </button>
            <button
              onClick={() => setSelectedTheme('custom')}
              className={`px-4 py-2 rounded-md transition-all transform ${
                selectedTheme === 'custom'
                  ? 'bg-purple-600 text-white ring-2 ring-purple-400 scale-105'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              🎨 Custom Theme
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={generateSampleCSV}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Download Sample CSV
          </button>
          <button 
            onClick={() => setIsOpen(true)}
            className={`px-4 py-2 rounded-md transition-colors ${
              selectedTheme === 'custom'
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Open Importer ({selectedTheme === 'light' ? 'Light' : selectedTheme === 'dark' ? 'Dark' : 'Custom'} Theme)
          </button>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Tip:</strong> The importer automatically adapts its entire UI to match the selected theme, 
            including buttons, backgrounds, text colors, and validation messages.
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
          {...getThemeConfig()}
        />
      )}

      {importedData && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Import Successful</h3>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm text-green-600 mb-1">Theme Used</p>
              <p className="text-xl font-semibold text-green-800 capitalize">
                {selectedTheme === 'custom' ? 'Custom (Purple)' : selectedTheme} Mode
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-600 mb-1">Rows Imported</p>
              <p className="text-xl font-semibold text-blue-800">
                {importedData.data?.length || 0}
              </p>
            </div>
          </div>

          {importedData.data && importedData.data.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {importedData.headers?.map((header: string, idx: number) => (
                      <th key={idx} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {importedData.data.map((row: any, rowIdx: number) => (
                    <tr key={rowIdx} className="hover:bg-gray-50">
                      {row.values?.map((cell: any, cellIdx: number) => (
                        <td key={cellIdx} className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">
                          {cell || ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}