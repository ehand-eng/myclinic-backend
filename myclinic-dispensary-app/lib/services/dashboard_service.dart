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
    return DashboardStats(
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
