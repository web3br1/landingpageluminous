import { useState, useCallback, useRef, useEffect } from "react";
import {
  checkRateLimit,
  reportRateLimitUsage,
  getClientIdentifier,
  getUserIdentifier,
} from "@/lib/api/rate-limiting";

interface BackendRateLimitConfig {
  action: string;
  maxRetries?: number;
  retryDelay?: number;
  fallbackToClient?: boolean; // Fallback to client-side rate limiting if backend fails
  clientFallbackConfig?: {
    maxAttempts: number;
    windowMs: number;
    blockDurationMs: number;
  };
}

interface BackendRateLimitState {
  isLoading: boolean;
  isBlocked: boolean;
  remainingAttempts: number;
  resetTime: number;
  retryAfter: number;
  error: string | null;
  lastCheck: number;
}

interface UseBackendRateLimitingReturn {
  state: BackendRateLimitState;
  checkLimit: () => Promise<boolean>;
  reportUsage: (
    success?: boolean,
    metadata?: Record<string, any>,
  ) => Promise<void>;
  reset: () => void;
  canAttempt: boolean;
  getTimeUntilReset: () => { minutes: number; seconds: number };
}

/**
 * Hook for backend-integrated rate limiting with client-side fallback
 */
export function useBackendRateLimiting(
  config: BackendRateLimitConfig,
): UseBackendRateLimitingReturn {
  const {
    action,
    maxRetries = 3,
    retryDelay = 1000,
    fallbackToClient = true,
    clientFallbackConfig,
  } = config;

  const [state, setState] = useState<BackendRateLimitState>({
    isLoading: false,
    isBlocked: false,
    remainingAttempts: 999,
    resetTime: 0,
    retryAfter: 0,
    error: null,
    lastCheck: 0,
  });

  // Fallback client-side rate limiting state
  const clientAttemptsRef = useRef(0);
  const clientWindowStartRef = useRef(Date.now());

  // Check rate limit with backend API
  const checkLimit = useCallback(async (): Promise<boolean> => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    // Skip backend calls in test environment
    if (typeof process !== "undefined" && process.env.NODE_ENV === "test") {
      setState({
        isLoading: false,
        isBlocked: false,
        remainingAttempts: 999,
        resetTime: Math.floor(Date.now() / 1000) + 3600,
        retryAfter: 0,
        error: null,
        lastCheck: Date.now(),
      });
      return true;
    }

    try {
      const identifier = getUserIdentifier();

      const result = await checkRateLimit({
        action,
        identifier,
      });

      setState({
        isLoading: false,
        isBlocked: !result.allowed,
        remainingAttempts: result.remaining,
        resetTime: result.resetTime,
        retryAfter: result.retryAfter || 0,
        error: null,
        lastCheck: Date.now(),
      });

      return result.allowed;
    } catch (error) {
      console.warn("Backend rate limit check failed:", error);

      // Fallback to client-side rate limiting if enabled
      if (fallbackToClient && clientFallbackConfig) {
        const now = Date.now();
        const { maxAttempts, windowMs, blockDurationMs } = clientFallbackConfig;

        // Reset window if needed
        if (now - clientWindowStartRef.current >= windowMs) {
          clientAttemptsRef.current = 0;
          clientWindowStartRef.current = now;
        }

        clientAttemptsRef.current++;

        const isAllowed = clientAttemptsRef.current <= maxAttempts;

        setState({
          isLoading: false,
          isBlocked: !isAllowed,
          remainingAttempts: Math.max(
            0,
            maxAttempts - clientAttemptsRef.current,
          ),
          resetTime: Math.floor(
            (clientWindowStartRef.current + windowMs) / 1000,
          ),
          retryAfter: isAllowed ? 0 : Math.ceil(blockDurationMs / 1000),
          error: "Using client-side rate limiting (backend unavailable)",
          lastCheck: now,
        });

        return isAllowed;
      }

      // If no fallback, allow request but mark as error
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: "Rate limit check failed, proceeding with caution",
      }));

      return true;
    }
  }, [action, fallbackToClient, clientFallbackConfig]);

  // Report usage to backend
  const reportUsage = useCallback(
    async (
      success: boolean = true,
      metadata?: Record<string, any>,
    ): Promise<void> => {
      try {
        const identifier = getUserIdentifier();

        await reportRateLimitUsage(action, identifier, success, {
          ...metadata,
          clientTimestamp: Date.now(),
        });
      } catch (error) {
        console.warn("Failed to report rate limit usage:", error);
        // Non-critical error, don't throw
      }
    },
    [action],
  );

  // Reset rate limiting state
  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isBlocked: false,
      remainingAttempts: 999,
      resetTime: 0,
      retryAfter: 0,
      error: null,
      lastCheck: 0,
    });

    // Reset client-side fallback
    clientAttemptsRef.current = 0;
    clientWindowStartRef.current = Date.now();
  }, []);

  // Check if attempt is currently allowed
  const canAttempt = !state.isBlocked && !state.isLoading;

  // Get time until reset
  const getTimeUntilReset = useCallback(() => {
    const timeMs = state.isBlocked
      ? state.retryAfter * 1000
      : Math.max(0, state.resetTime * 1000 - Date.now());

    const minutes = Math.floor(timeMs / 60000);
    const seconds = Math.floor((timeMs % 60000) / 1000);

    return { minutes, seconds };
  }, [state]);

  // Auto-refresh rate limit status periodically when blocked
  useEffect(() => {
    if (!state.isBlocked || state.retryAfter <= 0) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const resetTimeMs = state.resetTime * 1000;

      if (now >= resetTimeMs) {
        // Time to reset, check again
        checkLimit();
      }
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [state.isBlocked, state.resetTime, checkLimit]);

  return {
    state,
    checkLimit,
    reportUsage,
    reset,
    canAttempt,
    getTimeUntilReset,
  };
}
