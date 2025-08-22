import React, { useState } from 'react'
import { CSVImporter } from '@importcsv/react'
import type { Column } from '@importcsv/react'

type TestDataType = 'valid' | 'errors' | 'edge-cases'

const ProductCatalog: React.FC = () => {
  const [importedData, setImportedData] = useState<any[]>([])
  const [showImporter, setShowImporter] = useState(false)
  const [testDataType, setTestDataType] = useState<TestDataType>('valid')

  const columns: Column[] = [
    {
      id: 'sku',
      label: 'SKU',
      type: 'string',
      validators: [
        { type: 'required', message: 'SKU is required' },
        { type: 'unique', message: 'SKU must be unique' },
        { type: 'regex', pattern: '^[A-Z]{3}-\\d{4}-[A-Z]{2}$', message: 'Format: XXX-9999-XX (e.g., PRD-1234-AB)' }
      ],
      description: 'Product SKU (XXX-9999-XX)'
    },
    {
      id: 'product_name',
      label: 'Product Name',
      type: 'string',
      validators: [
        { type: 'required' },
        { type: 'min_length', value: 3, message: 'Product name must be at least 3 characters' },
        { type: 'max_length', value: 200, message: 'Product name cannot exceed 200 characters' }
      ]
    },
    {
      id: 'category',
      label: 'Category',
      type: 'select',
      options: ['Electronics', 'Clothing', 'Food', 'Books', 'Home & Garden', 'Sports', 'Toys'],
      validators: [
        { type: 'required', message: 'Category is required' }
      ]
    },
    {
      id: 'price',
      label: 'Price (USD)',
      type: 'number',
      validators: [
        { type: 'required' },
        { type: 'min', value: 0.01, message: 'Price must be at least $0.01' },
        { type: 'max', value: 99999.99, message: 'Price cannot exceed $99,999.99' }
      ],
      description: 'Product price in USD'
    },
    {
      id: 'cost',
      label: 'Cost (USD)',
      type: 'number',
      validators: [
        { type: 'min', value: 0, message: 'Cost cannot be negative' },
        { type: 'max', value: 99999.99, message: 'Cost cannot exceed $99,999.99' }
      ],
      description: 'Product cost (optional)'
    },
    {
      id: 'stock_quantity',
      label: 'Stock Quantity',
      type: 'number',
      validators: [
        { type: 'required' },
        { type: 'min', value: 0, message: 'Stock cannot be negative' },
        { type: 'max', value: 1000000, message: 'Stock cannot exceed 1,000,000' }
      ]
    },
    {
      id: 'barcode',
      label: 'Barcode',
      type: 'string',
      validators: [
        { type: 'regex', pattern: '^\\d{8,13}$', message: 'Barcode must be 8-13 digits' },
        { type: 'unique', message: 'Barcode must be unique' }
      ],
      description: 'EAN-8 or EAN-13 barcode'
    },
    {
      id: 'supplier_code',
      label: 'Supplier Code',
      type: 'string',
      validators: [
        { type: 'regex', pattern: '^SUP-[A-Z]{2}-\\d{4}$', message: 'Format: SUP-XX-9999' }
      ],
      description: 'Supplier identifier'
    },
    {
      id: 'is_active',
      label: 'Active',
      type: 'select',
      options: ['Yes', 'No'],
      validators: [
        { type: 'required' }
      ]
    }
  ]

  const generateTestCSV = (type: TestDataType): string => {
    const headers = columns.map(col => col.label).join(',')
    
    let rows: string[] = []
    
    switch (type) {
      case 'valid':
        rows = [
          'PRD-1001-AB,Wireless Mouse,Electronics,29.99,15.00,150,12345678,SUP-US-1001,Yes',
          'CLO-2001-XY,Cotton T-Shirt,Clothing,19.99,8.50,300,87654321,SUP-CN-2001,Yes',
          'FOD-3001-ZZ,Organic Honey,Food,12.99,6.00,75,11223344,SUP-CA-3001,Yes',
          'BOK-4001-AA,Programming Guide,Books,39.99,20.00,50,99887766,SUP-UK-4001,Yes',
          'HOM-5001-BB,Garden Hose,Home & Garden,24.99,12.00,100,55443322,SUP-MX-5001,No'
        ]
        break
        
      case 'errors':
        rows = [
          // Invalid SKU format
          'PRODUCT-001,Invalid SKU Product,Electronics,29.99,15.00,150,12345678,SUP-US-1001,Yes',
          // Duplicate SKU
          'PRD-1001-AB,Duplicate SKU 1,Electronics,29.99,15.00,150,12345678,SUP-US-1001,Yes',
          'PRD-1001-AB,Duplicate SKU 2,Clothing,19.99,8.50,300,87654321,SUP-CN-2001,Yes',
          // Missing required fields
          ',No SKU Product,Food,12.99,6.00,75,11223344,SUP-CA-3001,Yes',
          'PRD-2001-CD,,Books,39.99,20.00,50,99887766,SUP-UK-4001,Yes',
          // Invalid category
          'PRD-3001-EF,Invalid Category,Furniture,24.99,12.00,100,55443322,SUP-MX-5001,No',
          // Negative price
          'PRD-4001-GH,Negative Price,Electronics,-10.00,15.00,150,12345678,SUP-US-1001,Yes',
          // Price exceeding maximum
          'PRD-5001-IJ,Expensive Product,Clothing,999999.99,8.50,300,87654321,SUP-CN-2001,Yes',
          // Negative stock
          'PRD-6001-KL,Negative Stock,Food,12.99,6.00,-50,11223344,SUP-CA-3001,Yes',
          // Invalid barcode format
          'PRD-7001-MN,Bad Barcode,Books,39.99,20.00,50,ABC123,SUP-UK-4001,Yes',
          // Duplicate barcode
          'PRD-8001-OP,Duplicate Barcode 1,Home & Garden,24.99,12.00,100,12345678,SUP-MX-5001,No',
          // Invalid supplier code
          'PRD-9001-QR,Bad Supplier,Electronics,29.99,15.00,150,98765432,SUPPLIER-001,Yes',
          // Product name too short
          'PRD-0001-ST,AB,Clothing,19.99,8.50,300,87654322,SUP-CN-2001,Yes'
        ]
        break
        
      case 'edge-cases':
        rows = [
          // Minimum valid values
          'ABC-0000-AA,Min,Electronics,0.01,0,0,10000000,,Yes',
          // Maximum valid values
          'ZZZ-9999-ZZ,' + 'A'.repeat(200) + ',Toys,99999.99,99999.99,1000000,9999999999999,SUP-ZZ-9999,No',
          // Decimal prices
          'PRD-1111-AA,Decimal Price Test,Books,19.99,9.99,100,12345678,SUP-US-1111,Yes',
          'PRD-2222-BB,Another Decimal,Sports,199.95,99.50,50,23456789,SUP-CA-2222,Yes',
          // Zero stock
          'PRD-3333-CC,Out of Stock,Electronics,49.99,25.00,0,34567890,SUP-UK-3333,No',
          // Maximum stock
          'PRD-4444-DD,Max Stock,Food,5.99,2.50,1000000,45678901,SUP-MX-4444,Yes',
          // Special characters in name
          'PRD-5555-EE,"Product with, comma",Clothing,29.99,15.00,100,56789012,SUP-CN-5555,Yes',
          'PRD-6666-FF,Product™ with © symbols,Home & Garden,39.99,20.00,75,67890123,SUP-US-6666,Yes',
          // Empty optional fields
          'PRD-7777-GG,No Cost or Barcode,Toys,15.99,,200,,SUP-CA-7777,Yes',
          // Boundary barcodes
          'PRD-8888-HH,EAN-8 Barcode,Books,24.99,12.00,150,12345678,SUP-UK-8888,Yes',
          'PRD-9999-II,EAN-13 Barcode,Sports,34.99,17.00,80,1234567890123,SUP-MX-9999,No'
        ]
        break
    }
    
    return [headers, ...rows].join('\n')
  }

  const downloadTestCSV = () => {
    const csvContent = generateTestCSV(testDataType)
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `products_${testDataType}.csv`
    link.click()
    window.URL.revokeObjectURL(url)
  }

  const handleImportComplete = (result: any) => {
    console.log('Product import completed:', result)
    const data = result.data || result
    setImportedData(data)
    setShowImporter(false)
  }

  return (
    <div>
      <div className="section">
        <h2 className="section-title">Product Catalog Import - SKU & Price Validation</h2>
        
        <div className="test-controls">
          <button 
            className={`test-btn ${testDataType === 'valid' ? 'active' : ''}`}
            onClick={() => setTestDataType('valid')}
          >
            Valid Products
          </button>
          <button 
            className={`test-btn ${testDataType === 'errors' ? 'active' : ''}`}
            onClick={() => setTestDataType('errors')}
          >
            Validation Errors
          </button>
          <button 
            className={`test-btn ${testDataType === 'edge-cases' ? 'active' : ''}`}
            onClick={() => setTestDataType('edge-cases')}
          >
            Edge Cases
          </button>
        </div>
        
        <p style={{ marginBottom: '1rem', color: '#6b7280' }}>
          {testDataType === 'valid' && 'Valid product data with proper SKUs, prices, and stock levels'}
          {testDataType === 'errors' && 'Products with various validation errors: invalid SKUs, negative prices, duplicate barcodes'}
          {testDataType === 'edge-cases' && 'Boundary values: minimum/maximum prices, special characters, empty optional fields'}
        </p>
        
        <button onClick={downloadTestCSV} className="download-btn">
          Download {testDataType === 'valid' ? 'Valid' : testDataType === 'errors' ? 'Error' : 'Edge Case'} Products CSV
        </button>

        <button 
          onClick={() => setShowImporter(true)} 
          className="download-btn"
          style={{ marginLeft: '1rem' }}
        >
          Open Importer
        </button>

        {showImporter && (
          <div style={{ marginTop: '1rem' }}>
            <CSVImporter
              columns={columns}
              onComplete={handleImportComplete}
              onCancel={() => setShowImporter(false)}
              modalIsOpen={showImporter}
              modalOnCloseTriggered={() => setShowImporter(false)}
              primaryColor="#10b981"
              darkMode={false}
            />
          </div>
        )}
      </div>

      {importedData.length > 0 && (
        <div className="section results">
          <h3 className="result-title">Imported Products</h3>
          
          <div className="stats" style={{ marginBottom: '1.5rem' }}>
            <div className="stat">
              <span className="stat-label">Total Products</span>
              <span className="stat-value">{importedData.length}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Categories</span>
              <span className="stat-value">
                {new Set(importedData.map(p => p.category)).size}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Total Stock</span>
              <span className="stat-value">
                {importedData.reduce((sum, p) => sum + (parseInt(p.stock_quantity) || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>
          
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Barcode</th>
                <th>Active</th>
              </tr>
            </thead>
            <tbody>
              {importedData.slice(0, 10).map((row, idx) => (
                <tr key={idx}>
                  <td>{row.sku}</td>
                  <td>{row.product_name}</td>
                  <td>{row.category}</td>
                  <td>${parseFloat(row.price || 0).toFixed(2)}</td>
                  <td>{row.stock_quantity}</td>
                  <td>{row.barcode || '-'}</td>
                  <td>{row.is_active}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="section">
        <h3 className="result-title">Validation Rules</h3>
        <ul style={{ color: '#374151', lineHeight: 1.8 }}>
          <li><strong>SKU:</strong> Required, Unique, Pattern: XXX-9999-XX</li>
          <li><strong>Product Name:</strong> Required, 3-200 characters</li>
          <li><strong>Category:</strong> Required, Must be from predefined list</li>
          <li><strong>Price:</strong> Required, $0.01 - $99,999.99</li>
          <li><strong>Cost:</strong> Optional, $0 - $99,999.99</li>
          <li><strong>Stock:</strong> Required, 0 - 1,000,000</li>
          <li><strong>Barcode:</strong> Optional, Unique, 8-13 digits (EAN format)</li>
          <li><strong>Supplier Code:</strong> Optional, Pattern: SUP-XX-9999</li>
        </ul>
      </div>
    </div>
  )
}

export default ProductCatalog