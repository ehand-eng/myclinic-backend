import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/dashboard_service.dart';
import '../../widgets/stat_card.dart';
import '../../widgets/loading_widget.dart';
import '../../models/booking.dart';
import '../../widgets/status_badge.dart';
import 'package:fl_chart/fl_chart.dart';

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
  String _range = 'today';

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
                  _RangeChip('Today', 'today',
                      _range == 'today', () => setState(() => _range = 'today')),
                  const SizedBox(width: 8),
                  _RangeChip('7 Days', 'last_week',
                      _range == 'last_week', () => setState(() => _range = 'last_week')),
                  const SizedBox(width: 8),
                  _RangeChip('1 Month', 'last_month',
                      _range == 'last_month', () => setState(() => _range = 'last_month')),
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
                    Column(
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: StatCard(
                                title: _range == 'today' ? "Scheduled Today" : "Scheduled",
                                value: '${stats.periodScheduled}',
                                icon: Icons.schedule,
                                color: AppColors.primary,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: StatCard(
                                title: _range == 'today' ? 'Completed Today' : 'Completed',
                                value: '${stats.periodCompleted}',
                                icon: Icons.check_circle_outline,
                                color: AppColors.success,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: StatCard(
                                title: 'Active Doctors',
                                value: '${stats.totalDoctors}',
                                icon: Icons.medical_services,
                                color: AppColors.info,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: StatCard(
                                title: 'Active Dispensaries',
                                value: '${stats.totalDispensaries}',
                                icon: Icons.local_hospital_outlined,
                                color: AppColors.info,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Daily charts
                    if (stats.dailyStats.isNotEmpty) ...[
                      const Text(
                        'Daily Trends',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                          color: AppColors.text,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        height: 220,
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.card,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: BarChart(
                          BarChartData(
                            alignment: BarChartAlignment.spaceAround,
                            barTouchData: BarTouchData(enabled: true),
                            titlesData: FlTitlesData(
                              show: true,
                              bottomTitles: AxisTitles(
                                sideTitles: SideTitles(
                                  showTitles: true,
                                  getTitlesWidget: (val, meta) {
                                    if (val.toInt() < 0 || val.toInt() >= stats.dailyStats.length) {
                                      return const SizedBox();
                                    }
                                    final dateStr = stats.dailyStats[val.toInt()]['date'] as String;
                                    // Parse date string (YYYY-MM-DD) -> short representation
                                    final parts = dateStr.split('-');
                                    if (parts.length == 3) {
                                      // Return only MM/DD or just DD depending on range, for mobile width we'll use DD
                                      return Text('${parts[2]}', style: const TextStyle(fontSize: 10, color: AppColors.textSecondary));
                                    }
                                    return const SizedBox();
                                  },
                                  reservedSize: 22,
                                ),
                              ),
                              leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                              topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                              rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                            ),
                            gridData: const FlGridData(show: false),
                            borderData: FlBorderData(show: false),
                            barGroups: stats.dailyStats.asMap().entries.map((e) {
                              final scheduled = (e.value['scheduled'] as num).toDouble();
                              final completed = (e.value['completed'] as num).toDouble();
                              return BarChartGroupData(
                                x: e.key,
                                barRods: [
                                  BarChartRodData(
                                    toY: scheduled,
                                    color: AppColors.primary,
                                    width: 8,
                                    borderRadius: BorderRadius.circular(2),
                                  ),
                                  BarChartRodData(
                                    toY: completed,
                                    color: AppColors.success,
                                    width: 8,
                                    borderRadius: BorderRadius.circular(2),
                                  ),
                                ],
                              );
                            }).toList(),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(width: 12, height: 12, color: AppColors.primary),
                          const SizedBox(width: 4),
                          const Text('Scheduled', style: TextStyle(fontSize: 12)),
                          const SizedBox(width: 16),
                          Container(width: 12, height: 12, color: AppColors.success),
                          const SizedBox(width: 4),
                          const Text('Completed', style: TextStyle(fontSize: 12)),
                        ],
                      ),
                      const SizedBox(height: 24),
                    ],

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
