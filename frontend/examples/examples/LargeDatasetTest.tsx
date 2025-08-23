import { useState } from 'react';
import { CSVImporter } from '../../src';

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

export default function LargeDatasetTest() {
  const [isOpen, setIsOpen] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [dataSize, setDataSize] = useState(10000);

  const demoData = {
    csvContent: generateLargeCSV(dataSize),
    fileName: `test-${dataSize}-rows.csv`
  };

  const columns = [
    { id: 'id', label: 'ID', type: 'number' as const, validators: [{ type: 'required' as const }] },
    { id: 'name', label: 'Name', type: 'string' as const, validators: [{ type: 'required' as const }] },
    { id: 'email', label: 'Email', type: 'email' as const, validators: [{ type: 'required' as const, message: 'Valid email required' }] },
    { id: 'age', label: 'Age', type: 'number' as const },
    { id: 'department', label: 'Department', type: 'select' as const, options: ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'] },
    { id: 'salary', label: 'Salary', type: 'number' as const },
    { id: 'join_date', label: 'Join Date', type: 'date' as const },
    { id: 'status', label: 'Status', type: 'select' as const, options: ['Active', 'Inactive', 'On Leave'] }
  ];

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Large Dataset Performance Test</h2>
      <p>Test the CSV importer with large datasets to verify virtual scrolling performance.</p>
      
      <div style={{ marginBottom: '1rem' }}>
        <label>
          Number of rows: 
          <select 
            value={dataSize} 
            onChange={(e) => setDataSize(Number(e.target.value))}
            style={{ marginLeft: '0.5rem' }}
          >
            <option value={100}>100 rows</option>
            <option value={1000}>1,000 rows</option>
            <option value={5000}>5,000 rows</option>
            <option value={10000}>10,000 rows</option>
            <option value={25000}>25,000 rows</option>
            <option value={50000}>50,000 rows</option>
            <option value={100000}>100,000 rows</option>
          </select>
        </label>
      </div>

      <button 
        onClick={() => setIsOpen(true)}
        style={{
          padding: '10px 20px',
          fontSize: '16px',
          backgroundColor: '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer'
        }}
      >
        Test with {dataSize.toLocaleString()} rows
      </button>

      <CSVImporter
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        columns={columns}
        demoData={demoData}
        onComplete={(data) => {
          console.log('Import completed:', data);
          setResult(data);
          setIsOpen(false);
        }}
      />

      {result && (
        <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '6px' }}>
          <h3>Import Result:</h3>
          <p>Success: {result.success ? 'Yes' : 'No'}</p>
          <p>Rows imported: {result.num_rows}</p>
          <p>Columns: {result.num_columns}</p>
        </div>
      )}
    </div>
  );
}