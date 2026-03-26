import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../config/theme.dart';
import '../../services/booking_service.dart';

class QrScanScreen extends StatefulWidget {
  const QrScanScreen({super.key});

  @override
  State<QrScanScreen> createState() => _QrScanScreenState();
}

class _QrScanScreenState extends State<QrScanScreen> {
  final MobileScannerController _controller = MobileScannerController();
  bool _scanned = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) {
    if (_scanned) return;
    final barcode = capture.barcodes.firstOrNull;
    if (barcode?.rawValue == null) return;

    try {
      final data = jsonDecode(barcode!.rawValue!) as Map<String, dynamic>;
      if (data['bookingId'] == null || data['transactionId'] == null) {
        _showError('Invalid QR code — not a booking');
        return;
      }
      setState(() => _scanned = true);
      _controller.stop();
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => _ScannedBookingScreen(qrData: data),
        ),
      );
    } catch (_) {
      _showError('Invalid QR code format');
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: AppColors.error),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Scan QR Code')),
      body: Stack(
        children: [
          MobileScanner(
            controller: _controller,
            onDetect: _onDetect,
          ),
          // Overlay guide
          Center(
            child: Container(
              width: 250,
              height: 250,
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.primary, width: 3),
                borderRadius: BorderRadius.circular(16),
              ),
            ),
          ),
          // Bottom hint
          Positioned(
            bottom: 60,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                decoration: BoxDecoration(
                  color: Colors.black54,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'Point camera at patient\'s booking QR code',
                  style: TextStyle(color: Colors.white, fontSize: 13),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Scanned Booking Details + Check-In ──────────────────────────

class _ScannedBookingScreen extends StatefulWidget {
  final Map<String, dynamic> qrData;
  const _ScannedBookingScreen({required this.qrData});

  @override
  State<_ScannedBookingScreen> createState() => _ScannedBookingScreenState();
}

class _ScannedBookingScreenState extends State<_ScannedBookingScreen> {
  bool _loading = false;
  bool _checkedIn = false;
  DateTime? _checkedInTime;
  String? _error;

  Map<String, dynamic> get qr => widget.qrData;
  String get bookingId => qr['bookingId']?.toString() ?? '';

  // Check-in
  Future<void> _doCheckIn() async {
    setState(() { _loading = true; _error = null; });
    try {
      // Import here to avoid circular — using the service directly
      final service = _getBookingService();
      await service.checkInBooking(bookingId);
      setState(() {
        _checkedIn = true;
        _checkedInTime = DateTime.now();
        _loading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Patient checked in'), backgroundColor: AppColors.success),
        );
      }
    } catch (e) {
      setState(() { _loading = false; _error = e.toString(); });
    }
  }

  // Check-out (undo)
  Future<void> _doCheckOut() async {
    setState(() { _loading = true; _error = null; });
    try {
      final service = _getBookingService();
      await service.checkOutBooking(bookingId);
      setState(() {
        _checkedIn = false;
        _checkedInTime = null;
        _loading = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Check-in reverted'), backgroundColor: AppColors.success),
        );
      }
    } catch (e) {
      setState(() { _loading = false; _error = e.toString(); });
    }
  }

  // 5-minute remaining
  int get _checkoutRemaining {
    if (_checkedInTime == null) return 0;
    final expiresAt = _checkedInTime!.add(const Duration(minutes: 5));
    final diff = expiresAt.difference(DateTime.now()).inSeconds;
    return diff > 0 ? diff : 0;
  }

  String _formatCountdown(int seconds) {
    final m = seconds ~/ 60;
    final s = seconds % 60;
    return '$m:${s.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Scanned Booking')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Status icon
            Icon(
              _checkedIn ? Icons.check_circle : Icons.qr_code_scanner,
              size: 56,
              color: _checkedIn ? AppColors.success : AppColors.primary,
            ),
            const SizedBox(height: 12),
            Text(
              _checkedIn ? 'Checked In' : 'Booking Found',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: _checkedIn ? AppColors.success : AppColors.text,
              ),
            ),
            const SizedBox(height: 20),

            // Booking details card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    _InfoRow(Icons.receipt_long, 'Transaction', '#${qr['transactionId']}'),
                    _InfoRow(Icons.tag, 'Appointment #', '${qr['aptNo']}'),
                    _InfoRow(Icons.phone, 'Phone', '${qr['phone']}'),
                    _InfoRow(Icons.medical_services, 'Doctor', '${qr['doctor']}'),
                    _InfoRow(Icons.local_hospital, 'Dispensary', '${qr['dispensary']}'),
                    _InfoRow(Icons.calendar_today, 'Date', '${qr['date']}'),
                    _InfoRow(Icons.access_time, 'Time Slot', '${qr['time']}'),
                    _InfoRow(Icons.timer, 'Est. Time', '${qr['estTime']}'),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 20),

            // Error message
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Text(_error!, style: const TextStyle(color: AppColors.error, fontSize: 13)),
              ),

            // Check-in button
            if (!_checkedIn)
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton.icon(
                  onPressed: _loading ? null : _doCheckIn,
                  icon: _loading
                      ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                      : const Icon(Icons.login),
                  label: Text(_loading ? 'Checking in...' : 'Check In Patient'),
                ),
              ),

            // After check-in: undo with 5-min timer
            if (_checkedIn) ...[
              _CheckoutTimer(
                checkedInTime: _checkedInTime!,
                onCheckout: _doCheckOut,
                isLoading: _loading,
              ),
            ],

            const SizedBox(height: 16),

            // Scan another link
            TextButton.icon(
              onPressed: () {
                Navigator.pushReplacement(
                  context,
                  MaterialPageRoute(builder: (_) => const QrScanScreen()),
                );
              },
              icon: const Icon(Icons.qr_code_scanner),
              label: const Text('Scan Another QR'),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Checkout Timer Widget (auto-refreshes every second) ──────────

class _CheckoutTimer extends StatefulWidget {
  final DateTime checkedInTime;
  final VoidCallback onCheckout;
  final bool isLoading;
  const _CheckoutTimer({required this.checkedInTime, required this.onCheckout, required this.isLoading});

  @override
  State<_CheckoutTimer> createState() => _CheckoutTimerState();
}

class _CheckoutTimerState extends State<_CheckoutTimer> {
  late final _stream = Stream.periodic(const Duration(seconds: 1));

  int get _remaining {
    final expiresAt = widget.checkedInTime.add(const Duration(minutes: 5));
    final diff = expiresAt.difference(DateTime.now()).inSeconds;
    return diff > 0 ? diff : 0;
  }

  String _format(int seconds) {
    final m = seconds ~/ 60;
    final s = seconds % 60;
    return '$m:${s.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return StreamBuilder(
      stream: _stream,
      builder: (context, _) {
        final remaining = _remaining;
        return Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  remaining > 0 ? Icons.timer : Icons.timer_off,
                  size: 16,
                  color: remaining > 0 ? AppColors.info : AppColors.error,
                ),
                const SizedBox(width: 4),
                Text(
                  remaining > 0 ? '${_format(remaining)} left to undo' : 'Undo window expired',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: remaining > 0 ? AppColors.info : AppColors.error,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              height: 46,
              child: ElevatedButton.icon(
                onPressed: remaining > 0 && !widget.isLoading ? widget.onCheckout : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.warning,
                  foregroundColor: AppColors.textWhite,
                ),
                icon: widget.isLoading
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.logout, size: 18),
                label: const Text('Undo Check-In'),
              ),
            ),
          ],
        );
      },
    );
  }
}

// ─── Info Row ──────────

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _InfoRow(this.icon, this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        children: [
          Icon(icon, size: 18, color: AppColors.primary),
          const SizedBox(width: 10),
          SizedBox(width: 100, child: Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13))),
          Expanded(child: Text(value, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 13), overflow: TextOverflow.ellipsis, maxLines: 2)),
        ],
      ),
    );
  }
}

BookingService _getBookingService() => BookingService();
