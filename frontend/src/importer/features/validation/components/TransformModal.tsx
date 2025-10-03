import { useState, useEffect, useRef, useCallback } from 'preact/hooks';
import type { ComponentChildren, FunctionComponent, JSX } from 'preact';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Checkbox } from '../../../components/ui/checkbox';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Sparkles, X, Check, Info } from 'lucide-react';
import { useTranslation } from '../../../../i18n/useTranslation';
import {
  generateTransformations,
  countSelectedChanges,
  toggleChangeSelection,
  setAllChangesSelection,
  TransformationChange,
  COMMON_PROMPTS
} from '../../../services/transformation';

interface TransformModalProps {
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

export default function TransformModal({
  isOpen,
  onClose,
  data,
  columnMapping,
  backendUrl,
  importerKey,
  validationErrors,
  onApplyTransformations
}: TransformModalProps) {
  const { t } = useTranslation();
  const promptInputRef = useRef<HTMLInputElement>(null);

  // State
  const [prompt, setPrompt] = useState('');
  const [changes, setChanges] = useState<TransformationChange[]>([]);
  const [summary, setSummary] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  
  // Determine if we're in error-fixing mode
  const hasValidationErrors = validationErrors && validationErrors.length > 0;

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
  
  // Fix all validation errors with one click
  const handleFixAllErrors = useCallback(() => {
    handleGenerate('fix errors');
  }, [handleGenerate]);

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

  // Reset modal
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[800px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {t('Transform data with AI')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto min-h-0 space-y-4">
            {/* Simplified UI when validation errors exist */}
            {hasValidationErrors && !hasChanges && (
              <>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{validationErrors.length} validation error{validationErrors.length > 1 ? 's' : ''} detected</strong>
                    <br />
                    Click "Fix All Errors" to automatically correct validation issues in your data.
                  </AlertDescription>
                </Alert>
                
                <div className="flex justify-center py-4">
                  <Button
                    type="button"
                    size="lg"
                    onClick={handleFixAllErrors}
                    isLoading={isGenerating}
                    disabled={isGenerating}
                    className="px-8"
                  >
                    <Sparkles className="mr-2 h-5 w-5" />
                    {isGenerating ? t('Fixing errors...') : t('Fix All Errors')}
                  </Button>
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
                  <div className="mt-2 p-2 bg-gray-50 rounded-md">
                    <p className="text-xs mb-1 font-bold">
                      {t('Click to use:')}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {COMMON_PROMPTS.slice(0, 5).map((example, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 text-xs bg-gray-200 rounded cursor-pointer hover:bg-blue-100"
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
                  
                  <div className="max-h-[300px] overflow-y-auto border border-gray-200 rounded-md p-2">
                    <div className="space-y-1">
                      {changes.slice(0, 100).map((change, index) => (
                        <div
                          key={index}
                          className={`flex items-start gap-2 p-2 rounded-md border cursor-pointer ${
                            change.selected
                              ? 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                              : 'bg-white border-gray-100 hover:bg-gray-50'
                          }`}
                          onClick={() => handleToggleChange(index)}
                        >
                          <Checkbox
                            checked={change.selected}
                            onCheckedChange={() => handleToggleChange(index)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1 space-y-0">
                            <div className="text-sm text-gray-900 flex items-center gap-2">
                              <span className="line-through">
                                {String(change.oldValue || 'empty')}
                              </span>
                              <span>→</span>
                              <span className="text-green-600 font-bold">
                                {String(change.newValue)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-600">
                              Row {change.rowIndex + 1}, {change.columnKey}
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      {changes.length > 100 && (
                        <p className="text-sm text-gray-500 text-center">
                          {t(`Showing first 100 of ${changes.length} changes`)}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedCount} {t('selected')}
                  </p>
                </div>
              </>
            )}
        </div>

        <DialogFooter>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={handleClose}>
              {t('Cancel')}
            </Button>
            
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
