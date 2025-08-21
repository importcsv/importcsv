import React from 'react';
import CSVImporter from './components/CSVImporter';
import { Column } from './types';

/**
 * Example of using CSVImporter in standalone mode (no backend required)
 * HelloCSV-inspired API
 */
function StandaloneExample() {
  // Define columns with HelloCSV-style validators
  const columns: Column[] = [
    {
      id: 'name',
      label: 'Full Name',
      type: 'string',
      validators: [
        { validate: 'required', message: 'Name is required' }
      ],
      description: 'Enter the person\'s full name'
    },
    {
      id: 'email',
      label: 'Email Address',
      type: 'email',
      validators: [
        { validate: 'required' },
        { validate: 'unique', message: 'Email must be unique' },
        { 
          validate: 'regex', 
          pattern: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$',
          message: 'Please enter a valid email'
        }
      ]
    },
    {
      id: 'age',
      label: 'Age',
      type: 'number',
      validators: [
        { validate: 'min', value: 18, message: 'Must be 18 or older' },
        { validate: 'max', value: 120, message: 'Invalid age' }
      ]
    },
    {
      id: 'phone',
      label: 'Phone Number',
      type: 'phone',
      description: 'US phone number',
      validators: [
        { validate: 'required' }
      ]
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: ['active', 'inactive', 'pending'],
      validators: [
        { validate: 'required', message: 'Please select a status' }
      ]
    },
    {
      id: 'join_date',
      label: 'Join Date',
      type: 'date',
      description: 'Date when the person joined'
    }
  ];

  const handleImportComplete = (result: any) => {
    console.log('Import completed!', result);
    
    if (result.success) {
      console.log(`Successfully imported ${result.num_rows} rows`);
      console.log('Data:', result.data);
      
      // Process the imported data
      result.data.forEach((row: any) => {
        console.log('Row:', row);
        // Send to your API, update state, etc.
      });
    } else {
      console.error('Import failed:', result.message);
    }
  };

  return (
    <div>
      <h1>CSV Import Example (Standalone Mode)</h1>
      <p>This importer works entirely in the browser - no backend required!</p>
      
      <CSVImporter
        columns={columns}
        onComplete={handleImportComplete}
        darkMode={false}
        primaryColor="#4F46E5"
        showDownloadTemplateButton={true}
      />
    </div>
  );
}

export default StandaloneExample;

/**
 * Example of backend mode for comparison
 */
export function BackendModeExample() {
  return (
    <CSVImporter
      importerKey="abc-123-def-456"
      backendUrl="https://api.example.com"
      onComplete={(result) => {
        console.log('Backend import result:', result);
      }}
    />
  );
}