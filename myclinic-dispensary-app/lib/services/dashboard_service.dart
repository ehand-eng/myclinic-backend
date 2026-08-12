import '../config/api_config.dart';
import 'api_service.dart';

class DashboardStats {
  final int totalDispensaries;
  final int totalDoctors;
  final int todayBookings;
  final int weekBookings;
  final int monthBookings;
  final int completedThisMonth;
  final int periodScheduled;
  final int periodCompleted;
  final Map<String, int> bookingsByStatus;
  final List<Map<String, dynamic>> dailyStats;
  final List<Map<String, dynamic>> recentBookings;
  final List<Map<String, dynamic>> bookingsByDispensary;

  DashboardStats({
    this.totalDispensaries = 0,
    this.totalDoctors = 0,
    this.todayBookings = 0,
    this.weekBookings = 0,
    this.monthBookings = 0,
    this.completedThisMonth = 0,
    this.periodScheduled = 0,
    this.periodCompleted = 0,
    this.bookingsByStatus = const {},
    this.dailyStats = const [],
    this.recentBookings = const [],
    this.bookingsByDispensary = const [],
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    final _dashboard = DashboardStats(
      totalDispensaries: json['totalDispensaries'] ?? 0,
      totalDoctors: json['totalDoctors'] ?? 0,
      todayBookings: json['todayBookings'] ?? 0,
      weekBookings: json['weekBookings'] ?? 0,
      monthBookings: json['monthBookings'] ?? 0,
      completedThisMonth: json['completedThisMonth'] ?? 0,
      periodScheduled: json['periodScheduled'] ?? 0,
      periodCompleted: json['periodCompleted'] ?? 0,
      bookingsByStatus: json['bookingsByStatus'] != null
          ? Map<String, int>.from(
              (json['bookingsByStatus'] as Map).map(
                (k, v) => MapEntry(k.toString(), (v as num).toInt()),
              ),
            )
          : {},
      dailyStats: json['dailyStats'] != null
          ? List<Map<String, dynamic>>.from(json['dailyStats'])
          : [],
      recentBookings: json['recentBookings'] != null
          ? List<Map<String, dynamic>>.from(json['recentBookings'])
          : [],
      bookingsByDispensary: json['bookingsByDispensary'] != null
          ? List<Map<String, dynamic>>.from(json['bookingsByDispensary'])
          : [],
    );

    // Compute periodCompleted dynamically if backend deployed version is stale
    final resolvedPeriodCompleted = _dashboard.bookingsByStatus['completed'] ?? 0;
    final resolvedCheckedIn = _dashboard.bookingsByStatus['checked_in'] ?? 0;
    
    // Only patch it if the backend completely missed the checked_in merge payload (stale deployment)
    if (_dashboard.periodCompleted == 0 && resolvedCheckedIn > 0) {
      
      var newDailyStats = _dashboard.dailyStats;
      // Stale backends also drop checked_in from dailyStats entirely. If it's a 1-day range (like 'Today'), we can hot-bridge the status natively from the top-level stats!
      if (newDailyStats.length == 1) {
        final singleDay = Map<String, dynamic>.from(newDailyStats.first);
        final dayCheckedIn = (singleDay['checked_in'] as num?)?.toInt() ?? 0;
        final dayCompleted = (singleDay['completed'] as num?)?.toInt() ?? 0;
        if (dayCheckedIn == 0 && dayCompleted == 0) {
           singleDay['checked_in'] = resolvedCheckedIn;
           newDailyStats = [singleDay];
        }
      }

      return DashboardStats(
        totalDispensaries: _dashboard.totalDispensaries,
        totalDoctors: _dashboard.totalDoctors,
        todayBookings: _dashboard.todayBookings,
        weekBookings: _dashboard.weekBookings,
        monthBookings: _dashboard.monthBookings,
        completedThisMonth: _dashboard.completedThisMonth,
        periodScheduled: _dashboard.periodScheduled,
        periodCompleted: resolvedPeriodCompleted + resolvedCheckedIn,
        bookingsByStatus: _dashboard.bookingsByStatus,
        dailyStats: newDailyStats,
        recentBookings: _dashboard.recentBookings,
        bookingsByDispensary: _dashboard.bookingsByDispensary,
      );
    }
    return _dashboard;
  }
}

class DashboardService {
  final _api = ApiService();

  Future<DashboardStats> getStats({String? range}) async {
    final params = <String, dynamic>{};
    if (range != null) params['range'] = range;

    final response =
        await _api.get(ApiConfig.dashboardStats, queryParameters: params);
    return DashboardStats.fromJson(response.data);
  }
}
