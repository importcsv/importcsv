import { useRef, useEffect } from 'preact/hooks';
import type { JSX } from 'preact';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '../../../utils/cn';
import type { FileRow } from '../../features/main/types';

interface VirtualTableProps {
  headers: string[];
  rows: FileRow[];
  renderCell: (row: FileRow, colIdx: number, actualRowIdx: number) => JSX.Element;
  onCellEdit?: (rowIdx: number, colIdx: number, value: string) => void;
  rowHeight?: number;
  overscan?: number;
  stickyHeader?: boolean;
  stickyFirstColumn?: boolean;
  getRowClassName?: (row: FileRow, actualRowIdx: number) => string;
  headerRowIndex?: number;
  includedColumns: number[];
}

export default function VirtualTable({
  headers,
  rows,
  renderCell,
  rowHeight = 56,
  overscan = 5,
  stickyHeader = true,
  stickyFirstColumn = true,
  getRowClassName,
  headerRowIndex = 0,
  includedColumns,
}: VirtualTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const scrollableRef = useRef<HTMLDivElement>(null);

  // Virtual row management
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollableRef.current,
    estimateSize: () => rowHeight,
    overscan,
  });

  const items = virtualizer.getVirtualItems();

  // Calculate table width based on columns
  const tableWidth = stickyFirstColumn 
    ? 60 + (headers.length * 200) // 60px for row number + 200px per column
    : headers.length * 200;

  return (
    <div className="flex-1 overflow-hidden relative" ref={parentRef}>
      {/* Sticky Header */}
      {stickyHeader && (
        <div 
          className="bg-slate-50/80 border-b border-slate-200 sticky top-0 z-20 overflow-hidden"
          style={{ minWidth: tableWidth }}
        >
          <div className="flex">
            {stickyFirstColumn && (
              <div 
                className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80 border-r border-slate-200"
                style={{ 
                  position: 'sticky', 
                  left: 0, 
                  zIndex: 21, 
                  minWidth: '60px', 
                  width: '60px' 
                }}
              >
                #
              </div>
            )}
            {headers.map((header, idx) => (
              <div 
                key={idx} 
                className="text-left px-6 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80"
                style={{ minWidth: '200px', flex: '0 0 200px' }}
              >
                {header}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Virtual Scrollable Area */}
      <div 
        ref={scrollableRef}
        className="overflow-auto"
        style={{ 
          height: stickyHeader ? 'calc(100% - 56px)' : '100%',
          maxHeight: '500px', // Fixed height for virtualization to work
        }}
      >
        {/* Virtual Space Container */}
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
            minWidth: tableWidth,
          }}
        >
          {/* Rendered Virtual Rows */}
          {items.map((virtualRow) => {
            const row = rows[virtualRow.index];
            const actualRowIdx = virtualRow.index;
            const displayRowIndex = actualRowIdx + headerRowIndex + 1;
            const rowClassName = getRowClassName?.(row, actualRowIdx) || '';

            return (
              <div
                key={virtualRow.key}
                className={cn(
                  "flex border-b border-slate-100 hover:bg-blue-50/50 transition-colors",
                  rowClassName
                )}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {/* Sticky Row Number */}
                {stickyFirstColumn && (
                  <div 
                    className="px-6 py-3 text-sm text-slate-600 border-r border-slate-200 flex items-center"
                    style={{ 
                      position: 'sticky', 
                      left: 0, 
                      zIndex: 5, 
                      backgroundColor: rowClassName.includes('bg-red-50') ? '#FEF2F2' : '#F8FAFC',
                      minWidth: '60px', 
                      width: '60px' 
                    }}
                  >
                    <span>{displayRowIndex + 1}</span>
                  </div>
                )}

                {/* Data Cells */}
                {includedColumns.map((colIdx, idx) => (

                    <div 
                      key={idx} 
                      className="px-6 py-3"
                      style={{ minWidth: '200px', flex: '0 0 200px' }}
                    >
                      {renderCell(row, colIdx, actualRowIdx)}
                    </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}