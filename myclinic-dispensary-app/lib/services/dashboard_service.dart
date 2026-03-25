import '../config/api_config.dart';
import 'api_service.dart';

class DashboardStats {
  final int totalDispensaries;
  final int totalDoctors;
  final int todayBookings;
  final int weekBookings;
  final int monthBookings;
  final int completedThisMonth;
  final int scheduledToday;
  final Map<String, int> bookingsByStatus;
  final List<Map<String, dynamic>> last7Days;
  final List<Map<String, dynamic>> recentBookings;
  final List<Map<String, dynamic>> bookingsByDispensary;

  DashboardStats({
    this.totalDispensaries = 0,
    this.totalDoctors = 0,
    this.todayBookings = 0,
    this.weekBookings = 0,
    this.monthBookings = 0,
    this.completedThisMonth = 0,
    this.scheduledToday = 0,
    this.bookingsByStatus = const {},
    this.last7Days = const [],
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
      scheduledToday: json['scheduledToday'] ?? 0,
      bookingsByStatus: json['bookingsByStatus'] != null
          ? Map<String, int>.from(
              (json['bookingsByStatus'] as Map).map(
                (k, v) => MapEntry(k.toString(), (v as num).toInt()),
              ),
            )
          : {},
      last7Days: json['last7Days'] != null
          ? List<Map<String, dynamic>>.from(json['last7Days'])
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
