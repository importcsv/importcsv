'use client';

import React from 'react';
import { CSVImporter as CSVImporterComponent } from 'csv-import-react';

interface ImporterField {
  name: string;
  key?: string;
  required?: boolean;
  description?: string;
  data_type?: string;
  template?: string; // Template for boolean or select fields (e.g., 'true/false', 'yes/no', '1/0')
  validation_format?: string; // For select options, date format, or regex pattern
}

interface ImporterSchema {
  id: string;
  name: string;
  fields: ImporterField[];
}

interface CSVImporterProps {
  schema?: ImporterSchema; // Schema is now optional as it will be fetched by the library
  onComplete: (data: any) => void;
  importerId: string; // Importer ID is required for direct API integration
}

const CSVImporter: React.FC<CSVImporterProps> = ({
  schema,
  onComplete,
  importerId
}) => {
  // The template is now optional as it will be fetched by the library
  // Only use the provided schema if it exists (for backward compatibility)
  const template = schema ? {
    columns: schema.fields.map((field: ImporterField) => ({
      name: field.name,
      key: field.name.toLowerCase().replace(/\s+/g, '_'), // Convert to snake_case for keys
      required: field.required || false,
      description: field.description || `${field.name} field`,
      type: field.data_type || 'text', // Map data_type to type
      template: field.template, // Pass template for boolean fields
      validation_format: field.validation_format // Pass validation_format for select options
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
