import { h } from 'preact';
import { useRef, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { CloudUpload } from 'lucide-react';

interface NativeDropzoneProps {
  onFileSelect: (file: File) => void;
  accept?: Record<string, string[]>;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  children?: ComponentChildren;
}

export default function NativeDropzone({ 
  onFileSelect, 
  accept = {},
  disabled = false,
  loading = false,
  className = '',
  children
}: NativeDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert accept object to accept string for input
  const acceptStr = Object.entries(accept)
    .flatMap(([mime, exts]) => [mime, ...exts])
    .join(',');

  const validateFile = (file: File): boolean => {
    if (Object.keys(accept).length === 0) return true;
    
    // Check if file matches accepted types
    return Object.entries(accept).some(([mime, exts]) => {
      if (file.type === mime) return true;
      const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
      return exts.includes(ext);
    });
  };

  const handleFileSelect = (file: File) => {
    if (validateFile(file)) {
      onFileSelect(file);
    }
  };

  const handleInputChange = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      handleFileSelect(input.files[0]);
      // Reset input value to allow selecting the same file again
      input.value = '';
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled || loading) return;
    
    if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !loading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set dragging to false if we're leaving the dropzone entirely
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragging(false);
    }
  };

  const handleClick = () => {
    if (!disabled && !loading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div
      className={`${className} ${isDragging ? 'drag-active' : ''} ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={handleClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptStr}
        onChange={handleInputChange}
        disabled={disabled || loading}
        style={{ display: 'none' }}
      />
      {children || (
        <div className="flex flex-col items-center justify-center py-12">
          <CloudUpload className="w-12 h-12 text-gray-400 mb-4" />
          <p className="text-sm text-gray-600">
            {isDragging ? 'Drop file here' : 'Drag and drop or click to upload'}
          </p>
        </div>
      )}
    </div>
  );
}