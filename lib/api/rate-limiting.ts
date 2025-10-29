/**
 * Rate limiting API utilities for client-side integration
 */

interface RateLimitCheckRequest {
  action: string;
  identifier: string; // IP, user ID, session ID, etc.
  metadata?: Record<string, any>;
}

interface RateLimitCheckResponse {
  allowed: boolean;
  remaining: number;
  resetTime: number; // Unix timestamp in seconds
  retryAfter?: number; // Seconds to wait
  limit?: number;
  windowMs?: number;
}

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
  try {
    const response = await fetch("/api/rate-limit/check", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      if (response.status === 429) {
        const data = await response.json();
        const error: RateLimitError = new Error(
          data.message || "Rate limit exceeded",
        ) as RateLimitError;
        error.retryAfter = data.retryAfter || 60;
        error.limit = data.limit || 0;
        error.remaining = data.remaining || 0;
        throw error;
      }
      throw new Error(`Rate limit check failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error && "retryAfter" in error) {
      throw error; // Re-throw RateLimitError
    }

    // Network or other error - assume allowed for graceful degradation
    console.warn("Rate limit check failed, allowing request:", error);
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
  metadata?: Record<string, any>,
): Promise<void> {
  try {
    await fetch("/api/rate-limit/report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        identifier,
        success,
        metadata,
        timestamp: Date.now(),
      }),
    });
  } catch (error) {
    // Silent failure - rate limit reporting is not critical
    console.warn("Failed to report rate limit usage:", error);
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
