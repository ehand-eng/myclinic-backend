import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../models/dispensary.dart';
import '../../models/doctor.dart';
import '../../services/dispensary_service.dart';
import '../../services/doctor_service.dart';
import '../../widgets/loading_widget.dart';

final dispensaryDetailProvider =
    FutureProvider.family<_DispensaryDetail, String>((ref, id) async {
  final dispensary = await DispensaryService().getDispensaryById(id);
  final doctors = await DoctorService().getDoctorsByDispensary(id);
  return _DispensaryDetail(dispensary: dispensary, doctors: doctors);
});

class _DispensaryDetail {
  final Dispensary dispensary;
  final List<Doctor> doctors;
  _DispensaryDetail({required this.dispensary, required this.doctors});
}

class DispensaryDetailScreen extends ConsumerWidget {
  final String dispensaryId;
  const DispensaryDetailScreen({super.key, required this.dispensaryId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detailAsync = ref.watch(dispensaryDetailProvider(dispensaryId));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Dispensary Details')),
      body: detailAsync.when(
        loading: () => const LoadingWidget(),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (detail) => SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Info card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
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
                        Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: AppColors.primarySurface,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.local_hospital,
                              color: AppColors.primary, size: 28),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Text(
                            detail.dispensary.name,
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: AppColors.text,
                            ),
                          ),
                        ),
                      ],
                    ),
                    if (detail.dispensary.description != null) ...[
                      const SizedBox(height: 16),
                      Text(
                        detail.dispensary.description!,
                        style: const TextStyle(
                          color: AppColors.textSecondary,
                          height: 1.5,
                        ),
                      ),
                    ],
                    const SizedBox(height: 16),
                    const Divider(),
                    const SizedBox(height: 12),
                    if (detail.dispensary.address != null)
                      _InfoRow(
                          Icons.location_on_outlined, detail.dispensary.address!),
                    if (detail.dispensary.contactNumber != null)
                      _InfoRow(Icons.phone_outlined,
                          detail.dispensary.contactNumber!),
                    if (detail.dispensary.email != null)
                      _InfoRow(
                          Icons.email_outlined, detail.dispensary.email!),
                    _InfoRow(Icons.calendar_today,
                        'Visible: ${detail.dispensary.bookingVisibleDays} days'),
                    _InfoRow(Icons.timer_outlined,
                        'Cutoff: ${detail.dispensary.bookingCutoffMinutes} min'),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Doctors
              Text(
                'Doctors (${detail.doctors.length})',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: AppColors.text,
                ),
              ),
              const SizedBox(height: 12),
              ...detail.doctors.map((doctor) => Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.card,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      children: [
                        CircleAvatar(
                          backgroundColor: AppColors.primarySurface,
                          child: Text(
                            doctor.name.isNotEmpty
                                ? doctor.name[0].toUpperCase()
                                : 'D',
                            style: const TextStyle(
                              color: AppColors.primary,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                doctor.name,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.text,
                                ),
                              ),
                              if (doctor.specialization != null)
                                Text(
                                  doctor.specialization!,
                                  style: const TextStyle(
                                    fontSize: 13,
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                            ],
                          ),
                        ),
                        TextButton(
                          onPressed: () => context.push(
                            '/timeslots/manage/${doctor.id}/$dispensaryId',
                          ),
                          child: const Text('Time Slots'),
                        ),
                      ],
                    ),
                  )),
            ],
          ),
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;
  const _InfoRow(this.icon, this.text);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.textSecondary),
          const SizedBox(width: 10),
          Expanded(
            child: Text(text,
                style: const TextStyle(
                    color: AppColors.text, fontSize: 14)),
          ),
        ],
      ),
    );
  }
}
