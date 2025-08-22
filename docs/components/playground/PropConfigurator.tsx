'use client';

import type { PlaygroundConfig } from './ImporterPlayground';
import type { Column, Validator } from '@importcsv/react';
import SampleDataSelector from './SampleDataSelector';

interface PropConfiguratorProps {
  config: PlaygroundConfig;
  onChange: (config: PlaygroundConfig) => void;
  onOpenImporter: () => void;
  importedData: any;
  CSVImporter: any;
  onImportComplete: (data: any) => void;
}

export default function PropConfigurator({
  config,
  onChange,
  onOpenImporter,
  importedData,
  CSVImporter,
  onImportComplete
}: PropConfiguratorProps) {
  const updateConfig = (updates: Partial<PlaygroundConfig>) => {
    onChange({ ...config, ...updates });
  };

  const updateColumn = (index: number, updates: Partial<Column>) => {
    const newColumns = [...config.columns];
    newColumns[index] = { ...newColumns[index], ...updates };
    updateConfig({ columns: newColumns });
  };

  const addColumn = () => {
    const newColumn: Column = {
      id: `col_${Date.now()}`,
      label: 'New Column',
      type: 'string'
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
      }
      column.validators = [...validators, newValidator];
    }

    updateColumn(columnIndex, { validators: column.validators });
  };

  return (
    <div className="space-y-6">
      {/* Sample Data Selector */}
      <SampleDataSelector />

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

        <div className="space-y-2">
          <label className="text-sm font-medium text-fd-foreground">Primary Color</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={config.primaryColor}
              onChange={(e) => updateConfig({ primaryColor: e.target.value })}
              className="h-9 w-16 rounded border border-fd-border cursor-pointer hover:border-fd-primary transition-colors"
            />
            <input
              type="text"
              value={config.primaryColor}
              onChange={(e) => updateConfig({ primaryColor: e.target.value })}
              className="flex-1 px-3 py-1.5 text-sm border border-fd-border rounded-md bg-fd-background text-fd-foreground focus:border-fd-primary focus:ring-2 focus:ring-fd-primary focus:ring-offset-2 focus:outline-none transition-colors"
              placeholder="#3B82F6"
            />
          </div>
        </div>

      </div>

      {/* Columns Configuration */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-sm text-fd-foreground">Columns ({config.columns.length})</h3>
          <button
            onClick={addColumn}
            className="text-sm px-3 py-1 border border-fd-border rounded-md hover:bg-fd-muted text-fd-foreground font-medium transition-colors"
          >
            + Add Column
          </button>
        </div>

        <div className="space-y-3">
          {config.columns.map((column, index) => (
            <div key={index} className="border border-fd-border rounded-lg p-4 space-y-3 bg-fd-card">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={column.label}
                  onChange={(e) => updateColumn(index, { label: e.target.value })}
                  className="flex-1 px-2 py-1 text-sm border border-fd-border rounded-md bg-fd-background text-fd-foreground focus:border-fd-primary focus:ring-2 focus:ring-fd-primary focus:ring-offset-2 focus:outline-none transition-colors"
                  placeholder="Label"
                />
                <select
                  value={column.type || 'string'}
                  onChange={(e) => updateColumn(index, { type: e.target.value as any })}
                  className="px-2 py-1 text-sm border border-fd-border rounded-md bg-fd-background text-fd-foreground focus:border-fd-primary focus:ring-2 focus:ring-fd-primary focus:ring-offset-2 focus:outline-none transition-colors"
                >
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="email">Email</option>
                  <option value="date">Date</option>
                  <option value="phone">Phone</option>
                </select>
                <button
                  onClick={() => removeColumn(index)}
                  className="px-2 py-1 text-sm text-fd-destructive hover:bg-fd-destructive/10 rounded-md font-bold transition-colors"
                >
                  ×
                </button>
              </div>

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
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Test Importer Section */}
      <div className="space-y-4">

        <div className="space-y-3">
          <button
            onClick={onOpenImporter}
            className="inline-flex items-center justify-center px-4 py-2 bg-fd-primary text-white rounded-md hover:bg-fd-primary/90 transition-colors font-medium shadow-sm"
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