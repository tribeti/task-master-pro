/**
 * Shared auth validation utilities.
 * Single source of truth for password rules and email format checks.
 */

// ── Password validation ──────────────────────────────────

export const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 6, label: "Ít nhất 6 ký tự" },
  { test: (p: string) => /[0-9]/.test(p), label: "Ít nhất 1 số" },
];

/**
 * Validates a password against all rules.
 * @returns Error message string if invalid, or `null` if valid.
 */
export function validatePassword(password: string): string | null {
  for (const rule of PASSWORD_RULES) {
    if (!rule.test(password)) {
      return `Mật khẩu cần: ${rule.label}`;
    }
  }
  return null;
}

// ── Email validation ─────────────────────────────────────

/**
 * Checks whether the given string is a valid email format.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
