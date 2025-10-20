/**
 * Employee / HR Data Importer Template
 *
 * A production-ready CSV importer for employee/HR data with department validation,
 * salary ranges, and email normalization.
 *
 * Features:
 * - Type-safe with Zod schema
 * - Employee ID validation
 * - Email normalization (lowercase)
 * - Department enumeration
 * - Salary validation (minimum $30,000)
 * - Start date validation
 * - Optional manager and skills fields
 *
 * Sample CSV: templates/sample-data/employees.csv
 */

'use client'; // Remove if not using Next.js App Router

import { CSVImporter } from '@importcsv/react';
import { z } from 'zod';

/**
 * Employee schema with comprehensive validation
 */
const employeeSchema = z.object({
  employeeId: z.string()
    .min(1, 'Employee ID is required')
    .transform(id => id.toUpperCase()), // Normalize to uppercase
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string()
    .email('Invalid email address')
    .transform(e => e.toLowerCase()), // Normalize email
  department: z.enum([
    'engineering',
    'sales',
    'marketing',
    'hr',
    'finance',
    'operations',
    'customer_support'
  ], {
    errorMap: () => ({
      message: 'Department must be one of: engineering, sales, marketing, hr, finance, operations, customer_support'
    })
  }),
  position: z.string().min(1, 'Position/title is required'),
  startDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  salary: z.number()
    .int('Salary must be a whole number')
    .positive('Salary must be positive')
    .min(30000, 'Salary must be at least $30,000'),
  manager: z.string().optional(), // Manager's employee ID
  skills: z.string()
    .transform(s => s.split(',').map(skill => skill.trim()))
    .optional(), // Comma-separated skills
  isActive: z.boolean().default(true),
  location: z.string().optional()
});

/**
 * Infer TypeScript type from schema
 */
export type Employee = z.infer<typeof employeeSchema>;

/**
 * Employee Importer Component
 *
 * Usage:
 * ```tsx
 * import { EmployeeImporter } from './templates/employee-importer';
 *
 * <EmployeeImporter
 *   onComplete={(employees) => {
 *     console.log('Imported employees:', employees);
 *   }}
 * />
 * ```
 */
interface EmployeeImporterProps {
  onComplete: (employees: Employee[]) => void | Promise<void>;
  isOpen?: boolean;
  onClose?: () => void;
}

export function EmployeeImporter({
  onComplete,
  isOpen = false,
  onClose
}: EmployeeImporterProps) {
  return (
    <CSVImporter
      modalIsOpen={isOpen}
      modalOnCloseTriggered={onClose}
      schema={employeeSchema}
      onComplete={onComplete}
      theme="professional"
      primaryColor="#7c3aed"
    />
  );
}

/**
 * Example usage with department statistics
 */
export function EmployeeImportPage() {
  const handleComplete = async (employees: Employee[]) => {
    // Calculate department statistics
    const departmentCounts = employees.reduce((acc, emp) => {
      acc[emp.department] = (acc[emp.department] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calculate average salary
    const avgSalary = employees.reduce((sum, emp) => sum + emp.salary, 0) / employees.length;

    console.log('Import Summary:');
    console.log(`Total Employees: ${employees.length}`);
    console.log(`Average Salary: $${avgSalary.toFixed(2)}`);
    console.log('Department Breakdown:', departmentCounts);

    try {
      // Send to API
      const response = await fetch('/api/employees/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employees,
          summary: {
            count: employees.length,
            avgSalary,
            departmentCounts
          }
        })
      });

      if (response.ok) {
        alert(
          `Successfully imported ${employees.length} employees\n` +
          `Average Salary: $${avgSalary.toFixed(0)}`
        );
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
      <h1 className="text-2xl font-bold mb-4">Import Employees</h1>
      <p className="text-gray-600 mb-4">
        Import employee data from CSV. All salaries and emails will be validated.
      </p>
      <EmployeeImporter onComplete={handleComplete} />
    </div>
  );
}

/**
 * Sample CSV data
 *
 * Save as: templates/sample-data/employees.csv
 *
employeeId,firstName,lastName,email,department,position,startDate,salary,manager,skills,isActive,location
EMP001,John,Doe,john.doe@company.com,engineering,Senior Software Engineer,2020-03-15,120000,EMP100,"JavaScript,TypeScript,React",true,San Francisco
EMP002,Jane,Smith,jane.smith@company.com,sales,Sales Manager,2019-07-01,95000,EMP101,"Sales,CRM,Negotiation",true,New York
EMP003,Bob,Johnson,bob.johnson@company.com,marketing,Marketing Director,2018-01-10,110000,,"Marketing,SEO,Content",true,Remote
EMP004,Alice,Williams,alice.w@company.com,engineering,DevOps Engineer,2021-06-20,105000,EMP100,"AWS,Docker,Kubernetes",true,Austin
EMP005,Charlie,Brown,charlie@company.com,hr,HR Manager,2017-11-05,85000,,"Recruiting,Benefits,Compliance",true,Chicago
EMP006,Emily,Davis,emily.davis@company.com,finance,Financial Analyst,2022-02-14,75000,EMP102,"Excel,SQL,Accounting",true,Boston
EMP007,Michael,Wilson,michael@company.com,engineering,Frontend Developer,2023-04-01,90000,EMP001,"React,CSS,JavaScript",true,Remote
 */
