export type PasswordPolicyChecks = {
  minLength: boolean;
  hasLower: boolean;
  hasUpper: boolean;
  hasDigit: boolean;
  hasSpecial: boolean;
  categoryCount: number;
  meetsCategoryRule: boolean;
  isStrong: boolean;
};

export function getPasswordPolicyChecks(password: string): PasswordPolicyChecks {
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const categoryCount = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;
  const minLength = password.length >= 8;
  const meetsCategoryRule = categoryCount >= 3;

  return {
    minLength,
    hasLower,
    hasUpper,
    hasDigit,
    hasSpecial,
    categoryCount,
    meetsCategoryRule,
    isStrong: minLength && meetsCategoryRule,
  };
}

export function isStrongPassword(password: string): boolean {
  return getPasswordPolicyChecks(password).isStrong;
}

export const PASSWORD_POLICY_INTRO =
  'Password must be at least 8 characters and include at least three of: lowercase, uppercase, numbers, and special characters.';
