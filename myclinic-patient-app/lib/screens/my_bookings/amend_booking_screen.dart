import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:myclinic_patient_app/config/theme.dart';
import 'package:myclinic_patient_app/l10n/translations.dart';
import 'package:myclinic_patient_app/providers/booking_provider.dart';
import 'package:myclinic_patient_app/services/api_service.dart';
import 'package:myclinic_patient_app/services/booking_service.dart';
import 'package:myclinic_patient_app/utils/formatters.dart';
import 'package:myclinic_patient_app/utils/helpers.dart';
import 'package:myclinic_patient_app/widgets/buttons/primary_button.dart';
import 'package:myclinic_patient_app/widgets/common/loading_widget.dart';
import 'package:myclinic_patient_app/widgets/common/error_widget.dart';

class AmendBookingScreen extends ConsumerStatefulWidget {
  final String bookingId;
  const AmendBookingScreen({super.key, required this.bookingId});

  @override
  ConsumerState<AmendBookingScreen> createState() => _AmendBookingScreenState();
}

class _AmendBookingScreenState extends ConsumerState<AmendBookingScreen> {
  DateTime? _selectedDate;
  Map<String, dynamic>? _selectedSlot;
  List<Map<String, dynamic>> _slots = [];
  List<DateTime> _disabledDates = [];
  bool _loadingSlots = false;
  bool _submitting = false;
  DateTime _focusedDay = DateTime.now();

  @override
  Widget build(BuildContext context) {
    final booking = ref.watch(bookingByIdProvider(widget.bookingId));

    return Scaffold(
      appBar: AppBar(title: Text(context.tr('amendBooking'))),
      body: booking.when(
        data: (b) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Card(
                  color: AppTheme.warningLight,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(context.tr('currentAppointment'), style: const TextStyle(fontWeight: FontWeight.w600, color: AppTheme.warning)),
                        const SizedBox(height: 8),
                        Text('${context.tr('date')}: ${Formatters.formatDate(b.bookingDate)}'),
                        Text('${context.tr('time')}: ${b.timeSlot}'),
                        Text('${context.tr('doctor')}: ${b.doctorName}'),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Text(context.tr('selectNewDate'), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                Card(
                  child: TableCalendar(
                    firstDay: DateTime.now(),
                    lastDay: DateTime.now().add(const Duration(days: 30)),
                    focusedDay: _focusedDay,
                    selectedDayPredicate: (day) => isSameDay(_selectedDate, day),
                    enabledDayPredicate: (day) => !_disabledDates.any((d) => isSameDay(d, day)),
                    onDaySelected: (selected, focused) {
                      setState(() {
                        _selectedDate = selected;
                        _focusedDay = focused;
                        _selectedSlot = null;
                      });
                      _loadAvailableSlots(b.doctorIdStr, b.dispensaryIdStr, selected);
                    },
                    calendarStyle: CalendarStyle(
                      selectedDecoration: const BoxDecoration(color: AppTheme.primary, shape: BoxShape.circle),
                      todayDecoration: BoxDecoration(color: AppTheme.primary.withValues(alpha: 0.2), shape: BoxShape.circle),
                    ),
                    headerStyle: const HeaderStyle(formatButtonVisible: false, titleCentered: true),
                  ),
                ),
                const SizedBox(height: 16),
                if (_loadingSlots)
                  const Center(child: CircularProgressIndicator())
                else if (_selectedDate != null && _slots.isNotEmpty) ...[
                  Text(context.tr('selectNewSession'), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  ..._slots.map((slot) {
                    final isSelected = _selectedSlot != null &&
                        _selectedSlot!['appointmentNumber'] == slot['appointmentNumber'];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(
                          color: isSelected ? AppTheme.primary : Colors.transparent,
                          width: 2,
                        ),
                      ),
                      child: ListTile(
                        leading: const Icon(Icons.access_time_rounded, color: AppTheme.primary),
                        title: Text('Appointment #${slot['appointmentNumber']}', overflow: TextOverflow.ellipsis),
                        subtitle: Text(
                          'Estimated Time: ${slot['estimatedTime'] ?? '-'}\nDuration: ${slot['minutesPerPatient'] ?? '-'} minutes',
                          overflow: TextOverflow.ellipsis,
                        ),
                        isThreeLine: true,
                        trailing: isSelected
                            ? const Icon(Icons.check_circle_rounded, color: AppTheme.primary)
                            : null,
                        onTap: () => setState(() => _selectedSlot = slot),
                      ),
                    );
                  }),
                ],
                if (_selectedDate != null && _slots.isEmpty && !_loadingSlots)
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Center(child: Text(context.tr('noSlotsAvailable'), style: const TextStyle(color: AppTheme.textSecondary))),
                    ),
                  ),
                const SizedBox(height: 24),
                if (_selectedSlot != null)
                  PrimaryButton(
                    text: context.tr('confirmAmendment'),
                    isLoading: _submitting,
                    useGradient: true,
                    onPressed: () => _amendBooking(b.doctorIdStr, b.dispensaryIdStr),
                  ),
              ],
            ),
          );
        },
        loading: () => const LoadingWidget(),
        error: (e, _) => AppErrorWidget(message: context.tr('error'), onRetry: () => ref.invalidate(bookingByIdProvider(widget.bookingId))),
      ),
    );
  }

  Future<void> _loadAvailableSlots(String doctorId, String dispensaryId, DateTime date) async {
    setState(() => _loadingSlots = true);
    try {
      final dateStr = Formatters.formatDateFromDateTime(date);
      final data = await ref.read(bookingServiceProvider).getAvailableSlots(
        doctorId, dispensaryId, dateStr, excludeBookingId: widget.bookingId,
      );
      final slotsList = data['slots'];
      if (slotsList is List) {
        _slots = slotsList.map((s) => Map<String, dynamic>.from(s as Map)).toList();
      } else {
        _slots = [];
      }
    } catch (_) {
      _slots = [];
    }
    setState(() => _loadingSlots = false);
  }

  Future<void> _amendBooking(String doctorId, String dispensaryId) async {
    setState(() => _submitting = true);
    try {
      final dateStr = Formatters.formatDateFromDateTime(_selectedDate!);
      // Backend expects { newDate, appointmentNumber }
      await ref.read(bookingServiceProvider).amendBooking(widget.bookingId, {
        'newDate': dateStr,
        'appointmentNumber': _selectedSlot!['appointmentNumber'],
      });
      ref.invalidate(bookingByIdProvider(widget.bookingId));
      ref.invalidate(myBookingsProvider);
      if (mounted) {
        showSnackBar(context, context.tr('bookingAmended'));
        context.pop();
      }
    } catch (e) {
      if (mounted) showSnackBar(context, ApiService.extractError(e), isError: true);
    }
    setState(() => _submitting = false);
  }
}
