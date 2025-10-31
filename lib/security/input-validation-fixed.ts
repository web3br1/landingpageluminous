// Input validation utilities for security
// Provides additional validation beyond Zod schemas for enhanced security

import { z } from "zod";

import {
  SUSPICIOUS_PATTERNS,
  SQL_INJECTION_PATTERNS,
  XSS_PATTERNS,
} from "@/lib/core/regex-patterns";

// Rate limiting for input validation (per IP per minute)
const validationRateLimit = new Map<
  string,
  { count: number; resetTime: number }
>();
const VALIDATION_RATE_LIMIT = 100; // requests per minute
const VALIDATION_WINDOW_MS = 60 * 1000; // 1 minute

// Security threat detection functions
export function checkSecurityThreats(input: string): string[] {
  const threats: string[] = [];

  // Check for common attack patterns
  const attackPatterns = [
    /\b(script|javascript|vbscript|onload|onerror)\b/i,
    /\b(eval|exec|system|shell_exec)\b/i,
    /\b(unescape|decodeURIComponent)\b/i,
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:[^"']*/gi,
  ];

  for (const pattern of attackPatterns) {
    if (pattern.test(input)) {
      threats.push(`Potential security threat detected: ${pattern.source}`);
    }
  }

  return threats;
}

export function checkSQLInjection(input: string): string[] {
  const sqlPatterns = [
    /(\b(union|select|insert|delete|update|drop|create|alter)\b.*\b(select|from|where|into)\b)/i,
    /('|--|#|\/\*.*\*\/)/i,
    /(\bor\b.*\b=\b.*\bor\b)/i,
    /[-=!<>+* |&;(){}[\]?$`'"\\/]/i,
  ];

  const issues: string[] = [];
  for (const pattern of sqlPatterns) {
    if (pattern.test(input)) {
      issues.push(`Potential SQL injection pattern: ${pattern.source}`);
    }
  }

  return issues;
}

export function checkXSS(input: string): string[] {
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:[^"']*/gi,
    /vbscript:[^"']*/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
    /onclick\s*=/gi,
    /<iframe[^>]*>/gi,
    /<object[^>]*>/gi,
    /<embed[^>]*>/gi,
  ];

  const issues: string[] = [];
  for (const pattern of xssPatterns) {
    if (pattern.test(input)) {
      issues.push(`Potential XSS pattern: ${pattern.source}`);
    }
  }

  return issues;
}

export function sanitizeInput(input: string, options: { maxLength?: number } = {}): string {
  let sanitized = input;

  // Remove potentially dangerous HTML tags
  sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');
  sanitized = sanitized.replace(/javascript:[^"']*/gi, '');
  sanitized = sanitized.replace(/vbscript:[^"']*/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  // Apply length limits
  if (options.maxLength && sanitized.length > options.maxLength) {
    sanitized = sanitized.substring(0, options.maxLength);
  }

  return sanitized;
}

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
  let riskLevel: "low" | "medium" | "high" | "critical" = "low";
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
    case "email": {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(input)) {
        errors.push("Invalid email format");
        riskLevel = "medium";
      }
      break;
    }

    case "url": {
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
    }

    case "phone": {
      const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
      const cleanPhone = input.replace(/[\s\-(.].]/g, "");
      if (!phoneRegex.test(cleanPhone)) {
        errors.push("Invalid phone number format");
      }
      sanitized = cleanPhone;
      break;
    }

    case "name": {
      const nameRegex = /^[a-zA-Z\s-'.]+$/;
      if (!nameRegex.test(input)) {
        errors.push("Name contains invalid characters");
        riskLevel = "medium";
      }
      break;
    }
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
  if (options.sanitize !== false) {
    sanitized = sanitizeInput(input, options);
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
    .email()
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
  return z.string().transform((val, ctx) => {
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
