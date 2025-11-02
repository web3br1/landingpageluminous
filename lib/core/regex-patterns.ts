/**
 * Centralized regex patterns and validation utilities
 * Consolidates all regex patterns used across the application
 */

// ===== EMAIL PATTERNS =====

/**
 * Basic email regex - RFC 5322 compliant but simplified
 * Use for basic validation; for production, consider using a proper email validation library
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * More comprehensive email regex (RFC 5322 compliant)
 * More accurate but slower - use when performance isn't critical
 */
export const EMAIL_REGEX_STRICT =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

// ===== BRAZILIAN DOCUMENT PATTERNS =====

/**
 * CPF pattern (Brazilian individual tax ID)
 * Format: XXX.XXX.XXX-XX
 */
export const CPF_REGEX = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;

/**
 * CNPJ pattern (Brazilian company tax ID)
 * Format: XX.XXX.XXX/XXXX-XX
 */
export const CNPJ_REGEX = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;

/**
 * Raw CPF pattern (only numbers)
 * Format: XXXXXXXXXXX (11 digits)
 */
export const CPF_RAW_REGEX = /^\d{11}$/;

/**
 * Raw CNPJ pattern (only numbers)
 * Format: XXXXXXXXXXXXXXX (14 digits)
 */
export const CNPJ_RAW_REGEX = /^\d{14}$/;

// ===== PHONE NUMBER PATTERNS =====

/**
 * Brazilian phone number pattern with formatting
 * Format: (XX) XXXXX-XXXX or (XX) XXXX-XXXX
 */
export const PHONE_BR_REGEX = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;

/**
 * Brazilian phone number pattern (raw, only numbers)
 * Format: XXXXXXXXXXX or XXXXXXXXXX
 */
export const PHONE_BR_RAW_REGEX = /^\d{10,11}$/;

/**
 * International phone number pattern (E.164)
 * Format: +XXXXXXXXXXXX
 */
export const PHONE_INTERNATIONAL_REGEX = /^\+\d{1,4}\d{6,14}$/;

// ===== ADDRESS PATTERNS =====

/**
 * Brazilian ZIP code (CEP) pattern
 * Format: XXXXX-XXX
 */
export const CEP_REGEX = /^\d{5}-\d{3}$/;

/**
 * Brazilian state code pattern
 * Format: XX (uppercase)
 */
export const STATE_REGEX = /^[A-Z]{2}$/;

// ===== SECURITY PATTERNS =====

/**
 * SQL injection detection patterns
 */
export const SQL_INJECTION_PATTERNS = [
  /(\b(union|select|insert|delete|update|drop|create|alter|exec|execute)\b)/gi,
  /('|(\\x27)|(\\x2D\\x2D)|(--)|(#)|(%27)|(%22)|(%23))/gi,
  /(\\x27|\\x2D\\x2D|%27|%22|%23)/gi,
];

/**
 * XSS attack detection patterns
 */
export const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:[^"']*/gi,
  /on\w+\s*=\s*["'][^"']*["']/gi,
  /<iframe[^>]*src[^>]*>/gi,
  /<object[^>]*data[^>]*>/gi,
  /<embed[^>]*src[^>]*>/gi,
  /expression\s*\([^)]*\)/gi,
  /vbscript:[^"']*/gi,
  /data:text\/html[^"']*/gi,
];

/**
 * General suspicious patterns for input sanitization
 */
export const SUSPICIOUS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi, // Script tags
  /javascript:/gi, // JavaScript URLs
  /on\w+\s*=/gi, // Event handlers
  /<iframe[^>]*>.*?<\/iframe>/gi, // Iframes
  /<object[^>]*>.*?<\/object>/gi, // Objects
  /<embed[^>]*>.*?<\/embed>/gi, // Embeds
  /data:text\/html/gi, // Data URLs
  /vbscript:/gi, // VBScript
  /expression\s*\(/gi, // CSS expressions
  /<\s*meta[^>]*http-equiv[^>]*>/gi, // Meta redirects
];

// ===== VALIDATION PATTERNS =====

/**
 * Password strength pattern
 * Requires: at least one lowercase, one uppercase, one digit
 */
export const PASSWORD_STRENGTH_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

/**
 * Name pattern (allows letters, spaces, hyphens, apostrophes)
 * Supports international characters (Latin-1 Supplement)
 */
export const NAME_REGEX = /^[a-zA-ZÀ-ÿ\s\-']+$/;

/**
 * Safe filename pattern (no special characters that could cause issues)
 */
export const SAFE_FILENAME_REGEX = /^[^<>\"'&]*$/;

/**
 * URL pattern (basic validation)
 */
export const URL_REGEX = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

/**
 * API endpoint pattern
 */
export const API_ENDPOINT_REGEX = /^\/[a-zA-Z0-9\-_\/]*$/;

// ===== UTILITY FUNCTIONS =====

/**
 * Check if a string matches any of the given patterns
 */
export function matchesAnyPattern(input: string, patterns: RegExp[]): boolean {
  return patterns.some(pattern => pattern.test(input));
}

/**
 * Remove all matches of given patterns from input
 */
export function sanitizeWithPatterns(input: string, patterns: RegExp[]): string {
  let result = input;
  for (const pattern of patterns) {
    result = result.replace(pattern, '');
  }
  return result;
}

/**
 * Validate Brazilian CPF checksum
 */
export function validateCpfChecksum(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, "");

  // Check length
  if (cleaned.length !== 11) return false;

  // Check for repeated digits
  if (/^(\d)\1+$/.test(cleaned)) return false;

  // CPF validation algorithm
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * (10 - i);
  }

  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cleaned[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]) * (11 - i);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;

  return remainder === parseInt(cleaned[10]);
}

/**
 * Validate Brazilian CNPJ checksum
 */
export function validateCnpjChecksum(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, "");

  // Check length
  if (cleaned.length !== 14) return false;

  // Check for repeated digits
  if (/^(\d)\1+$/.test(cleaned)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned[i]) * weights1[i];
  }

  let remainder = sum % 11;
  if (remainder < 2) remainder = 0;
  else remainder = 11 - remainder;

  if (remainder !== parseInt(cleaned[12])) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned[i]) * weights2[i];
  }

  remainder = sum % 11;
  if (remainder < 2) remainder = 0;
  else remainder = 11 - remainder;

  return remainder === parseInt(cleaned[13]);
}
