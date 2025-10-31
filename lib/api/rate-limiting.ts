/**
 * Rate limiting API utilities for client-side integration
 */

import { logger, withComponentContext, createTimedLogger } from "../architecture/logger-pattern";
import { sha256Hash, hmacSha256 } from "../architecture/crypto-utils";

interface RateLimitCheckRequest {
  action: string;
  identifier: string; // IP, user ID, session ID, etc.
  metadata?: Record<string, unknown>;
}

interface RateLimitCheckResponse {
  allowed: boolean;
  remaining?: number;
  resetTime?: number;
  error?: string;
}

// ===== API RESPONSE TYPES =====

export interface RateLimitErrorResponse {
  message?: string;
  retryAfter?: number;
  limit?: number;
  remaining?: number;
  code?: string;
  details?: {
    windowMs?: number;
    resetTime?: number;
    exceededBy?: number;
  };
}

export interface RateLimitSuccessResponse {
  allowed: boolean;
  remaining: number;
  resetTime: number; // Unix timestamp in seconds
  retryAfter?: number; // Seconds to wait
  limit?: number;
  windowMs?: number;
  metadata?: {
    identifier: string;
    action: string;
    timestamp: number;
  };
}

export type RateLimitApiResponse = RateLimitSuccessResponse | RateLimitErrorResponse;

interface RateLimitError extends Error {
  retryAfter: number;
  limit: number;
  remaining: number;
}

/**
 * Check rate limit with backend API
 */
export async function checkRateLimit(
  request: RateLimitCheckRequest,
): Promise<RateLimitCheckResponse> {
  const timedLogger = createTimedLogger("rate-limiting", "checkRateLimit");

  try {
    // Hash the identifier for security - protects sensitive data in identifiers
    const hashedIdentifier = sha256Hash(request.identifier);
    const secureRequest = {
      ...request,
      identifier: hashedIdentifier,
      // Store original identifier hash for logging (not sent to API)
      _originalHash: hmacSha256(request.identifier, "rate-limit-key")
    };

    const response = await fetch("/api/rate-limit/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: secureRequest.action,
        identifier: secureRequest.identifier,
        metadata: request.metadata
      }),
    });

    timedLogger.complete({
      statusCode: response.status,
      action: request.action,
      identifier: request.identifier
    });

    if (!response.ok) {
      if (response.status === 429) {
        let data: unknown = {};
        try {
          data = await response.json();
        } catch (error) {
          // If JSON parsing fails, use empty object
          withComponentContext("rate-limiting", "checkRateLimit").warn(
            "Failed to parse rate limit error response",
            { error: error instanceof Error ? error.message : String(error) }
          );
        }
        const dataObj = data as RateLimitErrorResponse;
        const error: RateLimitError = new Error(
          dataObj.message || "Rate limit exceeded",
        ) as RateLimitError;
        error.retryAfter = dataObj.retryAfter || 60;
        error.limit = dataObj.limit || 0;
        error.remaining = dataObj.remaining || 0;
        throw error;
      }
      throw new Error(`Rate limit check failed: ${response.status}`);
    }

    try {
      return await response.json();
    } catch (error) {
      withComponentContext("rate-limiting", "checkRateLimit").warn(
        "Failed to parse rate limit response",
        { error: error instanceof Error ? error.message : String(error) }
      );
      // Return default allowed response
      return { allowed: true, remaining: 100, resetTime: Date.now() + 60000 };
    }
  } catch (error) {
    if (error instanceof Error && "retryAfter" in error) {
      timedLogger.fail(error, {
        action: request.action,
        identifier: request.identifier,
        rateLimitError: true
      });
      throw error; // Re-throw RateLimitError
    }

    // Network or other error - assume allowed for graceful degradation
    timedLogger.fail(error, {
      action: request.action,
      identifier: request.identifier,
      gracefulDegradation: true
    });

    withComponentContext("rate-limiting", "checkRateLimit").warn(
      "Rate limit check failed, allowing request for graceful degradation",
      {
        error: error instanceof Error ? error.message : String(error),
        action: request.action,
        identifier: request.identifier
      }
    );

    return {
      allowed: true,
      remaining: 999,
      resetTime: Math.floor(Date.now() / 1000) + 3600,
    };
  }
}

/**
 * Report rate limit usage to backend
 */
export async function reportRateLimitUsage(
  action: string,
  identifier: string,
  success: boolean = true,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    // Hash the identifier for security before sending to API
    const hashedIdentifier = sha256Hash(identifier);

    await fetch("/api/rate-limit/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        identifier: hashedIdentifier,
        success,
        metadata,
        timestamp: Date.now(),
        // Include HMAC for server-side verification if needed
        signature: hmacSha256(`${action}:${hashedIdentifier}:${success}`, "rate-limit-report-key")
      }),
    });
  } catch (error) {
    // Silent failure - rate limit reporting is not critical
    withComponentContext("rate-limiting", "reportRateLimitUsage").warn(
      "Failed to report rate limit usage",
      { error: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * Get client identifier for rate limiting
 */
export function getClientIdentifier(): string {
  // Use session ID if available, otherwise generate a temporary one
  if (typeof window !== "undefined") {
    let clientId = sessionStorage.getItem("rate_limit_client_id");
    if (!clientId) {
      clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem("rate_limit_client_id", clientId);
    }
    return clientId;
  }

  // Fallback for server-side
  return "server_default";
}

/**
 * Get user identifier for rate limiting
 */
export function getUserIdentifier(): string {
  // In a real app, this would come from authentication context
  // For now, use client identifier
  return getClientIdentifier();
}
