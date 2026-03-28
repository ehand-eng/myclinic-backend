import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../config/theme.dart';
import '../../models/booking.dart';
import '../../services/booking_service.dart';
import '../../widgets/status_badge.dart';

class QrScanScreen extends StatefulWidget {
  const QrScanScreen({super.key});

  @override
  State<QrScanScreen> createState() => _QrScanScreenState();
}

class _QrScanScreenState extends State<QrScanScreen> {
  MobileScannerController? _controller;
  bool _scanned = false;
  bool _cooldown = false;
  String? _errorMsg;

  // Scanned booking state
  Map<String, dynamic>? _qrData;
  Booking? _booking;
  bool _fetchingBooking = false;
  bool _loading = false;
  String? _actionError;

  @override
  void initState() {
    super.initState();
    _initCamera();
  }

  Future<void> _initCamera() async {
    _controller = MobileScannerController();
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  String get _bookingId => _qrData?['bookingId']?.toString() ?? '';

  bool get _isToday {
    if (_booking?.bookingDate == null) return false;
    final todayStr = DateFormat('yyyy-MM-dd').format(DateTime.now());
    final bookingStr =
        DateFormat('yyyy-MM-dd').format(_booking!.bookingDate!.toLocal());
    return todayStr == bookingStr;
  }

  bool get _isFuture {
    if (_booking?.bookingDate == null) return false;
    final todayStr = DateFormat('yyyy-MM-dd').format(DateTime.now());
    final bookingStr =
        DateFormat('yyyy-MM-dd').format(_booking!.bookingDate!.toLocal());
    return bookingStr.compareTo(todayStr) > 0;
  }

  void _onDetect(BarcodeCapture capture) {
    if (_scanned || _cooldown) return;
    final barcode = capture.barcodes.firstOrNull;
    if (barcode?.rawValue == null) return;

    final rawValue = barcode!.rawValue!;

    Map<String, dynamic> data;
    try {
      data = jsonDecode(rawValue) as Map<String, dynamic>;
    } catch (_) {
      _showErrorWithCooldown('Invalid QR code format');
      return;
    }

    if (data['bookingId'] == null || data['transactionId'] == null) {
      _showErrorWithCooldown('Invalid QR code — not a booking');
      return;
    }

    setState(() {
      _scanned = true;
      _qrData = data;
      _booking = null;
      _actionError = null;
    });
    _controller?.stop();
    _fetchBooking();
  }

  Future<void> _fetchBooking() async {
    setState(() => _fetchingBooking = true);
    try {
      final booking = await BookingService().getBookingById(_bookingId);
      if (mounted) setState(() => _booking = booking);
    } catch (e) {
      if (mounted) {
        setState(() => _actionError = 'Failed to load booking: $e');
      }
    } finally {
      if (mounted) setState(() => _fetchingBooking = false);
    }
  }

  void _showErrorWithCooldown(String msg) {
    if (_cooldown) return;
    setState(() {
      _cooldown = true;
      _errorMsg = msg;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: AppColors.error),
    );
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) {
        setState(() {
          _cooldown = false;
          _errorMsg = null;
        });
      }
    });
  }

  void _scanAnother() {
    setState(() {
      _scanned = false;
      _qrData = null;
      _booking = null;
      _actionError = null;
    });
    _controller?.start();
  }

  Future<void> _doCheckIn() async {
    setState(() {
      _loading = true;
      _actionError = null;
    });
    try {
      await BookingService().checkInBooking(_bookingId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Patient checked in'),
              backgroundColor: AppColors.success),
        );
      }
      // Re-fetch to get updated status and checkedInTime from server
      await _fetchBooking();
    } catch (e) {
      setState(() => _actionError = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _doCheckOut() async {
    setState(() {
      _loading = true;
      _actionError = null;
    });
    try {
      await BookingService().checkOutBooking(_bookingId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Check-in reverted'),
              backgroundColor: AppColors.success),
        );
      }
      // Re-fetch to get updated status from server
      await _fetchBooking();
    } catch (e) {
      setState(() => _actionError = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_qrData != null ? 'Scanned Booking' : 'Scan QR Code'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            if (_qrData != null) {
              _scanAnother();
            } else {
              context.pop();
            }
          },
        ),
      ),
      body: _qrData != null ? _buildBookingView() : _buildScannerView(),
    );
  }

  Widget _buildScannerView() {
    if (_controller == null) {
      return const Center(child: CircularProgressIndicator());
    }
    return Stack(
      children: [
        MobileScanner(
          controller: _controller!,
          onDetect: _onDetect,
        ),
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
        if (_errorMsg != null)
          Positioned(
            top: 20,
            left: 20,
            right: 20,
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.error.withAlpha(220),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Row(
                children: [
                  const Icon(Icons.warning, color: Colors.white, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      '$_errorMsg\nTry pointing at a valid booking QR code.',
                      style:
                          const TextStyle(color: Colors.white, fontSize: 13),
                    ),
                  ),
                ],
              ),
            ),
          ),
        Positioned(
          bottom: 60,
          left: 0,
          right: 0,
          child: Center(
            child: Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
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
    );
  }

  Widget _buildBookingView() {
    final qr = _qrData!;

    // Still fetching booking from server
    if (_fetchingBooking && _booking == null) {
      return const Center(child: CircularProgressIndicator());
    }

    // Failed to fetch and no booking data
    if (_booking == null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 56, color: AppColors.error),
              const SizedBox(height: 12),
              Text(
                _actionError ?? 'Could not load booking',
                style: const TextStyle(fontSize: 14, color: AppColors.error),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 20),
              ElevatedButton.icon(
                onPressed: _fetchBooking,
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
              ),
              const SizedBox(height: 12),
              TextButton.icon(
                onPressed: _scanAnother,
                icon: const Icon(Icons.qr_code_scanner),
                label: const Text('Scan Another QR'),
              ),
            ],
          ),
        ),
      );
    }

    final booking = _booking!;
    final status = booking.status;
    final isToday = _isToday;
    final isFuture = _isFuture;

    // Determine status icon and title
    IconData statusIcon;
    Color statusColor;
    String statusTitle;
    switch (status) {
      case 'checked_in':
        statusIcon = Icons.check_circle;
        statusColor = AppColors.success;
        statusTitle = 'Already Checked In';
        break;
      case 'completed':
        statusIcon = Icons.task_alt;
        statusColor = AppColors.info;
        statusTitle = 'Completed';
        break;
      case 'cancelled':
        statusIcon = Icons.cancel;
        statusColor = AppColors.error;
        statusTitle = 'Cancelled';
        break;
      case 'no_show':
        statusIcon = Icons.person_off;
        statusColor = AppColors.warning;
        statusTitle = 'No Show';
        break;
      default: // scheduled
        statusIcon = Icons.qr_code_scanner;
        statusColor = AppColors.primary;
        statusTitle = 'Booking Found';
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          Icon(statusIcon, size: 56, color: statusColor),
          const SizedBox(height: 12),
          Text(
            statusTitle,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              color: statusColor,
            ),
          ),
          const SizedBox(height: 4),
          StatusBadge(status: status),
          const SizedBox(height: 20),

          // Booking details card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  _InfoRow(Icons.person, 'Patient',
                      booking.patientName ?? qr['phone']?.toString() ?? ''),
                  _InfoRow(Icons.receipt_long, 'Transaction',
                      '#${booking.transactionId ?? qr['transactionId']}'),
                  _InfoRow(Icons.tag, 'Appointment #',
                      '${booking.appointmentNumber ?? qr['aptNo']}'),
                  _InfoRow(Icons.phone, 'Phone',
                      booking.patientPhone ?? qr['phone']?.toString() ?? ''),
                  _InfoRow(Icons.medical_services, 'Doctor',
                      booking.doctorName ?? qr['doctor']?.toString() ?? ''),
                  _InfoRow(
                      Icons.local_hospital,
                      'Dispensary',
                      booking.dispensaryName ??
                          qr['dispensary']?.toString() ??
                          ''),
                  _InfoRow(
                      Icons.calendar_today,
                      'Date',
                      booking.bookingDate != null
                          ? DateFormat('MMM dd, yyyy')
                              .format(booking.bookingDate!.toLocal())
                          : qr['date']?.toString() ?? ''),
                  _InfoRow(Icons.access_time, 'Time Slot',
                      booking.timeSlot ?? qr['time']?.toString() ?? ''),
                  _InfoRow(Icons.timer, 'Est. Time',
                      booking.estimatedTime ?? qr['estTime']?.toString() ?? ''),
                ],
              ),
            ),
          ),

          const SizedBox(height: 20),

          // Error message
          if (_actionError != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Text(_actionError!,
                  style:
                      const TextStyle(color: AppColors.error, fontSize: 13)),
            ),

          // === Check-in action (only for 'scheduled' status) ===
          if (status == 'scheduled') ...[
            if (!isToday)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Text(
                  'Cannot check in ${isFuture ? 'future' : 'past'} bookings',
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.warning,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton.icon(
                onPressed: isToday && !_loading ? _doCheckIn : null,
                icon: _loading
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white))
                    : const Icon(Icons.login),
                label:
                    Text(_loading ? 'Checking in...' : 'Check In Patient'),
              ),
            ),
          ],

          // === Check-out action (only for 'checked_in' status) ===
          if (status == 'checked_in') ...[
            if (!isToday)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Text(
                  'Cannot check out ${isFuture ? 'future' : 'past'} bookings',
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.warning,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ),
            if (isToday && booking.checkedInTime != null)
              _CheckoutTimer(
                checkedInTime: booking.checkedInTime!,
                onCheckout: _doCheckOut,
                isLoading: _loading,
              ),
            if (isToday && booking.checkedInTime == null)
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton.icon(
                  onPressed: null,
                  icon: const Icon(Icons.logout),
                  label: const Text('Check-Out'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.warning,
                    foregroundColor: AppColors.textWhite,
                  ),
                ),
              ),
          ],

          // === Info for terminal statuses ===
          if (status == 'completed')
            _statusMessage(
              Icons.task_alt,
              AppColors.info,
              'This booking has been completed.',
            ),
          if (status == 'cancelled')
            _statusMessage(
              Icons.cancel,
              AppColors.error,
              'This booking has been cancelled.',
            ),
          if (status == 'no_show')
            _statusMessage(
              Icons.person_off,
              AppColors.warning,
              'This patient was marked as no-show.',
            ),

          const SizedBox(height: 16),

          TextButton.icon(
            onPressed: _scanAnother,
            icon: const Icon(Icons.qr_code_scanner),
            label: const Text('Scan Another QR'),
          ),
        ],
      ),
    );
  }

  Widget _statusMessage(IconData icon, Color color, String message) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 18, color: color),
          const SizedBox(width: 6),
          Text(
            message,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Checkout Timer Widget ──────────

class _CheckoutTimer extends StatefulWidget {
  final DateTime checkedInTime;
  final VoidCallback onCheckout;
  final bool isLoading;
  const _CheckoutTimer(
      {required this.checkedInTime,
      required this.onCheckout,
      required this.isLoading});

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
                  remaining > 0
                      ? '${_format(remaining)} left to undo'
                      : 'Undo window expired',
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
                onPressed: remaining > 0 && !widget.isLoading
                    ? widget.onCheckout
                    : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.warning,
                  foregroundColor: AppColors.textWhite,
                ),
                icon: widget.isLoading
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                            strokeWidth: 2, color: Colors.white))
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
          SizedBox(
              width: 100,
              child: Text(label,
                  style: const TextStyle(
                      color: AppColors.textSecondary, fontSize: 13))),
          Expanded(
              child: Text(value,
                  style: const TextStyle(
                      fontWeight: FontWeight.w500, fontSize: 13),
                  overflow: TextOverflow.ellipsis,
                  maxLines: 2)),
        ],
      ),
    );
  }
}
