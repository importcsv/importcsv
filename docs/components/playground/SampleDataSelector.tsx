'use client';

import { useState } from 'react';

const sampleDatasets = {
  clean: {
    name: 'Clean Data',
    content: `Full Name,Email,Age
John Doe,john.doe@example.com,28
Jane Smith,jane.smith@example.com,35
Bob Johnson,bob.johnson@example.com,42`
  },
  errors: {
    name: 'With Errors',
    content: `Full Name,Email,Age
John Doe,john.doe@example.com,28
Jane Smith,invalid-email,150
,missing@example.com,25
Bob Johnson,bob.johnson@example.com,15`
  },
  messy: {
    name: 'Messy Data',
    content: `  full name  ,EMAIL,age
  john doe  ,JOHN.DOE@EXAMPLE.COM,  28  
JANE SMITH,jane.smith@example.com,35`
  },
  large: {
    name: 'Large Dataset (100 rows)',
    content: generateLargeDataset()
  }
};

function generateLargeDataset() {
  const headers = 'Full Name,Email,Age';
  const rows = [];
  for (let i = 1; i <= 100; i++) {
    rows.push(`User ${i},user${i}@example.com,${20 + (i % 40)}`);
  }
  return `${headers}\n${rows.join('\n')}`;
}

export default function SampleDataSelector() {
  const [selectedDataset, setSelectedDataset] = useState<keyof typeof sampleDatasets>('clean');

  const downloadCSV = () => {
    const dataset = sampleDatasets[selectedDataset];
    const blob = new Blob([dataset.content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sample-${selectedDataset}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-sm text-fd-foreground">Sample Data</h3>
      
      <div className="flex gap-2">
        <select
          value={selectedDataset}
          onChange={(e) => setSelectedDataset(e.target.value as keyof typeof sampleDatasets)}
          className="flex-1 px-3 py-1.5 text-sm border-2 border-fd-border rounded-md bg-fd-background text-fd-foreground focus:border-fd-primary focus:outline-none"
        >
          {Object.entries(sampleDatasets).map(([key, dataset]) => (
            <option key={key} value={key}>
              {dataset.name}
            </option>
          ))}
        </select>
        
        <button
          onClick={downloadCSV}
          className="px-3 py-1.5 text-sm border-2 border-fd-border rounded-md hover:bg-fd-muted text-fd-foreground font-medium"
          title="Download CSV"
        >
          ↓ Download
        </button>
      </div>
      
      <details className="text-xs">
        <summary className="cursor-pointer text-fd-muted-foreground hover:text-fd-foreground font-medium">
          Preview data
        </summary>
        <pre className="mt-2 p-2 rounded border-2 border-fd-border bg-fd-muted/30 overflow-x-auto text-fd-foreground">
          {sampleDatasets[selectedDataset].content.split('\n').slice(0, 5).join('\n')}
          {sampleDatasets[selectedDataset].content.split('\n').length > 5 && '\n...'}
        </pre>
      </details>
    </div>
  );
}