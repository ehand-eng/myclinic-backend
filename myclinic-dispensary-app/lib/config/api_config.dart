class ApiConfig {
  // Use 10.0.2.2 for Android emulator (maps to host machine's localhost)
  // Use localhost for iOS simulator
  // Use your machine's IP for physical devices
  static const String baseUrl = 'http://192.168.1.141:5001/api';

  // Auth
  static const String loginAdmin = '/custom-auth/login-admin';
  static const String getMe = '/custom-auth/me';
  static const String updateMe = '/custom-auth/me';
  static const String changePassword = '/custom-auth/change-password';

  // Dashboard
  static const String dashboardStats = '/dashboard/stats';

  // Dispensaries
  static const String dispensaries = '/dispensaries';
  static String dispensaryById(String id) => '/dispensaries/$id';
  static String dispensaryByDoctor(String doctorId) =>
      '/dispensaries/doctor/$doctorId';
  static const String dispensariesByIds = '/dispensaries/by-ids';

  // Doctors
  static const String doctors = '/doctors';
  static String doctorById(String id) => '/doctors/$id';
  static String doctorsByDispensary(String dispensaryId) =>
      '/doctors/dispensary/$dispensaryId';
  static const String doctorsByDispensaries = '/doctors/by-dispensaries';
  static String disableDoctor(String id) => '/doctors/$id/disable';
  static String enableDoctor(String id) => '/doctors/$id/enable';
  static String replacements(String doctorId, String dispensaryId) =>
      '/doctors/$doctorId/dispensary/$dispensaryId/replacements';
  static String replacement(String doctorId, String dispensaryId) =>
      '/doctors/$doctorId/dispensary/$dispensaryId/replacement';
  static String deleteReplacement(String id) => '/doctors/replacement/$id';

  // Time Slots
  static String timeSlotConfig(String doctorId, String dispensaryId) =>
      '/timeslots/config/doctor/$doctorId/dispensary/$dispensaryId';
  static String timeSlotConfigByDispensary(String dispensaryId) =>
      '/timeslots/config/dispensary/$dispensaryId';
  static const String createTimeSlotConfig = '/timeslots/config';
  static String updateTimeSlotConfig(String id) => '/timeslots/config/$id';
  static String deleteTimeSlotConfig(String id) => '/timeslots/config/$id';
  static String sessions(String doctorId, String dispensaryId, String date) =>
      '/timeslots/sessions/$doctorId/$dispensaryId/$date';
  static String sessionsByDispensary(String dispensaryId, String date) =>
      '/timeslots/sessions-by-dispensary/$dispensaryId/$date';

  // Absent Time Slots
  static String absentSlots(String doctorId, String dispensaryId) =>
      '/timeslots/absent/doctor/$doctorId/dispensary/$dispensaryId';
  static const String createAbsentSlot = '/timeslots/absent';
  static String deleteAbsentSlot(String id) => '/timeslots/absent/$id';
  static const String absentDateRange = '/timeslots/absent/date-range';
  static const String checkAbsentConflicts =
      '/timeslots/absent/date-range/check-conflicts';

  // Bookings
  static const String bookings = '/bookings';
  static String bookingById(String id) => '/bookings/$id';
  static const String searchBookings = '/bookings/search';
  static const String bookingsByDate = '/bookings/by-date';
  static String bookingsByDoctorDispensaryDate(
          String doctorId, String dispensaryId, String date) =>
      '/bookings/doctor/$doctorId/dispensary/$dispensaryId/date/$date';
  static String updateBookingStatus(String id) => '/bookings/$id/status';
  static String cancelBooking(String id) => '/bookings/$id/cancel';

  // Dispensary Check-In
  static const String checkInSearch = '/dispensary/bookings/search';
  static const String checkInSession = '/dispensary/bookings/session';
  static String checkInBooking(String id) =>
      '/dispensary/bookings/$id/check-in';
  static String checkOutBooking(String id) =>
      '/dispensary/bookings/$id/check-out';

  // Reports
  static const String comprehensiveReport = '/reports/comprehensive';
  static const String dailyBookings = '/reports/daily-bookings';
  static const String monthlySummary = '/reports/monthly-summary';
  static const String doctorPerformance = '/reports/doctor-performance';
  static const String advanceBookings = '/reports/advance-bookings';
  static String sessionReport(
          String doctorId, String dispensaryId, String date) =>
      '/reports/session/$doctorId/$dispensaryId/$date';

  // Fees (read-only for dispensary admin)
  static String feesByDispensary(String dispensaryId) =>
      '/doctor-dispensaries/fees/$dispensaryId';
  static String feesByDoctorDispensary(
          String doctorId, String dispensaryId) =>
      '/doctor-dispensaries/fees/$doctorId/$dispensaryId';
}
