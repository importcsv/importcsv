'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  RefreshCw,
  FileSpreadsheet,
  BarChart4
} from 'lucide-react';

// Define the ImportJob interface based on the backend model
interface ImportJob {
  id: string;
  schema_id: string;
  file_name: string;
  file_type: string;
  status: 'pending' | 'processing' | 'validating' | 'validated' | 'importing' | 'completed' | 'failed';
  row_count: number;
  processed_rows: number;
  error_count: number;
  errors?: any;
  created_at: string;
  updated_at?: string;
  completed_at?: string;
  schema?: {
    name: string;
  };
}

// Define the metrics summary interface
interface MetricsSummary {
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
  totalRows: number;
  processedRows: number;
  errorRows: number;
  successRate: number;
}

export default function MetricsPage() {
  const [imports, setImports] = useState<ImportJob[]>([]);
  const [filteredImports, setFilteredImports] = useState<ImportJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [metrics, setMetrics] = useState<MetricsSummary>({
    total: 0,
    completed: 0,
    failed: 0,
    inProgress: 0,
    totalRows: 0,
    processedRows: 0,
    errorRows: 0,
    successRate: 0
  });

  const { token, logout, refreshToken } = useAuth();
  const router = useRouter();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

  // Fetch import jobs from the backend
  useEffect(() => {
    const fetchImports = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!token) {
          setIsLoading(false);
          return;
        }
        
        // Try to refresh the token before making the request
        await refreshToken();
        
        const response = await fetch(`${backendUrl}/api/v1/imports`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          // If unauthorized, try to refresh the token and retry once
          if (response.status === 401) {
            console.log('Token expired, attempting to refresh...');
            const refreshed = await refreshToken();
            
            if (refreshed) {
              // Token refreshed successfully, retry the request
              console.log('Token refreshed, retrying request...');
              return fetchImports();
            } else {
              // Token refresh failed, redirect to login
              console.error('Token refresh failed, redirecting to login');
              logout();
              router.push('/login');
              return; // Stop execution
            }
          }
          
          let errorDetail = 'Failed to fetch import jobs';
          try {
            const errorData = await response.json();
            errorDetail = errorData.detail || errorDetail;
          } catch (e) { /* Ignore parsing error */ }
          throw new Error(errorDetail);
        }
        
        const data = await response.json();
        setImports(Array.isArray(data) ? data : []);
        setFilteredImports(Array.isArray(data) ? data : []);
        calculateMetrics(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching import jobs.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchImports();
    
    // Set up polling to refresh data every 30 seconds
    const intervalId = setInterval(fetchImports, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [token, backendUrl, logout, router, refreshToken]);

  // Filter imports when status filter changes
  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredImports(imports);
    } else {
      setFilteredImports(imports.filter(job => job.status === statusFilter));
    }
  }, [statusFilter, imports]);

  // Calculate metrics summary from import jobs
  const calculateMetrics = (importJobs: ImportJob[]) => {
    const inProgressStatuses = ['pending', 'processing', 'validating', 'importing'];
    
    const summary: MetricsSummary = {
      total: importJobs.length,
      completed: importJobs.filter(job => job.status === 'completed').length,
      failed: importJobs.filter(job => job.status === 'failed').length,
      inProgress: importJobs.filter(job => inProgressStatuses.includes(job.status)).length,
      totalRows: importJobs.reduce((sum, job) => sum + job.row_count, 0),
      processedRows: importJobs.reduce((sum, job) => sum + job.processed_rows, 0),
      errorRows: importJobs.reduce((sum, job) => sum + job.error_count, 0),
      successRate: 0
    };
    
    // Calculate success rate
    if (summary.processedRows > 0) {
      summary.successRate = Math.round(((summary.processedRows - summary.errorRows) / summary.processedRows) * 100);
    }
    
    setMetrics(summary);
  };

  // Helper function to format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  // Helper function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Completed</Badge>;
      case 'failed':
        return <Badge className="bg-red-500"><XCircle className="h-3 w-3 mr-1" /> Failed</Badge>;
      case 'pending':
        return <Badge className="bg-gray-500"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'processing':
      case 'validating':
      case 'importing':
        return <Badge className="bg-blue-500"><RefreshCw className="h-3 w-3 mr-1" /> Processing</Badge>;
      case 'validated':
        return <Badge className="bg-yellow-500"><AlertTriangle className="h-3 w-3 mr-1" /> Validated</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Helper function to calculate progress percentage
  const calculateProgress = (job: ImportJob) => {
    if (job.row_count === 0) return 0;
    return Math.round((job.processed_rows / job.row_count) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Import Metrics Dashboard</h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">Filter by status:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="validating">Validating</SelectItem>
              <SelectItem value="validated">Validated</SelectItem>
              <SelectItem value="importing">Importing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Imports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.completed}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.failed}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.inProgress}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList>
          <TabsTrigger value="summary" className="flex items-center">
            <BarChart4 className="h-4 w-4 mr-2" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Import Details
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Row Processing</CardTitle>
                <CardDescription>
                  Total rows processed vs. total rows in imports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Processed Rows</span>
                    <span className="font-medium">{metrics.processedRows} / {metrics.totalRows}</span>
                  </div>
                  <Progress value={metrics.totalRows > 0 ? (metrics.processedRows / metrics.totalRows) * 100 : 0} />
                  
                  <div className="flex justify-between items-center mt-4">
                    <span>Success Rate</span>
                    <span className="font-medium">{metrics.successRate}%</span>
                  </div>
                  <Progress 
                    value={metrics.successRate} 
                    className="bg-red-100"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>Error Rows: {metrics.errorRows}</span>
                    <span>Success Rows: {metrics.processedRows - metrics.errorRows}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Import Status Distribution</CardTitle>
                <CardDescription>
                  Breakdown of import jobs by status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['completed', 'failed', 'processing', 'pending', 'validating', 'validated', 'importing'].map(status => {
                    const count = imports.filter(job => job.status === status).length;
                    const percentage = imports.length > 0 ? Math.round((count / imports.length) * 100) : 0;
                    
                    return (
                      <div key={status} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="capitalize">{status}</span>
                          <span className="text-sm font-medium">{count} ({percentage}%)</span>
                        </div>
                        <Progress value={percentage} className={
                          status === 'completed' ? 'bg-green-100' : 
                          status === 'failed' ? 'bg-red-100' : 
                          'bg-blue-100'
                        } />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="details">
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
              <p className="mt-2 text-gray-500">Loading import data...</p>
            </div>
          ) : filteredImports.length === 0 ? (
            <div className="text-center py-8 border rounded-md bg-gray-50">
              <p className="text-gray-500">No import jobs found.</p>
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Schema</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Rows</TableHead>
                    <TableHead>Errors</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Completed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredImports.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium">{job.file_name}</TableCell>
                      <TableCell>{job.schema?.name || 'Unknown'}</TableCell>
                      <TableCell>{getStatusBadge(job.status)}</TableCell>
                      <TableCell>
                        <div className="w-[100px]">
                          <Progress value={calculateProgress(job)} className={
                            job.status === 'completed' ? 'bg-green-100' : 
                            job.status === 'failed' ? 'bg-red-100' : 
                            'bg-blue-100'
                          } />
                        </div>
                      </TableCell>
                      <TableCell>{job.processed_rows} / {job.row_count}</TableCell>
                      <TableCell className="text-red-600">{job.error_count}</TableCell>
                      <TableCell className="text-sm text-gray-500">{formatDate(job.created_at)}</TableCell>
                      <TableCell className="text-sm text-gray-500">{formatDate(job.completed_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
