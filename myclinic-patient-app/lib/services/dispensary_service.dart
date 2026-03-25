import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:myclinic_patient_app/config/api_config.dart';
import 'package:myclinic_patient_app/models/dispensary.dart';
import 'package:myclinic_patient_app/services/api_service.dart';

final dispensaryServiceProvider = Provider<DispensaryService>((ref) {
  return DispensaryService(ref.watch(apiServiceProvider));
});

class DispensaryService {
  final ApiService _api;

  DispensaryService(this._api);

  Future<List<Dispensary>> getAllDispensaries() async {
    final res = await _api.get(ApiConfig.dispensaries);
    final list = res.data is List ? res.data : res.data['dispensaries'] ?? [];
    return (list as List).map((d) => Dispensary.fromJson(d)).toList();
  }

  Future<Dispensary> getDispensaryById(String id) async {
    final res = await _api.get(ApiConfig.dispensaryById(id));
    return Dispensary.fromJson(res.data is Map ? (res.data['dispensary'] ?? res.data) : res.data);
  }

  Future<List<Dispensary>> getDispensariesByIds(List<String> ids) async {
    final res = await _api.post(ApiConfig.dispensariesByIds, data: {'ids': ids});
    final list = res.data is List ? res.data : res.data['dispensaries'] ?? [];
    return (list as List).map((d) => Dispensary.fromJson(d)).toList();
  }
}
