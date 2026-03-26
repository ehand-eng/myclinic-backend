import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:myclinic_patient_app/config/theme.dart';
import 'package:myclinic_patient_app/l10n/translations.dart';
import 'package:myclinic_patient_app/providers/booking_provider.dart';
import 'package:myclinic_patient_app/services/booking_service.dart';
import 'package:myclinic_patient_app/services/doctor_service.dart';
import 'package:myclinic_patient_app/utils/formatters.dart';
import 'package:myclinic_patient_app/utils/helpers.dart';
import 'package:myclinic_patient_app/utils/pdf_generator.dart';
import 'package:myclinic_patient_app/widgets/buttons/outline_button.dart';
import 'package:myclinic_patient_app/widgets/common/booking_qr_dialog.dart';
import 'package:myclinic_patient_app/widgets/common/loading_widget.dart';
import 'package:myclinic_patient_app/widgets/common/error_widget.dart';
import 'package:myclinic_patient_app/widgets/common/status_badge.dart';

class BookingDetailScreen extends ConsumerWidget {
  final String bookingId;
  const BookingDetailScreen({super.key, required this.bookingId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final booking = ref.watch(bookingByIdProvider(bookingId));

    return Scaffold(
      appBar: AppBar(
        title: Text(context.tr('bookingDetails')),
        actions: [
          if (booking.valueOrNull != null)
            IconButton(
              icon: const Icon(Icons.qr_code_2_rounded),
              tooltip: 'QR Code',
              onPressed: () {
                final b = booking.valueOrNull!;
                showBookingQrDialog(context, {
                  'bookingId': b.id,
                  'transactionId': b.transactionId,
                  'phone': b.patientPhone,
                  'doctor': b.doctorName,
                  'dispensary': b.dispensaryName,
                  'date': b.bookingDate.split('T')[0],
                  'time': b.timeSlot,
                  'aptNo': b.appointmentNumber,
                  'estTime': b.estimatedTime,
                });
              },
            ),
        ],
      ),
      body: booking.when(
        data: (b) => SingleChildScrollView(
          child: Column(
            children: [
              // Status Banner
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
                color: AppTheme.statusBgColor(b.status),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(AppTheme.statusIcon(b.status), color: AppTheme.statusColor(b.status)),
                    const SizedBox(width: 8),
                    Flexible(
                      child: Text(
                        AppTheme.statusLabel(b.status),
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: AppTheme.statusColor(b.status)),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ).animate().fadeIn(duration: 300.ms),

              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    // Appointment Info
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Flexible(
                                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                    Text(context.tr('transactionId'), style: const TextStyle(color: AppTheme.textSecondary, fontSize: 12)),
                                    Row(children: [
                                      Flexible(child: Text('#${b.transactionId}', style: const TextStyle(fontWeight: FontWeight.w600), overflow: TextOverflow.ellipsis)),
                                      IconButton(icon: const Icon(Icons.copy_rounded, size: 16), onPressed: () => copyToClipboard(context, b.transactionId)),
                                    ]),
                                  ]),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                  decoration: BoxDecoration(color: AppTheme.primarySurface, borderRadius: BorderRadius.circular(12)),
                                  child: Column(children: [
                                    const Text('Apt. No', style: TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
                                    Text('${b.appointmentNumber}', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: AppTheme.primary)),
                                  ]),
                                ),
                              ],
                            ),
                            const Divider(height: 20),
                            _InfoRow(Icons.calendar_today_rounded, context.tr('date'), Formatters.formatDate(b.bookingDate)),
                            _InfoRow(Icons.access_time_rounded, context.tr('time'), b.timeSlot),
                            if (b.estimatedTime.isNotEmpty)
                              _InfoRow(Icons.timer_rounded, context.tr('estimatedTime'), b.estimatedTime),
                          ],
                        ),
                      ),
                    ).animate().fadeIn(delay: 100.ms, duration: 400.ms),

                    const SizedBox(height: 12),

                    // Doctor Info
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(context.tr('doctor'), style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                            const SizedBox(height: 8),
                            _InfoRow(Icons.medical_services_rounded, context.tr('name'), b.doctorName),
                            if (b.doctorSpecialization.isNotEmpty)
                              _InfoRow(Icons.workspace_premium_rounded, context.tr('specialization'), b.doctorSpecialization),
                          ],
                        ),
                      ),
                    ).animate().fadeIn(delay: 200.ms, duration: 400.ms),

                    const SizedBox(height: 12),

                    // Dispensary Info
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(context.tr('dispensary'), style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                            const SizedBox(height: 8),
                            _InfoRow(Icons.local_hospital_rounded, context.tr('name'), b.dispensaryName),
                            if (b.dispensaryAddress.isNotEmpty)
                              _InfoRow(Icons.location_on_rounded, context.tr('address'), b.dispensaryAddress),
                          ],
                        ),
                      ),
                    ).animate().fadeIn(delay: 300.ms, duration: 400.ms),

                    const SizedBox(height: 12),

                    // Fee Info
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(context.tr('feeBreakdown'), style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
                                StatusBadge(status: b.isPaid ? 'completed' : 'scheduled'),
                              ],
                            ),
                            const SizedBox(height: 8),
                            _FeeRow(context.tr('doctorFee'), b.fees.doctorFee),
                            _FeeRow(context.tr('dispensaryFee'), b.fees.dispensaryFee),
                            _FeeRow(context.tr('bookingFee'), b.fees.bookingCommission),
                            const Divider(),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(context.tr('total'), style: const TextStyle(fontWeight: FontWeight.w700)),
                                Text(Formatters.formatCurrency(b.fees.totalFee),
                                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16, color: AppTheme.primary)),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ).animate().fadeIn(delay: 400.ms, duration: 400.ms),

                    const SizedBox(height: 12),

                    // Payment & Visit status indicators
                    Row(
                      children: [
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                            decoration: BoxDecoration(
                              color: b.isPaid ? AppTheme.successLight : AppTheme.errorLight,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Container(width: 8, height: 8, decoration: BoxDecoration(
                                  color: b.isPaid ? AppTheme.success : AppTheme.error, shape: BoxShape.circle)),
                                const SizedBox(width: 6),
                                Text(b.isPaid ? context.tr('paid') : context.tr('unpaid'),
                                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600,
                                    color: b.isPaid ? AppTheme.success : AppTheme.error)),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                            decoration: BoxDecoration(
                              color: b.isPatientVisited ? AppTheme.successLight : AppTheme.borderLight,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Container(width: 8, height: 8, decoration: BoxDecoration(
                                  color: b.isPatientVisited ? AppTheme.success : AppTheme.textLight, shape: BoxShape.circle)),
                                const SizedBox(width: 6),
                                Text(b.isPatientVisited ? 'Visited' : 'Not Visited',
                                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600,
                                    color: b.isPatientVisited ? AppTheme.success : AppTheme.textSecondary)),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 16),

                    // 24-hour warning
                    if (b.isScheduledButLocked)
                      Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.amber.shade50,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.amber.shade300),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.warning_amber_rounded, color: Colors.amber.shade700, size: 22),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                context.tr('within24HoursWarning'),
                                style: TextStyle(fontSize: 12, color: Colors.amber.shade800),
                              ),
                            ),
                          ],
                        ),
                      ),

                    // Actions — show for all scheduled bookings (disabled when within 24h)
                    if (b.status == 'scheduled') ...[
                      Opacity(
                        opacity: b.canAmend ? 1.0 : 0.5,
                        child: OutlineAppButton(
                          text: context.tr('amendBooking'),
                          icon: Icons.edit_calendar_rounded,
                          onPressed: b.canAmend ? () => context.push('/amend-booking/${b.id}') : null,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Opacity(
                        opacity: b.canCancel ? 1.0 : 0.5,
                        child: OutlineAppButton(
                          text: context.tr('cancelBooking'),
                          icon: Icons.cancel_rounded,
                          color: AppTheme.error,
                          onPressed: b.canCancel ? () => _showCancelDialog(context, ref, b.id) : null,
                        ),
                      ),
                    ],
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: OutlineAppButton(
                            text: 'QR Code',
                            icon: Icons.qr_code_2_rounded,
                            onPressed: () => showBookingQrDialog(context, {
                              'transactionId': b.transactionId,
                              'phone': b.patientPhone,
                              'doctor': b.doctorName,
                              'dispensary': b.dispensaryName,
                              'date': b.bookingDate.split('T')[0],
                              'time': b.timeSlot,
                              'aptNo': b.appointmentNumber,
                              'estTime': b.estimatedTime,
                            }),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: OutlineAppButton(
                            text: context.tr('downloadPdf'),
                            icon: Icons.picture_as_pdf_rounded,
                            onPressed: () async {
                              Map<String, dynamic>? replacement;
                              try {
                                final dateStr = b.bookingDate.split('T')[0];
                                replacement = await ref.read(doctorServiceProvider).getActiveReplacement(
                                  b.doctorIdStr, b.dispensaryIdStr, dateStr,
                                );
                              } catch (_) {}
                              PdfGenerator.printBookingPdf(b, replacementDoctor: replacement);
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ],
          ),
        ),
        loading: () => const LoadingWidget(),
        error: (e, _) => AppErrorWidget(
          message: context.tr('error'),
          onRetry: () => ref.invalidate(bookingByIdProvider(bookingId)),
        ),
      ),
    );
  }

  void _showCancelDialog(BuildContext context, WidgetRef ref, String id) {
    final reasonCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(context.tr('cancelBooking')),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(context.tr('cancelReason')),
            const SizedBox(height: 12),
            TextField(
              controller: reasonCtrl,
              maxLines: 3,
              decoration: const InputDecoration(
                hintText: 'Reason...',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text(context.tr('back'))),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await ref.read(bookingServiceProvider).cancelBooking(id, reasonCtrl.text.trim());
                ref.invalidate(bookingByIdProvider(id));
                ref.invalidate(myBookingsProvider);
                if (context.mounted) showSnackBar(context, 'Booking cancelled');
              } catch (e) {
                if (context.mounted) showSnackBar(context, 'Failed to cancel', isError: true);
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.error),
            child: Text(context.tr('cancelBooking')),
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _InfoRow(this.icon, this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppTheme.primary),
          const SizedBox(width: 10),
          SizedBox(width: 90, child: Text(label, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13), overflow: TextOverflow.ellipsis)),
          Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13), overflow: TextOverflow.ellipsis, maxLines: 2)),
        ],
      ),
    );
  }
}

class _FeeRow extends StatelessWidget {
  final String label;
  final double amount;
  const _FeeRow(this.label, this.amount);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Flexible(child: Text(label, style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13), overflow: TextOverflow.ellipsis)),
          Text(Formatters.formatCurrency(amount), style: const TextStyle(fontSize: 13)),
        ],
      ),
    );
  }
}
