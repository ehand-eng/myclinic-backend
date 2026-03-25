import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:intl/intl.dart';

/// Colors matching the web app's PDF export
const _brand = PdfColor.fromInt(0xFF1977CC);
const _dark = PdfColor.fromInt(0xFF1E293B);
const _body = PdfColor.fromInt(0xFF475569);
const _muted = PdfColor.fromInt(0xFF94A3B8);
const _lightBg = PdfColor.fromInt(0xFFF8FAFC);
const _white = PdfColors.white;

String _fmt(dynamic val) {
  if (val == null) return '0.00';
  final n = (val is num) ? val.toDouble() : double.tryParse('$val') ?? 0;
  return n.toStringAsFixed(2);
}

String _fmtDate(dynamic val) {
  if (val == null) return 'N/A';
  try {
    return DateFormat('MMM dd, yyyy').format(DateTime.parse('$val').toLocal());
  } catch (_) {
    return '$val';
  }
}

String _statusLabel(String status) {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'scheduled':
      return 'Scheduled';
    case 'checked_in':
      return 'Checked In';
    case 'cancelled':
      return 'Cancelled';
    case 'no_show':
      return 'No Show';
    default:
      return status;
  }
}

/// Export comprehensive report (both bookings + revenue) as PDF
Future<void> exportComprehensiveReportToPDF({
  required Map<String, dynamic> data,
  required String period,
  required String startDate,
  required String endDate,
  String? dispensaryName,
  String? doctorName,
}) async {
  final pdf = pw.Document();
  final summary = data['summary'] as Map<String, dynamic>? ?? {};
  final revenue = data['revenue'] as Map<String, dynamic>? ?? {};
  final bookings = data['bookings'] as List? ?? [];
  final topDoctors = data['topDoctors'] as List? ?? [];
  final dateRange = '${_fmtDate(startDate)} - ${_fmtDate(endDate)}';

  pdf.addPage(
    pw.MultiPage(
      pageFormat: PdfPageFormat.a4.landscape,
      margin: const pw.EdgeInsets.all(15 * PdfPageFormat.mm),
      header: (context) => _buildHeader(
        title: 'Comprehensive Report',
        period: period,
        dateRange: dateRange,
        dispensaryName: dispensaryName,
        doctorName: doctorName,
      ),
      footer: _buildFooter,
      build: (context) => [
        // Booking summary
        _buildSummarySection(summary),
        pw.SizedBox(height: 10),
        // Revenue summary
        _buildRevenueBox(revenue),
        pw.SizedBox(height: 14),
        // Revenue by doctor table
        if (topDoctors.isNotEmpty) ...[
          _buildSectionTitle('Revenue by Doctor (${topDoctors.length})'),
          pw.SizedBox(height: 4),
          _buildDoctorTable(topDoctors, revenue),
          pw.SizedBox(height: 14),
        ],
        // Booking details table
        if (bookings.isNotEmpty) ...[
          _buildSectionTitle('Booking Details (${bookings.length})'),
          pw.SizedBox(height: 4),
          _buildBookingsTable(bookings),
        ],
      ],
    ),
  );

  final fileName =
      'Comprehensive_Report_${period}_${DateFormat('yyyy-MM-dd').format(DateTime.now())}.pdf';
  await Printing.sharePdf(bytes: await pdf.save(), filename: fileName);
}

/// Export bookings only
Future<void> exportBookingsReportToPDF({
  required Map<String, dynamic> data,
  required String period,
  required String startDate,
  required String endDate,
  String? dispensaryName,
  String? doctorName,
}) async {
  final pdf = pw.Document();
  final summary = data['summary'] as Map<String, dynamic>? ?? {};
  final bookings = data['bookings'] as List? ?? [];
  final dateRange = '${_fmtDate(startDate)} - ${_fmtDate(endDate)}';

  pdf.addPage(
    pw.MultiPage(
      pageFormat: PdfPageFormat.a4.landscape,
      margin: const pw.EdgeInsets.all(15 * PdfPageFormat.mm),
      header: (context) => _buildHeader(
        title: 'Booking Details Report',
        period: period,
        dateRange: dateRange,
        dispensaryName: dispensaryName,
        doctorName: doctorName,
      ),
      footer: _buildFooter,
      build: (context) => [
        _buildSummarySection(summary),
        pw.SizedBox(height: 14),
        if (bookings.isNotEmpty) ...[
          _buildSectionTitle('Booking Details (${bookings.length})'),
          pw.SizedBox(height: 4),
          _buildBookingsTable(bookings),
        ],
      ],
    ),
  );

  final fileName =
      'Booking_Details_${period}_${DateFormat('yyyy-MM-dd').format(DateTime.now())}.pdf';
  await Printing.sharePdf(bytes: await pdf.save(), filename: fileName);
}

/// Export revenue only
Future<void> exportRevenueReportToPDF({
  required Map<String, dynamic> data,
  required String period,
  required String startDate,
  required String endDate,
  String? dispensaryName,
  String? doctorName,
}) async {
  final pdf = pw.Document();
  final revenue = data['revenue'] as Map<String, dynamic>? ?? {};
  final topDoctors = data['topDoctors'] as List? ?? [];
  final dateRange = '${_fmtDate(startDate)} - ${_fmtDate(endDate)}';

  pdf.addPage(
    pw.MultiPage(
      pageFormat: PdfPageFormat.a4.landscape,
      margin: const pw.EdgeInsets.all(15 * PdfPageFormat.mm),
      header: (context) => _buildHeader(
        title: 'Revenue Summary Report',
        period: period,
        dateRange: dateRange,
        dispensaryName: dispensaryName,
        doctorName: doctorName,
      ),
      footer: _buildFooter,
      build: (context) => [
        _buildRevenueBox(revenue),
        pw.SizedBox(height: 14),
        if (topDoctors.isNotEmpty) ...[
          _buildSectionTitle('Revenue by Doctor (${topDoctors.length})'),
          pw.SizedBox(height: 4),
          _buildDoctorTable(topDoctors, revenue),
        ],
      ],
    ),
  );

  final fileName =
      'Revenue_Report_${period}_${DateFormat('yyyy-MM-dd').format(DateTime.now())}.pdf';
  await Printing.sharePdf(bytes: await pdf.save(), filename: fileName);
}

// ─── Building Blocks ─────────────────────────────────────────

pw.Widget _buildHeader({
  required String title,
  required String period,
  required String dateRange,
  String? dispensaryName,
  String? doctorName,
}) {
  return pw.Container(
    width: double.infinity,
    padding: const pw.EdgeInsets.symmetric(horizontal: 14, vertical: 12),
    margin: const pw.EdgeInsets.only(bottom: 10),
    decoration: const pw.BoxDecoration(
      color: _brand,
      borderRadius: pw.BorderRadius.all(pw.Radius.circular(4)),
    ),
    child: pw.Row(
      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Text(title,
                style: pw.TextStyle(
                    color: _white,
                    fontSize: 16,
                    fontWeight: pw.FontWeight.bold)),
            pw.SizedBox(height: 3),
            pw.Text(
                '${period[0].toUpperCase()}${period.substring(1)} | $dateRange',
                style: const pw.TextStyle(color: _white, fontSize: 9)),
          ],
        ),
        pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.end,
          children: [
            if (dispensaryName != null)
              pw.Text(dispensaryName,
                  style: const pw.TextStyle(color: _white, fontSize: 9)),
            if (doctorName != null)
              pw.Text(doctorName,
                  style: const pw.TextStyle(color: _white, fontSize: 9)),
          ],
        ),
      ],
    ),
  );
}

pw.Widget _buildFooter(pw.Context context) {
  return pw.Container(
    width: double.infinity,
    padding: const pw.EdgeInsets.only(top: 6),
    child: pw.Row(
      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
      children: [
        pw.Text(
          'Generated: ${DateFormat('MMM dd, yyyy hh:mm a').format(DateTime.now())}',
          style: const pw.TextStyle(color: _muted, fontSize: 7),
        ),
        pw.Text(
          'Page ${context.pageNumber} of ${context.pagesCount}',
          style: const pw.TextStyle(color: _muted, fontSize: 7),
        ),
      ],
    ),
  );
}

pw.Widget _buildSummarySection(Map<String, dynamic> summary) {
  return pw.Row(
    mainAxisAlignment: pw.MainAxisAlignment.spaceAround,
    children: [
      _summaryItem('Total', '${summary['total'] ?? 0}'),
      _summaryItem('Completed', '${summary['completed'] ?? 0}'),
      _summaryItem('Scheduled', '${summary['scheduled'] ?? 0}'),
      _summaryItem('Checked In', '${summary['checkedIn'] ?? 0}'),
      _summaryItem('Cancelled', '${summary['cancelled'] ?? 0}'),
      _summaryItem('No Show', '${summary['noShow'] ?? 0}'),
    ],
  );
}

pw.Widget _summaryItem(String label, String value) {
  return pw.Column(
    children: [
      pw.Text(value,
          style: pw.TextStyle(
              fontSize: 14, fontWeight: pw.FontWeight.bold, color: _dark)),
      pw.SizedBox(height: 2),
      pw.Text(label, style: const pw.TextStyle(fontSize: 8, color: _body)),
    ],
  );
}

pw.Widget _buildRevenueBox(Map<String, dynamic> revenue) {
  return pw.Container(
    width: double.infinity,
    padding: const pw.EdgeInsets.all(10),
    decoration: pw.BoxDecoration(
      color: _lightBg,
      borderRadius: pw.BorderRadius.circular(4),
    ),
    child: pw.Column(
      crossAxisAlignment: pw.CrossAxisAlignment.start,
      children: [
        pw.Text('Revenue Summary',
            style: pw.TextStyle(
                fontSize: 10,
                fontWeight: pw.FontWeight.bold,
                color: _brand)),
        pw.SizedBox(height: 6),
        pw.Row(
          mainAxisAlignment: pw.MainAxisAlignment.spaceAround,
          children: [
            _revenueItem('Total Fee', 'Rs. ${_fmt(revenue['totalFee'])}'),
            _revenueItem('Doctor Fee', 'Rs. ${_fmt(revenue['doctorFee'])}'),
            _revenueItem(
                'Dispensary Fee', 'Rs. ${_fmt(revenue['dispensaryFee'])}'),
            _revenueItem(
                'Commission', 'Rs. ${_fmt(revenue['bookingCommission'])}'),
            _revenueItem('Realized', 'Rs. ${_fmt(revenue['realizedRevenue'])}'),
          ],
        ),
      ],
    ),
  );
}

pw.Widget _revenueItem(String label, String value) {
  return pw.Column(
    children: [
      pw.Text(value,
          style: pw.TextStyle(
              fontSize: 9, fontWeight: pw.FontWeight.bold, color: _dark)),
      pw.SizedBox(height: 1),
      pw.Text(label, style: const pw.TextStyle(fontSize: 7, color: _body)),
    ],
  );
}

pw.Widget _buildSectionTitle(String text) {
  return pw.Text(text,
      style: pw.TextStyle(
          fontSize: 11, fontWeight: pw.FontWeight.bold, color: _dark));
}

pw.Widget _buildBookingsTable(List bookings) {
  return pw.TableHelper.fromTextArray(
    headerStyle:
        pw.TextStyle(fontSize: 7, fontWeight: pw.FontWeight.bold, color: _white),
    headerDecoration: const pw.BoxDecoration(color: _brand),
    cellStyle: const pw.TextStyle(fontSize: 7, color: _body),
    cellPadding: const pw.EdgeInsets.symmetric(horizontal: 4, vertical: 3),
    headerPadding: const pw.EdgeInsets.symmetric(horizontal: 4, vertical: 4),
    oddRowDecoration: const pw.BoxDecoration(color: _lightBg),
    headerAlignments: {
      0: pw.Alignment.centerLeft,
      8: pw.Alignment.centerRight,
    },
    columnWidths: {
      0: const pw.FixedColumnWidth(18), // #
      1: const pw.FixedColumnWidth(55), // Date
      2: const pw.FixedColumnWidth(40), // Time
      3: const pw.FlexColumnWidth(2), // Patient
      4: const pw.FixedColumnWidth(55), // Phone
      5: const pw.FlexColumnWidth(2), // Doctor
      6: const pw.FlexColumnWidth(2), // Dispensary
      7: const pw.FixedColumnWidth(42), // Status
      8: const pw.FixedColumnWidth(45), // Fee
    },
    headers: ['#', 'Date', 'Time', 'Patient', 'Phone', 'Doctor', 'Dispensary', 'Status', 'Total Fee'],
    data: bookings.asMap().entries.map((entry) {
      final i = entry.key;
      final b = entry.value as Map<String, dynamic>;
      final fees = b['fees'] as Map<String, dynamic>? ?? {};
      return [
        '${i + 1}',
        _fmtDate(b['bookingDate']),
        b['timeSlot'] ?? '',
        b['patientName'] ?? 'N/A',
        b['patientPhone'] ?? '',
        b['doctorName'] ?? '',
        b['dispensaryName'] ?? '',
        _statusLabel(b['status'] ?? ''),
        'Rs.${_fmt(fees['totalFee'])}',
      ];
    }).toList(),
  );
}

pw.Widget _buildDoctorTable(
    List topDoctors, Map<String, dynamic> revenue) {
  final rows = topDoctors.map((d) {
    final doc = d as Map<String, dynamic>;
    return [
      doc['doctorName'] ?? 'N/A',
      '${doc['bookingCount'] ?? 0}',
      'Rs.${_fmt(doc['totalFee'])}',
      'Rs.${_fmt(doc['doctorFee'])}',
      'Rs.${_fmt(doc['dispensaryFee'])}',
      'Rs.${_fmt(doc['bookingCommission'])}',
      'Rs.${_fmt(doc['channelPartnerFee'])}',
    ];
  }).toList();

  // Add totals row
  rows.add([
    'TOTAL',
    '${revenue['totalBookings'] ?? topDoctors.fold(0, (sum, d) => sum + ((d as Map)['bookingCount'] ?? 0) as int)}',
    'Rs.${_fmt(revenue['totalFee'])}',
    'Rs.${_fmt(revenue['doctorFee'])}',
    'Rs.${_fmt(revenue['dispensaryFee'])}',
    'Rs.${_fmt(revenue['bookingCommission'])}',
    'Rs.${_fmt(revenue['channelPartnerFee'])}',
  ]);

  return pw.TableHelper.fromTextArray(
    headerStyle:
        pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold, color: _white),
    headerDecoration: const pw.BoxDecoration(color: _brand),
    cellStyle: const pw.TextStyle(fontSize: 8, color: _body),
    cellPadding: const pw.EdgeInsets.symmetric(horizontal: 4, vertical: 3),
    headerPadding: const pw.EdgeInsets.symmetric(horizontal: 4, vertical: 4),
    oddRowDecoration: const pw.BoxDecoration(color: _lightBg),
    headers: [
      'Doctor',
      'Bookings',
      'Total Fee',
      'Doctor Fee',
      'Disp. Fee',
      'Commission',
      'CP Fee'
    ],
    data: rows,
  );
}
