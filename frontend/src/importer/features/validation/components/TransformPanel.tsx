import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import type { ComponentChildren, FunctionComponent, JSX } from 'preact';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Checkbox } from '../../../components/ui/checkbox';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { useToast } from '../../../components/ui/use-toast';
import { Sparkles, X, Check, Info, AlertCircle, ChevronRight } from 'lucide-react';
import { useTranslation } from '../../../../i18n/useTranslation';
import {
  generateTransformations,
  countSelectedChanges,
  toggleChangeSelection,
  setAllChangesSelection,
  TransformationChange,
  COMMON_PROMPTS
} from '../../../services/transformation';
import {
  analyzeValidationErrors,
  getErrorSummary,
  getSelectedErrors,
  toggleErrorGroup,
  setAllErrorGroups,
  countSelectedErrors,
  type ErrorGroup
} from '../../../utils/errorAnalysis';

interface TransformPanelProps {
  isOpen: boolean;
  onClose: () => void;
  data: any[];
  columnMapping: Record<string, any>;
  backendUrl: string;
  importerKey: string;
  validationErrors?: Array<{
    rowIndex: number;
    columnKey: string;
    message: string;
    value?: any;
  }>;
  onApplyTransformations: (changes: TransformationChange[]) => void;
}

export default function TransformPanel({
  isOpen,
  onClose,
  data,
  columnMapping,
  backendUrl,
  importerKey,
  validationErrors,
  onApplyTransformations
}: TransformPanelProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const promptInputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // State
  const [prompt, setPrompt] = useState('');
  const [changes, setChanges] = useState<TransformationChange[]>([]);
  const [summary, setSummary] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [errorGroups, setErrorGroups] = useState<ErrorGroup[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Determine if we're in error-fixing mode
  const hasValidationErrors = validationErrors && validationErrors.length > 0;

  // Analyze errors when panel opens or errors change
  useEffect(() => {
    if (hasValidationErrors && isOpen) {
      const groups = analyzeValidationErrors(validationErrors);
      setErrorGroups(groups);
    }
  }, [validationErrors, hasValidationErrors, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Focus the panel for accessibility
      panelRef.current?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Generate transformations
  const handleGenerate = useCallback(async (customPrompt?: string) => {
    const effectivePrompt = customPrompt || prompt;

    if (!effectivePrompt.trim()) {
      setError('Please describe the transformation');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setChanges([]);
    setSummary('');

    try {
      const result = await generateTransformations(
        effectivePrompt,
        data,
        columnMapping,
        backendUrl,
        importerKey,
        undefined, // targetColumns
        validationErrors
      );

      if (result.success && result.changes.length > 0) {
        setChanges(result.changes);
        setSummary(result.summary);
      } else if (result.error) {
        setError(result.error);
      } else {
        setError('No transformations generated. Try a different description.');
      }
    } catch (err) {
      setError('Failed to generate transformations');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, data, columnMapping, backendUrl, importerKey, validationErrors]);

  // Fix selected error groups
  const handleFixSelectedErrors = useCallback(() => {
    const selectedErrors = getSelectedErrors(errorGroups);
    if (selectedErrors.length === 0) {
      setError('Please select at least one error category to fix');
      return;
    }

    // Create a descriptive prompt based on selected error types
    const selectedTypes = errorGroups
      .filter(g => g.selected)
      .map(g => g.title.toLowerCase())
      .join(', ');

    const fixPrompt = `fix validation errors: ${selectedTypes}`;
    handleGenerate(fixPrompt);
  }, [errorGroups, handleGenerate]);

  // Toggle error group selection
  const handleToggleErrorGroup = useCallback((type: string) => {
    setErrorGroups(prev => toggleErrorGroup(prev, type));
  }, []);

  // Select/deselect all error groups
  const handleSelectAllErrors = useCallback((selected: boolean) => {
    setErrorGroups(prev => setAllErrorGroups(prev, selected));
  }, []);

  // Apply transformations
  const handleApply = useCallback((applyAll: boolean) => {
    const selectedChanges = applyAll
      ? setAllChangesSelection(changes, true)
      : changes.filter(c => c.selected);

    // Pass the selected changes directly to the parent
    onApplyTransformations(selectedChanges);

    toast({
      title: 'Transformations applied',
      description: `${selectedChanges.length} changes applied successfully`,
    });

    onClose();
  }, [changes, onApplyTransformations, onClose, toast]);

  // Toggle change selection
  const handleToggleChange = useCallback((index: number) => {
    setChanges(prev => toggleChangeSelection(prev, index));
  }, []);

  // Select all/none
  const handleSelectAll = useCallback((selected: boolean) => {
    setChanges(prev => setAllChangesSelection(prev, selected));
  }, []);

  // Use example prompt
  const handleUseExample = useCallback((examplePrompt: string) => {
    setPrompt(examplePrompt);
    setShowExamples(false);
    promptInputRef.current?.focus();
  }, []);

  // Reset panel
  const handleClose = useCallback(() => {
    setPrompt('');
    setChanges([]);
    setSummary('');
    setError(null);
    setShowExamples(false);
    onClose();
  }, [onClose]);

  const selectedCount = countSelectedChanges(changes);
  const hasChanges = changes.length > 0;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 dark:bg-black/50 z-40 transition-opacity duration-200"
        onClick={handleClose}
        style={{
          pointerEvents: isOpen ? 'auto' : 'none',
          opacity: isOpen ? 1 : 0
        }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`absolute right-0 top-0 h-full bg-white dark:bg-gray-800 shadow-lg z-50 flex flex-col transform transition-transform duration-200 ease-out rounded-l-lg ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          width: 'min(500px, 50%)',
          minWidth: '320px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b dark:border-gray-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            <h2 className="text-lg font-semibold dark:text-gray-100">
              {hasValidationErrors && !hasChanges ? t('Fix Validation Errors') : t('Transform Data')}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Close panel"
          >
            <X className="h-4 w-4 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Error groups display when validation errors exist */}
          {hasValidationErrors && !hasChanges && errorGroups.length > 0 && (
            <>
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Select which errors to fix:
                </p>

                {/* Error group cards */}
                <div className="space-y-3">
                  {errorGroups.map(group => (
                    <div
                      key={group.type}
                      className={`border rounded-lg p-3 cursor-pointer transition-all ${
                        group.selected
                          ? 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-gray-700'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:bg-gray-700/50'
                      }`}
                      onClick={() => handleToggleErrorGroup(group.type)}
                    >
                      <div className="flex items-start gap-2">
                        <Checkbox
                          checked={group.selected}
                          onCheckedChange={() => handleToggleErrorGroup(group.type)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm dark:text-gray-100">
                              {group.title} ({group.count} {group.count === 1 ? 'error' : 'errors'})
                            </h4>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {group.description}
                          </p>
                          <div className="mt-2">
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              Columns: {group.columns.join(', ')}
                            </p>
                            {group.example && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                Example: "{group.example.before}" → "{group.example.after}"
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Select all / none */}
                <div className="flex gap-2 mt-3">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleSelectAllErrors(true)}
                  >
                    Select All
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleSelectAllErrors(false)}
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              {/* Fix button */}
              <div className="flex justify-center">
                <Button
                  type="button"
                  size="default"
                  onClick={handleFixSelectedErrors}
                  isLoading={isGenerating}
                  disabled={isGenerating || countSelectedErrors(errorGroups) === 0}
                  className="px-6"
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {isGenerating
                    ? t('Analyzing errors...')
                    : t(`Fix ${countSelectedErrors(errorGroups)} Selected Errors`)}
                </Button>
              </div>
            </>
          )}

          {/* Standard prompt input (only shown when no validation errors) */}
          {!hasValidationErrors && !hasChanges && (
            <div>
              <div className="flex gap-2 mb-2">
                <Input
                  ref={promptInputRef}
                  placeholder={t("Describe the transformation (e.g., 'Convert dates to MM/DD/YYYY')")}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleGenerate()}
                  disabled={isGenerating}
                  className="h-10"
                />
                <Button
                  type="button"
                  onClick={() => handleGenerate()}
                  isLoading={isGenerating}
                  disabled={isGenerating}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  {isGenerating ? t('Generating') : t('Generate')}
                </Button>
              </div>

              {/* Example prompts */}
              <button
                className="text-xs text-blue-600 hover:underline"
                onClick={() => setShowExamples(!showExamples)}
              >
                {showExamples ? t('Hide examples') : t('Show examples')}
              </button>

              {showExamples && (
                <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded-md">
                  <p className="text-xs mb-1 font-bold dark:text-gray-300">
                    {t('Click to use:')}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {COMMON_PROMPTS.slice(0, 5).map((example, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 dark:text-gray-300 rounded cursor-pointer hover:bg-blue-100 dark:hover:bg-gray-600"
                        onClick={() => handleUseExample(example)}
                      >
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Loading State */}
          {isGenerating && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-600">
                {t('Analyzing data and generating transformations...')}
              </p>
            </div>
          )}

          {/* Changes Preview */}
          {hasChanges && !isGenerating && (
            <>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold">
                    {summary || `${changes.length} transformation${changes.length !== 1 ? 's' : ''} generated`}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleSelectAll(true)}
                    >
                      {t('Select all')}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleSelectAll(false)}
                    >
                      {t('Deselect all')}
                    </Button>
                  </div>
                </div>

                <div className="max-h-[400px] overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-2">
                  <div className="space-y-1">
                    {changes.slice(0, 100).map((change, index) => (
                      <div
                        key={index}
                        className={`flex items-start gap-2 p-2 rounded-md border cursor-pointer ${
                          change.selected
                            ? 'bg-blue-50 dark:bg-gray-700 border-blue-200 dark:border-blue-600 hover:bg-blue-100 dark:hover:bg-gray-600'
                            : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                        onClick={() => handleToggleChange(index)}
                      >
                        <Checkbox
                          checked={change.selected}
                          onCheckedChange={() => handleToggleChange(index)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex-1 space-y-0">
                          <div className="text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <span className="line-through">
                              {String(change.oldValue || 'empty')}
                            </span>
                            <span>→</span>
                            <span className="text-green-600 font-bold">
                              {String(change.newValue)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Row {change.rowIndex + 1}, {change.columnKey}
                          </p>
                        </div>
                      </div>
                    ))}

                    {changes.length > 100 && (
                      <p className="text-sm text-gray-500 dark:text-gray-500 text-center">
                        {t(`Showing first 100 of ${changes.length} changes`)}
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {selectedCount} {t('selected')}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t dark:border-gray-700 p-5">
          <div className="flex gap-3 justify-end">

            {hasChanges && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleApply(false)}
                  disabled={selectedCount === 0}
                >
                  {t(`Apply ${selectedCount} selected`)}
                </Button>
                <Button
                  type="button"
                  onClick={() => handleApply(true)}
                >
                  <Check className="mr-2 h-4 w-4" />
                  {t('Apply all')}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}