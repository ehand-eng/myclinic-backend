import '../config/api_config.dart';
import '../models/doctor.dart';
import '../models/time_slot.dart';
import 'api_service.dart';

class DoctorService {
  final _api = ApiService();

  Future<List<Doctor>> getAllDoctors({bool activeOnly = false}) async {
    final response = await _api.get(ApiConfig.doctors,
        queryParameters: activeOnly ? {'activeOnly': 'true'} : null);
    final data = response.data is List ? response.data : response.data['doctors'] ?? [];
    return (data as List).map((e) => Doctor.fromJson(e)).toList();
  }

  Future<List<Doctor>> getDoctorsByDispensary(String dispensaryId,
      {bool activeOnly = false}) async {
    final response = await _api.get(
      ApiConfig.doctorsByDispensary(dispensaryId),
      queryParameters: activeOnly ? {'activeOnly': 'true'} : null,
    );
    final data = response.data is List ? response.data : response.data['doctors'] ?? [];
    return (data as List).map((e) => Doctor.fromJson(e)).toList();
  }

  Future<Doctor> getDoctorById(String id) async {
    final response = await _api.get(ApiConfig.doctorById(id));
    final data = response.data is Map && response.data.containsKey('doctor')
        ? response.data['doctor']
        : response.data;
    return Doctor.fromJson(data);
  }

  Future<Doctor> createDoctor(Map<String, dynamic> doctorData) async {
    final response = await _api.post(ApiConfig.doctors, data: doctorData);
    final data = response.data is Map && response.data.containsKey('doctor')
        ? response.data['doctor']
        : response.data;
    return Doctor.fromJson(data);
  }

  Future<Doctor> updateDoctor(
      String id, Map<String, dynamic> doctorData) async {
    final response =
        await _api.put(ApiConfig.doctorById(id), data: doctorData);
    final data = response.data is Map && response.data.containsKey('doctor')
        ? response.data['doctor']
        : response.data;
    return Doctor.fromJson(data);
  }

  Future<void> deleteDoctor(String id) async {
    await _api.delete(ApiConfig.doctorById(id));
  }

  Future<void> disableDoctor(String id) async {
    await _api.patch(ApiConfig.disableDoctor(id));
  }

  Future<void> enableDoctor(String id) async {
    await _api.patch(ApiConfig.enableDoctor(id));
  }

  // Replacements
  Future<List<ReplacementDoctor>> getReplacements(
      String doctorId, String dispensaryId) async {
    final response =
        await _api.get(ApiConfig.replacements(doctorId, dispensaryId));
    final data = response.data is List
        ? response.data
        : response.data['replacements'] ?? [];
    return (data as List).map((e) => ReplacementDoctor.fromJson(e)).toList();
  }

  Future<void> createReplacement(
      String doctorId, String dispensaryId, Map<String, dynamic> data) async {
    await _api.post(ApiConfig.replacement(doctorId, dispensaryId), data: data);
  }

  Future<void> deleteReplacement(String id) async {
    await _api.delete(ApiConfig.deleteReplacement(id));
  }
}
