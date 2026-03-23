import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ComprehensiveReportResponse } from '@/api/services/ReportService';

const COLORS = {
  brand: [25, 119, 204] as [number, number, number],
  dark: [30, 41, 59] as [number, number, number],
  body: [71, 85, 105] as [number, number, number],
  muted: [148, 163, 184] as [number, number, number],
  lightBg: [248, 250, 252] as [number, number, number],
};

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (dateStr: string): string => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
};

const STATUS_LABELS: Record<string, string> = {
  completed: 'Completed', scheduled: 'Scheduled', checked_in: 'Checked In',
  cancelled: 'Cancelled', no_show: 'No Show',
};

export interface ExportOptions {
  period: string;
  dateRange: { startDate: string; endDate: string };
  dispensaryName?: string;
  doctorName?: string;
}

// ── Shared helpers ──

const addPageFooters = (doc: jsPDF) => {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  const pages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.muted);
    doc.text(`Generated on ${new Date().toLocaleString()}`, margin, pageHeight - 8);
    doc.text(`Page ${i} of ${pages}`, pageWidth - margin, pageHeight - 8, { align: 'right' });
  }
};

const drawHeader = (doc: jsPDF, title: string, options: ExportOptions): number => {
  const pageWidth = doc.internal.pageSize.width;
  const margin = 15;

  doc.setFillColor(...COLORS.brand);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, margin, 12);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const periodLabel = options.period.charAt(0).toUpperCase() + options.period.slice(1);
  const start = formatDate(options.dateRange.startDate);
  const end = formatDate(options.dateRange.endDate);
  const dateLabel = start === end ? start : `${start} - ${end}`;
  doc.text(`${periodLabel} Report | ${dateLabel}`, margin, 22);

  if (options.dispensaryName) {
    doc.text(`Dispensary: ${options.dispensaryName}`, pageWidth - margin, 12, { align: 'right' });
  }
  if (options.doctorName) {
    doc.text(`Doctor: ${options.doctorName}`, pageWidth - margin, 22, { align: 'right' });
  }

  return 36; // y position after header
};

const drawSummarySection = (doc: jsPDF, data: ComprehensiveReportResponse, startY: number): number => {
  const margin = 15;
  const pageWidth = doc.internal.pageSize.width;
  let y = startY;

  // Booking summary
  doc.setTextColor(...COLORS.dark);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Booking Summary', margin, y);
  y += 8;

  const { summary, revenue } = data;
  const summaryRows = [
    [`Total: ${summary.total}`, `Completed: ${summary.completed}`, `Scheduled: ${summary.scheduled}`],
    [`Checked In: ${summary.checkedIn}`, `Cancelled: ${summary.cancelled}`, `No Show: ${summary.noShow}`],
  ];

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.body);
  summaryRows.forEach(row => {
    row.forEach((item, i) => {
      doc.text(item, margin + i * 90, y);
    });
    y += 7;
  });
  y += 5;

  // Revenue box
  doc.setFillColor(...COLORS.lightBg);
  doc.rect(margin, y, pageWidth - 2 * margin, 24, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.brand);
  doc.text('Revenue Summary', margin + 5, y + 7);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.body);
  const revItems = [
    `Total Fee: Rs. ${fmt(revenue.totalFee)}`,
    `Doctor Fee: Rs. ${fmt(revenue.doctorFee)}`,
    `Dispensary Fee: Rs. ${fmt(revenue.dispensaryFee)}`,
    `Commission: Rs. ${fmt(revenue.bookingCommission)}`,
    `Realized: Rs. ${fmt(revenue.realizedRevenue)}`,
  ];
  revItems.forEach((item, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    doc.text(item, margin + 5 + col * 90, y + 14 + row * 6);
  });
  y += 32;

  return y;
};

// ── Export: Bookings only ──

export const exportBookingsReportToPDF = (
  data: ComprehensiveReportResponse,
  options: ExportOptions
) => {
  const doc = new jsPDF('l', 'mm', 'a4');
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;

  let y = drawHeader(doc, 'MyClinic - Booking Details Report', options);
  y = drawSummarySection(doc, data, y);

  if (data.bookings.length > 0) {
    if (y + 40 > pageHeight - 20) { doc.addPage(); y = 20; }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text(`Booking Details (${data.bookings.length} records)`, margin, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['#', 'Date', 'Time', 'Patient', 'Phone', 'Doctor', 'Dispensary', 'Status', 'Total Fee']],
      body: data.bookings.map((b, i) => [
        String(i + 1),
        formatDate(b.bookingDate),
        b.timeSlot || '',
        b.patientName || '',
        b.patientPhone || '',
        b.doctorName || '',
        b.dispensaryName || '',
        STATUS_LABELS[b.status] || b.status,
        b.fees?.totalFee?.toFixed(2) || '-',
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: COLORS.brand, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: COLORS.lightBg },
      columnStyles: {
        0: { cellWidth: 10 },
        8: { halign: 'right' as const },
      },
    });
  }

  addPageFooters(doc);
  doc.save(`Booking_Details_${options.period}_${new Date().toISOString().split('T')[0]}.pdf`);
};

// ── Export: Revenue only ──

export const exportRevenueReportToPDF = (
  data: ComprehensiveReportResponse,
  options: ExportOptions
) => {
  const doc = new jsPDF('l', 'mm', 'a4');
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;

  let y = drawHeader(doc, 'MyClinic - Revenue Report', options);
  y = drawSummarySection(doc, data, y);

  if (data.topDoctors.length > 0) {
    if (y + 40 > pageHeight - 20) { doc.addPage(); y = 20; }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text('Revenue by Doctor', margin, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Doctor', 'Bookings', 'Total Fee', 'Doctor Fee', 'Dispensary Fee', 'Commission', 'CP Fee']],
      body: data.topDoctors.map(d => [
        d.doctorName,
        String(d.bookingCount),
        fmt(d.totalFee),
        fmt(d.doctorFee),
        fmt(d.dispensaryFee),
        fmt(d.bookingCommission),
        fmt(d.channelPartnerFee),
      ]),
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: COLORS.brand, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: COLORS.lightBg },
    });
  }

  addPageFooters(doc);
  doc.save(`Revenue_Report_${options.period}_${new Date().toISOString().split('T')[0]}.pdf`);
};

// ── Export: Full comprehensive (both) ──

export const exportComprehensiveReportToPDF = (
  data: ComprehensiveReportResponse,
  options: ExportOptions
) => {
  const doc = new jsPDF('l', 'mm', 'a4');
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;

  let y = drawHeader(doc, 'MyClinic - Comprehensive Report', options);
  y = drawSummarySection(doc, data, y);

  // Revenue by Doctor table
  if (data.topDoctors.length > 0) {
    if (y + 40 > pageHeight - 20) { doc.addPage(); y = 20; }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text('Revenue by Doctor', margin, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Doctor', 'Bookings', 'Total Fee', 'Doctor Fee', 'Dispensary Fee', 'Commission', 'CP Fee']],
      body: data.topDoctors.map(d => [
        d.doctorName,
        String(d.bookingCount),
        fmt(d.totalFee),
        fmt(d.doctorFee),
        fmt(d.dispensaryFee),
        fmt(d.bookingCommission),
        fmt(d.channelPartnerFee),
      ]),
      styles: { fontSize: 9, cellPadding: 2 },
      headStyles: { fillColor: COLORS.brand, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: COLORS.lightBg },
    });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // Booking Details table
  if (data.bookings.length > 0) {
    if (y + 40 > pageHeight - 20) { doc.addPage(); y = 20; }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text(`Booking Details (${data.bookings.length} records)`, margin, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['#', 'Date', 'Time', 'Patient', 'Phone', 'Doctor', 'Dispensary', 'Status', 'Total Fee']],
      body: data.bookings.map((b, i) => [
        String(i + 1),
        formatDate(b.bookingDate),
        b.timeSlot || '',
        b.patientName || '',
        b.patientPhone || '',
        b.doctorName || '',
        b.dispensaryName || '',
        STATUS_LABELS[b.status] || b.status,
        b.fees?.totalFee?.toFixed(2) || '-',
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: COLORS.brand, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: COLORS.lightBg },
      columnStyles: {
        0: { cellWidth: 10 },
        8: { halign: 'right' as const },
      },
    });
  }

  addPageFooters(doc);
  doc.save(`Comprehensive_Report_${options.period}_${new Date().toISOString().split('T')[0]}.pdf`);
};
