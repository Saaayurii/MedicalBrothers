import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoyaltyPoints from '@/components/patient/LoyaltyPoints';

// Mock fetch
global.fetch = jest.fn();

describe('LoyaltyPoints Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state initially', () => {
    (global.fetch as jest.Mock).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<LoyaltyPoints />);
    expect(screen.getByText(/загрузка/i)).toBeInTheDocument();
  });

  it('should display loyalty points and tier', async () => {
    const mockData = {
      loyalty: {
        points: 1500,
        tier: 'silver',
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    });

    render(<LoyaltyPoints />);

    await waitFor(() => {
      expect(screen.getByText(/1500/)).toBeInTheDocument();
    });
  });

  it('should handle no loyalty points gracefully', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ loyalty: null }),
    });

    render(<LoyaltyPoints />);

    await waitFor(() => {
      expect(screen.getByText(/нет данных/i)).toBeInTheDocument();
    });
  });

  it('should handle fetch errors', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<LoyaltyPoints />);

    await waitFor(() => {
      expect(screen.queryByText(/загрузка/i)).not.toBeInTheDocument();
    });
  });
});
