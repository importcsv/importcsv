import React, { useState } from 'react'
import BasicExample from './examples/BasicExample'
import AdvancedExample from './examples/AdvancedExample'
import LargeFileExample from './examples/LargeFileExample'
import CustomizationExample from './examples/CustomizationExample'
import DynamicColumnsExample from './examples/DynamicColumnsExample'

type ExampleType = 'basic' | 'advanced' | 'large-file' | 'customization' | 'dynamic-columns' | null

const App: React.FC = () => {
  const [activeExample, setActiveExample] = useState<ExampleType>(null)

  const examples = [
    {
      id: 'basic' as ExampleType,
      name: 'Getting Started',
      description: 'Simple example to get up and running in 2 minutes',
      icon: '🚀',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'advanced' as ExampleType,
      name: 'Validation & Transformations',
      description: 'Comprehensive validation rules and data transformations',
      icon: '✨',
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'large-file' as ExampleType,
      name: 'Large Datasets',
      description: 'Performance testing with 10k-100k rows',
      icon: '⚡',
      color: 'from-orange-500 to-orange-600'
    },
    {
      id: 'customization' as ExampleType,
      name: 'Themes & Styling',
      description: 'Customize colors, themes, and dark mode',
      icon: '🎨',
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'dynamic-columns' as ExampleType,
      name: 'Dynamic Columns',
      description: 'Customer-specific fields passed at runtime',
      icon: '🔀',
      color: 'from-pink-500 to-pink-600'
    }
  ]

  if (activeExample) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <button 
              onClick={() => setActiveExample(null)}
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Examples
            </button>
          </div>
          
          {activeExample === 'basic' && <BasicExample />}
          {activeExample === 'advanced' && <AdvancedExample />}
          {activeExample === 'large-file' && <LargeFileExample />}
          {activeExample === 'customization' && <CustomizationExample />}
          {activeExample === 'dynamic-columns' && <DynamicColumnsExample />}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            ImportCSV React Examples
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Explore the key features of ImportCSV with these interactive examples
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {examples.map(example => (
            <div
              key={example.id}
              className="group cursor-pointer transform transition-all duration-200 hover:scale-105"
              onClick={() => setActiveExample(example.id)}
            >
              <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow">
                <div className={`h-2 bg-gradient-to-r ${example.color}`}></div>
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="text-4xl">{example.icon}</div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {example.name}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {example.description}
                  </p>
                  <div className="flex items-center text-blue-600 font-medium group-hover:text-blue-700">
                    <span>Open Example</span>
                    <svg className="ml-2 h-4 w-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-lg">
            <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-blue-800">
              Each example includes sample CSV files you can download to test the features
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App