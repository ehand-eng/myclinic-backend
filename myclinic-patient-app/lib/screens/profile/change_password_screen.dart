import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:myclinic_patient_app/config/theme.dart';
import 'package:myclinic_patient_app/l10n/translations.dart';
import 'package:myclinic_patient_app/providers/auth_provider.dart';
import 'package:myclinic_patient_app/services/user_service.dart';
import 'package:myclinic_patient_app/utils/helpers.dart';
import 'package:myclinic_patient_app/utils/validators.dart';
import 'package:myclinic_patient_app/widgets/buttons/primary_button.dart';
import 'package:myclinic_patient_app/widgets/inputs/text_input.dart';

class ChangePasswordScreen extends ConsumerStatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  ConsumerState<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends ConsumerState<ChangePasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _currentPwCtrl = TextEditingController();
  final _newPwCtrl = TextEditingController();
  final _confirmPwCtrl = TextEditingController();
  bool _obscureCurrent = true;
  bool _obscureNew = true;
  bool _obscureConfirm = true;
  bool _saving = false;

  @override
  void dispose() {
    _currentPwCtrl.dispose();
    _newPwCtrl.dispose();
    _confirmPwCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_currentPwCtrl.text == _newPwCtrl.text) {
      showSnackBar(context, 'New password must be different from the current password', isError: true);
      return;
    }
    setState(() => _saving = true);
    try {
      final user = ref.read(currentUserProvider);
      if (user == null) return;
      await ref.read(userServiceProvider).changePassword(user.id, _currentPwCtrl.text, _newPwCtrl.text);
      if (mounted) {
        showSnackBar(context, 'Password updated successfully');
        context.pop();
      }
    } catch (e) {
      if (mounted) showSnackBar(context, 'Failed to update password', isError: true);
    }
    setState(() => _saving = false);
  }

  @override
  Widget build(BuildContext context) {
    final strength = Validators.passwordStrength(_newPwCtrl.text);
    final strengthColor = strength <= 2 ? AppTheme.error : strength <= 3 ? AppTheme.warning : AppTheme.success;
    final strengthLabel = strength <= 2 ? 'Weak' : strength <= 3 ? 'Medium' : 'Strong';

    return Scaffold(
      appBar: AppBar(
        title: Text(context.tr('changePassword')),
        leading: IconButton(icon: const Icon(Icons.arrow_back_rounded), onPressed: () => context.pop()),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              AppTextInput(
                label: context.tr('currentPassword'),
                controller: _currentPwCtrl,
                prefixIcon: Icons.lock_outlined,
                obscureText: _obscureCurrent,
                validator: Validators.validatePassword,
                suffixIcon: IconButton(
                  icon: Icon(_obscureCurrent ? Icons.visibility_off_rounded : Icons.visibility_rounded, color: AppTheme.textLight),
                  onPressed: () => setState(() => _obscureCurrent = !_obscureCurrent),
                ),
              ),
              const SizedBox(height: 16),
              AppTextInput(
                label: context.tr('newPassword'),
                controller: _newPwCtrl,
                prefixIcon: Icons.lock_rounded,
                obscureText: _obscureNew,
                validator: Validators.validatePassword,
                onChanged: (_) => setState(() {}),
                suffixIcon: IconButton(
                  icon: Icon(_obscureNew ? Icons.visibility_off_rounded : Icons.visibility_rounded, color: AppTheme.textLight),
                  onPressed: () => setState(() => _obscureNew = !_obscureNew),
                ),
              ),
              if (_newPwCtrl.text.isNotEmpty) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(value: strength / 5, backgroundColor: AppTheme.border, color: strengthColor, minHeight: 4),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(strengthLabel, style: TextStyle(fontSize: 12, color: strengthColor, fontWeight: FontWeight.w600)),
                  ],
                ),
                const SizedBox(height: 8),
                _Criteria('8+ characters', _newPwCtrl.text.length >= 8),
                _Criteria('Uppercase letter', _newPwCtrl.text.contains(RegExp(r'[A-Z]'))),
                _Criteria('Lowercase letter', _newPwCtrl.text.contains(RegExp(r'[a-z]'))),
                _Criteria('Number', _newPwCtrl.text.contains(RegExp(r'[0-9]'))),
                _Criteria('Special character', _newPwCtrl.text.contains(RegExp(r'[!@#\$%\^&\*]'))),
              ],
              const SizedBox(height: 16),
              AppTextInput(
                label: context.tr('confirmPassword'),
                controller: _confirmPwCtrl,
                prefixIcon: Icons.lock_rounded,
                obscureText: _obscureConfirm,
                validator: (v) => Validators.validateConfirmPassword(v, _newPwCtrl.text),
                suffixIcon: IconButton(
                  icon: Icon(_obscureConfirm ? Icons.visibility_off_rounded : Icons.visibility_rounded, color: AppTheme.textLight),
                  onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                ),
              ),
              const SizedBox(height: 24),
              PrimaryButton(text: context.tr('updatePassword'), isLoading: _saving, useGradient: true, onPressed: _submit),
            ],
          ),
        ),
      ),
    );
  }
}

class _Criteria extends StatelessWidget {
  final String text;
  final bool met;
  const _Criteria(this.text, this.met);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        children: [
          Icon(met ? Icons.check_circle_rounded : Icons.circle_outlined, size: 16, color: met ? AppTheme.success : AppTheme.textLight),
          const SizedBox(width: 8),
          Flexible(child: Text(text, style: TextStyle(fontSize: 12, color: met ? AppTheme.success : AppTheme.textSecondary), overflow: TextOverflow.ellipsis)),
        ],
      ),
    );
  }
}
