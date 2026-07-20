import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:myclinic_patient_app/config/theme.dart';
import 'package:myclinic_patient_app/l10n/translations.dart';
import 'package:myclinic_patient_app/providers/auth_provider.dart';
import 'package:myclinic_patient_app/services/storage_service.dart';
import 'package:myclinic_patient_app/services/user_service.dart';
import 'package:myclinic_patient_app/utils/formatters.dart';
import 'package:myclinic_patient_app/utils/helpers.dart';
import 'package:myclinic_patient_app/widgets/buttons/primary_button.dart';
import 'package:myclinic_patient_app/widgets/inputs/text_input.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  bool _editing = false;
  bool _saving = false;
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _emailCtrl.dispose();
    super.dispose();
  }

  void _startEdit() {
    final user = ref.read(currentUserProvider);
    if (user == null) return;
    _nameCtrl.text = user.name;
    _emailCtrl.text = user.email ?? '';
    _phoneCtrl.text = user.mobile ?? '';
    setState(() => _editing = true);
  }

  Future<void> _save() async {
    final user = ref.read(currentUserProvider);
    if (user == null) return;
    setState(() => _saving = true);
    try {
      final response = await ref.read(userServiceProvider).updateProfile({
        'name': _nameCtrl.text.trim(),
        'email': _emailCtrl.text.trim(),
      });
      await ref.read(storageServiceProvider).saveToken(response.token);
      ref.read(authProvider.notifier).updateUser(response.user);
      setState(() => _editing = false);
      if (mounted) showSnackBar(context, 'Profile updated');
    } catch (e) {
      if (mounted) showSnackBar(context, 'Failed to update', isError: true);
    }
    setState(() => _saving = false);
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 230,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(gradient: AppTheme.heroGradient),
                child: Padding(
                  padding: const EdgeInsets.only(bottom: 16),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 48),
                      CircleAvatar(
                        radius: 38,
                        backgroundColor: Colors.white,
                        child: Text(
                          user != null && user.name.isNotEmpty ? user.name[0].toUpperCase() : '?',
                          style: const TextStyle(fontSize: 30, fontWeight: FontWeight.w700, color: AppTheme.primary),
                        ),
                      ).animate().scale(duration: 400.ms, curve: Curves.elasticOut),
                      const SizedBox(height: 12),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: Text(
                          user?.name ?? 'User',
                          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600, color: Colors.white),
                          overflow: TextOverflow.ellipsis,
                          textAlign: TextAlign.center,
                        ).animate(delay: 200.ms).fadeIn(),
                      ),
                      const SizedBox(height: 4),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: Text(
                          user?.email ?? '',
                          style: const TextStyle(fontSize: 13, color: Colors.white70),
                          overflow: TextOverflow.ellipsis,
                          textAlign: TextAlign.center,
                        ).animate(delay: 300.ms).fadeIn(),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            actions: [
              if (!_editing)
                IconButton(
                  icon: const Icon(Icons.edit_rounded, color: Colors.white),
                  onPressed: _startEdit,
                ),
            ],
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: _editing ? _buildEditForm() : _buildProfile(user),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProfile(user) {
    final isComplete = user?.isProfileComplete ?? true;
    return Column(
      children: [
        if (!isComplete) ...[
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.orange.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.orange.withValues(alpha: 0.3)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.warning_amber_rounded, color: Colors.orange),
                    SizedBox(width: 8),
                    Text('Incomplete Profile', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.orange)),
                  ],
                ),
                const SizedBox(height: 8),
                const Text('Please complete your profile to continue using all features of the app.', style: TextStyle(fontSize: 13)),
                const SizedBox(height: 12),
                PrimaryButton(
                  text: 'Complete Profile',
                  onPressed: _startEdit,
                ),
              ],
            ),
          ).animate().fadeIn().slideY(begin: -0.1),
          const SizedBox(height: 16),
        ],
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(context.tr('personalInfo'), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                const SizedBox(height: 12),
                _InfoTile(Icons.person_rounded, context.tr('name'), user?.name ?? '-'),
                _InfoTile(Icons.email_rounded, context.tr('email'), user?.email ?? '-'),
                _InfoTile(Icons.phone_rounded, context.tr('phone'), user?.mobile ?? '-'),
                if (user?.nationality != null)
                  _InfoTile(Icons.flag_rounded, context.tr('nationality'), user?.nationality ?? '-'),
                if (user?.lastLogin != null)
                  _InfoTile(Icons.login_rounded, 'Last Login', Formatters.relativeTime(user?.lastLogin)),
              ],
            ),
          ),
        ).animate().fadeIn(duration: 400.ms),
        const SizedBox(height: 16),
        Card(
          child: Column(
            children: [
              ListTile(
                leading: const Icon(Icons.lock_rounded, color: AppTheme.primary),
                title: Text(context.tr('changePassword')),
                trailing: const Icon(Icons.chevron_right_rounded),
                onTap: () => context.push('/change-password'),
              ),
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.calendar_today_rounded, color: AppTheme.primary),
                title: Text(context.tr('myBookings')),
                trailing: const Icon(Icons.chevron_right_rounded),
                onTap: () => context.go('/my-bookings'),
              ),
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.settings_rounded, color: AppTheme.primary),
                title: Text(context.tr('settings')),
                trailing: const Icon(Icons.chevron_right_rounded),
                onTap: () => context.push('/settings'),
              ),
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.info_rounded, color: AppTheme.primary),
                title: Text(context.tr('about')),
                trailing: const Icon(Icons.chevron_right_rounded),
                onTap: () => context.push('/about'),
              ),
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.phone_rounded, color: AppTheme.primary),
                title: Text(context.tr('contactUs')),
                trailing: const Icon(Icons.chevron_right_rounded),
                onTap: () => context.push('/contact'),
              ),
            ],
          ),
        ).animate(delay: 200.ms).fadeIn(duration: 400.ms),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          child: TextButton.icon(
            onPressed: () async {
              final confirm = await showConfirmDialog(
                context, title: context.tr('logout'), message: context.tr('logoutConfirm'), confirmColor: AppTheme.error,
              );
              if (confirm) {
                ref.read(authProvider.notifier).logout();
                if (mounted) context.go('/login');
              }
            },
            icon: const Icon(Icons.logout_rounded, color: AppTheme.error),
            label: Text(context.tr('logout'), style: const TextStyle(color: AppTheme.error, fontWeight: FontWeight.w600)),
          ),
        ),
        const SizedBox(height: 24),
      ],
    );
  }

  Widget _buildEditForm() {
    return Column(
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(context.tr('editProfile'), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                const SizedBox(height: 16),
                AppTextInput(label: context.tr('name'), controller: _nameCtrl, prefixIcon: Icons.person_rounded, maxLength: 25),
                const SizedBox(height: 14),
                AppTextInput(label: context.tr('email'), controller: _emailCtrl, prefixIcon: Icons.email_rounded),
                if (ref.read(currentUserProvider)?.mobile != null) ...[
                  const SizedBox(height: 14),
                  AppTextInput(label: context.tr('phone'), controller: _phoneCtrl, prefixIcon: Icons.phone_rounded, enabled: false),
                ],
                const SizedBox(height: 20),
                PrimaryButton(text: context.tr('saveChanges'), isLoading: _saving, onPressed: _save),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: TextButton(onPressed: () => setState(() => _editing = false), child: Text(context.tr('cancel'))),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  const _InfoTile(this.icon, this.label, this.value);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppTheme.primary),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary), overflow: TextOverflow.ellipsis),
                Text(value, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500), overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
