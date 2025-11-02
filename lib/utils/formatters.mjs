/**
 * Centralized formatting utilities (ESM version for scripts)
 * Consolidates all formatting functions from across the codebase
 */

/**
 * Format bytes to human readable format
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted string (e.g., "1.5 KB", "2 MB")
 */
export function formatBytes(bytes) {
  const sizes = ["Bytes", "KB", "MB", "GB"];
  if (bytes === 0) return "0 Bytes";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Format currency values with locale support
 * @param {number} value - Numeric value to format
 * @param {string} currency - Currency code (default: "BRL")
 * @param {string} locale - Locale string (default: "pt-BR")
 * @returns {string} Formatted currency string
 */
export function formatCurrency(
  value,
  currency = "BRL",
  locale = "pt-BR",
) {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(value);
}

/**
 * Format numbers with locale support
 * @param {number} value - Numeric value to format
 * @param {string} locale - Locale string (default: "pt-BR")
 * @param {Intl.NumberFormatOptions} options - Intl.NumberFormat options
 * @returns {string} Formatted number string
 */
export function formatNumber(
  value,
  locale = "pt-BR",
  options,
) {
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Format dates with locale support
 * @param {Date|string|number} date - Date to format
 * @param {string} locale - Locale string (default: "pt-BR")
 * @param {Intl.DateTimeFormatOptions} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDate(
  date,
  locale = "pt-BR",
  options,
) {
  const dateObj = new Date(date);
  return new Intl.DateTimeFormat(locale, options).format(dateObj);
}
