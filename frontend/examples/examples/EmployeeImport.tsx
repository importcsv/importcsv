import React, { useState } from 'react'
import { CSVImporter } from '@importcsv/react'
import type { Column } from '@importcsv/react'

type TestDataType = 'valid' | 'errors' | 'edge-cases'

const EmployeeImport: React.FC = () => {
  const [importedData, setImportedData] = useState<any[]>([])
  const [showImporter, setShowImporter] = useState(false)
  const [testDataType, setTestDataType] = useState<TestDataType>('valid')
  const [validationResults, setValidationResults] = useState<{
    total: number
    valid: number
    errors: number
    errorDetails: string[]
  } | null>(null)

  // Enhanced column definitions with all validation types
  const columns: Column[] = [
    {
      id: 'employee_id',
      label: 'Employee ID',
      type: 'string',
      validators: [
        { type: 'required', message: 'Employee ID is mandatory' },
        { type: 'unique', message: 'Employee ID must be unique' },
        { type: 'regex', pattern: '^EMP[0-9]{3,6}$', message: 'Must follow pattern EMP### (e.g., EMP001)' }
      ],
      description: 'Unique identifier (EMP001-EMP999999)'
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
      placeholder: 'John Doe'
    },
    {
      id: 'email',
      label: 'Email Address',
      type: 'email',
      validators: [
        { type: 'required' },
        { type: 'unique', message: 'Email must be unique' }
      ],
      description: 'Company email address'
    },
    {
      id: 'department',
      label: 'Department',
      type: 'select',
      options: ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations'],
      validators: [
        { type: 'required', message: 'Department selection is required' }
      ]
    },
    {
      id: 'salary',
      label: 'Annual Salary',
      type: 'number',
      validators: [
        { type: 'required' },
        { type: 'min', value: 30000, message: 'Minimum salary is $30,000' },
        { type: 'max', value: 500000, message: 'Maximum salary is $500,000' }
      ],
      description: 'Annual salary in USD (30000-500000)'
    },
    {
      id: 'hire_date',
      label: 'Hire Date',
      type: 'date',
      validators: [
        { type: 'required', message: 'Hire date is required' }
      ],
      placeholder: 'YYYY-MM-DD'
    },
    {
      id: 'phone',
      label: 'Phone Number',
      type: 'phone',
      validators: [
        { type: 'regex', pattern: '^\\+?[1-9]\\d{9,14}$', message: 'Must be 10-15 digits, optionally starting with +' }
      ],
      description: 'International format (optional)'
    },
    {
      id: 'employee_code',
      label: 'Employee Code',
      type: 'string',
      validators: [
        { type: 'regex', pattern: '^[A-Z]{2}-\\d{4}-[A-Z]$', message: 'Format: XX-9999-X (e.g., NY-2024-A)' }
      ],
      description: 'Location-Year-Level code'
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

  const generateTestCSV = (type: TestDataType): string => {
    const headers = columns.map(col => col.label).join(',')
    
    let rows: string[] = []
    
    switch (type) {
      case 'valid':
        rows = [
          'EMP001,John Smith,john.smith@company.com,Engineering,120000,2022-01-15,+14155551234,NY-2022-A,true',
          'EMP002,Jane Doe,jane.doe@company.com,Marketing,95000,2022-03-20,+14155555678,SF-2022-B,true',
          'EMP003,Bob Johnson,bob.johnson@company.com,Sales,85000,2021-11-10,+12125551234,NY-2021-A,true',
          'EMP004,Alice Williams,alice.williams@company.com,HR,75000,2023-02-01,+13105559012,LA-2023-C,true',
          'EMP005,Charlie Brown,charlie.brown@company.com,Finance,110000,2020-07-15,+14155553456,SF-2020-A,false'
        ]
        break
        
      case 'errors':
        rows = [
          // Invalid employee ID pattern
          'EMPLOYEE1,John Smith,john.smith@company.com,Engineering,120000,2022-01-15,+14155551234,NY-2022-A,true',
          // Duplicate employee ID
          'EMP001,Jane Doe,jane.doe@company.com,Marketing,95000,2022-03-20,+14155555678,SF-2022-B,true',
          'EMP001,Bob Duplicate,bob@company.com,Sales,85000,2021-11-10,+12125551234,NY-2021-A,true',
          // Missing required fields (no name)
          'EMP006,,missing.name@company.com,HR,75000,2023-02-01,+13105559012,LA-2023-C,true',
          // Invalid email format
          'EMP007,Invalid Email,not-an-email,Finance,110000,2020-07-15,+14155553456,SF-2020-A,false',
          // Salary below minimum
          'EMP008,Low Salary,low@company.com,Engineering,15000,2022-01-15,+14155551234,NY-2022-A,true',
          // Salary above maximum
          'EMP009,High Salary,high@company.com,Marketing,999999,2022-03-20,+14155555678,SF-2022-B,true',
          // Invalid department
          'EMP010,Wrong Dept,dept@company.com,Janitorial,50000,2021-11-10,+12125551234,NY-2021-A,true',
          // Invalid date format
          'EMP011,Bad Date,date@company.com,Sales,60000,not-a-date,+13105559012,LA-2023-C,true',
          // Invalid phone format
          'EMP012,Bad Phone,phone@company.com,HR,70000,2020-07-15,123,SF-2020-A,false',
          // Invalid employee code format
          'EMP013,Bad Code,code@company.com,Finance,80000,2020-07-15,+14155553456,INVALID-CODE,false',
          // Duplicate email
          'EMP014,Duplicate Email,john.smith@company.com,Engineering,90000,2022-01-15,+14155551234,NY-2022-A,true'
        ]
        break
        
      case 'edge-cases':
        rows = [
          // Minimum valid values
          'EMP100,Jo,j@c.co,Engineering,30000,2020-01-01,+1234567890,AA-0000-A,true',
          // Maximum valid values
          'EMP999999,' + 'A'.repeat(100) + ',very.long.email.address.test@company-with-long-domain.com,Finance,500000,2024-12-31,+123456789012345,ZZ-9999-Z,false',
          // Empty optional fields
          'EMP200,Name Only,required@company.com,HR,50000,2023-01-01,,,true',
          // Special characters in name
          'EMP201,José María García-López,jose@company.com,Marketing,60000,2023-01-01,+14155551234,NY-2023-B,true',
          // Boundary salary values
          'EMP202,Min Salary,min@company.com,Sales,30000,2023-01-01,+14155551234,LA-2023-A,true',
          'EMP203,Max Salary,max@company.com,Operations,500000,2023-01-01,+14155551234,SF-2023-C,false',
          // Various valid email formats
          'EMP204,Email Test,user+tag@company.com,Engineering,70000,2023-01-01,+14155551234,NY-2023-A,true',
          'EMP205,Email Test2,first.last@sub.company.com,HR,80000,2023-01-01,+14155551234,LA-2023-B,true'
        ]
        break
    }
    
    return [headers, ...rows].join('\n')
  }

  const downloadTestCSV = () => {
    const csvContent = generateTestCSV(testDataType)
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `employees_${testDataType}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const analyzeValidationResults = (data: any[]) => {
    // This would be populated by actual validation results from the importer
    // For now, we'll simulate based on the test data type
    const results = {
      total: data.length,
      valid: data.length,
      errors: 0,
      errorDetails: [] as string[]
    }
    
    if (testDataType === 'errors') {
      results.valid = 0
      results.errors = data.length
      results.errorDetails = [
        'Row 1: Invalid Employee ID format',
        'Row 2-3: Duplicate Employee ID (EMP001)',
        'Row 4: Name is required',
        'Row 5: Invalid email format',
        'Row 6: Salary below minimum ($30,000)',
        'Row 7: Salary above maximum ($500,000)',
        'Row 8: Invalid department selection',
        'Row 9: Invalid date format',
        'Row 10: Invalid phone number format',
        'Row 11: Invalid employee code format',
        'Row 12: Duplicate email address'
      ]
    }
    
    setValidationResults(results)
  }

  const handleImportComplete = (result: any) => {
    console.log('Import completed:', result)
    const data = result.data || result
    setImportedData(data)
    analyzeValidationResults(data)
    setShowImporter(false)
  }

  const handleCancel = () => {
    console.log('Import cancelled')
    setShowImporter(false)
  }

  return (
    <div>
      <div className="section">
        <h2 className="section-title">Employee Import - Comprehensive Validation Testing</h2>
        
        <div className="test-controls">
          <button 
            className={`test-btn ${testDataType === 'valid' ? 'active' : ''}`}
            onClick={() => setTestDataType('valid')}
          >
            Valid Data
          </button>
          <button 
            className={`test-btn ${testDataType === 'errors' ? 'active' : ''}`}
            onClick={() => setTestDataType('errors')}
          >
            With Errors
          </button>
          <button 
            className={`test-btn ${testDataType === 'edge-cases' ? 'active' : ''}`}
            onClick={() => setTestDataType('edge-cases')}
          >
            Edge Cases
          </button>
        </div>
        
        <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
          {testDataType === 'valid' && 'Test with clean, valid data that should pass all validations'}
          {testDataType === 'errors' && 'Test with various validation errors to see error handling'}
          {testDataType === 'edge-cases' && 'Test boundary conditions and special cases'}
        </p>
        
        <button onClick={downloadTestCSV} className="download-btn">
          Download {testDataType === 'valid' ? 'Valid' : testDataType === 'errors' ? 'Error' : 'Edge Case'} Test CSV
        </button>

        <button 
          onClick={() => setShowImporter(true)} 
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
                testType: testDataType,
                timestamp: new Date().toISOString()
              }}
              primaryColor="#3b82f6"
              darkMode={false}
            />
          </div>
        )}
      </div>

      {validationResults && (
        <div className="section">
          <h3 className="result-title">Validation Results</h3>
          
          <div className="validation-summary">
            <div className="validation-stat success">
              ✓ Valid: {validationResults.valid}
            </div>
            <div className="validation-stat error">
              ✗ Errors: {validationResults.errors}
            </div>
            <div className="validation-stat">
              Total: {validationResults.total}
            </div>
          </div>
          
          {validationResults.errorDetails.length > 0 && (
            <div className="error-list">
              <h4 style={{ marginBottom: '0.5rem' }}>Error Details:</h4>
              {validationResults.errorDetails.map((error, idx) => (
                <div key={idx} className="error-item">• {error}</div>
              ))}
            </div>
          )}
        </div>
      )}

      {importedData.length > 0 && (
        <div className="section results">
          <h3 className="result-title">Imported Data</h3>
          
          <div className="result-section">
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
        </div>
      )}

      <div className="section">
        <h3 className="result-title">Validation Rules Applied</h3>
        <ul style={{ color: '#374151', lineHeight: 1.8 }}>
          <li><strong>Employee ID:</strong> Required, Unique, Pattern: EMP### (3-6 digits)</li>
          <li><strong>Name:</strong> Required, 2-100 characters</li>
          <li><strong>Email:</strong> Required, Unique, Valid email format</li>
          <li><strong>Department:</strong> Required, Must be from predefined list</li>
          <li><strong>Salary:</strong> Required, $30,000 - $500,000</li>
          <li><strong>Hire Date:</strong> Required, Valid date format</li>
          <li><strong>Phone:</strong> Optional, 10-15 digits with optional + prefix</li>
          <li><strong>Employee Code:</strong> Optional, Pattern: XX-9999-X</li>
          <li><strong>Active Status:</strong> Required, true/false</li>
        </ul>
      </div>
    </div>
  )
}

export default EmployeeImport