import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/dashboard_service.dart';
import '../../widgets/stat_card.dart';
import '../../widgets/loading_widget.dart';
import '../../models/booking.dart';
import '../../widgets/status_badge.dart';

final dashboardStatsProvider =
    FutureProvider.family<DashboardStats, String?>((ref, range) async {
  return DashboardService().getStats(range: range);
});

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  String _range = 'last_week';

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final statsAsync = ref.watch(dashboardStatsProvider(_range));

    return Scaffold(
      backgroundColor: AppColors.background,
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(dashboardStatsProvider(_range));
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: AppColors.primaryGradient,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Welcome, ${auth.user?.name ?? 'Admin'}',
                      style: const TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textWhite,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      auth.selectedDispensary?.name ?? 'Select a dispensary',
                      style: TextStyle(
                        fontSize: 14,
                        color: AppColors.textWhite.withAlpha(200),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Range selector
              Row(
                children: [
                  _RangeChip('Last 7 Days', 'last_week',
                      _range == 'last_week', () => setState(() => _range = 'last_week')),
                  const SizedBox(width: 8),
                  _RangeChip('Last 30 Days', 'last_month',
                      _range == 'last_month', () => setState(() => _range = 'last_month')),
                  const SizedBox(width: 8),
                  _RangeChip('All Time', 'all_time',
                      _range == 'all_time', () => setState(() => _range = 'all_time')),
                ],
              ),
              const SizedBox(height: 16),

              // Stats
              statsAsync.when(
                loading: () => const SizedBox(
                    height: 200, child: LoadingWidget()),
                error: (e, _) => Center(
                  child: Text('Failed to load: $e',
                      style: const TextStyle(color: AppColors.error)),
                ),
                data: (stats) => Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Stat cards
                    GridView.count(
                      crossAxisCount: 2,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      mainAxisSpacing: 12,
                      crossAxisSpacing: 12,
                      childAspectRatio: 1.4,
                      children: [
                        StatCard(
                          title: "Today's Bookings",
                          value: '${stats.todayBookings}',
                          icon: Icons.calendar_today,
                          color: AppColors.primary,
                        ),
                        StatCard(
                          title: 'Scheduled Today',
                          value: '${stats.scheduledToday}',
                          icon: Icons.schedule,
                          color: AppColors.info,
                        ),
                        StatCard(
                          title: 'Active Doctors',
                          value: '${stats.totalDoctors}',
                          icon: Icons.medical_services,
                          color: AppColors.success,
                        ),
                        StatCard(
                          title: 'Completed (Month)',
                          value: '${stats.completedThisMonth}',
                          icon: Icons.check_circle_outline,
                          color: AppColors.success,
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Status breakdown
                    if (stats.bookingsByStatus.isNotEmpty) ...[
                      const Text(
                        'Booking Status',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          color: AppColors.text,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.card,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Column(
                          children: stats.bookingsByStatus.entries.map((entry) {
                            final total = stats.bookingsByStatus.values
                                .fold(0, (a, b) => a + b);
                            final pct = total > 0
                                ? (entry.value / total * 100)
                                : 0.0;
                            return Padding(
                              padding:
                                  const EdgeInsets.symmetric(vertical: 6),
                              child: Row(
                                children: [
                                  StatusBadge(status: entry.key),
                                  const Spacer(),
                                  Text(
                                    '${entry.value}',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w600,
                                      color: AppColors.text,
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  SizedBox(
                                    width: 50,
                                    child: Text(
                                      '${pct.toStringAsFixed(0)}%',
                                      style: const TextStyle(
                                        color: AppColors.textSecondary,
                                        fontSize: 13,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],

                    // Recent bookings
                    if (stats.recentBookings.isNotEmpty) ...[
                      const Text(
                        'Recent Bookings',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          color: AppColors.text,
                        ),
                      ),
                      const SizedBox(height: 12),
                      ...stats.recentBookings
                          .take(10)
                          .map((b) {
                        final booking = Booking.fromJson(b);
                        return Container(
                          margin: const EdgeInsets.only(bottom: 8),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppColors.card,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      booking.patientName ?? 'Patient',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.text,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      'Dr. ${booking.doctorName ?? 'N/A'} | #${booking.appointmentNumber ?? '-'}',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: AppColors.textSecondary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              StatusBadge(status: booking.status),
                            ],
                          ),
                        );
                      }),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RangeChip extends StatelessWidget {
  final String label;
  final String value;
  final bool selected;
  final VoidCallback onTap;

  const _RangeChip(this.label, this.value, this.selected, this.onTap);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary : AppColors.card,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: selected ? AppColors.primary : AppColors.border,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: selected ? AppColors.textWhite : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }
}
