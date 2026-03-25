import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:myclinic_patient_app/config/theme.dart';
import 'package:myclinic_patient_app/l10n/translations.dart';
import 'package:myclinic_patient_app/providers/auth_provider.dart';
import 'package:myclinic_patient_app/providers/booking_provider.dart';
import 'package:myclinic_patient_app/services/api_service.dart';
import 'package:myclinic_patient_app/services/payment_service.dart';
import 'package:myclinic_patient_app/utils/formatters.dart';
import 'package:myclinic_patient_app/utils/helpers.dart';
import 'package:myclinic_patient_app/utils/validators.dart';
import 'package:myclinic_patient_app/widgets/buttons/primary_button.dart';
import 'package:myclinic_patient_app/widgets/inputs/text_input.dart';

class BookingStep2Screen extends ConsumerStatefulWidget {
  const BookingStep2Screen({super.key});

  @override
  ConsumerState<BookingStep2Screen> createState() => _BookingStep2ScreenState();
}

class _BookingStep2ScreenState extends ConsumerState<BookingStep2Screen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  String _paymentMethod = 'pay_at_clinic';
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    final user = ref.read(currentUserProvider);
    if (user != null) {
      _nameCtrl.text = user.name;
      _phoneCtrl.text = user.mobile ?? '';
      _emailCtrl.text = user.email;
    }
    _nameCtrl.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _emailCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _submitting = true);

    final state = ref.read(bookingFlowProvider);
    final date = Formatters.formatDateFromDateTime(state.selectedDate!);

    try {
      final fees = state.fees;
      final booking = await ref.read(bookingFlowProvider.notifier).submitBooking({
        'doctorId': state.selectedDoctor!.id,
        'dispensaryId': state.selectedDispensary!.id,
        'bookingDate': date,
        'timeSlotConfigId': state.selectedSession!.timeSlotConfigId,
        'patientName': _nameCtrl.text.trim(),
        'patientPhone': _phoneCtrl.text.trim(),
        'patientEmail': _emailCtrl.text.trim().isNotEmpty ? _emailCtrl.text.trim() : null,
        'paymentMethod': _paymentMethod == 'pay_online' ? 'online' : 'cash',
        'paymentStatus': _paymentMethod == 'pay_online' ? 'pending' : 'not_required',
        if (state.nextAppointment != null) ...{
          'appointmentNumber': state.nextAppointment!['appointmentNumber'],
          'estimatedTime': state.nextAppointment!['estimatedTime'],
          'timeSlot': state.nextAppointment!['timeSlot'],
          'minutesPerPatient': state.nextAppointment!['minutesPerPatient'],
        },
        if (fees != null) 'fees': {
          'doctorFee': fees.doctorFee,
          'dispensaryFee': fees.dispensaryFee,
          'bookingCommission': fees.bookingCommission,
          'totalFee': fees.totalFee,
        },
      });

      if (!mounted) return;

      if (_paymentMethod == 'pay_online') {
        try {
          final paymentUrl = await ref.read(paymentServiceProvider).createPaymentIntent(booking.id);
          if (mounted && paymentUrl.isNotEmpty) {
            context.push('/payment/${booking.id}', extra: paymentUrl);
          }
        } catch (_) {
          if (mounted) {
            showSnackBar(context, 'Payment setup failed. You can pay at clinic.', isError: true);
            context.go('/booking/confirmation/${booking.transactionId}');
          }
        }
      } else {
        context.go('/booking/confirmation/${booking.transactionId}');
      }
    } catch (e) {
      if (mounted) showSnackBar(context, ApiService.extractError(e), isError: true);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(bookingFlowProvider);
    final totalFee = state.fees?.totalFee ?? 0.0;

    return Scaffold(
      appBar: AppBar(
        title: Text(context.tr('confirmBooking')),
        leading: IconButton(icon: const Icon(Icons.arrow_back_rounded), onPressed: () => context.pop()),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Progress
              Row(
                children: [
                  _StepDot(isActive: true, isDone: true),
                  Expanded(child: Container(height: 2, color: AppTheme.primary)),
                  _StepDot(isActive: true, isDone: false),
                ],
              ),
              const SizedBox(height: 24),

              // Appointment Summary Card
              Card(
                color: AppTheme.primarySurface,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.event_note_rounded, size: 20, color: AppTheme.primary),
                          const SizedBox(width: 8),
                          Text(context.tr('appointmentSummary'),
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppTheme.primary)),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(context.tr('yourAppointmentDetails'),
                        style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                      const SizedBox(height: 14),
                      _SummaryRow(Icons.medical_services_rounded, state.selectedDoctor?.name ?? ''),
                      _SummaryRow(Icons.local_hospital_rounded, state.selectedDispensary?.name ?? ''),
                      _SummaryRow(Icons.calendar_today_rounded,
                        state.selectedDate != null ? Formatters.formatDisplayDate(state.selectedDate!) : ''),
                      _SummaryRow(Icons.access_time_rounded, state.selectedSession?.timeSlot ?? ''),
                      if (state.nextAppointment != null) ...[
                        const Divider(height: 20),
                        _SummaryRow(Icons.confirmation_number_rounded,
                          '${context.tr('appointmentNumber')}: #${state.nextAppointment!['appointmentNumber'] ?? '-'}'),
                        if (state.nextAppointment!['estimatedTime'] != null &&
                            state.nextAppointment!['estimatedTime'].toString().isNotEmpty)
                          _SummaryRow(Icons.schedule_rounded,
                            '${context.tr('estimatedTime')}: ${state.nextAppointment!['estimatedTime']}'),
                      ],
                    ],
                  ),
                ),
              ).animate().fadeIn(duration: 400.ms),

              // Replacement Doctor Warning
              if (state.activeReplacement != null && (state.activeReplacement!['replacementName'] ?? '').toString().isNotEmpty) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.amber.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.amber.shade300),
                  ),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(Icons.swap_horiz_rounded, color: Colors.amber.shade800, size: 22),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(context.tr('replacementDoctor'),
                              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: Colors.amber.shade900)),
                            const SizedBox(height: 4),
                            RichText(
                              text: TextSpan(
                                style: TextStyle(fontSize: 12, color: Colors.amber.shade800, height: 1.4),
                                children: [
                                  const TextSpan(text: 'Please note: '),
                                  TextSpan(text: '${state.activeReplacement!['replacementName']}',
                                    style: const TextStyle(fontWeight: FontWeight.w700)),
                                  const TextSpan(text: ' will be attending in place of '),
                                  TextSpan(text: state.selectedDoctor?.name ?? '',
                                    style: const TextStyle(fontWeight: FontWeight.w700)),
                                  const TextSpan(text: '.'),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: 20),
              Text(context.tr('patientDetails'), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              const SizedBox(height: 12),

              AppTextInput(
                label: context.tr('fullName'),
                controller: _nameCtrl,
                prefixIcon: Icons.person_rounded,
                maxLength: 25,
                validator: Validators.validateName,
              ),
              Padding(
                padding: const EdgeInsets.only(left: 4, top: 2, bottom: 8),
                child: Text(
                  '${_nameCtrl.text.length}/25 ${context.tr('characters')}',
                  style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                ),
              ),
              AppTextInput(
                label: context.tr('phoneNumber'),
                controller: _phoneCtrl,
                prefixIcon: Icons.phone_rounded,
                keyboardType: TextInputType.phone,
                validator: Validators.validatePhone,
                onChanged: (v) {
                  // Strip whitespace in real-time like web app
                  final stripped = v.replaceAll(RegExp(r'\s+'), '');
                  if (stripped != v) {
                    _phoneCtrl.value = TextEditingValue(
                      text: stripped,
                      selection: TextSelection.collapsed(offset: stripped.length),
                    );
                  }
                },
              ),
              Padding(
                padding: const EdgeInsets.only(left: 4, top: 4, bottom: 8),
                child: Text(
                  context.tr('phoneHint'),
                  style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                ),
              ),
              AppTextInput(
                label: context.tr('emailOptional'),
                controller: _emailCtrl,
                prefixIcon: Icons.email_rounded,
                keyboardType: TextInputType.emailAddress,
                validator: (v) {
                  if (v == null || v.isEmpty) return null; // optional
                  return Validators.validateEmail(v);
                },
              ),

              // Fee breakdown
              if (state.fees != null) ...[
                const SizedBox(height: 20),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(context.tr('feeBreakdown'),
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                        const SizedBox(height: 12),
                        _FeeRow(context.tr('doctorFee'), state.fees!.doctorFee),
                        _FeeRow(context.tr('dispensaryFee'), state.fees!.dispensaryFee),
                        _FeeRow(context.tr('bookingFee'), state.fees!.bookingCommission),
                        const Divider(height: 20),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(context.tr('total'), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                            Text(Formatters.formatCurrency(state.fees!.totalFee),
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppTheme.primary)),
                          ],
                        ),
                      ],
                    ),
                  ),
                ).animate(delay: 200.ms).fadeIn(duration: 400.ms),
              ],

              const SizedBox(height: 20),
              Text(context.tr('paymentMethod'), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              const SizedBox(height: 8),
              _PaymentOption(
                icon: Icons.credit_card_rounded,
                title: totalFee > 0
                    ? '${context.tr('payOnlineAmount')} (Rs ${totalFee.toStringAsFixed(2)})'
                    : context.tr('payOnline'),
                subtitle: context.tr('securePayment'),
                isSelected: _paymentMethod == 'pay_online',
                onTap: () => setState(() => _paymentMethod = 'pay_online'),
              ),
              const SizedBox(height: 8),
              _PaymentOption(
                icon: Icons.payments_rounded,
                title: context.tr('confirmPayAtClinic'),
                subtitle: context.tr('payWhenVisit'),
                isSelected: _paymentMethod == 'pay_at_clinic',
                onTap: () => setState(() => _paymentMethod = 'pay_at_clinic'),
              ),

              const SizedBox(height: 24),
              PrimaryButton(
                text: _paymentMethod == 'pay_online' && totalFee > 0
                    ? '${context.tr('payOnlineAmount')} (Rs ${totalFee.toStringAsFixed(2)})'
                    : context.tr('confirmBooking'),
                icon: Icons.check_circle_rounded,
                isLoading: _submitting,
                useGradient: true,
                onPressed: _submit,
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}

class _StepDot extends StatelessWidget {
  final bool isActive;
  final bool isDone;
  const _StepDot({required this.isActive, required this.isDone});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 28, height: 28,
      decoration: BoxDecoration(
        color: isActive ? AppTheme.primary : AppTheme.border,
        shape: BoxShape.circle,
      ),
      child: Icon(
        isDone ? Icons.check_rounded : Icons.circle,
        size: isDone ? 18 : 10, color: Colors.white,
      ),
    );
  }
}

class _SummaryRow extends StatelessWidget {
  final IconData icon;
  final String text;
  const _SummaryRow(this.icon, this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppTheme.primary),
          const SizedBox(width: 10),
          Expanded(child: Text(text, style: const TextStyle(fontSize: 14, color: AppTheme.text), overflow: TextOverflow.ellipsis)),
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
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Flexible(child: Text(label, style: const TextStyle(color: AppTheme.textSecondary), overflow: TextOverflow.ellipsis)),
          Text(Formatters.formatCurrency(amount), style: const TextStyle(fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}

class _PaymentOption extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final bool isSelected;
  final VoidCallback onTap;

  const _PaymentOption({
    required this.icon, required this.title, required this.subtitle,
    required this.isSelected, required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: isSelected ? AppTheme.primary : AppTheme.border, width: isSelected ? 2 : 1),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Icon(icon, color: isSelected ? AppTheme.primary : AppTheme.textSecondary),
              const SizedBox(width: 12),
              Expanded(child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: TextStyle(fontWeight: FontWeight.w600, color: isSelected ? AppTheme.primary : AppTheme.text), overflow: TextOverflow.ellipsis),
                  Text(subtitle, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary), overflow: TextOverflow.ellipsis),
                ],
              )),
              Radio<bool>(
                value: true,
                groupValue: isSelected,
                onChanged: (_) => onTap(),
                activeColor: AppTheme.primary,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
