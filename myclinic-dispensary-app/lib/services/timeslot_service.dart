import '../config/api_config.dart';
import '../models/time_slot.dart';
import 'api_service.dart';

class TimeSlotService {
  final _api = ApiService();

  Future<List<TimeSlotConfig>> getConfigs(
      String doctorId, String dispensaryId) async {
    final response =
        await _api.get(ApiConfig.timeSlotConfig(doctorId, dispensaryId));
    final data = response.data is List
        ? response.data
        : response.data['configs'] ?? response.data['timeSlots'] ?? [];
    return (data as List).map((e) => TimeSlotConfig.fromJson(e)).toList();
  }

  Future<TimeSlotConfig> createConfig(Map<String, dynamic> data) async {
    final response =
        await _api.post(ApiConfig.createTimeSlotConfig, data: data);
    final result = response.data is Map && response.data.containsKey('config')
        ? response.data['config']
        : response.data;
    return TimeSlotConfig.fromJson(result);
  }

  Future<void> updateConfig(String id, Map<String, dynamic> data) async {
    await _api.put(ApiConfig.updateTimeSlotConfig(id), data: data);
  }

  Future<void> deleteConfig(String id) async {
    await _api.delete(ApiConfig.deleteTimeSlotConfig(id));
  }

  Future<List<Session>> getSessions(
      String doctorId, String dispensaryId, String date) async {
    final response =
        await _api.get(ApiConfig.sessions(doctorId, dispensaryId, date));
    final data = response.data is List
        ? response.data
        : response.data['sessions'] ?? [];
    return (data as List).map((e) => Session.fromJson(e)).toList();
  }

  Future<List<Session>> getSessionsByDispensary(
      String dispensaryId, String date) async {
    final response =
        await _api.get(ApiConfig.sessionsByDispensary(dispensaryId, date));
    final data = response.data is List
        ? response.data
        : response.data['sessions'] ?? [];
    return (data as List).map((e) => Session.fromJson(e)).toList();
  }

  // Absent slots — backend requires startDate and endDate query params
  Future<List<AbsentTimeSlot>> getAbsentSlots(
      String doctorId, String dispensaryId,
      {DateTime? startDate, DateTime? endDate}) async {
    final now = DateTime.now();
    final start = startDate ?? DateTime(now.year, now.month, 1);
    final end = endDate ?? DateTime(now.year, now.month + 6, 0);

    final response = await _api.get(
      ApiConfig.absentSlots(doctorId, dispensaryId),
      queryParameters: {
        'startDate': start.toIso8601String(),
        'endDate': end.toIso8601String(),
      },
    );
    final data = response.data is List
        ? response.data
        : response.data['absentSlots'] ?? response.data['absentTimeSlots'] ?? [];
    return (data as List).map((e) => AbsentTimeSlot.fromJson(e)).toList();
  }

  Future<void> createAbsentSlot(Map<String, dynamic> data) async {
    await _api.post(ApiConfig.createAbsentSlot, data: data);
  }

  Future<void> deleteAbsentSlot(String id) async {
    await _api.delete(ApiConfig.deleteAbsentSlot(id));
  }

  Future<Map<String, dynamic>> checkConflicts(
      Map<String, dynamic> params) async {
    final response =
        await _api.get(ApiConfig.checkAbsentConflicts, queryParameters: params);
    return response.data;
  }
}
