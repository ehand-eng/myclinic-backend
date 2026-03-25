import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:myclinic_patient_app/config/api_config.dart';
import 'package:myclinic_patient_app/services/api_service.dart';

final paymentServiceProvider = Provider<PaymentService>((ref) {
  return PaymentService(ref.watch(apiServiceProvider));
});

class PaymentService {
  final ApiService _api;

  PaymentService(this._api);

  Future<String> createPaymentIntent(String bookingId) async {
    final res = await _api.post(ApiConfig.createPaymentIntent(bookingId));
    return res.data['paymentUrl'] ?? res.data['redirectUrl'] ?? '';
  }
}
