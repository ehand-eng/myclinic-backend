import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';
import '../../models/booking.dart';
import '../../services/booking_service.dart';
import '../../widgets/loading_widget.dart';
import '../../widgets/status_badge.dart';

final bookingDetailProvider =
    FutureProvider.family<Booking, String>((ref, id) async {
  return BookingService().getBookingById(id);
});

class BookingDetailScreen extends ConsumerStatefulWidget {
  final String bookingId;
  const BookingDetailScreen({super.key, required this.bookingId});

  @override
  ConsumerState<BookingDetailScreen> createState() =>
      _BookingDetailScreenState();
}

class _BookingDetailScreenState extends ConsumerState<BookingDetailScreen> {
  Timer? _timer;
  DateTime _now = DateTime.now();

  @override
  void initState() {
    super.initState();
    // Tick every second for checkout countdown
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _now = DateTime.now());
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  bool _isToday(Booking booking) {
    if (booking.bookingDate == null) return false;
    final todayStr = DateFormat('yyyy-MM-dd').format(DateTime.now());
    final bookingStr =
        DateFormat('yyyy-MM-dd').format(booking.bookingDate!.toLocal());
    return todayStr == bookingStr;
  }

  bool _isFuture(Booking booking) {
    if (booking.bookingDate == null) return false;
    final todayStr = DateFormat('yyyy-MM-dd').format(DateTime.now());
    final bookingStr =
        DateFormat('yyyy-MM-dd').format(booking.bookingDate!.toLocal());
    return bookingStr.compareTo(todayStr) > 0;
  }

  int _getCheckoutRemainingSeconds(Booking booking) {
    if (booking.checkedInTime == null) return 0;
    final expiresAt =
        booking.checkedInTime!.add(const Duration(minutes: 5));
    final diffMs = expiresAt.difference(_now).inSeconds;
    return diffMs > 0 ? diffMs : 0;
  }

  @override
  Widget build(BuildContext context) {
    final bookingAsync = ref.watch(bookingDetailProvider(widget.bookingId));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Booking Details')),
      body: bookingAsync.when(
        loading: () => const LoadingWidget(),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (booking) {
          final isToday = _isToday(booking);
          final isFuture = _isFuture(booking);
          final checkoutRemaining = _getCheckoutRemainingSeconds(booking);

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppColors.card,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '#${booking.appointmentNumber ?? '-'}',
                            style: const TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: AppColors.primary,
                            ),
                          ),
                          StatusBadge(status: booking.status, fontSize: 14),
                        ],
                      ),
                      if (booking.transactionId != null) ...[
                        const SizedBox(height: 8),
                        Text(
                          'Ref: ${booking.transactionId}',
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Patient info
                _Section(
                  title: 'Patient Information',
                  icon: Icons.person_outlined,
                  children: [
                    _DetailRow('Name', booking.patientName ?? 'N/A'),
                    _DetailRow('Phone', booking.patientPhone ?? 'N/A'),
                    _DetailRow('Email', booking.patientEmail ?? 'N/A'),
                    if (booking.symptoms != null)
                      _DetailRow('Symptoms', booking.symptoms!),
                  ],
                ),
                const SizedBox(height: 12),

                // Appointment info
                _Section(
                  title: 'Appointment Details',
                  icon: Icons.calendar_today_outlined,
                  children: [
                    _DetailRow('Doctor', booking.doctorName ?? 'N/A'),
                    _DetailRow('Dispensary', booking.dispensaryName ?? 'N/A'),
                    _DetailRow(
                      'Date',
                      booking.bookingDate != null
                          ? DateFormat('MMM dd, yyyy')
                              .format(booking.bookingDate!)
                          : 'N/A',
                    ),
                    _DetailRow('Time Slot', booking.timeSlot ?? 'N/A'),
                    _DetailRow(
                        'Estimated Time', booking.estimatedTime ?? 'N/A'),
                    _DetailRow('Booked By', booking.bookedBy ?? 'N/A'),
                  ],
                ),
                const SizedBox(height: 12),

                // Fees
                _Section(
                  title: 'Fee Breakdown',
                  icon: Icons.receipt_outlined,
                  children: [
                    _DetailRow('Doctor Fee',
                        'Rs. ${booking.fees.doctorFee.toStringAsFixed(2)}'),
                    _DetailRow('Dispensary Fee',
                        'Rs. ${booking.fees.dispensaryFee.toStringAsFixed(2)}'),
                    _DetailRow('Commission',
                        'Rs. ${booking.fees.bookingCommission.toStringAsFixed(2)}'),
                    const Divider(),
                    _DetailRow('Total',
                        'Rs. ${booking.fees.totalFee.toStringAsFixed(2)}',
                        bold: true),
                    _DetailRow(
                      'Payment',
                      booking.isPaid ? 'Paid' : 'Pending',
                      valueColor:
                          booking.isPaid ? AppColors.success : AppColors.warning,
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // Actions — Check In (today only)
                if (booking.status == 'scheduled') ...[
                  if (!isToday)
                    _DateRestrictionBanner(
                      isFuture: isFuture,
                      action: 'check in',
                    ),
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton.icon(
                      onPressed: isToday
                          ? () => _checkIn(context, booking.id)
                          : null,
                      icon: const Icon(Icons.login),
                      label: const Text('Check In',
                          style: TextStyle(
                              fontSize: 16, fontWeight: FontWeight.w600)),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],

                // Actions — Check-Out (undo check-in) with timer (today only)
                if (booking.status == 'checked_in') ...[
                  if (!isToday)
                    _DateRestrictionBanner(
                      isFuture: isFuture,
                      action: 'check out',
                    ),
                  // Checkout countdown timer
                  if (isToday && booking.checkedInTime != null)
                    _CheckoutTimerWidget(
                      remainingSeconds: checkoutRemaining,
                    ),
                  const SizedBox(height: 8),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: isToday && checkoutRemaining > 0
                          ? () => _checkOut(context, booking.id)
                          : null,
                      style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.warning,
                          foregroundColor: AppColors.textWhite),
                      icon: const Icon(Icons.logout),
                      label: const Text('Check-Out',
                          style: TextStyle(
                              fontSize: 16, fontWeight: FontWeight.w600)),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],

                // Cancel (only for scheduled — not allowed after check-in)
                if (booking.status == 'scheduled')
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: OutlinedButton.icon(
                      onPressed: () => _cancel(context, booking.id),
                      style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.error),
                      icon: const Icon(Icons.cancel_outlined),
                      label: const Text('Cancel Booking'),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _checkIn(BuildContext context, String id) async {
    try {
      await BookingService().checkInBooking(id);
      ref.invalidate(bookingDetailProvider(widget.bookingId));
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Patient checked in'),
              backgroundColor: AppColors.success),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  void _checkOut(BuildContext context, String id) async {
    try {
      await BookingService().checkOutBooking(id);
      ref.invalidate(bookingDetailProvider(widget.bookingId));
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Check-in reverted'),
              backgroundColor: AppColors.success),
        );
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  void _cancel(BuildContext context, String id) {
    final reasonCtrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel Booking'),
        content: TextField(
          controller: reasonCtrl,
          maxLines: 3,
          decoration: const InputDecoration(
            labelText: 'Reason for cancellation',
            hintText: 'Enter reason...',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Back'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await BookingService()
                    .cancelBooking(id, reasonCtrl.text.trim());
                ref.invalidate(bookingDetailProvider(widget.bookingId));
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context)
                      .showSnackBar(SnackBar(content: Text('Error: $e')));
                }
              }
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Cancel Booking'),
          ),
        ],
      ),
    );
  }
}

/// Banner shown when check-in/check-out is not allowed due to date
class _DateRestrictionBanner extends StatelessWidget {
  final bool isFuture;
  final String action;

  const _DateRestrictionBanner({
    required this.isFuture,
    required this.action,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.warningLight,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.warning.withAlpha(60)),
      ),
      child: Row(
        children: [
          const Icon(Icons.info_outline, color: AppColors.warning, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Cannot $action ${isFuture ? 'future' : 'past'} bookings',
              style: const TextStyle(
                color: AppColors.warning,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Countdown timer widget for checkout window
class _CheckoutTimerWidget extends StatelessWidget {
  final int remainingSeconds;

  const _CheckoutTimerWidget({required this.remainingSeconds});

  @override
  Widget build(BuildContext context) {
    final isExpired = remainingSeconds <= 0;
    final m = remainingSeconds ~/ 60;
    final s = remainingSeconds % 60;
    final timeStr = '$m:${s.toString().padLeft(2, '0')}';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isExpired ? AppColors.errorLight : AppColors.infoLight,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: isExpired
              ? AppColors.error.withAlpha(60)
              : AppColors.info.withAlpha(60),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            isExpired ? Icons.timer_off : Icons.timer,
            color: isExpired ? AppColors.error : AppColors.info,
            size: 20,
          ),
          const SizedBox(width: 8),
          Text(
            isExpired ? 'Checkout window expired' : '$timeStr left',
            style: TextStyle(
              color: isExpired ? AppColors.error : AppColors.info,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _Section extends StatelessWidget {
  final String title;
  final IconData icon;
  final List<Widget> children;

  const _Section(
      {required this.title, required this.icon, required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.card,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: AppColors.primary, size: 20),
              const SizedBox(width: 8),
              Text(title,
                  style: const TextStyle(
                      fontSize: 16, fontWeight: FontWeight.w600)),
            ],
          ),
          const SizedBox(height: 12),
          ...children,
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;
  final bool bold;
  final Color? valueColor;

  const _DetailRow(this.label, this.value,
      {this.bold = false, this.valueColor});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(label,
                style: const TextStyle(
                    color: AppColors.textSecondary, fontSize: 13)),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                color: valueColor ?? AppColors.text,
                fontWeight: bold ? FontWeight.w600 : FontWeight.normal,
                fontSize: 14,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
