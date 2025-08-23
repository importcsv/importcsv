import React, { useState } from 'react'
import EmployeeImport from './examples/EmployeeImport'
import ProductCatalog from './examples/ProductCatalog'
import CustomerData from './examples/CustomerData'
import EventRegistration from './examples/EventRegistration'
import FinancialTransactions from './examples/FinancialTransactions'
import ValidationTester from './examples/ValidationTester'
import EmployeeImportWithTransformations from './examples/EmployeeImportWithTransformations'
import ProductCatalogWithTransformations from './examples/ProductCatalogWithTransformations'
import LargeDatasetTest from './examples/LargeDatasetTest'
import ThemeShowcase from './examples/ThemeShowcase'
import './styles.css'

type ExampleType = 'employee' | 'product' | 'customer' | 'event' | 'financial' | 'tester' | 'employee-transform' | 'product-transform' | 'large-dataset' | 'theme-showcase' | null

const App: React.FC = () => {
  const [activeExample, setActiveExample] = useState<ExampleType>(null)

  const examples = [
    { id: 'employee', name: 'Employee Import', description: 'Test required, unique, email, salary range validations' },
    { id: 'employee-transform', name: '🔄 Employee with Transformations', description: 'Auto-format messy data: trim, capitalize, normalize' },
    { id: 'product', name: 'Product Catalog', description: 'SKU patterns, price ranges, categories' },
    { id: 'product-transform', name: '🔄 Product with Transformations', description: 'Clean SKUs, prices, deduplicate tags' },
    { id: 'customer', name: 'Customer Data', description: 'Email, phone, postal code validations' },
    { id: 'event', name: 'Event Registration', description: 'Date validation, capacity limits, text length' },
    { id: 'financial', name: 'Financial Transactions', description: 'Decimal amounts, account patterns, transaction types' },
    { id: 'tester', name: 'Validation Tester', description: 'Test individual validators with custom data' },
    { id: 'large-dataset', name: '🚀 Large Dataset Test', description: 'Test performance with 10k-100k rows using virtual scrolling' },
    { id: 'theme-showcase', name: '🎨 Theme Showcase', description: 'Test different pre-built themes and customization options' }
  ]

  if (activeExample) {
    return (
      <div className="container">
        <div className="header">
          <button 
            onClick={() => setActiveExample(null)}
            className="back-btn"
          >
            ← Back to Examples
          </button>
          <h1 className="title">ImportCSV React - Validation Examples</h1>
        </div>
        
        {activeExample === 'employee' && <EmployeeImport />}
        {activeExample === 'employee-transform' && <EmployeeImportWithTransformations />}
        {activeExample === 'product' && <ProductCatalog />}
        {activeExample === 'product-transform' && <ProductCatalogWithTransformations />}
        {activeExample === 'customer' && <CustomerData />}
        {activeExample === 'event' && <EventRegistration />}
        {activeExample === 'financial' && <FinancialTransactions />}
        {activeExample === 'tester' && <ValidationTester />}
        {activeExample === 'large-dataset' && <LargeDatasetTest />}
        {activeExample === 'theme-showcase' && <ThemeShowcase />}
      </div>
    )
  }

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">ImportCSV React - Validation Test Suite</h1>
        <p className="subtitle">
          Comprehensive examples to test all validation types and edge cases
        </p>
      </div>

      <div className="examples-grid">
        {examples.map(example => (
          <div 
            key={example.id}
            className="example-card"
            onClick={() => setActiveExample(example.id as ExampleType)}
          >
            <h3 className="example-title">{example.name}</h3>
            <p className="example-description">{example.description}</p>
            <button className="example-button">Open Example →</button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App