import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../../test/test-utils';
import { h } from 'preact';
import CSVImporter from './index';

// Mock the Importer and Providers components
vi.mock('../../importer/features/main', () => ({
  default: ({ children, ...props }: any) => h('div', { 'data-testid': 'mock-importer', ...props }, children),
}));

vi.mock('../../importer/providers', () => ({
  default: ({ children, ...props }: any) => h('div', { 'data-testid': 'mock-providers', ...props }, children),
}));

vi.mock('../Modal', () => ({
  default: ({ children, isOpen, className, ...props }: any) =>
    isOpen ? h('div', { 'data-testid': 'mock-modal', className, ...props }, children) : null,
}));

const mockSetTheme = vi.fn();
vi.mock('../../importer/stores/theme', () => ({
  default: vi.fn((selector: any) => {
    const state = { setTheme: mockSetTheme };
    return selector ? selector(state) : state;
  }),
}));

describe('CSVImporter component', () => {
  const mockColumns = [
    { key: 'firstName', label: 'First Name', required: true },
    { key: 'lastName', label: 'Last Name', required: true },
    { key: 'email', label: 'Email', required: true },
  ];

  it('renders in modal mode by default', () => {
    render(h(CSVImporter, {
      columns: mockColumns,
      onComplete: vi.fn(),
      modalIsOpen: true
    }));

    // Modal should be rendered
    const modal = screen.getByTestId('mock-modal');
    expect(modal).toBeInTheDocument();
  });

  it('renders as div when isModal is false', () => {
    render(h(CSVImporter, {
      columns: mockColumns,
      onComplete: vi.fn(),
      isModal: false
    }));

    // Should render importer directly (not in modal)
    const importer = screen.getByTestId('mock-importer');
    expect(importer).toBeInTheDocument();
    expect(screen.queryByTestId('mock-modal')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(h(CSVImporter, {
      columns: mockColumns,
      onComplete: vi.fn(),
      className: 'custom-importer',
      isModal: false
    }));

    expect(screen.getByTestId('mock-importer')).toBeInTheDocument();
  });

  it('applies dark mode', () => {
    render(h(CSVImporter, {
      columns: mockColumns,
      onComplete: vi.fn(),
      darkMode: true,
      isModal: false
    }));

    expect(screen.getByTestId('mock-importer')).toBeInTheDocument();
  });

  it('applies light mode', () => {
    render(h(CSVImporter, {
      columns: mockColumns,
      onComplete: vi.fn(),
      darkMode: false,
      isModal: false
    }));

    expect(screen.getByTestId('mock-importer')).toBeInTheDocument();
  });

  it('applies primary color', () => {
    render(h(CSVImporter, {
      columns: mockColumns,
      onComplete: vi.fn(),
      primaryColor: '#FF0000',
      isModal: false
    }));

    expect(screen.getByTestId('mock-importer')).toBeInTheDocument();
  });

  it('handles modal close', () => {
    const modalOnCloseTriggered = vi.fn();

    render(h(CSVImporter, {
      columns: mockColumns,
      onComplete: vi.fn(),
      modalIsOpen: true,
      modalOnCloseTriggered,
      isModal: true
    }));

    expect(screen.getByTestId('mock-modal')).toBeInTheDocument();
  });

  it('renders with custom classNames', () => {
    render(h(CSVImporter, {
      columns: mockColumns,
      onComplete: vi.fn(),
      classNames: {
        root: 'custom-root',
        content: 'custom-content'
      },
      isModal: false
    }));

    expect(screen.getByTestId('mock-importer')).toBeInTheDocument();
  });

  it('passes columns to Importer', () => {
    render(h(CSVImporter, {
      columns: mockColumns,
      onComplete: vi.fn(),
      isModal: false
    }));

    expect(screen.getByTestId('mock-importer')).toBeInTheDocument();
  });

  it('passes onComplete handler', () => {
    const onComplete = vi.fn();
    render(h(CSVImporter, {
      columns: mockColumns,
      onComplete,
      isModal: false
    }));

    expect(screen.getByTestId('mock-importer')).toBeInTheDocument();
  });

  it('renders with customStyles', () => {
    const customStyles = {
      container: { backgroundColor: 'red' }
    };

    render(h(CSVImporter, {
      columns: mockColumns,
      onComplete: vi.fn(),
      customStyles,
      isModal: false
    }));

    expect(screen.getByTestId('mock-importer')).toBeInTheDocument();
  });

  it('passes showDownloadTemplateButton prop', () => {
    render(h(CSVImporter, {
      columns: mockColumns,
      onComplete: vi.fn(),
      showDownloadTemplateButton: true,
      isModal: false
    }));

    expect(screen.getByTestId('mock-importer')).toBeInTheDocument();
  });

  it('passes skipHeaderRowSelection prop', () => {
    render(h(CSVImporter, {
      columns: mockColumns,
      onComplete: vi.fn(),
      skipHeaderRowSelection: true,
      isModal: false
    }));

    expect(screen.getByTestId('mock-importer')).toBeInTheDocument();
  });

  it('passes language and customTranslations', () => {
    render(h(CSVImporter, {
      columns: mockColumns,
      onComplete: vi.fn(),
      language: 'es',
      customTranslations: { upload: 'Subir' },
      isModal: false
    }));

    expect(screen.getByTestId('mock-importer')).toBeInTheDocument();
  });
});
