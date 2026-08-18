import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';
import '../../models/booking.dart';
import '../../models/doctor.dart';
import '../../models/time_slot.dart';
import '../../providers/auth_provider.dart';
import '../../services/booking_service.dart';
import '../../services/doctor_service.dart';
import '../../services/timeslot_service.dart';
import '../../widgets/status_badge.dart';
import '../../widgets/loading_widget.dart';
import '../../widgets/empty_state.dart';
import '../../providers/navigation_provider.dart';

class CheckInScreen extends ConsumerStatefulWidget {
  const CheckInScreen({super.key});

  @override
  ConsumerState<CheckInScreen> createState() => _CheckInScreenState();
}

class _CheckInScreenState extends ConsumerState<CheckInScreen> {
  bool _isSearchMode = true;
  String _searchQuery = '';
  DateTime _selectedDate = DateTime.now();
  List<Doctor> _doctors = [];
  Doctor? _selectedDoctor;
  List<Session> _sessions = [];
  Session? _selectedSession;
  List<Booking> _bookings = [];
  bool _isLoading = false;
  bool _isBroadcasting = false;
  Timer? _timer;
  final ValueNotifier<DateTime> _nowNotifier = ValueNotifier(DateTime.now());

  @override
  void initState() {
    super.initState();
    _loadDoctors();
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
    super.dispose();
  }

  bool _isBookingToday(Booking booking) {
    if (booking.bookingDate == null) return false;
    final todayStr = DateFormat('yyyy-MM-dd').format(DateTime.now());
    final bookingStr =
        DateFormat('yyyy-MM-dd').format(booking.bookingDate!.toLocal());
    return todayStr == bookingStr;
  }

  bool _isBookingFuture(Booking booking) {
    if (booking.bookingDate == null) return false;
    final todayStr = DateFormat('yyyy-MM-dd').format(DateTime.now());
    final bookingStr =
        DateFormat('yyyy-MM-dd').format(booking.bookingDate!.toLocal());
    return bookingStr.compareTo(todayStr) > 0;
  }

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

  Future<void> _loadDoctors() async {
    final auth = ref.read(authProvider);
    final dispensaryId = auth.selectedDispensary?.id;
    if (dispensaryId == null) return;
    try {
      final doctors =
          await DoctorService().getDoctorsByDispensary(dispensaryId);
      if (mounted) setState(() => _doctors = doctors);
    } catch (_) {}
  }

  Future<void> _loadSessions() async {
    if (_selectedDoctor == null) return;
    final auth = ref.read(authProvider);
    final dispensaryId = auth.selectedDispensary?.id;
    if (dispensaryId == null) return;

    try {
      final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);
      final sessions = await TimeSlotService()
          .getSessions(_selectedDoctor!.id, dispensaryId, dateStr);
      if (mounted) {
        setState(() {
          _sessions = sessions;
          _selectedSession = null;
        });
      }
    } catch (_) {}
  }

  Future<void> _searchBookings() async {
    if (_searchQuery.trim().isEmpty) return;
    final auth = ref.read(authProvider);
    final dispensaryId = auth.selectedDispensary?.id;
    if (dispensaryId == null) return;

    setState(() => _isLoading = true);
    try {
      final bookings = await BookingService().searchCheckIn(
        dispensaryId: dispensaryId,
        search: _searchQuery.trim(),
      );
      if (mounted) {
        setState(() => _bookings = bookings);
        _startTimerIfNeeded();
      }
    } catch (e) {
      debugPrint('Search error: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _loadSessionBookings() async {
    final auth = ref.read(authProvider);
    final dispensaryId = auth.selectedDispensary?.id;
    if (dispensaryId == null) return;

    setState(() => _isLoading = true);
    try {
      final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);
      final bookings = await BookingService().getSessionBookings(
        dispensaryId: dispensaryId,
        date: dateStr,
        doctorId: _selectedDoctor?.id,
        sessionId: _selectedSession?.configId,
      );
      if (mounted) {
        setState(() => _bookings = bookings);
        _startTimerIfNeeded();
      }
    } catch (e) {
      debugPrint('Session load error: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _reload() async {
    if (_isSearchMode) {
      await _searchBookings();
    } else {
      await _loadSessionBookings();
    }
  }

  Future<void> _doCheckIn(String bookingId) async {
    try {
      await BookingService().checkInBooking(bookingId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Patient checked in'),
              backgroundColor: AppColors.success),
        );
      }
      _reload();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  Future<void> _doCheckOut(String bookingId) async {
    try {
      await BookingService().checkOutBooking(bookingId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Check-in reverted'),
              backgroundColor: AppColors.success),
        );
      }
      _reload();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  Future<void> _cancelSession() async {
    final activeBookingsCount = _bookings.where((b) => b.status == 'scheduled').length;
    if (_selectedDoctor == null) return;
    
    final auth = ref.read(authProvider);
    final dispensaryId = auth.selectedDispensary?.id;
    if (dispensaryId == null) return;
    
    final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);

    final shouldCancel = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Cancel Session'),
        content: Text('You are about to cancel this session. This will notify $activeBookingsCount patient(s) via SMS. This action cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Go Back')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error, foregroundColor: Colors.white),
            onPressed: () => Navigator.pop(ctx, true), 
            child: const Text('Yes, Cancel')
          ),
        ],
      ),
    );

    if (shouldCancel != true) return;

    setState(() => _isBroadcasting = true);
    try {
      final res = await BookingService().cancelSession(
        doctorId: _selectedDoctor!.id,
        dispensaryId: dispensaryId,
        bookingDate: dateStr,
        timeSlotConfigId: _selectedSession?.configId,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res['message'] ?? 'Cancelled sucessfully'), backgroundColor: AppColors.success));
      }
      _reload();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error));
      }
    } finally {
      if (mounted) setState(() => _isBroadcasting = false);
    }
  }

  Future<void> _postponeSession() async {
    final activeBookingsCount = _bookings.where((b) => b.status == 'scheduled').length;
    if (_selectedDoctor == null) return;

    final auth = ref.read(authProvider);
    final dispensaryId = auth.selectedDispensary?.id;
    if (dispensaryId == null) return;
    
    final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);
    
    final dateController = TextEditingController(text: dateStr);
    
    String defaultTime = '';
    if (_selectedSession != null) {
      defaultTime = _selectedSession!.display;
    }
    final timeController = TextEditingController(text: defaultTime);

    final shouldPostpone = await showDialog<bool>(
      context: context,
      builder: (ctx) {
        String? timeError;
        return StatefulBuilder(
          builder: (context, setModalState) {
            return AlertDialog(
              title: const Text('Postpone Session'),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('You are about to postpone this session. This will notify $activeBookingsCount patient(s) via SMS.'),
                    const SizedBox(height: 16),
                    TextField(
                      controller: dateController,
                      decoration: const InputDecoration(labelText: 'Date', border: OutlineInputBorder(), filled: true, fillColor: Color(0xFFF3F4F6)),
                      readOnly: true,
                    ),
                    const SizedBox(height: 12),
                    TextField(
                      controller: timeController,
                      decoration: InputDecoration(
                        labelText: 'New Time Slot', 
                        hintText: 'e.g. 17:00-19:00', 
                        border: const OutlineInputBorder(),
                        errorText: timeError,
                      ),
                      onChanged: (_) {
                        if (timeError != null) setModalState(() => timeError = null);
                      },
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Go Back')),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: Colors.orange, foregroundColor: Colors.white),
                  onPressed: () {
                    final timeText = timeController.text.trim();
                    if (timeText.isNotEmpty) {
                      final regex = RegExp(r'^([01]\d|2[0-3]):([0-5]\d)\s*-\s*([01]\d|2[0-3]):([0-5]\d)$');
                      if (!regex.hasMatch(timeText)) {
                        setModalState(() => timeError = 'Invalid format. Use HH:mm - HH:mm');
                        return;
                      }
                    }
                    Navigator.pop(ctx, true);
                  }, 
                  child: const Text('Yes, Postpone')
                ),
              ],
            );
          }
        );
      },
    );

    if (shouldPostpone != true) return;

    setState(() => _isBroadcasting = true);
    try {
      final res = await BookingService().postponeSession(
        doctorId: _selectedDoctor!.id,
        dispensaryId: dispensaryId,
        bookingDate: dateStr,
        newDate: dateController.text,
        newTimeSlot: timeController.text.trim(),
        timeSlotConfigId: _selectedSession?.configId,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(res['message'] ?? 'Postponed sucessfully'), backgroundColor: AppColors.success));
      }
      _reload();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'), backgroundColor: AppColors.error));
      }
    } finally {
      if (mounted) setState(() => _isBroadcasting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<int>(mainTabIndexProvider, (previous, next) {
      if (next == 2 && previous != 2) { // 2 is the CheckIn tab index
        _reload();
      }
    });

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          // Mode toggle
          Container(
            padding: const EdgeInsets.all(16),
            color: AppColors.card,
            child: Column(
              children: [
                SegmentedButton<bool>(
                  segments: const [
                    ButtonSegment(
                        value: true,
                        label: Text('Search'),
                        icon: Icon(Icons.search)),
                    ButtonSegment(
                        value: false,
                        label: Text('Session'),
                        icon: Icon(Icons.list)),
                  ],
                  selected: {_isSearchMode},
                  onSelectionChanged: (v) {
                    setState(() {
                      _isSearchMode = v.first;
                      _bookings = [];
                    });
                  },
                ),
                const SizedBox(height: 12),

                if (_isSearchMode)
                  Row(
                    children: [
                      Expanded(
                        child: SizedBox(
                          height: 42,
                          child: TextField(
                            onChanged: (v) => _searchQuery = v,
                            onSubmitted: (_) => _searchBookings(),
                            style: const TextStyle(fontSize: 14),
                            decoration: const InputDecoration(
                              hintText: 'Reference, name, phone...',
                              prefixIcon: Icon(Icons.search, size: 20),
                              contentPadding:
                                  EdgeInsets.symmetric(vertical: 0),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      SizedBox(
                        height: 42,
                        child: ElevatedButton(
                          onPressed: _searchBookings,
                          child: const Text('Search'),
                        ),
                      ),
                    ],
                  )
                else
                  Column(
                    children: [
                      OutlinedButton.icon(
                        onPressed: () async {
                          final picked = await showDatePicker(
                            context: context,
                            initialDate: _selectedDate,
                            firstDate: DateTime.now()
                                .subtract(const Duration(days: 30)),
                            lastDate:
                                DateTime.now().add(const Duration(days: 30)),
                          );
                          if (picked != null) {
                            setState(() => _selectedDate = picked);
                            _loadSessions();
                          }
                        },
                        icon: const Icon(Icons.calendar_today, size: 16),
                        label: Text(
                            DateFormat('MMM dd, yyyy').format(_selectedDate)),
                      ),
                      const SizedBox(height: 8),
                      DropdownButtonFormField<Doctor>(
                        value: _selectedDoctor,
                        decoration: const InputDecoration(
                          hintText: 'Select Doctor',
                          contentPadding:
                              EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        ),
                        items: _doctors
                            .map((d) => DropdownMenuItem(
                                value: d, child: Text(d.name)))
                            .toList(),
                        onChanged: (d) {
                          setState(() => _selectedDoctor = d);
                          _loadSessions();
                        },
                      ),
                      if (_sessions.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        DropdownButtonFormField<Session>(
                          value: _selectedSession,
                          decoration: const InputDecoration(
                            hintText: 'All Sessions',
                            contentPadding: EdgeInsets.symmetric(
                                horizontal: 12, vertical: 8),
                          ),
                          items: [
                            const DropdownMenuItem<Session>(
                              value: null,
                              child: Text('All Sessions'),
                            ),
                            ..._sessions.map((s) => DropdownMenuItem(
                                  value: s,
                                  child: Text(s.display),
                                )),
                          ],
                          onChanged: (s) =>
                              setState(() => _selectedSession = s),
                        ),
                      ],
                      const SizedBox(height: 8),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _selectedDoctor != null
                              ? _loadSessionBookings
                              : null,
                          child: const Text('Load Bookings'),
                        ),
                      ),
                      if (!_isSearchMode && _selectedDoctor != null) ...[
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            Expanded(
                              child: ElevatedButton(
                                onPressed: _isBroadcasting ? null : _cancelSession,
                                style: ElevatedButton.styleFrom(backgroundColor: AppColors.error, foregroundColor: Colors.white),
                                child: _isBroadcasting ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Text('Cancel Session'),
                              )
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: ElevatedButton(
                                onPressed: _isBroadcasting ? null : _postponeSession,
                                style: ElevatedButton.styleFrom(backgroundColor: Colors.orange, foregroundColor: Colors.white),
                                child: _isBroadcasting ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : const Text('Postpone'),
                              )
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
              ],
            ),
          ),

          // Results
          Expanded(
            child: _isLoading
                ? const LoadingWidget()
                : _bookings.isEmpty
                    ? const EmptyState(
                        icon: Icons.how_to_reg,
                        title: 'No bookings to show',
                        subtitle: 'Search or load a session',
                      )
                    : RefreshIndicator(
                        onRefresh: _reload,
                        child: ValueListenableBuilder<DateTime>(
                          valueListenable: _nowNotifier,
                          builder: (context, now, _) {
                            return ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: _bookings.length,
                          separatorBuilder: (_, __) =>
                              const SizedBox(height: 8),
                          itemBuilder: (context, index) {
                            final b = _bookings[index];
                            final remaining = _getCheckoutRemaining(b, now);
                            final isToday = _isBookingToday(b);
                            final isFuture = _isBookingFuture(b);

                            return Container(
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
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: AppColors.primarySurface,
                                          borderRadius:
                                              BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          '#${b.appointmentNumber ?? '-'}',
                                          style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                            color: AppColors.primary,
                                            fontSize: 13,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: Text(
                                          b.patientName ?? 'Unknown',
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w600,
                                            fontSize: 15,
                                          ),
                                        ),
                                      ),
                                      StatusBadge(status: b.status),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Dr. ${b.doctorName ?? 'N/A'} | ${b.timeSlot ?? ''} | ${b.patientPhone ?? ''}',
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.textSecondary,
                                    ),
                                  ),
                                  const SizedBox(height: 10),

                                  // Check-in button (today only)
                                  if (b.status == 'scheduled') ...[
                                    if (!isToday)
                                      Padding(
                                        padding:
                                            const EdgeInsets.only(bottom: 6),
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
                                        onPressed: isToday
                                            ? () => _doCheckIn(b.id)
                                            : null,
                                        icon: const Icon(Icons.login,
                                            size: 16),
                                        label: const Text('Check In'),
                                        style: ElevatedButton.styleFrom(
                                          textStyle:
                                              const TextStyle(fontSize: 13),
                                        ),
                                      ),
                                    ),
                                  ],

                                  // Checkout with 5-minute timer (today only)
                                  if (b.status == 'checked_in') ...[
                                    if (!isToday)
                                      Padding(
                                        padding:
                                            const EdgeInsets.only(bottom: 6),
                                        child: Text(
                                          'Cannot check out ${isFuture ? 'future' : 'past'} bookings',
                                          style: const TextStyle(
                                            fontSize: 12,
                                            color: AppColors.warning,
                                            fontStyle: FontStyle.italic,
                                          ),
                                        ),
                                      ),
                                    // Countdown timer (only for today)
                                    if (isToday && b.checkedInTime != null)
                                      Padding(
                                        padding:
                                            const EdgeInsets.only(bottom: 8),
                                        child: Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment.center,
                                          children: [
                                            Icon(
                                              remaining > 0
                                                  ? Icons.timer
                                                  : Icons.timer_off,
                                              size: 16,
                                              color: remaining > 0
                                                  ? AppColors.info
                                                  : AppColors.error,
                                            ),
                                            const SizedBox(width: 4),
                                            Text(
                                              remaining > 0
                                                  ? '${_formatCountdown(remaining)} left'
                                                  : 'Checkout window expired',
                                              style: TextStyle(
                                                fontSize: 12,
                                                fontWeight: FontWeight.w600,
                                                color: remaining > 0
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
                                        onPressed:
                                            isToday && remaining > 0
                                                ? () =>
                                                    _doCheckOut(b.id)
                                                : null,
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor:
                                              AppColors.warning,
                                          foregroundColor:
                                              AppColors.textWhite,
                                          textStyle: const TextStyle(
                                              fontSize: 13),
                                        ),
                                        icon: const Icon(Icons.logout,
                                            size: 16),
                                        label:
                                            const Text('Check-Out'),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
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
