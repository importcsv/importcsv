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
  { type: 'normalize_phone', label: 'Normalize Phone', description: 'Format phone numbers' },
  { type: 'normalize_date', label: 'Parse Date', description: 'Parse date strings' },
];

// Common column templates
const COLUMN_TEMPLATES: Record<string, ExtendedColumn> = {
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
      { type: 'regex', pattern: '^[^@]+@[^@]+\\.[^@]+$', message: 'Invalid email format' }
    ],
    transformers: [{ type: 'trim' }, { type: 'lowercase' }]
  },
  phone: {
    id: 'phone',
    label: 'Phone',
    description: 'Phone number',
    type: 'phone',
    validators: [
      { type: 'regex', pattern: '^\\+?[1-9]\\d{1,14}$', message: 'Invalid phone number' }
    ],
    transformers: [{ type: 'trim' }, { type: 'normalize_phone' }]
  },
  date: {
    id: 'date',
    label: 'Date',
    description: 'Date field',
    type: 'date',
    validators: [{ type: 'required' }],
    transformers: [{ type: 'trim' }, { type: 'normalize_date' }]
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
      { type: 'regex', pattern: '^\\d{5}(-\\d{4})?$', message: 'Invalid US zip code' }
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
      } else if (validatorType === 'min_length' || validatorType === 'max_length') {
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
        <div>
          <h3 className="font-semibold text-sm text-fd-foreground">UI Settings</h3>
          <p className="text-xs text-fd-muted-foreground mt-1">Configure how the importer appears to users</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex items-start gap-3 text-sm text-fd-foreground cursor-pointer p-3 rounded-lg border border-fd-border/50 hover:bg-fd-muted/30 transition-colors">
            <input
              type="checkbox"
              checked={config.darkMode}
              onChange={(e) => updateConfig({ darkMode: e.target.checked })}
              className="mt-0.5 rounded border-fd-border text-fd-primary focus:ring-2 focus:ring-fd-primary focus:ring-offset-2 cursor-pointer"
            />
            <div className="flex-1">
              <div className="font-medium">Dark Mode</div>
              <div className="text-xs text-fd-muted-foreground">Enable dark theme colors</div>
            </div>
          </label>

          <label className="flex items-start gap-3 text-sm text-fd-foreground cursor-pointer p-3 rounded-lg border border-fd-border/50 hover:bg-fd-muted/30 transition-colors">
            <input
              type="checkbox"
              checked={config.isModal}
              onChange={(e) => updateConfig({ isModal: e.target.checked })}
              className="mt-0.5 rounded border-fd-border text-fd-primary focus:ring-2 focus:ring-fd-primary focus:ring-offset-2 cursor-pointer"
            />
            <div className="flex-1">
              <div className="font-medium">Modal Mode</div>
              <div className="text-xs text-fd-muted-foreground">Open in overlay popup (recommended)</div>
            </div>
          </label>

          <label className="flex items-start gap-3 text-sm text-fd-foreground cursor-pointer p-3 rounded-lg border border-fd-border/50 hover:bg-fd-muted/30 transition-colors">
            <input
              type="checkbox"
              checked={config.showDownloadTemplateButton}
              onChange={(e) => updateConfig({ showDownloadTemplateButton: e.target.checked })}
              className="mt-0.5 rounded border-fd-border text-fd-primary focus:ring-2 focus:ring-fd-primary focus:ring-offset-2 cursor-pointer"
            />
            <div className="flex-1">
              <div className="font-medium">Show Template Button</div>
              <div className="text-xs text-fd-muted-foreground">Let users download CSV template</div>
            </div>
          </label>

          <label className="flex items-start gap-3 text-sm text-fd-foreground cursor-pointer p-3 rounded-lg border border-fd-border/50 hover:bg-fd-muted/30 transition-colors">
            <input
              type="checkbox"
              checked={config.skipHeaderRowSelection}
              onChange={(e) => updateConfig({ skipHeaderRowSelection: e.target.checked })}
              className="mt-0.5 rounded border-fd-border text-fd-primary focus:ring-2 focus:ring-fd-primary focus:ring-offset-2 cursor-pointer"
            />
            <div className="flex-1">
              <div className="font-medium">Skip Header Selection</div>
              <div className="text-xs text-fd-muted-foreground">Auto-detect first row as headers</div>
            </div>
          </label>
        </div>
      </div>

      {/* Column Templates */}
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-sm text-fd-foreground">Add Columns</h3>
          <p className="text-xs text-fd-muted-foreground mt-1">Start with pre-configured templates or create custom columns</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.keys(COLUMN_TEMPLATES).map(templateKey => (
            <button
              key={templateKey}
              onClick={() => addColumnFromTemplate(templateKey)}
              className="px-3 py-1.5 text-sm border border-fd-border/50 rounded-md bg-fd-card/30 hover:bg-fd-primary/10 hover:border-fd-primary/30 text-fd-foreground font-medium transition-colors capitalize backdrop-blur-sm"
            >
              + {templateKey}
            </button>
          ))}
          <button
            onClick={addColumn}
            className="px-3 py-1.5 text-sm border border-fd-border/50 rounded-md bg-fd-muted/30 hover:bg-fd-muted/50 text-fd-muted-foreground font-medium transition-colors backdrop-blur-sm"
          >
            + Custom Column
          </button>
        </div>
      </div>

      {/* Columns Configuration */}
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-sm text-fd-foreground">Configure Columns ({config.columns.length})</h3>
            <p className="text-xs text-fd-muted-foreground mt-1">Set up validation rules and data transformations</p>
          </div>
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
                  <option value="select">Select</option>
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
                <div className="flex items-center gap-2">
                  <div className="text-xs font-medium text-fd-foreground/70">Validation Rules</div>
                  <div className="text-xs text-fd-muted-foreground/60">(click to toggle)</div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {['required', 'unique'].map(validatorType => (
                    <button
                      key={validatorType}
                      onClick={() => toggleValidator(index, validatorType)}
                      title={validatorType === 'required' ? 'Field must have a value' : 'All values must be unique'}
                      className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                        column.validators?.some(v => v.type === validatorType)
                          ? 'bg-fd-primary text-fd-primary-foreground shadow-sm'
                          : 'bg-fd-muted text-fd-foreground hover:bg-fd-muted/80 border border-fd-border/30'
                      }`}
                    >
                      {validatorType}
                    </button>
                  ))}

                  {column.type === 'number' && ['min', 'max'].map(validatorType => (
                    <button
                      key={validatorType}
                      onClick={() => toggleValidator(index, validatorType)}
                      title={validatorType === 'min' ? 'Minimum value allowed' : 'Maximum value allowed'}
                      className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                        column.validators?.some(v => v.type === validatorType)
                          ? 'bg-fd-primary text-fd-primary-foreground shadow-sm'
                          : 'bg-fd-muted text-fd-foreground hover:bg-fd-muted/80 border border-fd-border/30'
                      }`}
                    >
                      {validatorType}
                    </button>
                  ))}

                  {column.type === 'string' && ['min_length', 'max_length', 'regex'].map(validatorType => (
                    <button
                      key={validatorType}
                      onClick={() => toggleValidator(index, validatorType)}
                      title={
                        validatorType === 'min_length' ? 'Minimum text length' :
                        validatorType === 'max_length' ? 'Maximum text length' :
                        'Custom pattern matching'
                      }
                      className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                        column.validators?.some(v => v.type === validatorType)
                          ? 'bg-fd-primary text-fd-primary-foreground shadow-sm'
                          : 'bg-fd-muted text-fd-foreground hover:bg-fd-muted/80 border border-fd-border/30'
                      }`}
                    >
                      {validatorType === 'min_length' ? 'minLength' : validatorType === 'max_length' ? 'maxLength' : validatorType}
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
                  if (validator.type === 'min_length' || validator.type === 'max_length') {
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
                <div className="flex items-center gap-2">
                  <div className="text-xs font-medium text-fd-foreground/70">Data Transformations</div>
                  <div className="text-xs text-fd-muted-foreground/60">(applied in order)</div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_TRANSFORMERS.map(transformer => (
                    <button
                      key={transformer.type}
                      onClick={() => toggleTransformer(index, transformer.type)}
                      title={transformer.description}
                      className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                        column.transformers?.some(t => t.type === transformer.type)
                          ? 'bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/30 shadow-sm'
                          : 'bg-fd-muted text-fd-foreground hover:bg-fd-muted/80 border border-fd-border/30'
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
        <div>
          <h3 className="font-semibold text-sm text-fd-foreground">Test Your Configuration</h3>
          <p className="text-xs text-fd-muted-foreground mt-1">Try the importer with your settings</p>
        </div>
        <div className="space-y-3">
          <button
            onClick={onOpenImporter}
            className="inline-flex items-center justify-center px-5 py-2.5 bg-fd-primary text-fd-primary-foreground rounded-lg hover:bg-fd-primary/90 transition-colors font-medium shadow-md hover:shadow-lg"
          >
            <span className="mr-2">▶</span>
            Test Importer
          </button>

          {importedData && (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-green-700 dark:text-green-400 text-sm font-medium flex items-center gap-2">
                <span className="text-lg">✓</span>
                Successfully imported {importedData.num_rows} rows
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