import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:myclinic_patient_app/config/theme.dart';
import 'package:myclinic_patient_app/providers/auth_provider.dart';
import 'package:myclinic_patient_app/providers/doctor_provider.dart';
import 'package:myclinic_patient_app/providers/dispensary_provider.dart';
import 'package:myclinic_patient_app/l10n/translations.dart';
import 'package:myclinic_patient_app/utils/formatters.dart';
import 'package:myclinic_patient_app/widgets/buttons/primary_button.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final doctors = ref.watch(doctorsProvider);
    final dispensaries = ref.watch(dispensariesProvider);

    return Scaffold(
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(doctorsProvider);
          ref.invalidate(dispensariesProvider);
        },
        child: SingleChildScrollView(
          child: Column(
            children: [
              // Hero Banner
              Container(
                width: double.infinity,
                padding: EdgeInsets.fromLTRB(24, MediaQuery.of(context).padding.top + 16, 24, 32),
                decoration: BoxDecoration(
                  gradient: AppTheme.heroGradient,
                  borderRadius: const BorderRadius.vertical(bottom: Radius.circular(28)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${context.tr(Formatters.greeting() == 'Good Morning' ? 'goodMorning' : Formatters.greeting() == 'Good Afternoon' ? 'goodAfternoon' : 'goodEvening')},',
                              style: TextStyle(fontSize: 14, color: Colors.white.withValues(alpha: 0.8)),
                            ),
                            Text(
                              user?.name ?? context.tr('welcome'),
                              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: Colors.white),
                            ),
                          ],
                        ),
                        Container(
                          width: 44, height: 44,
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: const Icon(Icons.notifications_outlined, color: Colors.white),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    Text(
                      context.tr('bookYourAppointment'),
                      style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w700, color: Colors.white, height: 1.2),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      context.tr('findBestDoctors'),
                      style: TextStyle(fontSize: 14, color: Colors.white.withValues(alpha: 0.8)),
                    ),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () => context.push('/booking'),
                        icon: const Icon(Icons.calendar_month_rounded),
                        label: Text(context.tr('bookNow')),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: AppTheme.primary,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          elevation: 0,
                        ),
                      ),
                    ),
                  ],
                ),
              ).animate().fadeIn(duration: 500.ms),

              const SizedBox(height: 24),

              // How It Works
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  children: [
                    Text(
                      context.tr('howItWorks'),
                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppTheme.text),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Book your appointment in 3 simple steps',
                      style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        _StepCard(
                          number: '1',
                          icon: Icons.person_search_rounded,
                          title: context.tr('chooseDoctor'),
                          color: AppTheme.primary,
                        ),
                        const SizedBox(width: 10),
                        _StepCard(
                          number: '2',
                          icon: Icons.calendar_month_rounded,
                          title: context.tr('selectTime'),
                          color: AppTheme.info,
                        ),
                        const SizedBox(width: 10),
                        _StepCard(
                          number: '3',
                          icon: Icons.check_circle_rounded,
                          title: context.tr('getConfirmed'),
                          color: AppTheme.success,
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    PrimaryButton(
                      text: context.tr('bookAppointment'),
                      icon: Icons.arrow_forward_rounded,
                      useGradient: true,
                      onPressed: () => context.push('/booking'),
                    ),
                  ],
                ),
              ).animate(delay: 200.ms).fadeIn(duration: 400.ms),

              const SizedBox(height: 28),

              // Stats Section
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
                color: AppTheme.primarySurface,
                child: Row(
                  children: [
                    _StatCard(
                      icon: Icons.medical_services_rounded,
                      value: doctors.when(
                        data: (d) => '${d.where((doc) => !doc.disabled).length}',
                        loading: () => '...',
                        error: (_, __) => '-',
                      ),
                      label: context.tr('doctors'),
                      color: AppTheme.primary,
                    ),
                    const SizedBox(width: 10),
                    _StatCard(
                      icon: Icons.local_hospital_rounded,
                      value: dispensaries.when(
                        data: (d) => '${d.length}',
                        loading: () => '...',
                        error: (_, __) => '-',
                      ),
                      label: context.tr('dispensaries'),
                      color: AppTheme.success,
                    ),
                    const SizedBox(width: 10),
                    _StatCard(
                      icon: Icons.access_time_rounded,
                      value: '24/7',
                      label: 'Online',
                      color: AppTheme.info,
                    ),
                    const SizedBox(width: 10),
                    _StatCard(
                      icon: Icons.thumb_up_rounded,
                      value: '100%',
                      label: context.tr('satisfaction'),
                      color: AppTheme.warning,
                    ),
                  ],
                ),
              ).animate(delay: 400.ms).fadeIn(duration: 400.ms),

              const SizedBox(height: 24),

              // Quick Actions
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      context.tr('quickActions'),
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: AppTheme.text),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        _QuickAction(
                          icon: Icons.calendar_today_rounded,
                          label: context.tr('myBookings'),
                          color: AppTheme.info,
                          onTap: () => context.go('/my-bookings'),
                        ),
                        const SizedBox(width: 12),
                        _QuickAction(
                          icon: Icons.info_outline_rounded,
                          label: context.tr('about'),
                          color: AppTheme.success,
                          onTap: () => context.push('/about'),
                        ),
                        const SizedBox(width: 12),
                        _QuickAction(
                          icon: Icons.phone_rounded,
                          label: context.tr('contactUs'),
                          color: AppTheme.warning,
                          onTap: () => context.push('/contact'),
                        ),
                      ],
                    ),
                  ],
                ),
              ).animate(delay: 500.ms).fadeIn(duration: 400.ms),

              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
      // Floating Book Now button
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/booking'),
        backgroundColor: AppTheme.primary,
        foregroundColor: Colors.white,
        elevation: 6,
        child: const Icon(Icons.add_rounded, size: 28),
      ),
    );
  }
}

class _StepCard extends StatelessWidget {
  final String number;
  final IconData icon;
  final String title;
  final Color color;

  const _StepCard({required this.number, required this.icon, required this.title, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
        decoration: BoxDecoration(
          color: AppTheme.surface,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8)],
        ),
        child: Column(
          children: [
            Container(
              width: 44, height: 44,
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(height: 8),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.text),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;
  final Color color;

  const _StatCard({required this.icon, required this.value, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Icon(icon, color: color, size: 26),
          const SizedBox(height: 6),
          Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: color)),
          const SizedBox(height: 2),
          Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary),
            overflow: TextOverflow.ellipsis, maxLines: 1),
        ],
      ),
    );
  }
}

class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _QuickAction({required this.icon, required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
          decoration: BoxDecoration(
            color: AppTheme.surface,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 8)],
          ),
          child: Column(
            children: [
              Container(
                width: 44, height: 44,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 22),
              ),
              const SizedBox(height: 8),
              Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                overflow: TextOverflow.ellipsis, maxLines: 1, textAlign: TextAlign.center),
            ],
          ),
        ),
      ),
    );
  }
}
