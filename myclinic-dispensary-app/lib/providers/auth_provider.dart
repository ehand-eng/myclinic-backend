import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user.dart';
import '../models/dispensary.dart';
import '../services/auth_service.dart';
import '../services/dispensary_service.dart';
import '../services/storage_service.dart';

class AuthState {
  final User? user;
  final List<Dispensary> dispensaries;
  final Dispensary? selectedDispensary;
  final bool isLoading;
  final bool isAuthenticated;
  final String? error;

  AuthState({
    this.user,
    this.dispensaries = const [],
    this.selectedDispensary,
    this.isLoading = false,
    this.isAuthenticated = false,
    this.error,
  });

  AuthState copyWith({
    User? user,
    List<Dispensary>? dispensaries,
    Dispensary? selectedDispensary,
    bool? isLoading,
    bool? isAuthenticated,
    String? error,
  }) {
    return AuthState(
      user: user ?? this.user,
      dispensaries: dispensaries ?? this.dispensaries,
      selectedDispensary: selectedDispensary ?? this.selectedDispensary,
      isLoading: isLoading ?? this.isLoading,
      isAuthenticated: isAuthenticated ?? this.isAuthenticated,
      error: error,
    );
  }
}

class AuthNotifier extends Notifier<AuthState> {
  final AuthService _authService = AuthService();
  final DispensaryService _dispensaryService = DispensaryService();
  final StorageService _storage = StorageService();

  @override
  AuthState build() => AuthState(isLoading: true);

  Future<void> init() async {
    // Only show loading if not already authenticated (first load)
    if (!state.isAuthenticated) {
      state = state.copyWith(isLoading: true);
    }
    try {
      final isLoggedIn = await _authService.isLoggedIn();
      if (!isLoggedIn) {
        state = AuthState(isLoading: false);
        return;
      }

      final user = await _authService.getMe();
      if (user == null) {
        state = AuthState(isLoading: false);
        return;
      }

      List<Dispensary> dispensaries = [];
      if (user.dispensaryIds.isNotEmpty) {
        dispensaries =
            await _dispensaryService.getDispensariesByIds(user.dispensaryIds);
      }

      Dispensary? selected = state.selectedDispensary;
      if (selected == null) {
        final savedId = await _storage.getSelectedDispensary();
        if (savedId != null) {
          selected = dispensaries.where((d) => d.id == savedId).firstOrNull;
        }
      }
      if (selected == null && dispensaries.length == 1) {
        selected = dispensaries.first;
        await _storage.saveSelectedDispensary(selected.id);
      }

      state = AuthState(
        user: user,
        dispensaries: dispensaries,
        selectedDispensary: selected,
        isAuthenticated: true,
        isLoading: false,
      );
    } catch (_) {
      // Only clear auth if we weren't already authenticated
      if (!state.isAuthenticated) {
        state = AuthState(isLoading: false);
      }
    }
  }

  /// Refresh user data without touching auth/loading state (no redirect flicker)
  Future<void> refreshUser() async {
    try {
      final user = await _authService.getMe();
      if (user != null) {
        state = state.copyWith(user: user);
      }
    } catch (_) {}
  }

  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final user = await _authService.login(email, password);

      if (!user.isDispensaryAdmin) {
        await _authService.logout();
        state = state.copyWith(
          isLoading: false,
          error: 'Access denied. This app is for dispensary administrators only.',
        );
        return;
      }

      List<Dispensary> dispensaries = [];
      if (user.dispensaryIds.isNotEmpty) {
        dispensaries =
            await _dispensaryService.getDispensariesByIds(user.dispensaryIds);
      }

      Dispensary? selected;
      if (dispensaries.length == 1) {
        selected = dispensaries.first;
        await _storage.saveSelectedDispensary(selected.id);
      }

      state = AuthState(
        user: user,
        dispensaries: dispensaries,
        selectedDispensary: selected,
        isAuthenticated: true,
        isLoading: false,
      );
    } catch (e) {
      String message = 'Login failed. Please try again.';
      if (e.toString().contains('401') ||
          e.toString().contains('Invalid')) {
        message = 'Invalid email or password.';
      }
      state = state.copyWith(isLoading: false, error: message);
    }
  }

  Future<void> selectDispensary(Dispensary dispensary) async {
    await _storage.saveSelectedDispensary(dispensary.id);
    state = state.copyWith(selectedDispensary: dispensary);
  }

  Future<void> logout() async {
    await _authService.logout();
    state = AuthState();
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

final authProvider = NotifierProvider<AuthNotifier, AuthState>(() {
  return AuthNotifier();
});
