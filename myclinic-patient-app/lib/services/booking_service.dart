import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:myclinic_patient_app/config/api_config.dart';
import 'package:myclinic_patient_app/models/booking.dart';
import 'package:myclinic_patient_app/services/api_service.dart';

final bookingServiceProvider = Provider<BookingService>((ref) {
  return BookingService(ref.watch(apiServiceProvider));
});

class BookingService {
  final ApiService _api;

  BookingService(this._api);

  Future<Booking> createBooking(Map<String, dynamic> data) async {
    final res = await _api.post(ApiConfig.bookings, data: data);
    return Booking.fromJson(res.data['booking'] ?? res.data);
  }

  Future<List<Booking>> getMyBookings({String? status, int? page, int? limit}) async {
    final params = <String, dynamic>{};
    if (status != null && status != 'all') params['status'] = status;
    if (page != null) params['page'] = page;
    if (limit != null) params['limit'] = limit;
    final res = await _api.get(ApiConfig.myBookings, queryParams: params);
    final list = res.data is List ? res.data : res.data['bookings'] ?? [];
    return (list as List).map((b) => Booking.fromJson(b)).toList();
  }

  Future<Booking> getBookingById(String id) async {
    final res = await _api.get(ApiConfig.bookingById(id));
    return Booking.fromJson(res.data['booking'] ?? res.data);
  }

  Future<Map<String, dynamic>> getBookingSummary(String transactionId) async {
    final res = await _api.get(ApiConfig.bookingSummary(transactionId));
    return res.data;
  }

  Future<Booking> cancelBooking(String id, String reason) async {
    final res = await _api.patch(ApiConfig.cancelBooking(id), data: {'reason': reason});
    return Booking.fromJson(res.data['booking'] ?? res.data);
  }

  Future<Booking> amendBooking(String id, Map<String, dynamic> data) async {
    final res = await _api.patch(ApiConfig.amendBooking(id), data: data);
    return Booking.fromJson(res.data['booking'] ?? res.data);
  }

  Future<List<Booking>> searchBookings(Map<String, String> params) async {
    final res = await _api.get(ApiConfig.searchBookings, queryParams: params);
    final list = res.data is List ? res.data : res.data['bookings'] ?? [];
    return (list as List).map((b) => Booking.fromJson(b)).toList();
  }

  Future<void> updateBookingPayment(String id, String method) async {
    await _api.patch('${ApiConfig.bookingById(id)}/status', data: {
      'paymentMethod': method,
      'paymentStatus': 'pending',
    });
  }

  Future<Map<String, dynamic>> getAvailableSlots(
      String doctorId, String dispensaryId, String date, {String? excludeBookingId}) async {
    final queryParams = <String, dynamic>{};
    if (excludeBookingId != null) queryParams['excludeBookingId'] = excludeBookingId;
    final res = await _api.get(
      ApiConfig.bookingAvailableSlots(doctorId, dispensaryId, date),
      queryParams: queryParams.isNotEmpty ? queryParams : null,
    );
    return res.data;
  }
}
