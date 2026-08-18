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
  int _modeIndex = 0; // 0=Search, 1=Session, 2=Multiple
  String _searchQuery = '';
  DateTime _selectedDate = DateTime.now();
  DateTime _startDate = DateTime.now();
  DateTime _endDate = DateTime.now().add(const Duration(days: 3));
  List<Doctor> _doctors = [];
  Doctor? _selectedDoctor;
  List<Session> _sessions = [];
  Session? _selectedSession;
  List<Booking> _bookings = [];
  bool _isLoading = false;
  bool _isBroadcasting = false;
  bool _isMultipleAddMode = false;
  String? _editingAbsentSlotId;
  List<AbsentTimeSlot> _absentDateRanges = [];
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

  Future<void> _loadAbsentDateRanges() async {
    if (_selectedDoctor == null) return;
    final auth = ref.read(authProvider);
    final dispensaryId = auth.selectedDispensary?.id;
    if (dispensaryId == null) return;

    setState(() => _isLoading = true);
    try {
      final slots = await TimeSlotService().getAbsentSlots(
        _selectedDoctor!.id, 
        dispensaryId, 
        startDate: DateTime.now().subtract(const Duration(days: 30)),
        endDate: DateTime.now().add(const Duration(days: 365))
      );
      if (mounted) {
        setState(() {
          _absentDateRanges = slots.where((s) => s.isDateRange == true).toList();
        });
      }
    } catch (_) {} finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _deleteAbsentDateRange(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Remove Date Range'),
        content: const Text('Are you sure you want to remove this absent date range?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('No')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error, foregroundColor: Colors.white),
            child: const Text('Yes')
          ),
        ],
      ),
    );
    if (confirm != true) return;
    
    setState(() => _isBroadcasting = true);
    try {
      await TimeSlotService().deleteAbsentSlot(id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Absent date range removed'), backgroundColor: AppColors.success),
        );
      }
      _loadAbsentDateRanges();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _isBroadcasting = false);
    }
  }

  Future<void> _reload() async {
    if (_modeIndex == 0) {
      await _searchBookings();
    } else if (_modeIndex == 1) {
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

  Future<void> _markMultipleAbsent() async {
    if (_selectedDoctor == null) return;
    final auth = ref.read(authProvider);
    final dispensaryId = auth.selectedDispensary?.id;
    if (dispensaryId == null) return;
    
    setState(() => _isBroadcasting = true);
    try {
      final startStr = DateFormat('yyyy-MM-dd').format(_startDate);
      final endStr = DateFormat('yyyy-MM-dd').format(_endDate);
      final conflictRes = await TimeSlotService().checkConflicts({
        'doctorId': _selectedDoctor!.id,
        'dispensaryId': dispensaryId,
        'startDate': startStr,
        'endDate': endStr,
      });
      if (conflictRes['hasOverlap'] == true) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(conflictRes['message'] ?? 'Overlapping absences exist')));
        return;
      }
      final bookingCount = conflictRes['bookingCount'] ?? 0;
      bool proceed = true;
      if (bookingCount > 0) {
        proceed = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Cancel Existing Bookings?'),
            content: Text('There are $bookingCount booking(s) across these dates for this doctor. Do you want to cancel these sessions? This action will notify affected patients via SMS.'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('No')),
              ElevatedButton(
                onPressed: () => Navigator.pop(ctx, true),
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.error, foregroundColor: Colors.white),
                child: const Text('Yes')
              ),
            ],
          ),
        ) ?? false;
        if (proceed != true) {
          setState(() => _isBroadcasting = false);
          return;
        }
      }
      
      if (_editingAbsentSlotId != null) {
        await TimeSlotService().updateAbsentDateRange(_editingAbsentSlotId!, {
          'doctorId': _selectedDoctor!.id,
          'dispensaryId': dispensaryId,
          'startDate': startStr,
          'endDate': endStr,
          'force': true,
        });
      } else {
        await TimeSlotService().createAbsentDateRange({
          'doctorId': _selectedDoctor!.id,
          'dispensaryId': dispensaryId,
          'startDate': startStr,
          'endDate': endStr,
          'force': proceed,
        });
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
           SnackBar(content: Text(_editingAbsentSlotId != null ? 'Date range updated' : 'Marked as absent successfully'), backgroundColor: AppColors.success),
        );
        setState(() {
          _isMultipleAddMode = false;
          _editingAbsentSlotId = null;
        });
        _loadAbsentDateRanges();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _isBroadcasting = false);
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
                SegmentedButton<int>(
                  segments: const [
                    ButtonSegment(
                        value: 0,
                        label: Text('Search'),
                        icon: Icon(Icons.search)),
                    ButtonSegment(
                        value: 1,
                        label: Text('Session'),
                        icon: Icon(Icons.list)),
                    ButtonSegment(
                        value: 2,
                        label: Text('Multiple'),
                        icon: Icon(Icons.date_range)),
                  ],
                  selected: {_modeIndex},
                  onSelectionChanged: (v) {
                    setState(() {
                      _modeIndex = v.first;
                      _bookings = [];
                    });
                  },
                ),
                const SizedBox(height: 12),

                if (_modeIndex == 0)
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
                else if (_modeIndex == 1)
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
                      if (_modeIndex == 1 && _selectedDoctor != null) ...[
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
                  )
                else if (_modeIndex == 2)
                  if (!_isMultipleAddMode)
                    Column(
                      children: [
                        DropdownButtonFormField<Doctor>(
                          value: _selectedDoctor,
                          decoration: const InputDecoration(
                            hintText: 'Select Doctor',
                            contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          ),
                          items: _doctors.map((d) => DropdownMenuItem(value: d, child: Text(d.name))).toList(),
                          onChanged: (d) {
                            setState(() => _selectedDoctor = d);
                            _loadAbsentDateRanges();
                          },
                        ),
                        const SizedBox(height: 8),
                        if (_selectedDoctor != null) ...[
                          if (_absentDateRanges.isEmpty)
                            const Padding(padding: EdgeInsets.all(16.0), child: Text('No absent date ranges found.', style: TextStyle(color: Colors.grey)))
                          else
                            ListView.separated(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: _absentDateRanges.length,
                              separatorBuilder: (_, __) => const Divider(height: 1),
                              itemBuilder: (ctx, i) {
                                final r = _absentDateRanges[i];
                                final df = DateFormat('MMM dd, yyyy');
                                return ListTile(
                                  dense: true,
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 4.0),
                                  title: Text('${r.startDate != null ? df.format(r.startDate!.toLocal()) : ''} to ${r.endDate != null ? df.format(r.endDate!.toLocal()) : ''}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                  trailing: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      IconButton(
                                        icon: const Icon(Icons.edit, size: 20, color: Colors.blue),
                                        onPressed: () {
                                          setState(() {
                                            _startDate = r.startDate ?? DateTime.now();
                                            _endDate = r.endDate ?? DateTime.now().add(const Duration(days: 3));
                                            _editingAbsentSlotId = r.id;
                                            _isMultipleAddMode = true;
                                          });
                                        }
                                      ),
                                      IconButton(
                                        icon: const Icon(Icons.delete, size: 20, color: Colors.red),
                                        onPressed: () => _deleteAbsentDateRange(r.id),
                                      ),
                                    ],
                                  ),
                                );
                              }
                            ),
                          const SizedBox(height: 8),
                          SizedBox(
                            width: double.infinity,
                            child: OutlinedButton.icon(
                              icon: const Icon(Icons.add),
                              label: const Text('Add New Absent Range'),
                              onPressed: () => setState(() {
                                _isMultipleAddMode = true;
                                _editingAbsentSlotId = null;
                                _startDate = DateTime.now();
                                _endDate = DateTime.now().add(const Duration(days: 3));
                              }),
                            ),
                          ),
                        ]
                      ]
                    )
                  else
                    Column(
                      children: [
                        Row(
                          children: [
                             IconButton(
                               icon: const Icon(Icons.arrow_back), 
                               onPressed: () => setState(() => _isMultipleAddMode = false)
                             ),
                             Expanded(child: Text(_editingAbsentSlotId != null ? 'Edit Absent Range' : 'New Absent Range', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16))),
                          ]
                        ),
                        Row(
                          children: [
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: () async {
                                  final picked = await showDatePicker(
                                    context: context,
                                    initialDate: _startDate,
                                    firstDate: DateTime.now().subtract(const Duration(days: 30)),
                                    lastDate: DateTime.now().add(const Duration(days: 30)),
                                  );
                                  if (picked != null) setState(() => _startDate = picked);
                                },
                                icon: const Icon(Icons.date_range, size: 16),
                                label: Text(DateFormat('MMM dd').format(_startDate)),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: () async {
                                  final picked = await showDatePicker(
                                    context: context,
                                    initialDate: _endDate,
                                    firstDate: _startDate,
                                    lastDate: DateTime.now().add(const Duration(days: 60)),
                                  );
                                  if (picked != null) setState(() => _endDate = picked);
                                },
                                icon: const Icon(Icons.date_range, size: 16),
                                label: Text(DateFormat('MMM dd').format(_endDate)),
                              ),
                            ),
                          ]
                        ),
                        const SizedBox(height: 8),
                        DropdownButtonFormField<Doctor>(
                          value: _selectedDoctor,
                          decoration: const InputDecoration(
                            hintText: 'Select Doctor',
                            contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          ),
                          items: _doctors.map((d) => DropdownMenuItem(value: d, child: Text(d.name))).toList(),
                          onChanged: (d) => setState(() => _selectedDoctor = d),
                        ),
                        if (_selectedDoctor != null) ...[
                          const SizedBox(height: 8),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              onPressed: _isBroadcasting ? null : _markMultipleAbsent,
                              style: ElevatedButton.styleFrom(backgroundColor: AppColors.error, foregroundColor: Colors.white),
                              child: _isBroadcasting ? const SizedBox(height: 16, width: 16, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) : Text(_editingAbsentSlotId != null ? 'Update Absent Range' : 'Mark Absent'),
                            ),
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
