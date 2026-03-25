import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:myclinic_patient_app/models/user.dart';

final storageServiceProvider = Provider<StorageService>((ref) {
  return StorageService();
});

class StorageService {
  final FlutterSecureStorage _secure = const FlutterSecureStorage();

  static const String _tokenKey = 'auth_token';
  static const String _userKey = 'current_user';
  static const String _localeKey = 'app_locale';
  static const String _onboardingKey = 'onboarding_seen';

  // Token
  Future<void> saveToken(String token) async {
    await _secure.write(key: _tokenKey, value: token);
  }

  Future<String?> getToken() async {
    return _secure.read(key: _tokenKey);
  }

  Future<void> deleteToken() async {
    await _secure.delete(key: _tokenKey);
  }

  // User
  Future<void> saveUser(User user) async {
    await _secure.write(key: _userKey, value: jsonEncode(user.toJson()));
  }

  Future<User?> getUser() async {
    final data = await _secure.read(key: _userKey);
    if (data != null) {
      return User.fromJson(jsonDecode(data));
    }
    return null;
  }

  Future<void> deleteUser() async {
    await _secure.delete(key: _userKey);
  }

  // Locale
  Future<void> saveLocale(String languageCode) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_localeKey, languageCode);
  }

  Future<String?> getLocale() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_localeKey);
  }

  // Onboarding
  Future<void> setOnboardingSeen() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_onboardingKey, true);
  }

  Future<bool> isOnboardingSeen() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_onboardingKey) ?? false;
  }

  // Clear all
  Future<void> clearAll() async {
    await _secure.deleteAll();
  }
}
