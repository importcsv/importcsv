'use client';

import { useState, useEffect } from 'react';
import { Tabs, Tab } from 'fumadocs-ui/components/tabs';
import PropConfigurator from './PropConfigurator';
import CodeGenerator from './CodeGenerator';
import { loadCSVImporter } from '@/lib/load-importer';
import type { Column, Transformer, Validator } from '@importcsv/react';

export interface ExtendedColumn extends Column {
  transformers?: Transformer[];
  description?: string;
}

export interface PlaygroundConfig {
  darkMode: boolean;
  isModal: boolean;
  modalIsOpen?: boolean;
  showDownloadTemplateButton: boolean;
  skipHeaderRowSelection: boolean;
  columns: ExtendedColumn[];
}

const defaultConfig: PlaygroundConfig = {
  darkMode: false,
  isModal: true,
  modalIsOpen: false,
  showDownloadTemplateButton: true,
  skipHeaderRowSelection: false,
  columns: [
    { 
      id: 'name', 
      label: 'Full Name',
      description: 'Enter the person\'s full name',
      validators: [{ type: 'required' }],
      transformers: [{ type: 'trim' }, { type: 'capitalize' }]
    },
    { 
      id: 'email', 
      label: 'Email',
      description: 'Valid email address',
      type: 'email',
      validators: [{ type: 'required' }, { type: 'regex', pattern: '^[^@]+@[^@]+\\.[^@]+$', message: 'Invalid email format' }],
      transformers: [{ type: 'trim' }, { type: 'lowercase' }]
    },
    {
      id: 'phone',
      label: 'Phone Number',
      description: 'Phone number with country code',
      type: 'phone',
      validators: [{ type: 'regex', pattern: '^\\+?[1-9]\\d{1,14}$', message: 'Invalid phone number' }],
      transformers: [{ type: 'trim' }, { type: 'normalize_phone' }]
    },
    {
      id: 'age',
      label: 'Age',
      description: 'Must be 18 or older',
      type: 'number',
      validators: [
        { type: 'required' },
        { type: 'min', value: 18, message: 'Must be at least 18 years old' },
        { type: 'max', value: 120, message: 'Invalid age' }
      ]
    }
  ]
};

export default function ImporterPlayground() {
  const [CSVImporter, setCSVImporter] = useState<any>(null);
  const [config, setConfig] = useState<PlaygroundConfig>(defaultConfig);
  const [importedData, setImportedData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCSVImporter().then(module => {
      setCSVImporter(() => (module as any).CSVImporter);
      setIsLoading(false);
    }).catch(error => {
      console.error('Failed to load CSVImporter:', error);
      setIsLoading(false);
    });
  }, []);

  const handleImportComplete = (data: any) => {
    console.log('Import completed:', data);
    setImportedData(data);
    setConfig(prev => ({ ...prev, modalIsOpen: false }));
  };

  const openImporter = () => {
    setConfig(prev => ({ ...prev, modalIsOpen: true }));
    setImportedData(null);
  };

  if (isLoading) {
    return (
      <div className="not-prose flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-fd-primary mx-auto"></div>
          <p className="mt-2 text-sm text-fd-muted-foreground">Loading playground...</p>
        </div>
      </div>
    );
  }

  if (!CSVImporter) {
    return (
      <div className="not-prose rounded-lg border border-fd-destructive/20 bg-fd-destructive/10 p-4">
        <p className="text-fd-destructive-foreground font-medium">Failed to load CSVImporter</p>
        <p className="text-sm mt-1 text-fd-muted-foreground">Check console for errors</p>
      </div>
    );
  }

  return (
    <div className="not-prose">
      <Tabs items={['Configure & Test', 'Code']}>
        <Tab value="Configure & Test">
          <div className="mt-6">
            <PropConfigurator 
              config={config} 
              onChange={setConfig}
              onOpenImporter={openImporter}
              importedData={importedData}
              CSVImporter={CSVImporter}
              onImportComplete={handleImportComplete}
            />
          </div>
        </Tab>
        <Tab value="Code">
          <div className="mt-6">
            <CodeGenerator config={config} />
          </div>
        </Tab>
      </Tabs>

      {/* Hidden modal importer */}
      {config.isModal && CSVImporter && (
        <CSVImporter
          {...config}
          modalOnCloseTriggered={() => setConfig(prev => ({ ...prev, modalIsOpen: false }))}
          onComplete={handleImportComplete}
        />
      )}
    </div>
  );
}