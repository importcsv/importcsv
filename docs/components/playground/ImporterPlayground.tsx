'use client';

import { useState, useEffect } from 'react';
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
  const [activeTab, setActiveTab] = useState<'configure' | 'code'>('configure');

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
      <div className="not-prose rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
        <p>Failed to load CSVImporter</p>
        <p className="text-sm mt-1">Check console for errors</p>
      </div>
    );
  }

  return (
    <div className="not-prose">
      {/* Tab Navigation */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('configure')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'configure' 
              ? 'border-b-2 border-fd-primary text-fd-foreground' 
              : 'text-fd-muted-foreground hover:text-fd-foreground'
          }`}
        >
          Configure & Test
        </button>
        <button
          onClick={() => setActiveTab('code')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'code' 
              ? 'border-b-2 border-fd-primary text-fd-foreground' 
              : 'text-fd-muted-foreground hover:text-fd-foreground'
          }`}
        >
          Code
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {activeTab === 'configure' && (
          <PropConfigurator 
            config={config} 
            onChange={setConfig}
            onOpenImporter={openImporter}
            importedData={importedData}
            CSVImporter={CSVImporter}
            onImportComplete={handleImportComplete}
          />
        )}

        {activeTab === 'code' && (
          <CodeGenerator config={config} />
        )}
      </div>

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