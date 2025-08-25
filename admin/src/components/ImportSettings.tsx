import React from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ExternalLink } from 'lucide-react';

interface ImportSettingsProps {
  includeUnmatchedColumns: boolean;
  filterInvalidRows: boolean;
  disableOnInvalidRows: boolean;
  darkMode: boolean;
  onIncludeUnmatchedColumnsChange: (enabled: boolean) => void;
  onFilterInvalidRowsChange: (enabled: boolean) => void;
  onDisableOnInvalidRowsChange: (enabled: boolean) => void;
  onDarkModeChange: (enabled: boolean) => void;
}

export default function ImportSettings({
  includeUnmatchedColumns,
  filterInvalidRows,
  disableOnInvalidRows,
  darkMode,
  onIncludeUnmatchedColumnsChange,
  onFilterInvalidRowsChange,
  onDisableOnInvalidRowsChange,
  onDarkModeChange,
}: ImportSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Include Unmatched Columns */}
        <div className="flex items-start justify-between">
          <div>
            <Label className="text-base">
              Include All Unmatched Columns in Import
            </Label>
            <p className="text-sm text-gray-500 mt-1">
              Enable this to import all columns uploaded by users, even if
              they are unmatched. This is useful if users have a variable
              number of additional columns they want to import.
            </p>
            <Link
              href="#"
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center mt-1"
            >
              Importer docs <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
          </div>
          <Switch
            checked={includeUnmatchedColumns}
            onCheckedChange={onIncludeUnmatchedColumnsChange}
          />
        </div>

        {/* Filter Invalid Rows */}
        <div className="flex items-start justify-between pt-4 border-t">
          <div>
            <Label className="text-base">Filter Invalid Rows</Label>
            <p className="text-sm text-gray-500 mt-1">
              Enable to prevent rows that fail any column validation
              criteria being imported. If disabled, users will be warned
              about invalid rows, but they will still be imported.
            </p>
            <Link
              href="#"
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center mt-1"
            >
              Importer docs <ExternalLink className="ml-1 h-3 w-3" />
            </Link>
          </div>
          <Switch
            checked={filterInvalidRows}
            onCheckedChange={onFilterInvalidRowsChange}
          />
        </div>

        {/* Disable Importing All Data */}
        <div className="flex items-start justify-between pt-4 border-t">
          <div>
            <Label className="text-base">
              Disable importing all data if there are invalid rows
            </Label>
            <p className="text-sm text-gray-500 mt-1">
              Enable to prevent importing all data if there are any
              invalid rows. If disabled, users will be warned about errors
              and invalid rows, but data will still be imported.
            </p>
          </div>
          <Switch
            checked={disableOnInvalidRows}
            onCheckedChange={onDisableOnInvalidRowsChange}
          />
        </div>
        
        {/* Dark Mode */}
        <div className="flex items-start justify-between pt-4 border-t">
          <div className="space-y-1">
            <Label htmlFor="dark-mode" className="text-base">
              Dark Mode
            </Label>
            <p className="text-sm text-gray-500 mt-1">
              Enable dark mode for the CSV importer UI. This will apply
              a dark theme to the importer interface when users interact with it.
            </p>
          </div>
          <Switch
            id="dark-mode"
            checked={darkMode}
            onCheckedChange={onDarkModeChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}