"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  resilientFetch,
  NetworkError,
  NetworkErrorType,
  type FetchOptions,
} from "./resilient-fetch";
import { analytics } from "../analytics-core";
import { logger } from "../logger";

export interface NetworkState<T> {
  data: T | null;
  loading: boolean;
  error: NetworkError | null;
  retryCount: number;
}

export interface UseResilientFetchOptions extends Omit<FetchOptions, "signal"> {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  refetchInterval?: number;
  retryOnError?: boolean;
  onSuccess?: (data: unknown) => void;
  onError?: (error: NetworkError) => void;
}

export function useResilientFetch<T = unknown>(
  url: string | null,
  options: UseResilientFetchOptions = {},
) {
  const {
    enabled = true,
    refetchOnWindowFocus = false,
    refetchInterval,
    retryOnError = true,
    onSuccess,
    onError,
    ...fetchOptions
  } = options;

  const [state, setState] = useState<NetworkState<T>>({
    data: null,
    loading: false,
    error: null,
    retryCount: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Safely abort AbortController
    if (
      abortControllerRef.current &&
      typeof abortControllerRef.current.abort === "function"
    ) {
      try {
        abortControllerRef.current.abort();
      } catch (error) {
        // Silently handle cleanup errors in tests
        if (process.env.NODE_ENV === "test") {
          console.debug(
            "AbortController cleanup error (expected in tests):",
            error,
          );
        }
      }
      abortControllerRef.current = null;
    }

    // Clear interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Execute fetch
  const execute = useCallback(
    async (signal?: AbortSignal) => {
      if (!url || !enabled || !mountedRef.current) return;

      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        abortControllerRef.current = new AbortController();
        const combinedSignal = signal
          ? AbortSignal.any([signal, abortControllerRef.current.signal])
          : abortControllerRef.current.signal;

        const data = await resilientFetch<T>(url, {
          ...fetchOptions,
          signal: combinedSignal,
        });

        if (!mountedRef.current) return;

        setState((prev) => ({
          data,
          loading: false,
          error: null,
          retryCount: 0,
        }));

        onSuccess?.(data);

        // Track success
        analytics.track("network_request_success", {
          url,
          duration: Date.now(), // Could be enhanced with actual timing
          retry_count: state.retryCount,
        });
      } catch (error) {
        if (!mountedRef.current) return;

        const networkError =
          error instanceof NetworkError ? error : mapErrorToKnownType(error);

        setState((prev) => ({
          ...prev,
          loading: false,
          error: networkError,
          retryCount: prev.retryCount + 1,
        }));

        onError?.(networkError);

        // Track error
        analytics.track("network_request_error", {
          url,
          error_type: networkError.type,
          error_message: networkError.message,
          retry_count: state.retryCount + 1,
          retryable: networkError.retryable,
        });

        logger.error("Network request failed", {
          url,
          error: networkError.message,
          type: networkError.type,
          retryCount: state.retryCount + 1,
        });
      }
    },
    [url, enabled, fetchOptions, onSuccess, onError, state.retryCount],
  );

  // Manual retry
  const retry = useCallback(() => {
    execute();
  }, [execute]);

  // Refetch
  const refetch = useCallback(() => {
    execute();
  }, [execute]);

  // Setup effects
  useEffect(() => {
    execute();

    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [execute, cleanup]);

  // Window focus refetch
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        execute();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [refetchOnWindowFocus, execute]);

  // Polling
  useEffect(() => {
    if (!refetchInterval) return;

    intervalRef.current = setInterval(() => {
      execute();
    }, refetchInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [refetchInterval, execute]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    ...state,
    retry,
    refetch,
    abort: () => abortControllerRef.current?.abort(),
  };
}

// Error taxonomy mapping - ensures no "Unknown error"
function mapErrorToKnownType(error: unknown): NetworkError {
  // Check for specific error patterns
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Timeout errors
    if (message.includes("timeout") || message.includes("timed out")) {
      return new NetworkError(
        NetworkErrorType.NETWORK_TIMEOUT,
        error.message,
        undefined,
        true,
      );
    }

    // DNS/Network errors
    if (
      message.includes("enotfound") ||
      message.includes("getaddrinfo") ||
      message.includes("dns")
    ) {
      return new NetworkError(
        NetworkErrorType.DNS_ERROR,
        "DNS resolution failed",
        undefined,
        true,
      );
    }

    // Aborted requests
    if (message.includes("aborted") || message.includes("abort")) {
      return new NetworkError(
        NetworkErrorType.ABORTED,
        "Request aborted",
        undefined,
        false,
      );
    }

    // Offline/network errors
    if (
      message.includes("network") ||
      message.includes("offline") ||
      !navigator.onLine
    ) {
      return new NetworkError(
        NetworkErrorType.NETWORK_OFFLINE,
        "Network offline",
        undefined,
        true,
      );
    }

    // Parser/JSON errors
    if (message.includes("json") || message.includes("parse")) {
      return new NetworkError(
        NetworkErrorType.PARSER_ERROR,
        "Response parsing failed",
        undefined,
        false,
      );
    }
  }

  // HTTP status-based classification (if we have status)
  if ((error as any).status) {
    const status = (error as any).status;
    if (status >= 400 && status < 500) {
      return new NetworkError(
        NetworkErrorType.HTTP_CLIENT_ERROR,
        (error as Error).message || `Client error: ${status}`,
        status,
        false,
      );
    }
    if (status >= 500) {
      return new NetworkError(
        NetworkErrorType.HTTP_SERVER_ERROR,
        (error as Error).message || `Server error: ${status}`,
        status,
        true,
      );
    }
  }

  // Last resort - unknown but classified
  return new NetworkError(
    NetworkErrorType.UNKNOWN,
    (error as Error)?.message || "Unknown network error",
    undefined,
    true,
  );
}

// Hook for mutations (POST/PUT/PATCH/DELETE)
export function useResilientMutation<TData = unknown, TVariables = unknown>(
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  url: string,
  options: Omit<UseResilientFetchOptions, "method"> = {},
) {
  const [mutateState, setMutateState] = useState<{
    loading: boolean;
    error: NetworkError | null;
    data: TData | null;
  }>({
    loading: false,
    error: null,
    data: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const mutate = useCallback(
    async (variables?: TVariables) => {
      setMutateState({ loading: true, error: null, data: null });

      try {
        abortControllerRef.current = new AbortController();

        const data = await resilientFetch<TData>(url, {
          method,
          body: variables ? JSON.stringify(variables) : undefined,
          headers: {
            "Content-Type": "application/json",
            ...options.headers,
          },
          signal: abortControllerRef.current.signal,
          ...options,
        });

        setMutateState({ loading: false, error: null, data });

        return data;
      } catch (error) {
        const networkError =
          error instanceof NetworkError ? error : mapErrorToKnownType(error);

        setMutateState({ loading: false, error: networkError, data: null });
        throw networkError;
      }
    },
    [method, url, options],
  );

  const reset = useCallback(() => {
    setMutateState({ loading: false, error: null, data: null });
    abortControllerRef.current?.abort();
  }, []);

  return {
    ...mutateState,
    mutate,
    reset,
    abort: () => abortControllerRef.current?.abort(),
  };
}
