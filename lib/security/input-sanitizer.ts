/**
 * Input Sanitization and Validation System
 * Simple and effective sanitization using DOMPurify
 */

import DOMPurify from 'dompurify';

// Configure DOMPurify for landing page content
const purifyConfig = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3',
    'ul', 'ol', 'li', 'blockquote', 'a'
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
  FORBID_ATTR: ['onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout']
};

/**
 * Sanitize HTML input using DOMPurify
 */
function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, purifyConfig);
}

/**
 * Sanitize plain text input (remove HTML tags completely)
 */
function sanitizeText(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] });
}

/**
 * Main input sanitizer class - simplified version
 */
export class InputSanitizer {
  /**
   * Sanitize HTML content
   */
  static sanitizeHTML(input: string): string {
    return sanitizeHTML(input);
  }

  /**
   * Sanitize text content (remove all HTML)
   */
  static sanitizeText(input: string): string {
    return sanitizeText(input);
  }

  /**
   * Check if input contains potentially dangerous content
   */
  static hasDangerousContent(input: string): boolean {
    const dangerous = /<script|<iframe|<object|<embed|javascript:|vbscript:/i;
    return dangerous.test(input);
  }

  /**
   * Sanitize generic text input with length limit
   */
  static sanitizeGenericText(input: string, maxLength: number = 500): string {
    if (!input || typeof input !== 'string') return '';
    const sanitized = sanitizeText(input);
    return sanitized.length > maxLength ? sanitized.substring(0, maxLength) : sanitized;
  }

  /**
   * Check if input contains suspicious content
   */
  static containsSuspiciousContent(input: string): boolean {
    if (!input || typeof input !== 'string') return false;

    const suspicious = [
      /<script|<iframe|<object|<embed|<form|javascript:|vbscript:|onload=|onerror=|onclick=/i,
      /\b(eval|alert|confirm|prompt)\s*\(/i,
      /<.*>.*<\/.*>/i, // Basic HTML tags
      /&#\d+;/i, // HTML entities
      /\b(unescape|decodeURI|decodeURIComponent|atob|btoa)\s*\(/i
    ];

    return suspicious.some(pattern => pattern.test(input));
  }
}

/**
 * Input validator class - simplified version
 */
export class InputValidator {
  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate URL format
   */
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  }

  /**
   * Check if text length is within limits
   */
  static isValidLength(text: string, min: number = 0, max: number = 10000): boolean {
    return text.length >= min && text.length <= max;
  }
}

/**
 * Security headers class - simplified version
 */
export class SecurityHeaders {
  /**
   * Get basic security headers
   */
  static getBasicHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    };
  }

  /**
   * Get comprehensive security headers
   */
  static getSecurityHeaders(): Record<string, string> {
    return {
      ...this.getBasicHeaders(),
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;",
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    };
  }

  /**
   * Sanitize header value for safe output
   */
  static sanitizeHeaderValue(value: string): string {
    if (!value || typeof value !== 'string') return '';

    // Remove control characters and null bytes
    return value.replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim();
  }
}

/**
 * Secure error handler - simplified version
 */
export class SecureErrorHandler {
  /**
   * Create a safe error message
   */
  static createSafeError(error: any): string {
    // Never expose internal error details
    return 'An error occurred. Please try again.';
  }

  /**
   * Log error securely (without sensitive data)
   */
  static logSecureError(error: any, context: string): void {
    console.error(`[${context}] Error:`, error?.message || 'Unknown error');
  }

  /**
   * Log error securely with additional context
   */
  static logErrorSecurely(error: Error, context?: any): void {
    const safeContext = typeof context === 'string' ? context : 'unknown';
    this.logSecureError(error, safeContext);
  }

  /**
   * Create safe error response for HTTP
   */
  static createSafeErrorResponse(error: Error): { status: number; message: string; code: string } {
    return {
      status: 500,
      message: 'An internal error occurred',
      code: 'INTERNAL_ERROR'
    };
  }
}

/**
 * Main sanitize function - backward compatibility
 */
export function sanitizeInput(input: string): string {
  return sanitizeHTML(input);
}

/**
 * Check if input has no script tags - simplified version
 */
export function validateNoScript(input: string): boolean {
  return !/<script|<iframe|<object|<embed|javascript:|vbscript:/i.test(input);
}
