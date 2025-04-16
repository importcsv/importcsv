import { CSVImporter } from "csv-import-react";
import { useState, useEffect } from "react";
import { authApi, schemaApi, importApi } from "./api";
import { generateTestData } from "./testdata";
import TestImporter from "./TestImporter";
import "./App.css";

function App() {
  // Test mode toggle
  const [testMode, setTestMode] = useState(false);
  
  // Authentication state
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(!!token);
  
  // UI state
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Data state
  const [schemas, setSchemas] = useState([]);
  const [selectedSchemaId, setSelectedSchemaId] = useState(null);
  const [schemaTemplate, setSchemaTemplate] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [pollingIntervalId, setPollingIntervalId] = useState(null);
  
  // Login form state
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('admin123');
  
  // Load user and schemas when token changes
  useEffect(() => {
    if (token) {
      loadUserAndSchemas();
    }
  }, [token]);
  
  // Load schema template when schema ID changes
  useEffect(() => {
    if (token && selectedSchemaId) {
      loadSchemaTemplate();
    }
  }, [selectedSchemaId]);
  
  // If in test mode, render the test importer component
  if (testMode) {
    return (
      <div className="App">
        <div className="test-mode-header">
          <h2>Test Mode</h2>
          <button 
            className="button" 
            onClick={() => setTestMode(false)}
          >
            Return to Main App
          </button>
        </div>
        <TestImporter />
      </div>
    );
  }
  
  const loadUserAndSchemas = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get current user
      const userData = await authApi.getCurrentUser(token);
      setUser(userData);
      setIsLoggedIn(true);
      
      // Get schemas
      const schemasData = await schemaApi.getSchemas(token);
      setSchemas(schemasData);
      
      // Set first schema as selected if available
      if (schemasData.length > 0 && !selectedSchemaId) {
        setSelectedSchemaId(schemasData[0].id);
      }
    } catch (err) {
      console.error('Failed to load data:', err);
      setError('Failed to load user data. Please log in again.');
      // Clear token if unauthorized
      if (err.message.includes('401')) {
        handleLogout();
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadSchemaTemplate = async () => {
    setIsLoading(true);
    
    try {
      const template = await schemaApi.getSchemaTemplate(token, selectedSchemaId);
      setSchemaTemplate(template);
    } catch (err) {
      console.error('Failed to load schema template:', err);
      setError('Failed to load schema template.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await authApi.login(email, password);
      const newToken = data.access_token;
      setToken(newToken);
      localStorage.setItem('token', newToken);
      setIsLoggedIn(true);
    } catch (err) {
      console.error('Login failed:', err);
      setError('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogout = () => {
    // Clear any active polling
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      setPollingIntervalId(null);
    }
    
    setToken(null);
    setUser(null);
    setSchemas([]);
    setSelectedSchemaId(null);
    setSchemaTemplate(null);
    setIsLoggedIn(false);
    localStorage.removeItem('token');
  };
  
  // Start polling for import job status using the API service's polling function
  const startPolling = (jobId) => {
    // Clear any existing polling
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      setPollingIntervalId(null);
    }
    
    console.log(`Starting to poll job ${jobId} status using API service`);
    
    // Use the API service's polling function
    // This returns a Promise that resolves when polling completes
    importApi.pollImportJobStatus(
      token,
      jobId,
      // Status update callback
      (status) => {
        console.log('Job status update:', status);
        setImportResult(status);
        
        // Show notification based on status
        if (status.status === 'COMPLETED') {
          setError(null);
          console.log('Import completed successfully!');
        } else if (status.status === 'FAILED') {
          setError(`Import failed: ${status.error || 'Unknown error'}`);
        }
      },
      3000, // Poll every 3 seconds
      120000 // Timeout after 2 minutes
    ).catch(err => {
      console.error('Error in polling:', err);
      setError(`Polling error: ${err.message}`);
    });
  };
  
  const handleImportComplete = async (data) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Import complete with data:', data);
      console.log('Using token:', token);
      console.log('Selected schema ID:', selectedSchemaId);
      
      // Make sure token is valid
      if (!token) {
        throw new Error('Authentication token is missing. Please log in again.');
      }
      
      // The data should already be in the format we need:
      // { validData: [...], invalidData: [...] }
      // validData contains an array of row objects
      
      if (!data.validData || !Array.isArray(data.validData)) {
        throw new Error('Invalid data format: validData is missing or not an array');
      }
      
      // Ensure invalidData exists (even if empty)
      const formattedData = {
        validData: data.validData,
        invalidData: data.invalidData || [],
      };
      
      console.log('Formatted data for backend:', formattedData);
      console.log('Number of valid rows:', formattedData.validData.length);
      console.log('First row sample:', formattedData.validData[0]);
      
      // Process the data
      const result = await importApi.processCSVData(token, selectedSchemaId, formattedData);
      console.log('Import result:', result);
      setImportResult(result);
      setIsOpen(false);
      
      // Start polling for job status updates
      if (result.job_id) {
        console.log(`Starting polling for job ${result.job_id}`);
        startPolling(result.job_id);
      }
    } catch (err) {
      console.error('Import failed:', err);
      setError(`Failed to process import: ${err.message}`);
      
      // If unauthorized, prompt to log in again
      if (err.message.includes('401') || err.message.includes('Unauthorized')) {
        handleLogout();
        setError('Your session has expired. Please log in again.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handler for test import with sample data
  const handleTestImport = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Generate test data
      const testData = generateTestData();
      console.log('Using test data:', testData);
      
      // Make sure token is valid
      if (!token) {
        throw new Error('Authentication token is missing. Please log in again.');
      }
      
      // Process the test data - transform it to the format expected by the backend
      // Extract valid data (rows that passed validation)
      const validData = [];
      if (testData.validData && Array.isArray(testData.validData)) {
        // Process each valid row
        testData.validData.forEach(row => {
          const processedRow = {};
          // Extract actual values from each field
          Object.keys(row).forEach(fieldName => {
            if (row[fieldName] && row[fieldName].value !== undefined) {
              // Field is in format: { value: 'value', errors: [] }
              processedRow[fieldName] = row[fieldName].value;
            } else {
              // Field might be a direct value
              processedRow[fieldName] = row[fieldName];
            }
          });
          validData.push(processedRow);
        });
      }
      
      // Format the data for the backend
      const formattedData = {
        validData,
        invalidData: []
      };
      
      console.log('Formatted test data for backend:', formattedData);
      
      // Process the data
      const result = await importApi.processCSVData(token, selectedSchemaId, formattedData);
      console.log('Test import result:', result);
      setImportResult(result);
      
      // Start polling for job status updates
      if (result.job_id) {
        console.log(`Starting polling for job ${result.job_id}`);
        startPolling(result.job_id);
      }
    } catch (err) {
      console.error('Test import failed:', err);
      setError(`Failed to process test import: ${err.message}`);
      
      // If unauthorized, prompt to log in again
      if (err.message.includes('401') || err.message.includes('Unauthorized')) {
        handleLogout();
        setError('Your session has expired. Please log in again.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // If not logged in, show login form
  if (!isLoggedIn) {
    return (
      <div className="App">
        <div className="login-container">
          <h2>ImportCSV Login</h2>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email:</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Password:</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          <p className="login-hint">Default: admin@example.com / admin123</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="App">
      <header className="app-header">
        <h1>ImportCSV Demo</h1>
        <div className="user-info">
          {user && <span>Welcome, {user.email}</span>}
          <button onClick={handleLogout}>Logout</button>
          <button 
            className="button test-button"
            onClick={() => setTestMode(true)}
          >
            Switch to Test Mode
          </button>
        </div>
      </header>
      
      {error && <div className="error-message">{error}</div>}
      {isLoading && <div className="loading">Loading...</div>}
      
      <div className="main-content">
        <div className="schema-selector">
          <label>Select Schema: </label>
          <select 
            value={selectedSchemaId || ''} 
            onChange={(e) => setSelectedSchemaId(Number(e.target.value))}
            disabled={schemas.length === 0}
          >
            <option value="">Select a schema</option>
            {schemas.map(schema => (
              <option key={schema.id} value={schema.id}>{schema.name}</option>
            ))}
          </select>
          
          <button 
            className="button" 
            onClick={() => setIsOpen(true)}
            disabled={!selectedSchemaId}
          >
            Import CSV
          </button>
          
          <button 
            className="button test-button" 
            onClick={handleTestImport}
            disabled={!selectedSchemaId}
          >
            Test with Sample Data
          </button>
        </div>
        
        {importResult && (
          <div className={`import-result ${importResult.status.toLowerCase()}`}>
            <h3>
              {importResult.status === 'PROCESSING' && 'Import Job Processing...'}
              {importResult.status === 'COMPLETED' && 'Import Job Completed'}
              {importResult.status === 'FAILED' && 'Import Job Failed'}
              {!['PROCESSING', 'COMPLETED', 'FAILED'].includes(importResult.status) && `Import Job (${importResult.status})`}
            </h3>
            
            <div className="import-details">
              <div className="detail-row">
                <span className="detail-label">Job ID:</span>
                <span className="detail-value">{importResult.job_id}</span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Status:</span>
                <span className="detail-value status-badge">{importResult.status}</span>
                {importResult.status === 'PROCESSING' && (
                  <span className="loading-spinner"></span>
                )}
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Progress:</span>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar" 
                    style={{
                      width: `${importResult.processed_rows && importResult.total_rows ? 
                        Math.round((importResult.processed_rows / importResult.total_rows) * 100) : 0}%`
                    }}
                  ></div>
                </div>
                <span className="progress-text">
                  {importResult.processed_rows || 0} / {importResult.total_rows || 0} rows
                </span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Data Quality:</span>
                <div className="data-quality">
                  <div className="quality-bar">
                    <div 
                      className="valid-bar" 
                      style={{
                        width: `${importResult.total_rows ? 
                          Math.round((importResult.valid_rows / importResult.total_rows) * 100) : 0}%`
                      }}
                    ></div>
                  </div>
                  <div className="quality-stats">
                    <span className="valid-count">{importResult.valid_rows || 0} valid</span>
                    <span className="invalid-count">{importResult.invalid_rows || 0} invalid</span>
                  </div>
                </div>
              </div>
              
              {importResult.completed_at && (
                <div className="detail-row">
                  <span className="detail-label">Completed:</span>
                  <span className="detail-value">
                    {new Date(importResult.completed_at).toLocaleString()}
                  </span>
                </div>
              )}
              
              {importResult.errors && (
                <div className="detail-row errors">
                  <span className="detail-label">Errors:</span>
                  <ul className="error-list">
                    {importResult.errors.errors ? (
                      // New format: {errors: ["error1", "error2"]}
                      importResult.errors.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))
                    ) : (
                      // For backward compatibility
                      <li>{JSON.stringify(importResult.errors)}</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
            
            {importResult.status === 'COMPLETED' && (
              <div className="success-message">
                <p>Your data has been successfully imported and processed!</p>
                <button 
                  className="button" 
                  onClick={() => setImportResult(null)}
                >
                  Start New Import
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {schemaTemplate && (
        <CSVImporter
          isModal={true}
          modalIsOpen={isOpen}
          darkMode={true}
          template={schemaTemplate.template}
          modalOnCloseTriggered={() => {
            console.log('Modal close triggered');
            setIsOpen(false);
          }}
          modalCloseOnOutsideClick={true}
          onComplete={(data) => {
            console.log('CSV import complete callback triggered with data:', data);
            // Check if data is empty or undefined
            if (!data) {
              console.error('CSV importer returned empty data');
              setError('CSV importer returned empty data. Please try again.');
              return;
            }
            
            // The CSV importer returns data in this format:
            // { num_rows, num_columns, error, columns, rows }
            // We need to transform it to the format our backend expects
            
            // Log the data structure
            console.log('CSV importer data structure:', Object.keys(data));
            
            if (data.rows && Array.isArray(data.rows)) {
              console.log(`Processing ${data.rows.length} rows of data`);
              
              // Transform the data to the format our backend expects
              const transformedData = {
                validData: data.rows,
                invalidData: []
              };
              
              // Log the transformed data
              console.log('Transformed data for backend:', transformedData);
              
              // Call the handler function with the transformed data
              handleImportComplete(transformedData);
            } else {
              console.error('CSV importer returned no rows:', data);
              setError('CSV importer returned no rows. Please try again.');
            }
          }}
          uploadConfig={{
            accept: '.csv',
            multiple: false
          }}
          onClose={() => {
            console.log('CSV importer closed');
            setIsOpen(false);
          }}
          // Remove unsupported props that cause React warnings
        />
      )}
    </div>
  );
}

export default App;
