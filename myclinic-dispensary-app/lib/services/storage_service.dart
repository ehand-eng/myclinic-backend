import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class StorageService {
  static final StorageService _instance = StorageService._internal();
  factory StorageService() => _instance;
  StorageService._internal();

  final _secureStorage = const FlutterSecureStorage();

  // Keys
  static const _tokenKey = 'auth_token';
  static const _userKey = 'user_data';
  static const _selectedDispensaryKey = 'selected_dispensary_id';

  // Token
  Future<void> saveToken(String token) async {
    await _secureStorage.write(key: _tokenKey, value: token);
  }

  Future<String?> getToken() async {
    return await _secureStorage.read(key: _tokenKey);
  }

  // User
  Future<void> saveUser(Map<String, dynamic> user) async {
    await _secureStorage.write(key: _userKey, value: jsonEncode(user));
  }

  Future<Map<String, dynamic>?> getUser() async {
    final data = await _secureStorage.read(key: _userKey);
    if (data != null) {
      return jsonDecode(data);
    }
    return null;
  }

  // Selected Dispensary
  Future<void> saveSelectedDispensary(String dispensaryId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_selectedDispensaryKey, dispensaryId);
  }

  Future<String?> getSelectedDispensary() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_selectedDispensaryKey);
  }

  // Clear all
  Future<void> clearAll() async {
    await _secureStorage.deleteAll();
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }
}
