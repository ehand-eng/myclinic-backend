import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';

class ApiConfig {
  static String get baseUrl {
    const envUrl = String.fromEnvironment('API_BASE_URL');
    if (envUrl.isNotEmpty) {
      debugPrint('[ApiConfig] Using env URL: $envUrl');
      return envUrl;
    }

    // Android emulator can't reach host via localhost — use 10.0.2.2
    // iOS simulator can use localhost
    // For real devices, set API_BASE_URL via --dart-define
    String url;
    try {
      if (Platform.isAndroid) {
        url = 'http://10.0.2.2:5001';
      } else {
        url = 'http://localhost:5001';
      }
    } catch (_) {
      url = 'http://localhost:5001';
    }
    debugPrint('[ApiConfig] Platform: ${Platform.operatingSystem}, Base URL: $url');
    return url;
  }

  // Auth
  static const String sendOtp = '/api/mobile/auth/send-otp';
  static const String verifyOtp = '/api/mobile/auth/verify-otp';
  static const String signupMobile = '/api/mobile/auth/signup-mobile';
  static const String sendLoginOtp = '/api/mobile/auth/send-login-otp';
  static const String loginMobile = '/api/mobile/auth/login-mobile';
  static const String loginEmail = '/api/mobile/auth/login-email';
  static const String customLogin = '/api/custom-auth/login';
  static const String customSignup = '/api/custom-auth/register';
  static const String currentUser = '/api/custom-auth/me';

  // Doctors
  static const String doctors = '/api/doctors';
  static String doctorById(String id) => '/api/doctors/$id';

  // Replacement Doctor
  static String activeReplacement(String doctorId, String dispensaryId) =>
      '/api/doctors/$doctorId/dispensary/$dispensaryId/replacement';

  // Dispensaries
  static const String dispensaries = '/api/dispensaries';
  static String dispensaryById(String id) => '/api/dispensaries/$id';
  static const String dispensariesByIds = '/api/dispensaries/by-ids';

  // Time Slots
  static String timeSlotConfig(String doctorId, String dispensaryId) =>
      '/api/timeslots/config/doctor/$doctorId/dispensary/$dispensaryId';
  static String sessions(String doctorId, String dispensaryId, String date) =>
      '/api/timeslots/sessions/$doctorId/$dispensaryId/$date';
  static String availableSlots(String doctorId, String dispensaryId, String date) =>
      '/api/timeslots/available/$doctorId/$dispensaryId/$date';
  static String nextAvailable(String doctorId, String dispensaryId) =>
      '/api/timeslots/next-available/$doctorId/$dispensaryId';
  static String disabledDates(String doctorId, String dispensaryId) =>
      '/api/timeslots/absent/disabled-dates/$doctorId/$dispensaryId';

  // Bookings
  static const String bookings = '/api/bookings';
  static const String myBookings = '/api/bookings/my';
  static String bookingById(String id) => '/api/bookings/$id';
  static String bookingAvailableSlots(String doctorId, String dispensaryId, String date) =>
      '/api/bookings/available-slots/$doctorId/$dispensaryId/$date';
  static String cancelBooking(String id) => '/api/bookings/$id/cancel';
  static String amendBooking(String id) => '/api/bookings/$id/user-amend';
  static String bookingSummary(String transactionId) =>
      '/api/bookings/summary/$transactionId';
  static const String searchBookings = '/api/bookings/search';

  // Fees
  static String fees(String doctorId, String dispensaryId) =>
      '/api/doctor-dispensaries/fees/$doctorId/$dispensaryId';

  // Payments
  static String createPaymentIntent(String bookingId) =>
      '/api/payments/dialog-genie/create-intent/$bookingId';

  // Location
  static const String doctorsNearby = '/api/location/doctors-nearby';
  static const String dispensariesNearby = '/api/location/dispensaries-nearby';

  // FCM
  static const String fcmToken = '/api/fcm-token';

  // Users
  static String userById(String id) => '/api/users/$id';

  // Dashboard
  static const String dashboardStats = '/api/dashboard/stats';
}
