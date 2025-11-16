import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExportButton from '@/components/admin/ExportButton';

describe('ExportButton', () => {
  const mockOnExport = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.error to suppress error logs in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
    // Mock window.alert
    jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render with default props', () => {
    render(<ExportButton onExport={mockOnExport} />);

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('Экспорт в PDF')).toBeInTheDocument();
    expect(screen.getByText('📄')).toBeInTheDocument();
  });

  it('should render with custom label and icon', () => {
    render(
      <ExportButton
        onExport={mockOnExport}
        label="Скачать отчёт"
        icon="📊"
      />
    );

    expect(screen.getByText('Скачать отчёт')).toBeInTheDocument();
    expect(screen.getByText('📊')).toBeInTheDocument();
  });

  it('should call onExport when clicked', async () => {
    mockOnExport.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<ExportButton onExport={mockOnExport} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(mockOnExport).toHaveBeenCalledTimes(1);
  });

  it('should show loading state during export', async () => {
    let resolveExport: () => void;
    const exportPromise = new Promise<void>((resolve) => {
      resolveExport = resolve;
    });
    mockOnExport.mockReturnValue(exportPromise);

    render(<ExportButton onExport={mockOnExport} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText('Экспорт...')).toBeInTheDocument();
      expect(screen.getByText('⏳')).toBeInTheDocument();
    });

    // Button should be disabled during export
    expect(button).toBeDisabled();

    // Resolve the export
    resolveExport!();

    // Should return to normal state
    await waitFor(() => {
      expect(screen.getByText('Экспорт в PDF')).toBeInTheDocument();
    });
  });

  it('should handle export errors gracefully', async () => {
    const mockError = new Error('Export failed');
    mockOnExport.mockRejectedValue(mockError);

    render(<ExportButton onExport={mockOnExport} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Export error:', mockError);
      expect(window.alert).toHaveBeenCalledWith('Ошибка при экспорте. Проверьте консоль для деталей.');
    });

    // Should return to normal state after error
    await waitFor(() => {
      expect(screen.getByText('Экспорт в PDF')).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });
  });

  it('should disable button during export', async () => {
    let resolveExport: () => void;
    const exportPromise = new Promise<void>((resolve) => {
      resolveExport = resolve;
    });
    mockOnExport.mockReturnValue(exportPromise);

    render(<ExportButton onExport={mockOnExport} />);

    const button = screen.getByRole('button');

    expect(button).not.toBeDisabled();

    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toBeDisabled();
    });

    resolveExport!();

    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });

  it('should apply correct CSS classes', () => {
    render(<ExportButton onExport={mockOnExport} />);

    const button = screen.getByRole('button');

    expect(button).toHaveClass('px-4');
    expect(button).toHaveClass('py-2');
    expect(button).toHaveClass('rounded-lg');
  });

  it('should show spinning animation during loading', async () => {
    let resolveExport: () => void;
    const exportPromise = new Promise<void>((resolve) => {
      resolveExport = resolve;
    });
    mockOnExport.mockReturnValue(exportPromise);

    render(<ExportButton onExport={mockOnExport} />);

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      const spinner = screen.getByText('⏳');
      expect(spinner).toHaveClass('animate-spin');
    });

    resolveExport!();
  });
});
