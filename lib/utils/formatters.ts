/**
 * Centralized formatting utilities
 * Consolidates all formatting functions from across the codebase
 */

/**
 * Format bytes to human readable format
 * @param bytes - Number of bytes
 * @returns Formatted string (e.g., "1.5 KB", "2 MB")
 */
export function formatBytes(bytes: number): string {
  const sizes = ["Bytes", "KB", "MB", "GB"];
  if (bytes === 0) return "0 Bytes";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Format currency values with locale support
 * @param value - Numeric value to format
 * @param currency - Currency code (default: "BRL")
 * @param locale - Locale string (default: "pt-BR")
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number,
  currency: string = "BRL",
  locale: string = "pt-BR",
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(value);
}

/**
 * Format numbers with locale support
 * @param value - Numeric value to format
 * @param locale - Locale string (default: "pt-BR")
 * @param options - Intl.NumberFormat options
 * @returns Formatted number string
 */
export function formatNumber(
  value: number,
  locale: string = "pt-BR",
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Format dates with locale support
 * @param date - Date to format
 * @param locale - Locale string (default: "pt-BR")
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | number,
  locale: string = "pt-BR",
  options?: Intl.DateTimeFormatOptions,
): string {
  const dateObj = new Date(date);
  return new Intl.DateTimeFormat(locale, options).format(dateObj);
}
