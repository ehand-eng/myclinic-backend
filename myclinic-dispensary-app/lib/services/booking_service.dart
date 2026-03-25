import '../config/api_config.dart';
import '../models/booking.dart';
import 'api_service.dart';

class BookingService {
  final _api = ApiService();

  Future<List<Booking>> getBookingsByDate(String date,
      {String? dispensaryId, String? doctorId}) async {
    final params = <String, dynamic>{'date': date};
    if (dispensaryId != null) params['dispensaryId'] = dispensaryId;
    if (doctorId != null) params['doctorId'] = doctorId;

    final response =
        await _api.get(ApiConfig.bookingsByDate, queryParameters: params);
    final data = response.data is List
        ? response.data
        : response.data['bookings'] ?? [];
    return (data as List).map((e) => Booking.fromJson(e)).toList();
  }

  Future<List<Booking>> getBookingsByDoctorDispensaryDate(
      String doctorId, String dispensaryId, String date) async {
    final response = await _api.get(
        ApiConfig.bookingsByDoctorDispensaryDate(
            doctorId, dispensaryId, date));
    final data = response.data is List
        ? response.data
        : response.data['bookings'] ?? [];
    return (data as List).map((e) => Booking.fromJson(e)).toList();
  }

  Future<Booking> getBookingById(String id) async {
    final response = await _api.get(ApiConfig.bookingById(id));
    final data = response.data is Map && response.data.containsKey('booking')
        ? response.data['booking']
        : response.data;
    return Booking.fromJson(data);
  }

  Future<List<Booking>> searchBookings(String query) async {
    final response = await _api
        .get(ApiConfig.searchBookings, queryParameters: {'q': query});
    final data = response.data is List
        ? response.data
        : response.data['bookings'] ?? [];
    return (data as List).map((e) => Booking.fromJson(e)).toList();
  }

  Future<void> updateBookingStatus(String id, String status) async {
    await _api.patch(ApiConfig.updateBookingStatus(id), data: {
      'status': status,
    });
  }

  Future<void> cancelBooking(String id, String reason) async {
    await _api.patch(ApiConfig.cancelBooking(id), data: {
      'reason': reason,
    });
  }

  // Dispensary check-in endpoints
  Future<List<Booking>> searchCheckIn({
    required String dispensaryId,
    String? date,
    String? search,
  }) async {
    final params = <String, dynamic>{'dispensaryId': dispensaryId};
    if (date != null) params['date'] = date;
    if (search != null) params['search'] = search;

    final response =
        await _api.get(ApiConfig.checkInSearch, queryParameters: params);
    final data = response.data is List
        ? response.data
        : response.data['bookings'] ?? [];
    return (data as List).map((e) => Booking.fromJson(e)).toList();
  }

  Future<List<Booking>> getSessionBookings({
    required String dispensaryId,
    required String date,
    String? doctorId,
    String? sessionId,
  }) async {
    final params = <String, dynamic>{
      'dispensaryId': dispensaryId,
      'date': date,
    };
    if (doctorId != null) params['doctorId'] = doctorId;
    if (sessionId != null) params['sessionId'] = sessionId;

    final response =
        await _api.get(ApiConfig.checkInSession, queryParameters: params);
    final data = response.data is List
        ? response.data
        : response.data['bookings'] ?? [];
    return (data as List).map((e) => Booking.fromJson(e)).toList();
  }

  Future<void> checkInBooking(String id) async {
    await _api.patch(ApiConfig.checkInBooking(id));
  }

  /// Check-out reverts a checked-in booking back to scheduled (undo check-in)
  Future<void> checkOutBooking(String id) async {
    await _api.patch(ApiConfig.checkOutBooking(id));
  }
}
