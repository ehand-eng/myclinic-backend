import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';
import '../../models/time_slot.dart';
import '../../services/doctor_service.dart';
import '../../widgets/loading_widget.dart';
import '../../widgets/empty_state.dart';

final replacementsProvider = FutureProvider.family<List<ReplacementDoctor>,
    ({String doctorId, String dispensaryId})>((ref, params) async {
  return DoctorService()
      .getReplacements(params.doctorId, params.dispensaryId);
});

class ReplacementScreen extends ConsumerStatefulWidget {
  final String doctorId;
  final String dispensaryId;

  const ReplacementScreen({
    super.key,
    required this.doctorId,
    required this.dispensaryId,
  });

  @override
  ConsumerState<ReplacementScreen> createState() => _ReplacementScreenState();
}

class _ReplacementScreenState extends ConsumerState<ReplacementScreen> {
  final _nameController = TextEditingController();
  final _reasonController = TextEditingController();
  DateTime? _startDate;
  DateTime? _endDate;
  bool _isSaving = false;

  @override
  void dispose() {
    _nameController.dispose();
    _reasonController.dispose();
    super.dispose();
  }

  Future<void> _pickDate(bool isStart) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) {
      setState(() {
        if (isStart) {
          _startDate = picked;
          if (_endDate != null && _endDate!.isBefore(picked)) {
            _endDate = picked;
          }
        } else {
          _endDate = picked;
        }
      });
    }
  }

  Future<void> _addReplacement() async {
    if (_nameController.text.trim().isEmpty ||
        _startDate == null ||
        _endDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill all required fields')),
      );
      return;
    }

    setState(() => _isSaving = true);
    try {
      await DoctorService().createReplacement(
        widget.doctorId,
        widget.dispensaryId,
        {
          'replacementName': _nameController.text.trim(),
          'startDate': _startDate!.toIso8601String(),
          'endDate': _endDate!.toIso8601String(),
          'reason': _reasonController.text.trim(),
        },
      );
      _nameController.clear();
      _reasonController.clear();
      setState(() {
        _startDate = null;
        _endDate = null;
      });
      ref.invalidate(replacementsProvider(
        (doctorId: widget.doctorId, dispensaryId: widget.dispensaryId),
      ));
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final params = (
      doctorId: widget.doctorId,
      dispensaryId: widget.dispensaryId,
    );
    final replacementsAsync = ref.watch(replacementsProvider(params));
    final fmt = DateFormat('MMM dd, yyyy');

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Replacement Doctors')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Add form
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.card,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text('Add Replacement',
                      style: TextStyle(
                          fontSize: 16, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 16),
                  TextField(
                    controller: _nameController,
                    decoration: const InputDecoration(
                      labelText: 'Replacement Doctor Name *',
                      prefixIcon: Icon(Icons.person_outlined),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _pickDate(true),
                          icon: const Icon(Icons.calendar_today, size: 16),
                          label: Text(_startDate != null
                              ? fmt.format(_startDate!)
                              : 'Start Date *'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _pickDate(false),
                          icon: const Icon(Icons.calendar_today, size: 16),
                          label: Text(_endDate != null
                              ? fmt.format(_endDate!)
                              : 'End Date *'),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _reasonController,
                    maxLines: 2,
                    decoration: const InputDecoration(
                      labelText: 'Reason (optional)',
                      prefixIcon: Icon(Icons.note_outlined),
                    ),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _isSaving ? null : _addReplacement,
                    child: _isSaving
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: AppColors.textWhite),
                          )
                        : const Text('Add Replacement'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // List
            const Text('Current Replacements',
                style:
                    TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            replacementsAsync.when(
              loading: () => const SizedBox(
                  height: 100, child: LoadingWidget()),
              error: (e, _) => Text('Error: $e'),
              data: (replacements) {
                if (replacements.isEmpty) {
                  return const EmptyState(
                    icon: Icons.swap_horiz,
                    title: 'No replacements',
                    subtitle: 'Add a replacement doctor above',
                  );
                }
                return Column(
                  children: replacements.map((r) {
                    final now = DateTime.now();
                    final isActive = now.isAfter(r.startDate) &&
                        now.isBefore(r.endDate.add(const Duration(days: 1)));

                    return Container(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: AppColors.card,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: isActive
                              ? AppColors.success
                              : AppColors.border,
                        ),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(r.replacementName,
                                        style: const TextStyle(
                                            fontWeight: FontWeight.w600)),
                                    if (isActive) ...[
                                      const SizedBox(width: 8),
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: AppColors.successLight,
                                          borderRadius:
                                              BorderRadius.circular(8),
                                        ),
                                        child: const Text('Active',
                                            style: TextStyle(
                                                fontSize: 10,
                                                color: AppColors.success,
                                                fontWeight:
                                                    FontWeight.w600)),
                                      ),
                                    ],
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '${fmt.format(r.startDate)} - ${fmt.format(r.endDate)}',
                                  style: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.textSecondary),
                                ),
                                if (r.reason != null &&
                                    r.reason!.isNotEmpty) ...[
                                  const SizedBox(height: 2),
                                  Text(r.reason!,
                                      style: const TextStyle(
                                          fontSize: 12,
                                          color: AppColors.textLight)),
                                ],
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.delete_outline,
                                color: AppColors.error),
                            onPressed: () async {
                              final confirm = await showDialog<bool>(
                                context: context,
                                builder: (ctx) => AlertDialog(
                                  title: const Text('Delete Replacement'),
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
                                          foregroundColor: AppColors.error),
                                      child: const Text('Delete'),
                                    ),
                                  ],
                                ),
                              );
                              if (confirm == true) {
                                await DoctorService()
                                    .deleteReplacement(r.id);
                                ref.invalidate(
                                    replacementsProvider(params));
                              }
                            },
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}
