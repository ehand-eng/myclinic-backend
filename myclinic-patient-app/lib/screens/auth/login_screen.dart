import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:pin_code_fields/pin_code_fields.dart';
import 'package:myclinic_patient_app/config/theme.dart';
import 'package:myclinic_patient_app/l10n/translations.dart';
import 'package:myclinic_patient_app/providers/auth_provider.dart';
import 'package:myclinic_patient_app/services/api_service.dart';
import 'package:myclinic_patient_app/utils/helpers.dart';
import 'package:myclinic_patient_app/utils/validators.dart';
import 'package:myclinic_patient_app/widgets/buttons/primary_button.dart';
import 'package:myclinic_patient_app/widgets/inputs/text_input.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _emailFormKey = GlobalKey<FormState>();

  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _otpCtrl = TextEditingController();

  bool _obscurePassword = true;
  bool _keepSignedIn = false;
  bool _otpSent = false;
  bool _sendingOtp = false;
  int _resendTimer = 0;
  Timer? _timer;
  int _selectedTab = 0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _tabController.addListener(() {
      setState(() => _selectedTab = _tabController.index);
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _phoneCtrl.dispose();
    _otpCtrl.dispose();
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

  String get _fullPhone => '+94${_phoneCtrl.text.replaceAll(RegExp(r'\s'), '')}';

  Future<void> _sendOtp() async {
    final digits = _phoneCtrl.text.replaceAll(RegExp(r'\s'), '');
    if (digits.isEmpty || digits.length != 9) {
      showSnackBar(context, 'Enter 9 digits after +94', isError: true);
      return;
    }
    setState(() => _sendingOtp = true);
    try {
      await ref.read(authProvider.notifier).sendLoginOtp(_fullPhone, loginType: 'mobile');
      setState(() { _otpSent = true; _sendingOtp = false; });
      _startResendTimer();
      if (mounted) showSnackBar(context, 'OTP sent successfully');
    } catch (e) {
      setState(() => _sendingOtp = false);
      if (mounted) showSnackBar(context, ApiService.extractError(e), isError: true);
    }
  }

  Future<void> _loginWithOtp() async {
    await ref.read(authProvider.notifier).loginWithOtp(_fullPhone, _otpCtrl.text, keepSignedIn: _keepSignedIn);
    final auth = ref.read(authProvider);
    if (auth.isAuthenticated && mounted) {
      context.go('/');
    } else if (auth.error != null && mounted) {
      showSnackBar(context, auth.error!, isError: true);
    }
  }

  Future<void> _loginWithEmail() async {
    if (!_emailFormKey.currentState!.validate()) return;
    await ref.read(authProvider.notifier).loginEmail(_emailCtrl.text, _passwordCtrl.text, keepSignedIn: _keepSignedIn);
    final auth = ref.read(authProvider);
    if (auth.isAuthenticated && mounted) {
      context.go('/');
    } else if (auth.error != null && mounted) {
      showSnackBar(context, auth.error!, isError: true);
    }
  }

  Widget _phonePrefix() {
    return Padding(
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
    );
  }

  List<TextInputFormatter> get _phoneFormatters => [
        FilteringTextInputFormatter.digitsOnly,
        TextInputFormatter.withFunction((oldValue, newValue) {
          if (newValue.text.startsWith('0')) return oldValue;
          return newValue;
        }),
      ];

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
            stops: [0.0, 0.4],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Branding — compact
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 20, 24, 12),
                child: Column(
                  children: [
                    Container(
                      width: 56, height: 56,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(color: Colors.black.withValues(alpha: 0.2), blurRadius: 12, offset: const Offset(0, 6)),
                        ],
                      ),
                      child: const Icon(Icons.local_hospital_rounded, size: 32, color: AppTheme.primary),
                    ).animate().scale(duration: 500.ms, curve: Curves.elasticOut),
                    const SizedBox(height: 10),
                    Text(context.tr('appName'),
                      style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w700, color: Colors.white, letterSpacing: 1),
                    ).animate(delay: 150.ms).fadeIn(),
                    const SizedBox(height: 4),
                    Text(context.tr('welcomeBack'),
                      style: TextStyle(fontSize: 14, color: Colors.white.withValues(alpha: 0.85)),
                    ).animate(delay: 250.ms).fadeIn(),
                  ],
                ),
              ),

              // Form — fills remaining space
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(24, 8, 24, 0),
                  child: Column(
                    children: [
                      // Tab selector
                      Row(
                        children: [
                          _TabButton(label: context.tr('phoneLogin'), icon: Icons.phone_android_rounded, isSelected: _selectedTab == 0, onTap: () => _tabController.animateTo(0)),
                          _TabButton(label: context.tr('emailLogin'), icon: Icons.email_rounded, isSelected: _selectedTab == 1, onTap: () => _tabController.animateTo(1)),
                        ],
                      ).animate(delay: 350.ms).fadeIn().slideY(begin: 0.1, end: 0),
                      const SizedBox(height: 16),

                      // Tab content — expand to fill
                      Expanded(
                        child: TabBarView(
                          controller: _tabController,
                          children: [
                            _buildPhoneTab(auth),
                            _buildEmailTab(auth),
                          ],
                        ),
                      ),

                      // Bottom links
                      Padding(
                        padding: const EdgeInsets.only(bottom: 16, top: 8),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(context.tr('dontHaveAccount'), style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 13)),
                            const SizedBox(width: 4),
                            GestureDetector(
                              onTap: () => context.push('/signup'),
                              child: Text(context.tr('signup'),
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14)),
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

  Widget _buildPhoneTab(AuthState auth) {
    return SingleChildScrollView(
      child: Column(
        children: [
          AppTextInput(
            onDarkBackground: true,
            label: context.tr('phone'),
            hint: '7XXXXXXXX',
            controller: _phoneCtrl,
            prefix: _phonePrefix(),
            keyboardType: TextInputType.number,
            maxLength: 9,
            enabled: !_otpSent,
            inputFormatters: _phoneFormatters,
          ),
          const SizedBox(height: 14),
          if (!_otpSent)
            PrimaryButton(text: context.tr('sendOtp'), isLoading: _sendingOtp, icon: Icons.sms_rounded, useGradient: true, onPressed: _sendOtp)
          else ...[
            Text(context.tr('enterOtp'), style: TextStyle(color: Colors.white.withValues(alpha: 0.8), fontSize: 13)),
            const SizedBox(height: 8),
            PinCodeTextField(
              appContext: context,
              length: 6,
              controller: _otpCtrl,
              keyboardType: TextInputType.number,
              animationType: AnimationType.scale,
              pinTheme: PinTheme(
                shape: PinCodeFieldShape.box,
                borderRadius: BorderRadius.circular(12),
                fieldHeight: 46, fieldWidth: 42,
                activeFillColor: Colors.white,
                selectedFillColor: AppTheme.primarySurface,
                inactiveFillColor: Colors.white.withValues(alpha: 0.15),
                activeColor: Colors.white,
                selectedColor: Colors.white,
                inactiveColor: Colors.white.withValues(alpha: 0.4),
              ),
              enableActiveFill: true,
              textStyle: const TextStyle(color: AppTheme.text),
              onChanged: (_) {},
            ),
            if (_resendTimer > 0)
              Text('Resend in ${_resendTimer}s', style: TextStyle(color: Colors.white.withValues(alpha: 0.7), fontSize: 12))
            else
              TextButton(
                onPressed: _sendOtp,
                style: TextButton.styleFrom(padding: EdgeInsets.zero, minimumSize: const Size(0, 30)),
                child: Text(context.tr('resendOtp'), style: const TextStyle(color: Colors.white, fontSize: 13)),
              ),
            const SizedBox(height: 6),
            Row(
              children: [
                SizedBox(
                  height: 20, width: 20,
                  child: Checkbox(
                    value: _keepSignedIn,
                    onChanged: (v) => setState(() => _keepSignedIn = v ?? false),
                    activeColor: Colors.white,
                    checkColor: AppTheme.primary,
                    side: BorderSide(color: Colors.white.withValues(alpha: 0.6)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                  ),
                ),
                const SizedBox(width: 8),
                Text(context.tr('keepMeSignedIn'), style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.8))),
              ],
            ),
            const SizedBox(height: 10),
            PrimaryButton(text: context.tr('login'), isLoading: auth.isLoading, useGradient: true, icon: Icons.login_rounded, onPressed: _loginWithOtp),
          ],
        ],
      ),
    );
  }

  Widget _buildEmailTab(AuthState auth) {
    return SingleChildScrollView(
      child: Form(
        key: _emailFormKey,
        child: Column(
          children: [
            AppTextInput(
              onDarkBackground: true,
              label: context.tr('email'),
              hint: 'your@email.com',
              controller: _emailCtrl,
              prefixIcon: Icons.email_rounded,
              keyboardType: TextInputType.emailAddress,
              validator: Validators.validateEmail,
            ),
            const SizedBox(height: 14),
            AppTextInput(
              onDarkBackground: true,
              label: context.tr('password'),
              controller: _passwordCtrl,
              prefixIcon: Icons.lock_rounded,
              obscureText: _obscurePassword,
              validator: Validators.validatePassword,
              suffixIcon: IconButton(
                icon: Icon(_obscurePassword ? Icons.visibility_off_rounded : Icons.visibility_rounded, color: Colors.white70),
                onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
              ),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                SizedBox(
                  height: 20, width: 20,
                  child: Checkbox(
                    value: _keepSignedIn,
                    onChanged: (v) => setState(() => _keepSignedIn = v ?? false),
                    activeColor: Colors.white,
                    checkColor: AppTheme.primary,
                    side: BorderSide(color: Colors.white.withValues(alpha: 0.6)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                  ),
                ),
                const SizedBox(width: 8),
                Text(context.tr('keepMeSignedIn'), style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.8))),
              ],
            ),
            const SizedBox(height: 16),
            PrimaryButton(text: context.tr('login'), isLoading: auth.isLoading, useGradient: true, icon: Icons.login_rounded, onPressed: _loginWithEmail),
          ],
        ),
      ),
    );
  }
}

class _TabButton extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  const _TabButton({required this.label, required this.icon, required this.isSelected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          padding: const EdgeInsets.symmetric(vertical: 10),
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
              Icon(icon, size: 16, color: isSelected ? Colors.white : Colors.white54),
              const SizedBox(width: 6),
              Flexible(
                child: Text(label, style: TextStyle(
                  fontSize: 13, fontWeight: isSelected ? FontWeight.w700 : FontWeight.w400,
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
