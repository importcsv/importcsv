import { useState } from 'react'
import { CSVImporter } from '@importcsv/react'
import type { Column, Validator } from '@importcsv/react'

const ValidationTester: React.FC = () => {
  const [showImporter, setShowImporter] = useState(false)
  const [customColumns, setCustomColumns] = useState<Column[]>([])

  // Pre-defined test scenarios
  const testScenarios = [
    {
      name: 'All Validators',
      columns: [
        {
          id: 'required_field',
          label: 'Required Field',
          type: 'string',
          validators: [{ type: 'required' }]
        },
        {
          id: 'unique_field',
          label: 'Unique Field',
          type: 'string',
          validators: [{ type: 'unique' }]
        },
        {
          id: 'email_field',
          label: 'Email Field',
          type: 'email',
          validators: [{ type: 'required' }]
        },
        {
          id: 'number_range',
          label: 'Number (1-100)',
          type: 'number',
          validators: [
            { type: 'min', value: 1 },
            { type: 'max', value: 100 }
          ]
        },
        {
          id: 'text_length',
          label: 'Text (5-20 chars)',
          type: 'string',
          validators: [
            { type: 'min_length', value: 5 },
            { type: 'max_length', value: 20 }
          ]
        },
        {
          id: 'pattern_field',
          label: 'Pattern (ABC-123)',
          type: 'string',
          validators: [
            { type: 'regex', pattern: '^[A-Z]{3}-\\d{3}$', message: 'Must match ABC-123 format' }
          ]
        },
        {
          id: 'select_field',
          label: 'Select Option',
          type: 'select',
          options: ['Option A', 'Option B', 'Option C'],
          validators: [{ type: 'required' }]
        },
        {
          id: 'date_field',
          label: 'Date Field',
          type: 'date',
          validators: [{ type: 'required' }]
        },
        {
          id: 'phone_field',
          label: 'Phone Field',
          type: 'phone'
        }
      ] as Column[]
    }
  ]

  const generateTestCSV = () => {
    const scenario = testScenarios[0]
    const headers = scenario.columns.map(col => col.label).join(',')
    const rows = [
      // Valid row
      'Required,Unique1,test@email.com,50,ValidLength,ABC-123,Option A,2024-01-15,+14155551234',
      // Missing required field
      ',Unique2,test2@email.com,50,ValidLength,ABC-123,Option A,2024-01-15,+14155551234',
      // Duplicate unique field
      'Required,Unique1,test3@email.com,50,ValidLength,ABC-123,Option B,2024-01-15,+14155551234',
      // Invalid email
      'Required,Unique3,not-an-email,50,ValidLength,ABC-123,Option A,2024-01-15,+14155551234',
      // Number out of range (too low)
      'Required,Unique4,test4@email.com,0,ValidLength,ABC-123,Option A,2024-01-15,+14155551234',
      // Number out of range (too high)
      'Required,Unique5,test5@email.com,101,ValidLength,ABC-123,Option A,2024-01-15,+14155551234',
      // Text too short
      'Required,Unique6,test6@email.com,50,Short,ABC-123,Option A,2024-01-15,+14155551234',
      // Text too long
      'Required,Unique7,test7@email.com,50,ThisTextIsWayTooLongForTheLimit,ABC-123,Option A,2024-01-15,+14155551234',
      // Invalid pattern
      'Required,Unique8,test8@email.com,50,ValidLength,INVALID,Option A,2024-01-15,+14155551234',
      // Invalid select option
      'Required,Unique9,test9@email.com,50,ValidLength,ABC-123,Invalid Option,2024-01-15,+14155551234',
      // Invalid date
      'Required,Unique10,test10@email.com,50,ValidLength,ABC-123,Option A,not-a-date,+14155551234',
      // Invalid phone
      'Required,Unique11,test11@email.com,50,ValidLength,ABC-123,Option A,2024-01-15,123'
    ]

    return [headers, ...rows].join('\n')
  }

  const downloadTestCSV = () => {
    const csvContent = generateTestCSV()
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'validation_test.csv'
    link.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="section">
        <h2 className="section-title">Validation Tester - Test All Validator Types</h2>

        <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
          This tool tests all available validators with a comprehensive test file containing various validation errors.
        </p>

        <div style={{ marginBottom: '1.5rem' }}>
          <h3 className="result-title">Test Columns:</h3>
          <ul style={{ color: '#374151', lineHeight: 1.8 }}>
            <li><strong>Required Field:</strong> Tests required validator</li>
            <li><strong>Unique Field:</strong> Tests unique constraint (row 3 will fail)</li>
            <li><strong>Email Field:</strong> Tests email format validation</li>
            <li><strong>Number Range:</strong> Tests min/max number validators (1-100)</li>
            <li><strong>Text Length:</strong> Tests min_length/max_length (5-20 chars)</li>
            <li><strong>Pattern Field:</strong> Tests regex validator (ABC-123 format)</li>
            <li><strong>Select Option:</strong> Tests select from predefined options</li>
            <li><strong>Date Field:</strong> Tests date format validation</li>
            <li><strong>Phone Field:</strong> Tests phone number validation</li>
          </ul>
        </div>

        <button onClick={downloadTestCSV} className="download-btn">
          Download Test CSV (12 rows, 11 with errors)
        </button>

        <button
          onClick={() => {
            setCustomColumns(testScenarios[0].columns)
            setShowImporter(true)
          }}
          className="download-btn"
          style={{ marginLeft: '1rem' }}
        >
          Open Importer
        </button>

        {showImporter && (
          <CSVImporter
            columns={customColumns}
            onComplete={(result) => {
              console.log('Validation test complete:', result)
              alert(`Import complete! Valid rows: ${result.data?.length || 0}`)
              setShowImporter(false)
            }}
            onCancel={() => setShowImporter(false)}
            modalIsOpen={showImporter}
            modalOnCloseTriggered={() => setShowImporter(false)}
            primaryColor="#ef4444"
          />
        )}
      </div>

      <div className="section">
        <h3 className="result-title">Expected Errors in Test File:</h3>
        <div className="error-list">
          <div className="error-item">• Row 2: Missing required field</div>
          <div className="error-item">• Row 3: Duplicate unique value</div>
          <div className="error-item">• Row 4: Invalid email format</div>
          <div className="error-item">• Row 5: Number below minimum (0 &lt; 1)</div>
          <div className="error-item">• Row 6: Number above maximum (101 &gt; 100)</div>
          <div className="error-item">• Row 7: Text too short (4 chars &lt; 5)</div>
          <div className="error-item">• Row 8: Text too long (31 chars &gt; 20)</div>
          <div className="error-item">• Row 9: Pattern mismatch (not ABC-123 format)</div>
          <div className="error-item">• Row 10: Invalid select option</div>
          <div className="error-item">• Row 11: Invalid date format</div>
          <div className="error-item">• Row 12: Invalid phone (too short)</div>
        </div>
      </div>
    </div>
  )
}

export default ValidationTester