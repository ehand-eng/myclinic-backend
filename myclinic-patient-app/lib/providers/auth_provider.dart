import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:myclinic_patient_app/models/user.dart';
import 'package:myclinic_patient_app/services/api_service.dart';
import 'package:myclinic_patient_app/services/auth_service.dart';
import 'package:myclinic_patient_app/services/storage_service.dart';

class AuthState {
  final User? user;
  final String? token;
  final bool isLoading;
  final String? error;

  const AuthState({this.user, this.token, this.isLoading = false, this.error});

  bool get isAuthenticated => token != null && user != null;

  AuthState copyWith({User? user, String? token, bool? isLoading, String? error}) {
    return AuthState(
      user: user ?? this.user,
      token: token ?? this.token,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthService _authService;
  final StorageService _storage;

  AuthNotifier(this._authService, this._storage) : super(const AuthState());

  Future<void> checkAuth() async {
    state = state.copyWith(isLoading: true);
    try {
      final token = await _storage.getToken();
      if (token != null) {
        final user = await _authService.getCurrentUser();
        await _storage.saveUser(user);
        state = AuthState(user: user, token: token);
      } else {
        state = const AuthState();
      }
    } catch (e) {
      debugPrint('[AUTH] checkAuth failed: $e');
      await _storage.clearAll();
      state = const AuthState();
    }
  }

  Future<void> loginEmail(String email, String password, {bool keepSignedIn = false}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await _authService.loginEmail(email, password, keepSignedIn: keepSignedIn);
      final adminRoles = ['super-admin', 'dispensary-admin', 'dispensary-staff', 'doctor', 'channel-partner'];
      final userRole = (res.user.role ?? '').toLowerCase().replaceAll('_', '-');
      if (adminRoles.contains(userRole)) {
        state = state.copyWith(isLoading: false, error: 'Please use the admin portal to sign in with this account.');
        return;
      }
      await _storage.saveToken(res.token);
      await _storage.saveUser(res.user);
      state = AuthState(user: res.user, token: res.token);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: _parseError(e));
    }
  }

  Future<Map<String, dynamic>> sendOtp(String phone, {String nationality = 'sri_lanka'}) async {
    return _authService.sendOtp(phone, nationality: nationality);
  }

  Future<Map<String, dynamic>> sendLoginOtp(String phone, {String loginType = 'mobile'}) async {
    return _authService.sendLoginOtp(phone, loginType: loginType);
  }

  Future<void> loginWithOtp(String phone, String otp, {bool keepSignedIn = false}) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await _authService.loginMobile(phone, otp, keepSignedIn: keepSignedIn);
      final adminRoles = ['super-admin', 'dispensary-admin', 'dispensary-staff', 'doctor', 'channel-partner'];
      final userRole = (res.user.role ?? '').toLowerCase().replaceAll('_', '-');
      if (adminRoles.contains(userRole)) {
        state = state.copyWith(isLoading: false, error: 'Please use the admin portal to sign in with this account.');
        return;
      }
      await _storage.saveToken(res.token);
      await _storage.saveUser(res.user);
      state = AuthState(user: res.user, token: res.token);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: _parseError(e));
    }
  }

  Future<void> signupMobile({
    required String name,
    required String phone,
    required String otp,
    String? nationality,
    required String password,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await _authService.signupMobile(
        name: name, phone: phone, otp: otp, nationality: nationality, password: password,
      );
      final adminRoles = ['super-admin', 'dispensary-admin', 'dispensary-staff', 'doctor', 'channel-partner'];
      final userRole = (res.user.role ?? '').toLowerCase().replaceAll('_', '-');
      if (adminRoles.contains(userRole)) {
        state = state.copyWith(isLoading: false, error: 'Please use the admin portal to sign in with this account.');
        return;
      }
      await _storage.saveToken(res.token);
      await _storage.saveUser(res.user);
      state = AuthState(user: res.user, token: res.token);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: _parseError(e));
    }
  }

  Future<void> signupEmail({
    required String name,
    required String email,
    required String password,
    String? phone,
    String? nationality,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final res = await _authService.signupEmail(
        name: name, email: email, password: password, phone: phone, nationality: nationality,
      );
      final adminRoles = ['super-admin', 'dispensary-admin', 'dispensary-staff', 'doctor', 'channel-partner'];
      final userRole = (res.user.role ?? '').toLowerCase().replaceAll('_', '-');
      if (adminRoles.contains(userRole)) {
        state = state.copyWith(isLoading: false, error: 'Please use the admin portal to sign in with this account.');
        return;
      }
      await _storage.saveToken(res.token);
      await _storage.saveUser(res.user);
      state = AuthState(user: res.user, token: res.token);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: _parseError(e));
    }
  }

  Future<void> updateUser(User user) async {
    await _storage.saveUser(user);
    state = state.copyWith(user: user);
  }

  void clearError() {
    state = state.copyWith(error: null);
  }

  Future<void> logout() async {
    await _authService.logout();
    state = const AuthState();
  }

  String _parseError(dynamic e) {
    final msg = ApiService.extractError(e);
    debugPrint('[AUTH ERROR] $msg');
    return msg;
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(
    ref.watch(authServiceProvider),
    ref.watch(storageServiceProvider),
  );
});

final isAuthenticatedProvider = Provider<bool>((ref) {
  return ref.watch(authProvider).isAuthenticated;
});

final currentUserProvider = Provider<User?>((ref) {
  return ref.watch(authProvider).user;
});
