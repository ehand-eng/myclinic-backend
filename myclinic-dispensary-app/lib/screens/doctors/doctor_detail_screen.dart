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
import 'doctors_list_screen.dart';

final doctorDetailProvider =
    FutureProvider.family<_DoctorDetail, String>((ref, doctorId) async {
  final doctor = await DoctorService().getDoctorById(doctorId);
  List<Dispensary> dispensaries = [];
  if (doctor.dispensaryIds.isNotEmpty) {
    dispensaries =
        await DispensaryService().getDispensariesByIds(doctor.dispensaryIds);
  }
  return _DoctorDetail(doctor: doctor, dispensaries: dispensaries);
});

class _DoctorDetail {
  final Doctor doctor;
  final List<Dispensary> dispensaries;
  _DoctorDetail({required this.doctor, required this.dispensaries});
}

class DoctorDetailScreen extends ConsumerWidget {
  final String doctorId;
  const DoctorDetailScreen({super.key, required this.doctorId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final detailAsync = ref.watch(doctorDetailProvider(doctorId));
    final auth = ref.watch(authProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Doctor Details'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () => context.push('/doctors/edit/$doctorId'),
          ),
        ],
      ),
      body: detailAsync.when(
        loading: () => const LoadingWidget(),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (detail) => SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Profile card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.card,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(
                  children: [
                    CircleAvatar(
                      radius: 40,
                      backgroundColor: AppColors.primarySurface,
                      backgroundImage: detail.doctor.profilePicture != null
                          ? NetworkImage(detail.doctor.profilePicture!)
                          : null,
                      child: detail.doctor.profilePicture == null
                          ? Text(
                              detail.doctor.name.isNotEmpty
                                  ? detail.doctor.name[0].toUpperCase()
                                  : 'D',
                              style: const TextStyle(
                                fontSize: 32,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primary,
                              ),
                            )
                          : null,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      detail.doctor.name,
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: AppColors.text,
                      ),
                    ),
                    if (detail.doctor.specialization != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        detail.doctor.specialization!,
                        style: const TextStyle(
                          fontSize: 15,
                          color: AppColors.primary,
                        ),
                      ),
                    ],
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(
                        color: detail.doctor.disabled
                            ? AppColors.warningLight
                            : AppColors.successLight,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        detail.doctor.disabled ? 'Disabled' : 'Active',
                        style: TextStyle(
                          color: detail.doctor.disabled
                              ? AppColors.warning
                              : AppColors.success,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Divider(),
                    const SizedBox(height: 12),
                    if (detail.doctor.contactNumber != null)
                      _InfoTile(Icons.phone_outlined,
                          detail.doctor.contactNumber!),
                    if (detail.doctor.email != null)
                      _InfoTile(Icons.email_outlined, detail.doctor.email!),
                    if (detail.doctor.qualifications.isNotEmpty)
                      _InfoTile(Icons.school_outlined,
                          detail.doctor.qualifications.join(', ')),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Actions
              Row(
                children: [
                  Expanded(
                    child: _ActionButton(
                      icon: detail.doctor.disabled
                          ? Icons.check_circle_outline
                          : Icons.block,
                      label: detail.doctor.disabled ? 'Enable' : 'Disable',
                      color: detail.doctor.disabled
                          ? AppColors.success
                          : AppColors.warning,
                      onTap: () async {
                        try {
                          if (detail.doctor.disabled) {
                            await DoctorService().enableDoctor(doctorId);
                          } else {
                            await DoctorService().disableDoctor(doctorId);
                          }
                          ref.invalidate(doctorDetailProvider(doctorId));
                        } catch (e) {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Error: $e')),
                            );
                          }
                        }
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _ActionButton(
                      icon: Icons.delete_outline,
                      label: 'Delete',
                      color: AppColors.error,
                      onTap: () => _confirmDelete(context, ref),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Dispensaries
              const Text(
                'Associated Dispensaries',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: AppColors.text,
                ),
              ),
              const SizedBox(height: 12),
              ...detail.dispensaries.map((disp) => Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppColors.card,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.local_hospital,
                            color: AppColors.primary, size: 20),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(disp.name,
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w600)),
                              if (disp.address != null)
                                Text(disp.address!,
                                    style: const TextStyle(
                                        fontSize: 12,
                                        color: AppColors.textSecondary)),
                            ],
                          ),
                        ),
                        TextButton.icon(
                          onPressed: () => context.push(
                            '/timeslots/manage/$doctorId/${disp.id}',
                          ),
                          icon: const Icon(Icons.schedule, size: 16),
                          label: const Text('Slots',
                              style: TextStyle(fontSize: 12)),
                        ),
                        TextButton.icon(
                          onPressed: () => context.push(
                            '/doctors/$doctorId/replacements/${disp.id}',
                          ),
                          icon: const Icon(Icons.swap_horiz, size: 16),
                          label: const Text('Replace',
                              style: TextStyle(fontSize: 12)),
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

  void _confirmDelete(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Doctor'),
        content: const Text(
            'Are you sure you want to delete this doctor? This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await DoctorService().deleteDoctor(doctorId);
                if (context.mounted) {
                  final dispensaryId =
                      ref.read(authProvider).selectedDispensary?.id ?? '';
                  if (dispensaryId.isNotEmpty) {
                    ref.invalidate(doctorsListProvider(dispensaryId));
                  }
                  context.pop();
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Error: $e')),
                  );
                }
              }
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final String text;
  const _InfoTile(this.icon, this.text);

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
                style:
                    const TextStyle(color: AppColors.text, fontSize: 14)),
          ),
        ],
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _ActionButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: color.withAlpha(20),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withAlpha(50)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 20),
            const SizedBox(width: 8),
            Text(label,
                style: TextStyle(
                    color: color, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }
}
