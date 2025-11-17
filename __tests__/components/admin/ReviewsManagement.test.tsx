import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ReviewsManagement from '@/components/admin/ReviewsManagement';

global.fetch = jest.fn();

describe('ReviewsManagement Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render reviews list', async () => {
    const mockReviews = [
      {
        id: 1,
        rating: 5,
        comment: 'Great service',
        isApproved: true,
        doctor: { name: 'Dr. Smith' },
        patient: { name: 'John Doe' },
        createdAt: new Date().toISOString(),
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ reviews: mockReviews }),
    });

    render(<ReviewsManagement />);

    await waitFor(() => {
      expect(screen.getByText('Great service')).toBeInTheDocument();
      expect(screen.getByText(/Dr. Smith/)).toBeInTheDocument();
    });
  });

  it('should filter reviews by status', async () => {
    const mockReviews = [
      {
        id: 1,
        rating: 5,
        comment: 'Test',
        isApproved: true,
        doctor: { name: 'Dr. Smith' },
        patient: { name: 'John Doe' },
        createdAt: new Date().toISOString(),
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ reviews: mockReviews }),
    });

    render(<ReviewsManagement />);

    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
    });

    const pendingButton = screen.getByText(/ожидающие/i);
    fireEvent.click(pendingButton);

    // Should refetch with filter
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('isApproved=false')
      );
    });
  });
});
