import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:myclinic_patient_app/config/theme.dart';
import 'package:myclinic_patient_app/l10n/translations.dart';
import 'package:myclinic_patient_app/services/booking_service.dart';
import 'package:myclinic_patient_app/services/payment_service.dart';
import 'package:myclinic_patient_app/utils/helpers.dart';
import 'package:myclinic_patient_app/widgets/buttons/primary_button.dart';
import 'package:myclinic_patient_app/widgets/buttons/outline_button.dart';

class PaymentFailedScreen extends ConsumerWidget {
  final String bookingId;
  const PaymentFailedScreen({super.key, required this.bookingId});

  Future<void> _retryPayment(BuildContext context, WidgetRef ref) async {
    try {
      final paymentUrl = await ref.read(paymentServiceProvider).createPaymentIntent(bookingId);
      if (paymentUrl.isNotEmpty && context.mounted) {
        context.pushReplacement('/payment/$bookingId', extra: paymentUrl);
      }
    } catch (e) {
      if (context.mounted) {
        showSnackBar(context, 'Failed to initiate payment. Please try again.', isError: true);
      }
    }
  }

  Future<void> _payAtClinic(BuildContext context, WidgetRef ref) async {
    try {
      await ref.read(bookingServiceProvider).updateBookingPayment(bookingId, 'cash');
      if (context.mounted) {
        context.go('/booking-detail/$bookingId');
      }
    } catch (e) {
      if (context.mounted) {
        context.go('/booking-detail/$bookingId');
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 100, height: 100,
                decoration: const BoxDecoration(color: AppTheme.errorLight, shape: BoxShape.circle),
                child: const Icon(Icons.close_rounded, size: 60, color: AppTheme.error),
              )
                  .animate()
                  .scale(begin: const Offset(0, 0), duration: 600.ms, curve: Curves.elasticOut),
              const SizedBox(height: 24),
              Text(context.tr('paymentFailed'),
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: AppTheme.error))
                  .animate(delay: 300.ms).fadeIn(),
              const SizedBox(height: 12),
              Text(context.tr('paymentFailedMsg'),
                style: const TextStyle(color: AppTheme.textSecondary, fontSize: 15), textAlign: TextAlign.center)
                  .animate(delay: 500.ms).fadeIn(),
              const SizedBox(height: 40),
              PrimaryButton(
                text: context.tr('retryPayment'),
                icon: Icons.refresh_rounded,
                onPressed: () => _retryPayment(context, ref),
              ),
              const SizedBox(height: 12),
              OutlineAppButton(
                text: context.tr('payAtClinic'),
                onPressed: () => _payAtClinic(context, ref),
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () => context.go('/'),
                child: Text(context.tr('backToHome')),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
