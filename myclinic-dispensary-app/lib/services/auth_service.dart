import '../config/api_config.dart';
import '../models/user.dart';
import 'api_service.dart';
import 'storage_service.dart';

class AuthService {
  final _api = ApiService();
  final _storage = StorageService();

  Future<User> login(String email, String password) async {
    final response = await _api.post(ApiConfig.loginAdmin, data: {
      'email': email,
      'password': password,
    });

    final data = response.data;
    final token = data['token'];
    final userData = data['user'];

    await _storage.saveToken(token);
    await _storage.saveUser(userData);

    return User.fromJson(userData);
  }

  Future<User?> getMe() async {
    try {
      final response = await _api.get(ApiConfig.getMe);
      final userData = response.data['user'] ?? response.data;
      await _storage.saveUser(userData);
      return User.fromJson(userData);
    } catch (_) {
      return null;
    }
  }

  Future<void> changePassword(
      String currentPassword, String newPassword) async {
    await _api.post(ApiConfig.changePassword, data: {
      'currentPassword': currentPassword,
      'newPassword': newPassword,
    });
  }

  Future<void> updateProfile(String name) async {
    await _api.put(ApiConfig.updateMe, data: {'name': name});
  }

  Future<void> logout() async {
    await _storage.clearAll();
  }

  Future<bool> isLoggedIn() async {
    final token = await _storage.getToken();
    return token != null;
  }
}
