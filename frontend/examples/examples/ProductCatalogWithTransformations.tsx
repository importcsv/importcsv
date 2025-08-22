import { useState } from 'react';
import { CSVImporter } from '@importcsv/react';
import type { Column } from '@importcsv/react';

export default function ProductCatalogWithTransformations() {
  const [data, setData] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Product catalog columns with transformations for e-commerce
  const columns: Column[] = [
    {
      id: 'sku',
      label: 'SKU',
      type: 'string',
      validators: [
        { type: 'required' },
        { type: 'unique' },
        { type: 'regex', pattern: '^[A-Z]{3}-\\d{4}$', message: 'SKU must match pattern XXX-9999' }
      ],
      transformations: [
        { type: 'trim' },
        { type: 'uppercase' },
        { type: 'replace', find: ' ', replace: '-' }  // Replace spaces with dashes
      ]
    },
    {
      id: 'product_name',
      label: 'Product Name',
      type: 'string',
      validators: [
        { type: 'required' },
        { type: 'min_length', value: 3 },
        { type: 'max_length', value: 200 }
      ],
      transformations: [
        { type: 'trim' },
        { type: 'capitalize' }
      ]
    },
    {
      id: 'category',
      label: 'Category',
      type: 'select',
      options: ['Electronics', 'Clothing', 'Home & Garden', 'Sports', 'Books', 'Toys'],
      validators: [
        { type: 'required' }
      ],
      transformations: [
        { type: 'capitalize' },
        { type: 'replace', find: '&', replace: '&' }  // Normalize ampersands
      ]
    },
    {
      id: 'price',
      label: 'Price',
      type: 'number',
      validators: [
        { type: 'required' },
        { type: 'min', value: 0.01, message: 'Price must be greater than 0' },
        { type: 'max', value: 99999.99, message: 'Price cannot exceed $99,999.99' }
      ],
      transformations: [
        { type: 'trim' },
        { type: 'remove_special_chars' },  // Remove $, commas, etc.
        { type: 'custom', fn: (value: any) => {
          // Ensure 2 decimal places
          const num = parseFloat(String(value).replace(/[^0-9.]/g, ''));
          return isNaN(num) ? '0.00' : num.toFixed(2);
        }}
      ]
    },
    {
      id: 'stock_quantity',
      label: 'Stock Quantity',
      type: 'number',
      validators: [
        { type: 'required' },
        { type: 'min', value: 0, message: 'Stock cannot be negative' }
      ],
      transformations: [
        { type: 'trim' },
        { type: 'default', value: '0' },
        { type: 'custom', fn: (value: any) => {
          // Round to nearest integer
          const num = parseInt(String(value).replace(/[^0-9]/g, ''));
          return isNaN(num) ? '0' : String(num);
        }}
      ]
    },
    {
      id: 'brand',
      label: 'Brand',
      type: 'string',
      validators: [],
      transformations: [
        { type: 'trim' },
        { type: 'uppercase' },
        { type: 'default', value: 'GENERIC' }
      ]
    },
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: ['active', 'inactive', 'discontinued'],
      validators: [
        { type: 'required' }
      ],
      transformations: [
        { type: 'lowercase' },
        { type: 'default', value: 'active' }
      ]
    },
    {
      id: 'tags',
      label: 'Tags',
      type: 'string',
      validators: [],
      transformations: [
        { type: 'trim' },
        { type: 'lowercase' },
        { type: 'replace', find: ';', replace: ',' },  // Standardize separators
        { type: 'custom', fn: (value: any) => {
          // Clean up tags: remove duplicates, sort alphabetically
          if (!value) return '';
          const tags = String(value).split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);
          const uniqueTags = [...new Set(tags)].sort();
          return uniqueTags.join(', ');
        }}
      ]
    }
  ];

  // Generate messy product catalog CSV
  const generateMessyCSV = () => {
    const csvContent = `SKU,Product Name,Category,Price,Stock Quantity,Brand,Status,Tags
  wdg 1001  ,  wireless mouse  ,electronics,$29.99,  150  ,logitech,ACTIVE,wireless; usb; computer
TKB-2002,MECHANICAL KEYBOARD,Electronics,$89.00,75 units,  CORSAIR  ,Active,gaming;RGB;mechanical;usb
mon 3003,ultra-wide monitor,ELECTRONICS,$$$449.99,25,LG,active,monitor, display, 4K, ultrawide
HDR-4004,Noise Cancelling Headphones,electronics,199,50.5,sony,Active,audio; wireless; noise-cancelling; bluetooth
  spk 5005,bluetooth speaker,Electronics,  $79.00  ,100,JBL,,portable;wireless;waterproof;bluetooth;audio
CAM-6006,Webcam HD,electronics,59.99,200,,inactive,video, streaming, HD, USB
chg 7007,USB-C Charger,ELECTRONICS,$19.99,500 pieces,anker,ACTIVE,charger, usb-c, fast charging, usb-c
CBL-8008,HDMI Cable 6ft,Electronics,$12.50,1000,amazonbasics,Active,cable;hdmi;video;4k;hdmi`;

    return csvContent;
  };

  const downloadCSV = () => {
    const csvContent = generateMessyCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_catalog_messy.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleComplete = (importedData: any) => {
    console.log('Transformed product data:', importedData);

    // Handle both data structures
    let processedData;
    if (importedData.data) {
      processedData = {
        rows: importedData.data.map((row: any) => ({
          values: row
        }))
      };
    } else if (importedData.rows) {
      processedData = importedData;
    }

    setData(processedData);
    setIsOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Product Catalog Import with Transformations</h2>

        <div className="mb-4 p-4 bg-purple-50 rounded">
          <h3 className="font-semibold mb-2">E-commerce Transformations:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm">
            <li><strong>SKU:</strong> Uppercase, replace spaces with dashes</li>
            <li><strong>Product Name:</strong> Proper capitalization</li>
            <li><strong>Price:</strong> Remove currency symbols, ensure 2 decimals</li>
            <li><strong>Stock:</strong> Round to integer, default to 0</li>
            <li><strong>Brand:</strong> Uppercase, default to "GENERIC"</li>
            <li><strong>Tags:</strong> Lowercase, deduplicate, sort alphabetically</li>
          </ul>
        </div>

        <div className="mb-4 p-3 bg-yellow-50 rounded text-sm">
          <strong>Test data includes common issues:</strong>
          <ul className="list-disc list-inside mt-1">
            <li>Inconsistent SKU formats: "wdg 1001", "TKB-2002"</li>
            <li>Mixed case: "MECHANICAL KEYBOARD", "wireless mouse"</li>
            <li>Price variations: "$29.99", "$$$449.99", "199"</li>
            <li>Stock with units: "75 units", "500 pieces"</li>
            <li>Tag separators: semicolons and commas mixed</li>
            <li>Duplicate tags that need deduplication</li>
          </ul>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={downloadCSV}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Download Messy Product CSV
          </button>
          <button
            onClick={() => setIsOpen(true)}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Open Importer
          </button>
        </div>
      </div>

      {isOpen && (
        <CSVImporter
          columns={columns}
          onComplete={handleComplete}
          isModal={true}
          modalIsOpen={isOpen}
          modalOnCloseTriggered={() => setIsOpen(false)}
          modalCloseOnOutsideClick={true}
        />
      )}

      {data && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Transformed Product Data:</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {data.rows[0]?.values.map((header: string, idx: number) => (
                    <th key={idx} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.rows.slice(1).map((row: any, rowIdx: number) => (
                  <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {row.values.map((cell: string, cellIdx: number) => {
                      // Highlight transformed cells
                      const isTransformed = cellIdx === 0 || // SKU
                                          cellIdx === 3 || // Price
                                          cellIdx === 5 || // Brand
                                          cellIdx === 7;   // Tags
                      return (
                        <td
                          key={cellIdx}
                          className={`px-3 py-2 text-sm ${isTransformed ? 'font-semibold text-purple-700' : 'text-gray-900'}`}
                        >
                          {cell}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-3 bg-green-50 rounded">
            <strong>Transformations Applied:</strong>
            <ul className="list-disc list-inside text-sm mt-1">
              <li>SKUs: Standardized to uppercase with dashes (WDG-1001, TKB-2002...)</li>
              <li>Product Names: Properly capitalized</li>
              <li>Prices: Cleaned and formatted to 2 decimals ($29.99, $89.00...)</li>
              <li>Stock: Converted to integers (150, 75, 25...)</li>
              <li>Brands: All uppercase, empty → "GENERIC"</li>
              <li>Status: Lowercase (active, inactive...)</li>
              <li>Tags: Deduplicated, sorted, and standardized</li>
            </ul>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded">
            <strong>Business Benefits:</strong>
            <ul className="list-disc list-inside text-sm mt-1">
              <li>Consistent SKU format for inventory management</li>
              <li>Standardized pricing for accurate calculations</li>
              <li>Clean tags for better search and filtering</li>
              <li>Predictable data format for downstream systems</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}