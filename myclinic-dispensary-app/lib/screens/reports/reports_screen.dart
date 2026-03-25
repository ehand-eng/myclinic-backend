import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';
import '../../models/doctor.dart';
import '../../models/booking.dart';
import '../../providers/auth_provider.dart';
import '../../services/report_service.dart';
import '../../services/doctor_service.dart';
import '../../widgets/stat_card.dart';
import '../../widgets/loading_widget.dart';
import '../../widgets/status_badge.dart';
import '../../widgets/empty_state.dart';

class ReportsScreen extends ConsumerStatefulWidget {
  const ReportsScreen({super.key});

  @override
  ConsumerState<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends ConsumerState<ReportsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          Container(
            color: AppColors.card,
            child: TabBar(
              controller: _tabController,
              labelColor: AppColors.primary,
              unselectedLabelColor: AppColors.textSecondary,
              indicatorColor: AppColors.primary,
              tabs: const [
                Tab(text: 'Daily'),
                Tab(text: 'Monthly'),
                Tab(text: 'Doctor'),
              ],
            ),
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: const [
                _DailyReportTab(),
                _MonthlyReportTab(),
                _DoctorPerformanceTab(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _DailyReportTab extends ConsumerStatefulWidget {
  const _DailyReportTab();

  @override
  ConsumerState<_DailyReportTab> createState() => _DailyReportTabState();
}

class _DailyReportTabState extends ConsumerState<_DailyReportTab> {
  DateTime _date = DateTime.now();
  Map<String, dynamic>? _report;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadReport();
  }

  Future<void> _loadReport() async {
    setState(() => _isLoading = true);
    try {
      final auth = ref.read(authProvider);
      final report = await ReportService().getDailyBookings(
        date: DateFormat('yyyy-MM-dd').format(_date),
        dispensaryId: auth.selectedDispensary?.id,
      );
      if (mounted) setState(() => _report = report);
    } catch (e) {
      debugPrint('Report error: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final fmt = DateFormat('MMM dd, yyyy');

    return Column(
      children: [
        // Date selector
        Container(
          padding: const EdgeInsets.all(12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              IconButton(
                icon: const Icon(Icons.chevron_left),
                onPressed: () {
                  setState(() =>
                      _date = _date.subtract(const Duration(days: 1)));
                  _loadReport();
                },
              ),
              GestureDetector(
                onTap: () async {
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: _date,
                    firstDate:
                        DateTime.now().subtract(const Duration(days: 365)),
                    lastDate: DateTime.now().add(const Duration(days: 365)),
                  );
                  if (picked != null) {
                    setState(() => _date = picked);
                    _loadReport();
                  }
                },
                child: Text(
                  fmt.format(_date),
                  style: const TextStyle(
                      fontSize: 16, fontWeight: FontWeight.w600),
                ),
              ),
              IconButton(
                icon: const Icon(Icons.chevron_right),
                onPressed: () {
                  setState(
                      () => _date = _date.add(const Duration(days: 1)));
                  _loadReport();
                },
              ),
            ],
          ),
        ),

        Expanded(
          child: _isLoading
              ? const LoadingWidget()
              : _report == null
                  ? const EmptyState(
                      icon: Icons.assessment, title: 'No report data')
                  : SingleChildScrollView(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          // Stats
                          GridView.count(
                            crossAxisCount: 2,
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            mainAxisSpacing: 10,
                            crossAxisSpacing: 10,
                            childAspectRatio: 1.5,
                            children: [
                              StatCard(
                                title: 'Total',
                                value: '${_report!['summary']?['total'] ?? _report!['total'] ?? 0}',
                                icon: Icons.event_note,
                                color: AppColors.primary,
                              ),
                              StatCard(
                                title: 'Completed',
                                value: '${_report!['summary']?['completed'] ?? _report!['completed'] ?? 0}',
                                icon: Icons.check_circle,
                                color: AppColors.success,
                              ),
                              StatCard(
                                title: 'Cancelled',
                                value: '${_report!['summary']?['cancelled'] ?? _report!['cancelled'] ?? 0}',
                                icon: Icons.cancel,
                                color: AppColors.error,
                              ),
                              StatCard(
                                title: 'Revenue',
                                value: 'Rs. ${(_report!['summary']?['totalAmount'] ?? _report!['totalAmount'] ?? 0).toString()}',
                                icon: Icons.attach_money,
                                color: AppColors.info,
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),

                          // Bookings list
                          if (_report!['bookings'] != null)
                            ...(_report!['bookings'] as List).map((b) {
                              final booking = Booking.fromJson(b);
                              return Container(
                                margin: const EdgeInsets.only(bottom: 8),
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: AppColors.card,
                                  borderRadius: BorderRadius.circular(8),
                                  border:
                                      Border.all(color: AppColors.border),
                                ),
                                child: Row(
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            booking.patientName ?? 'N/A',
                                            style: const TextStyle(
                                                fontWeight:
                                                    FontWeight.w600),
                                          ),
                                          Text(
                                            'Dr. ${booking.doctorName ?? 'N/A'} | ${booking.timeSlot ?? ''}',
                                            style: const TextStyle(
                                                fontSize: 12,
                                                color: AppColors
                                                    .textSecondary),
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
                      ),
                    ),
        ),
      ],
    );
  }
}

class _MonthlyReportTab extends ConsumerStatefulWidget {
  const _MonthlyReportTab();

  @override
  ConsumerState<_MonthlyReportTab> createState() => _MonthlyReportTabState();
}

class _MonthlyReportTabState extends ConsumerState<_MonthlyReportTab> {
  DateTime _month = DateTime.now();
  Map<String, dynamic>? _report;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadReport();
  }

  Future<void> _loadReport() async {
    setState(() => _isLoading = true);
    try {
      final auth = ref.read(authProvider);
      final report = await ReportService().getMonthlySummary(
        month: '${_month.month}',
        year: '${_month.year}',
        dispensaryId: auth.selectedDispensary?.id,
      );
      if (mounted) setState(() => _report = report);
    } catch (e) {
      debugPrint('Monthly report error: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              IconButton(
                icon: const Icon(Icons.chevron_left),
                onPressed: () {
                  setState(() => _month =
                      DateTime(_month.year, _month.month - 1));
                  _loadReport();
                },
              ),
              Text(
                DateFormat('MMMM yyyy').format(_month),
                style: const TextStyle(
                    fontSize: 16, fontWeight: FontWeight.w600),
              ),
              IconButton(
                icon: const Icon(Icons.chevron_right),
                onPressed: () {
                  setState(() => _month =
                      DateTime(_month.year, _month.month + 1));
                  _loadReport();
                },
              ),
            ],
          ),
        ),
        Expanded(
          child: _isLoading
              ? const LoadingWidget()
              : _report == null
                  ? const EmptyState(
                      icon: Icons.assessment, title: 'No data')
                  : SingleChildScrollView(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          GridView.count(
                            crossAxisCount: 2,
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            mainAxisSpacing: 10,
                            crossAxisSpacing: 10,
                            childAspectRatio: 1.5,
                            children: [
                              StatCard(
                                title: 'Total Bookings',
                                value: '${_report!['summary']?['total'] ?? _report!['totalBookings'] ?? 0}',
                                icon: Icons.event_note,
                                color: AppColors.primary,
                              ),
                              StatCard(
                                title: 'Completed',
                                value: '${_report!['summary']?['completed'] ?? _report!['completed'] ?? 0}',
                                icon: Icons.check_circle,
                                color: AppColors.success,
                              ),
                              StatCard(
                                title: 'Cancelled',
                                value: '${_report!['summary']?['cancelled'] ?? _report!['cancelled'] ?? 0}',
                                icon: Icons.cancel,
                                color: AppColors.error,
                              ),
                              StatCard(
                                title: 'Completion Rate',
                                value: '${_report!['completionRate'] ?? _report!['summary']?['completionRate'] ?? 'N/A'}%',
                                icon: Icons.trending_up,
                                color: AppColors.info,
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
        ),
      ],
    );
  }
}

class _DoctorPerformanceTab extends ConsumerStatefulWidget {
  const _DoctorPerformanceTab();

  @override
  ConsumerState<_DoctorPerformanceTab> createState() =>
      _DoctorPerformanceTabState();
}

class _DoctorPerformanceTabState
    extends ConsumerState<_DoctorPerformanceTab> {
  List<Doctor> _doctors = [];
  Doctor? _selectedDoctor;
  Map<String, dynamic>? _report;
  bool _isLoading = false;

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
      final doctors =
          await DoctorService().getDoctorsByDispensary(dispensaryId);
      if (mounted) setState(() => _doctors = doctors);
    } catch (_) {}
  }

  Future<void> _loadReport() async {
    if (_selectedDoctor == null) return;
    setState(() => _isLoading = true);
    try {
      final auth = ref.read(authProvider);
      final now = DateTime.now();
      final report = await ReportService().getDoctorPerformance(
        doctorId: _selectedDoctor!.id,
        dispensaryId: auth.selectedDispensary?.id,
        startDate: DateFormat('yyyy-MM-dd')
            .format(now.subtract(const Duration(days: 30))),
        endDate: DateFormat('yyyy-MM-dd').format(now),
      );
      if (mounted) setState(() => _report = report);
    } catch (e) {
      debugPrint('Performance report error: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Doctor selector chips
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _doctors.map((d) {
              final isSelected = _selectedDoctor?.id == d.id;
              return ChoiceChip(
                label: Text(d.name),
                selected: isSelected,
                onSelected: (_) {
                  setState(() => _selectedDoctor = d);
                  _loadReport();
                },
                selectedColor: AppColors.primarySurface,
                labelStyle: TextStyle(
                  color: isSelected ? AppColors.primary : AppColors.text,
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 16),

          if (_isLoading)
            const SizedBox(height: 200, child: LoadingWidget())
          else if (_report != null) ...[
            const Text('Last 30 Days Performance',
                style: TextStyle(
                    fontSize: 16, fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 1.5,
              children: [
                StatCard(
                  title: 'Total Bookings',
                  value: '${_report!['totalBookings'] ?? _report!['summary']?['total'] ?? 0}',
                  icon: Icons.event_note,
                  color: AppColors.primary,
                ),
                StatCard(
                  title: 'Completion Rate',
                  value: '${_report!['completionRate'] ?? _report!['summary']?['completionRate'] ?? 'N/A'}%',
                  icon: Icons.check_circle,
                  color: AppColors.success,
                ),
                StatCard(
                  title: 'Cancellation Rate',
                  value: '${_report!['cancellationRate'] ?? 'N/A'}%',
                  icon: Icons.cancel,
                  color: AppColors.error,
                ),
                StatCard(
                  title: 'No Show Rate',
                  value: '${_report!['noShowRate'] ?? 'N/A'}%',
                  icon: Icons.person_off,
                  color: AppColors.secondary,
                ),
              ],
            ),
          ] else
            const EmptyState(
              icon: Icons.bar_chart,
              title: 'Select a doctor',
              subtitle: 'Choose a doctor to view performance metrics',
            ),
        ],
      ),
    );
  }
}
