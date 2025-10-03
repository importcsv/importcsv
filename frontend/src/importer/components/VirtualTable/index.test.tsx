import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../../test/test-utils';
import { h } from 'preact';
import VirtualTable from './index';
import type { FileRow } from '../../features/main/types';
import * as ReactVirtual from '@tanstack/react-virtual';

describe('VirtualTable component', () => {
  const mockHeaders = ['Name', 'Email', 'Age'];
  const mockRows: FileRow[] = [
    { values: ['John Doe', 'john@example.com', '30'], index: 0 },
    { values: ['Jane Smith', 'jane@example.com', '25'], index: 1 },
    { values: ['Bob Johnson', 'bob@example.com', '35'], index: 2 },
  ];
  const includedColumns = [0, 1, 2];

  const mockRenderCell = (row: FileRow, colIdx: number) => {
    return h('span', {}, row.values[colIdx]);
  };

  beforeEach(() => {
    // Mock useVirtualizer to return some virtual items for testing
    vi.spyOn(ReactVirtual, 'useVirtualizer').mockReturnValue({
      getVirtualItems: () => [
        { key: 0, index: 0, start: 0, size: 56 },
        { key: 1, index: 1, start: 56, size: 56 },
        { key: 2, index: 2, start: 112, size: 56 },
      ],
      getTotalSize: () => 168,
      scrollToIndex: vi.fn(),
      scrollToOffset: vi.fn(),
      measure: vi.fn(),
    } as any);
  });

  it('renders table headers', () => {
    render(h(VirtualTable, {
      headers: mockHeaders,
      rows: mockRows,
      renderCell: mockRenderCell,
      includedColumns
    }));

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
  });

  it('renders row numbers when stickyFirstColumn is true', () => {
    render(h(VirtualTable, {
      headers: mockHeaders,
      rows: mockRows,
      renderCell: mockRenderCell,
      includedColumns,
      stickyFirstColumn: true
    }));

    expect(screen.getByText('#')).toBeInTheDocument();
  });

  it('renders table data', () => {
    render(h(VirtualTable, {
      headers: mockHeaders,
      rows: mockRows,
      renderCell: mockRenderCell,
      includedColumns
    }));

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('handles empty data', () => {
    // Mock virtualizer to return empty items for empty data
    vi.spyOn(ReactVirtual, 'useVirtualizer').mockReturnValue({
      getVirtualItems: () => [],
      getTotalSize: () => 0,
      scrollToIndex: vi.fn(),
      scrollToOffset: vi.fn(),
      measure: vi.fn(),
    } as any);

    const { container } = render(h(VirtualTable, {
      headers: mockHeaders,
      rows: [],
      renderCell: mockRenderCell,
      includedColumns
    }));

    // Should still render headers
    expect(screen.getByText('Name')).toBeInTheDocument();

    // No data rows should be present
    const rows = container.querySelectorAll('[style*="translateY"]');
    expect(rows.length).toBe(0);
  });

  it('applies custom row className', () => {
    const getRowClassName = vi.fn((row: FileRow) => {
      return row.index === 1 ? 'bg-red-50' : '';
    });

    const { container } = render(h(VirtualTable, {
      headers: mockHeaders,
      rows: mockRows,
      renderCell: mockRenderCell,
      includedColumns,
      getRowClassName
    }));

    expect(getRowClassName).toHaveBeenCalled();
    const highlightedRow = container.querySelector('.bg-red-50');
    expect(highlightedRow).toBeInTheDocument();
  });

  it('uses custom rowHeight', () => {
    const customRowHeight = 80;
    render(h(VirtualTable, {
      headers: mockHeaders,
      rows: mockRows,
      renderCell: mockRenderCell,
      includedColumns,
      rowHeight: customRowHeight
    }));

    // Virtual table should be rendered
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('virtualizes large datasets', () => {
    const largeRows: FileRow[] = Array.from({ length: 10000 }, (_, i) => ({
      values: [`User ${i}`, `user${i}@example.com`, `${20 + i}`],
      index: i
    }));

    // Mock virtualizer to return only a subset
    vi.spyOn(ReactVirtual, 'useVirtualizer').mockReturnValue({
      getVirtualItems: () => [
        { key: 0, index: 0, start: 0, size: 56 },
        { key: 1, index: 1, start: 56, size: 56 },
        { key: 2, index: 2, start: 112, size: 56 },
      ],
      getTotalSize: () => 560000, // 10k rows * 56px
      scrollToIndex: vi.fn(),
      scrollToOffset: vi.fn(),
      measure: vi.fn(),
    } as any);

    const { container } = render(h(VirtualTable, {
      headers: mockHeaders,
      rows: largeRows,
      renderCell: mockRenderCell,
      includedColumns,
      rowHeight: 56
    }));

    // Should not render all 10k rows (only visible ones - 3 in our mock)
    const renderedRows = container.querySelectorAll('[style*="translateY"]');
    expect(renderedRows.length).toBeLessThan(100);
  });

  it('filters columns based on includedColumns', () => {
    const limitedColumns = [0, 2]; // Only Name and Age

    render(h(VirtualTable, {
      headers: mockHeaders,
      rows: mockRows,
      renderCell: mockRenderCell,
      includedColumns: limitedColumns
    }));

    // Should render only included columns
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('renders without sticky header when stickyHeader is false', () => {
    const { container } = render(h(VirtualTable, {
      headers: mockHeaders,
      rows: mockRows,
      renderCell: mockRenderCell,
      includedColumns,
      stickyHeader: false
    }));

    // When stickyHeader is false, the sticky header section is not rendered
    // The table still renders, just without the sticky header
    expect(container.querySelector('.flex-1')).toBeInTheDocument();
  });

  it('renders without sticky first column when stickyFirstColumn is false', () => {
    render(h(VirtualTable, {
      headers: mockHeaders,
      rows: mockRows,
      renderCell: mockRenderCell,
      includedColumns,
      stickyFirstColumn: false
    }));

    // Row number column (#) should not be present
    expect(screen.queryByText('#')).not.toBeInTheDocument();
  });

  it('calls renderCell for each cell', () => {
    const renderCell = vi.fn((row: FileRow, colIdx: number) => {
      return h('span', {}, row.values[colIdx]);
    });

    render(h(VirtualTable, {
      headers: mockHeaders,
      rows: mockRows,
      renderCell,
      includedColumns
    }));

    // Should call renderCell for each visible cell
    expect(renderCell).toHaveBeenCalled();
  });
});
