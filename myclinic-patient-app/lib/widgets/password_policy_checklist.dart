import 'package:flutter/material.dart';
import 'package:myclinic_patient_app/config/theme.dart';
import 'package:myclinic_patient_app/utils/password_policy.dart';

class PasswordPolicyChecklist extends StatelessWidget {
  final String password;
  final bool onDarkBackground;
  final bool showWhenEmpty;

  const PasswordPolicyChecklist({
    super.key,
    required this.password,
    this.onDarkBackground = false,
    this.showWhenEmpty = true,
  });

  @override
  Widget build(BuildContext context) {
    if (!showWhenEmpty && password.isEmpty) {
      return const SizedBox.shrink();
    }

    final checks = getPasswordPolicyChecks(password);
    final introColor = onDarkBackground
        ? Colors.white.withValues(alpha: 0.75)
        : AppTheme.textSecondary;
    final unmetColor = onDarkBackground
        ? Colors.white.withValues(alpha: 0.55)
        : AppTheme.textLight;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          passwordPolicyIntro,
          style: TextStyle(fontSize: 11, color: introColor, height: 1.35),
        ),
        const SizedBox(height: 6),
        _Rule('At least 8 characters', checks.minLength, onDarkBackground, unmetColor),
        _Rule('Contains a lowercase letter', checks.hasLower, onDarkBackground, unmetColor),
        _Rule('Contains an uppercase letter', checks.hasUpper, onDarkBackground, unmetColor),
        _Rule('Contains a number', checks.hasDigit, onDarkBackground, unmetColor),
        _Rule('Contains a special character', checks.hasSpecial, onDarkBackground, unmetColor),
        _Rule(
          'Uses at least three character types (${checks.categoryCount}/4)',
          checks.meetsCategoryRule,
          onDarkBackground,
          unmetColor,
        ),
        _Rule('Password meets all requirements', checks.isStrong, onDarkBackground, unmetColor),
      ],
    );
  }
}

class _Rule extends StatelessWidget {
  final String text;
  final bool met;
  final bool onDarkBackground;
  final Color unmetColor;

  const _Rule(this.text, this.met, this.onDarkBackground, this.unmetColor);

  @override
  Widget build(BuildContext context) {
    final metColor = onDarkBackground ? Colors.greenAccent.shade100 : AppTheme.success;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            met ? Icons.check_circle_rounded : Icons.circle_outlined,
            size: 16,
            color: met ? metColor : unmetColor,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 12,
                color: met ? metColor : unmetColor,
                height: 1.25,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
