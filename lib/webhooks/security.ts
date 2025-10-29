/**
 * Webhook Security Module - Fase 3
 * Rate limiting, security hardening e audit logging para webhooks
 */

import { logger } from "../observability/logger";
import { metrics } from "../observability/metrics";
import { WebhookEventInput, WebhookEvent } from "./types";

/**
 * Rate Limiter Implementation
 */
export class WebhookRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private blockedIPs: Set<string> = new Set();
  private blockedUntil: Map<string, number> = new Map();

  constructor(
    private config: {
      requestsPerMinute: number;
      blockDurationMs: number;
      maxBlocks: number;
    } = {
      requestsPerMinute: 100,
      blockDurationMs: 15 * 60 * 1000, // 15 minutes
      maxBlocks: 10,
    },
  ) {
    // Cleanup old requests every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  /**
   * Check if request is allowed
   */
  isAllowed(identifier: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const windowStart = now - 60 * 1000; // 1 minute window

    // Check if IP is blocked
    if (this.blockedIPs.has(identifier)) {
      const blockedUntil = this.blockedUntil.get(identifier) || 0;
      if (now < blockedUntil) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: blockedUntil,
        };
      } else {
        // Unblock expired
        this.blockedIPs.delete(identifier);
        this.blockedUntil.delete(identifier);
      }
    }

    // Get or create request history
    let requests = this.requests.get(identifier) || [];

    // Remove old requests outside the window
    requests = requests.filter((timestamp) => timestamp > windowStart);

    const currentCount = requests.length;
    const remaining = Math.max(0, this.config.requestsPerMinute - currentCount);
    const allowed = currentCount < this.config.requestsPerMinute;

    if (allowed) {
      // Add current request
      requests.push(now);
      this.requests.set(identifier, requests);
    } else {
      // Block the IP
      this.blockIP(identifier);
    }

    return {
      allowed,
      remaining: allowed ? remaining - 1 : 0,
      resetTime: windowStart + 60 * 1000,
    };
  }

  /**
   * Block an IP address
   */
  private blockIP(identifier: string): void {
    const now = Date.now();
    this.blockedIPs.add(identifier);
    this.blockedUntil.set(identifier, now + this.config.blockDurationMs);

    // Clean up old requests for this identifier
    this.requests.delete(identifier);

    metrics.incrementCounter("webhook_rate_limit_blocked_total", 1);

    logger.warn(`IP blocked due to rate limiting`, {
      identifier,
      blockedUntil: new Date(now + this.config.blockDurationMs).toISOString(),
      blockDurationMs: this.config.blockDurationMs,
    });
  }

  /**
   * Get rate limit statistics
   */
  getStats() {
    const now = Date.now();
    const activeBlocks = Array.from(this.blockedIPs).filter((ip) => {
      const blockedUntil = this.blockedUntil.get(ip) || 0;
      return now < blockedUntil;
    }).length;

    return {
      totalIdentifiers: this.requests.size,
      blockedIPs: activeBlocks,
      requestsLastMinute: Array.from(this.requests.values()).reduce(
        (sum, reqs) => sum + reqs.length,
        0,
      ),
    };
  }

  /**
   * Cleanup old data
   */
  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - 60 * 1000;

    // Remove old request histories
    for (const [identifier, requests] of this.requests.entries()) {
      const filtered = requests.filter((timestamp) => timestamp > windowStart);
      if (filtered.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, filtered);
      }
    }

    // Remove expired blocks
    for (const [identifier, blockedUntil] of this.blockedUntil.entries()) {
      if (now >= blockedUntil) {
        this.blockedIPs.delete(identifier);
        this.blockedUntil.delete(identifier);
      }
    }
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.requests.clear();
    this.blockedIPs.clear();
    this.blockedUntil.clear();
  }
}

/**
 * Input Sanitizer
 */
export class WebhookInputSanitizer {
  constructor(
    private config: {
      maxPayloadSize: number;
      allowedContentTypes: string[];
      sanitizeHeaders: boolean;
    } = {
      maxPayloadSize: 1024 * 1024, // 1MB
      allowedContentTypes: ["application/json"],
      sanitizeHeaders: true,
    },
  ) {}

  /**
   * Sanitize webhook input
   */
  sanitize(input: WebhookEventInput): {
    sanitized: WebhookEventInput;
    warnings: string[];
  } {
    const warnings: string[] = [];
    const sanitized = { ...input };

    // Check payload size
    if (input.rawBody.length > this.config.maxPayloadSize) {
      throw new Error(
        `Payload size ${input.rawBody.length} exceeds maximum ${this.config.maxPayloadSize}`,
      );
    }

    // Validate and sanitize IP address
    if (input.ipAddress) {
      const sanitizedIP = this.sanitizeIP(input.ipAddress);
      if (sanitizedIP !== input.ipAddress) {
        warnings.push("IP address was sanitized");
      }
      sanitized.ipAddress = sanitizedIP;
    }

    // Sanitize user agent
    if (input.userAgent && this.config.sanitizeHeaders) {
      sanitized.userAgent = this.sanitizeUserAgent(input.userAgent);
    }

    // Validate signature format
    if (!this.isValidSignatureFormat(input.signature)) {
      throw new Error("Invalid signature format");
    }

    return { sanitized, warnings };
  }

  /**
   * Sanitize IP address
   */
  private sanitizeIP(ip: string): string {
    // Basic IP sanitization - remove any potentially malicious characters
    return ip.replace(/[<>'"&]/g, "").trim();
  }

  /**
   * Sanitize user agent string
   */
  private sanitizeUserAgent(userAgent: string): string {
    // Remove potentially dangerous characters
    return userAgent.replace(/[<>'"&\n\r\t]/g, "").trim();
  }

  /**
   * Validate signature format (basic check)
   */
  private isValidSignatureFormat(signature: string): boolean {
    // Basic validation - should be a reasonable length string
    return (
      typeof signature === "string" &&
      signature.length > 10 &&
      signature.length < 1000 &&
      /^[a-zA-Z0-9+/=._-]+$/i.test(signature)
    );
  }
}

/**
 * Audit Logger for Webhooks
 */
export class WebhookAuditLogger {
  constructor(
    private config: {
      logAllRequests: boolean;
      logFailedRequests: boolean;
      logRateLimited: boolean;
      sensitiveFields: string[];
    } = {
      logAllRequests: false,
      logFailedRequests: true,
      logRateLimited: true,
      sensitiveFields: ["signature", "rawBody"],
    },
  ) {}

  /**
   * Log webhook request
   */
  logRequest(
    input: WebhookEventInput,
    action: "received" | "accepted" | "rejected" | "rate_limited" | "error",
    details?: any,
  ): void {
    const shouldLog = this.shouldLog(action);

    if (!shouldLog) return;

    const logData: any = {
      action,
      provider: input.provider,
      timestamp: new Date().toISOString(),
      ipAddress: this.maskSensitive(input.ipAddress),
      userAgent: this.maskSensitive(input.userAgent),
      bodyLength: input.rawBody?.length || 0,
    };

    // Add details if provided
    if (details) {
      logData.details = this.sanitizeDetails(details);
    }

    // Add correlation ID if available
    if (details?.correlationId) {
      logData.correlationId = details.correlationId;
    }

    const logLevel =
      action === "error"
        ? "error"
        : action === "rate_limited"
          ? "warn"
          : "info";

    logger[logLevel](`Webhook audit: ${action}`, logData);

    // Additional metrics
    metrics.incrementCounter(`webhook_audit_${action}_total`, 1, {
      provider: input.provider,
    });
  }

  /**
   * Log webhook processing
   */
  logProcessing(
    event: WebhookEvent,
    action: "started" | "completed" | "failed" | "retried" | "dead_letter",
    details?: any,
  ): void {
    const logData: any = {
      action,
      eventId: event.id,
      eventType: event.eventType,
      provider: event.provider,
      correlationId: event.metadata.correlationId,
      attempts: event.processing.attempts,
      processingTimeMs: event.processing.processingTimeMs,
    };

    // Add details if provided
    if (details) {
      logData.details = this.sanitizeDetails(details);
    }

    const logLevel =
      action === "failed" || action === "dead_letter" ? "error" : "info";

    logger[logLevel](`Webhook processing audit: ${action}`, logData);

    // Additional metrics
    metrics.incrementCounter(`webhook_processing_audit_${action}_total`, 1, {
      provider: event.provider,
      event_type: event.eventType,
    });
  }

  /**
   * Determine if request should be logged
   */
  private shouldLog(action: string): boolean {
    switch (action) {
      case "received":
        return this.config.logAllRequests;
      case "accepted":
      case "rejected":
        return this.config.logAllRequests || this.config.logFailedRequests;
      case "rate_limited":
        return this.config.logRateLimited;
      case "error":
        return true;
      default:
        return false;
    }
  }

  /**
   * Mask sensitive information
   */
  private maskSensitive(value?: string): string | undefined {
    if (!value) return value;
    if (value.length <= 8) return "*".repeat(value.length);
    return (
      value.substring(0, 4) +
      "*".repeat(value.length - 8) +
      value.substring(value.length - 4)
    );
  }

  /**
   * Sanitize details object
   */
  private sanitizeDetails(details: any): any {
    if (!details || typeof details !== "object") return details;

    const sanitized = { ...details };

    // Remove sensitive fields
    for (const field of this.config.sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = this.maskSensitive(sanitized[field]);
      }
    }

    // Sanitize nested objects
    for (const [key, value] of Object.entries(sanitized)) {
      if (typeof value === "object" && value !== null) {
        sanitized[key] = this.sanitizeDetails(value);
      }
    }

    return sanitized;
  }
}

/**
 * Webhook Security Manager
 */
export class WebhookSecurityManager {
  private rateLimiter: WebhookRateLimiter;
  private inputSanitizer: WebhookInputSanitizer;
  private auditLogger: WebhookAuditLogger;

  constructor(
    private config: {
      rateLimit: {
        requestsPerMinute: number;
        blockDurationMs: number;
      };
      inputValidation: {
        maxPayloadSize: number;
      };
      audit: {
        logAllRequests: boolean;
        logFailedRequests: boolean;
        logRateLimited: boolean;
      };
      allowedIPs?: string[];
    },
  ) {
    this.rateLimiter = new WebhookRateLimiter({
      requestsPerMinute: config.rateLimit.requestsPerMinute,
      blockDurationMs: config.rateLimit.blockDurationMs,
      maxBlocks: 10,
    });

    this.inputSanitizer = new WebhookInputSanitizer({
      maxPayloadSize: config.inputValidation.maxPayloadSize,
      allowedContentTypes: ["application/json"],
      sanitizeHeaders: true,
    });

    this.auditLogger = new WebhookAuditLogger({
      logAllRequests: config.audit.logAllRequests,
      logFailedRequests: config.audit.logFailedRequests,
      logRateLimited: config.audit.logRateLimited,
      sensitiveFields: ["signature", "rawBody"],
    });
  }

  /**
   * Process webhook security checks
   */
  async processSecurity(input: WebhookEventInput): Promise<{
    allowed: boolean;
    sanitizedInput?: WebhookEventInput;
    error?: string;
    warnings?: string[];
  }> {
    try {
      // 1. IP Allowlist check
      if (this.config.allowedIPs && input.ipAddress) {
        if (!this.config.allowedIPs.includes(input.ipAddress)) {
          this.auditLogger.logRequest(input, "rejected", {
            reason: "ip_not_allowed",
          });
          return {
            allowed: false,
            error: "IP address not in allowlist",
          };
        }
      }

      // 2. Rate limiting check
      const rateLimitResult = this.rateLimiter.isAllowed(
        input.ipAddress || "unknown",
      );
      if (!rateLimitResult.allowed) {
        this.auditLogger.logRequest(input, "rate_limited", {
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime,
        });
        return {
          allowed: false,
          error: `Rate limit exceeded. Try again after ${new Date(rateLimitResult.resetTime).toISOString()}`,
        };
      }

      // 3. Input sanitization
      const { sanitized, warnings } = this.inputSanitizer.sanitize(input);

      // 4. Log successful processing
      this.auditLogger.logRequest(sanitized, "accepted", { warnings });

      return {
        allowed: true,
        sanitizedInput: sanitized,
        warnings,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Security check failed";

      this.auditLogger.logRequest(input, "error", { error: errorMessage });

      return {
        allowed: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Log webhook processing events
   */
  logProcessing(
    event: WebhookEvent,
    action: "started" | "completed" | "failed" | "retried" | "dead_letter",
    details?: any,
  ): void {
    this.auditLogger.logProcessing(event, action, details);
  }

  /**
   * Get security statistics
   */
  getStats() {
    return {
      rateLimiter: this.rateLimiter.getStats(),
      timestamp: Date.now(),
    };
  }

  /**
   * Clear all security data (for testing)
   */
  clear(): void {
    this.rateLimiter.clear();
  }
}

// ===== DEFAULT CONFIGURATIONS =====

export const DEFAULT_WEBHOOK_SECURITY_CONFIG = {
  rateLimit: {
    requestsPerMinute: 100,
    blockDurationMs: 15 * 60 * 1000, // 15 minutes
  },
  inputValidation: {
    maxPayloadSize: 1024 * 1024, // 1MB
  },
  audit: {
    logAllRequests: process.env.NODE_ENV === "development",
    logFailedRequests: true,
    logRateLimited: true,
  },
  allowedIPs: process.env.WEBHOOK_ALLOWED_IPS?.split(",") || undefined,
};

// ===== SINGLETON INSTANCE =====

let securityManagerInstance: WebhookSecurityManager | null = null;

export function getWebhookSecurityManager(
  config?: Partial<typeof DEFAULT_WEBHOOK_SECURITY_CONFIG>,
): WebhookSecurityManager {
  if (!securityManagerInstance) {
    const finalConfig = { ...DEFAULT_WEBHOOK_SECURITY_CONFIG, ...config };
    securityManagerInstance = new WebhookSecurityManager(finalConfig);
  }
  return securityManagerInstance;
}

export function destroyWebhookSecurityManager(): void {
  if (securityManagerInstance) {
    securityManagerInstance.clear();
    securityManagerInstance = null;
  }
}
