import { useState } from 'react'
import { CSVImporter } from '@importcsv/react'
import type { Column } from '@importcsv/react'

const CustomerData: React.FC = () => {
  const [importedData, setImportedData] = useState<any[]>([])
  const [showImporter, setShowImporter] = useState(false)

  // Focus on email, phone, postal code validations and transformations
  const columns: Column[] = [
    {
      id: 'customer_id',
      label: 'Customer ID',
      type: 'string',
      validators: [
        { type: 'required' },
        { type: 'unique' }
      ]
    },
    {
      id: 'full_name',
      label: 'Full Name',
      type: 'string',
      validators: [
        { type: 'required' },
        { type: 'min_length', value: 2 },
        { type: 'max_length', value: 50 }
      ]
    },
    {
      id: 'email',
      label: 'Email',
      type: 'email',
      validators: [
        { type: 'required' },
        { type: 'unique', message: 'Email already exists' }
      ]
    },
    {
      id: 'phone',
      label: 'Phone Number',
      type: 'phone',
      validators: [
        { type: 'required' }
      ],
      description: 'Will be validated as 10+ digits'
    },
    {
      id: 'postal_code',
      label: 'Postal Code',
      type: 'string',
      validators: [
        { type: 'regex', pattern: '^\\d{5}(-\\d{4})?$', message: 'Must be 5 digits or 5+4 format' }
      ],
      description: 'US ZIP code format'
    },
    {
      id: 'credit_limit',
      label: 'Credit Limit',
      type: 'number',
      validators: [
        { type: 'min', value: 0 },
        { type: 'max', value: 100000 }
      ]
    },
    {
      id: 'account_type',
      label: 'Account Type',
      type: 'select',
      options: ['Basic', 'Premium', 'Enterprise'],
      validators: [
        { type: 'required' }
      ]
    }
  ]

  const downloadTestCSV = () => {
    const csvContent = `Customer ID,Full Name,Email,Phone Number,Postal Code,Credit Limit,Account Type
C001,John Smith,john@email.com,555-123-4567,12345,5000,Basic
C002,Jane Doe,jane@email.com,(555) 987-6543,12345-6789,10000,Premium
C003,Bob Wilson,bob@email.com,15551234567,54321,15000,Enterprise
C001,Duplicate ID,dup@email.com,555-111-2222,99999,5000,Basic
C005,Short,john@email.com,123,ABCDE,200000,Invalid
C006,Missing Email,,555-999-8888,12345,5000,Basic
C007,Very Long Name That Exceeds The Maximum Character Limit For Names,toolong@email.com,555-777-6666,12345,5000,Premium`

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'customers_test.csv'
    link.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="section">
        <h2 className="section-title">Customer Data Import - Email, Phone & Postal Validation</h2>

        <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
          Tests email validation, phone number format, postal codes, and duplicate detection.
          The test file includes both valid and invalid data to demonstrate validation.
        </p>

        <button onClick={downloadTestCSV} className="download-btn">
          Download Test CSV (with errors)
        </button>

        <button
          onClick={() => setShowImporter(true)}
          className="download-btn"
          style={{ marginLeft: '1rem' }}
        >
          Open Importer
        </button>

        {showImporter && (
          <CSVImporter
            columns={columns}
            onComplete={(result) => {
              console.log('Customer import:', result)
              setImportedData(result.data || result)
              setShowImporter(false)
            }}
            modalIsOpen={showImporter}
            modalOnCloseTriggered={() => setShowImporter(false)}
            primaryColor="#8b5cf6"
          />
        )}
      </div>

      <div className="section">
        <h3 className="result-title">Expected Validation Errors in Test File:</h3>
        <div className="error-list">
          <div className="error-item">• Row 4: Duplicate Customer ID (C001)</div>
          <div className="error-item">• Row 5: Name too short, duplicate email, invalid phone (too short), invalid postal code (letters), credit limit exceeds max</div>
          <div className="error-item">• Row 6: Missing email (required field)</div>
          <div className="error-item">• Row 7: Name exceeds 50 character limit</div>
        </div>
      </div>

      {importedData.length > 0 && (
        <div className="section results">
          <h3 className="result-title">Successfully Imported: {importedData.length} customers</h3>
          <pre className="json-display">
            {JSON.stringify(importedData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}

export default CustomerData