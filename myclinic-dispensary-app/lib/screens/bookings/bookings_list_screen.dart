import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';
import '../../models/booking.dart';
import '../../providers/auth_provider.dart';
import '../../services/booking_service.dart';
import '../../widgets/status_badge.dart';
import '../../widgets/loading_widget.dart';
import '../../widgets/empty_state.dart';

class BookingsListScreen extends ConsumerStatefulWidget {
  const BookingsListScreen({super.key});

  @override
  ConsumerState<BookingsListScreen> createState() => _BookingsListScreenState();
}

class _BookingsListScreenState extends ConsumerState<BookingsListScreen> {
  DateTime _selectedDate = DateTime.now();
  List<Booking> _bookings = [];
  bool _isLoading = true;
  String _search = '';
  String _statusFilter = 'all';
  Timer? _timer;
  final ValueNotifier<DateTime> _nowNotifier = ValueNotifier(DateTime.now());
  Timer? _searchDebounce;

  @override
  void initState() {
    super.initState();
    _loadBookings();
    // Only tick if there are checked-in bookings needing countdown
    _startTimerIfNeeded();
  }

  void _startTimerIfNeeded() {
    _timer?.cancel();
    final hasCheckedIn = _bookings.any((b) => b.status == 'checked_in');
    if (hasCheckedIn) {
      _timer = Timer.periodic(const Duration(seconds: 1), (_) {
        if (mounted) _nowNotifier.value = DateTime.now();
      });
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _nowNotifier.dispose();
    _searchDebounce?.cancel();
    super.dispose();
  }

  bool get _isToday =>
      DateFormat('yyyy-MM-dd').format(_selectedDate) ==
      DateFormat('yyyy-MM-dd').format(DateTime.now());

  bool get _isFuture =>
      DateFormat('yyyy-MM-dd').format(_selectedDate).compareTo(
          DateFormat('yyyy-MM-dd').format(DateTime.now())) >
      0;

  int _getCheckoutRemaining(Booking booking, DateTime now) {
    if (booking.checkedInTime == null) return 0;
    final expiresAt = booking.checkedInTime!.add(const Duration(minutes: 5));
    final diff = expiresAt.difference(now).inSeconds;
    return diff > 0 ? diff : 0;
  }

  String _formatCountdown(int seconds) {
    final m = seconds ~/ 60;
    final s = seconds % 60;
    return '$m:${s.toString().padLeft(2, '0')}';
  }

  Future<void> _loadBookings() async {
    setState(() => _isLoading = true);
    try {
      final auth = ref.read(authProvider);
      final dispensaryId = auth.selectedDispensary?.id;
      final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);

      final bookings = await BookingService().getBookingsByDate(
        dateStr,
        dispensaryId: dispensaryId,
      );
      if (mounted) {
        setState(() => _bookings = bookings);
        _startTimerIfNeeded();
      }
    } catch (e) {
      debugPrint('Error loading bookings: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _checkIn(String bookingId) async {
    try {
      await BookingService().checkInBooking(bookingId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Patient checked in'),
              backgroundColor: AppColors.success),
        );
      }
      _loadBookings();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  Future<void> _checkOut(String bookingId) async {
    try {
      await BookingService().checkOutBooking(bookingId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Check-in reverted'),
              backgroundColor: AppColors.success),
        );
      }
      _loadBookings();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  List<Booking> get _filteredBookings {
    return _bookings.where((b) {
      if (_statusFilter != 'all' && b.status != _statusFilter) return false;
      if (_search.isNotEmpty) {
        final q = _search.toLowerCase();
        return (b.patientName?.toLowerCase().contains(q) ?? false) ||
            (b.patientPhone?.toLowerCase().contains(q) ?? false) ||
            (b.transactionId?.toLowerCase().contains(q) ?? false) ||
            (b.appointmentNumber?.toString().contains(q) ?? false);
      }
      return true;
    }).toList();
  }

  Map<String, int> get _statusCounts {
    final counts = <String, int>{};
    for (final b in _bookings) {
      counts[b.status] = (counts[b.status] ?? 0) + 1;
    }
    return counts;
  }

  @override
  Widget build(BuildContext context) {
    final fmt = DateFormat('MMM dd, yyyy');

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          // Date selector
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            color: AppColors.card,
            child: Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.chevron_left),
                  onPressed: () {
                    setState(() => _selectedDate =
                        _selectedDate.subtract(const Duration(days: 1)));
                    _loadBookings();
                  },
                ),
                Expanded(
                  child: GestureDetector(
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: _selectedDate,
                        firstDate:
                            DateTime.now().subtract(const Duration(days: 365)),
                        lastDate:
                            DateTime.now().add(const Duration(days: 365)),
                      );
                      if (picked != null) {
                        setState(() => _selectedDate = picked);
                        _loadBookings();
                      }
                    },
                    child: Text(
                      fmt.format(_selectedDate),
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: AppColors.text,
                      ),
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.chevron_right),
                  onPressed: () {
                    setState(() => _selectedDate =
                        _selectedDate.add(const Duration(days: 1)));
                    _loadBookings();
                  },
                ),
                if (!_isToday)
                  TextButton(
                    onPressed: () {
                      setState(() => _selectedDate = DateTime.now());
                      _loadBookings();
                    },
                    child: const Text('Today'),
                  ),
              ],
            ),
          ),

          // Summary stats
          if (_bookings.isNotEmpty)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _StatChip(
                        'Total', '${_bookings.length}', AppColors.primary),
                    ..._statusCounts.entries.map((e) => _StatChip(
                          Booking(id: '', status: e.key).statusDisplay,
                          '${e.value}',
                          AppColors.statusColor(e.key),
                        )),
                  ],
                ),
              ),
            ),

          // Search & filter
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                Expanded(
                  child: SizedBox(
                    height: 42,
                    child: TextField(
                      onChanged: (v) {
                        _searchDebounce?.cancel();
                        _searchDebounce = Timer(const Duration(milliseconds: 400), () {
                          if (mounted) setState(() => _search = v);
                        });
                      },
                      style: const TextStyle(fontSize: 14),
                      decoration: const InputDecoration(
                        hintText: 'Search...',
                        prefixIcon: Icon(Icons.search, size: 20),
                        contentPadding: EdgeInsets.symmetric(vertical: 0),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                PopupMenuButton<String>(
                  initialValue: _statusFilter,
                  onSelected: (v) => setState(() => _statusFilter = v),
                  child: Container(
                    height: 42,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      border: Border.all(color: AppColors.border),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.filter_list, size: 18),
                        SizedBox(width: 4),
                        Text('Filter', style: TextStyle(fontSize: 13)),
                      ],
                    ),
                  ),
                  itemBuilder: (_) => [
                    const PopupMenuItem(value: 'all', child: Text('All')),
                    const PopupMenuItem(
                        value: 'scheduled', child: Text('Scheduled')),
                    const PopupMenuItem(
                        value: 'checked_in', child: Text('Checked In')),
                    const PopupMenuItem(
                        value: 'completed', child: Text('Completed')),
                    const PopupMenuItem(
                        value: 'cancelled', child: Text('Cancelled')),
                    const PopupMenuItem(
                        value: 'no_show', child: Text('No Show')),
                  ],
                ),
              ],
            ),
          ),

          // List
          Expanded(
            child: _isLoading
                ? const LoadingWidget()
                : _filteredBookings.isEmpty
                    ? const EmptyState(
                        icon: Icons.event_note,
                        title: 'No bookings found',
                        subtitle: 'Try a different date or filter',
                      )
                    : RefreshIndicator(
                        onRefresh: _loadBookings,
                        child: ValueListenableBuilder<DateTime>(
                          valueListenable: _nowNotifier,
                          builder: (context, now, _) {
                            final filtered = _filteredBookings;
                            return ListView.separated(
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              itemCount: filtered.length,
                              separatorBuilder: (_, __) =>
                                  const SizedBox(height: 8),
                              itemBuilder: (context, index) {
                                final booking = filtered[index];
                                return _BookingCard(
                                  booking: booking,
                                  isToday: _isToday,
                                  isFuture: _isFuture,
                                  checkoutRemaining:
                                      _getCheckoutRemaining(booking, now),
                                  formatCountdown: _formatCountdown,
                                  onTap: () =>
                                      context.push('/bookings/${booking.id}'),
                                  onCheckIn: () => _checkIn(booking.id),
                                  onCheckOut: () => _checkOut(booking.id),
                                );
                              },
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _StatChip(this.label, this.value, this.color);

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(right: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withAlpha(20),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withAlpha(50)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(value,
              style: TextStyle(
                  fontWeight: FontWeight.bold, color: color, fontSize: 14)),
          const SizedBox(width: 4),
          Text(label, style: TextStyle(color: color, fontSize: 12)),
        ],
      ),
    );
  }
}

class _BookingCard extends StatelessWidget {
  final Booking booking;
  final bool isToday;
  final bool isFuture;
  final int checkoutRemaining;
  final String Function(int) formatCountdown;
  final VoidCallback onTap;
  final VoidCallback onCheckIn;
  final VoidCallback onCheckOut;

  const _BookingCard({
    required this.booking,
    required this.isToday,
    required this.isFuture,
    required this.checkoutRemaining,
    required this.formatCountdown,
    required this.onTap,
    required this.onCheckIn,
    required this.onCheckOut,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: AppColors.primarySurface,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Center(
                    child: Text(
                      '#${booking.appointmentNumber ?? '-'}',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        booking.patientName ?? 'Unknown Patient',
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          color: AppColors.text,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Dr. ${booking.doctorName ?? 'N/A'} | ${booking.timeSlot ?? ''}',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                StatusBadge(status: booking.status),
              ],
            ),

            // Check-in action (today only, scheduled)
            if (booking.status == 'scheduled') ...[
              const SizedBox(height: 10),
              if (!isToday)
                Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Text(
                    'Cannot check in ${isFuture ? 'future' : 'past'} bookings',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.warning,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ),
              SizedBox(
                width: double.infinity,
                height: 40,
                child: ElevatedButton.icon(
                  onPressed: isToday ? onCheckIn : null,
                  icon: const Icon(Icons.login, size: 16),
                  label: const Text('Check In'),
                  style: ElevatedButton.styleFrom(
                    textStyle: const TextStyle(fontSize: 13),
                  ),
                ),
              ),
            ],

            // Checkout action with timer (today only, checked_in)
            if (booking.status == 'checked_in') ...[
              const SizedBox(height: 10),
              if (!isToday)
                Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Text(
                    'Cannot check out ${isFuture ? 'future' : 'past'} bookings',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppColors.warning,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ),
              // Countdown timer
              if (isToday && booking.checkedInTime != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        checkoutRemaining > 0 ? Icons.timer : Icons.timer_off,
                        size: 16,
                        color: checkoutRemaining > 0
                            ? AppColors.info
                            : AppColors.error,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        checkoutRemaining > 0
                            ? '${formatCountdown(checkoutRemaining)} left'
                            : 'Checkout window expired',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: checkoutRemaining > 0
                              ? AppColors.info
                              : AppColors.error,
                        ),
                      ),
                    ],
                  ),
                ),
              SizedBox(
                width: double.infinity,
                height: 40,
                child: ElevatedButton.icon(
                  onPressed: isToday && checkoutRemaining > 0
                      ? onCheckOut
                      : null,
                  icon: const Icon(Icons.logout, size: 16),
                  label: const Text('Check-Out'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.warning,
                    foregroundColor: AppColors.textWhite,
                    textStyle: const TextStyle(fontSize: 13),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
