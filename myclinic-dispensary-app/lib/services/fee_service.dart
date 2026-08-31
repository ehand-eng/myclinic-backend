import '../config/api_config.dart';
import 'api_service.dart';

class FeeService {
  final _api = ApiService();

  Future<List<Map<String, dynamic>>> getFeesForDoctor(String doctorId) async {
    final response = await _api.get(ApiConfig.feesByDoctor(doctorId));
    if (response.data is List) {
      return List<Map<String, dynamic>>.from(response.data);
    }
    return [];
  }

  Future<Map<String, dynamic>> createFee(String doctorId, Map<String, dynamic> data) async {
    final response = await _api.post(ApiConfig.feesByDoctor(doctorId), data: data);
    return response.data as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> updateFee(String doctorId, String feeId, Map<String, dynamic> data) async {
    final response = await _api.put(ApiConfig.updateFee(doctorId, feeId), data: data);
    return response.data as Map<String, dynamic>;
  }
}
