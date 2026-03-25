import '../config/api_config.dart';
import 'api_service.dart';

class ReportService {
  final _api = ApiService();

  Future<Map<String, dynamic>> getComprehensiveReport({
    required String period,
    required String startDate,
    required String endDate,
    String? dispensaryId,
    String? doctorId,
    String? status,
  }) async {
    final params = <String, dynamic>{
      'period': period,
      'startDate': startDate,
      'endDate': endDate,
    };
    if (dispensaryId != null) params['dispensaryId'] = dispensaryId;
    if (doctorId != null) params['doctorId'] = doctorId;
    if (status != null && status != 'all') params['status'] = status;

    final response = await _api.get(ApiConfig.comprehensiveReport,
        queryParameters: params);
    return response.data;
  }

  Future<Map<String, dynamic>> getDailyBookings({
    required String date,
    String? dispensaryId,
    String? doctorId,
  }) async {
    final params = <String, dynamic>{'date': date};
    if (dispensaryId != null) params['dispensaryId'] = dispensaryId;
    if (doctorId != null) params['doctorId'] = doctorId;

    final response =
        await _api.get(ApiConfig.dailyBookings, queryParameters: params);
    return response.data;
  }

  Future<Map<String, dynamic>> getMonthlySummary({
    required String month,
    required String year,
    String? dispensaryId,
  }) async {
    final params = <String, dynamic>{'month': month, 'year': year};
    if (dispensaryId != null) params['dispensaryId'] = dispensaryId;

    final response =
        await _api.get(ApiConfig.monthlySummary, queryParameters: params);
    return response.data;
  }

  Future<Map<String, dynamic>> getDoctorPerformance({
    String? doctorId,
    String? startDate,
    String? endDate,
    String? dispensaryId,
  }) async {
    final params = <String, dynamic>{};
    if (doctorId != null) params['doctorId'] = doctorId;
    if (startDate != null) params['startDate'] = startDate;
    if (endDate != null) params['endDate'] = endDate;
    if (dispensaryId != null) params['dispensaryId'] = dispensaryId;

    final response =
        await _api.get(ApiConfig.doctorPerformance, queryParameters: params);
    return response.data;
  }

  Future<Map<String, dynamic>> getAdvanceBookings({
    required String startDate,
    required String endDate,
    String? dispensaryId,
    String? doctorId,
    String? status,
  }) async {
    final params = <String, dynamic>{
      'startDate': startDate,
      'endDate': endDate,
    };
    if (dispensaryId != null) params['dispensaryId'] = dispensaryId;
    if (doctorId != null) params['doctorId'] = doctorId;
    if (status != null) params['status'] = status;

    final response =
        await _api.get(ApiConfig.advanceBookings, queryParameters: params);
    return response.data;
  }
}
