import '../config/api_config.dart';
import '../models/dispensary.dart';
import 'api_service.dart';

class DispensaryService {
  final _api = ApiService();

  Future<List<Dispensary>> getAllDispensaries() async {
    final response = await _api.get(ApiConfig.dispensaries);
    final data = response.data is List ? response.data : response.data['dispensaries'] ?? [];
    return (data as List).map((e) => Dispensary.fromJson(e)).toList();
  }

  Future<Dispensary> getDispensaryById(String id) async {
    final response = await _api.get(ApiConfig.dispensaryById(id));
    final data = response.data is Map && response.data.containsKey('dispensary')
        ? response.data['dispensary']
        : response.data;
    return Dispensary.fromJson(data);
  }

  Future<List<Dispensary>> getDispensariesByIds(List<String> ids) async {
    final response =
        await _api.post(ApiConfig.dispensariesByIds, data: {'ids': ids});
    final data = response.data is List ? response.data : response.data['dispensaries'] ?? [];
    return (data as List).map((e) => Dispensary.fromJson(e)).toList();
  }

  Future<List<Dispensary>> getDispensariesByDoctor(String doctorId) async {
    final response =
        await _api.get(ApiConfig.dispensaryByDoctor(doctorId));
    final data = response.data is List ? response.data : response.data['dispensaries'] ?? [];
    return (data as List).map((e) => Dispensary.fromJson(e)).toList();
  }
}
