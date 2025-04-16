import React, { useState } from 'react';
import { CSVImporter } from "csv-import-react";

function TestImporter() {
  const [isOpen, setIsOpen] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [error, setError] = useState(null);

  // Simple template for testing
  const testTemplate = {
    columns: [
      {
        name: "Name",
        key: "name",
        required: true,
        description: "Person's name"
      },
      {
        name: "Email",
        key: "email",
        required: true,
        description: "Email address"
      },
      {
        name: "Age",
        key: "age",
        required: false,
        description: "Person's age",
        data_type: "number"
      }
    ]
  };

  const handleImportComplete = (data) => {
    console.log('CSV import complete with data:', data);
    
    // The CSV importer returns data in this format:
    // { num_rows, num_columns, error, columns, rows }
    
    // Display the raw data for debugging
    setImportResult(data);
    
    // Also log the transformed data for backend processing
    if (data.rows && Array.isArray(data.rows)) {
      const transformedData = {
        validData: data.rows,
        invalidData: []
      };
      console.log('Transformed data for backend:', transformedData);
    }
    
    setIsOpen(false);
  };

  return (
    <div className="TestImporter">
      <h1>CSV Importer Test</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <button 
        className="button" 
        onClick={() => setIsOpen(true)}
      >
        Open CSV Importer
      </button>
      
      {importResult && (
        <div className="import-result">
          <h3>Import Result (Raw Data)</h3>
          <pre>{JSON.stringify(importResult, null, 2)}</pre>
        </div>
      )}
      
      <CSVImporter
        isModal={true}
        modalIsOpen={isOpen}
        darkMode={true}
        template={testTemplate}
        modalOnCloseTriggered={() => {
          console.log('Modal close triggered');
          setIsOpen(false);
        }}
        modalCloseOnOutsideClick={true}
        onComplete={handleImportComplete}
        uploadConfig={{
          accept: '.csv',
          multiple: false
        }}
        onClose={() => {
          console.log('CSV importer closed');
          setIsOpen(false);
        }}
      />
    </div>
  );
}

export default TestImporter;
