/**
 * Validate and sanitize a string input.
 * Trims whitespace, checks for empty and max length.
 *
 * @param value     - Raw string value.
 * @param fieldName - Human-readable field name (used in error messages).
 * @param maxLength - Maximum allowed length (default 500).
 * @returns The trimmed string.
 * @throws Error if validation fails.
 */
export function validateString(
  value: string,
  fieldName: string,
  maxLength: number = 500,
): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error(`${fieldName} is required.`);
  }
  if (trimmed.length > maxLength) {
    throw new Error(`${fieldName} must be ${maxLength} characters or less.`);
  }
  return trimmed;
}
