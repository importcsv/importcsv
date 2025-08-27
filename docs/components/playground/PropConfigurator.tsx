'use client';

import type { PlaygroundConfig, ExtendedColumn } from './ImporterPlayground';
import type { Validator, Transformer } from '@importcsv/react';
import DataGenerator from './DataGenerator';
import { useState } from 'react';

interface PropConfiguratorProps {
  config: PlaygroundConfig;
  onChange: (config: PlaygroundConfig) => void;
  onOpenImporter: () => void;
  importedData: any;
  CSVImporter: any;
  onImportComplete: (data: any) => void;
}

// Available transformers
const AVAILABLE_TRANSFORMERS = [
  { type: 'trim', label: 'Trim', description: 'Remove leading/trailing spaces' },
  { type: 'lowercase', label: 'Lowercase', description: 'Convert to lowercase' },
  { type: 'uppercase', label: 'Uppercase', description: 'Convert to uppercase' },
  { type: 'capitalize', label: 'Capitalize', description: 'Capitalize first letter of each word' },
  { type: 'normalizePhone', label: 'Normalize Phone', description: 'Format phone numbers' },
  { type: 'parseDate', label: 'Parse Date', description: 'Parse date strings' },
];

// Common column templates
const COLUMN_TEMPLATES = {
  name: {
    id: 'name',
    label: 'Name',
    description: 'Person\'s full name',
    type: 'string',
    validators: [{ type: 'required' }],
    transformers: [{ type: 'trim' }, { type: 'capitalize' }]
  },
  email: {
    id: 'email',
    label: 'Email',
    description: 'Email address',
    type: 'email',
    validators: [
      { type: 'required' },
      { type: 'regex', value: '^[^@]+@[^@]+\\.[^@]+$', message: 'Invalid email format' }
    ],
    transformers: [{ type: 'trim' }, { type: 'lowercase' }]
  },
  phone: {
    id: 'phone',
    label: 'Phone',
    description: 'Phone number',
    type: 'phone',
    validators: [
      { type: 'regex', value: '^\\+?[1-9]\\d{1,14}$', message: 'Invalid phone number' }
    ],
    transformers: [{ type: 'trim' }, { type: 'normalizePhone' }]
  },
  date: {
    id: 'date',
    label: 'Date',
    description: 'Date field',
    type: 'date',
    validators: [{ type: 'required' }],
    transformers: [{ type: 'trim' }, { type: 'parseDate' }]
  },
  age: {
    id: 'age',
    label: 'Age',
    description: 'Age in years',
    type: 'number',
    validators: [
      { type: 'required' },
      { type: 'min', value: 0, message: 'Age must be positive' },
      { type: 'max', value: 120, message: 'Invalid age' }
    ]
  },
  zipcode: {
    id: 'zipcode',
    label: 'Zip Code',
    description: 'Postal code',
    type: 'string',
    validators: [
      { type: 'regex', value: '^\\d{5}(-\\d{4})?$', message: 'Invalid US zip code' }
    ],
    transformers: [{ type: 'trim' }]
  }
};

export default function PropConfigurator({
  config,
  onChange,
  onOpenImporter,
  importedData,
  CSVImporter,
  onImportComplete
}: PropConfiguratorProps) {
  const [showCustomValidator, setShowCustomValidator] = useState<number | null>(null);
  const [showCustomTransformer, setShowCustomTransformer] = useState<number | null>(null);
  const [customValidatorCode, setCustomValidatorCode] = useState('');
  const [customTransformerCode, setCustomTransformerCode] = useState('');

  const updateConfig = (updates: Partial<PlaygroundConfig>) => {
    onChange({ ...config, ...updates });
  };

  const updateColumn = (index: number, updates: Partial<ExtendedColumn>) => {
    const newColumns = [...config.columns];
    newColumns[index] = { ...newColumns[index], ...updates };
    updateConfig({ columns: newColumns });
  };

  const addColumn = () => {
    const newColumn: ExtendedColumn = {
      id: `col_${Date.now()}`,
      label: 'New Column',
      description: '',
      type: 'string',
      validators: [],
      transformers: []
    };
    updateConfig({ columns: [...config.columns, newColumn] });
  };

  const addColumnFromTemplate = (templateKey: string) => {
    const template = COLUMN_TEMPLATES[templateKey as keyof typeof COLUMN_TEMPLATES];
    const newColumn = {
      ...template,
      id: `${template.id}_${Date.now()}`
    };
    updateConfig({ columns: [...config.columns, newColumn] });
  };

  const removeColumn = (index: number) => {
    updateConfig({ columns: config.columns.filter((_, i) => i !== index) });
  };

  const toggleValidator = (columnIndex: number, validatorType: string) => {
    const column = config.columns[columnIndex];
    const validators = column.validators || [];
    const hasValidator = validators.some(v => v.type === validatorType);

    if (hasValidator) {
      column.validators = validators.filter(v => v.type !== validatorType);
    } else {
      const newValidator: Validator = { type: validatorType as any };
      if (validatorType === 'min' || validatorType === 'max') {
        (newValidator as any).value = 0;
      } else if (validatorType === 'minLength' || validatorType === 'maxLength') {
        (newValidator as any).value = 1;
      } else if (validatorType === 'regex') {
        (newValidator as any).value = '.*';
        (newValidator as any).message = 'Invalid format';
      }
      column.validators = [...validators, newValidator];
    }

    updateColumn(columnIndex, { validators: column.validators });
  };

  const updateValidatorValue = (columnIndex: number, validatorType: string, field: string, value: any) => {
    const column = config.columns[columnIndex];
    const validators = column.validators || [];
    const validatorIndex = validators.findIndex(v => v.type === validatorType);

    if (validatorIndex >= 0) {
      validators[validatorIndex] = {
        ...validators[validatorIndex],
        [field]: value
      };
      updateColumn(columnIndex, { validators });
    }
  };

  const toggleTransformer = (columnIndex: number, transformerType: string) => {
    const column = config.columns[columnIndex];
    const transformers = column.transformers || [];
    const hasTransformer = transformers.some(t => t.type === transformerType);

    if (hasTransformer) {
      column.transformers = transformers.filter(t => t.type !== transformerType);
    } else {
      const newTransformer: Transformer = { type: transformerType as any };
      column.transformers = [...transformers, newTransformer];
    }

    updateColumn(columnIndex, { transformers: column.transformers });
  };

  return (
    <div className="space-y-6">
      {/* Display Options */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-fd-foreground">Display Options</h3>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center gap-2 text-sm text-fd-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={config.darkMode}
              onChange={(e) => updateConfig({ darkMode: e.target.checked })}
              className="rounded border-fd-border text-fd-primary focus:ring-2 focus:ring-fd-primary focus:ring-offset-2 cursor-pointer"
            />
            Dark Mode
          </label>

          <label className="flex items-center gap-2 text-sm text-fd-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={config.isModal}
              onChange={(e) => updateConfig({ isModal: e.target.checked })}
              className="rounded border-fd-border text-fd-primary focus:ring-2 focus:ring-fd-primary focus:ring-offset-2 cursor-pointer"
            />
            Modal Mode
          </label>

          <label className="flex items-center gap-2 text-sm text-fd-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={config.showDownloadTemplateButton}
              onChange={(e) => updateConfig({ showDownloadTemplateButton: e.target.checked })}
              className="rounded border-fd-border text-fd-primary focus:ring-2 focus:ring-fd-primary focus:ring-offset-2 cursor-pointer"
            />
            Template Button
          </label>

          <label className="flex items-center gap-2 text-sm text-fd-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={config.skipHeaderRowSelection}
              onChange={(e) => updateConfig({ skipHeaderRowSelection: e.target.checked })}
              className="rounded border-fd-border text-fd-primary focus:ring-2 focus:ring-fd-primary focus:ring-offset-2 cursor-pointer"
            />
            Skip Header Selection
          </label>
        </div>
      </div>

      {/* Column Templates */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm text-fd-foreground">Quick Add Column Templates</h3>
        <div className="flex flex-wrap gap-2">
          {Object.keys(COLUMN_TEMPLATES).map(templateKey => (
            <button
              key={templateKey}
              onClick={() => addColumnFromTemplate(templateKey)}
              className="px-3 py-1 text-xs border border-fd-border/50 rounded-md bg-fd-card/30 hover:bg-fd-muted/50 text-fd-foreground font-medium transition-colors capitalize backdrop-blur-sm"
            >
              + {templateKey}
            </button>
          ))}
        </div>
      </div>

      {/* Columns Configuration */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-sm text-fd-foreground">Columns ({config.columns.length})</h3>
          <button
            onClick={addColumn}
            className="text-sm px-3 py-1 border border-fd-border/50 rounded-md bg-fd-card/30 hover:bg-fd-muted/50 text-fd-foreground font-medium transition-colors backdrop-blur-sm"
          >
            + Add Custom Column
          </button>
        </div>

        <div className="space-y-3">
          {config.columns.map((column, index) => (
            <div key={index} className="border border-fd-border/50 rounded-lg p-4 space-y-3 bg-fd-card/50 backdrop-blur-sm">
              <div className="flex gap-2">
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={column.label}
                    onChange={(e) => updateColumn(index, { label: e.target.value })}
                    className="w-full px-2 py-1 text-sm border border-fd-border rounded-md bg-fd-card text-fd-card-foreground focus:border-fd-primary focus:ring-2 focus:ring-fd-primary focus:ring-offset-2 focus:outline-none transition-colors"
                    placeholder="Label"
                  />
                  <input
                    type="text"
                    value={column.description || ''}
                    onChange={(e) => updateColumn(index, { description: e.target.value })}
                    className="w-full px-2 py-1 text-xs border border-fd-border rounded-md bg-fd-card text-fd-muted-foreground placeholder:text-fd-muted-foreground/50 focus:border-fd-primary focus:ring-2 focus:ring-fd-primary focus:ring-offset-2 focus:outline-none transition-colors"
                    placeholder="Description (optional)"
                  />
                </div>
                <select
                  value={column.type || 'string'}
                  onChange={(e) => updateColumn(index, { type: e.target.value as any })}
                  className="px-2 py-1 text-sm border border-fd-border rounded-md bg-fd-card text-fd-card-foreground focus:border-fd-primary focus:ring-2 focus:ring-fd-primary focus:ring-offset-2 focus:outline-none transition-colors"
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="email">Email</option>
                  <option value="date">Date</option>
                  <option value="phone">Phone</option>
                  <option value="boolean">Boolean</option>
                </select>
                <button
                  onClick={() => removeColumn(index)}
                  className="px-2 py-1 text-sm text-fd-destructive hover:bg-fd-destructive/10 rounded-md font-bold transition-colors"
                >
                  ×
                </button>
              </div>

              {/* Validators Section */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-fd-foreground/70">Validators</div>
                <div className="flex flex-wrap gap-1">
                  {['required', 'unique'].map(validatorType => (
                    <button
                      key={validatorType}
                      onClick={() => toggleValidator(index, validatorType)}
                      className={`px-2 py-0.5 text-xs rounded font-medium transition-colors ${
                        column.validators?.some(v => v.type === validatorType)
                          ? 'bg-fd-primary text-fd-primary-foreground'
                          : 'bg-fd-muted text-fd-foreground hover:bg-fd-muted/80'
                      }`}
                    >
                      {validatorType}
                    </button>
                  ))}

                  {column.type === 'number' && ['min', 'max'].map(validatorType => (
                    <button
                      key={validatorType}
                      onClick={() => toggleValidator(index, validatorType)}
                      className={`px-2 py-0.5 text-xs rounded font-medium transition-colors ${
                        column.validators?.some(v => v.type === validatorType)
                          ? 'bg-fd-primary text-fd-primary-foreground'
                          : 'bg-fd-muted text-fd-foreground hover:bg-fd-muted/80'
                      }`}
                    >
                      {validatorType}
                    </button>
                  ))}

                  {column.type === 'string' && ['minLength', 'maxLength', 'regex'].map(validatorType => (
                    <button
                      key={validatorType}
                      onClick={() => toggleValidator(index, validatorType)}
                      className={`px-2 py-0.5 text-xs rounded font-medium transition-colors ${
                        column.validators?.some(v => v.type === validatorType)
                          ? 'bg-fd-primary text-fd-primary-foreground'
                          : 'bg-fd-muted text-fd-foreground hover:bg-fd-muted/80'
                      }`}
                    >
                      {validatorType}
                    </button>
                  ))}
                </div>

                {/* Validator configurations */}
                {column.validators?.map((validator, vIndex) => {
                  if (validator.type === 'min' || validator.type === 'max') {
                    return (
                      <div key={`${validator.type}-${vIndex}`} className="flex gap-2 items-center mt-1">
                        <span className="text-xs text-fd-foreground/70">{validator.type}:</span>
                        <input
                          type="number"
                          value={(validator as any).value || 0}
                          onChange={(e) => updateValidatorValue(index, validator.type, 'value', Number(e.target.value))}
                          className="w-20 px-2 py-0.5 text-xs border border-fd-border rounded bg-fd-card text-fd-card-foreground"
                        />
                        <input
                          type="text"
                          value={(validator as any).message || ''}
                          onChange={(e) => updateValidatorValue(index, validator.type, 'message', e.target.value)}
                          placeholder="Error message"
                          className="flex-1 px-2 py-0.5 text-xs border border-fd-border rounded bg-fd-card text-fd-card-foreground placeholder:text-fd-muted-foreground/50"
                        />
                      </div>
                    );
                  }
                  if (validator.type === 'minLength' || validator.type === 'maxLength') {
                    return (
                      <div key={`${validator.type}-${vIndex}`} className="flex gap-2 items-center mt-1">
                        <span className="text-xs text-fd-foreground/70">{validator.type}:</span>
                        <input
                          type="number"
                          value={(validator as any).value || 1}
                          onChange={(e) => updateValidatorValue(index, validator.type, 'value', Number(e.target.value))}
                          className="w-20 px-2 py-0.5 text-xs border border-fd-border rounded bg-fd-card text-fd-card-foreground"
                        />
                        <input
                          type="text"
                          value={(validator as any).message || ''}
                          onChange={(e) => updateValidatorValue(index, validator.type, 'message', e.target.value)}
                          placeholder="Error message"
                          className="flex-1 px-2 py-0.5 text-xs border border-fd-border rounded bg-fd-card text-fd-card-foreground placeholder:text-fd-muted-foreground/50"
                        />
                      </div>
                    );
                  }
                  if (validator.type === 'regex') {
                    return (
                      <div key={`${validator.type}-${vIndex}`} className="space-y-1 mt-1">
                        <div className="flex gap-2 items-center">
                          <span className="text-xs text-fd-foreground/70">regex:</span>
                          <input
                            type="text"
                            value={(validator as any).value || ''}
                            onChange={(e) => updateValidatorValue(index, validator.type, 'value', e.target.value)}
                            placeholder="Pattern (e.g., ^[A-Z].*)"
                            className="flex-1 px-2 py-0.5 text-xs border border-fd-border rounded bg-fd-card text-fd-card-foreground font-mono placeholder:text-fd-muted-foreground/50"
                          />
                        </div>
                        <input
                          type="text"
                          value={(validator as any).message || ''}
                          onChange={(e) => updateValidatorValue(index, validator.type, 'message', e.target.value)}
                          placeholder="Error message"
                          className="w-full px-2 py-0.5 text-xs border border-fd-border rounded bg-fd-card text-fd-card-foreground placeholder:text-fd-muted-foreground/50"
                        />
                      </div>
                    );
                  }
                  return null;
                })}
              </div>

              {/* Transformers Section */}
              <div className="space-y-2">
                <div className="text-xs font-medium text-fd-foreground/70">Transformers (Applied in order)</div>
                <div className="flex flex-wrap gap-1">
                  {AVAILABLE_TRANSFORMERS.map(transformer => (
                    <button
                      key={transformer.type}
                      onClick={() => toggleTransformer(index, transformer.type)}
                      title={transformer.description}
                      className={`px-2 py-0.5 text-xs rounded font-medium transition-colors ${
                        column.transformers?.some(t => t.type === transformer.type)
                          ? 'bg-fd-success/20 text-fd-success-foreground border border-fd-success/30'
                          : 'bg-fd-muted text-fd-foreground hover:bg-fd-muted/80'
                      }`}
                    >
                      {transformer.label}
                    </button>
                  ))}
                </div>

                {/* Show transformer order */}
                {column.transformers && column.transformers.length > 0 && (
                  <div className="text-xs text-fd-foreground/60 mt-1">
                    Order: {column.transformers.map(t =>
                      AVAILABLE_TRANSFORMERS.find(at => at.type === t.type)?.label || t.type
                    ).join(' → ')}
                  </div>
                )}
              </div>

              {/* Validation Preview */}
              {(column.validators?.length || column.transformers?.length) ? (
                <div className="mt-2 p-2 bg-fd-muted/30 border border-fd-border/30 rounded text-xs space-y-1">
                  <div className="font-medium text-fd-foreground/70">Test Examples:</div>
                  {column.type === 'email' && (
                    <div className="text-fd-foreground/60">
                      ✓ user@example.com | ✗ invalid-email
                    </div>
                  )}
                  {column.type === 'number' && column.validators?.some(v => v.type === 'min') && (
                    <div className="text-fd-foreground/60">
                      ✓ {(column.validators.find(v => v.type === 'min') as any)?.value + 1} |
                      ✗ {(column.validators.find(v => v.type === 'min') as any)?.value - 1}
                    </div>
                  )}
                  {column.transformers?.some(t => t.type === 'capitalize') && (
                    <div className="text-fd-foreground/60">
                      "john doe" → "John Doe"
                    </div>
                  )}
                  {column.transformers?.some(t => t.type === 'trim') && (
                    <div className="text-fd-foreground/60">
                      "  text  " → "text"
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Generate Sample Data */}
      <DataGenerator columns={config.columns} />

      {/* Test Importer Section */}
      <div className="space-y-4">
        <div className="space-y-3">
          <button
            onClick={onOpenImporter}
            className="inline-flex items-center justify-center px-4 py-2 bg-fd-primary text-fd-primary-foreground rounded-md hover:bg-fd-primary/90 transition-colors font-medium shadow-sm"
          >
            Open Importer
          </button>

          {importedData && (
            <div className="p-3 rounded-lg bg-fd-success/10 border border-fd-success/20">
              <p className="text-fd-success-foreground text-sm font-medium">
                ✓ Imported {importedData.num_rows} rows successfully
              </p>
            </div>
          )}

          {!config.isModal && CSVImporter && (
            <div className="border border-fd-border rounded-lg overflow-hidden" style={{ height: '400px' }}>
              <CSVImporter
                {...config}
                onComplete={onImportComplete}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}