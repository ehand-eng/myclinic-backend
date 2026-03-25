import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:myclinic_patient_app/models/booking.dart';
import 'package:myclinic_patient_app/models/doctor.dart';
import 'package:myclinic_patient_app/models/dispensary.dart';
import 'package:myclinic_patient_app/models/fee.dart';
import 'package:myclinic_patient_app/models/time_slot.dart';
import 'package:myclinic_patient_app/services/booking_service.dart';
import 'package:myclinic_patient_app/services/doctor_service.dart';
import 'package:myclinic_patient_app/services/fee_service.dart';
import 'package:myclinic_patient_app/services/time_slot_service.dart';

// My Bookings
final myBookingsProvider = FutureProvider<List<Booking>>((ref) async {
  final service = ref.watch(bookingServiceProvider);
  return service.getMyBookings();
});

final bookingByIdProvider = FutureProvider.family<Booking, String>((ref, id) async {
  final service = ref.watch(bookingServiceProvider);
  return service.getBookingById(id);
});

final bookingSummaryProvider =
    FutureProvider.family<Map<String, dynamic>, String>((ref, transactionId) async {
  final service = ref.watch(bookingServiceProvider);
  return service.getBookingSummary(transactionId);
});

final bookingFilterProvider = StateProvider<String>((ref) => 'all');

final filteredBookingsProvider = Provider<AsyncValue<List<Booking>>>((ref) {
  final bookings = ref.watch(myBookingsProvider);
  final filter = ref.watch(bookingFilterProvider);

  return bookings.whenData((list) {
    switch (filter) {
      case 'upcoming':
        return list.where((b) => b.status == 'scheduled' || b.status == 'checked_in').toList();
      case 'completed':
        return list.where((b) => b.status == 'completed').toList();
      case 'cancelled':
        return list.where((b) => b.status == 'cancelled').toList();
      default:
        return list;
    }
  });
});

// Booking Flow
class BookingFlowState {
  final Doctor? selectedDoctor;
  final Dispensary? selectedDispensary;
  final DateTime? selectedDate;
  final Session? selectedSession;
  final List<Session> availableSessions;
  final DoctorDispensaryFee? fees;
  final List<DateTime> disabledDates;
  final bool isLoading;
  final String? error;
  final Map<String, dynamic>? activeReplacement;
  final Map<String, dynamic>? nextAppointment;

  const BookingFlowState({
    this.selectedDoctor,
    this.selectedDispensary,
    this.selectedDate,
    this.selectedSession,
    this.availableSessions = const [],
    this.fees,
    this.disabledDates = const [],
    this.isLoading = false,
    this.error,
    this.activeReplacement,
    this.nextAppointment,
  });

  BookingFlowState copyWith({
    Doctor? selectedDoctor,
    Dispensary? selectedDispensary,
    DateTime? selectedDate,
    Session? selectedSession,
    List<Session>? availableSessions,
    DoctorDispensaryFee? fees,
    List<DateTime>? disabledDates,
    bool? isLoading,
    String? error,
    Map<String, dynamic>? activeReplacement,
    Map<String, dynamic>? nextAppointment,
    bool clearDoctor = false,
    bool clearDispensary = false,
    bool clearDate = false,
    bool clearSession = false,
    bool clearFees = false,
    bool clearReplacement = false,
    bool clearNextAppointment = false,
  }) {
    return BookingFlowState(
      selectedDoctor: clearDoctor ? null : (selectedDoctor ?? this.selectedDoctor),
      selectedDispensary: clearDispensary ? null : (selectedDispensary ?? this.selectedDispensary),
      selectedDate: clearDate ? null : (selectedDate ?? this.selectedDate),
      selectedSession: clearSession ? null : (selectedSession ?? this.selectedSession),
      availableSessions: availableSessions ?? this.availableSessions,
      fees: clearFees ? null : (fees ?? this.fees),
      disabledDates: disabledDates ?? this.disabledDates,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      activeReplacement: clearReplacement ? null : (activeReplacement ?? this.activeReplacement),
      nextAppointment: clearNextAppointment ? null : (nextAppointment ?? this.nextAppointment),
    );
  }
}

class BookingFlowNotifier extends StateNotifier<BookingFlowState> {
  final TimeSlotService _timeSlotService;
  final FeeService _feeService;
  final BookingService _bookingService;
  final DoctorService _doctorService;

  BookingFlowNotifier(this._timeSlotService, this._feeService, this._bookingService, this._doctorService)
      : super(const BookingFlowState());

  void setDoctor(Doctor doctor) {
    state = state.copyWith(
      selectedDoctor: doctor,
      clearDispensary: true,
      clearDate: true,
      clearSession: true,
      availableSessions: [],
      clearFees: true,
      disabledDates: [],
      clearReplacement: true,
      clearNextAppointment: true,
    );
  }

  void setDispensary(Dispensary dispensary) {
    state = state.copyWith(
      selectedDispensary: dispensary,
      clearDate: true,
      clearSession: true,
      availableSessions: [],
      clearReplacement: true,
      clearNextAppointment: true,
    );
    _loadDisabledDates();
    _loadFees();
  }

  void setDate(DateTime date) {
    state = state.copyWith(selectedDate: date, clearSession: true, clearNextAppointment: true);
    _loadSessions();
    _loadReplacement();
  }

  void setSession(Session session) {
    state = state.copyWith(selectedSession: session, clearNextAppointment: true);
    _loadNextAppointment();
  }

  Future<void> _loadSessions() async {
    if (state.selectedDoctor == null || state.selectedDispensary == null || state.selectedDate == null) return;
    state = state.copyWith(isLoading: true);
    try {
      final date = '${state.selectedDate!.year}-${state.selectedDate!.month.toString().padLeft(2, '0')}-${state.selectedDate!.day.toString().padLeft(2, '0')}';
      // Use available slots API which returns sessions with slot counts
      final data = await _timeSlotService.getAvailableSlots(
        state.selectedDoctor!.id, state.selectedDispensary!.id, date,
      );
      // Check if date is unavailable (absent, no_config, session_expired)
      final isAvailable = data['available'];
      if (isAvailable == false) {
        final reason = data['reason']?.toString() ?? '';
        final message = data['message']?.toString() ?? 'No slots available';
        state = state.copyWith(availableSessions: [], isLoading: false, error: '$reason|$message');
        return;
      }

      final sessionsList = data['sessions'];
      final List<Session> sessions = [];
      if (sessionsList is List) {
        for (final s in sessionsList) {
          if (s is Map) {
            sessions.add(Session(
              startTime: s['startTime'] ?? '',
              endTime: s['endTime'] ?? '',
              timeSlot: '${s['startTime'] ?? ''} - ${s['endTime'] ?? ''}',
              timeSlotConfigId: s['timeSlotConfigId'] ?? '',
              isModified: s['isModified'] ?? false,
              maxPatients: s['totalSlots'] ?? s['maxPatients'],
              currentBookings: s['bookedSlots'] ?? s['currentBookings'],
              availableSlots: s['availableSlots'],
            ));
          }
        }
      }
      // If no sessions from available API, fallback to sessions API
      if (sessions.isEmpty) {
        final fallbackSessions = await _timeSlotService.getSessions(
          state.selectedDoctor!.id, state.selectedDispensary!.id, date,
        );
        state = state.copyWith(availableSessions: fallbackSessions, isLoading: false);
        // Auto-select first available session
        final firstAvailable = fallbackSessions.where((s) => !s.isFull).firstOrNull;
        if (firstAvailable != null) {
          setSession(firstAvailable);
        }
      } else {
        state = state.copyWith(availableSessions: sessions, isLoading: false);
        // Auto-select first available session
        final firstAvailable = sessions.where((s) => !s.isFull).firstOrNull;
        if (firstAvailable != null) {
          setSession(firstAvailable);
        }
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Failed to load sessions');
    }
  }

  Future<void> _loadFees() async {
    if (state.selectedDoctor == null || state.selectedDispensary == null) return;
    try {
      final fees = await _feeService.getFees(
        state.selectedDoctor!.id, state.selectedDispensary!.id,
      );
      state = state.copyWith(fees: fees);
    } catch (_) {}
  }

  Future<void> _loadDisabledDates() async {
    if (state.selectedDoctor == null || state.selectedDispensary == null) return;
    try {
      final dates = await _timeSlotService.getDisabledDates(
        state.selectedDoctor!.id, state.selectedDispensary!.id,
      );
      state = state.copyWith(disabledDates: dates);
    } catch (_) {}
  }

  Future<void> _loadReplacement() async {
    if (state.selectedDoctor == null || state.selectedDispensary == null || state.selectedDate == null) {
      state = BookingFlowState(
        selectedDoctor: state.selectedDoctor,
        selectedDispensary: state.selectedDispensary,
        selectedDate: state.selectedDate,
        selectedSession: state.selectedSession,
        availableSessions: state.availableSessions,
        fees: state.fees,
        disabledDates: state.disabledDates,
        isLoading: state.isLoading,
        activeReplacement: null,
        nextAppointment: state.nextAppointment,
      );
      return;
    }
    try {
      final date = '${state.selectedDate!.year}-${state.selectedDate!.month.toString().padLeft(2, '0')}-${state.selectedDate!.day.toString().padLeft(2, '0')}';
      final replacement = await _doctorService.getActiveReplacement(
        state.selectedDoctor!.id, state.selectedDispensary!.id, date,
      );
      // Force rebuild state with replacement (or null)
      state = BookingFlowState(
        selectedDoctor: state.selectedDoctor,
        selectedDispensary: state.selectedDispensary,
        selectedDate: state.selectedDate,
        selectedSession: state.selectedSession,
        availableSessions: state.availableSessions,
        fees: state.fees,
        disabledDates: state.disabledDates,
        isLoading: state.isLoading,
        activeReplacement: replacement,
        nextAppointment: state.nextAppointment,
      );
    } catch (_) {
      state = BookingFlowState(
        selectedDoctor: state.selectedDoctor,
        selectedDispensary: state.selectedDispensary,
        selectedDate: state.selectedDate,
        selectedSession: state.selectedSession,
        availableSessions: state.availableSessions,
        fees: state.fees,
        disabledDates: state.disabledDates,
        isLoading: state.isLoading,
        activeReplacement: null,
        nextAppointment: state.nextAppointment,
      );
    }
  }

  Future<void> _loadNextAppointment() async {
    if (state.selectedDoctor == null || state.selectedDispensary == null ||
        state.selectedDate == null || state.selectedSession == null) return;
    try {
      final date = '${state.selectedDate!.year}-${state.selectedDate!.month.toString().padLeft(2, '0')}-${state.selectedDate!.day.toString().padLeft(2, '0')}';
      final data = await _timeSlotService.getAvailableSlots(
        state.selectedDoctor!.id, state.selectedDispensary!.id, date,
      );
      // API returns: { sessions: [{ timeSlotConfigId, slots: [{ appointmentNumber, estimatedTime, ... }] }] }
      final sessions = data['sessions'];
      if (sessions is List) {
        for (final s in sessions) {
          if (s is Map && s['timeSlotConfigId'] == state.selectedSession!.timeSlotConfigId) {
            final slots = s['slots'];
            if (slots is List && slots.isNotEmpty) {
              // First slot in the list is the next available appointment
              final firstSlot = slots[0];
              final nextAppt = <String, dynamic>{
                'appointmentNumber': firstSlot['appointmentNumber'] ?? 1,
                'estimatedTime': firstSlot['estimatedTime'] ?? '',
                'minutesPerPatient': firstSlot['minutesPerPatient'] ?? s['minutesPerPatient'] ?? 15,
                'timeSlot': firstSlot['timeSlot'] ?? '',
              };
              state = BookingFlowState(
                selectedDoctor: state.selectedDoctor,
                selectedDispensary: state.selectedDispensary,
                selectedDate: state.selectedDate,
                selectedSession: state.selectedSession,
                availableSessions: state.availableSessions,
                fees: state.fees,
                disabledDates: state.disabledDates,
                isLoading: state.isLoading,
                activeReplacement: state.activeReplacement,
                nextAppointment: nextAppt,
              );
              return;
            }
          }
        }
      }
      // Fallback: try top-level slots
      final topSlots = data['slots'];
      if (topSlots is List && topSlots.isNotEmpty) {
        final firstSlot = topSlots[0];
        final nextAppt = <String, dynamic>{
          'appointmentNumber': firstSlot['appointmentNumber'] ?? 1,
          'estimatedTime': firstSlot['estimatedTime'] ?? '',
          'minutesPerPatient': firstSlot['minutesPerPatient'] ?? 15,
          'timeSlot': firstSlot['timeSlot'] ?? '',
        };
        state = BookingFlowState(
          selectedDoctor: state.selectedDoctor,
          selectedDispensary: state.selectedDispensary,
          selectedDate: state.selectedDate,
          selectedSession: state.selectedSession,
          availableSessions: state.availableSessions,
          fees: state.fees,
          disabledDates: state.disabledDates,
          isLoading: state.isLoading,
          activeReplacement: state.activeReplacement,
          nextAppointment: nextAppt,
        );
      }
    } catch (_) {}
  }

  Future<Booking> submitBooking(Map<String, dynamic> data) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final booking = await _bookingService.createBooking(data);
      state = state.copyWith(isLoading: false);
      return booking;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: 'Failed to create booking');
      rethrow;
    }
  }

  void reset() {
    state = const BookingFlowState();
  }
}

final bookingFlowProvider = StateNotifierProvider<BookingFlowNotifier, BookingFlowState>((ref) {
  return BookingFlowNotifier(
    ref.watch(timeSlotServiceProvider),
    ref.watch(feeServiceProvider),
    ref.watch(bookingServiceProvider),
    ref.watch(doctorServiceProvider),
  );
});
