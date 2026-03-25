import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:myclinic_patient_app/config/constants.dart';
import 'package:myclinic_patient_app/config/theme.dart';
import 'package:myclinic_patient_app/l10n/translations.dart';
import 'package:myclinic_patient_app/providers/auth_provider.dart';
import 'package:myclinic_patient_app/providers/locale_provider.dart';
import 'package:myclinic_patient_app/utils/helpers.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locale = ref.watch(localeProvider);

    String localeName(String code) {
      switch (code) {
        case 'si': return 'සිංහල';
        case 'ta': return 'தமிழ்';
        default: return 'English';
      }
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(context.tr('settings')),
        leading: IconButton(icon: const Icon(Icons.arrow_back_rounded), onPressed: () => context.pop()),
      ),
      body: ListView(
        children: [
          _SectionHeader(context.tr('general')),
          ListTile(
            leading: const Icon(Icons.language_rounded, color: AppTheme.primary),
            title: Text(context.tr('language')),
            subtitle: Text(localeName(locale.languageCode)),
            trailing: const Icon(Icons.chevron_right_rounded),
            onTap: () => _showLanguageSheet(context, ref, locale),
          ),
          const Divider(height: 1),
          _SectionHeader(context.tr('account')),
          ListTile(
            leading: const Icon(Icons.person_rounded, color: AppTheme.primary),
            title: Text(context.tr('profile')),
            trailing: const Icon(Icons.chevron_right_rounded),
            onTap: () => context.go('/profile'),
          ),
          ListTile(
            leading: const Icon(Icons.lock_rounded, color: AppTheme.primary),
            title: Text(context.tr('changePassword')),
            trailing: const Icon(Icons.chevron_right_rounded),
            onTap: () => context.push('/change-password'),
          ),
          const Divider(height: 1),
          _SectionHeader(context.tr('support')),
          ListTile(
            leading: const Icon(Icons.info_rounded, color: AppTheme.primary),
            title: Text(context.tr('about')),
            trailing: const Icon(Icons.chevron_right_rounded),
            onTap: () => context.push('/about'),
          ),
          ListTile(
            leading: const Icon(Icons.phone_rounded, color: AppTheme.primary),
            title: Text(context.tr('contactUs')),
            trailing: const Icon(Icons.chevron_right_rounded),
            onTap: () => context.push('/contact'),
          ),
          const Divider(height: 1),
          _SectionHeader(context.tr('app')),
          ListTile(
            leading: const Icon(Icons.info_outline_rounded, color: AppTheme.textSecondary),
            title: Text(context.tr('version')),
            trailing: const Text(AppConstants.appVersion, style: TextStyle(color: AppTheme.textSecondary)),
          ),
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: TextButton.icon(
              onPressed: () async {
                final confirm = await showConfirmDialog(context, title: context.tr('logout'), message: context.tr('logoutConfirm'), confirmColor: AppTheme.error);
                if (confirm) {
                  ref.read(authProvider.notifier).logout();
                  if (context.mounted) context.go('/login');
                }
              },
              icon: const Icon(Icons.logout_rounded, color: AppTheme.error),
              label: Text(context.tr('logout'), style: const TextStyle(color: AppTheme.error, fontWeight: FontWeight.w600)),
            ),
          ),
        ],
      ),
    );
  }

  void _showLanguageSheet(BuildContext context, WidgetRef ref, Locale current) {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 16),
            Text(context.tr('selectLanguage'), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
            const SizedBox(height: 16),
            _LangOption('English', 'en', current.languageCode == 'en', () {
              ref.read(localeProvider.notifier).setLocale(const Locale('en'));
              Navigator.pop(ctx);
            }),
            _LangOption('සිංහල (Sinhala)', 'si', current.languageCode == 'si', () {
              ref.read(localeProvider.notifier).setLocale(const Locale('si'));
              Navigator.pop(ctx);
            }),
            _LangOption('தமிழ் (Tamil)', 'ta', current.languageCode == 'ta', () {
              ref.read(localeProvider.notifier).setLocale(const Locale('ta'));
              Navigator.pop(ctx);
            }),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader(this.title);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
      child: Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppTheme.textSecondary, letterSpacing: 0.5)),
    );
  }
}

class _LangOption extends StatelessWidget {
  final String label;
  final String code;
  final bool selected;
  final VoidCallback onTap;
  const _LangOption(this.label, this.code, this.selected, this.onTap);

  @override
  Widget build(BuildContext context) {
    return ListTile(
      title: Text(label),
      trailing: selected ? const Icon(Icons.check_circle_rounded, color: AppTheme.primary) : null,
      onTap: onTap,
    );
  }
}
