/**
 * Test data for CSV import
 */

// Sample CSV data that would be imported
export const sampleCsvData = [
  { name: 'John Doe', email: 'john@example.com', age: '30' },
  { name: 'Jane Smith', email: 'jane@example.com', age: '25' },
  { name: 'Bob Johnson', email: 'bob@example.com', age: '40' }
];

// Function to generate test data for the CSV importer
export const generateTestData = () => {
  // This format matches what the csv-import-react library sends in onComplete
  return {
    // Valid data that passed validation
    validData: sampleCsvData.map(row => ({
      // Convert to the format expected by the backend
      // Each field is an object with value, errors, and other metadata
      name: { value: row.name, errors: [] },
      email: { value: row.email, errors: [] },
      age: { value: row.age, errors: [] }
    })),
    // Invalid data that failed validation
    invalidData: [],
    // Include any other properties that the CSV importer might send
    fileName: 'test-data.csv',
    rowCount: sampleCsvData.length,
    columnMappings: {
      name: 'name',
      email: 'email',
      age: 'age'
    }
  };
};

// Alternative format with raw values for direct backend processing
export const generateRawTestData = () => {
  return {
    validData: sampleCsvData,
    invalidData: [],
    rawData: sampleCsvData,
    columnMapping: {
      name: 'name',
      email: 'email',
      age: 'age'
    }
  };
};
