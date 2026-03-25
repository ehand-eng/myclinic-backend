import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:myclinic_patient_app/models/booking.dart';
import 'package:myclinic_patient_app/utils/formatters.dart';

class PdfGenerator {
  static String _formatPdfDate(String? isoDate) {
    if (isoDate == null || isoDate.isEmpty) return '';
    try {
      final date = DateTime.parse(isoDate);
      final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return '${months[date.month - 1]} ${date.day.toString().padLeft(2, '0')}, ${date.year}';
    } catch (_) {
      return isoDate;
    }
  }

  static Future<void> printBookingPdf(Booking booking, {Map<String, dynamic>? replacementDoctor}) async {
    final doc = pw.Document();

    doc.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        build: (context) => pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            // Header
            pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              children: [
                pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text('MyClinic',
                        style: pw.TextStyle(fontSize: 28, fontWeight: pw.FontWeight.bold, color: PdfColors.blue800)),
                    pw.SizedBox(height: 4),
                    pw.Text('Booking Confirmation', style: const pw.TextStyle(fontSize: 14, color: PdfColors.grey700)),
                  ],
                ),
                pw.Container(
                  padding: const pw.EdgeInsets.all(8),
                  decoration: pw.BoxDecoration(
                    border: pw.Border.all(color: PdfColors.blue800),
                    borderRadius: pw.BorderRadius.circular(8),
                  ),
                  child: pw.Column(
                    children: [
                      pw.Text('Appointment #', style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey600)),
                      pw.Text('${booking.appointmentNumber}',
                          style: pw.TextStyle(fontSize: 24, fontWeight: pw.FontWeight.bold, color: PdfColors.blue800)),
                    ],
                  ),
                ),
              ],
            ),
            pw.Divider(thickness: 2, color: PdfColors.blue800),
            pw.SizedBox(height: 16),

            // Transaction ID
            pw.Row(children: [
              pw.Text('Transaction ID: ', style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
              pw.Text('#${booking.transactionId}'),
            ]),
            pw.SizedBox(height: 4),
            pw.Row(children: [
              pw.Text('Status: ', style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
              pw.Text(Formatters.statusLabel(booking.status)),
            ]),
            pw.SizedBox(height: 16),

            // Replacement Doctor (if any)
            if (replacementDoctor != null && (replacementDoctor['replacementName'] ?? '').toString().isNotEmpty) ...[
              pw.Container(
                padding: const pw.EdgeInsets.all(10),
                decoration: pw.BoxDecoration(
                  color: PdfColors.amber50,
                  border: pw.Border.all(color: PdfColors.amber300),
                  borderRadius: pw.BorderRadius.circular(6),
                ),
                child: pw.Row(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text('! ', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, color: PdfColors.amber800, fontSize: 14)),
                    pw.Expanded(
                      child: pw.Column(
                        crossAxisAlignment: pw.CrossAxisAlignment.start,
                        children: [
                          pw.Text('Replacement Doctor',
                              style: pw.TextStyle(fontWeight: pw.FontWeight.bold, color: PdfColors.amber900, fontSize: 12)),
                          pw.SizedBox(height: 4),
                          pw.RichText(
                            text: pw.TextSpan(
                              style: const pw.TextStyle(fontSize: 11, color: PdfColors.amber800),
                              children: [
                                const pw.TextSpan(text: 'Please note: '),
                                pw.TextSpan(text: '${replacementDoctor['replacementName']}',
                                    style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
                                const pw.TextSpan(text: ' will be attending in place of '),
                                pw.TextSpan(text: booking.doctorName.isNotEmpty ? booking.doctorName : 'the doctor',
                                    style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
                                if ((replacementDoctor['startDate'] ?? '').toString().isNotEmpty)
                                  pw.TextSpan(
                                      text: ' from ${_formatPdfDate(replacementDoctor['startDate']?.toString())} to ${_formatPdfDate(replacementDoctor['endDate']?.toString())}'),
                                const pw.TextSpan(text: '.'),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              pw.SizedBox(height: 16),
            ],

            // Appointment Details
            pw.Text('Appointment Details',
                style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold, color: PdfColors.blue800)),
            pw.SizedBox(height: 8),
            _pdfRow('Date', Formatters.formatDate(booking.bookingDate)),
            _pdfRow('Time Slot', booking.timeSlot),
            _pdfRow('Estimated Time', booking.estimatedTime),
            pw.SizedBox(height: 16),

            // Doctor Details
            pw.Text('Doctor Details',
                style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold, color: PdfColors.blue800)),
            pw.SizedBox(height: 8),
            _pdfRow('Name', booking.doctorName),
            _pdfRow('Specialization', booking.doctorSpecialization),
            pw.SizedBox(height: 16),

            // Dispensary Details
            pw.Text('Dispensary Details',
                style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold, color: PdfColors.blue800)),
            pw.SizedBox(height: 8),
            _pdfRow('Name', booking.dispensaryName),
            _pdfRow('Address', booking.dispensaryAddress),
            pw.SizedBox(height: 16),

            // Patient Details
            pw.Text('Patient Details',
                style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold, color: PdfColors.blue800)),
            pw.SizedBox(height: 8),
            _pdfRow('Name', booking.patientName),
            _pdfRow('Phone', booking.patientPhone),
            if (booking.patientEmail != null) _pdfRow('Email', booking.patientEmail!),
            pw.SizedBox(height: 16),

            // Fee Breakdown
            pw.Text('Fee Summary',
                style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold, color: PdfColors.blue800)),
            pw.SizedBox(height: 8),
            _pdfRow('Doctor Fee', Formatters.formatCurrency(booking.fees.doctorFee)),
            _pdfRow('Dispensary Fee', Formatters.formatCurrency(booking.fees.dispensaryFee)),
            _pdfRow('Booking Commission', Formatters.formatCurrency(booking.fees.bookingCommission)),
            pw.Divider(),
            pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              children: [
                pw.Text('Total', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 14)),
                pw.Text(Formatters.formatCurrency(booking.fees.totalFee),
                    style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 14, color: PdfColors.blue800)),
              ],
            ),
            pw.SizedBox(height: 8),
            _pdfRow('Payment Status', booking.isPaid ? 'Paid' : 'Unpaid'),
            pw.Spacer(),

            // Footer
            pw.Divider(color: PdfColors.grey400),
            pw.Center(
              child: pw.Text('Thank you for choosing MyClinic',
                  style: const pw.TextStyle(fontSize: 12, color: PdfColors.grey600)),
            ),
          ],
        ),
      ),
    );

    await Printing.layoutPdf(onLayout: (_) async => doc.save());
  }

  static pw.Widget _pdfRow(String label, String value) {
    return pw.Padding(
      padding: const pw.EdgeInsets.symmetric(vertical: 2),
      child: pw.Row(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.SizedBox(width: 140, child: pw.Text(label, style: const pw.TextStyle(color: PdfColors.grey700))),
          pw.Expanded(child: pw.Text(value)),
        ],
      ),
    );
  }
}
