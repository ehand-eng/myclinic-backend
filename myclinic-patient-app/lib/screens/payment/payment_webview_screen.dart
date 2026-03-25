import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:myclinic_patient_app/config/theme.dart';
import 'package:myclinic_patient_app/l10n/translations.dart';
import 'package:myclinic_patient_app/utils/helpers.dart';

class PaymentWebViewScreen extends StatefulWidget {
  final String bookingId;
  final String paymentUrl;

  const PaymentWebViewScreen({super.key, required this.bookingId, required this.paymentUrl});

  @override
  State<PaymentWebViewScreen> createState() => _PaymentWebViewScreenState();
}

class _PaymentWebViewScreenState extends State<PaymentWebViewScreen> {
  late WebViewController _controller;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(NavigationDelegate(
        onPageStarted: (_) => setState(() => _isLoading = true),
        onPageFinished: (_) => setState(() => _isLoading = false),
        onNavigationRequest: (request) {
          final url = request.url.toLowerCase();
          if (url.contains('payment-success') || url.contains('payment/success')) {
            context.go('/payment/success/${widget.bookingId}');
            return NavigationDecision.prevent;
          }
          if (url.contains('payment-failed') || url.contains('payment/failed')) {
            context.go('/payment/failed/${widget.bookingId}');
            return NavigationDecision.prevent;
          }
          return NavigationDecision.navigate;
        },
      ))
      ..loadRequest(Uri.parse(widget.paymentUrl));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(context.tr('paymentMethod')),
        leading: IconButton(
          icon: const Icon(Icons.close_rounded),
          onPressed: () async {
            final confirm = await showConfirmDialog(
              context,
              title: context.tr('cancelPayment'),
              message: context.tr('cancelPaymentMsg'),
              confirmColor: AppTheme.error,
            );
            if (confirm && context.mounted) context.pop();
          },
        ),
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_isLoading)
            const Center(child: CircularProgressIndicator(color: AppTheme.primary)),
        ],
      ),
    );
  }
}
