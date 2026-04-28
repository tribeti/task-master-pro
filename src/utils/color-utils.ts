/**
 * Determines whether to use black or white text based on the background color's luminance.
 * Handles both 3-digit and 6-digit hex formats, with or without leading '#'.
 * 
 * @param hexColor The hex color string (e.g., "#FFF", "FF0000")
 * @returns "text-slate-900" for light backgrounds, "text-white" for dark backgrounds
 */
export function getContrastColor(hexColor: string | null): string {
  if (!hexColor) return "text-slate-900";

  let color = hexColor.replace("#", "").toUpperCase();

  // Handle 3-digit hex: expand to 6 digits (e.g., "F00" -> "FF0000")
  if (color.length === 3) {
    color = color
      .split("")
      .map((char) => char + char)
      .join("");
  }

  // Validate final length
  if (color.length !== 6) {
    return "text-slate-900";
  }

  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);

  // If parsing fails
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return "text-slate-900";
  }

  // Standard luminance formula (ITU-R BT.709)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.6 ? "text-slate-900" : "text-white";
}
