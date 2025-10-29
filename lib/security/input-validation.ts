// Input validation utilities for security
// Provides additional validation beyond Zod schemas for enhanced security

import { z } from "zod";

// Common attack patterns to detect
const SUSPICIOUS_PATTERNS = [
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

// SQL injection patterns
const SQL_INJECTION_PATTERNS = [
  /(\b(union|select|insert|delete|update|drop|create|alter|exec|execute)\b)/gi,
  /('|(\\x27)|(\\x2D\\x2D)|(\-\-)|(\#)|(\%27)|(\%22)|(\%23))/gi,
  /(\\x27|\\x2D\\x2D|%27|%22|%23)/gi,
];

// XSS patterns
const XSS_PATTERNS = [
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

// Rate limiting for input validation (per IP per minute)
const validationRateLimit = new Map<
  string,
  { count: number; resetTime: number }
>();
const VALIDATION_RATE_LIMIT = 100; // requests per minute
const VALIDATION_WINDOW_MS = 60 * 1000; // 1 minute

function checkValidationRateLimit(identifier: string): boolean {
  const now = Date.now();
  const clientData = validationRateLimit.get(identifier);

  if (!clientData || now > clientData.resetTime) {
    validationRateLimit.set(identifier, {
      count: 1,
      resetTime: now + VALIDATION_WINDOW_MS,
    });
    return true;
  }

  if (clientData.count >= VALIDATION_RATE_LIMIT) {
    return false;
  }

  clientData.count++;
  return true;
}

// Clean expired validation rate limit entries
setInterval(
  () => {
    const now = Date.now();
    for (const [ip, data] of validationRateLimit.entries()) {
      if (now > data.resetTime) {
        validationRateLimit.delete(ip);
      }
    }
  },
  5 * 60 * 1000,
); // Clean every 5 minutes

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: string;
  riskLevel: "low" | "medium" | "high" | "critical";
}

export interface ValidationOptions {
  maxLength?: number;
  minLength?: number;
  allowHtml?: boolean;
  allowUrls?: boolean;
  allowEmails?: boolean;
  allowPhoneNumbers?: boolean;
  sanitize?: boolean;
  checkRateLimit?: boolean;
  identifier?: string;
}

/**
 * Enhanced input validation with security checks
 */
export function validateSecureInput(
  input: string,
  type: "text" | "email" | "url" | "phone" | "name" | "message",
  options: ValidationOptions = {},
): ValidationResult {
  const errors: string[] = [];
  let riskLevel: "low" | "medium" | "high" | "critical" = "low" as
    | "low"
    | "medium"
    | "high"
    | "critical";
  let sanitized = input;

  // Rate limiting check
  if (options.checkRateLimit && options.identifier) {
    if (!checkValidationRateLimit(options.identifier)) {
      return {
        isValid: false,
        errors: ["Rate limit exceeded. Please try again later."],
        riskLevel: "high",
      };
    }
  }

  // Basic length checks
  if (options.maxLength && input.length > options.maxLength) {
    errors.push(
      `Input exceeds maximum length of ${options.maxLength} characters`,
    );
    riskLevel = "medium";
  }

  if (options.minLength && input.length < options.minLength) {
    errors.push(`Input must be at least ${options.minLength} characters long`);
  }

  // Type-specific validation
  switch (type) {
    case "email":
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(input)) {
        errors.push("Invalid email format");
        riskLevel = "medium";
      }
      break;

    case "url":
      try {
        const url = new URL(input);
        if (!["http:", "https:"].includes(url.protocol)) {
          errors.push("URL must use HTTP or HTTPS protocol");
          riskLevel = "high";
        }
      } catch {
        errors.push("Invalid URL format");
        riskLevel = "high";
      }
      break;

    case "phone":
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      const cleanPhone = input.replace(/[\s\-\(\)\.]/g, "");
      if (!phoneRegex.test(cleanPhone)) {
        errors.push("Invalid phone number format");
      }
      sanitized = cleanPhone;
      break;

    case "name":
      const nameRegex = /^[a-zA-Z\s\-'\.]+$/;
      if (!nameRegex.test(input)) {
        errors.push("Name contains invalid characters");
        riskLevel = "medium";
      }
      break;
  }

  // Security checks
  const securityIssues = checkSecurityThreats(input);
  if (securityIssues.length > 0) {
    errors.push(
      ...securityIssues.map((issue) => `Security threat detected: ${issue}`),
    );
    riskLevel = riskLevel === "critical" ? "critical" : "high";
  }

  // SQL injection checks
  const sqlIssues = checkSQLInjection(input);
  if (sqlIssues.length > 0) {
    errors.push(
      ...sqlIssues.map((issue) => `SQL injection attempt detected: ${issue}`),
    );
    riskLevel = "critical";
  }

  // XSS checks
  const xssIssues = checkXSS(input);
  if (xssIssues.length > 0) {
    errors.push(...xssIssues.map((issue) => `XSS attempt detected: ${issue}`));
    riskLevel = "critical";
  }

  // Sanitization
  if (options.sanitize && sanitized === input) {
    sanitized = sanitizeInput(input, options);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: sanitized !== input ? sanitized : undefined,
    riskLevel,
  };
}

function checkSecurityThreats(input: string): string[] {
  const threats: string[] = [];

  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(input)) {
      threats.push(`Suspicious pattern detected: ${pattern.source}`);
    }
  }

  return threats;
}

function checkSQLInjection(input: string): string[] {
  const threats: string[] = [];

  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      threats.push(`SQL injection pattern: ${pattern.source}`);
    }
  }

  return threats;
}

function checkXSS(input: string): string[] {
  const threats: string[] = [];

  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(input)) {
      threats.push(`XSS pattern: ${pattern.source}`);
    }
  }

  return threats;
}

function sanitizeInput(input: string, options: ValidationOptions): string {
  let sanitized = input;

  // Remove HTML tags if not allowed
  if (!options.allowHtml) {
    sanitized = sanitized.replace(/<[^>]*>/g, "");
  }

  // Remove JavaScript URLs
  if (!options.allowUrls) {
    sanitized = sanitized.replace(/javascript:[^"'\s]*/gi, "");
  }

  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");

  // Trim whitespace
  sanitized = sanitized.trim();

  return sanitized;
}

// Zod schema with enhanced security validation
export function secureStringSchema(options: ValidationOptions = {}) {
  return z.string().transform((val, ctx) => {
    const validation = validateSecureInput(val, "text", options);

    if (!validation.isValid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: validation.errors.join("; "),
      });
      return z.NEVER;
    }

    return validation.sanitized || val;
  });
}

export function secureEmailSchema(options: ValidationOptions = {}) {
  return z
    .string()
    .email("Invalid email format")
    .transform((val, ctx) => {
      const validation = validateSecureInput(val, "email", options);

      if (!validation.isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: validation.errors.join("; "),
        });
        return z.NEVER;
      }

      return validation.sanitized || val;
    });
}

export function secureUrlSchema(options: ValidationOptions = {}) {
  return z
    .string()
    .url("Invalid URL format")
    .transform((val, ctx) => {
      const validation = validateSecureInput(val, "url", options);

      if (!validation.isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: validation.errors.join("; "),
        });
        return z.NEVER;
      }

      return validation.sanitized || val;
    });
}

// Utility function to log security events
export function logSecurityEvent(
  event: string,
  details: Record<string, unknown>,
  riskLevel: "low" | "medium" | "high" | "critical",
): void {
  const logger = console; // In production, use proper logger

  const logLevel =
    riskLevel === "critical" ? "error" : riskLevel === "high" ? "warn" : "info";

  logger[logLevel](`[Security] ${event}`, {
    riskLevel,
    timestamp: new Date().toISOString(),
    ...details,
  });
}
