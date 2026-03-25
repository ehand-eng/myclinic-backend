import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:myclinic_patient_app/config/api_config.dart';
import 'package:myclinic_patient_app/services/storage_service.dart';

final apiServiceProvider = Provider<ApiService>((ref) {
  final storage = ref.watch(storageServiceProvider);
  return ApiService(storage);
});

class ApiService {
  late final Dio _dio;
  final StorageService _storage;

  ApiService(this._storage) {
    _dio = Dio(BaseOptions(
      baseUrl: ApiConfig.baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {'Content-Type': 'application/json'},
    ));

    // Logging interceptor — prints requests/responses in debug mode
    _dio.interceptors.add(LogInterceptor(
      requestBody: true,
      responseBody: true,
      error: true,
      logPrint: (msg) => debugPrint('[API] $msg'),
    ));

    // Auth token interceptor
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        debugPrint('[API] ${options.method} ${options.uri}');
        return handler.next(options);
      },
      onResponse: (response, handler) {
        debugPrint('[API] Response ${response.statusCode}: ${response.requestOptions.path}');
        return handler.next(response);
      },
      onError: (error, handler) async {
        debugPrint('[API ERROR] ${error.response?.statusCode} ${error.requestOptions.path}');
        debugPrint('[API ERROR] ${error.response?.data}');
        if (error.response?.statusCode == 401) {
          await _storage.clearAll();
        }
        return handler.next(error);
      },
    ));

    debugPrint('[API] Base URL: ${ApiConfig.baseUrl}');
  }

  Future<Response> get(String path, {Map<String, dynamic>? queryParams}) async {
    return _dio.get(path, queryParameters: queryParams);
  }

  Future<Response> post(String path, {dynamic data, Map<String, dynamic>? queryParams}) async {
    return _dio.post(path, data: data, queryParameters: queryParams);
  }

  Future<Response> put(String path, {dynamic data}) async {
    return _dio.put(path, data: data);
  }

  Future<Response> patch(String path, {dynamic data}) async {
    return _dio.patch(path, data: data);
  }

  Future<Response> delete(String path) async {
    return _dio.delete(path);
  }

  /// Extract a user-friendly error message from a DioException
  static String extractError(dynamic e) {
    if (e is DioException) {
      // Try to get the server's error message
      final data = e.response?.data;
      if (data is Map) {
        final msg = data['message'] ?? data['error'] ?? data['msg'];
        if (msg != null) return msg.toString();
      }
      if (data is String && data.isNotEmpty) return data;

      // Fallback to status-based messages
      switch (e.response?.statusCode) {
        case 400:
          return 'Invalid request. Please check your input.';
        case 401:
          return 'Invalid credentials.';
        case 403:
          return 'Access denied.';
        case 404:
          return 'Not found.';
        case 409:
          return 'Account already exists.';
        case 422:
          return 'Validation error. Please check your input.';
        case 500:
          return 'Server error. Please try again later.';
      }

      // Connection errors
      if (e.type == DioExceptionType.connectionTimeout ||
          e.type == DioExceptionType.receiveTimeout) {
        return 'Connection timeout. Is the server running?';
      }
      if (e.type == DioExceptionType.connectionError) {
        return 'Cannot connect to server. Check your network and ensure the backend is running.';
      }

      return 'Network error: ${e.message}';
    }
    return e.toString();
  }
}
