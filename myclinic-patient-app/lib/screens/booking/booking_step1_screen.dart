import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:myclinic_patient_app/config/theme.dart';
import 'package:myclinic_patient_app/l10n/translations.dart';
import 'package:myclinic_patient_app/models/doctor.dart';
import 'package:myclinic_patient_app/models/time_slot.dart';
import 'package:myclinic_patient_app/providers/booking_provider.dart';
import 'package:myclinic_patient_app/providers/doctor_provider.dart';
import 'package:myclinic_patient_app/providers/dispensary_provider.dart';
import 'package:myclinic_patient_app/widgets/buttons/primary_button.dart';

class BookingStep1Screen extends ConsumerStatefulWidget {
  final Doctor? preSelectedDoctor;
  const BookingStep1Screen({super.key, this.preSelectedDoctor});

  @override
  ConsumerState<BookingStep1Screen> createState() => _BookingStep1ScreenState();
}

class _BookingStep1ScreenState extends ConsumerState<BookingStep1Screen> {
  DateTime _focusedDay = DateTime.now();

  @override
  void initState() {
    super.initState();
    if (widget.preSelectedDoctor != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        final doc = widget.preSelectedDoctor!;
        ref.read(bookingFlowProvider.notifier).setDoctor(doc);
        // Auto-select first dispensary
        final allDisps = ref.read(dispensariesProvider).valueOrNull ?? [];
        final doctorDisps = allDisps.where((d) => doc.dispensaries.contains(d.id)).toList();
        if (doctorDisps.isNotEmpty) {
          ref.read(bookingFlowProvider.notifier).setDispensary(doctorDisps.first);
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(bookingFlowProvider);
    final doctors = ref.watch(doctorsProvider);
    final dispensaries = ref.watch(dispensariesProvider);
    final allSessionsFull = state.availableSessions.isNotEmpty &&
        state.availableSessions.every((s) => s.isFull);

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // Gradient App Bar
          SliverAppBar(
            expandedHeight: 120,
            pinned: true,
            leading: Navigator.canPop(context)
                ? IconButton(icon: const Icon(Icons.arrow_back_rounded, color: Colors.white), onPressed: () => context.pop())
                : null,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(gradient: AppTheme.heroGradient),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Padding(
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(Icons.calendar_month_rounded, color: Colors.white, size: 24),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(context.tr('bookAppointment'),
                                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: Colors.white)),
                                Text('Follow the steps below',
                                  style: TextStyle(fontSize: 13, color: Colors.white.withValues(alpha: 0.8))),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            backgroundColor: AppTheme.primary,
          ),

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Progress Steps
                  Container(
                    padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
                    decoration: BoxDecoration(
                      color: AppTheme.primarySurface,
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Row(
                      children: [
                        _StepBadge(number: '1', label: context.tr('selectDoctor'), isActive: true),
                        Expanded(child: Container(height: 2, margin: const EdgeInsets.symmetric(horizontal: 8), color: AppTheme.border)),
                        _StepBadge(number: '2', label: context.tr('confirm'), isActive: false),
                      ],
                    ),
                  ).animate().fadeIn(duration: 300.ms),
                  const SizedBox(height: 24),

                  // Select Doctor
                  _SectionLabel(icon: Icons.medical_services_rounded, label: context.tr('selectDoctor'), color: AppTheme.primary),
                  const SizedBox(height: 10),
                  doctors.when(
                    data: (list) {
                      final active = list.where((d) => !d.disabled).toList();
                      return Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppTheme.primary.withValues(alpha: 0.2)),
                        ),
                        child: DropdownButtonFormField<String>(
                          value: state.selectedDoctor?.id,
                          hint: Text(context.tr('chooseDoctor2')),
                          decoration: InputDecoration(
                            prefixIcon: const Icon(Icons.person_search_rounded, color: AppTheme.primary),
                            border: InputBorder.none,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                          ),
                          isExpanded: true,
                          items: active.map((d) => DropdownMenuItem(
                            value: d.id,
                            child: Text('${d.name} - ${d.specialization}', overflow: TextOverflow.ellipsis, maxLines: 1),
                          )).toList(),
                          onChanged: (id) {
                            if (id != null) {
                              final doc = active.firstWhere((d) => d.id == id);
                              ref.read(bookingFlowProvider.notifier).setDoctor(doc);
                              // Auto-select first dispensary for this doctor
                              final allDisps = dispensaries.valueOrNull ?? [];
                              final doctorDisps = allDisps.where((d) => doc.dispensaries.contains(d.id)).toList();
                              if (doctorDisps.isNotEmpty) {
                                WidgetsBinding.instance.addPostFrameCallback((_) {
                                  ref.read(bookingFlowProvider.notifier).setDispensary(doctorDisps.first);
                                });
                              }
                            }
                          },
                        ),
                      );
                    },
                    loading: () => const LinearProgressIndicator(),
                    error: (_, __) => Text(context.tr('error')),
                  ),
                  const SizedBox(height: 22),

                  // Select Dispensary
                  if (state.selectedDoctor != null) ...[
                    _SectionLabel(icon: Icons.local_hospital_rounded, label: context.tr('selectDispensary'), color: AppTheme.success),
                    const SizedBox(height: 10),
                    dispensaries.when(
                      data: (list) {
                        final filtered = list.where((d) => state.selectedDoctor!.dispensaries.contains(d.id)).toList();
                        return Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppTheme.success.withValues(alpha: 0.2)),
                          ),
                          child: DropdownButtonFormField<String>(
                            value: state.selectedDispensary?.id,
                            hint: Text(context.tr('chooseDispensary')),
                            decoration: InputDecoration(
                              prefixIcon: const Icon(Icons.location_on_rounded, color: AppTheme.success),
                              border: InputBorder.none,
                              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
                            ),
                            isExpanded: true,
                            items: filtered.map((d) => DropdownMenuItem(
                              value: d.id,
                              child: Text(d.name, overflow: TextOverflow.ellipsis, maxLines: 1),
                            )).toList(),
                            onChanged: (id) {
                              if (id != null) {
                                final disp = filtered.firstWhere((d) => d.id == id);
                                ref.read(bookingFlowProvider.notifier).setDispensary(disp);
                              }
                            },
                          ),
                        );
                      },
                      loading: () => const LinearProgressIndicator(),
                      error: (_, __) => Text(context.tr('error')),
                    ),
                    const SizedBox(height: 22),
                  ],

                  // Select Date
                  if (state.selectedDispensary != null) ...[
                    _SectionLabel(icon: Icons.calendar_today_rounded, label: context.tr('selectDate'), color: AppTheme.info),
                    const SizedBox(height: 10),
                    Card(
                      elevation: 2,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      child: TableCalendar(
                        firstDay: DateTime.now(),
                        lastDay: DateTime.now().add(Duration(
                          days: state.selectedDoctor?.bookingVisibleDays
                              ?? state.selectedDispensary?.bookingVisibleDays
                              ?? 30,
                        )),
                        focusedDay: _focusedDay,
                        selectedDayPredicate: (day) => isSameDay(state.selectedDate, day),
                        enabledDayPredicate: (day) => !state.disabledDates.any((d) => isSameDay(d, day)),
                        onDaySelected: (selected, focused) {
                          setState(() => _focusedDay = focused);
                          ref.read(bookingFlowProvider.notifier).setDate(selected);
                        },
                        calendarStyle: CalendarStyle(
                          selectedDecoration: const BoxDecoration(color: AppTheme.primary, shape: BoxShape.circle),
                          todayDecoration: BoxDecoration(color: AppTheme.primary.withValues(alpha: 0.15), shape: BoxShape.circle),
                          todayTextStyle: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.w700),
                          disabledTextStyle: TextStyle(color: AppTheme.textLight.withValues(alpha: 0.5)),
                          weekendTextStyle: const TextStyle(color: AppTheme.error),
                          outsideTextStyle: const TextStyle(color: AppTheme.textLight),
                        ),
                        headerStyle: HeaderStyle(
                          formatButtonVisible: false,
                          titleCentered: true,
                          titleTextStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppTheme.text),
                          leftChevronIcon: const Icon(Icons.chevron_left_rounded, color: AppTheme.primary),
                          rightChevronIcon: const Icon(Icons.chevron_right_rounded, color: AppTheme.primary),
                        ),
                        daysOfWeekStyle: const DaysOfWeekStyle(
                          weekdayStyle: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textSecondary),
                          weekendStyle: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.error),
                        ),
                      ),
                    ).animate().fadeIn(duration: 400.ms),
                    const SizedBox(height: 20),
                  ],

                  // Replacement Doctor Warning
                  if (state.selectedDate != null && state.activeReplacement != null)
                    _ReplacementDoctorWarning(
                      replacement: state.activeReplacement!,
                      originalDoctorName: state.selectedDoctor?.name ?? '',
                    ),

                  // Select Session
                  if (state.selectedDate != null) ...[
                    _SectionLabel(icon: Icons.access_time_rounded, label: context.tr('selectSession'), color: AppTheme.warning),
                    const SizedBox(height: 10),
                    if (state.isLoading)
                      const Center(child: Padding(padding: EdgeInsets.all(24), child: CircularProgressIndicator()))
                    else if (state.availableSessions.isEmpty)
                      _buildUnavailableMessage(context, state.error)
                    else ...[
                      if (allSessionsFull)
                        Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: Colors.orange.shade50,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.orange.shade300),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.warning_amber_rounded, color: Colors.orange.shade700, size: 28),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(context.tr('fullyBooked'),
                                      style: TextStyle(fontWeight: FontWeight.w700, color: Colors.orange.shade800, fontSize: 14)),
                                    const SizedBox(height: 2),
                                    Text(context.tr('fullyBookedMsg'),
                                      style: TextStyle(fontSize: 12, color: Colors.orange.shade700)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ).animate().fadeIn(duration: 300.ms),

                      ...state.availableSessions.asMap().entries.map((entry) =>
                        _SessionCard(
                          session: entry.value,
                          isSelected: state.selectedSession?.timeSlotConfigId == entry.value.timeSlotConfigId,
                          onTap: entry.value.isFull ? null : () {
                            ref.read(bookingFlowProvider.notifier).setSession(entry.value);
                          },
                          index: entry.key,
                        ),
                      ),
                    ],

                    // Modified Schedule Warning
                    if (state.selectedSession != null && state.selectedSession!.isModified)
                      Container(
                        margin: const EdgeInsets.only(top: 12),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: Colors.amber.shade50,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.amber.shade300),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.schedule_rounded, color: Colors.amber.shade800, size: 24),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(context.tr('modifiedSchedule'),
                                    style: TextStyle(fontWeight: FontWeight.w700, color: Colors.amber.shade900)),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${context.tr('modifiedScheduleMsg')} ${context.tr('time')}: ${state.selectedSession!.startTime} - ${state.selectedSession!.endTime}',
                                    style: TextStyle(fontSize: 12, color: Colors.amber.shade800),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ).animate().fadeIn(duration: 300.ms),

                    const SizedBox(height: 16),
                  ],

                  // Next Appointment Card
                  if (state.selectedSession != null && state.nextAppointment != null)
                    _NextAppointmentCard(nextAppointment: state.nextAppointment!),

                  // Next Button
                  if (state.selectedSession != null)
                    PrimaryButton(
                      text: context.tr('next'),
                      icon: Icons.arrow_forward_rounded,
                      useGradient: true,
                      onPressed: () => context.push('/booking/details'),
                    ).animate().fadeIn(duration: 300.ms).slideY(begin: 0.1, end: 0),

                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

Widget _buildUnavailableMessage(BuildContext context, String? error) {
  String reason = '';
  String message = context.tr('noSlotsAvailable');
  IconData icon = Icons.event_busy_rounded;
  Color color = AppTheme.error;
  Color bgColor = AppTheme.errorLight;

  if (error != null && error.contains('|')) {
    final parts = error.split('|');
    reason = parts[0];
    message = parts[1];
  }

  if (reason == 'absent') {
    icon = Icons.person_off_rounded;
    color = AppTheme.error;
    bgColor = AppTheme.errorLight;
  } else if (reason == 'session_expired') {
    icon = Icons.timer_off_rounded;
    color = AppTheme.warning;
    bgColor = AppTheme.warningLight;
  } else if (reason == 'fully_booked') {
    icon = Icons.event_busy_rounded;
    color = const Color(0xFFEA580C);
    bgColor = const Color(0xFFFFF7ED);
  } else if (reason == 'no_config' || reason == 'no_schedule') {
    icon = Icons.calendar_today_rounded;
    color = AppTheme.textSecondary;
    bgColor = AppTheme.borderLight;
  }

  return Container(
    width: double.infinity,
    padding: const EdgeInsets.all(24),
    decoration: BoxDecoration(
      color: bgColor,
      borderRadius: BorderRadius.circular(14),
      border: Border.all(color: color.withValues(alpha: 0.2)),
    ),
    child: Column(
      children: [
        Icon(icon, size: 40, color: color.withValues(alpha: 0.7)),
        const SizedBox(height: 10),
        Text(message, style: TextStyle(color: color, fontWeight: FontWeight.w600, fontSize: 13), textAlign: TextAlign.center),
      ],
    ),
  );
}

// --- Reusable Widgets ---

class _SectionLabel extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  const _SectionLabel({required this.icon, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, size: 18, color: color),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Text(label, style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: color),
            overflow: TextOverflow.ellipsis),
        ),
      ],
    );
  }
}

class _StepBadge extends StatelessWidget {
  final String number;
  final String label;
  final bool isActive;
  const _StepBadge({required this.number, required this.label, required this.isActive});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 28, height: 28,
          decoration: BoxDecoration(
            color: isActive ? AppTheme.primary : AppTheme.border,
            shape: BoxShape.circle,
          ),
          child: Center(child: Text(number,
            style: TextStyle(color: isActive ? Colors.white : AppTheme.textSecondary, fontWeight: FontWeight.w700, fontSize: 13))),
        ),
        const SizedBox(width: 6),
        Text(label, style: TextStyle(fontSize: 12, color: isActive ? AppTheme.primary : AppTheme.textSecondary, fontWeight: isActive ? FontWeight.w600 : FontWeight.w400),
          overflow: TextOverflow.ellipsis),
      ],
    );
  }
}

class _SessionCard extends StatelessWidget {
  final Session session;
  final bool isSelected;
  final VoidCallback? onTap;
  final int index;

  const _SessionCard({required this.session, required this.isSelected, this.onTap, required this.index});

  @override
  Widget build(BuildContext context) {
    final isDisabled = session.isFull;

    return Opacity(
      opacity: isDisabled ? 0.5 : 1.0,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(14),
          color: isSelected ? AppTheme.primarySurface : AppTheme.surface,
          border: Border.all(
            color: isSelected ? AppTheme.primary : AppTheme.border,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: isDisabled
                        ? AppTheme.border
                        : isSelected
                            ? AppTheme.primary.withValues(alpha: 0.15)
                            : AppTheme.infoLight,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(Icons.access_time_rounded, size: 22,
                    color: isDisabled ? AppTheme.textLight : (isSelected ? AppTheme.primary : AppTheme.info)),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${session.startTime} - ${session.endTime}',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700,
                          color: isDisabled ? AppTheme.textLight : (isSelected ? AppTheme.primary : AppTheme.text)),
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: isDisabled ? AppTheme.errorLight : AppTheme.successLight,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              isDisabled ? context.tr('fullyBooked') : '${session.slotsRemaining} ${context.tr('slotsAvailable')}',
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600,
                                color: isDisabled ? AppTheme.error : AppTheme.success),
                            ),
                          ),
                          if (session.maxPatients != null) ...[
                            const SizedBox(width: 8),
                            Text('${session.currentBookings ?? 0}/${session.maxPatients} ${context.tr('slotsBooked')}',
                              style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                          ],
                        ],
                      ),
                    ],
                  ),
                ),
                if (session.isModified)
                  Container(
                    margin: const EdgeInsets.only(right: 4),
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(color: AppTheme.warningLight, borderRadius: BorderRadius.circular(8)),
                    child: Text(context.tr('modified'), style: const TextStyle(fontSize: 10, color: AppTheme.warning, fontWeight: FontWeight.w700)),
                  ),
                if (isSelected)
                  const Icon(Icons.check_circle_rounded, color: AppTheme.primary, size: 24),
              ],
            ),
          ),
        ),
      ),
    ).animate().fadeIn(delay: Duration(milliseconds: 50 * index), duration: 300.ms);
  }
}

class _ReplacementDoctorWarning extends StatelessWidget {
  final Map<String, dynamic> replacement;
  final String originalDoctorName;
  const _ReplacementDoctorWarning({required this.replacement, required this.originalDoctorName});

  String _formatDate(String? isoDate) {
    if (isoDate == null || isoDate.isEmpty) return '';
    try {
      final date = DateTime.parse(isoDate);
      final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return '${months[date.month - 1]} ${date.day.toString().padLeft(2, '0')}, ${date.year}';
    } catch (_) {
      return isoDate;
    }
  }

  @override
  Widget build(BuildContext context) {
    final replacementName = replacement['replacementName'] ?? '';
    final startDate = _formatDate(replacement['startDate']?.toString());
    final endDate = _formatDate(replacement['endDate']?.toString());

    if (replacementName.isEmpty) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.amber.shade50,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.amber.shade300),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: Colors.amber.shade200, borderRadius: BorderRadius.circular(10)),
            child: Icon(Icons.swap_horiz_rounded, color: Colors.amber.shade800, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(context.tr('replacementDoctor'),
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: Colors.amber.shade900)),
                const SizedBox(height: 6),
                RichText(
                  text: TextSpan(
                    style: TextStyle(fontSize: 13, color: Colors.amber.shade800, height: 1.5),
                    children: [
                      const TextSpan(text: 'Please note: '),
                      TextSpan(text: replacementName, style: const TextStyle(fontWeight: FontWeight.w700)),
                      const TextSpan(text: ' will be attending in place of '),
                      TextSpan(text: originalDoctorName, style: const TextStyle(fontWeight: FontWeight.w700)),
                      if (startDate.isNotEmpty && endDate.isNotEmpty)
                        TextSpan(text: ' from $startDate to $endDate'),
                      const TextSpan(text: '.'),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 300.ms);
  }
}

class _NextAppointmentCard extends StatelessWidget {
  final Map<String, dynamic> nextAppointment;
  const _NextAppointmentCard({required this.nextAppointment});

  @override
  Widget build(BuildContext context) {
    final appointmentNumber = nextAppointment['appointmentNumber'] ?? '-';
    final estimatedTime = nextAppointment['estimatedTime']?.toString() ?? '';
    final minutesPerPatient = nextAppointment['minutesPerPatient'] ?? 15;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.primarySurface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.primary.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: AppTheme.primary, borderRadius: BorderRadius.circular(10)),
                child: const Icon(Icons.event_available_rounded, color: Colors.white, size: 20),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(context.tr('appointmentDetails'),
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.primary)),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(color: AppTheme.successLight, borderRadius: BorderRadius.circular(20)),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(width: 6, height: 6, decoration: const BoxDecoration(color: AppTheme.success, shape: BoxShape.circle)),
                    const SizedBox(width: 4),
                    Text(context.tr('readyForBooking'), style: const TextStyle(fontSize: 10, color: AppTheme.success, fontWeight: FontWeight.w600)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _InfoChip(icon: Icons.confirmation_number_rounded, label: 'Apt. #', value: '#$appointmentNumber', color: AppTheme.primary)),
              const SizedBox(width: 10),
              if (estimatedTime.isNotEmpty)
                Expanded(child: _InfoChip(icon: Icons.schedule_rounded, label: context.tr('appointmentTime'), value: estimatedTime, color: AppTheme.info)),
              if (estimatedTime.isNotEmpty) const SizedBox(width: 10),
              Expanded(child: _InfoChip(icon: Icons.timelapse_rounded, label: context.tr('duration'), value: '$minutesPerPatient min', color: AppTheme.warning)),
            ],
          ),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.05, end: 0);
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;
  const _InfoChip({required this.icon, required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withValues(alpha: 0.12)),
      ),
      child: Column(
        children: [
          Icon(icon, size: 18, color: color.withValues(alpha: 0.8)),
          const SizedBox(height: 4),
          Text(label, style: TextStyle(fontSize: 9, color: color), overflow: TextOverflow.ellipsis),
          Text(value, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: color), overflow: TextOverflow.ellipsis),
        ],
      ),
    );
  }
}
