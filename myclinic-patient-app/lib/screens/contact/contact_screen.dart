import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:myclinic_patient_app/config/constants.dart';
import 'package:myclinic_patient_app/config/theme.dart';
import 'package:myclinic_patient_app/l10n/translations.dart';
import 'package:myclinic_patient_app/utils/helpers.dart';
import 'package:myclinic_patient_app/widgets/buttons/primary_button.dart';
import 'package:myclinic_patient_app/widgets/inputs/text_input.dart';

class ContactScreen extends StatefulWidget {
  const ContactScreen({super.key});

  @override
  State<ContactScreen> createState() => _ContactScreenState();
}

class _ContactScreenState extends State<ContactScreen> {
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _messageCtrl = TextEditingController();

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _messageCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(context.tr('contactUs')),
        leading: IconButton(icon: const Icon(Icons.arrow_back_rounded), onPressed: () => context.pop()),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(context.tr('sendMessage'), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 16),
                    AppTextInput(label: context.tr('yourName'), controller: _nameCtrl, prefixIcon: Icons.person_rounded),
                    const SizedBox(height: 12),
                    AppTextInput(label: context.tr('yourEmail'), controller: _emailCtrl, prefixIcon: Icons.email_rounded, keyboardType: TextInputType.emailAddress),
                    const SizedBox(height: 12),
                    AppTextInput(label: context.tr('message'), controller: _messageCtrl, prefixIcon: Icons.message_rounded, maxLines: 4),
                    const SizedBox(height: 16),
                    PrimaryButton(
                      text: context.tr('sendMessage'),
                      icon: Icons.send_rounded,
                      onPressed: () {
                        showSnackBar(context, context.tr('messageSent'));
                        _nameCtrl.clear();
                        _emailCtrl.clear();
                        _messageCtrl.clear();
                      },
                    ),
                  ],
                ),
              ),
            ).animate().fadeIn(duration: 400.ms),
            const SizedBox(height: 20),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(context.tr('contactInformation'), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 12),
                    _ContactTile(Icons.email_rounded, context.tr('email'), AppConstants.supportEmail,
                      () => launchUrl(Uri.parse('mailto:${AppConstants.supportEmail}'))),
                    _ContactTile(Icons.phone_rounded, context.tr('phone'), AppConstants.supportPhone,
                      () => launchUrl(Uri.parse('tel:${AppConstants.supportPhone}'))),
                    _ContactTile(Icons.access_time_rounded, context.tr('operatingHours'), 'Mon - Fri: 8:00 AM - 6:00 PM', null),
                    _ContactTile(Icons.location_on_rounded, context.tr('address'), 'Colombo, Sri Lanka', null),
                  ],
                ),
              ),
            ).animate(delay: 200.ms).fadeIn(duration: 400.ms),
          ],
        ),
      ),
    );
  }
}

class _ContactTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final VoidCallback? onTap;

  const _ContactTile(this.icon, this.label, this.value, this.onTap);

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 10),
        child: Row(
          children: [
            Container(
              width: 40, height: 40,
              decoration: BoxDecoration(color: AppTheme.primarySurface, borderRadius: BorderRadius.circular(10)),
              child: Icon(icon, color: AppTheme.primary, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary), overflow: TextOverflow.ellipsis),
                  Text(value, style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: onTap != null ? AppTheme.primary : AppTheme.text), overflow: TextOverflow.ellipsis),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
