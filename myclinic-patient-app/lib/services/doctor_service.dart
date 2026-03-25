import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:myclinic_patient_app/config/api_config.dart';
import 'package:myclinic_patient_app/models/doctor.dart';
import 'package:myclinic_patient_app/services/api_service.dart';

final doctorServiceProvider = Provider<DoctorService>((ref) {
  return DoctorService(ref.watch(apiServiceProvider));
});

class DoctorService {
  final ApiService _api;

  DoctorService(this._api);

  Future<List<Doctor>> getAllDoctors() async {
    final res = await _api.get(ApiConfig.doctors);
    final list = res.data is List ? res.data : res.data['doctors'] ?? [];
    return (list as List).map((d) => Doctor.fromJson(d)).toList();
  }

  Future<Doctor> getDoctorById(String id) async {
    final res = await _api.get(ApiConfig.doctorById(id));
    return Doctor.fromJson(res.data is Map ? (res.data['doctor'] ?? res.data) : res.data);
  }

  Future<Map<String, dynamic>?> getActiveReplacement(String doctorId, String dispensaryId, String date) async {
    try {
      final res = await _api.get(ApiConfig.activeReplacement(doctorId, dispensaryId), queryParams: {'date': date});
      final data = res.data;
      debugPrint('[DoctorService] Replacement API response: $data');
      // API returns the replacement document directly, or null
      if (data == null || data == '' || data == 'null') return null;
      if (data is Map && data.containsKey('replacementName')) {
        debugPrint('[DoctorService] Found replacement: ${data['replacementName']}');
        return Map<String, dynamic>.from(data);
      }
      // In case it's wrapped in a key
      if (data is Map && data['replacement'] is Map) {
        return Map<String, dynamic>.from(data['replacement']);
      }
      return null;
    } catch (e) {
      debugPrint('[DoctorService] Replacement API error: $e');
      return null;
    }
  }
}
