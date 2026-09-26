import 'package:flutter/material.dart';
import '../config/theme.dart';
import '../utils/password_policy.dart';

class PasswordPolicyChecklist extends StatelessWidget {
  final String password;
  final bool showWhenEmpty;

  const PasswordPolicyChecklist({
    super.key,
    required this.password,
    this.showWhenEmpty = true,
  });

  @override
  Widget build(BuildContext context) {
    if (!showWhenEmpty && password.isEmpty) {
      return const SizedBox.shrink();
    }

    final checks = getPasswordPolicyChecks(password);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          passwordPolicyIntro,
          style: const TextStyle(fontSize: 11, color: AppColors.textSecondary, height: 1.35),
        ),
        const SizedBox(height: 6),
        _Rule('At least 8 characters', checks.minLength),
        _Rule('Contains a lowercase letter', checks.hasLower),
        _Rule('Contains an uppercase letter', checks.hasUpper),
        _Rule('Contains a number', checks.hasDigit),
        _Rule('Contains a special character', checks.hasSpecial),
        _Rule(
          'Uses at least three character types (${checks.categoryCount}/4)',
          checks.meetsCategoryRule,
        ),
        _Rule('Password meets all requirements', checks.isStrong),
      ],
    );
  }
}

class _Rule extends StatelessWidget {
  final String text;
  final bool met;

  const _Rule(this.text, this.met);

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            met ? Icons.check_circle_rounded : Icons.circle_outlined,
            size: 16,
            color: met ? AppColors.success : AppColors.textSecondary,
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 12,
                color: met ? AppColors.success : AppColors.textSecondary,
                height: 1.25,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
