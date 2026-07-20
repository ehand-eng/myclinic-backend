import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:myclinic_patient_app/config/api_config.dart';
import 'package:myclinic_patient_app/models/user.dart';
import 'package:myclinic_patient_app/services/api_service.dart';

final userServiceProvider = Provider<UserService>((ref) {
  return UserService(ref.watch(apiServiceProvider));
});

class UserService {
  final ApiService _api;

  UserService(this._api);

  Future<User> getUserById(String id) async {
    final res = await _api.get(ApiConfig.userById(id));
    return User.fromJson(res.data['user'] ?? res.data);
  }

  Future<User> updateUser(String id, Map<String, dynamic> data) async {
    final res = await _api.put(ApiConfig.userById(id), data: data);
    return User.fromJson(res.data['user'] ?? res.data);
  }

  Future<AuthResponse> updateProfile(Map<String, dynamic> data) async {
    final res = await _api.put(ApiConfig.currentUser, data: data);
    return AuthResponse.fromJson(res.data);
  }

  Future<void> changePassword(String id, String currentPassword, String newPassword) async {
    await _api.put(ApiConfig.userById(id), data: {
      'currentPassword': currentPassword,
      'newPassword': newPassword,
    });
  }
}
