import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:myclinic_patient_app/app.dart';
import 'package:myclinic_patient_app/config/api_config.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Set system UI overlay style
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
    statusBarBrightness: Brightness.light,
  ));

  // Lock orientation to portrait
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Startup connectivity test
  debugPrint('======================================');
  debugPrint('[STARTUP] API Base URL: ${ApiConfig.baseUrl}');
  debugPrint('[STARTUP] Testing connection...');
  try {
    final dio = Dio(BaseOptions(
      connectTimeout: const Duration(seconds: 5),
      receiveTimeout: const Duration(seconds: 5),
    ));
    final response = await dio.get('${ApiConfig.baseUrl}/api/doctors');
    debugPrint('[STARTUP] Connection SUCCESS! Status: ${response.statusCode}');
    debugPrint('[STARTUP] Got ${(response.data is List) ? response.data.length : 0} doctors');
  } catch (e) {
    debugPrint('[STARTUP] Connection FAILED: $e');
  }
  debugPrint('======================================');

  runApp(const ProviderScope(child: MyClinicApp()));
}

