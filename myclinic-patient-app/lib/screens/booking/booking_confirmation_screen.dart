import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:myclinic_patient_app/config/theme.dart';
import 'package:myclinic_patient_app/l10n/translations.dart';
import 'package:myclinic_patient_app/providers/booking_provider.dart';
import 'package:myclinic_patient_app/services/doctor_service.dart';
import 'package:myclinic_patient_app/models/booking.dart';
import 'package:myclinic_patient_app/utils/formatters.dart';
import 'package:myclinic_patient_app/utils/helpers.dart';
import 'package:myclinic_patient_app/utils/pdf_generator.dart';
import 'package:myclinic_patient_app/widgets/buttons/primary_button.dart';
import 'package:myclinic_patient_app/widgets/buttons/outline_button.dart';
import 'package:myclinic_patient_app/widgets/common/booking_qr_dialog.dart';
import 'package:myclinic_patient_app/widgets/common/loading_widget.dart';
import 'package:myclinic_patient_app/widgets/common/error_widget.dart';

class BookingConfirmationScreen extends ConsumerStatefulWidget {
  final String transactionId;
  const BookingConfirmationScreen({super.key, required this.transactionId});

  @override
  ConsumerState<BookingConfirmationScreen> createState() => _BookingConfirmationScreenState();
}

class _BookingConfirmationScreenState extends ConsumerState<BookingConfirmationScreen> {
  Map<String, dynamic>? _replacement;

  Future<void> _fetchReplacement(Map<String, dynamic> booking) async {
    try {
      final doctor = booking['doctorId'] is Map ? booking['doctorId'] : booking['doctor'];
      final dispensary = booking['dispensaryId'] is Map ? booking['dispensaryId'] : booking['dispensary'];
      if (doctor == null || dispensary == null) return;

      final doctorId = (doctor['_id'] ?? doctor['doctorId'] ?? '').toString();
      final dispensaryId = (dispensary['_id'] ?? dispensary['dispensaryId'] ?? '').toString();
      final bookingDate = booking['bookingDate']?.toString() ?? '';
      if (doctorId.isEmpty || dispensaryId.isEmpty || bookingDate.isEmpty) return;

      final dateStr = bookingDate.split('T')[0];
      final result = await ref.read(doctorServiceProvider).getActiveReplacement(doctorId, dispensaryId, dateStr);
      if (mounted && result != null) {
        setState(() => _replacement = result);
      }
    } catch (_) {}
  }

  String _formatDate(String? isoDate) {
    if (isoDate == null || isoDate.isEmpty) return '';
    try {
      final date = DateTime.parse(isoDate);
      return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year}';
    } catch (_) {
      return isoDate;
    }
  }

  @override
  Widget build(BuildContext context) {
    final summary = ref.watch(bookingSummaryProvider(widget.transactionId));

    return Scaffold(
      body: SafeArea(
        child: summary.when(
          data: (data) {
            final booking = data['booking'] ?? data;
            final doctor = booking['doctorId'] is Map
                ? booking['doctorId']
                : (booking['doctor'] is Map ? booking['doctor'] : {});
            final dispensary = booking['dispensaryId'] is Map
                ? booking['dispensaryId']
                : (booking['dispensary'] is Map ? booking['dispensary'] : {});
            final fees = booking['fees'] ?? {};

            // Fetch replacement after summary loads
            if (_replacement == null) {
              WidgetsBinding.instance.addPostFrameCallback((_) => _fetchReplacement(booking));
            }

            return SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  const SizedBox(height: 24),
                  Container(
                    width: 80, height: 80,
                    decoration: const BoxDecoration(color: AppTheme.successLight, shape: BoxShape.circle),
                    child: const Icon(Icons.check_rounded, size: 48, color: AppTheme.success),
                  )
                      .animate()
                      .scale(begin: const Offset(0, 0), duration: 500.ms, curve: Curves.elasticOut),
                  const SizedBox(height: 16),
                  Text(context.tr('bookingConfirmed'),
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: AppTheme.success))
                      .animate(delay: 300.ms).fadeIn(),
                  const SizedBox(height: 24),

                  // Replacement Doctor Warning (fetched separately like web app)
                  if (_replacement != null)
                    Container(
                      margin: const EdgeInsets.only(bottom: 16),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.amber.shade50,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.amber.shade300),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Icon(Icons.swap_horiz_rounded, color: Colors.amber.shade800, size: 28),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(context.tr('replacementDoctor'),
                                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: Colors.amber.shade900)),
                                const SizedBox(height: 6),
                                RichText(
                                  text: TextSpan(
                                    style: TextStyle(fontSize: 13, color: Colors.amber.shade800, height: 1.4),
                                    children: [
                                      TextSpan(text: 'Please note: ', style: TextStyle(color: Colors.amber.shade800)),
                                      TextSpan(text: _replacement!['replacementName'] ?? '', style: TextStyle(fontWeight: FontWeight.w700, color: Colors.amber.shade800)),
                                      TextSpan(text: ' will be attending in place of ', style: TextStyle(color: Colors.amber.shade800)),
                                      TextSpan(text: '${doctor['name'] ?? ''}', style: TextStyle(fontWeight: FontWeight.w700, color: Colors.amber.shade800)),
                                      TextSpan(
                                        text: ' from ${_formatDate(_replacement!['startDate']?.toString())} to ${_formatDate(_replacement!['endDate']?.toString())}.',
                                        style: TextStyle(color: Colors.amber.shade800),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ).animate(delay: 350.ms).fadeIn(duration: 400.ms),

                  // Transaction ID
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Flexible(child: Text(context.tr('transactionId'), style: const TextStyle(color: AppTheme.textSecondary), overflow: TextOverflow.ellipsis)),
                              Flexible(
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Flexible(
                                      child: Text('#${booking['transactionId'] ?? ''}',
                                        style: const TextStyle(fontWeight: FontWeight.w600), overflow: TextOverflow.ellipsis),
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.copy_rounded, size: 18),
                                      onPressed: () => copyToClipboard(context, booking['transactionId'] ?? ''),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const Divider(),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text('${context.tr('appointmentNumber')} #', style: const TextStyle(color: AppTheme.textSecondary)),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                decoration: BoxDecoration(
                                  color: AppTheme.primarySurface,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  '${booking['appointmentNumber'] ?? '-'}',
                                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: AppTheme.primary),
                                ),
                              ),
                            ],
                          ),
                          if (booking['estimatedTime'] != null) ...[
                            const SizedBox(height: 8),
                            Text('${context.tr('estimatedTime')}: ${booking['estimatedTime']}',
                              style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13)),
                          ],
                        ],
                      ),
                    ),
                  ).animate(delay: 400.ms).fadeIn(duration: 400.ms),

                  const SizedBox(height: 12),

                  // Details
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _DetailRow(Icons.medical_services_rounded, context.tr('doctor'),
                            '${doctor['name'] ?? ''} - ${doctor['specialization'] ?? ''}'),
                          _DetailRow(Icons.local_hospital_rounded, context.tr('dispensary'),
                            '${dispensary['name'] ?? ''}'),
                          _DetailRow(Icons.location_on_rounded, context.tr('address'),
                            '${dispensary['address'] ?? ''}'),
                          _DetailRow(Icons.calendar_today_rounded, context.tr('date'),
                            Formatters.formatDate(booking['bookingDate'])),
                          _DetailRow(Icons.access_time_rounded, context.tr('time'),
                            '${booking['timeSlot'] ?? ''}'),
                          _DetailRow(Icons.person_rounded, context.tr('patient'),
                            '${booking['patientName'] ?? booking['patient']?['name'] ?? ''}'),
                        ],
                      ),
                    ),
                  ).animate(delay: 500.ms).fadeIn(duration: 400.ms),

                  const SizedBox(height: 12),

                  // Fees
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(context.tr('feeSummary'), style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                          const SizedBox(height: 8),
                          _FeeItem(context.tr('doctorFee'), (fees['doctorFee'] ?? 0).toDouble()),
                          _FeeItem(context.tr('dispensaryFee'), (fees['dispensaryFee'] ?? 0).toDouble()),
                          _FeeItem(context.tr('bookingFee'), (fees['bookingCommission'] ?? 0).toDouble()),
                          const Divider(),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(context.tr('total'), style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                              Text(Formatters.formatCurrency((fees['totalFee'] ?? fees['totalAmount'] ?? 0).toDouble()),
                                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 18, color: AppTheme.primary)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ).animate(delay: 600.ms).fadeIn(duration: 400.ms),

                  const SizedBox(height: 16),

                  // QR Code & Download PDF
                  Row(
                    children: [
                      Expanded(
                        child: OutlineAppButton(
                          text: 'QR Code',
                          icon: Icons.qr_code_2_rounded,
                          onPressed: () => showBookingQrDialog(
                            context,
                            buildQrDataFromMap(booking is Map<String, dynamic> ? booking : Map<String, dynamic>.from(booking)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: OutlineAppButton(
                          text: context.tr('downloadPdf'),
                          icon: Icons.picture_as_pdf_rounded,
                          onPressed: () {
                            try {
                              final b = Booking.fromJson(booking is Map<String, dynamic> ? booking : Map<String, dynamic>.from(booking));
                              PdfGenerator.printBookingPdf(b, replacementDoctor: _replacement);
                            } catch (_) {
                              showSnackBar(context, 'Failed to generate PDF', isError: true);
                            }
                          },
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  PrimaryButton(
                    text: context.tr('viewMyBookings'),
                    icon: Icons.calendar_today_rounded,
                    onPressed: () {
                      ref.read(bookingFlowProvider.notifier).reset();
                      context.go('/my-bookings');
                    },
                  ),
                  const SizedBox(height: 12),
                  OutlineAppButton(
                    text: context.tr('bookAnother'),
                    icon: Icons.add_rounded,
                    onPressed: () {
                      ref.read(bookingFlowProvider.notifier).reset();
                      context.push('/booking');
                    },
                  ),
                  const SizedBox(height: 12),
                  TextButton(
                    onPressed: () {
                      ref.read(bookingFlowProvider.notifier).reset();
                      context.go('/');
                    },
                    child: Text(context.tr('backToHome')),
                  ),
                ],
              ),
            );
          },
          loading: () => LoadingWidget(message: context.tr('loading')),
          error: (e, _) => AppErrorWidget(
            message: 'Failed to load booking confirmation',
            onRetry: () => ref.invalidate(bookingSummaryProvider(widget.transactionId)),
          ),
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _DetailRow(this.icon, this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: AppTheme.primary),
          const SizedBox(width: 10),
          SizedBox(width: 80, child: Text(label, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13), overflow: TextOverflow.ellipsis)),
          Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13), overflow: TextOverflow.ellipsis, maxLines: 2)),
        ],
      ),
    );
  }
}

class _FeeItem extends StatelessWidget {
  final String label;
  final double amount;
  const _FeeItem(this.label, this.amount);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Flexible(child: Text(label, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 14), overflow: TextOverflow.ellipsis)),
          Text(Formatters.formatCurrency(amount), style: const TextStyle(fontSize: 14)),
        ],
      ),
    );
  }
}
