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
}

// Helper function to draw a simple table with proper text wrapping
const drawSimpleTable = (doc: jsPDF, startX: number, startY: number, data: string[][], columnWidths: number[], lightBlue: number[]) => {
  const baseRowHeight = 6; // Base row height
  
  // Draw data rows directly (no header row)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  let currentY = startY;
  
  for (let i = 0; i < data.length; i++) {
    let currentX = startX;
    let maxLinesInRow = 1; // Track maximum lines needed in this row
    
    // First pass: calculate how many lines each cell needs
    const cellLines = data[i].map((text, index) => {
      const maxWidth = columnWidths[index] - 2;
      const textWidth = doc.getTextWidth(text);
      
      if (textWidth > maxWidth) {
        // Calculate how many lines this text will need
        const words = text.split(' ');
        let line = '';
        let linesCount = 1;
        
        for (const word of words) {
          const testLine = line + (line ? ' ' : '') + word;
          const testWidth = doc.getTextWidth(testLine);
          
          if (testWidth > maxWidth) {
            if (line) {
              line = word;
              linesCount++;
            }
          } else {
            line = testLine;
          }
        }
        return linesCount;
      }
      return 1;
    });
    
    maxLinesInRow = Math.max(...cellLines);
    const rowHeight = baseRowHeight + (maxLinesInRow - 1) * 6; // More generous height for wrapped content
    
    // Second pass: draw the cells and text
    data[i].forEach((text, index) => {
      // Draw cell border
      doc.setDrawColor(lightBlue[0], lightBlue[1], lightBlue[2]);
      doc.setLineWidth(0.3);
      doc.rect(currentX, currentY, columnWidths[index], rowHeight);
      
      // Draw text - make first column bold (field names)
      if (index === 0) {
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setFont('helvetica', 'normal');
      }
      
      // Handle text wrapping
      const maxWidth = columnWidths[index] - 2;
      const textWidth = doc.getTextWidth(text);
      
      if (textWidth > maxWidth) {
        // Split long text into multiple lines
        const words = text.split(' ');
        let line = '';
        let lineY = currentY + 3;
        
        for (const word of words) {
          const testLine = line + (line ? ' ' : '') + word;
          const testWidth = doc.getTextWidth(testLine);
          
          if (testWidth > maxWidth) {
            if (line) {
              doc.text(line, currentX + 1, lineY);
              line = word;
              lineY += 6; // Line spacing to match row height calculation
            }
          } else {
            line = testLine;
          }
        }
        if (line) {
          doc.text(line, currentX + 1, lineY);
        }
      } else {
        // Center text vertically in single-line cells
        doc.text(text, currentX + 1, currentY + 4);
      }
      
      currentX += columnWidths[index];
    });
    
    currentY += rowHeight;
  }
  
  return currentY;
};

export const exportBookingSummaryToPDF = (bookingData: BookingSummaryData) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 10; // Reduced from 20
    const contentWidth = pageWidth - (margin * 2);
    const baseRowHeight = 6; // Define baseRowHeight in main scope
    
    let yPos = margin;
    
    // Compact header with logo placeholder
    doc.setFillColor(66, 139, 202);
    doc.rect(0, 0, pageWidth, 20, 'F'); // Reduced from 30
    
    // Logo placeholder
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, 2, 15, 15, 'F'); // Smaller logo
    doc.setFontSize(6); // Smaller font
    doc.setTextColor(66, 139, 202);
    doc.text('LOGO', margin + 7.5, 11, { align: 'center' });
    
    // Company name
    doc.setFontSize(10); // Reduced from 14
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('DocSpot Connect', margin + 20, 12);
    
    yPos = 30; // Reduced from 45
    
    // Title
    doc.setFontSize(12); // Reduced from 16
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('BOOKING CONFIRMATION', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8; // Reduced from 15
    
    // Booking Reference
    doc.setFontSize(8); // Reduced from 10
    doc.setFont('helvetica', 'normal');
    doc.text(`Booking Reference: ${bookingData.transactionId}`, margin, yPos);
    yPos += 10; // Reduced from 20
    
    // Light blue color for borders
    const lightBlue = [173, 216, 230]; // Light blue color
    
    // Appointment Details Table
    doc.setFontSize(9); // Reduced from 12
    doc.setFont('helvetica', 'bold');
    doc.text('APPOINTMENT DETAILS', margin, yPos);
    yPos += 5; // Reduced from 8
    
    const appointmentData = [
      ['Date', bookingData.bookingDate.toLocaleDateString()],
      ['Time Slot', bookingData.timeSlot],
      ['Appointment Number', `#${bookingData.appointmentNumber}`],
      ['Estimated Time', bookingData.estimatedTime],
      ['Status', bookingData.status.toUpperCase()]
    ];
    
    yPos = drawSimpleTable(doc, margin, yPos, appointmentData, [50, 90], lightBlue) + 8; // Proper spacing
    
    // Patient Information Table
    doc.setFontSize(9); // Reduced from 12
    doc.setFont('helvetica', 'bold');
    doc.text('PATIENT INFORMATION', margin, yPos);
    yPos += 6; // Proper spacing after heading
    
    const patientData = [
      ['Full Name', bookingData.patient.name],
      ['Phone Number', bookingData.patient.phone],
      ...(bookingData.patient.email ? [['Email', bookingData.patient.email]] : [])
    ];
    
    yPos = drawSimpleTable(doc, margin, yPos, patientData, [50, 90], lightBlue) + 8; // Proper spacing
    
    // Healthcare Provider Table
    doc.setFontSize(9); // Reduced from 12
    doc.setFont('helvetica', 'bold');
    doc.text('HEALTHCARE PROVIDER', margin, yPos);
    yPos += 6; // Proper spacing after heading
    
    const providerData = [
      ['Doctor Name', bookingData.doctor.name],
      ['Specialization', bookingData.doctor.specialization],
      ['Dispensary', bookingData.dispensary.name],
      ['Address', bookingData.dispensary.address]
    ];
    
    yPos = drawSimpleTable(doc, margin, yPos, providerData, [50, 90], lightBlue) + 8; // Same width as other tables
    
    // Fee Breakdown Table
    if (bookingData.fees) {
      doc.setFontSize(9); // Reduced from 12
      doc.setFont('helvetica', 'bold');
      doc.text('FEE BREAKDOWN', margin, yPos);
      yPos += 6; // Proper spacing after heading
      
      const feeData = [
        ['Doctor Fee', `Rs ${bookingData.fees.doctorFee}`],
        ['Dispensary Fee', `Rs ${bookingData.fees.dispensaryFee}`],
        ['Booking Commission', `Rs ${bookingData.fees.bookingCommission}`],
        ['TOTAL AMOUNT', `Rs ${bookingData.fees.totalAmount}`]
      ];
      
      yPos = drawSimpleTable(doc, margin, yPos, feeData, [70, 70], lightBlue) + 8; // Proper spacing
      
      // Highlight the total amount row - calculate the position of the last row
      const lastRowHeight = baseRowHeight; // Assuming single line for total amount
      const totalRowY = yPos - 8 - lastRowHeight;
      
      // Draw highlight background
      doc.setFillColor(240, 248, 255);
      doc.rect(margin, totalRowY, 140, lastRowHeight, 'F');
      
      // Redraw borders for the highlighted row
      doc.setDrawColor(lightBlue[0], lightBlue[1], lightBlue[2]);
      doc.setLineWidth(0.3);
      doc.rect(margin, totalRowY, 70, lastRowHeight);
      doc.rect(margin + 70, totalRowY, 70, lastRowHeight);
      
      // Redraw the total amount text in green
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 100, 0);
      doc.text('TOTAL AMOUNT', margin + 1, totalRowY + 4);
      doc.text(`Rs ${bookingData.fees.totalAmount}`, margin + 71, totalRowY + 4);
    }
    
    // Compact footer
    const footerY = pageHeight - 10; // Reduced from 20
    doc.setFontSize(6); // Reduced from 8
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text('Thank you for choosing DocSpot Connect', pageWidth / 2, footerY, { align: 'center' });
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, footerY + 4, { align: 'center' }); // Reduced spacing
    
    // Save the PDF
    const fileName = `Booking_Confirmation_${bookingData.transactionId}.pdf`;
    doc.save(fileName);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF: ' + (error as Error).message);
  }
};
