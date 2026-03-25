import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../models/doctor.dart';
import '../../models/dispensary.dart';
import '../../providers/auth_provider.dart';
import '../../services/doctor_service.dart';
import '../../services/dispensary_service.dart';
import '../../widgets/loading_widget.dart';

class TimeSlotSelectorScreen extends ConsumerStatefulWidget {
  const TimeSlotSelectorScreen({super.key});

  @override
  ConsumerState<TimeSlotSelectorScreen> createState() =>
      _TimeSlotSelectorScreenState();
}

class _TimeSlotSelectorScreenState
    extends ConsumerState<TimeSlotSelectorScreen> {
  List<Doctor> _doctors = [];
  List<Dispensary> _dispensaries = [];
  Doctor? _selectedDoctor;
  Dispensary? _selectedDispensary;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadDoctors();
  }

  Future<void> _loadDoctors() async {
    final auth = ref.read(authProvider);
    final dispensaryId = auth.selectedDispensary?.id;
    if (dispensaryId == null) return;

    try {
      final doctors = await DoctorService().getDoctorsByDispensary(dispensaryId);
      setState(() {
        _doctors = doctors;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _loadDispensaries(String doctorId) async {
    try {
      final dispensaries =
          await DispensaryService().getDispensariesByDoctor(doctorId);
      // Filter to only user's assigned dispensaries
      final auth = ref.read(authProvider);
      final userDispIds = auth.dispensaries.map((d) => d.id).toSet();
      setState(() {
        _dispensaries =
            dispensaries.where((d) => userDispIds.contains(d.id)).toList();
        if (_dispensaries.length == 1) {
          _selectedDispensary = _dispensaries.first;
        }
      });
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: _isLoading
          ? const LoadingWidget()
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Info cards
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.primarySurface,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.info_outline, color: AppColors.primary),
                        SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Select a doctor and dispensary to manage their time slots and absences.',
                            style: TextStyle(
                                color: AppColors.primary, fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Doctor dropdown
                  const Text('Select Doctor',
                      style: TextStyle(
                          fontSize: 16, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<Doctor>(
                    value: _selectedDoctor,
                    decoration: const InputDecoration(
                      prefixIcon: Icon(Icons.medical_services_outlined),
                      hintText: 'Choose a doctor',
                    ),
                    items: _doctors
                        .map((d) => DropdownMenuItem(
                              value: d,
                              child: Text(d.name),
                            ))
                        .toList(),
                    onChanged: (doctor) {
                      setState(() {
                        _selectedDoctor = doctor;
                        _selectedDispensary = null;
                        _dispensaries = [];
                      });
                      if (doctor != null) {
                        _loadDispensaries(doctor.id);
                      }
                    },
                  ),
                  const SizedBox(height: 24),

                  // Dispensary dropdown
                  if (_selectedDoctor != null) ...[
                    const Text('Select Dispensary',
                        style: TextStyle(
                            fontSize: 16, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    if (_dispensaries.length == 1)
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: AppColors.card,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.local_hospital,
                                color: AppColors.primary),
                            const SizedBox(width: 12),
                            Text(_dispensaries.first.name,
                                style: const TextStyle(
                                    fontWeight: FontWeight.w600)),
                          ],
                        ),
                      )
                    else
                      DropdownButtonFormField<Dispensary>(
                        value: _selectedDispensary,
                        decoration: const InputDecoration(
                          prefixIcon: Icon(Icons.local_hospital_outlined),
                          hintText: 'Choose a dispensary',
                        ),
                        items: _dispensaries
                            .map((d) => DropdownMenuItem(
                                  value: d,
                                  child: Text(d.name),
                                ))
                            .toList(),
                        onChanged: (disp) =>
                            setState(() => _selectedDispensary = disp),
                      ),
                    const SizedBox(height: 32),

                    SizedBox(
                      height: 50,
                      child: ElevatedButton.icon(
                        onPressed: _selectedDoctor != null &&
                                _selectedDispensary != null
                            ? () => context.push(
                                  '/timeslots/manage/${_selectedDoctor!.id}/${_selectedDispensary!.id}',
                                )
                            : null,
                        icon: const Icon(Icons.schedule),
                        label: const Text('Manage Time Slots',
                            style: TextStyle(
                                fontSize: 16, fontWeight: FontWeight.w600)),
                      ),
                    ),
                  ],
                ],
              ),
            ),
    );
  }
}
