import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:myclinic_patient_app/config/theme.dart';
import 'package:myclinic_patient_app/l10n/translations.dart';
import 'package:myclinic_patient_app/providers/doctor_provider.dart';
import 'package:myclinic_patient_app/widgets/common/loading_widget.dart';
import 'package:myclinic_patient_app/widgets/common/error_widget.dart';
import 'package:myclinic_patient_app/widgets/buttons/primary_button.dart';

class DoctorDetailScreen extends ConsumerWidget {
  final String doctorId;
  const DoctorDetailScreen({super.key, required this.doctorId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final doctor = ref.watch(doctorByIdProvider(doctorId));

    return Scaffold(
      body: doctor.when(
        data: (doc) => CustomScrollView(
          slivers: [
            SliverAppBar(
              expandedHeight: 200,
              pinned: true,
              flexibleSpace: FlexibleSpaceBar(
                background: Container(
                  decoration: const BoxDecoration(gradient: AppTheme.heroGradient),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 40),
                      CircleAvatar(
                        radius: 44,
                        backgroundColor: Colors.white,
                        child: Text(
                          doc.initials,
                          style: const TextStyle(
                            fontSize: 28,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.primary,
                          ),
                        ),
                      ).animate().scale(duration: 400.ms, curve: Curves.elasticOut),
                      const SizedBox(height: 12),
                      Text(
                        doc.name,
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ).animate(delay: 200.ms).fadeIn(),
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          doc.specialization,
                          style: const TextStyle(color: Colors.white, fontSize: 13),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ).animate(delay: 300.ms).fadeIn(),
                    ],
                  ),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (doc.qualifications.isNotEmpty) ...[
                      Text(
                        context.tr('qualifications'),
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppTheme.text),
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: doc.qualifications.map((q) => Chip(
                          label: Text(q, style: const TextStyle(fontSize: 13)),
                          backgroundColor: AppTheme.primarySurface,
                          side: BorderSide.none,
                        )).toList(),
                      ),
                      const SizedBox(height: 20),
                    ],
                    Text(
                      context.tr('contactInformation'),
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppTheme.text),
                    ),
                    const SizedBox(height: 8),
                    if (doc.contactNumber != null)
                      ListTile(
                        leading: const Icon(Icons.phone_rounded, color: AppTheme.primary),
                        title: Text(doc.contactNumber!, overflow: TextOverflow.ellipsis),
                        onTap: () => launchUrl(Uri.parse('tel:${doc.contactNumber}')),
                        contentPadding: EdgeInsets.zero,
                      ),
                    if (doc.email != null)
                      ListTile(
                        leading: const Icon(Icons.email_rounded, color: AppTheme.primary),
                        title: Text(doc.email!, overflow: TextOverflow.ellipsis),
                        onTap: () => launchUrl(Uri.parse('mailto:${doc.email}')),
                        contentPadding: EdgeInsets.zero,
                      ),
                    const SizedBox(height: 16),
                    PrimaryButton(
                      text: context.tr('bookAppointment'),
                      icon: Icons.calendar_month_rounded,
                      useGradient: true,
                      onPressed: () => context.push('/booking', extra: doc),
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
          ],
        ),
        loading: () => const LoadingWidget(),
        error: (e, _) => AppErrorWidget(
          message: context.tr('error'),
          onRetry: () => ref.invalidate(doctorByIdProvider(doctorId)),
        ),
      ),
    );
  }
}
