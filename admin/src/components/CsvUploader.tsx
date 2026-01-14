'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { importersApi, InferredColumn } from '@/utils/apiClient';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CsvUploaderProps {
  onSchemaInferred: (columns: InferredColumn[], sampleData: Record<string, string>[]) => void;
  onError?: (error: string) => void;
}

export function CsvUploader({ onSchemaInferred, onError }: CsvUploaderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setFileName(file.name);
    setIsLoading(true);

    try {
      // Parse CSV
      const result = await new Promise<Papa.ParseResult<Record<string, string>>>((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: resolve,
          error: reject,
        });
      });

      if (result.errors.length > 0) {
        throw new Error(`CSV parsing error: ${result.errors[0].message}`);
      }

      if (result.data.length === 0) {
        throw new Error('CSV file is empty');
      }

      // Take first 10 rows for inference
      const sampleData = result.data.slice(0, 10);

      // Call AI inference
      const inferenceResult = await importersApi.inferSchema(sampleData);

      onSchemaInferred(inferenceResult.columns, result.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process CSV';
      setError(message);
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  }, [onSchemaInferred, onError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => files[0] && handleFile(files[0]),
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxFiles: 1,
    disabled: isLoading,
  });

  return (
    <div className="space-y-4">
      <Card
        {...getRootProps()}
        className={`cursor-pointer border-2 border-dashed transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <CardContent className="flex flex-col items-center justify-center py-10">
          <input {...getInputProps()} />
          {isLoading ? (
            <>
              <Loader2 className="h-10 w-10 text-muted-foreground animate-spin mb-4" />
              <p className="text-sm text-muted-foreground">Analyzing columns with AI...</p>
            </>
          ) : fileName ? (
            <>
              <FileText className="h-10 w-10 text-primary mb-4" />
              <p className="text-sm font-medium">{fileName}</p>
              <p className="text-xs text-muted-foreground mt-1">Drop another file to replace</p>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                {isDragActive ? 'Drop your CSV here' : 'Drag & drop a CSV file, or click to browse'}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                We&apos;ll automatically detect column types
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
