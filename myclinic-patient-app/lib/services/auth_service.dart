import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:myclinic_patient_app/config/api_config.dart';
import 'package:myclinic_patient_app/models/user.dart';
import 'package:myclinic_patient_app/services/api_service.dart';
import 'package:myclinic_patient_app/services/storage_service.dart';

final authServiceProvider = Provider<AuthService>((ref) {
  return AuthService(ref.watch(apiServiceProvider), ref.watch(storageServiceProvider));
});

class AuthService {
  final ApiService _api;
  final StorageService _storage;

  AuthService(this._api, this._storage);

  Future<Map<String, dynamic>> sendOtp(String phone, {String nationality = 'sri_lanka'}) async {
    final data = <String, dynamic>{'nationality': nationality};
    if (nationality == 'sri_lanka') {
      data['mobile'] = phone;
    } else {
      data['email'] = phone;
    }
    final res = await _api.post(ApiConfig.sendOtp, data: data);
    return res.data;
  }

  Future<Map<String, dynamic>> verifyOtp(String phone, String otp, {String nationality = 'sri_lanka'}) async {
    final data = <String, dynamic>{'otp': otp, 'nationality': nationality};
    if (nationality == 'sri_lanka') {
      data['mobile'] = phone;
    } else {
      data['email'] = phone;
    }
    final res = await _api.post(ApiConfig.verifyOtp, data: data);
    return res.data;
  }

  Future<AuthResponse> signupMobile({
    required String name,
    required String phone,
    required String otp,
    String? nationality,
    required String password,
  }) async {
    final res = await _api.post(ApiConfig.signupMobile, data: {
      'name': name,
      'password': password,
      'mobile': phone,
      'nationality': nationality ?? 'sri_lanka',
    });
    return AuthResponse.fromJson(res.data);
  }

  Future<Map<String, dynamic>> sendLoginOtp(String phone, {String loginType = 'mobile'}) async {
    final data = <String, dynamic>{'loginType': loginType};
    if (loginType == 'mobile') {
      data['mobile'] = phone;
    } else {
      data['email'] = phone;
    }
    final res = await _api.post(ApiConfig.sendLoginOtp, data: data);
    return res.data;
  }

  Future<AuthResponse> loginMobile(String phone, String otp, {bool keepSignedIn = false}) async {
    final res = await _api.post(ApiConfig.loginMobile, data: {
      'mobile': phone, 'otp': otp, 'keepSignedIn': keepSignedIn,
    });
    return AuthResponse.fromJson(res.data);
  }

  Future<AuthResponse> loginEmail(String email, String password, {bool keepSignedIn = false}) async {
    final res = await _api.post(ApiConfig.loginEmail, data: {
      'email': email, 'password': password, 'keepSignedIn': keepSignedIn,
    });
    return AuthResponse.fromJson(res.data);
  }

  Future<AuthResponse> signupEmail({
    required String name,
    required String email,
    required String password,
    String? phone,
    String? nationality,
  }) async {
    final res = await _api.post(ApiConfig.customSignup, data: {
      'name': name,
      'email': email,
      'password': password,
      'mobile': phone,
      'nationality': nationality ?? 'sri_lanka',
    });
    return AuthResponse.fromJson(res.data);
  }

  Future<User> getCurrentUser() async {
    final res = await _api.get(ApiConfig.currentUser);
    return User.fromJson(res.data['user'] ?? res.data);
  }

  Future<void> logout() async {
    await _storage.clearAll();
  }
}
