import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:myclinic_patient_app/config/theme.dart';
import 'package:myclinic_patient_app/l10n/translations.dart';
import 'package:myclinic_patient_app/providers/auth_provider.dart';
import 'package:myclinic_patient_app/services/api_service.dart';
import 'package:myclinic_patient_app/utils/helpers.dart';
import 'package:flutter/services.dart';
import 'package:myclinic_patient_app/utils/validators.dart';
import 'package:myclinic_patient_app/widgets/buttons/primary_button.dart';
import 'package:myclinic_patient_app/widgets/inputs/otp_input.dart';
import 'package:myclinic_patient_app/widgets/inputs/text_input.dart';

class SignupScreen extends ConsumerStatefulWidget {
  const SignupScreen({super.key});

  @override
  ConsumerState<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends ConsumerState<SignupScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _emailFormKey = GlobalKey<FormState>();

  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmPwCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController(); // phone tab phone
  final _emailPhoneCtrl = TextEditingController(); // email tab phone (optional)
  final _otpCtrl = TextEditingController();
  final _namePhoneCtrl = TextEditingController();
  final _phonePasswordCtrl = TextEditingController();
  final _phoneConfirmPwCtrl = TextEditingController();

  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  bool _obscurePhonePassword = true;
  bool _obscurePhoneConfirm = true;
  bool _acceptTerms = false;
  String _nationality = 'sri_lanka';
  bool _showPasswordFields = false;
  bool _otpSent = false;
  bool _sendingOtp = false;
  int _resendTimer = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        setState(() => _selectedTab = _tabController.index);
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmPwCtrl.dispose();
    _phoneCtrl.dispose();
    _emailPhoneCtrl.dispose();
    _otpCtrl.dispose();
    _namePhoneCtrl.dispose();
    _phonePasswordCtrl.dispose();
    _phoneConfirmPwCtrl.dispose();
    _timer?.cancel();
    super.dispose();
  }

  void _startResendTimer() {
    _resendTimer = 60;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      setState(() {
        _resendTimer--;
        if (_resendTimer <= 0) t.cancel();
      });
    });
  }

  /// Returns the full phone number with +94 prefix for Sri Lanka
  String get _fullPhone {
    final digits = _phoneCtrl.text.replaceAll(RegExp(r'\s'), '');
    if (_nationality == 'sri_lanka') {
      return '+94$digits';
    }
    return digits;
  }

  Future<void> _sendOtp() async {
    if (_phoneCtrl.text.trim().isEmpty || _namePhoneCtrl.text.isEmpty) {
      showSnackBar(context, 'Fill in all required fields', isError: true);
      return;
    }
    if (_nationality == 'sri_lanka' && _phoneCtrl.text.replaceAll(RegExp(r'\s'), '').length != 9) {
      showSnackBar(context, 'Please enter 9 digits after +94', isError: true);
      return;
    }
    final phone = _fullPhone;
    setState(() => _sendingOtp = true);
    try {
      await ref.read(authProvider.notifier).sendOtp(phone, nationality: _nationality);
      setState(() {
        _otpSent = true;
        _sendingOtp = false;
      });
      _startResendTimer();
      if (mounted) showSnackBar(context, 'OTP sent successfully');
    } catch (e) {
      setState(() => _sendingOtp = false);
      final msg = ApiService.extractError(e);
      if (mounted) showSnackBar(context, msg, isError: true);
    }
  }

  Future<void> _signupWithPhone() async {
    if (!_acceptTerms) {
      showSnackBar(context, 'Please accept Terms & Conditions', isError: true);
      return;
    }
    // Password is optional — validate only if provided
    if (_phonePasswordCtrl.text.isNotEmpty) {
      final pwError = Validators.validatePassword(_phonePasswordCtrl.text);
      if (pwError != null) {
        showSnackBar(context, pwError, isError: true);
        return;
      }
      if (_phonePasswordCtrl.text != _phoneConfirmPwCtrl.text) {
        showSnackBar(context, 'Passwords do not match', isError: true);
        return;
      }
    }
    await ref.read(authProvider.notifier).signupMobile(
          name: _namePhoneCtrl.text,
          phone: _fullPhone,
          otp: _otpCtrl.text,
          nationality: _nationality,
          password: _phonePasswordCtrl.text.isNotEmpty
              ? _phonePasswordCtrl.text
              : null,
        );
    _handleResult();
  }

  Future<void> _signupWithEmail() async {
    if (!_emailFormKey.currentState!.validate()) return;
    if (!_acceptTerms) {
      showSnackBar(context, 'Please accept Terms & Conditions', isError: true);
      return;
    }
    final emailPhone = _nationality == 'sri_lanka'
        ? '+94${_emailPhoneCtrl.text.replaceAll(RegExp(r'\s'), '')}'
        : _emailPhoneCtrl.text.trim();
    await ref.read(authProvider.notifier).signupEmail(
          name: _nameCtrl.text,
          email: _emailCtrl.text,
          password: _passwordCtrl.text,
          phone: emailPhone,
          nationality: _nationality,
        );
    _handleResult();
  }

  void _handleResult() {
    final auth = ref.read(authProvider);
    if (auth.isAuthenticated && mounted) {
      context.go('/');
    } else if (auth.error != null && mounted) {
      showSnackBar(context, auth.error!, isError: true);
    }
  }

  int _selectedTab = 0;

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);

    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [AppTheme.primary, Color(0xFF1564AD)],
            stops: [0.0, 0.35],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Top — compact back button + title
              Padding(
                padding: const EdgeInsets.fromLTRB(8, 4, 24, 0),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
                      onPressed: () => context.pop(),
                    ),
                    const Spacer(),
                  ],
                ),
              ),
              const Icon(Icons.person_add_rounded, size: 36, color: Colors.white)
                  .animate().scale(duration: 500.ms, curve: Curves.elasticOut),
              const SizedBox(height: 6),
              Text(
                context.tr('createAccount'),
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700, color: Colors.white),
              ).animate(delay: 200.ms).fadeIn(),
              const SizedBox(height: 12),

              // Form — fills remaining space
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(24, 0, 24, 0),
                  child: Column(
                    children: [
              // Tab selector
              Row(
                children: [
                  _SignupTabButton(label: context.tr('phoneLogin'), icon: Icons.phone_android_rounded, isSelected: _selectedTab == 0, onTap: _nationality == 'other' ? null : () => _tabController.animateTo(0)),
                  _SignupTabButton(label: context.tr('emailLogin'), icon: Icons.email_rounded, isSelected: _selectedTab == 1, onTap: () => _tabController.animateTo(1)),
                ],
              ),
              const SizedBox(height: 12),
              // Nationality selector
              Row(
                children: [
                  Text('${context.tr('nationality')}: ', style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 13)),
                  const SizedBox(width: 6),
                  Expanded(
                    child: SegmentedButton<String>(
                      segments: [
                        ButtonSegment(value: 'sri_lanka', label: Text(context.tr('sriLankan'), overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12))),
                        ButtonSegment(value: 'other', label: Text(context.tr('foreign'), overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 12))),
                      ],
                      selected: {_nationality},
                      onSelectionChanged: (v) {
                        setState(() {
                          _nationality = v.first;
                          _phoneCtrl.clear();
                        });
                        // Foreign users can only sign up via email
                        if (v.first == 'other') {
                          _tabController.animateTo(1);
                        }
                      },
                      style: SegmentedButton.styleFrom(
                        selectedBackgroundColor: Colors.white.withValues(alpha: 0.2),
                        selectedForegroundColor: Colors.white,
                        foregroundColor: Colors.white70,
                      ),
                    ),
                  ),
                ],
              ),
              // Foreign user SMS warning
              if (_nationality == 'other') ...[
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.amber.shade50.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.amber.shade300.withValues(alpha: 0.5)),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.info_outline_rounded, color: Colors.amber.shade200, size: 18),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          'Foreign users will not receive SMS notifications.',
                          style: TextStyle(fontSize: 11, color: Colors.amber.shade100),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 12),
              // Tab content — fills remaining
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  physics: _nationality == 'other' ? const NeverScrollableScrollPhysics() : null,
                  children: [
                    // Phone signup
                    SingleChildScrollView(
                      child: Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: Column(
                        children: [
                          AppTextInput(onDarkBackground: true,
                            label: context.tr('fullName'),
                            controller: _namePhoneCtrl,
                            prefixIcon: Icons.person_rounded,
                            maxLength: 25,
                            validator: Validators.validateName,
                          ),
                          const SizedBox(height: 14),
                          if (_nationality == 'sri_lanka')
                            AppTextInput(
                              onDarkBackground: true,
                              label: context.tr('phone'),
                              hint: '7XXXXXXXX',
                              controller: _phoneCtrl,
                              prefix: Padding(
                                padding: const EdgeInsets.only(left: 14, right: 4),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.phone_rounded,
                                        color: Colors.white70, size: 20),
                                    const SizedBox(width: 8),
                                    Text('+94',
                                        style: TextStyle(
                                          color: Colors.white.withValues(alpha: 0.9),
                                          fontSize: 15,
                                          fontWeight: FontWeight.w600,
                                        )),
                                  ],
                                ),
                              ),
                              keyboardType: TextInputType.number,
                              maxLength: 9,
                              enabled: !_otpSent,
                              inputFormatters: [
                                FilteringTextInputFormatter.digitsOnly,
                                // Block leading zero
                                TextInputFormatter.withFunction(
                                    (oldValue, newValue) {
                                  if (newValue.text.startsWith('0')) {
                                    return oldValue;
                                  }
                                  return newValue;
                                }),
                              ],
                            )
                          else
                            AppTextInput(
                              onDarkBackground: true,
                              label: 'Email',
                              hint: 'your@email.com',
                              controller: _phoneCtrl,
                              prefixIcon: Icons.email_rounded,
                              keyboardType: TextInputType.emailAddress,
                              enabled: !_otpSent,
                            ),
                          const SizedBox(height: 14),
                          if (!_otpSent)
                            PrimaryButton(
                              text: context.tr('sendOtp'),
                              isLoading: _sendingOtp,
                              onPressed: _sendOtp,
                            )
                          else ...[
                            OtpInput(controller: _otpCtrl),
                            if (_resendTimer > 0)
                              Text('Resend in ${_resendTimer}s',
                                  style: TextStyle(color: Colors.white.withValues(alpha: 0.7), fontSize: 13))
                            else
                              TextButton(onPressed: _sendOtp, child: Text(context.tr('resendOtp'), style: const TextStyle(color: Colors.white))),
                            const SizedBox(height: 14),
                            // Optional password section
                            GestureDetector(
                              onTap: () => setState(() => _showPasswordFields = !_showPasswordFields),
                              child: Row(
                                children: [
                                  Icon(
                                    _showPasswordFields
                                        ? Icons.keyboard_arrow_up_rounded
                                        : Icons.keyboard_arrow_down_rounded,
                                    color: Colors.white70,
                                    size: 20,
                                  ),
                                  const SizedBox(width: 6),
                                  Text(
                                    'Set a password (optional)',
                                    style: TextStyle(
                                      color: Colors.white.withValues(alpha: 0.8),
                                      fontSize: 13,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            if (_showPasswordFields) ...[
                              const SizedBox(height: 10),
                              AppTextInput(
                                onDarkBackground: true,
                                label: context.tr('password'),
                                controller: _phonePasswordCtrl,
                                prefixIcon: Icons.lock_rounded,
                                obscureText: _obscurePhonePassword,
                                suffixIcon: IconButton(
                                  icon: Icon(
                                    _obscurePhonePassword ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                                    color: Colors.white70,
                                  ),
                                  onPressed: () => setState(() => _obscurePhonePassword = !_obscurePhonePassword),
                                ),
                                onChanged: (_) => setState(() {}),
                              ),
                              if (_phonePasswordCtrl.text.isNotEmpty) ...[
                                const SizedBox(height: 8),
                                _PasswordStrength(password: _phonePasswordCtrl.text),
                              ],
                              const SizedBox(height: 14),
                              AppTextInput(
                                onDarkBackground: true,
                                label: context.tr('confirmPassword'),
                                controller: _phoneConfirmPwCtrl,
                                prefixIcon: Icons.lock_rounded,
                                obscureText: _obscurePhoneConfirm,
                                suffixIcon: IconButton(
                                  icon: Icon(
                                    _obscurePhoneConfirm ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                                    color: Colors.white70,
                                  ),
                                  onPressed: () => setState(() => _obscurePhoneConfirm = !_obscurePhoneConfirm),
                                ),
                              ),
                            ],
                            const SizedBox(height: 8),
                            _termsCheckbox(),
                            const SizedBox(height: 14),
                            PrimaryButton(
                              text: context.tr('createAccount'),
                              isLoading: auth.isLoading,
                              useGradient: true,
                              onPressed: _signupWithPhone,
                            ),
                          ],
                        ],
                      ),
                      ),
                    ),
                    // Email signup
                    SingleChildScrollView(
                      child: Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: Form(
                        key: _emailFormKey,
                        child: Column(
                          children: [
                            AppTextInput(onDarkBackground: true, 
                              label: context.tr('fullName'),
                              controller: _nameCtrl,
                              prefixIcon: Icons.person_rounded,
                              maxLength: 25,
                              validator: Validators.validateName,
                            ),
                            const SizedBox(height: 14),
                            AppTextInput(onDarkBackground: true,
                              label: context.tr('email'),
                              controller: _emailCtrl,
                              prefixIcon: Icons.email_rounded,
                              keyboardType: TextInputType.emailAddress,
                              validator: Validators.validateEmail,
                            ),
                            const SizedBox(height: 14),
                            if (_nationality == 'sri_lanka')
                              AppTextInput(
                                onDarkBackground: true,
                                label: context.tr('phone'),
                                hint: '7XXXXXXXX',
                                controller: _emailPhoneCtrl,
                                prefix: Padding(
                                  padding: const EdgeInsets.only(left: 14, right: 4),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.phone_rounded, color: Colors.white70, size: 20),
                                      const SizedBox(width: 8),
                                      Text('+94',
                                          style: TextStyle(
                                            color: Colors.white.withValues(alpha: 0.9),
                                            fontSize: 15,
                                            fontWeight: FontWeight.w600,
                                          )),
                                    ],
                                  ),
                                ),
                                keyboardType: TextInputType.number,
                                maxLength: 9,
                                inputFormatters: [
                                  FilteringTextInputFormatter.digitsOnly,
                                  TextInputFormatter.withFunction((oldValue, newValue) {
                                    if (newValue.text.startsWith('0')) return oldValue;
                                    return newValue;
                                  }),
                                ],
                                validator: (v) {
                                  if (v == null || v.trim().isEmpty) return 'Phone number is required';
                                  if (v.replaceAll(RegExp(r'\s'), '').length != 9) return 'Enter 9 digits after +94';
                                  return null;
                                },
                              )
                            else
                              AppTextInput(
                                onDarkBackground: true,
                                label: context.tr('phone'),
                                hint: 'e.g. +1 234 567 8900',
                                controller: _emailPhoneCtrl,
                                prefixIcon: Icons.phone_rounded,
                                keyboardType: TextInputType.phone,
                                validator: (v) {
                                  if (v == null || v.trim().isEmpty) return 'Phone number is required';
                                  return null;
                                },
                              ),
                            const SizedBox(height: 14),
                            AppTextInput(onDarkBackground: true,
                              label: context.tr('password'),
                              controller: _passwordCtrl,
                              prefixIcon: Icons.lock_rounded,
                              obscureText: _obscurePassword,
                              validator: Validators.validatePassword,
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _obscurePassword ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                                  color: Colors.white70,
                                ),
                                onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                              ),
                              onChanged: (_) => setState(() {}),
                            ),
                            if (_passwordCtrl.text.isNotEmpty) ...[
                              const SizedBox(height: 8),
                              _PasswordStrength(password: _passwordCtrl.text),
                            ],
                            const SizedBox(height: 14),
                            AppTextInput(onDarkBackground: true, 
                              label: context.tr('confirmPassword'),
                              controller: _confirmPwCtrl,
                              prefixIcon: Icons.lock_rounded,
                              obscureText: _obscureConfirm,
                              validator: (v) => Validators.validateConfirmPassword(v, _passwordCtrl.text),
                              suffixIcon: IconButton(
                                icon: Icon(
                                  _obscureConfirm ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                                  color: Colors.white70,
                                ),
                                onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                              ),
                            ),
                            const SizedBox(height: 14),
                            _termsCheckbox(),
                            const SizedBox(height: 14),
                            PrimaryButton(
                              text: context.tr('createAccount'),
                              isLoading: auth.isLoading,
                              useGradient: true,
                              onPressed: _signupWithEmail,
                            ),
                          ],
                        ),
                      ),
                      ),
                    ),
                  ],
                ),
              ),
              // Bottom link
              Padding(
                padding: const EdgeInsets.only(bottom: 12, top: 4),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(context.tr('alreadyHaveAccount'),
                        style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 13)),
                    const SizedBox(width: 4),
                    GestureDetector(
                      onTap: () => context.pop(),
                      child: Text(context.tr('login'), style: const TextStyle(fontWeight: FontWeight.w700, color: Colors.white, fontSize: 14)),
                    ),
                  ],
                ),
              ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _termsCheckbox() {
    return Row(
      children: [
        SizedBox(
          height: 24,
          width: 24,
          child: Checkbox(
            value: _acceptTerms,
            onChanged: (v) => setState(() => _acceptTerms = v ?? false),
            activeColor: Colors.white,
            checkColor: AppTheme.primary,
            side: BorderSide(color: Colors.white.withValues(alpha: 0.6)),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            context.tr('agreeTerms'),
            style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.8)),
          ),
        ),
      ],
    );
  }
}

class _SignupTabButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool isSelected;
  final VoidCallback? onTap;
  const _SignupTabButton({required this.label, required this.icon, required this.isSelected, this.onTap});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(
                color: isSelected ? Colors.white : Colors.transparent,
                width: 2.5,
              ),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 18, color: isSelected ? Colors.white : Colors.white54),
              const SizedBox(width: 6),
              Flexible(
                child: Text(label, style: TextStyle(
                  fontSize: 14, fontWeight: isSelected ? FontWeight.w700 : FontWeight.w400,
                  color: isSelected ? Colors.white : Colors.white54,
                ), overflow: TextOverflow.ellipsis),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PasswordStrength extends StatelessWidget {
  final String password;
  const _PasswordStrength({required this.password});

  @override
  Widget build(BuildContext context) {
    final strength = Validators.passwordStrength(password);
    final color = strength <= 2 ? AppTheme.error : strength <= 3 ? AppTheme.warning : AppTheme.success;
    final label = strength <= 2 ? 'Weak' : strength <= 3 ? 'Medium' : 'Strong';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: strength / 5,
                  backgroundColor: Colors.white.withValues(alpha: 0.3),
                  color: color,
                  minHeight: 4,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Text(label, style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.w600)),
          ],
        ),
      ],
    );
  }
}
