'use client';

import { useState, useEffect } from 'react';
import { Tabs, Tab } from 'fumadocs-ui/components/tabs';
import PropConfigurator from './PropConfigurator';
import CodeGenerator from './CodeGenerator';
import { loadCSVImporter } from '@/lib/load-importer';
import type { Column } from '@importcsv/react';
import '@importcsv/react/build/bundle.css';

export interface PlaygroundConfig {
  darkMode: boolean;
  primaryColor: string;
  isModal: boolean;
  modalIsOpen?: boolean;
  showDownloadTemplateButton: boolean;
  skipHeaderRowSelection: boolean;
  columns: Column[];
}

const defaultConfig: PlaygroundConfig = {
  darkMode: false,
  primaryColor: '#3B82F6',
  isModal: true,
  modalIsOpen: false,
  showDownloadTemplateButton: true,
  skipHeaderRowSelection: false,
  columns: [
    { 
      id: 'name', 
      label: 'Full Name',
      validators: [{ type: 'required' }]
    },
    { 
      id: 'email', 
      label: 'Email',
      type: 'email'
    },
    {
      id: 'age',
      label: 'Age',
      type: 'number',
      validators: [
        { type: 'min', value: 18 }
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
      setCSVImporter(() => module.CSVImporter);
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