import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:myclinic_patient_app/config/theme.dart';
import 'package:myclinic_patient_app/l10n/translations.dart';
import 'package:myclinic_patient_app/providers/booking_provider.dart';
import 'package:myclinic_patient_app/utils/formatters.dart';
import 'package:myclinic_patient_app/widgets/buttons/primary_button.dart';
import 'package:myclinic_patient_app/widgets/buttons/outline_button.dart';
import 'package:myclinic_patient_app/widgets/common/loading_widget.dart';

class PaymentSuccessScreen extends ConsumerWidget {
  final String bookingId;
  const PaymentSuccessScreen({super.key, required this.bookingId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final booking = ref.watch(bookingByIdProvider(bookingId));

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const SizedBox(height: 24),
              Container(
                width: 90, height: 90,
                decoration: const BoxDecoration(color: AppTheme.successLight, shape: BoxShape.circle),
                child: const Icon(Icons.check_rounded, size: 52, color: AppTheme.success),
              )
                  .animate()
                  .scale(begin: const Offset(0, 0), duration: 600.ms, curve: Curves.elasticOut),
              const SizedBox(height: 20),
              Text(context.tr('paymentSuccess'),
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: AppTheme.success))
                  .animate(delay: 300.ms).fadeIn(),
              const SizedBox(height: 8),
              Text(context.tr('appointmentConfirmed'),
                style: const TextStyle(color: AppTheme.textSecondary, fontSize: 14), textAlign: TextAlign.center)
                  .animate(delay: 500.ms).fadeIn(),
              const SizedBox(height: 24),

              // Booking details
              booking.when(
                data: (b) => Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(context.tr('appointmentNumber'), style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                                Text('#${b.appointmentNumber}', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: AppTheme.primary)),
                              ],
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(color: AppTheme.successLight, borderRadius: BorderRadius.circular(20)),
                              child: Text(context.tr('paid'), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppTheme.success)),
                            ),
                          ],
                        ),
                        const Divider(height: 20),
                        _InfoRow(Icons.medical_services_rounded, context.tr('doctor'), b.doctorName.isNotEmpty ? b.doctorName : '-'),
                        _InfoRow(Icons.local_hospital_rounded, context.tr('dispensary'), b.dispensaryName.isNotEmpty ? b.dispensaryName : '-'),
                        _InfoRow(Icons.calendar_today_rounded, context.tr('date'), Formatters.formatDate(b.bookingDate)),
                        _InfoRow(Icons.access_time_rounded, context.tr('time'), b.timeSlot),
                        if (b.estimatedTime.isNotEmpty)
                          _InfoRow(Icons.schedule_rounded, context.tr('estimatedTime'), b.estimatedTime),
                        _InfoRow(Icons.person_rounded, context.tr('patient'), b.patientName),
                        if (b.fees.totalFee > 0) ...[
                          const Divider(height: 20),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(context.tr('total'), style: const TextStyle(fontWeight: FontWeight.w600)),
                              Text(Formatters.formatCurrency(b.fees.totalFee),
                                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppTheme.primary)),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                ).animate(delay: 600.ms).fadeIn(duration: 400.ms),
                loading: () => const Padding(
                  padding: EdgeInsets.all(24),
                  child: LoadingWidget(),
                ),
                error: (_, __) => const SizedBox.shrink(),
              ),

              // SMS notice
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 12),
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.infoLight,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.sms_rounded, size: 18, color: AppTheme.info),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'A confirmation SMS has been sent. Please save your appointment number.',
                          style: const TextStyle(fontSize: 12, color: AppTheme.info),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 12),
              PrimaryButton(
                text: context.tr('viewBooking'),
                icon: Icons.visibility_rounded,
                onPressed: () => context.go('/booking-detail/$bookingId'),
              ),
              const SizedBox(height: 12),
              OutlineAppButton(
                text: context.tr('backToHome'),
                onPressed: () => context.go('/'),
              ),
            ],
          ),
        ),
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
          Icon(icon, size: 16, color: AppTheme.primary),
          const SizedBox(width: 8),
          SizedBox(width: 80, child: Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary), overflow: TextOverflow.ellipsis)),
          Expanded(child: Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500), overflow: TextOverflow.ellipsis)),
        ],
      ),
    );
  }
}
