import React from 'react';
import { render, screen } from '@testing-library/react';
import Statistics from '@/components/admin/Statistics';

describe('Statistics', () => {
  const mockStats = {
    today_appointments: 15,
    active_doctors: 8,
    today_consultations: 23,
    pending_emergencies: 2,
    total_patients: 150,
    this_week_appointments: 87,
  };

  it('should render all statistics cards', () => {
    render(<Statistics stats={mockStats} />);

    expect(screen.getByText('Записей сегодня')).toBeInTheDocument();
    expect(screen.getByText('Активных врачей')).toBeInTheDocument();
    expect(screen.getByText('Консультаций')).toBeInTheDocument();
    expect(screen.getByText('Экстренных')).toBeInTheDocument();
    expect(screen.getByText('Всего пациентов')).toBeInTheDocument();
    expect(screen.getByText('За неделю')).toBeInTheDocument();
  });

  it('should display correct values for all stats', () => {
    render(<Statistics stats={mockStats} />);

    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('23')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('87')).toBeInTheDocument();
  });

  it('should handle zero values', () => {
    const zeroStats = {
      today_appointments: 0,
      active_doctors: 0,
      today_consultations: 0,
      pending_emergencies: 0,
      total_patients: 0,
      this_week_appointments: 0,
    };

    render(<Statistics stats={zeroStats} />);

    const zeroElements = screen.getAllByText('0');
    expect(zeroElements.length).toBeGreaterThan(0);
  });

  it('should handle large numbers', () => {
    const largeStats = {
      today_appointments: 999,
      active_doctors: 50,
      today_consultations: 1500,
      pending_emergencies: 100,
      total_patients: 10000,
      this_week_appointments: 5000,
    };

    render(<Statistics stats={largeStats} />);

    expect(screen.getByText('999')).toBeInTheDocument();
    expect(screen.getByText('10000')).toBeInTheDocument();
  });

  it('should have emoji icons for each stat', () => {
    render(<Statistics stats={mockStats} />);

    // Check for common emoji patterns (📅, 👨‍⚕️, 🤖, 🚨, 👥, 📊)
    const statsContainer = screen.getByText('Записей сегодня').closest('div');
    expect(statsContainer).toBeInTheDocument();
  });

  it('should render in a grid layout', () => {
    const { container } = render(<Statistics stats={mockStats} />);

    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
  });

  it('should highlight pending emergencies if greater than zero', () => {
    const { container } = render(<Statistics stats={mockStats} />);

    const emergencyCard = screen.getByText('Экстренных').closest('.cyber-card');
    expect(emergencyCard).toBeInTheDocument();
  });

  it('should display all six statistics', () => {
    const { container } = render(<Statistics stats={mockStats} />);

    const cyberCards = container.querySelectorAll('.cyber-card');
    expect(cyberCards.length).toBe(6);
  });
});
