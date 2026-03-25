import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../config/theme.dart';
import '../../models/doctor.dart';
import '../../providers/auth_provider.dart';
import '../../services/report_service.dart';
import '../../services/doctor_service.dart';
import '../../widgets/compact_stat_card.dart';
import '../../widgets/loading_widget.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/status_badge.dart';
import '../../utils/report_pdf_export.dart';

class ReportsScreen extends ConsumerStatefulWidget {
  const ReportsScreen({super.key});

  @override
  ConsumerState<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends ConsumerState<ReportsScreen> {
  // Filters
  String _period = 'daily';
  DateTime _startDate = DateTime.now();
  DateTime _endDate = DateTime.now();
  String _doctorFilter = 'all';
  String _statusFilter = 'all';

  // Data
  List<Doctor> _doctors = [];
  Map<String, dynamic>? _report;
  bool _isLoading = false;

  // Tabs for bottom detail
  int _detailTab = 0; // 0=bookings, 1=revenue

  @override
  void initState() {
    super.initState();
    _loadDoctors();
    _loadReport();
  }

  Future<void> _loadDoctors() async {
    final auth = ref.read(authProvider);
    final dispId = auth.selectedDispensary?.id;
    if (dispId == null) return;
    try {
      final docs = await DoctorService().getDoctorsByDispensary(dispId);
      if (mounted) setState(() => _doctors = docs);
    } catch (_) {}
  }

  Future<void> _loadReport() async {
    final auth = ref.read(authProvider);
    final dispId = auth.selectedDispensary?.id;
    if (dispId == null) return;

    setState(() => _isLoading = true);
    try {
      final fmt = DateFormat('yyyy-MM-dd');
      final report = await ReportService().getComprehensiveReport(
        period: _period,
        startDate: fmt.format(_startDate),
        endDate: fmt.format(_endDate),
        dispensaryId: dispId,
        doctorId: _doctorFilter != 'all' ? _doctorFilter : null,
        status: _statusFilter != 'all' ? _statusFilter : null,
      );
      if (mounted) setState(() => _report = report);
    } catch (e) {
      debugPrint('Report error: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _onPeriodChanged(String period) {
    final now = DateTime.now();
    DateTime start;
    DateTime end;

    switch (period) {
      case 'weekly':
        // Monday of this week
        start = now.subtract(Duration(days: now.weekday - 1));
        end = start.add(const Duration(days: 6));
        break;
      case 'monthly':
        start = DateTime(now.year, now.month, 1);
        end = DateTime(now.year, now.month + 1, 0);
        break;
      default: // daily
        start = now;
        end = now;
    }

    setState(() {
      _period = period;
      _startDate = start;
      _endDate = end;
    });
    _loadReport();
  }

  Map<String, dynamic> get _summary =>
      (_report?['summary'] as Map<String, dynamic>?) ?? {};
  Map<String, dynamic> get _revenue =>
      (_report?['revenue'] as Map<String, dynamic>?) ?? {};
  List get _bookings => (_report?['bookings'] as List?) ?? [];
  List get _topDoctors => (_report?['topDoctors'] as List?) ?? [];

  @override
  Widget build(BuildContext context) {
    final fmt = DateFormat('MMM dd, yyyy');

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Column(
        children: [
          // ─── Filters Section ───
          Container(
            color: AppColors.card,
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            child: Column(
              children: [
                // Period tabs
                SegmentedButton<String>(
                  segments: const [
                    ButtonSegment(value: 'daily', label: Text('Daily')),
                    ButtonSegment(value: 'weekly', label: Text('Weekly')),
                    ButtonSegment(value: 'monthly', label: Text('Monthly')),
                  ],
                  selected: {_period},
                  onSelectionChanged: (v) => _onPeriodChanged(v.first),
                  style: SegmentedButton.styleFrom(
                    textStyle: const TextStyle(fontSize: 13),
                  ),
                ),
                const SizedBox(height: 10),

                // Date row
                Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () async {
                          final picked = await showDatePicker(
                            context: context,
                            initialDate: _startDate,
                            firstDate: DateTime(2023),
                            lastDate: DateTime.now().add(const Duration(days: 30)),
                          );
                          if (picked != null) {
                            setState(() {
                              _startDate = picked;
                              if (_period == 'daily') _endDate = picked;
                            });
                            _loadReport();
                          }
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 8),
                          decoration: BoxDecoration(
                            border: Border.all(color: AppColors.border),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.calendar_today,
                                  size: 14, color: AppColors.textSecondary),
                              const SizedBox(width: 6),
                              Text(fmt.format(_startDate),
                                  style: const TextStyle(fontSize: 12)),
                            ],
                          ),
                        ),
                      ),
                    ),
                    if (_period != 'daily') ...[
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 6),
                        child: Text('to',
                            style: TextStyle(
                                color: AppColors.textSecondary, fontSize: 12)),
                      ),
                      Expanded(
                        child: GestureDetector(
                          onTap: () async {
                            final picked = await showDatePicker(
                              context: context,
                              initialDate: _endDate,
                              firstDate: _startDate,
                              lastDate:
                                  DateTime.now().add(const Duration(days: 30)),
                            );
                            if (picked != null) {
                              setState(() => _endDate = picked);
                              _loadReport();
                            }
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 8),
                            decoration: BoxDecoration(
                              border: Border.all(color: AppColors.border),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.calendar_today,
                                    size: 14, color: AppColors.textSecondary),
                                const SizedBox(width: 6),
                                Text(fmt.format(_endDate),
                                    style: const TextStyle(fontSize: 12)),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 8),

                // Doctor + Status filters
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: _doctorFilter,
                        isExpanded: true,
                        decoration: const InputDecoration(
                          contentPadding:
                              EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          border: OutlineInputBorder(),
                        ),
                        style: const TextStyle(
                            fontSize: 12, color: AppColors.text),
                        items: [
                          const DropdownMenuItem(
                              value: 'all', child: Text('All Doctors')),
                          ..._doctors.map((d) => DropdownMenuItem(
                                value: d.id,
                                child: Text(d.name,
                                    overflow: TextOverflow.ellipsis),
                              )),
                        ],
                        onChanged: (v) {
                          setState(() => _doctorFilter = v ?? 'all');
                          _loadReport();
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: _statusFilter,
                        isExpanded: true,
                        decoration: const InputDecoration(
                          contentPadding:
                              EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          border: OutlineInputBorder(),
                        ),
                        style: const TextStyle(
                            fontSize: 12, color: AppColors.text),
                        items: const [
                          DropdownMenuItem(
                              value: 'all', child: Text('All Statuses')),
                          DropdownMenuItem(
                              value: 'scheduled', child: Text('Scheduled')),
                          DropdownMenuItem(
                              value: 'checked_in', child: Text('Checked In')),
                          DropdownMenuItem(
                              value: 'completed', child: Text('Completed')),
                          DropdownMenuItem(
                              value: 'cancelled', child: Text('Cancelled')),
                          DropdownMenuItem(
                              value: 'no_show', child: Text('No Show')),
                        ],
                        onChanged: (v) {
                          setState(() => _statusFilter = v ?? 'all');
                          _loadReport();
                        },
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // ─── Content ───
          Expanded(
            child: _isLoading
                ? const LoadingWidget()
                : _report == null || (_summary['total'] ?? 0) == 0
                    ? const EmptyState(
                        icon: Icons.assessment_outlined,
                        title: 'No data for this period',
                        subtitle: 'Try different filters or date range',
                      )
                    : RefreshIndicator(
                        onRefresh: _loadReport,
                        child: SingleChildScrollView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // ── Booking Stats ──
                              _sectionHeader('Booking Summary'),
                              const SizedBox(height: 10),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: [
                                  _wrapCard(CompactStatCard(title: 'Total', value: '${_summary['total'] ?? 0}', icon: Icons.event_note, color: AppColors.primary)),
                                  _wrapCard(CompactStatCard(title: 'Completed', value: '${_summary['completed'] ?? 0}', icon: Icons.check_circle, color: AppColors.success)),
                                  _wrapCard(CompactStatCard(title: 'Scheduled', value: '${_summary['scheduled'] ?? 0}', icon: Icons.schedule, color: AppColors.info)),
                                  _wrapCard(CompactStatCard(title: 'Checked In', value: '${_summary['checkedIn'] ?? 0}', icon: Icons.login, color: AppColors.warning)),
                                  _wrapCard(CompactStatCard(title: 'Cancelled', value: '${_summary['cancelled'] ?? 0}', icon: Icons.cancel, color: AppColors.error)),
                                  _wrapCard(CompactStatCard(title: 'No Show', value: '${_summary['noShow'] ?? 0}', icon: Icons.person_off, color: AppColors.secondary)),
                                ],
                              ),
                              const SizedBox(height: 20),

                              // ── Revenue Stats ──
                              _sectionHeader('Revenue Summary'),
                              const SizedBox(height: 10),
                              Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: [
                                  _wrapCard(CompactStatCard(title: 'Total Fee', value: 'Rs.${_fmtNum(_revenue['totalFee'])}', icon: Icons.attach_money, color: AppColors.primary)),
                                  _wrapCard(CompactStatCard(title: 'Doctor Fee', value: 'Rs.${_fmtNum(_revenue['doctorFee'])}', icon: Icons.medical_services, color: AppColors.info)),
                                  _wrapCard(CompactStatCard(title: 'Dispensary', value: 'Rs.${_fmtNum(_revenue['dispensaryFee'])}', icon: Icons.local_hospital, color: AppColors.success)),
                                  _wrapCard(CompactStatCard(title: 'Commission', value: 'Rs.${_fmtNum(_revenue['bookingCommission'])}', icon: Icons.percent, color: AppColors.warning)),
                                  _wrapCard(CompactStatCard(title: 'CP Fee', value: 'Rs.${_fmtNum(_revenue['channelPartnerFee'])}', icon: Icons.handshake, color: AppColors.secondary)),
                                  _wrapCard(CompactStatCard(title: 'Realized', value: 'Rs.${_fmtNum(_revenue['realizedRevenue'])}', icon: Icons.verified, color: AppColors.success)),
                                ],
                              ),
                              const SizedBox(height: 24),

                              // ── Export Buttons ──
                              Container(
                                padding: const EdgeInsets.all(14),
                                decoration: BoxDecoration(
                                  color: AppColors.card,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: AppColors.border),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Row(
                                      children: [
                                        Icon(Icons.picture_as_pdf,
                                            size: 18, color: AppColors.primary),
                                        SizedBox(width: 8),
                                        Text('Export as PDF',
                                            style: TextStyle(
                                                fontSize: 14,
                                                fontWeight: FontWeight.w600,
                                                color: AppColors.text)),
                                      ],
                                    ),
                                    const SizedBox(height: 12),
                                    Row(
                                      children: [
                                        Expanded(
                                          child: SizedBox(
                                            height: 42,
                                            child: ElevatedButton.icon(
                                              onPressed: _exportAll,
                                              icon: const Icon(
                                                  Icons.file_download,
                                                  size: 16),
                                              label:
                                                  const Text('Export All'),
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 10),
                                        Expanded(
                                          child: SizedBox(
                                            height: 42,
                                            child: OutlinedButton.icon(
                                              onPressed: _exportBookings,
                                              icon: const Icon(
                                                  Icons.event_note_outlined,
                                                  size: 16),
                                              label: const Text('Bookings'),
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 10),
                                        Expanded(
                                          child: SizedBox(
                                            height: 42,
                                            child: OutlinedButton.icon(
                                              onPressed: _exportRevenue,
                                              icon: const Icon(
                                                  Icons.attach_money,
                                                  size: 16),
                                              label: const Text('Revenue'),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 24),

                              // ── Detail Tabs ──
                              Row(
                                children: [
                                  _DetailTabBtn(
                                    label: 'Booking Details',
                                    selected: _detailTab == 0,
                                    onTap: () =>
                                        setState(() => _detailTab = 0),
                                  ),
                                  const SizedBox(width: 10),
                                  _DetailTabBtn(
                                    label: 'Revenue Summary',
                                    selected: _detailTab == 1,
                                    onTap: () =>
                                        setState(() => _detailTab = 1),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),

                              if (_detailTab == 0)
                                _buildBookingsTable()
                              else
                                _buildRevenueTable(),
                              const SizedBox(height: 20),
                            ],
                          ),
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  // ─── PDF Export Methods ───

  Map<String, dynamic> get _exportParams => {
        'period': _period,
        'startDate': DateFormat('yyyy-MM-dd').format(_startDate),
        'endDate': DateFormat('yyyy-MM-dd').format(_endDate),
        'dispensaryName':
            ref.read(authProvider).selectedDispensary?.name,
        'doctorName': _doctorFilter != 'all'
            ? _doctors
                .where((d) => d.id == _doctorFilter)
                .firstOrNull
                ?.name
            : null,
      };

  Future<void> _exportAll() async {
    if (_report == null) return;
    final p = _exportParams;
    await exportComprehensiveReportToPDF(
      data: _report!,
      period: p['period'],
      startDate: p['startDate'],
      endDate: p['endDate'],
      dispensaryName: p['dispensaryName'],
      doctorName: p['doctorName'],
    );
  }

  Future<void> _exportBookings() async {
    if (_report == null) return;
    final p = _exportParams;
    await exportBookingsReportToPDF(
      data: _report!,
      period: p['period'],
      startDate: p['startDate'],
      endDate: p['endDate'],
      dispensaryName: p['dispensaryName'],
      doctorName: p['doctorName'],
    );
  }

  Future<void> _exportRevenue() async {
    if (_report == null) return;
    final p = _exportParams;
    await exportRevenueReportToPDF(
      data: _report!,
      period: p['period'],
      startDate: p['startDate'],
      endDate: p['endDate'],
      dispensaryName: p['dispensaryName'],
      doctorName: p['doctorName'],
    );
  }

  Widget _sectionHeader(String text) {
    return Text(text,
        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.text));
  }

  Widget _wrapCard(Widget card) {
    // 16px padding each side = 32, plus 2 gaps of 8px = 16, total = 48
    final cardWidth = (MediaQuery.of(context).size.width - 32 - 16) / 3;
    return SizedBox(
      width: cardWidth,
      child: card,
    );
  }

  String _fmtNum(dynamic val) {
    if (val == null) return '0';
    final n = (val is num) ? val.toDouble() : double.tryParse('$val') ?? 0;
    if (n >= 1000) return '${(n / 1000).toStringAsFixed(1)}K';
    return n.toStringAsFixed(n.truncateToDouble() == n ? 0 : 2);
  }

  Widget _buildBookingsTable() {
    if (_bookings.isEmpty) {
      return const EmptyState(
          icon: Icons.list_alt, title: 'No bookings in this period');
    }

    return Column(
      children: _bookings.map<Widget>((b) {
        final fees = b['fees'] as Map<String, dynamic>? ?? {};
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.card,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      b['patientName'] ?? 'N/A',
                      style: const TextStyle(
                          fontWeight: FontWeight.w600, fontSize: 14),
                    ),
                  ),
                  StatusBadge(status: b['status'] ?? ''),
                ],
              ),
              const SizedBox(height: 6),
              Row(
                children: [
                  _InfoChip(Icons.medical_services_outlined,
                      b['doctorName'] ?? 'N/A'),
                  const SizedBox(width: 8),
                  _InfoChip(Icons.access_time, b['timeSlot'] ?? ''),
                ],
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  _InfoChip(Icons.calendar_today_outlined,
                      _fmtDate(b['bookingDate'])),
                  const SizedBox(width: 8),
                  if (b['patientPhone'] != null)
                    _InfoChip(Icons.phone_outlined, b['patientPhone']),
                ],
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  if (b['bookingReference'] != null)
                    _InfoChip(
                        Icons.tag,
                        (b['bookingReference'] as String).length > 8
                            ? '...${(b['bookingReference'] as String).substring((b['bookingReference'] as String).length - 8)}'
                            : b['bookingReference']),
                ],
              ),
              const SizedBox(height: 6),
              // Fee row
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.background,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                        'Total: Rs.${(fees['totalFee'] ?? 0).toStringAsFixed(2)}',
                        style: const TextStyle(
                            fontSize: 12, fontWeight: FontWeight.w600)),
                    Text(
                        'Dr: Rs.${(fees['doctorFee'] ?? 0).toStringAsFixed(0)}',
                        style: const TextStyle(
                            fontSize: 11, color: AppColors.textSecondary)),
                    Text(
                        'Disp: Rs.${(fees['dispensaryFee'] ?? 0).toStringAsFixed(0)}',
                        style: const TextStyle(
                            fontSize: 11, color: AppColors.textSecondary)),
                  ],
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildRevenueTable() {
    if (_topDoctors.isEmpty) {
      return const EmptyState(
          icon: Icons.trending_up, title: 'No doctor data');
    }

    return Column(
      children: [
        // Header
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: AppColors.primarySurface,
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Row(
            children: [
              Expanded(
                  flex: 3,
                  child: Text('Doctor',
                      style: TextStyle(
                          fontSize: 12, fontWeight: FontWeight.w600))),
              Expanded(
                  child: Text('Bkgs',
                      style: TextStyle(
                          fontSize: 12, fontWeight: FontWeight.w600),
                      textAlign: TextAlign.center)),
              Expanded(
                  flex: 2,
                  child: Text('Total Fee',
                      style: TextStyle(
                          fontSize: 12, fontWeight: FontWeight.w600),
                      textAlign: TextAlign.right)),
            ],
          ),
        ),
        const SizedBox(height: 4),
        ..._topDoctors.map<Widget>((d) {
          return Container(
            margin: const EdgeInsets.only(bottom: 4),
            padding:
                const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: AppColors.card,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                        flex: 3,
                        child: Text(d['doctorName'] ?? 'N/A',
                            style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600))),
                    Expanded(
                        child: Text('${d['bookingCount'] ?? 0}',
                            style: const TextStyle(fontSize: 13),
                            textAlign: TextAlign.center)),
                    Expanded(
                        flex: 2,
                        child: Text(
                            'Rs.${(d['totalFee'] ?? 0).toStringAsFixed(0)}',
                            style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w500),
                            textAlign: TextAlign.right)),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Text(
                        'Dr: ${(d['doctorFee'] ?? 0).toStringAsFixed(0)}',
                        style: const TextStyle(
                            fontSize: 10, color: AppColors.textSecondary)),
                    const SizedBox(width: 8),
                    Text(
                        'Disp: ${(d['dispensaryFee'] ?? 0).toStringAsFixed(0)}',
                        style: const TextStyle(
                            fontSize: 10, color: AppColors.textSecondary)),
                    const SizedBox(width: 8),
                    Text(
                        'Comm: ${(d['bookingCommission'] ?? 0).toStringAsFixed(0)}',
                        style: const TextStyle(
                            fontSize: 10, color: AppColors.textSecondary)),
                  ],
                ),
              ],
            ),
          );
        }),
        // Totals footer
        Container(
          margin: const EdgeInsets.only(top: 4),
          padding:
              const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: AppColors.primarySurface,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            children: [
              const Expanded(
                  flex: 3,
                  child: Text('TOTAL',
                      style: TextStyle(
                          fontSize: 13, fontWeight: FontWeight.bold))),
              Expanded(
                  child: Text('${_summary['total'] ?? 0}',
                      style: const TextStyle(
                          fontSize: 13, fontWeight: FontWeight.bold),
                      textAlign: TextAlign.center)),
              Expanded(
                  flex: 2,
                  child: Text(
                      'Rs.${(_revenue['totalFee'] ?? 0).toStringAsFixed(0)}',
                      style: const TextStyle(
                          fontSize: 13, fontWeight: FontWeight.bold),
                      textAlign: TextAlign.right)),
            ],
          ),
        ),
      ],
    );
  }

  String _fmtDate(dynamic val) {
    if (val == null) return 'N/A';
    try {
      return DateFormat('MMM dd').format(DateTime.parse('$val').toLocal());
    } catch (_) {
      return '$val';
    }
  }
}

class _DetailTabBtn extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _DetailTabBtn(
      {required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? AppColors.primary : AppColors.card,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
              color: selected ? AppColors.primary : AppColors.border),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: selected ? AppColors.textWhite : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String text;
  const _InfoChip(this.icon, this.text);

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 12, color: AppColors.textLight),
        const SizedBox(width: 3),
        Text(text,
            style:
                const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
      ],
    );
  }
}
