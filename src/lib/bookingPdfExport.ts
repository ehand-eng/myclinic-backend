import jsPDF from 'jspdf';

interface BookingSummaryData {
  transactionId: string;
  bookingDate: Date;
  timeSlot: string;
  appointmentNumber: number;
  estimatedTime: string;
  status: string;
  patient: {
    name: string;
    phone: string;
    email?: string;
  };
  doctor: {
    name: string;
    specialization: string;
  };
  dispensary: {
    name: string;
    address: string;
  };
  fees?: {
    doctorFee: number;
    dispensaryFee: number;
    bookingCommission: number;
    totalAmount: number;
  };
  bookedUser?: string;
  bookedBy?: string;
  replacementDoctor?: {
    name: string;
    startDate: string;
    endDate: string;
  };
}

// ── Color palette ──────────────────────────────────────────────
const COLORS = {
  brand:      { r: 25,  g: 119, b: 204 },   // #1977cc
  brandDark:  { r: 18,  g: 85,  b: 148 },   // darker shade
  brandLight: { r: 232, g: 243, b: 252 },   // very light blue tint
  brandMist:  { r: 241, g: 247, b: 253 },   // near-white blue
  dark:       { r: 30,  g: 41,  b: 59  },   // slate-800
  body:       { r: 71,  g: 85,  b: 105 },   // slate-500
  muted:      { r: 148, g: 163, b: 184 },   // slate-400
  border:     { r: 226, g: 232, b: 240 },   // slate-200
  white:      { r: 255, g: 255, b: 255 },
  success:    { r: 22,  g: 163, b: 74  },   // green-600
  successBg:  { r: 240, g: 253, b: 244 },   // green-50
};

type RGB = { r: number; g: number; b: number };
const setFill  = (doc: jsPDF, c: RGB) => doc.setFillColor(c.r, c.g, c.b);
const setText  = (doc: jsPDF, c: RGB) => doc.setTextColor(c.r, c.g, c.b);
const setDraw  = (doc: jsPDF, c: RGB) => doc.setDrawColor(c.r, c.g, c.b);

// ── Rounded rectangle helper ───────────────────────────────────
const roundedRect = (
  doc: jsPDF, x: number, y: number, w: number, h: number,
  r: number, style: 'S' | 'F' | 'FD' = 'F'
) => {
  doc.roundedRect(x, y, w, h, r, r, style);
};

// ── Text wrapping helper ───────────────────────────────────────
const wrapText = (doc: jsPDF, text: string, maxWidth: number): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (doc.getTextWidth(testLine) > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
};

// ── Section heading ────────────────────────────────────────────
const drawSectionHeading = (
  doc: jsPDF, label: string, y: number, margin: number
): number => {
  // Accent bar
  setFill(doc, COLORS.brand);
  doc.rect(margin, y, 3, 10, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  setText(doc, COLORS.dark);
  doc.text(label.toUpperCase(), margin + 7, y + 7);

  // Thin rule across content width
  setDraw(doc, COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 13, 210 - margin, y + 13);

  return y + 17;
};

// ── Key-value row drawing ──────────────────────────────────────
const drawInfoRow = (
  doc: jsPDF, label: string, value: string,
  x: number, y: number, labelWidth: number, valueWidth: number,
  isAlternate: boolean
): number => {
  const lineHeight = 5;
  const valueLines = wrapText(doc, value, valueWidth - 4);
  const rowHeight = Math.max(8, valueLines.length * lineHeight + 3);

  // Alternating background
  if (isAlternate) {
    setFill(doc, COLORS.brandMist);
    roundedRect(doc, x, y, labelWidth + valueWidth, rowHeight, 1, 'F');
  }

  // Label
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  setText(doc, COLORS.body);
  doc.text(label, x + 4, y + 5.5);

  // Value
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  setText(doc, COLORS.dark);
  valueLines.forEach((line, i) => {
    doc.text(line, x + labelWidth + 4, y + 5.5 + i * lineHeight);
  });

  return y + rowHeight;
};

// ── Info table (draws a group of key-value rows) ───────────────
const drawInfoTable = (
  doc: jsPDF, rows: [string, string][], x: number, y: number,
  labelWidth: number, valueWidth: number
): number => {
  let currentY = y;
  rows.forEach((row, i) => {
    currentY = drawInfoRow(doc, row[0], row[1], x, currentY, labelWidth, valueWidth, i % 2 === 0);
  });
  return currentY;
};

// ── Draw footer on current page ────────────────────────────────
const drawFooter = (doc: jsPDF) => {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  setFill(doc, COLORS.brand);
  doc.rect(0, pageHeight - 18, pageWidth, 0.6, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  setText(doc, COLORS.muted);
  doc.text(
    'Thank you for choosing MyClinic Connect',
    pageWidth / 2, pageHeight - 12,
    { align: 'center' }
  );
  doc.text(
    `Generated on ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })} at ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
    pageWidth / 2, pageHeight - 8,
    { align: 'center' }
  );
};

// ── Main export ────────────────────────────────────────────────
export const exportBookingSummaryToPDF = (bookingData: BookingSummaryData) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 16;
    const contentWidth = pageWidth - margin * 2;
    const labelW = 48;
    const valueW = contentWidth - labelW;

    // Reserve space for footer — content must stay above this line
    const footerZone = 22;
    const maxY = pageHeight - footerZone;

    // Page-break helper: if the next block won't fit, add a page
    const ensureSpace = (needed: number) => {
      if (y + needed > maxY) {
        drawFooter(doc);
        doc.addPage();
        y = margin;
      }
    };

    let y = 0;

    // ═══════════════════════════════════════════════════════════
    // HEADER BAND
    // ═══════════════════════════════════════════════════════════

    setFill(doc, COLORS.brandDark);
    doc.rect(0, 0, pageWidth, 36, 'F');
    setFill(doc, COLORS.brand);
    doc.rect(0, 0, pageWidth, 32, 'F');

    // Subtle decorative circle
    doc.setGState(doc.GState({ opacity: 0.08 }));
    setFill(doc, COLORS.white);
    doc.circle(pageWidth - 20, 16, 28, 'F');
    doc.setGState(doc.GState({ opacity: 1 }));

    // Logo mark — stylized cross in a rounded square
    setFill(doc, COLORS.white);
    roundedRect(doc, margin, 8, 16, 16, 3, 'F');
    setFill(doc, COLORS.brand);
    doc.rect(margin + 4, 14.5, 8, 3, 'F');
    doc.rect(margin + 6.5, 11.5, 3, 9, 'F');

    // Brand name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    setText(doc, COLORS.white);
    doc.text('MyClinic Connect', margin + 20, 18);

    // Tagline
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setGState(doc.GState({ opacity: 0.8 }));
    setText(doc, COLORS.white);
    doc.text('Your Health, Our Priority', margin + 20, 23);
    doc.setGState(doc.GState({ opacity: 1 }));

    y = 42;

    // ═══════════════════════════════════════════════════════════
    // CONFIRMATION BADGE + REFERENCE
    // ═══════════════════════════════════════════════════════════

    setFill(doc, COLORS.successBg);
    roundedRect(doc, pageWidth / 2 - 30, y - 2, 60, 9, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    setText(doc, COLORS.success);
    doc.text('CONFIRMED', pageWidth / 2, y + 4, { align: 'center' });

    y += 12;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    setText(doc, COLORS.dark);
    doc.text('Booking Confirmation', pageWidth / 2, y, { align: 'center' });
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    setText(doc, COLORS.muted);
    doc.text(`Reference: ${bookingData.transactionId}`, pageWidth / 2, y, { align: 'center' });
    y += 3;

    // Decorative divider
    setDraw(doc, COLORS.brand);
    doc.setLineWidth(0.8);
    doc.line(pageWidth / 2 - 16, y, pageWidth / 2 + 16, y);
    y += 8;

    // ═══════════════════════════════════════════════════════════
    // APPOINTMENT QUICK-GLANCE CARDS
    // ═══════════════════════════════════════════════════════════

    const cardGap = 4;
    const cardW = (contentWidth - cardGap * 3) / 4;
    const cardH = 20;
    const cardY = y;

    const quickCards: { label: string; value: string; highlight?: boolean }[] = [
      { label: 'Date', value: bookingData.bookingDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) },
      { label: 'Time Slot', value: bookingData.timeSlot },
      { label: 'Queue No.', value: `#${bookingData.appointmentNumber}`, highlight: true },
      { label: 'Est. Time', value: bookingData.estimatedTime },
    ];

    quickCards.forEach((card, i) => {
      const cx = margin + i * (cardW + cardGap);

      if (card.highlight) {
        setFill(doc, COLORS.brand);
        roundedRect(doc, cx, cardY, cardW, cardH, 3, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        setText(doc, { r: 200, g: 225, b: 255 });
        doc.text(card.label.toUpperCase(), cx + cardW / 2, cardY + 6.5, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        setText(doc, COLORS.white);
        doc.text(card.value, cx + cardW / 2, cardY + 14.5, { align: 'center' });
      } else {
        setFill(doc, COLORS.brandLight);
        roundedRect(doc, cx, cardY, cardW, cardH, 3, 'F');
        setFill(doc, COLORS.brand);
        doc.rect(cx + 4, cardY, cardW - 8, 1, 'F');

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        setText(doc, COLORS.body);
        doc.text(card.label.toUpperCase(), cx + cardW / 2, cardY + 6.5, { align: 'center' });
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        setText(doc, COLORS.dark);
        doc.text(card.value, cx + cardW / 2, cardY + 14.5, { align: 'center' });
      }
    });

    y = cardY + cardH + 10;

    // ═══════════════════════════════════════════════════════════
    // PATIENT INFORMATION
    // ═══════════════════════════════════════════════════════════

    ensureSpace(40);
    y = drawSectionHeading(doc, 'Patient Information', y, margin);

    const patientRows: [string, string][] = [
      ['Full Name', bookingData.patient.name],
      ['Phone', bookingData.patient.phone],
    ];
    if (bookingData.patient.email) {
      patientRows.push(['Email', bookingData.patient.email]);
    }
    y = drawInfoTable(doc, patientRows, margin, y, labelW, valueW) + 8;

    // ═══════════════════════════════════════════════════════════
    // HEALTHCARE PROVIDER
    // ═══════════════════════════════════════════════════════════

    ensureSpace(50);
    y = drawSectionHeading(doc, 'Healthcare Provider', y, margin);

    const providerRows: [string, string][] = [
      ['Doctor', bookingData.doctor.name],
      ['Specialization', bookingData.doctor.specialization],
      ['Dispensary', bookingData.dispensary.name],
      ['Address', bookingData.dispensary.address],
    ];
    y = drawInfoTable(doc, providerRows, margin, y, labelW, valueW);

    // Replacement doctor notice
    if (bookingData.replacementDoctor) {
      y += 4;
      ensureSpace(18);
      const rd = bookingData.replacementDoctor;

      setFill(doc, { r: 255, g: 243, b: 224 }); // amber-50
      setDraw(doc, { r: 245, g: 208, b: 140 }); // amber-300
      doc.setLineWidth(0.3);
      roundedRect(doc, margin, y, contentWidth, 14, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      setText(doc, { r: 146, g: 64, b: 14 }); // amber-800
      doc.text('REPLACEMENT DOCTOR', margin + 5, y + 5.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      setText(doc, { r: 180, g: 83, b: 9 }); // amber-700
      doc.text(
        `Please note: ${rd.name} will be attending in place of ${bookingData.doctor.name} from ${rd.startDate} to ${rd.endDate}.`,
        margin + 5, y + 11
      );

      y += 18;
    } else {
      y += 8;
    }

    // ═══════════════════════════════════════════════════════════
    // FEE BREAKDOWN
    // ═══════════════════════════════════════════════════════════

    if (bookingData.fees) {
      // Fee section needs ~65mm (heading + 3 rows + separator + total card)
      ensureSpace(65);
      y = drawSectionHeading(doc, 'Fee Breakdown', y, margin);

      const formatFee = (n: number) => `Rs ${n.toFixed(2)}`;

      const feeItems: [string, number][] = [
        ['Doctor Fee', bookingData.fees.doctorFee],
        ['Dispensary Fee', bookingData.fees.dispensaryFee],
        ['Booking Commission', bookingData.fees.bookingCommission],
      ];

      feeItems.forEach((item, i) => {
        const isAlt = i % 2 === 0;
        if (isAlt) {
          setFill(doc, COLORS.brandMist);
          roundedRect(doc, margin, y, contentWidth, 8, 1, 'F');
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        setText(doc, COLORS.body);
        doc.text(item[0], margin + 4, y + 5.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        setText(doc, COLORS.dark);
        doc.text(formatFee(item[1]), margin + contentWidth - 4, y + 5.5, { align: 'right' });

        y += 8;
      });

      // Separator line before total
      y += 2;
      setDraw(doc, COLORS.border);
      doc.setLineWidth(0.3);
      doc.line(margin, y, margin + contentWidth, y);
      y += 4;

      // Total amount — prominent card
      setFill(doc, COLORS.brand);
      roundedRect(doc, margin, y, contentWidth, 14, 3, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      setText(doc, { r: 200, g: 225, b: 255 });
      doc.text('TOTAL AMOUNT', margin + 6, y + 9);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      setText(doc, COLORS.white);
      doc.text(formatFee(bookingData.fees.totalAmount), margin + contentWidth - 6, y + 9.5, { align: 'right' });

      y += 20;
    }

    // ═══════════════════════════════════════════════════════════
    // BOOKING META (Booked by info)
    // ═══════════════════════════════════════════════════════════

    if (bookingData.bookedBy || bookingData.bookedUser) {
      ensureSpace(10);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      setText(doc, COLORS.muted);

      const metaParts: string[] = [];
      if (bookingData.bookedUser) metaParts.push(`Booked by: ${bookingData.bookedUser}`);
      if (bookingData.bookedBy) metaParts.push(`Method: ${bookingData.bookedBy}`);
      doc.text(metaParts.join('   |   '), margin, y);
      y += 6;
    }

    // ═══════════════════════════════════════════════════════════
    // IMPORTANT NOTES BOX
    // ═══════════════════════════════════════════════════════════

    ensureSpace(24);

    setFill(doc, COLORS.brandLight);
    roundedRect(doc, margin, y, contentWidth, 20, 3, 'F');
    setDraw(doc, { r: 191, g: 219, b: 243 });
    doc.setLineWidth(0.3);
    roundedRect(doc, margin, y, contentWidth, 20, 3, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    setText(doc, COLORS.brand);
    doc.text('IMPORTANT', margin + 5, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    setText(doc, COLORS.body);
    doc.text('Please arrive 10 minutes before your estimated appointment time.', margin + 5, y + 12);
    doc.text('Bring this confirmation and a valid photo ID to your appointment.', margin + 5, y + 17);

    // ═══════════════════════════════════════════════════════════
    // FOOTER (on final page)
    // ═══════════════════════════════════════════════════════════

    drawFooter(doc);

    // ── Save ───────────────────────────────────────────────────
    const fileName = `Booking_Confirmation_${bookingData.transactionId}.pdf`;
    doc.save(fileName);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF: ' + (error as Error).message);
  }
};
