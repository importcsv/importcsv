import { TemplateColumn, UploadColumn } from '../types';
import { TemplateColumnMapping } from '../features/map-columns/types';

/**
 * Request LLM-powered column mapping suggestions from the backend
 * @param backendUrl The URL of the backend API
 * @param importerKey The key of the importer
 * @param uploadColumns The columns from the uploaded file
 * @param templateColumns The columns from the schema template
 * @param sampleData Optional sample data to improve matching
 * @returns A promise that resolves to the suggested column mappings
 */
export async function getLLMColumnMappingSuggestions(
  backendUrl: string,
  importerKey: string,
  uploadColumns: UploadColumn[],
  templateColumns: TemplateColumn[],
  sampleData?: string[][]
): Promise<{ [key: number]: TemplateColumnMapping }> {
  try {
    const response = await fetch(`${backendUrl}/api/v1/public/llm-column-mapping`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        uploadColumns: uploadColumns.map(col => ({
          index: col.index,
          name: col.name,
          sampleData: col.sample_data?.map(item => item === null ? '' : String(item)) || []
        })),
        templateColumns: templateColumns.map(col => ({
          key: col.key,
          name: col.name,
          description: col.description,
          required: col.required,
          type: col.type || col.data_type
        })),
        importer_key: importerKey
      }),
    });

    if (!response.ok) {
      // If the LLM service fails, we'll return an empty object and fall back to traditional matching
      console.warn('LLM column mapping service returned an error:', await response.text());
      return {};
    }

    const result = await response.json();
    
    // Transform the result into the expected format
    const mappings: { [key: number]: TemplateColumnMapping } = {};
    
    for (const mapping of result.mappings) {
      mappings[mapping.uploadColumnIndex] = {
        key: mapping.templateColumnKey,
        include: true,
        selected: true,
        confidence: mapping.confidence, // New field to track LLM confidence
        isLLMSuggestion: true // Flag to indicate this came from LLM
      };
    }
    
    return mappings;
  } catch (error) {
    console.error('Error fetching LLM column mapping suggestions:', error);
    // Return empty mappings if the service fails
    return {};
  }
}
