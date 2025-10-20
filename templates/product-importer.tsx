/**
 * Product Catalog Importer Template
 *
 * A production-ready CSV importer for product catalog data with price validation,
 * SKU formatting, and category management.
 *
 * Features:
 * - Type-safe with Zod schema
 * - Price and cost validation (price > cost)
 * - SKU normalization (uppercase)
 * - Category enumeration
 * - Quantity validation (non-negative)
 *
 * Sample CSV: templates/sample-data/products.csv
 */

'use client'; // Remove if not using Next.js App Router

import { CSVImporter } from '@importcsv/react';
import { z } from 'zod';

/**
 * Product schema with comprehensive validation
 */
const productSchema = z.object({
  sku: z.string()
    .min(3, 'SKU must be at least 3 characters')
    .max(20, 'SKU must be at most 20 characters')
    .transform(s => s.toUpperCase()), // Normalize SKU to uppercase
  name: z.string().min(1, 'Product name is required'),
  description: z.string()
    .max(500, 'Description must be at most 500 characters')
    .optional(),
  price: z.number()
    .positive('Price must be positive'),
  cost: z.number()
    .positive('Cost must be positive'),
  quantity: z.number()
    .int('Quantity must be a whole number')
    .nonnegative('Quantity cannot be negative'),
  category: z.enum(['electronics', 'clothing', 'home', 'books', 'toys', 'sports'], {
    errorMap: () => ({ message: 'Category must be one of: electronics, clothing, home, books, toys, sports' })
  }),
  isActive: z.boolean().default(true),
  weight: z.number()
    .positive('Weight must be positive')
    .optional(),
  dimensions: z.string().optional(), // e.g., "10x8x5"
  brand: z.string().optional()
}).refine(
  (data) => data.price > data.cost,
  {
    message: 'Price must be greater than cost',
    path: ['price']
  }
);

/**
 * Infer TypeScript type from schema
 */
export type Product = z.infer<typeof productSchema>;

/**
 * Product Importer Component
 *
 * Usage:
 * ```tsx
 * import { ProductImporter } from './templates/product-importer';
 *
 * <ProductImporter
 *   onComplete={(products) => {
 *     console.log('Imported products:', products);
 *   }}
 * />
 * ```
 */
interface ProductImporterProps {
  onComplete: (products: Product[]) => void | Promise<void>;
  isOpen?: boolean;
  onClose?: () => void;
}

export function ProductImporter({
  onComplete,
  isOpen = false,
  onClose
}: ProductImporterProps) {
  return (
    <CSVImporter
      modalIsOpen={isOpen}
      modalOnCloseTriggered={onClose}
      // ⚠️ WARNING: schema prop is not yet implemented (coming in Phase 1)
      // For production use, convert this schema to columns array format
      schema={productSchema}
      onComplete={onComplete}
      theme="professional"
      primaryColor="#16a34a"
    />
  );
}

/**
 * Example usage with API integration
 */
export function ProductImportPage() {
  const handleComplete = async (products: Product[]) => {
    try {
      const response = await fetch('/api/products/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Successfully imported ${products.length} products`);
      } else {
        const error = await response.json();
        alert(`Import failed: ${error.message}`);
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Import failed');
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Import Product Catalog</h1>
      <ProductImporter onComplete={handleComplete} />
    </div>
  );
}

/**
 * Sample CSV data
 *
 * Save as: templates/sample-data/products.csv
 *
sku,name,description,price,cost,quantity,category,isActive,weight,dimensions,brand
LAPTOP-001,MacBook Pro 16",High-performance laptop for professionals,2499.99,1800.00,50,electronics,true,4.3,14x9.8x0.66,Apple
TSHIRT-BLU-M,Blue Cotton T-Shirt,Comfortable cotton t-shirt in blue,29.99,12.00,200,clothing,true,0.5,,,
DESK-LAMP-LED,LED Desk Lamp,Adjustable LED desk lamp with USB charging,49.99,25.00,75,home,true,2.1,18x8x8,
BOOK-PROG-101,Programming 101,Introduction to programming for beginners,39.99,15.00,100,books,true,1.2,9x6x1.5,TechBooks
TOY-ROBOT-AI,AI Robot Toy,Interactive AI-powered robot toy for kids,89.99,45.00,30,toys,true,3.5,12x10x8,RoboTech
YOGA-MAT-PRO,Professional Yoga Mat,Premium non-slip yoga mat,59.99,28.00,120,sports,true,5.0,72x24x0.25,YogaPro
 */
