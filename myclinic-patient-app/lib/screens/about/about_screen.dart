import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:myclinic_patient_app/config/constants.dart';
import 'package:myclinic_patient_app/config/theme.dart';
import 'package:myclinic_patient_app/l10n/translations.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(context.tr('aboutMyClinic')),
        leading: IconButton(icon: const Icon(Icons.arrow_back_rounded), onPressed: () => context.pop()),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const SizedBox(height: 16),
            Container(
              width: 80, height: 80,
              decoration: BoxDecoration(
                color: AppTheme.primarySurface,
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Icon(Icons.local_hospital_rounded, size: 44, color: AppTheme.primary),
            ).animate().scale(duration: 400.ms, curve: Curves.elasticOut),
            const SizedBox(height: 16),
            Text(context.tr('appName'), style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: AppTheme.text))
                .animate(delay: 200.ms).fadeIn(),
            const SizedBox(height: 4),
            Text(context.tr('tagline'), style: const TextStyle(color: AppTheme.textSecondary))
                .animate(delay: 300.ms).fadeIn(),
            const SizedBox(height: 32),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  children: [
                    const Icon(Icons.track_changes_rounded, size: 32, color: AppTheme.primary),
                    const SizedBox(height: 12),
                    Text(context.tr('ourMission'), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 8),
                    Text(
                      context.tr('missionDesc'),
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: AppTheme.textSecondary, height: 1.5),
                    ),
                  ],
                ),
              ),
            ).animate(delay: 400.ms).fadeIn(duration: 400.ms),
            const SizedBox(height: 16),
            Text(context.tr('ourValues'), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            _ValueCard(Icons.favorite_rounded, context.tr('patientFirst'), context.tr('patientFirstDesc'), AppTheme.error, 0),
            _ValueCard(Icons.security_rounded, context.tr('secureReliable'), context.tr('secureReliableDesc'), AppTheme.success, 1),
            _ValueCard(Icons.lightbulb_rounded, context.tr('innovation'), context.tr('innovationDesc'), AppTheme.warning, 2),
            const SizedBox(height: 24),
            Text('${context.tr('version')} ${AppConstants.appVersion}', style: const TextStyle(color: AppTheme.textLight, fontSize: 13)),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}

class _ValueCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String desc;
  final Color color;
  final int index;

  const _ValueCard(this.icon, this.title, this.desc, this.color, this.index);

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 48, height: 48,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15), overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 4),
                  Text(desc, style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
                ],
              ),
            ),
          ],
        ),
      ),
    ).animate().fadeIn(delay: Duration(milliseconds: 500 + 100 * index), duration: 400.ms);
  }
}
