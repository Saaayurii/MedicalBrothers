import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Add font support for Cyrillic (Russian)
// Using built-in fonts that support Cyrillic characters

interface ReportData {
  title: string;
  date: string;
  sections: {
    title: string;
    data: any[];
    columns: string[];
  }[];
  summary?: {
    label: string;
    value: string | number;
  }[];
}

export async function generatePDFReport(data: ReportData): Promise<void> {
  const doc = new jsPDF();

  // Set font (using Times which has better Cyrillic support)
  doc.setFont('times', 'normal');

  // Title
  doc.setFontSize(18);
  doc.text(data.title, 105, 20, { align: 'center' });

  // Date
  doc.setFontSize(10);
  doc.text(data.date, 105, 30, { align: 'center' });

  let yPosition = 45;

  // Sections
  data.sections.forEach((section, index) => {
    // Section title
    doc.setFontSize(14);
    doc.text(section.title, 14, yPosition);
    yPosition += 10;

    // Table
    autoTable(doc, {
      startY: yPosition,
      head: [section.columns],
      body: section.data.map((row) =>
        section.columns.map((col) => row[col] || '')
      ),
      theme: 'grid',
      headStyles: {
        fillColor: [6, 182, 212],
        textColor: 255,
        fontSize: 10,
      },
      bodyStyles: {
        fontSize: 9,
      },
      styles: {
        font: 'times',
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      margin: { left: 14, right: 14 },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;

    // Add new page if needed
    if (yPosition > 250 && index < data.sections.length - 1) {
      doc.addPage();
      yPosition = 20;
    }
  });

  // Summary section
  if (data.summary && data.summary.length > 0) {
    // Check if we need a new page
    if (yPosition > 220) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.text('Summary / Итоги:', 14, yPosition);
    yPosition += 10;

    data.summary.forEach((item) => {
      doc.setFontSize(10);
      doc.text(`${item.label}: ${item.value}`, 14, yPosition);
      yPosition += 7;
    });
  }

  // Footer on each page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128);
    doc.text(
      `Medical Brothers | Page ${i} of ${pageCount}`,
      105,
      285,
      { align: 'center' }
    );
  }

  // Save PDF
  doc.save(`${data.title.replace(/\s+/g, '_')}_${new Date().getTime()}.pdf`);
}

/**
 * Generate revenue report PDF
 */
export async function generateRevenueReport(
  revenueData: Array<{ date: string; Доход: number; Записей: number }>,
  totalRevenue: number,
  totalAppointments: number
): Promise<void> {
  const report: ReportData = {
    title: 'Revenue Report / Otchet o Dokhodah',
    date: new Date().toLocaleDateString('ru-RU'),
    sections: [
      {
        title: 'Daily Revenue / Dnevnye Dohody',
        columns: ['Date / Data', 'Revenue (RUB) / Dohod', 'Appointments / Zapisey'],
        data: revenueData.map((row) => ({
          'Date / Data': row.date,
          'Revenue (RUB) / Dohod': `${row.Доход.toLocaleString()} ₽`,
          'Appointments / Zapisey': row.Записей,
        })),
      },
    ],
    summary: [
      { label: 'Total Revenue / Obshchiy Dohod', value: `${totalRevenue.toLocaleString()} ₽` },
      { label: 'Total Appointments / Vseh Zapisey', value: totalAppointments },
      { label: 'Average per Appointment / Srednyaya Stoimost', value: `${Math.round(totalRevenue / totalAppointments).toLocaleString()} ₽` },
    ],
  };

  await generatePDFReport(report);
}

/**
 * Generate doctor performance report PDF
 */
export async function generateDoctorPerformanceReport(
  doctors: Array<{
    name: string;
    specialty: string;
    appointments: number;
    completed: number;
    revenue: number;
  }>
): Promise<void> {
  const report: ReportData = {
    title: 'Doctor Performance Report / Otchet po Vracham',
    date: new Date().toLocaleDateString('ru-RU'),
    sections: [
      {
        title: 'Doctor Statistics / Statistika Vrachey',
        columns: ['Doctor / Vrach', 'Specialty / Spetsialnost', 'Total / Vsego', 'Completed / Zaversheno', 'Revenue (RUB) / Dohod'],
        data: doctors.map((doctor) => ({
          'Doctor / Vrach': doctor.name,
          'Specialty / Spetsialnost': doctor.specialty,
          'Total / Vsego': doctor.appointments,
          'Completed / Zaversheno': doctor.completed,
          'Revenue (RUB) / Dohod': `${doctor.revenue.toLocaleString()} ₽`,
        })),
      },
    ],
    summary: [
      { label: 'Total Doctors / Vsego Vrachey', value: doctors.length },
      { label: 'Total Appointments / Vseh Zapisey', value: doctors.reduce((sum, d) => sum + d.appointments, 0) },
      { label: 'Total Revenue / Obshchiy Dohod', value: `${doctors.reduce((sum, d) => sum + d.revenue, 0).toLocaleString()} ₽` },
    ],
  };

  await generatePDFReport(report);
}

/**
 * Generate audit log report PDF
 */
export async function generateAuditLogReport(
  logs: Array<{
    date: string;
    user: string;
    action: string;
    entity: string;
    details: string;
  }>
): Promise<void> {
  const report: ReportData = {
    title: 'Audit Log Report / Zhurnal Audita',
    date: new Date().toLocaleDateString('ru-RU'),
    sections: [
      {
        title: 'Audit Log Entries / Zapisi Audita',
        columns: ['Date / Data', 'User / Polzovatel', 'Action / Deystvie', 'Entity / Sushchnost', 'Details / Detali'],
        data: logs.map((log) => ({
          'Date / Data': log.date,
          'User / Polzovatel': log.user,
          'Action / Deystvie': log.action,
          'Entity / Sushchnost': log.entity,
          'Details / Detali': log.details,
        })),
      },
    ],
    summary: [
      { label: 'Total Entries / Vsego Zapisey', value: logs.length },
    ],
  };

  await generatePDFReport(report);
}
