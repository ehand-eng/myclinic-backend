import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../config/theme.dart';
import '../../models/doctor.dart';
import '../../providers/auth_provider.dart';
import '../../services/doctor_service.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/loading_widget.dart';

final doctorsListProvider =
    FutureProvider.family<List<Doctor>, String>((ref, dispensaryId) async {
  return DoctorService().getDoctorsByDispensary(dispensaryId);
});

class DoctorsListScreen extends ConsumerStatefulWidget {
  const DoctorsListScreen({super.key});

  @override
  ConsumerState<DoctorsListScreen> createState() => _DoctorsListScreenState();
}

class _DoctorsListScreenState extends ConsumerState<DoctorsListScreen> {
  String _search = '';

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final dispensaryId = auth.selectedDispensary?.id ?? '';

    if (dispensaryId.isEmpty) {
      return const Center(child: Text('No dispensary selected'));
    }

    final doctorsAsync = ref.watch(doctorsListProvider(dispensaryId));

    return Scaffold(
      backgroundColor: AppColors.background,
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppColors.primary,
        onPressed: () => context.push('/doctors/create'),
        child: const Icon(Icons.add, color: AppColors.textWhite),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              onChanged: (v) => setState(() => _search = v),
              decoration: InputDecoration(
                hintText: 'Search doctors...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _search.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () => setState(() => _search = ''),
                      )
                    : null,
              ),
            ),
          ),
          Expanded(
            child: doctorsAsync.when(
              loading: () => const LoadingWidget(),
              error: (e, _) => Center(child: Text('Error: $e')),
              data: (doctors) {
                final filtered = doctors.where((d) {
                  if (_search.isEmpty) return true;
                  final q = _search.toLowerCase();
                  return d.name.toLowerCase().contains(q) ||
                      (d.specialization?.toLowerCase().contains(q) ??
                          false) ||
                      (d.email?.toLowerCase().contains(q) ?? false);
                }).toList();

                if (filtered.isEmpty) {
                  return const EmptyState(
                    icon: Icons.medical_services,
                    title: 'No doctors found',
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async {
                    ref.invalidate(doctorsListProvider(dispensaryId));
                  },
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final doctor = filtered[index];
                      return _DoctorCard(
                        doctor: doctor,
                        onTap: () =>
                            context.push('/doctors/edit/${doctor.id}'),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _DoctorCard extends StatelessWidget {
  final Doctor doctor;
  final VoidCallback onTap;

  const _DoctorCard({required this.doctor, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.card,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            CircleAvatar(
              radius: 24,
              backgroundColor: doctor.disabled
                  ? AppColors.border
                  : AppColors.primarySurface,
              backgroundImage: doctor.profilePicture != null
                  ? NetworkImage(doctor.profilePicture!)
                  : null,
              child: doctor.profilePicture == null
                  ? Text(
                      doctor.name.isNotEmpty
                          ? doctor.name[0].toUpperCase()
                          : 'D',
                      style: TextStyle(
                        color: doctor.disabled
                            ? AppColors.textLight
                            : AppColors.primary,
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    )
                  : null,
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          doctor.name,
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: doctor.disabled
                                ? AppColors.textLight
                                : AppColors.text,
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: doctor.disabled
                              ? AppColors.warningLight
                              : AppColors.successLight,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          doctor.disabled ? 'Disabled' : 'Active',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: doctor.disabled
                                ? AppColors.warning
                                : AppColors.success,
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (doctor.specialization != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      doctor.specialization!,
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                  if (doctor.email != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      doctor.email!,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textLight,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: AppColors.textLight),
          ],
        ),
      ),
    );
  }
}
