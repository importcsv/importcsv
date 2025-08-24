import React, { useState } from 'react';
import { CSVImporter } from '@importcsv/react';
import type { Column } from '@importcsv/react';

const columns: Column[] = [
  {
    id: 'name',
    label: 'Full Name',
    validators: [{ type: 'required' }],
  },
  {
    id: 'email',
    label: 'Email Address',
    type: 'email',
    validators: [{ type: 'required' }],
  },
  {
    id: 'department',
    label: 'Department',
  },
];

export default function ThemeShowcase() {
  const [selectedTheme, setSelectedTheme] = useState<string>('default');
  const [isOpen, setIsOpen] = useState(false);

  const handleComplete = (data: any) => {
    setIsOpen(false);
    console.log('Import completed:', data);
  };

  return (
    <div className="example-container">
      <div className="example-header">
        <h2>Theme Examples</h2>
        <p>Different styling options for the CSV importer</p>
      </div>

      <div className="example-content">
        <div className="theme-options">
          <label>
            <input
              type="radio"
              name="theme"
              value="default"
              checked={selectedTheme === 'default'}
              onChange={(e) => setSelectedTheme(e.target.value)}
            />
            Default Theme
          </label>
          <label>
            <input
              type="radio"
              name="theme"
              value="dark"
              checked={selectedTheme === 'dark'}
              onChange={(e) => setSelectedTheme(e.target.value)}
            />
            Dark Theme
          </label>
          <label>
            <input
              type="radio"
              name="theme"
              value="custom"
              checked={selectedTheme === 'custom'}
              onChange={(e) => setSelectedTheme(e.target.value)}
            />
            Custom Theme (Blue Primary)
          </label>
        </div>

        <button 
          className="btn btn-primary"
          onClick={() => setIsOpen(true)}
        >
          Open Importer
        </button>
      </div>

      {isOpen && (
        <CSVImporter
          columns={columns}
          onComplete={handleComplete}
          isModal={true}
          modalIsOpen={isOpen}
          modalOnCloseTriggered={() => setIsOpen(false)}
          primaryColor={selectedTheme === 'custom' ? '#0066cc' : undefined}
          darkMode={selectedTheme === 'dark'}
        />
      )}
    </div>
  );
}