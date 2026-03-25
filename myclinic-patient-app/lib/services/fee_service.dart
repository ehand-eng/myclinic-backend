import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:myclinic_patient_app/config/api_config.dart';
import 'package:myclinic_patient_app/models/fee.dart';
import 'package:myclinic_patient_app/services/api_service.dart';

final feeServiceProvider = Provider<FeeService>((ref) {
  return FeeService(ref.watch(apiServiceProvider));
});

class FeeService {
  final ApiService _api;

  FeeService(this._api);

  Future<DoctorDispensaryFee?> getFees(String doctorId, String dispensaryId) async {
    final res = await _api.get(ApiConfig.fees(doctorId, dispensaryId));
    if (res.data == null) return null;
    final data = res.data is Map ? (res.data['fee'] ?? res.data['fees'] ?? res.data) : res.data;
    if (data is List && data.isNotEmpty) {
      return DoctorDispensaryFee.fromJson(data[0]);
    }
    if (data is Map<String, dynamic>) {
      return DoctorDispensaryFee.fromJson(data);
    }
    return null;
  }
}
