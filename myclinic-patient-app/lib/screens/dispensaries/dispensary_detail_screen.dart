import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:myclinic_patient_app/config/theme.dart';
import 'package:myclinic_patient_app/l10n/translations.dart';
import 'package:myclinic_patient_app/providers/dispensary_provider.dart';
import 'package:myclinic_patient_app/widgets/buttons/primary_button.dart';
import 'package:myclinic_patient_app/widgets/common/loading_widget.dart';
import 'package:myclinic_patient_app/widgets/common/error_widget.dart';

class DispensaryDetailScreen extends ConsumerWidget {
  final String dispensaryId;
  const DispensaryDetailScreen({super.key, required this.dispensaryId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dispensary = ref.watch(dispensaryByIdProvider(dispensaryId));

    return Scaffold(
      appBar: AppBar(title: Text(context.tr('dispensaryDetails'))),
      body: dispensary.when(
        data: (d) => SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 52, height: 52,
                            decoration: BoxDecoration(
                              color: AppTheme.primarySurface,
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: const Icon(Icons.local_hospital_rounded, color: AppTheme.primary, size: 28),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Text(d.name,
                              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: AppTheme.text),
                              overflow: TextOverflow.ellipsis, maxLines: 2),
                          ),
                        ],
                      ),
                      if (d.description != null && d.description!.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        Text(d.description!, style: const TextStyle(color: AppTheme.textSecondary, height: 1.5)),
                      ],
                    ],
                  ),
                ),
              ).animate().fadeIn(duration: 400.ms),
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(context.tr('contactInformation'),
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppTheme.text)),
                      const SizedBox(height: 12),
                      _InfoRow(Icons.location_on_rounded, d.address),
                      if (d.contactNumber != null)
                        _InfoRow(Icons.phone_rounded, d.contactNumber!, onTap: () => launchUrl(Uri.parse('tel:${d.contactNumber}'))),
                      if (d.email != null)
                        _InfoRow(Icons.email_rounded, d.email!, onTap: () => launchUrl(Uri.parse('mailto:${d.email}'))),
                      if (d.location != null)
                        _InfoRow(Icons.map_rounded, context.tr('viewOnMap'), onTap: () {
                          final url = 'https://www.google.com/maps/search/?api=1&query=${d.location!.latitude},${d.location!.longitude}';
                          launchUrl(Uri.parse(url));
                        }),
                    ],
                  ),
                ),
              ).animate(delay: 200.ms).fadeIn(duration: 400.ms),
              const SizedBox(height: 16),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('${context.tr('doctors')} (${d.doctorCount})',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppTheme.text)),
                      const SizedBox(height: 8),
                      Text(context.tr('doctorsAtDispensary'),
                        style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
                    ],
                  ),
                ),
              ).animate(delay: 300.ms).fadeIn(duration: 400.ms),
              const SizedBox(height: 24),
              PrimaryButton(
                text: context.tr('bookAtDispensary'),
                icon: Icons.calendar_month_rounded,
                useGradient: true,
                onPressed: () => context.push('/booking'),
              ),
            ],
          ),
        ),
        loading: () => const LoadingWidget(),
        error: (e, _) => AppErrorWidget(
          message: context.tr('error'),
          onRetry: () => ref.invalidate(dispensaryByIdProvider(dispensaryId)),
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String text;
  final VoidCallback? onTap;

  const _InfoRow(this.icon, this.text, {this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            Icon(icon, size: 20, color: AppTheme.primary),
            const SizedBox(width: 12),
            Expanded(
              child: Text(text,
                style: TextStyle(
                  fontSize: 14,
                  color: onTap != null ? AppTheme.primary : AppTheme.textSecondary,
                ),
                overflow: TextOverflow.ellipsis, maxLines: 2),
            ),
            if (onTap != null) const Icon(Icons.chevron_right_rounded, size: 20, color: AppTheme.textLight),
          ],
        ),
      ),
    );
  }
}
