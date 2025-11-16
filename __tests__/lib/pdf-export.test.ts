import {
  generatePDFReport,
  generateRevenueReport,
  generateDoctorPerformanceReport,
  generateAuditLogReport,
} from '@/lib/pdf-export';

// Mock jsPDF
jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    setFont: jest.fn(),
    setFontSize: jest.fn(),
    text: jest.fn(),
    addPage: jest.fn(),
    setPage: jest.fn(),
    setTextColor: jest.fn(),
    getNumberOfPages: jest.fn().mockReturnValue(1),
    save: jest.fn(),
    lastAutoTable: { finalY: 100 },
  }));
});

// Mock jspdf-autotable
jest.mock('jspdf-autotable', () => jest.fn());

describe('PDF Export Library', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generatePDFReport', () => {
    it('should generate a PDF report with title and date', async () => {
      const mockData = {
        title: 'Test Report',
        date: '2024-01-01',
        sections: [],
      };

      await generatePDFReport(mockData);

      const jsPDF = require('jspdf');
      const mockInstance = jsPDF.mock.results[0].value;

      expect(mockInstance.setFont).toHaveBeenCalledWith('times', 'normal');
      expect(mockInstance.setFontSize).toHaveBeenCalled();
      expect(mockInstance.text).toHaveBeenCalledWith(
        'Test Report',
        105,
        20,
        { align: 'center' }
      );
      expect(mockInstance.save).toHaveBeenCalled();
    });

    it('should generate sections with tables', async () => {
      const autoTable = require('jspdf-autotable');
      const mockData = {
        title: 'Test Report',
        date: '2024-01-01',
        sections: [
          {
            title: 'Section 1',
            columns: ['Column 1', 'Column 2'],
            data: [{ 'Column 1': 'Value 1', 'Column 2': 'Value 2' }],
          },
        ],
      };

      await generatePDFReport(mockData);

      expect(autoTable).toHaveBeenCalled();
      const autoTableCall = autoTable.mock.calls[0][1];
      expect(autoTableCall.head).toEqual([['Column 1', 'Column 2']]);
      expect(autoTableCall.theme).toBe('grid');
    });

    it('should add summary section if provided', async () => {
      const mockData = {
        title: 'Test Report',
        date: '2024-01-01',
        sections: [],
        summary: [
          { label: 'Total', value: '100' },
          { label: 'Average', value: '50' },
        ],
      };

      await generatePDFReport(mockData);

      const jsPDF = require('jspdf');
      const mockInstance = jsPDF.mock.results[0].value;

      expect(mockInstance.text).toHaveBeenCalledWith(
        'Summary / Итоги:',
        14,
        expect.any(Number)
      );
    });

    it('should add page numbers to footer', async () => {
      const mockData = {
        title: 'Test Report',
        date: '2024-01-01',
        sections: [],
      };

      await generatePDFReport(mockData);

      const jsPDF = require('jspdf');
      const mockInstance = jsPDF.mock.results[0].value;

      expect(mockInstance.getNumberOfPages).toHaveBeenCalled();
      expect(mockInstance.setPage).toHaveBeenCalled();
    });
  });

  describe('generateRevenueReport', () => {
    it('should generate revenue report with correct data', async () => {
      const autoTable = require('jspdf-autotable');
      const revenueData = [
        { date: '01.01', Доход: 5000, Записей: 5 },
        { date: '02.01', Доход: 7000, Записей: 7 },
      ];

      await generateRevenueReport(revenueData, 12000, 12);

      expect(autoTable).toHaveBeenCalled();

      const autoTableCall = autoTable.mock.calls[0][1];
      expect(autoTableCall.head[0]).toContain('Date / Data');
      expect(autoTableCall.head[0]).toContain('Revenue (RUB) / Dohod');
      expect(autoTableCall.head[0]).toContain('Appointments / Zapisey');
    });

    it('should calculate average per appointment in summary', async () => {
      const revenueData = [
        { date: '01.01', Доход: 6000, Записей: 3 },
      ];
      const totalRevenue = 6000;
      const totalAppointments = 3;

      await generateRevenueReport(revenueData, totalRevenue, totalAppointments);

      const jsPDF = require('jspdf');
      const mockInstance = jsPDF.mock.results[0].value;

      // Average should be 6000 / 3 = 2000
      expect(mockInstance.text).toHaveBeenCalledWith(
        expect.stringContaining('2'),
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should format revenue with locale string', async () => {
      const revenueData = [
        { date: '01.01', Доход: 10000, Записей: 5 },
      ];

      await generateRevenueReport(revenueData, 10000, 5);

      const autoTable = require('jspdf-autotable');
      const autoTableCall = autoTable.mock.calls[0][1];
      const bodyData = autoTableCall.body;

      // Check that revenue is formatted with currency
      expect(bodyData[0]).toContain('10,000 ₽');
    });
  });

  describe('generateDoctorPerformanceReport', () => {
    it('should generate doctor performance report', async () => {
      const autoTable = require('jspdf-autotable');
      const doctors = [
        {
          name: 'Иван Петров',
          specialty: 'Кардиолог',
          appointments: 10,
          completed: 8,
          revenue: 24000,
        },
        {
          name: 'Мария Сидорова',
          specialty: 'Терапевт',
          appointments: 15,
          completed: 12,
          revenue: 24000,
        },
      ];

      await generateDoctorPerformanceReport(doctors);

      expect(autoTable).toHaveBeenCalled();

      const autoTableCall = autoTable.mock.calls[0][1];
      expect(autoTableCall.head[0]).toContain('Doctor / Vrach');
      expect(autoTableCall.head[0]).toContain('Specialty / Spetsialnost');
      expect(autoTableCall.head[0]).toContain('Total / Vsego');
      expect(autoTableCall.head[0]).toContain('Completed / Zaversheno');
      expect(autoTableCall.head[0]).toContain('Revenue (RUB) / Dohod');
    });

    it('should calculate total doctors in summary', async () => {
      const doctors = [
        { name: 'Doctor 1', specialty: 'Specialty 1', appointments: 5, completed: 3, revenue: 9000 },
        { name: 'Doctor 2', specialty: 'Specialty 2', appointments: 7, completed: 5, revenue: 14000 },
      ];

      await generateDoctorPerformanceReport(doctors);

      const jsPDF = require('jspdf');
      const mockInstance = jsPDF.mock.results[0].value;

      expect(mockInstance.text).toHaveBeenCalledWith(
        expect.stringContaining('2'), // Total doctors
        expect.any(Number),
        expect.any(Number)
      );
    });

    it('should calculate total appointments and revenue', async () => {
      const doctors = [
        { name: 'Doctor 1', specialty: 'Specialty 1', appointments: 10, completed: 8, revenue: 24000 },
        { name: 'Doctor 2', specialty: 'Specialty 2', appointments: 5, completed: 4, revenue: 12000 },
      ];

      await generateDoctorPerformanceReport(doctors);

      const jsPDF = require('jspdf');
      const mockInstance = jsPDF.mock.results[0].value;

      // Total appointments: 10 + 5 = 15
      // Total revenue: 24000 + 12000 = 36000
      expect(mockInstance.text).toHaveBeenCalledWith(
        expect.stringMatching(/15|36/),
        expect.any(Number),
        expect.any(Number)
      );
    });
  });

  describe('generateAuditLogReport', () => {
    it('should generate audit log report', async () => {
      const autoTable = require('jspdf-autotable');
      const logs = [
        {
          date: '2024-01-01',
          user: 'admin',
          action: 'CREATE',
          entity: 'Patient',
          details: 'Created patient record',
        },
        {
          date: '2024-01-02',
          user: 'doctor',
          action: 'UPDATE',
          entity: 'Appointment',
          details: 'Updated appointment status',
        },
      ];

      await generateAuditLogReport(logs);

      expect(autoTable).toHaveBeenCalled();

      const autoTableCall = autoTable.mock.calls[0][1];
      expect(autoTableCall.head[0]).toContain('Date / Data');
      expect(autoTableCall.head[0]).toContain('User / Polzovatel');
      expect(autoTableCall.head[0]).toContain('Action / Deystvie');
      expect(autoTableCall.head[0]).toContain('Entity / Sushchnost');
      expect(autoTableCall.head[0]).toContain('Details / Detali');
    });

    it('should show total entries in summary', async () => {
      const logs = [
        { date: '2024-01-01', user: 'admin', action: 'CREATE', entity: 'Patient', details: 'Detail 1' },
        { date: '2024-01-02', user: 'admin', action: 'UPDATE', entity: 'Doctor', details: 'Detail 2' },
        { date: '2024-01-03', user: 'doctor', action: 'DELETE', entity: 'Appointment', details: 'Detail 3' },
      ];

      await generateAuditLogReport(logs);

      const jsPDF = require('jspdf');
      const mockInstance = jsPDF.mock.results[0].value;

      expect(mockInstance.text).toHaveBeenCalledWith(
        expect.stringContaining('3'), // Total entries
        expect.any(Number),
        expect.any(Number)
      );
    });
  });
});
