class PasswordPolicyChecks {
  final bool minLength;
  final bool hasLower;
  final bool hasUpper;
  final bool hasDigit;
  final bool hasSpecial;
  final int categoryCount;
  final bool meetsCategoryRule;
  final bool isStrong;

  const PasswordPolicyChecks({
    required this.minLength,
    required this.hasLower,
    required this.hasUpper,
    required this.hasDigit,
    required this.hasSpecial,
    required this.categoryCount,
    required this.meetsCategoryRule,
    required this.isStrong,
  });
}

PasswordPolicyChecks getPasswordPolicyChecks(String password) {
  final hasLower = RegExp(r'[a-z]').hasMatch(password);
  final hasUpper = RegExp(r'[A-Z]').hasMatch(password);
  final hasDigit = RegExp(r'[0-9]').hasMatch(password);
  final hasSpecial = RegExp(r'[^A-Za-z0-9]').hasMatch(password);
  final categoryCount = [hasLower, hasUpper, hasDigit, hasSpecial].where((v) => v).length;
  final minLength = password.length >= 8;
  final meetsCategoryRule = categoryCount >= 3;

  return PasswordPolicyChecks(
    minLength: minLength,
    hasLower: hasLower,
    hasUpper: hasUpper,
    hasDigit: hasDigit,
    hasSpecial: hasSpecial,
    categoryCount: categoryCount,
    meetsCategoryRule: meetsCategoryRule,
    isStrong: minLength && meetsCategoryRule,
  );
}

bool isStrongPassword(String password) => getPasswordPolicyChecks(password).isStrong;

const passwordPolicyIntro =
    'Password must be at least 8 characters and include at least three of: lowercase, uppercase, numbers, and special characters.';
