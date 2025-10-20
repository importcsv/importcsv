import React, { useState } from 'react'
import ValidationExample from './examples/ValidationExample'
import LargeFileExample from './examples/LargeFileExample'
import DarkModeExample from './examples/DarkModeExample'
import HeadlessExample from './examples/HeadlessExample'
import ZodSchemaExample from './examples/ZodSchemaExample'

type ExampleType = 'validation' | 'large-file' | 'dark-mode' | 'headless' | 'zod-schema' | null

const App: React.FC = () => {
  const [activeExample, setActiveExample] = useState<ExampleType>(null)

  const examples = [
    {
      id: 'headless' as ExampleType,
      name: 'Headless Components',
      description: 'Build custom CSV importers with unstyled primitives',
      icon: '🎨',
      color: 'from-indigo-500 to-indigo-600',
      badge: 'New'
    },
    {
      id: 'zod-schema' as ExampleType,
      name: 'Zod Schema Validation',
      description: 'Type-safe validation with automatic TypeScript inference',
      icon: '🛡️',
      color: 'from-emerald-500 to-emerald-600',
      badge: 'New'
    },
    {
      id: 'validation' as ExampleType,
      name: 'Validation & Transformation',
      description: 'Test data validation rules and automatic transformations',
      icon: '✅',
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'large-file' as ExampleType,
      name: 'Large Dataset Performance',
      description: 'Test performance with 10k-100k rows using virtual scrolling',
      icon: '🚀',
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'dark-mode' as ExampleType,
      name: 'Theme & Dark Mode',
      description: 'Explore different visual themes including dark mode',
      icon: '🌙',
      color: 'from-purple-500 to-purple-600'
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
          
          {activeExample === 'headless' && <HeadlessExample />}
          {activeExample === 'zod-schema' && <ZodSchemaExample />}
          {activeExample === 'validation' && <ValidationExample />}
          {activeExample === 'large-file' && <LargeFileExample />}
          {activeExample === 'dark-mode' && <DarkModeExample />}
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

        <div className="grid md:grid-cols-3 gap-6">
          {examples.map(example => (
            <div
              key={example.id}
              className="group cursor-pointer transform transition-all duration-200 hover:scale-105"
              onClick={() => setActiveExample(example.id)}
            >
              <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow">
                <div className={`h-2 bg-gradient-to-r ${example.color}`}></div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-4xl">{example.icon}</div>
                    {example.badge && (
                      <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                        {example.badge}
                      </span>
                    )}
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