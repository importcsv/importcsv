import React, { useState, useEffect } from 'react';
import { 
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  Box,
  Flex,
  Spinner,
  Badge,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td
} from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import style from './style/Validation.module.scss';

interface AIFix {
  row_index: number;
  column_index: number;
  original_value: string;
  suggested_value: string;
  explanation: string;
}

interface AIFixesResponse {
  fixes: AIFix[];
  error?: string;
}

interface AIFixModalProps {
  isOpen: boolean;
  onClose: () => void;
  errors: Array<{rowIndex: number, columnIndex: number, message: string, field?: string}>;
  dataRows: any[];
  headerRow: any;
  templateFields: any[];
  selectedHeaderRow: number;
  columnMapping: Record<number, any>;
  backendUrl: string;
  onApplyFixes: (fixes: Array<{rowIndex: number, columnIndex: number, value: string}>) => void;
}

export default function AIFixModal({
  isOpen,
  onClose,
  errors,
  dataRows,
  headerRow,
  templateFields,
  selectedHeaderRow,
  columnMapping,
  backendUrl,
  onApplyFixes
}: AIFixModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<AIFix[]>([]);
  const [selectedFixes, setSelectedFixes] = useState<Set<string>>(new Set());
  
  // Prepare valid rows (rows without errors) for examples
  const validRows = React.useMemo(() => {
    const errorRowIndices = new Set(errors.map(e => e.rowIndex));
    return dataRows
      .filter(row => !errorRowIndices.has(row.index))
      .slice(0, 3); // Take up to 3 valid rows as examples
  }, [dataRows, errors]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLoading(false);
      setErrorMessage(null);
      setSuggestions([]);
      setSelectedFixes(new Set());
      // Auto-fetch suggestions when modal opens
      fetchSuggestions();
    }
  }, [isOpen]);

  // Toggle selection of a fix
  const toggleFixSelection = (fix: AIFix) => {
    const key = `${fix.row_index}-${fix.column_index}`;
    const newSelected = new Set(selectedFixes);
    
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    
    setSelectedFixes(newSelected);
  };
  
  // Create a map of fixes by row for easier display
  const fixesByRow = React.useMemo(() => {
    const result: Record<number, AIFix[]> = {};
    
    // Ensure we have a unique list of fixes (row_index + column_index)
    const uniqueFixes = new Map<string, AIFix>();
    suggestions.forEach(fix => {
      const key = `${fix.row_index}-${fix.column_index}`;
      uniqueFixes.set(key, fix);
    });
    
    // Group the fixes by row index
    Array.from(uniqueFixes.values()).forEach(fix => {
      if (!result[fix.row_index]) {
        result[fix.row_index] = [];
      }
      result[fix.row_index].push(fix);
    });
    
    return result;
  }, [suggestions]);

  // Select all fixes
  const selectAllFixes = () => {
    const allKeys = suggestions.map(fix => `${fix.row_index}-${fix.column_index}`);
    setSelectedFixes(new Set(allKeys));
  };

  // Deselect all fixes
  const deselectAllFixes = () => {
    setSelectedFixes(new Set());
  };

  // Fetch suggestions from backend
  const fetchSuggestions = async () => {
    setLoading(true);
    setErrorMessage(null);
    
    try {
      // Prepare template fields for the API
      const formattedTemplateFields = templateFields.map(field => ({
        ...field,
        key: field.key || field.name?.toLowerCase().replace(/\s+/g, '_')
      }));
      
      // Add field name to errors
      const formattedErrors = errors.map(err => {
        const columnIdx = err.columnIndex;
        const mapping = columnMapping[columnIdx];
        const field = templateFields.find(f => f.key === mapping?.key);
        
        return {
          ...err,
          field: field?.name || 'Unknown Field'
        };
      });
      
      // Format data rows to ensure consistent structure
      const formattedRows = dataRows.map(row => ({
        index: row.index,
        values: Array.isArray(row.values) ? row.values : Object.values(row.values)
      }));
      
      // For debugging
      console.log('Sending to backend:', {
        errors: formattedErrors,
        data_rows: formattedRows,
        template_fields: formattedTemplateFields
      });
      
      // Create a timeout promise
      const timeoutPromise = new Promise<Response>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout after 15 seconds')), 15000);
      });
      
      // Create the fetch promise
      const fetchPromise = fetch(`${backendUrl}/api/v1/public/suggest-fixes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          errors: formattedErrors,
          data_rows: formattedRows,
          template_fields: formattedTemplateFields,
          valid_rows: validRows
        })
      });
      
      // Race the fetch against the timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const data: AIFixesResponse = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Log response for debugging
      console.log('Received suggestions from backend:', data);
      
      setSuggestions(data.fixes || []);
      
      // Auto-select all fixes
      const allKeys = (data.fixes || []).map(fix => `${fix.row_index}-${fix.column_index}`);
      setSelectedFixes(new Set(allKeys));
      
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to fetch suggestions');
    } finally {
      setLoading(false);
    }
  };

  // Apply selected fixes
  const applySelectedFixes = () => {
    const fixesToApply = suggestions
      .filter(fix => selectedFixes.has(`${fix.row_index}-${fix.column_index}`))
      .map(fix => ({
        rowIndex: fix.row_index - (selectedHeaderRow + 1), // Convert to internal row index
        columnIndex: fix.column_index,
        value: fix.suggested_value
      }));
    
    onApplyFixes(fixesToApply);
    onClose();
  };

  // We now use fixesByRow instead of this groupedSuggestions function

  // Get column name from index
  const getColumnName = (columnIndex: number) => {
    return headerRow?.values?.[columnIndex] || `Column ${columnIndex}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent maxW="800px">
        <ModalHeader>
          <Text fontSize="xl">AI Suggestions</Text>
          <Text fontSize="sm" color="gray.600">
            Review and apply AI-powered fixes for validation errors
          </Text>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          {loading ? (
            <Flex direction="column" align="center" justify="center" py={10}>
              <Spinner size="xl" color="blue.500" mb={4} />
              <Text>Analyzing your data and generating smart fixes...</Text>
            </Flex>
          ) : errorMessage ? (
            <Box bg="red.50" p={4} borderRadius="md" mb={4}>
              <Text color="red.500">{errorMessage}</Text>
              <Button mt={2} size="sm" colorScheme="blue" onClick={fetchSuggestions}>
                Try Again
              </Button>
            </Box>
          ) : suggestions.length === 0 ? (
            <Flex direction="column" align="center" justify="center" py={10}>
              <Box fontSize="xl" mb={3}>🎉</Box>
              <Text fontWeight="medium">No issues to fix!</Text>
              <Text fontSize="sm" color="gray.600">All your data appears to be valid.</Text>
            </Flex>
          ) : (
            <>
              <Flex justify="space-between" mb={4} align="center">
                <Box>
                  <Text fontWeight="medium">
                    Found {suggestions.length} suggestions across {Object.keys(fixesByRow).length} rows
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Select the fixes you want to apply
                  </Text>
                </Box>
                <Flex>
                  <Button size="sm" colorScheme="blue" variant="outline" mr={2} onClick={selectAllFixes}>
                    Select All
                  </Button>
                  <Button size="sm" variant="outline" onClick={deselectAllFixes}>
                    Deselect All
                  </Button>
                </Flex>
              </Flex>
              
              <Accordion allowMultiple defaultIndex={Object.keys(fixesByRow).map(Number).slice(0, 3)}>
                {Object.entries(fixesByRow).map(([rowIndex, fixes]) => (
                  <AccordionItem key={rowIndex}>
                    <h2>
                      <AccordionButton>
                        <Box flex="1" textAlign="left">
                          <Text fontWeight="semibold">
                            Row {rowIndex}
                          </Text>
                        </Box>
                        <Badge colorScheme="blue" mr={2}>
                          {fixes.length} {fixes.length === 1 ? 'suggestion' : 'suggestions'}
                        </Badge>
                        <AccordionIcon />
                      </AccordionButton>
                    </h2>
                    <AccordionPanel pb={4}>
                      <Table size="sm" variant="simple">
                        <Thead>
                          <Tr>
                            <Th width="40px"></Th>
                            <Th>Column</Th>
                            <Th>Current Value</Th>
                            <Th>Suggested Fix</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {fixes.map((fix, idx) => {
                            const isSelected = selectedFixes.has(`${fix.row_index}-${fix.column_index}`);
                            return (
                              <React.Fragment key={idx}>
                                <Tr 
                                  onClick={() => toggleFixSelection(fix)}
                                  cursor="pointer"
                                  bg={isSelected ? 'blue.50' : undefined}
                                  _hover={{ bg: isSelected ? 'blue.100' : 'gray.50' }}
                                >
                                  <Td>
                                    <input 
                                      type="checkbox" 
                                      checked={isSelected}
                                      onChange={() => toggleFixSelection(fix)}
                                    />
                                  </Td>
                                  <Td>{getColumnName(fix.column_index)}</Td>
                                  <Td>{fix.original_value || <em>empty</em>}</Td>
                                  <Td fontWeight="bold">{fix.suggested_value}</Td>
                                </Tr>
                                <Tr bg={isSelected ? 'blue.50' : undefined}>
                                  <Td colSpan={4} fontSize="sm" p={2} pl={10}>
                                    <Text fontSize="xs" color="gray.600">{fix.explanation}</Text>
                                  </Td>
                                </Tr>
                              </React.Fragment>
                            );
                          })}
                        </Tbody>
                      </Table>
                    </AccordionPanel>
                  </AccordionItem>
                ))}
              </Accordion>
            </>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={applySelectedFixes}
            isDisabled={loading || suggestions.length === 0 || selectedFixes.size === 0}
            leftIcon={<span role="img" aria-label="Magic">✨</span>}
          >
            Apply {selectedFixes.size} Selected {selectedFixes.size === 1 ? 'Fix' : 'Fixes'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}