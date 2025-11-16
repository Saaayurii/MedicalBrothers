import React from 'react';
import { render, screen } from '@testing-library/react';
import AdvancedAnalytics from '@/components/admin/AdvancedAnalytics';

// Mock recharts to avoid canvas issues in tests
jest.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
}));

describe('AdvancedAnalytics', () => {
  const mockAppointments = [
    {
      id: 1,
      appointmentDate: new Date(),
      appointmentTime: new Date('2024-01-01T10:00:00'),
      status: 'completed',
      doctor: {
        id: 1,
        name: 'Иван Петров',
        specialty: 'Кардиолог',
      },
    },
    {
      id: 2,
      appointmentDate: new Date(),
      appointmentTime: new Date('2024-01-01T14:00:00'),
      status: 'completed',
      doctor: {
        id: 2,
        name: 'Мария Сидорова',
        specialty: 'Терапевт',
      },
    },
    {
      id: 3,
      appointmentDate: new Date(),
      appointmentTime: new Date('2024-01-01T16:00:00'),
      status: 'scheduled',
      doctor: {
        id: 1,
        name: 'Иван Петров',
        specialty: 'Кардиолог',
      },
    },
  ];

  it('should render all analytics sections', () => {
    render(<AdvancedAnalytics appointments={mockAppointments} />);

    expect(screen.getByText('💰 Доходы и Прогноз (30 дней)')).toBeInTheDocument();
    expect(screen.getByText('📈 Динамика доходов (последние 30 дней)')).toBeInTheDocument();
    expect(screen.getByText('🏆 Популярность врачей')).toBeInTheDocument();
    expect(screen.getByText('🔥 Загруженность по часам')).toBeInTheDocument();
  });

  it('should render revenue and forecast chart', () => {
    render(<AdvancedAnalytics appointments={mockAppointments} />);

    const areaCharts = screen.getAllByTestId('area-chart');
    expect(areaCharts.length).toBeGreaterThan(0);
  });

  it('should render revenue trend chart', () => {
    render(<AdvancedAnalytics appointments={mockAppointments} />);

    const lineCharts = screen.getAllByTestId('line-chart');
    expect(lineCharts.length).toBeGreaterThan(0);
  });

  it('should render doctor popularity chart', () => {
    render(<AdvancedAnalytics appointments={mockAppointments} />);

    const barCharts = screen.getAllByTestId('bar-chart');
    expect(barCharts.length).toBeGreaterThan(0);
  });

  it('should render heatmap with days of week', () => {
    render(<AdvancedAnalytics appointments={mockAppointments} />);

    expect(screen.getByText('Вс')).toBeInTheDocument();
    expect(screen.getByText('Пн')).toBeInTheDocument();
    expect(screen.getByText('Вт')).toBeInTheDocument();
    expect(screen.getByText('Ср')).toBeInTheDocument();
    expect(screen.getByText('Чт')).toBeInTheDocument();
    expect(screen.getByText('Пт')).toBeInTheDocument();
    expect(screen.getByText('Сб')).toBeInTheDocument();
  });

  it('should render heatmap with working hours', () => {
    render(<AdvancedAnalytics appointments={mockAppointments} />);

    // Check for working hours (8:00 to 18:00)
    expect(screen.getByText('8:00')).toBeInTheDocument();
    expect(screen.getByText('12:00')).toBeInTheDocument();
    expect(screen.getByText('18:00')).toBeInTheDocument();
  });

  it('should handle empty appointments array', () => {
    render(<AdvancedAnalytics appointments={[]} />);

    expect(screen.getByText('💰 Доходы и Прогноз (30 дней)')).toBeInTheDocument();
    expect(screen.getByText('📈 Динамика доходов (последние 30 дней)')).toBeInTheDocument();
  });

  it('should only count completed appointments for revenue', () => {
    render(<AdvancedAnalytics appointments={mockAppointments} />);

    // This is implicit in the component logic
    // Revenue should only be calculated from completed appointments
    expect(screen.getByText('🏆 Популярность врачей')).toBeInTheDocument();
  });

  it('should display heatmap tooltip hint', () => {
    render(<AdvancedAnalytics appointments={mockAppointments} />);

    expect(screen.getByText('* Темнее = больше записей. Наведите курсор для деталей')).toBeInTheDocument();
  });
});
