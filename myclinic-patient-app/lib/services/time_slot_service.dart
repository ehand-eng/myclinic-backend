import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:myclinic_patient_app/config/api_config.dart';
import 'package:myclinic_patient_app/models/time_slot.dart';
import 'package:myclinic_patient_app/services/api_service.dart';

final timeSlotServiceProvider = Provider<TimeSlotService>((ref) {
  return TimeSlotService(ref.watch(apiServiceProvider));
});

class TimeSlotService {
  final ApiService _api;

  TimeSlotService(this._api);

  Future<List<TimeSlotConfig>> getTimeSlotConfig(String doctorId, String dispensaryId) async {
    final res = await _api.get(ApiConfig.timeSlotConfig(doctorId, dispensaryId));
    final list = res.data is List ? res.data : res.data['timeSlots'] ?? res.data['timeSlotConfigs'] ?? [];
    return (list as List).map((t) => TimeSlotConfig.fromJson(t)).toList();
  }

  Future<List<Session>> getSessions(String doctorId, String dispensaryId, String date) async {
    final res = await _api.get(ApiConfig.sessions(doctorId, dispensaryId, date));
    final list = res.data is List ? res.data : res.data['sessions'] ?? [];
    return (list as List).map((s) => Session.fromJson(s)).toList();
  }

  Future<Map<String, dynamic>> getAvailableSlots(
      String doctorId, String dispensaryId, String date) async {
    final res = await _api.get(ApiConfig.availableSlots(doctorId, dispensaryId, date));
    return res.data;
  }

  Future<Map<String, dynamic>> getNextAvailable(String doctorId, String dispensaryId) async {
    final res = await _api.get(ApiConfig.nextAvailable(doctorId, dispensaryId));
    return res.data;
  }

  Future<List<DateTime>> getDisabledDates(String doctorId, String dispensaryId) async {
    final res = await _api.get(ApiConfig.disabledDates(doctorId, dispensaryId));
    final list = res.data is List ? res.data : res.data['disabledDates'] ?? [];
    return (list as List).map((d) => DateTime.parse(d.toString())).toList();
  }
}
