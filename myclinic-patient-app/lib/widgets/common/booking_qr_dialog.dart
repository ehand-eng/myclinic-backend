import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:myclinic_patient_app/config/theme.dart';

/// Shows a QR code dialog for a booking.
/// Pass key booking fields as a Map.
void showBookingQrDialog(BuildContext context, Map<String, dynamic> qrData) {
  final jsonString = jsonEncode(qrData);

  showDialog(
    context: context,
    builder: (ctx) => Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.qr_code_2_rounded, size: 32, color: AppTheme.primary),
            const SizedBox(height: 8),
            const Text(
              'Booking QR Code',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppTheme.text),
            ),
            const SizedBox(height: 4),
            Text(
              '#${qrData['transactionId'] ?? ''}',
              style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
            ),
            const SizedBox(height: 20),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.border),
              ),
              child: QrImageView(
                data: jsonString,
                version: QrVersions.auto,
                size: 220,
                eyeStyle: const QrEyeStyle(
                  eyeShape: QrEyeShape.square,
                  color: AppTheme.text,
                ),
                dataModuleStyle: const QrDataModuleStyle(
                  dataModuleShape: QrDataModuleShape.square,
                  color: AppTheme.text,
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Scan this code at the dispensary',
              style: TextStyle(fontSize: 12, color: AppTheme.textSecondary),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('Close'),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}

/// Helper to build QR data map from raw booking JSON (confirmation screen)
Map<String, dynamic> buildQrDataFromMap(Map<dynamic, dynamic> booking) {
  final doctor = booking['doctorId'] is Map
      ? booking['doctorId']
      : (booking['doctor'] is Map ? booking['doctor'] : {});
  final dispensary = booking['dispensaryId'] is Map
      ? booking['dispensaryId']
      : (booking['dispensary'] is Map ? booking['dispensary'] : {});

  return {
    'bookingId': booking['_id'] ?? booking['id'] ?? '',
    'transactionId': booking['transactionId'] ?? '',
    'phone': booking['patientPhone'] ?? '',
    'doctor': doctor['name'] ?? '',
    'dispensary': dispensary['name'] ?? '',
    'date': (booking['bookingDate'] ?? '').toString().split('T')[0],
    'time': booking['timeSlot'] ?? '',
    'aptNo': booking['appointmentNumber'] ?? '',
    'estTime': booking['estimatedTime'] ?? '',
  };
}
