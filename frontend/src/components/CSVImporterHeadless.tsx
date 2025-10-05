// frontend/src/components/CSVImporterHeadless.tsx
/**
 * INTERNAL EXAMPLE: Complete CSV Importer built with headless primitives
 *
 * This component demonstrates how to build a full-featured importer using
 * only the headless primitives. It's kept as an internal reference and for tests.
 *
 * Users should either:
 * - Use the main CSVImporter component (full-featured, production-ready)
 * - Build custom importers using CSV.* primitives (maximum flexibility)
 * - Use standalone Uploader/ColumnMapper components (pick what you need)
 *
 * This is NOT exported from the package - it serves as documentation
 * and a comprehensive integration test of the headless architecture.
 */

import { h } from 'preact';
import { useState, useEffect, useMemo } from 'preact/hooks';
import { z } from 'zod';
import type { Column } from '../headless/types';
import { Root, useCSV } from '../headless/root';
import { Validator } from '../headless/validator';
import { NextButton } from '../headless/next-button';
import { BackButton } from '../headless/back-button';
import { SubmitButton } from '../headless/submit-button';
import { Uploader } from './Uploader';
import { ColumnMapper } from './ColumnMapper';
import { cn } from '../utils/cn';
import { CheckCircle2 } from 'lucide-react';

export interface CSVImporterHeadlessProps {
  // Schema definition (Zod - recommended)
  schema?: z.ZodSchema<any>;

  // Legacy columns array (backward compatibility)
  columns?: Column[];

  // Completion callback
  onComplete: (data: any[]) => void | Promise<void>;

  // Error callback
  onError?: (error: { code: string; message: string }) => void;

  // UI customization
  className?: string;
  theme?: 'light' | 'dark';
  appearance?: {
    variables?: {
      colorPrimary?: string;
      borderRadius?: string;
    };
  };

  // Behavior
  skipColumnMapping?: boolean;
  skipValidation?: boolean;
  autoSkipIfPerfectMatch?: boolean;

  // File upload
  maxFileSize?: number;
  acceptedFormats?: string[];

  // Preview
  showPreview?: boolean;
  previewRows?: number;
}

type ImportStep = 'upload' | 'map' | 'validate' | 'complete';

/**
 * Main CSVImporter component built with headless primitives
 */
export const CSVImporterHeadless = ({
  schema,
  columns,
  onComplete,
  onError,
  className,
  theme = 'light',
  appearance,
  skipColumnMapping = false,
  skipValidation = false,
  autoSkipIfPerfectMatch = true,
  maxFileSize,
  acceptedFormats = ['csv'],
  showPreview = false,
  previewRows = 5
}: CSVImporterHeadlessProps) => {
  // Step management
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');

  // Data state
  const [uploadedData, setUploadedData] = useState<{ rows: any[] } | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string> | null>(null);
  const [validatedData, setValidatedData] = useState<any[] | null>(null);

  // Derive columns from schema if provided
  const derivedColumns = useMemo<Column[]>(() => {
    if (schema && schema instanceof z.ZodObject) {
      const shape = (schema as any).shape;
      return Object.entries(shape).map(([key, zodType]: [string, any]) => ({
        id: key,
        label: key.charAt(0).toUpperCase() + key.slice(1),
        required: !zodType.isOptional?.()
      }));
    }
    return columns || [];
  }, [schema, columns]);

  // Handle upload completion
  const handleUploadComplete = (data: { rows: any[] }) => {
    setUploadedData(data);

    if (skipColumnMapping) {
      setCurrentStep('validate');
    } else {
      setCurrentStep('map');
    }
  };

  // Handle mapping completion
  const handleMappingComplete = (mapping: Record<string, string>) => {
    setColumnMapping(mapping);

    // Apply mapping to data
    if (uploadedData) {
      const mappedData = uploadedData.rows.map(row => {
        const mapped: any = {};
        Object.entries(mapping).forEach(([colId, csvCol]) => {
          if (csvCol) {
            mapped[colId] = row[csvCol];
          }
        });
        return mapped;
      });

      setUploadedData({ rows: mappedData });
    }

    if (skipValidation) {
      handleValidationComplete(uploadedData?.rows || []);
    } else {
      setCurrentStep('validate');
    }
  };

  // Handle validation completion
  const handleValidationComplete = (data: any[]) => {
    setValidatedData(data);
    setCurrentStep('complete');
    onComplete(data);
  };

  // Container styling
  const containerClass = cn(
    'csv-importer-headless',
    'max-w-4xl mx-auto p-6',
    theme === 'dark' && 'bg-gray-900 text-white',
    className
  );

  return (
    <Root
      schema={schema}
      columns={derivedColumns}
      onComplete={handleValidationComplete}
      data={uploadedData || undefined}
    >
      <div className={containerClass}>
        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} theme={theme} />

        {/* Upload Step */}
        {currentStep === 'upload' && (
          <div className="step-upload">
            <h2 className="text-2xl font-bold mb-6">Upload CSV File</h2>
            <Uploader
              onUpload={handleUploadComplete}
              onError={onError}
              maxSize={maxFileSize}
              acceptedFormats={acceptedFormats}
              theme={theme}
              appearance={appearance}
            />
          </div>
        )}

        {/* Column Mapping Step */}
        {currentStep === 'map' && uploadedData && (
          <div className="step-map">
            <ColumnMapper
              schema={schema}
              columns={derivedColumns}
              data={uploadedData}
              onComplete={handleMappingComplete}
              onError={onError}
              autoSkipIfPerfectMatch={autoSkipIfPerfectMatch}
              showPreview={showPreview}
              previewRows={previewRows}
              theme={theme}
              appearance={appearance}
            />

            <div className="mt-4">
              <BackButton asChild>
                <button
                  onClick={() => setCurrentStep('upload')}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Back
                </button>
              </BackButton>
            </div>
          </div>
        )}

        {/* Validation Step */}
        {currentStep === 'validate' && uploadedData && (
          <div className="step-validate">
            <h2 className="text-2xl font-bold mb-6">Validate Data</h2>

            <Validator>
              {({ errors, validate, isValidating }) => (
                <div>
                  {/* Data Preview */}
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-2">
                      {uploadedData.rows.length} rows will be imported
                    </p>

                    {showPreview && (
                      <div className="overflow-x-auto border rounded-md">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              {derivedColumns.map(col => (
                                <th
                                  key={col.id}
                                  className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                                >
                                  {col.label || col.id}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {uploadedData.rows.slice(0, previewRows).map((row, i) => (
                              <tr key={i}>
                                {derivedColumns.map(col => (
                                  <td
                                    key={col.id}
                                    className="px-4 py-2 text-sm text-gray-900"
                                  >
                                    {row[col.id] || '-'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Errors Display */}
                  {errors.length > 0 && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                      <h3 className="text-red-800 font-medium mb-2">
                        {errors.length} validation error{errors.length !== 1 ? 's' : ''} found
                      </h3>
                      <div className="max-h-64 overflow-y-auto">
                        {errors.slice(0, 10).map((error, i) => (
                          <div key={i} className="text-sm text-red-700 mb-1">
                            Row {error.row + 1}, Column "{error.column}": {error.message}
                          </div>
                        ))}
                        {errors.length > 10 && (
                          <p className="text-sm text-red-600 mt-2">
                            ...and {errors.length - 10} more errors
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center gap-4">
                    <BackButton asChild>
                      <button
                        onClick={() => setCurrentStep(skipColumnMapping ? 'upload' : 'map')}
                        className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                        disabled={isValidating}
                      >
                        Back
                      </button>
                    </BackButton>

                    <SubmitButton asChild>
                      <button
                        onClick={async () => {
                          const validationErrors = await validate();
                          if (validationErrors.length === 0) {
                            handleValidationComplete(uploadedData.rows);
                          }
                        }}
                        disabled={isValidating}
                        className={cn(
                          'px-6 py-2 rounded-md text-white',
                          'bg-blue-600 hover:bg-blue-700',
                          'disabled:bg-gray-400 disabled:cursor-not-allowed'
                        )}
                        style={
                          appearance?.variables?.colorPrimary
                            ? { backgroundColor: appearance.variables.colorPrimary }
                            : undefined
                        }
                      >
                        {isValidating ? 'Validating...' : 'Import Data'}
                      </button>
                    </SubmitButton>
                  </div>
                </div>
              )}
            </Validator>
          </div>
        )}

        {/* Complete Step */}
        {currentStep === 'complete' && validatedData && (
          <div className="step-complete text-center py-12">
            <div className="flex justify-center mb-4">
              <CheckCircle2 size={64} className="text-green-500" />
            </div>
            <h2 className="text-3xl font-bold mb-2">Import Complete!</h2>
            <p className="text-gray-600 mb-6">
              Successfully imported {validatedData.length} rows
            </p>

            <button
              onClick={() => {
                // Reset for new import
                setCurrentStep('upload');
                setUploadedData(null);
                setColumnMapping(null);
                setValidatedData(null);
              }}
              className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Import Another File
            </button>
          </div>
        )}
      </div>
    </Root>
  );
};

/**
 * Step Indicator Component
 */
const StepIndicator = ({
  currentStep,
  theme
}: {
  currentStep: ImportStep;
  theme: 'light' | 'dark';
}) => {
  const steps = [
    { id: 'upload', label: 'Upload' },
    { id: 'map', label: 'Map Columns' },
    { id: 'validate', label: 'Validate' },
    { id: 'complete', label: 'Complete' }
  ];

  const currentIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = index < currentIndex;

          return (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                    isActive && 'bg-blue-600 text-white',
                    isCompleted && 'bg-green-500 text-white',
                    !isActive && !isCompleted && (theme === 'dark' ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600')
                  )}
                >
                  {isCompleted ? '✓' : index + 1}
                </div>
                <span
                  className={cn(
                    'text-xs mt-1',
                    isActive && 'font-medium',
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  )}
                >
                  {step.label}
                </span>
              </div>

              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2',
                    isCompleted
                      ? 'bg-green-500'
                      : theme === 'dark'
                      ? 'bg-gray-700'
                      : 'bg-gray-200'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CSVImporterHeadless;
