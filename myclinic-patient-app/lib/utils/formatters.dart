import 'package:intl/intl.dart';

class Formatters {
  static String formatDate(String? isoDate) {
    if (isoDate == null || isoDate.isEmpty) return '';
    try {
      final date = DateTime.parse(isoDate);
      return DateFormat('EEE, MMM d yyyy').format(date);
    } catch (_) {
      return isoDate;
    }
  }

  static String formatDateShort(String? isoDate) {
    if (isoDate == null || isoDate.isEmpty) return '';
    try {
      final date = DateTime.parse(isoDate);
      return DateFormat('MMM d, yyyy').format(date);
    } catch (_) {
      return isoDate;
    }
  }

  static String formatDateFromDateTime(DateTime date) {
    return DateFormat('yyyy-MM-dd').format(date);
  }

  static String formatDisplayDate(DateTime date) {
    return DateFormat('EEE, MMM d yyyy').format(date);
  }

  static String formatTime(String? time) {
    if (time == null || time.isEmpty) return '';
    try {
      // Handle "HH:mm" format
      final parts = time.split(':');
      final hour = int.parse(parts[0]);
      final minute = int.parse(parts[1]);
      final dt = DateTime(2024, 1, 1, hour, minute);
      return DateFormat('hh:mm a').format(dt);
    } catch (_) {
      return time;
    }
  }

  static String formatCurrency(double amount) {
    return 'Rs. ${NumberFormat('#,##0.00').format(amount)}';
  }

  static String formatPhone(String? phone) {
    if (phone == null || phone.isEmpty) return '';
    return phone;
  }

  static String statusLabel(String status) {
    switch (status) {
      case 'scheduled':
        return 'Scheduled';
      case 'checked_in':
        return 'Checked In';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'no_show':
        return 'No Show';
      default:
        return status;
    }
  }

  static String relativeTime(String? isoDate) {
    if (isoDate == null || isoDate.isEmpty) return '';
    try {
      final date = DateTime.parse(isoDate);
      final now = DateTime.now();
      final diff = now.difference(date);

      if (diff.inMinutes < 1) return 'Just now';
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      if (diff.inDays < 7) return '${diff.inDays}d ago';
      return formatDateShort(isoDate);
    } catch (_) {
      return isoDate;
    }
  }

  static String greeting() {
    final hour = DateTime.now().hour;
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }
}
