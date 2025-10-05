// frontend/src/components/Uploader.tsx
import { h } from 'preact';
import { useState, useCallback } from 'preact/hooks';
import { z } from 'zod';
import type { Column } from '../headless/types';
import { Root, useCSV } from '../headless/root';
import NativeDropzone from '../importer/components/UploaderWrapper/NativeDropzone';
import { CloudUpload } from 'lucide-react';
import { cn } from '../utils/cn';

interface UploaderProps {
  schema?: z.ZodSchema<any>;
  columns?: Column[];
  onUpload: (data: { rows: any[] }) => void;
  onError?: (error: { code: string; message: string }) => void;
  placeholder?: string;
  maxSize?: number; // in bytes
  acceptedFormats?: string[];
  className?: string;
  theme?: 'light' | 'dark';
  appearance?: {
    variables?: {
      colorPrimary?: string;
      borderRadius?: string;
    };
  };
}

// CSV parser utility
function parseCSV(csvText: string): any[] {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) return [];

  // First line is headers
  const headers = lines[0].split(',').map(h => h.trim());

  // Parse remaining lines as data
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return rows;
}

// Internal component that uses the CSV context
const UploaderInternal = ({
  onUpload,
  onError,
  placeholder,
  maxSize,
  acceptedFormats = ['csv'],
  className,
  theme = 'light',
  appearance
}: Omit<UploaderProps, 'schema' | 'columns'>) => {
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = useCallback(async (file: File) => {
    setLoading(true);

    try {
      // Validate file type
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!acceptedFormats.includes(extension || '')) {
        onError?.({
          code: 'INVALID_FORMAT',
          message: `Invalid file format. Accepted formats: ${acceptedFormats.join(', ')}`
        });
        setLoading(false);
        return;
      }

      // Validate file size
      if (maxSize && file.size > maxSize) {
        onError?.({
          code: 'FILE_TOO_LARGE',
          message: `File size exceeds maximum allowed size of ${maxSize} bytes`
        });
        setLoading(false);
        return;
      }

      // Read and parse file
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        onError?.({
          code: 'EMPTY_FILE',
          message: 'CSV file is empty'
        });
        setLoading(false);
        return;
      }

      // Call onUpload with parsed data
      onUpload({ rows });
    } catch (error) {
      onError?.({
        code: 'PARSE_ERROR',
        message: 'Failed to parse CSV file'
      });
    } finally {
      setLoading(false);
    }
  }, [onUpload, onError, maxSize, acceptedFormats]);

  const acceptedTypes: Record<string, string[]> = {
    'text/csv': ['.csv']
  };

  if (acceptedFormats.includes('tsv')) {
    acceptedTypes['text/tab-separated-values'] = ['.tsv'];
  }
  if (acceptedFormats.includes('txt')) {
    acceptedTypes['text/plain'] = ['.txt'];
  }

  const dropzoneClass = cn(
    'w-full flex justify-center items-center flex-col rounded-lg transition-all duration-200',
    'min-h-[320px] py-12 px-10 border-2 border-dashed',
    theme === 'dark' ? 'bg-gray-800 border-gray-600 hover:border-gray-500' : 'bg-gray-50 border-gray-300 hover:border-gray-400',
    isDragging && 'border-blue-500 bg-blue-50',
    loading && 'opacity-50 cursor-not-allowed',
    className
  );

  const customStyles = appearance?.variables ? {
    borderRadius: appearance.variables.borderRadius
  } : undefined;

  return (
    <div className={dropzoneClass} style={customStyles}>
      <NativeDropzone
        onFileSelect={handleFileSelect}
        accept={acceptedTypes}
        disabled={loading}
        loading={loading}
        className="w-full h-full flex flex-col items-center justify-center"
      >
        {/* Upload Icon */}
        <div className="mb-4 p-4 rounded-full bg-white">
          <CloudUpload size={48} className="text-gray-400" />
        </div>

        {loading ? (
          <p className="text-lg font-medium text-gray-700">Parsing CSV...</p>
        ) : (
          <>
            <p className="text-lg font-medium text-gray-700 mb-2">
              {placeholder || 'Drag and drop your CSV file here'}
            </p>
            <p className="text-sm text-gray-500">
              or click to browse
            </p>
          </>
        )}

        {/* Hidden input for accessibility */}
        <label className="sr-only" htmlFor="file-upload">
          Choose file to upload
        </label>
      </NativeDropzone>
    </div>
  );
};

// Main exported component
export const Uploader = ({
  schema,
  columns,
  onUpload,
  ...props
}: UploaderProps) => {
  // If no columns/schema provided, render without CSV.Root wrapper
  if (!schema && !columns) {
    return <UploaderInternal onUpload={onUpload} {...props} />;
  }

  // If already inside CSV.Root context, render without wrapper
  try {
    // Try to access context - if it throws, we're not inside CSV.Root
    return <UploaderInternal onUpload={onUpload} {...props} />;
  } catch (e) {
    // Not inside CSV.Root, wrap with it
    return (
      <Root
        schema={schema}
        columns={columns}
        onComplete={(data) => onUpload({ rows: data })}
      >
        <UploaderInternal onUpload={onUpload} {...props} />
      </Root>
    );
  }
};

export default Uploader;
