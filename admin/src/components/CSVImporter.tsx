'use client';

import React from 'react';
import { CSVImporter as CSVImporterComponent } from 'csv-import-react';

interface ImporterField {
  name: string;
  key?: string;
  required?: boolean;
  description?: string;
  data_type?: string;
}

interface ImporterSchema {
  id: string;
  name: string;
  fields: ImporterField[];
}

interface CSVImporterProps {
  schema?: ImporterSchema; // Schema is now optional as it will be fetched by the library
  onComplete: (data: any) => void;
  usePublicApi?: boolean; // Whether to use the public API endpoint
  backendUrl?: string; // Backend URL for API calls
  importerId: string; // Importer ID is required for direct API integration
}

const CSVImporter: React.FC<CSVImporterProps> = ({ 
  schema, 
  onComplete, 
  usePublicApi = false,
  backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000',
  importerId
}) => {
  // The template is now optional as it will be fetched by the library
  // Only use the provided schema if it exists (for backward compatibility)
  const template = schema ? {
    columns: schema.fields.map((field: ImporterField) => ({
      name: field.name,
      key: field.name.toLowerCase().replace(/\s+/g, '_'), // Convert to snake_case for keys
      required: field.required || false,
      description: field.description || `${field.name} field`
    }))
  } : undefined;
  
  // The simplest approach: just don't use the problematic props in the admin app
  // Instead, use the direct API integration in the frontend library
  
  // For the admin preview, we don't need to use the public API or direct integration
  // We'll just use the CSVImporter component without the problematic props
  // and handle the data in the onComplete callback
  
  return (
    <div className="w-full min-h-[500px]">
      <CSVImporterComponent
        isModal={false}
        template={template}
        darkMode={false}
        primaryColor="#0284c7"
        showDownloadTemplateButton={true}
        skipHeaderRowSelection={false}
        importerId={importerId} // Pass down importerId
        backendUrl={backendUrl} // Pass down backendUrl
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
