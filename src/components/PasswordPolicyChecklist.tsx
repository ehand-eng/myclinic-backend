import { getPasswordPolicyChecks, PASSWORD_POLICY_INTRO } from '@/lib/passwordPolicy';
import { cn } from '@/lib/utils';

type PasswordPolicyChecklistProps = {
  password: string;
  className?: string;
  /** When false, still shows the intro until the user starts typing */
  showWhenEmpty?: boolean;
};

const ruleClass = (met: boolean) => (met ? 'text-green-600' : 'text-gray-500');

export function PasswordPolicyChecklist({
  password,
  className,
  showWhenEmpty = true,
}: PasswordPolicyChecklistProps) {
  if (!showWhenEmpty && !password) {
    return null;
  }

  const checks = getPasswordPolicyChecks(password);

  return (
    <div className={cn('mt-1 text-xs text-gray-600 space-y-1', className)}>
      <p>{PASSWORD_POLICY_INTRO}</p>
      <ul className="space-y-0.5">
        <li className={ruleClass(checks.minLength)}>• At least 8 characters</li>
        <li className={ruleClass(checks.hasLower)}>• Contains a lowercase letter</li>
        <li className={ruleClass(checks.hasUpper)}>• Contains an uppercase letter</li>
        <li className={ruleClass(checks.hasDigit)}>• Contains a number</li>
        <li className={ruleClass(checks.hasSpecial)}>• Contains a special character</li>
        <li className={ruleClass(checks.meetsCategoryRule)}>
          • Uses at least three of the character types above ({checks.categoryCount}/4)
        </li>
        <li className={ruleClass(checks.isStrong)}>• Password meets all requirements</li>
      </ul>
    </div>
  );
}
