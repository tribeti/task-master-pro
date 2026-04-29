export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Validate and sanitize a string input.
 * Trims whitespace, checks for empty and max length.
 *
 * @param value     - Raw string value.
 * @param fieldName - Human-readable field name (used in error messages).
 * @param maxLength - Maximum allowed length (default 500).
 * @returns The trimmed string.
 * @throws ValidationError if validation fails.
 */
export function validateString(
  value: string,
  fieldName: string,
  maxLength: number = 500,
): string {
  if (typeof value !== "string") {
    throw new ValidationError(`${fieldName} must be a string.`);
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new ValidationError(`${fieldName} is required.`);
  }
  if (trimmed.length > maxLength) {
    throw new ValidationError(`${fieldName} must be ${maxLength} characters or less.`);
  }
  return trimmed;
}
