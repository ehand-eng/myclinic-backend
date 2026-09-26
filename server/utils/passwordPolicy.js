const PASSWORD_RULE_MESSAGE =
  'Password must be at least 8 characters and include at least three of the following: lowercase letters, uppercase letters, numbers, and special characters.';

function isStrongPassword(password) {
  if (typeof password !== 'string') return false;
  if (password.length < 8) return false;

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const categories = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;

  return categories >= 3;
}

/** Sends 400 response if password is weak. Returns true when response was sent. */
function rejectWeakPassword(password, res) {
  if (isStrongPassword(password)) {
    return false;
  }
  res.status(400).json({ message: PASSWORD_RULE_MESSAGE });
  return true;
}

/** Validates only when password is a non-empty string. Returns true when response was sent. */
function rejectWeakPasswordIfProvided(password, res) {
  if (password === undefined || password === null || password === '') {
    return false;
  }
  return rejectWeakPassword(password, res);
}

module.exports = {
  PASSWORD_RULE_MESSAGE,
  isStrongPassword,
  rejectWeakPassword,
  rejectWeakPasswordIfProvided,
};
