import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';
import '../../models/time_slot.dart';
import '../../services/timeslot_service.dart';
import '../../services/doctor_service.dart';
import '../../services/dispensary_service.dart';
import '../../widgets/loading_widget.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/full_dialog.dart';

final timeSlotConfigsProvider = FutureProvider.family<List<TimeSlotConfig>,
    ({String doctorId, String dispensaryId})>((ref, p) async {
  return TimeSlotService().getConfigs(p.doctorId, p.dispensaryId);
});

final absentSlotsProvider = FutureProvider.family<List<AbsentTimeSlot>,
    ({String doctorId, String dispensaryId})>((ref, p) async {
  return TimeSlotService().getAbsentSlots(p.doctorId, p.dispensaryId);
});

class TimeSlotManageScreen extends ConsumerStatefulWidget {
  final String doctorId;
  final String dispensaryId;

  const TimeSlotManageScreen({
    super.key,
    required this.doctorId,
    required this.dispensaryId,
  });

  @override
  ConsumerState<TimeSlotManageScreen> createState() =>
      _TimeSlotManageScreenState();
}

class _TimeSlotManageScreenState extends ConsumerState<TimeSlotManageScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String? _doctorName;
  String? _dispensaryName;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadNames();
  }

  Future<void> _loadNames() async {
    try {
      final doctor = await DoctorService().getDoctorById(widget.doctorId);
      final disp =
          await DispensaryService().getDispensaryById(widget.dispensaryId);
      if (mounted) {
        setState(() {
          _doctorName = doctor.name;
          _dispensaryName = disp.name;
        });
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final params = (
      doctorId: widget.doctorId,
      dispensaryId: widget.dispensaryId,
    );

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(_doctorName ?? 'Time Slots',
                style: const TextStyle(fontSize: 16)),
            if (_dispensaryName != null)
              Text(_dispensaryName!,
                  style: const TextStyle(
                      fontSize: 12, fontWeight: FontWeight.normal)),
          ],
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.textWhite,
          labelColor: AppColors.textWhite,
          unselectedLabelColor: AppColors.textWhite.withAlpha(150),
          tabs: const [
            Tab(text: 'Regular Schedule'),
            Tab(text: 'Absences'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _RegularScheduleTab(params: params),
          _AbsencesTab(params: params),
        ],
      ),
    );
  }
}

// ─── Regular Schedule Tab ────────────────────────────────────

class _RegularScheduleTab extends ConsumerWidget {
  final ({String doctorId, String dispensaryId}) params;
  const _RegularScheduleTab({required this.params});

  static const _dayNames = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday',
    'Thursday', 'Friday', 'Saturday'
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final configsAsync = ref.watch(timeSlotConfigsProvider(params));

    return configsAsync.when(
      loading: () => const LoadingWidget(),
      error: (e, _) => Center(child: Text('Error: $e')),
      data: (configs) {
        if (configs.isEmpty) {
          return EmptyState(
            icon: Icons.schedule,
            title: 'No time slots configured',
            action: ElevatedButton.icon(
              onPressed: () => _showSlotDialog(context, ref, null),
              icon: const Icon(Icons.add),
              label: const Text('Add Time Slot'),
            ),
          );
        }

        final grouped = <int, List<TimeSlotConfig>>{};
        for (final c in configs) {
          grouped.putIfAbsent(c.dayOfWeek, () => []).add(c);
        }
        final sortedDays = grouped.keys.toList()
          ..sort((a, b) {
            final ai = a == 0 ? 7 : a;
            final bi = b == 0 ? 7 : b;
            return ai.compareTo(bi);
          });

        return Stack(
          children: [
            RefreshIndicator(
              onRefresh: () async =>
                  ref.invalidate(timeSlotConfigsProvider(params)),
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: sortedDays.map((day) {
                  final slots = grouped[day]!;
                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    decoration: BoxDecoration(
                      color: AppColors.card,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: ExpansionTile(
                      title: Text(_dayNames[day],
                          style:
                              const TextStyle(fontWeight: FontWeight.w600)),
                      subtitle: Text('${slots.length} session(s)',
                          style: const TextStyle(
                              fontSize: 12, color: AppColors.textSecondary)),
                      children: slots
                          .map((slot) => ListTile(
                                title: Text(
                                    '${slot.startTime} - ${slot.endTime}'),
                                subtitle: Text(
                                  'Max: ${slot.maxPatients} | ${slot.minutesPerPatient} min/patient',
                                  style: const TextStyle(fontSize: 12),
                                ),
                                trailing: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    IconButton(
                                      icon: const Icon(Icons.edit_outlined,
                                          size: 20),
                                      onPressed: () => _showSlotDialog(
                                          context, ref, slot),
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.delete_outline,
                                          size: 20, color: AppColors.error),
                                      onPressed: () => _deleteSlot(
                                          context, ref, slot.id),
                                    ),
                                  ],
                                ),
                              ))
                          .toList(),
                    ),
                  );
                }).toList(),
              ),
            ),
            Positioned(
              bottom: 16,
              right: 16,
              child: FloatingActionButton(
                backgroundColor: AppColors.primary,
                onPressed: () => _showSlotDialog(context, ref, null),
                child: const Icon(Icons.add, color: AppColors.textWhite),
              ),
            ),
          ],
        );
      },
    );
  }

  void _showSlotDialog(
      BuildContext context, WidgetRef ref, TimeSlotConfig? existing) {
    int dayOfWeek = existing?.dayOfWeek ?? 1;
    final startCtrl =
        TextEditingController(text: existing?.startTime ?? '09:00');
    final endCtrl =
        TextEditingController(text: existing?.endTime ?? '12:00');
    final maxCtrl =
        TextEditingController(text: '${existing?.maxPatients ?? 20}');
    final minCtrl =
        TextEditingController(text: '${existing?.minutesPerPatient ?? 15}');

    showFullDialog(
      context: context,
      title: existing != null ? 'Edit Time Slot' : 'Add Time Slot',
      builder: (ctx, setDialogState) => Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          DropdownButtonFormField<int>(
            value: dayOfWeek,
            decoration: const InputDecoration(labelText: 'Day of Week'),
            items: List.generate(
              7,
              (i) => DropdownMenuItem(value: i, child: Text(_dayNames[i])),
            ),
            onChanged: (v) =>
                setDialogState(() => dayOfWeek = v ?? dayOfWeek),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: startCtrl,
            decoration:
                const InputDecoration(labelText: 'Start Time (HH:MM)'),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: endCtrl,
            decoration:
                const InputDecoration(labelText: 'End Time (HH:MM)'),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: maxCtrl,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: 'Max Patients'),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: minCtrl,
            keyboardType: TextInputType.number,
            decoration:
                const InputDecoration(labelText: 'Minutes Per Patient'),
          ),
        ],
      ),
      actions: (ctx) => [
        TextButton(
          onPressed: () => Navigator.pop(ctx),
          child: const Text('Cancel'),
        ),
        const SizedBox(width: 8),
        ElevatedButton(
          onPressed: () async {
            Navigator.pop(ctx);
            try {
              final data = {
                'doctorId': params.doctorId,
                'dispensaryId': params.dispensaryId,
                'dayOfWeek': dayOfWeek,
                'startTime': startCtrl.text,
                'endTime': endCtrl.text,
                'maxPatients': int.tryParse(maxCtrl.text) ?? 20,
                'minutesPerPatient': int.tryParse(minCtrl.text) ?? 15,
              };
              if (existing != null) {
                await TimeSlotService().updateConfig(existing.id, data);
              } else {
                await TimeSlotService().createConfig(data);
              }
              ref.invalidate(timeSlotConfigsProvider(params));
            } catch (e) {
              if (context.mounted) {
                ScaffoldMessenger.of(context)
                    .showSnackBar(SnackBar(content: Text('Error: $e')));
              }
            }
          },
          child: Text(existing != null ? 'Update' : 'Add'),
        ),
      ],
    );
  }

  void _deleteSlot(BuildContext context, WidgetRef ref, String id) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Time Slot'),
        content: const Text('Are you sure?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await TimeSlotService().deleteConfig(id);
              ref.invalidate(timeSlotConfigsProvider(params));
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}

// ─── Absences Tab ────────────────────────────────────────────

class _AbsencesTab extends ConsumerWidget {
  final ({String doctorId, String dispensaryId}) params;
  const _AbsencesTab({required this.params});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final absentsAsync = ref.watch(absentSlotsProvider(params));
    final fmt = DateFormat('MMM dd, yyyy');

    return absentsAsync.when(
      loading: () => const LoadingWidget(),
      error: (e, _) => Center(child: Text('Error: $e')),
      data: (absents) {
        return Stack(
          children: [
            absents.isEmpty
                ? const EmptyState(
                    icon: Icons.event_busy,
                    title: 'No absences recorded',
                  )
                : RefreshIndicator(
                    onRefresh: () async =>
                        ref.invalidate(absentSlotsProvider(params)),
                    child: ListView.separated(
                      padding: const EdgeInsets.all(16),
                      itemCount: absents.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (context, index) {
                        final absent = absents[index];
                        return Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: AppColors.card,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: absent.isModifiedSession
                                      ? AppColors.warningLight
                                      : AppColors.errorLight,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Icon(
                                  absent.isModifiedSession
                                      ? Icons.edit_calendar
                                      : Icons.event_busy,
                                  color: absent.isModifiedSession
                                      ? AppColors.warning
                                      : AppColors.error,
                                  size: 20,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      absent.isModifiedSession
                                          ? 'Modified Session'
                                          : absent.isDateRange
                                              ? 'Date Range Absence'
                                              : 'Full Day Absence',
                                      style: const TextStyle(
                                          fontWeight: FontWeight.w600,
                                          fontSize: 14),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      absent.isDateRange
                                          ? '${fmt.format(absent.startDate!)} - ${fmt.format(absent.endDate!)}'
                                          : absent.date != null
                                              ? fmt.format(absent.date!)
                                              : 'N/A',
                                      style: const TextStyle(
                                          fontSize: 12,
                                          color: AppColors.textSecondary),
                                    ),
                                    if (absent.isModifiedSession &&
                                        absent.startTime != null)
                                      Text(
                                        '${absent.startTime} - ${absent.endTime ?? ''} | Max: ${absent.maxPatients ?? '-'}',
                                        style: const TextStyle(
                                            fontSize: 12,
                                            color: AppColors.warning),
                                      ),
                                    if (absent.reason != null &&
                                        absent.reason!.isNotEmpty)
                                      Text(absent.reason!,
                                          style: const TextStyle(
                                              fontSize: 12,
                                              color: AppColors.textLight)),
                                  ],
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.delete_outline,
                                    color: AppColors.error, size: 20),
                                onPressed: () async {
                                  final confirm = await showDialog<bool>(
                                    context: context,
                                    builder: (ctx) => AlertDialog(
                                      title: const Text('Delete'),
                                      content: const Text('Are you sure?'),
                                      actions: [
                                        TextButton(
                                          onPressed: () =>
                                              Navigator.pop(ctx, false),
                                          child: const Text('Cancel'),
                                        ),
                                        TextButton(
                                          onPressed: () =>
                                              Navigator.pop(ctx, true),
                                          style: TextButton.styleFrom(
                                              foregroundColor:
                                                  AppColors.error),
                                          child: const Text('Delete'),
                                        ),
                                      ],
                                    ),
                                  );
                                  if (confirm == true) {
                                    await TimeSlotService()
                                        .deleteAbsentSlot(absent.id);
                                    ref.invalidate(
                                        absentSlotsProvider(params));
                                  }
                                },
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
            Positioned(
              bottom: 16,
              right: 16,
              child: FloatingActionButton(
                backgroundColor: AppColors.primary,
                onPressed: () =>
                    _showAddAbsenceDialog(context, ref),
                child: const Icon(Icons.add, color: AppColors.textWhite),
              ),
            ),
          ],
        );
      },
    );
  }

  void _showAddAbsenceDialog(BuildContext context, WidgetRef ref) {
    DateTime? date;
    DateTime? startDate;
    DateTime? endDate;
    String mode = 'single'; // single, range, modified
    final reasonCtrl = TextEditingController();
    final fmt = DateFormat('MMM dd, yyyy');

    // For modified session mode
    List<TimeSlotConfig> sessionsForDay = [];
    List<_ModifiedSessionEntry> modifiedEntries = [];

    showFullDialog(
      context: context,
      title: 'Add Absence / Modified Session',
      builder: (ctx, setDialogState) {
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Mode selector
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'single', label: Text('Absent')),
                ButtonSegment(value: 'range', label: Text('Range')),
                ButtonSegment(value: 'modified', label: Text('Modify')),
              ],
              selected: {mode},
              onSelectionChanged: (v) {
                setDialogState(() {
                  mode = v.first;
                  // Reset modified entries when switching modes
                  if (mode != 'modified') {
                    modifiedEntries = [];
                    sessionsForDay = [];
                  }
                });
              },
            ),
            const SizedBox(height: 20),

            // ── Single Day Absence ──
            if (mode == 'single') ...[
              OutlinedButton.icon(
                onPressed: () async {
                  final picked = await showDatePicker(
                    context: ctx,
                    initialDate: DateTime.now(),
                    firstDate: DateTime.now(),
                    lastDate: DateTime.now().add(const Duration(days: 365)),
                  );
                  if (picked != null) setDialogState(() => date = picked);
                },
                icon: const Icon(Icons.calendar_today, size: 16),
                label:
                    Text(date != null ? fmt.format(date!) : 'Select Date'),
              ),
            ],

            // ── Date Range Absence ──
            if (mode == 'range') ...[
              OutlinedButton.icon(
                onPressed: () async {
                  final picked = await showDatePicker(
                    context: ctx,
                    initialDate: DateTime.now(),
                    firstDate: DateTime.now(),
                    lastDate: DateTime.now().add(const Duration(days: 365)),
                  );
                  if (picked != null) {
                    setDialogState(() => startDate = picked);
                  }
                },
                icon: const Icon(Icons.calendar_today, size: 16),
                label: Text(startDate != null
                    ? 'From: ${fmt.format(startDate!)}'
                    : 'Start Date'),
              ),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: () async {
                  final picked = await showDatePicker(
                    context: ctx,
                    initialDate: startDate ?? DateTime.now(),
                    firstDate: startDate ?? DateTime.now(),
                    lastDate: DateTime.now().add(const Duration(days: 365)),
                  );
                  if (picked != null) {
                    setDialogState(() => endDate = picked);
                  }
                },
                icon: const Icon(Icons.calendar_today, size: 16),
                label: Text(endDate != null
                    ? 'To: ${fmt.format(endDate!)}'
                    : 'End Date'),
              ),
            ],

            // ── Modified Session ──
            if (mode == 'modified') ...[
              OutlinedButton.icon(
                onPressed: () async {
                  final picked = await showDatePicker(
                    context: ctx,
                    initialDate: DateTime.now(),
                    firstDate: DateTime.now(),
                    lastDate: DateTime.now().add(const Duration(days: 365)),
                  );
                  if (picked != null) {
                    setDialogState(() => date = picked);
                    // Load sessions for that day of week
                    try {
                      final configs = await TimeSlotService()
                          .getConfigs(params.doctorId, params.dispensaryId);
                      final dayOfWeek = picked.weekday % 7; // 0=Sun
                      final filtered = configs
                          .where((c) => c.dayOfWeek == dayOfWeek)
                          .toList();
                      setDialogState(() {
                        sessionsForDay = filtered;
                        modifiedEntries = filtered
                            .map((c) => _ModifiedSessionEntry(
                                  configId: c.id,
                                  originalTime:
                                      '${c.startTime} - ${c.endTime}',
                                  originalMax: c.maxPatients,
                                  startTimeCtrl:
                                      TextEditingController(text: c.startTime),
                                  endTimeCtrl:
                                      TextEditingController(text: c.endTime),
                                  maxPatientsCtrl: TextEditingController(
                                      text: '${c.maxPatients}'),
                                  selected: false,
                                ))
                            .toList();
                      });
                    } catch (_) {}
                  }
                },
                icon: const Icon(Icons.calendar_today, size: 16),
                label:
                    Text(date != null ? fmt.format(date!) : 'Select Date'),
              ),
              const SizedBox(height: 16),

              if (date != null && sessionsForDay.isEmpty)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.warningLight,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text(
                    'No sessions configured for this day of the week.',
                    style:
                        TextStyle(color: AppColors.warning, fontSize: 13),
                  ),
                ),

              if (modifiedEntries.isNotEmpty) ...[
                const Text('Select sessions to modify:',
                    style: TextStyle(
                        fontWeight: FontWeight.w600, fontSize: 14)),
                const SizedBox(height: 8),
                ...modifiedEntries.asMap().entries.map((entry) {
                  final i = entry.key;
                  final mod = entry.value;
                  return Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: mod.selected
                          ? AppColors.warningLight
                          : AppColors.background,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: mod.selected
                            ? AppColors.warning
                            : AppColors.border,
                      ),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Checkbox(
                              value: mod.selected,
                              onChanged: (v) => setDialogState(() =>
                                  modifiedEntries[i] = mod.copyWith(
                                      selected: v ?? false)),
                            ),
                            Expanded(
                              child: Text(
                                '${mod.originalTime} (Max: ${mod.originalMax})',
                                style: const TextStyle(
                                    fontWeight: FontWeight.w500),
                              ),
                            ),
                          ],
                        ),
                        if (mod.selected) ...[
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Expanded(
                                child: TextField(
                                  controller: mod.startTimeCtrl,
                                  decoration: const InputDecoration(
                                    labelText: 'Start',
                                    contentPadding: EdgeInsets.symmetric(
                                        horizontal: 12, vertical: 10),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: TextField(
                                  controller: mod.endTimeCtrl,
                                  decoration: const InputDecoration(
                                    labelText: 'End',
                                    contentPadding: EdgeInsets.symmetric(
                                        horizontal: 12, vertical: 10),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: TextField(
                                  controller: mod.maxPatientsCtrl,
                                  keyboardType: TextInputType.number,
                                  decoration: const InputDecoration(
                                    labelText: 'Max',
                                    contentPadding: EdgeInsets.symmetric(
                                        horizontal: 12, vertical: 10),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  );
                }),
              ],
            ],

            // Reason (shared across all modes)
            const SizedBox(height: 16),
            TextField(
              controller: reasonCtrl,
              maxLines: 2,
              decoration:
                  const InputDecoration(labelText: 'Reason (optional)'),
            ),
          ],
        );
      },
      actions: (ctx) => [
        TextButton(
          onPressed: () => Navigator.pop(ctx),
          child: const Text('Cancel'),
        ),
        const SizedBox(width: 8),
        ElevatedButton(
          onPressed: () async {
            // Determine the date range for conflict check
            String? checkStart;
            String? checkEnd;
            if (mode == 'single' || mode == 'modified') {
              if (date == null) return;
              checkStart = date!.toIso8601String();
              checkEnd = date!.toIso8601String();
            } else if (mode == 'range') {
              if (startDate == null || endDate == null) return;
              checkStart = startDate!.toIso8601String();
              checkEnd = endDate!.toIso8601String();
            } else {
              return;
            }

            // Check conflicts before saving
            try {
              final conflicts = await TimeSlotService().checkConflicts({
                'doctorId': params.doctorId,
                'dispensaryId': params.dispensaryId,
                'startDate': checkStart,
                'endDate': checkEnd,
              });

              final hasOverlap = conflicts['hasOverlap'] == true;
              final bookingCount = conflicts['bookingCount'] ?? 0;
              final bookings = conflicts['bookings'] as List? ?? [];

              // Show conflict dialog if there are affected bookings
              if (hasOverlap || bookingCount > 0) {
                if (!context.mounted) return;
                final proceed = await showDialog<bool>(
                  context: context,
                  builder: (dlgCtx) => AlertDialog(
                    title: Row(
                      children: [
                        const Icon(Icons.warning_amber_rounded,
                            color: AppColors.warning, size: 24),
                        const SizedBox(width: 8),
                        const Text('Conflicts Found'),
                      ],
                    ),
                    content: SingleChildScrollView(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (hasOverlap)
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(10),
                              margin: const EdgeInsets.only(bottom: 10),
                              decoration: BoxDecoration(
                                color: AppColors.errorLight,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Text(
                                'There are overlapping absence records in this date range.',
                                style: TextStyle(
                                    color: AppColors.error, fontSize: 13),
                              ),
                            ),
                          if (bookingCount > 0) ...[
                            Text(
                              '$bookingCount existing booking(s) will be affected:',
                              style: const TextStyle(
                                  fontWeight: FontWeight.w600, fontSize: 14),
                            ),
                            const SizedBox(height: 8),
                            ...bookings.take(5).map((b) => Container(
                                  width: double.infinity,
                                  padding: const EdgeInsets.all(8),
                                  margin: const EdgeInsets.only(bottom: 6),
                                  decoration: BoxDecoration(
                                    color: AppColors.warningLight,
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        '${b['patientName'] ?? 'Patient'} - #${b['appointmentNumber'] ?? ''}',
                                        style: const TextStyle(
                                            fontWeight: FontWeight.w600,
                                            fontSize: 13),
                                      ),
                                      Text(
                                        '${b['estimatedTime'] ?? ''} | ${b['status'] ?? ''}',
                                        style: const TextStyle(
                                            fontSize: 12,
                                            color: AppColors.textSecondary),
                                      ),
                                    ],
                                  ),
                                )),
                            if (bookingCount > 5)
                              Padding(
                                padding: const EdgeInsets.only(top: 4),
                                child: Text(
                                  '...and ${bookingCount - 5} more',
                                  style: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.textSecondary,
                                      fontStyle: FontStyle.italic),
                                ),
                              ),
                          ],
                          const SizedBox(height: 12),
                          const Text(
                            'Do you still want to proceed?',
                            style: TextStyle(fontSize: 13),
                          ),
                        ],
                      ),
                    ),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(dlgCtx, false),
                        child: const Text('Go Back'),
                      ),
                      ElevatedButton(
                        onPressed: () => Navigator.pop(dlgCtx, true),
                        style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.warning),
                        child: const Text('Proceed Anyway'),
                      ),
                    ],
                  ),
                );
                if (proceed != true) return;
              }
            } catch (_) {
              // If conflict check fails, proceed anyway
            }

            // Close the form dialog and save
            if (ctx.mounted) Navigator.pop(ctx);
            try {
              if (mode == 'modified') {
                final selected =
                    modifiedEntries.where((e) => e.selected).toList();
                if (selected.isEmpty || date == null) return;
                for (final mod in selected) {
                  await TimeSlotService().createAbsentSlot({
                    'doctorId': params.doctorId,
                    'dispensaryId': params.dispensaryId,
                    'date': date!.toIso8601String(),
                    'startTime': mod.startTimeCtrl.text,
                    'endTime': mod.endTimeCtrl.text,
                    'reason': reasonCtrl.text.trim(),
                    'isModifiedSession': true,
                    'maxPatients':
                        int.tryParse(mod.maxPatientsCtrl.text) ?? 20,
                    'timeSlotConfigId': mod.configId,
                  });
                }
              } else if (mode == 'single' && date != null) {
                await TimeSlotService().createAbsentSlot({
                  'doctorId': params.doctorId,
                  'dispensaryId': params.dispensaryId,
                  'date': date!.toIso8601String(),
                  'reason': reasonCtrl.text.trim(),
                });
              } else if (mode == 'range' &&
                  startDate != null &&
                  endDate != null) {
                await TimeSlotService().createAbsentSlot({
                  'doctorId': params.doctorId,
                  'dispensaryId': params.dispensaryId,
                  'isDateRange': true,
                  'startDate': startDate!.toIso8601String(),
                  'endDate': endDate!.toIso8601String(),
                  'reason': reasonCtrl.text.trim(),
                });
              }
              ref.invalidate(absentSlotsProvider(params));
            } catch (e) {
              if (context.mounted) {
                ScaffoldMessenger.of(context)
                    .showSnackBar(SnackBar(content: Text('Error: $e')));
              }
            }
          },
          child: const Text('Save'),
        ),
      ],
    );
  }
}

class _ModifiedSessionEntry {
  final String configId;
  final String originalTime;
  final int originalMax;
  final TextEditingController startTimeCtrl;
  final TextEditingController endTimeCtrl;
  final TextEditingController maxPatientsCtrl;
  final bool selected;

  _ModifiedSessionEntry({
    required this.configId,
    required this.originalTime,
    required this.originalMax,
    required this.startTimeCtrl,
    required this.endTimeCtrl,
    required this.maxPatientsCtrl,
    required this.selected,
  });

  _ModifiedSessionEntry copyWith({bool? selected}) {
    return _ModifiedSessionEntry(
      configId: configId,
      originalTime: originalTime,
      originalMax: originalMax,
      startTimeCtrl: startTimeCtrl,
      endTimeCtrl: endTimeCtrl,
      maxPatientsCtrl: maxPatientsCtrl,
      selected: selected ?? this.selected,
    );
  }
}
