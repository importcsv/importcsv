import { useState } from 'react';
import { CSVImporter } from '../../src';
import { z } from 'zod';

/**
 * Zod Schema Example
 *
 * Demonstrates type-safe CSV validation using Zod schemas
 * with automatic TypeScript inference.
 */

// Product schema with comprehensive validation
const productSchema = z.object({
  sku: z.string()
    .min(3, 'SKU must be at least 3 characters')
    .max(20, 'SKU must be at most 20 characters')
    .transform(s => s.toUpperCase()),
  name: z.string().min(1, 'Product name is required'),
  price: z.number().positive('Price must be positive'),
  cost: z.number().positive('Cost must be positive'),
  quantity: z.number()
    .int('Quantity must be a whole number')
    .nonnegative('Quantity cannot be negative'),
  category: z.enum(['electronics', 'clothing', 'home', 'books'], {
    errorMap: () => ({ message: 'Category must be: electronics, clothing, home, or books' })
  }),
  inStock: z.boolean().default(true)
}).refine(
  (data) => data.price > data.cost,
  { message: 'Price must be greater than cost', path: ['price'] }
);

// Automatic TypeScript type inference! ✨
type Product = z.infer<typeof productSchema>;

export default function ZodSchemaExample() {
  const [data, setData] = useState<Product[] | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const sampleCSV = `sku,name,price,cost,quantity,category,inStock
laptop-001,MacBook Pro 16",2499.99,1800.00,50,electronics,true
tshirt-blu-m,Blue Cotton T-Shirt,29.99,12.00,200,clothing,true
desk-lamp-led,LED Desk Lamp,49.99,25.00,75,home,true
book-prog-101,Programming 101,39.99,15.00,100,books,true`;

  const downloadSampleCSV = () => {
    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-products.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleComplete = (importedData: Product[]) => {
    setData(importedData);
    setIsOpen(false);

    // Calculate statistics
    const totalValue = importedData.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const totalCost = importedData.reduce((sum, p) => sum + (p.cost * p.quantity), 0);
    const profit = totalValue - totalCost;

    console.log('Import Statistics:');
    console.log(`Total Products: ${importedData.length}`);
    console.log(`Total Inventory Value: $${totalValue.toFixed(2)}`);
    console.log(`Total Cost: $${totalCost.toFixed(2)}`);
    console.log(`Potential Profit: $${profit.toFixed(2)}`);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            🛡️ Zod Schema Example
          </h2>
          <p className="text-gray-600">
            Type-safe CSV validation with automatic TypeScript inference
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 text-lg">Benefits of Zod</h3>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Automatic Type Inference</h4>
                <p className="text-gray-600 text-sm">No manual type definitions needed</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Runtime + Compile-time</h4>
                <p className="text-gray-600 text-sm">Validation at both levels</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Better Error Messages</h4>
                <p className="text-gray-600 text-sm">Clear, actionable validation errors</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Schema Definition</h3>
            <pre className="text-xs text-gray-700 overflow-x-auto">
{`const productSchema = z.object({
  sku: z.string()
    .transform(s => s.toUpperCase()),
  name: z.string().min(1),
  price: z.number().positive(),
  cost: z.number().positive(),
  quantity: z.number().int(),
  category: z.enum([...]),
  inStock: z.boolean()
}).refine(
  (data) => data.price > data.cost,
  'Price must be > cost'
);

// Automatic type inference!
type Product = z.infer<typeof productSchema>;`}
            </pre>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setIsOpen(true)}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
          >
            Import Products with Zod
          </button>
          <button
            onClick={downloadSampleCSV}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            Download Sample CSV
          </button>
        </div>
      </div>

      {/* Imported Data Display */}
      {data && data.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">
              Imported Products ({data.length})
            </h3>
            <div className="text-sm text-gray-600">
              Total Value: ${data.reduce((sum, p) => sum + (p.price * p.quantity), 0).toFixed(2)}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Margin</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((product, i) => {
                  const margin = ((product.price - product.cost) / product.price * 100).toFixed(1);
                  return (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono text-gray-900">{product.sku}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{product.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">${product.price.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">${product.cost.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{product.quantity}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {product.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-green-600 font-semibold">{margin}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CSV Importer Modal - Using columns (schema support coming in Phase 1) */}
      <CSVImporter
        modalIsOpen={isOpen}
        modalOnCloseTriggered={() => setIsOpen(false)}
        columns={[
          { id: 'sku', label: 'SKU', type: 'string', validators: [{ type: 'required' }] },
          { id: 'name', label: 'Product Name', type: 'string', validators: [{ type: 'required' }] },
          { id: 'description', label: 'Description', type: 'string' },
          { id: 'price', label: 'Price', type: 'number', validators: [{ type: 'required' }] },
          { id: 'cost', label: 'Cost', type: 'number', validators: [{ type: 'required' }] },
          { id: 'quantity', label: 'Quantity', type: 'number', validators: [{ type: 'required' }] },
          { id: 'category', label: 'Category', type: 'select', options: ['electronics', 'clothing', 'home', 'books', 'toys', 'sports'], validators: [{ type: 'required' }] },
          { id: 'isActive', label: 'Active', type: 'string' },
          { id: 'weight', label: 'Weight (lbs)', type: 'number' },
          { id: 'dimensions', label: 'Dimensions', type: 'string' },
          { id: 'brand', label: 'Brand', type: 'string' }
        ]}
        onComplete={handleComplete}
        theme="professional"
        primaryColor="#16a34a"
      />
    </div>
  );
}
