import { useState, useEffect, useRef, useCallback, useMemo } from 'preact/hooks';
import type { ComponentChildren, FunctionComponent, JSX } from 'preact';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Checkbox } from '../../../components/ui/checkbox';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Sparkles, X, Check, Info, AlertCircle, ChevronRight, ArrowRight, AlertTriangle } from 'lucide-react';
import { cn } from '../../../../utils/cn';
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

const HIGH_CONFIDENCE_THRESHOLD = 0.9;

type ConfidenceTier = 'high' | 'medium';

function getConfidenceTier(confidence: number): ConfidenceTier {
  return confidence >= HIGH_CONFIDENCE_THRESHOLD ? 'high' : 'medium';
}

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

    onClose();
  }, [changes, onApplyTransformations, onClose]);

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

  // Keyboard handler for clickable elements
  const handleKeyDown = useCallback((e: KeyboardEvent, callback: () => void) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      callback();
    }
  }, []);

  const selectedCount = countSelectedChanges(changes);
  const hasChanges = changes.length > 0;
  const needsReviewCount = useMemo(
    () => changes.filter(c => c.confidence < HIGH_CONFIDENCE_THRESHOLD).length,
    [changes]
  );

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
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-orange-500">!</span>
            <h2 className="text-base font-medium text-gray-900 dark:text-gray-100">
              {t('Transform Data')}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            aria-label="Close panel"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
          {/* Error groups display when validation errors exist */}
          {hasValidationErrors && !hasChanges && errorGroups.length > 0 && (
            <>
              <div>
                {/* Header */}
                <div className="mb-4">
                  <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
                    {countSelectedErrors(errorGroups)} validation errors
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Select errors to fix automatically
                  </p>
                </div>

                {/* Error list */}
                <div className="space-y-1 mb-4">
                  {errorGroups.map(group => (
                    <div
                      key={group.type}
                      role="button"
                      tabIndex={0}
                      className="flex items-center gap-3 py-2 px-1 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer rounded transition-colors"
                      onClick={() => handleToggleErrorGroup(group.type)}
                      onKeyDown={(e) => handleKeyDown(e, () => handleToggleErrorGroup(group.type))}
                    >
                      <Checkbox
                        checked={group.selected}
                        onCheckedChange={() => handleToggleErrorGroup(group.type)}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-shrink-0"
                      />
                      <div className="flex-1">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {group.title}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {group.count} {group.count === 1 ? 'error' : 'errors'} in {group.columns.join(', ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => handleSelectAllErrors(true)}
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => handleSelectAllErrors(false)}
                  >
                    Clear all
                  </button>
                </div>

                {/* Fix button */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleFixSelectedErrors}
                    disabled={isGenerating || countSelectedErrors(errorGroups) === 0}
                  >
                    {isGenerating
                      ? t('Analyzing...')
                      : t(`Fix ${countSelectedErrors(errorGroups)} selected`)}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Standard prompt input (only shown when no validation errors) */}
          {!hasValidationErrors && !hasChanges && (
            <div>
              <div className="flex gap-2 mb-2">
                <Input
                  {...{
                    ref: promptInputRef as any,
                    placeholder: t("Describe the transformation (e.g., 'Convert dates to MM/DD/YYYY')"),
                    value: prompt,
                    onChange: (e: any) => setPrompt((e.target as HTMLInputElement).value),
                    onKeyPress: (e: any) => e.key === 'Enter' && handleGenerate(),
                    disabled: isGenerating,
                    className: "h-10"
                  }}
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
                {/* Header with count */}
                <div className="mb-4">
                  <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
                    {changes.length} {changes[0]?.columnKey || ''} values will be transformed
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Review and select the changes you want to apply
                  </p>
                </div>

                {/* Selection control */}
                <div className="mb-3">
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    onClick={() => handleSelectAll(selectedCount === changes.length ? false : true)}
                  >
                    {selectedCount === changes.length ? t('Deselect all') : t('Select all')}
                  </button>
                </div>

                {/* Changes list */}
                <div>
                  <div className="space-y-0.5">
                    {changes.slice(0, 100).map((change, index) => (
                      <div
                        key={index}
                        role="button"
                        tabIndex={0}
                        className="flex items-center gap-3 py-2 px-1 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors rounded"
                        onClick={() => handleToggleChange(index)}
                        onKeyDown={(e) => handleKeyDown(e, () => handleToggleChange(index))}
                      >
                        <Checkbox
                          checked={change.selected}
                          onCheckedChange={() => handleToggleChange(index)}
                          onClick={(e: JSX.TargetedEvent<HTMLInputElement, Event>) => e.stopPropagation()}
                          className="flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          {/* Diff display */}
                          <div className="flex items-center gap-2 text-sm flex-wrap">
                            <span className="line-through text-gray-400 truncate max-w-[120px]" title={String(change.oldValue || '')}>
                              {String(change.oldValue || '(empty)')}
                            </span>
                            <ArrowRight size={14} className="text-gray-400 flex-shrink-0" />
                            <span className={cn(
                              "font-medium truncate max-w-[200px]",
                              getConfidenceTier(change.confidence) === 'high'
                                ? "text-green-600 dark:text-green-400"
                                : "text-amber-600 dark:text-amber-400"
                            )} title={String(change.newValue)}>
                              {String(change.newValue)}
                            </span>
                            {/* Warning icon for medium confidence */}
                            {getConfidenceTier(change.confidence) === 'medium' && (
                              <span
                                title={`Confidence: ${Math.round(change.confidence * 100)}%`}
                                aria-label={`Low confidence: ${Math.round(change.confidence * 100)}%`}
                              >
                                <AlertTriangle
                                  size={14}
                                  className="text-amber-500 flex-shrink-0"
                                  aria-hidden="true"
                                />
                              </span>
                            )}
                          </div>
                          {/* Row info */}
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Row {change.rowIndex + 1}, {change.columnKey}
                          </div>
                        </div>
                      </div>
                    ))}

                    {changes.length > 100 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                        {t(`Showing first 100 of ${changes.length} changes`)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
          </div>
        </div>

        {/* Footer */}
        {hasChanges && (
          <div className="border-t dark:border-gray-700 p-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {selectedCount} selected
                {needsReviewCount > 0 && (
                  <span className="text-amber-600 dark:text-amber-400 ml-1">
                    ({needsReviewCount} need review)
                  </span>
                )}
              </div>
              <button
                type="button"
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => handleApply(selectedCount === changes.length)}
                disabled={selectedCount === 0}
              >
                {t(`Apply ${selectedCount}`)}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}