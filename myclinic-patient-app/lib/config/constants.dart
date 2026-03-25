class AppConstants {
  static const String appName = 'MyClinic';
  static const String tagline = 'Your Health, Our Priority';
  static const String supportEmail = 'support@myclinic.lk';
  static const String supportPhone = '+94 11 234 5678';
  static const String termsUrl = 'https://myclinic.lk/terms';
  static const String privacyUrl = 'https://myclinic.lk/privacy';
  static const String appVersion = '1.0.0';

  static const int otpLength = 6;
  static const int otpResendSeconds = 60;
  static const int paginationLimit = 10;
  static const int maxNameLength = 25;
  static const int searchDebounceMs = 300;

  static const Duration animFast = Duration(milliseconds: 200);
  static const Duration animNormal = Duration(milliseconds: 400);
  static const Duration animSlow = Duration(milliseconds: 600);
  static const Duration splashDuration = Duration(milliseconds: 2500);

  static const List<String> daysOfWeek = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday',
    'Thursday', 'Friday', 'Saturday',
  ];
}

enum BookingStatus {
  scheduled,
  checkedIn,
  completed,
  cancelled,
  noShow;

  String get value {
    switch (this) {
      case BookingStatus.scheduled:
        return 'scheduled';
      case BookingStatus.checkedIn:
        return 'checked_in';
      case BookingStatus.completed:
        return 'completed';
      case BookingStatus.cancelled:
        return 'cancelled';
      case BookingStatus.noShow:
        return 'no_show';
    }
  }

  static BookingStatus fromString(String s) {
    switch (s) {
      case 'scheduled':
        return BookingStatus.scheduled;
      case 'checked_in':
        return BookingStatus.checkedIn;
      case 'completed':
        return BookingStatus.completed;
      case 'cancelled':
        return BookingStatus.cancelled;
      case 'no_show':
        return BookingStatus.noShow;
      default:
        return BookingStatus.scheduled;
    }
  }
}
