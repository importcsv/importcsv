import React, { useState } from 'react'
import { CSVImporter } from '@importcsv/react'
import type { Column } from '@importcsv/react'

const App: React.FC = () => {
  const [importedData, setImportedData] = useState<any[]>([])
  const [showImporter, setShowImporter] = useState(false)

  // Define columns for employee data import
  const columns: Column[] = [
    {
      id: 'employee_id',
      label: 'Employee ID',
      type: 'string',
      validators: [
        { type: 'required' },
        { type: 'unique' }
      ],
      description: 'Unique identifier for the employee'
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
      placeholder: 'John Doe'
    },
    {
      id: 'email',
      label: 'Email Address',
      type: 'email',
      validators: [
        { type: 'required' },
        { type: 'unique' }
      ],
      description: 'Company email address'
    },
    {
      id: 'department',
      label: 'Department',
      type: 'select',
      options: ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations'],
      validators: [
        { type: 'required' }
      ]
    },
    {
      id: 'salary',
      label: 'Annual Salary',
      type: 'number',
      validators: [
        { type: 'required' },
        { type: 'min', value: 30000 },
        { type: 'max', value: 500000 }
      ],
      description: 'Annual salary in USD'
    },
    {
      id: 'hire_date',
      label: 'Hire Date',
      type: 'date',
      validators: [
        { type: 'required' }
      ],
      placeholder: 'YYYY-MM-DD'
    },
    {
      id: 'phone',
      label: 'Phone Number',
      type: 'phone',
      validators: [
        { type: 'regex', pattern: '^\\+?[1-9]\\d{1,14}$', message: 'Invalid phone number format' }
      ],
      description: 'Contact phone number (optional)'
    },
    {
      id: 'is_active',
      label: 'Active Status',
      type: 'select',
      options: ['true', 'false'],
      validators: [
        { type: 'required' }
      ]
    }
  ]

  const downloadSampleCSV = () => {
    const headers = columns.map(col => col.label).join(',')
    const sampleData = [
      headers,
      'EMP001,John Smith,john.smith@company.com,Engineering,120000,2022-01-15,+14155551234,true',
      'EMP002,Jane Doe,jane.doe@company.com,Marketing,95000,2022-03-20,+14155555678,true',
      'EMP003,Bob Johnson,bob.johnson@company.com,Sales,85000,2021-11-10,,true',
      'EMP004,Alice Williams,alice.williams@company.com,HR,75000,2023-02-01,+14155559012,true',
      'EMP005,Charlie Brown,charlie.brown@company.com,Finance,110000,2020-07-15,+14155553456,true'
    ].join('\n')

    const blob = new Blob([sampleData], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'employee_sample.csv'
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const handleImportComplete = (data: any[]) => {
    console.log('Import completed:', data)
    setImportedData(data)
    setShowImporter(false)
  }

  const handleCancel = () => {
    console.log('Import cancelled')
    setShowImporter(false)
  }

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">ImportCSV React - Standalone Mode Example</h1>
        <p className="subtitle">
          Test the CSV importer in frontend-only mode with validation
        </p>
      </div>

      <div className="section">
        <h2 className="section-title">Employee Data Import</h2>
        
        <button onClick={downloadSampleCSV} className="download-btn">
          Download Sample CSV
        </button>

        <button 
          onClick={() => {
            console.log('Opening importer with columns:', columns)
            setShowImporter(true)
          }} 
          className="download-btn"
          style={{ marginLeft: '1rem' }}
        >
          Open Importer
        </button>

        {showImporter && (
          <div style={{ marginTop: '1rem' }}>
            <CSVImporter
              columns={columns}
              onComplete={handleImportComplete}
              onCancel={handleCancel}
              modalIsOpen={showImporter}
              modalOnCloseTriggered={handleCancel}
              metadata={{
                importType: 'employees',
                timestamp: new Date().toISOString()
              }}
              primaryColor="#3b82f6"
              darkMode={false}
            />
          </div>
        )}
      </div>

      {importedData.length > 0 && (
        <div className="section results">
          <h2 className="section-title">Imported Data</h2>
          
          <div className="stats">
            <div className="stat">
              <span className="stat-label">Total Records</span>
              <span className="stat-value">{importedData.length}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Columns</span>
              <span className="stat-value">{columns.length}</span>
            </div>
          </div>

          <div className="result-section">
            <h3 className="result-title">Table View</h3>
            <table className="data-table">
              <thead>
                <tr>
                  {columns.map(col => (
                    <th key={col.id}>{col.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {importedData.slice(0, 10).map((row, idx) => (
                  <tr key={idx}>
                    {columns.map(col => (
                      <td key={col.id}>{row[col.id] || '-'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {importedData.length > 10 && (
              <p style={{ marginTop: '1rem', color: '#6b7280' }}>
                Showing first 10 of {importedData.length} records
              </p>
            )}
          </div>

          <div className="result-section">
            <h3 className="result-title">JSON Output</h3>
            <pre className="json-display">
              {JSON.stringify(importedData, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

export default App