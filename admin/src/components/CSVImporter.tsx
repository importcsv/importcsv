'use client';

import React from 'react';
import { CSVImporter as CSVImporterComponent } from 'csv-import-react';

interface CSVImporterProps {
  onComplete: (data: any) => void;
  importerId: string; // Importer ID is required for direct API integration
  user?: { userId: string };
  metadata?: Record<string, any>;
}

const CSVImporter: React.FC<CSVImporterProps> = ({
  onComplete,
  importerId,
  user,
  metadata,
}) => {
  return (
    <div className="w-full min-h-[500px]">
      <CSVImporterComponent
        isModal={false}
        darkMode={false}
        primaryColor="#0284c7"
        showDownloadTemplateButton={true}
        skipHeaderRowSelection={false}
        importerId={importerId} // Pass down importerId for schema fetching
        user={user}
        metadata={metadata}
        onComplete={(data: any) => {
          // Log the data for debugging
          console.log('CSV import completed with data:', data);

          // Call the onComplete callback with the data
          if (onComplete) {
            onComplete(data);
          }
        }}
      />
    </div>
  );
};

export default CSVImporter;
