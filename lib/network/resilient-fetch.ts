"use client";

import { logger } from "../logger";
import { analytics } from "../analytics-core";

// Network error taxonomy - Known error types, no "Unknown error"
export enum NetworkErrorType {
  NETWORK_TIMEOUT = "network_timeout",
  NETWORK_OFFLINE = "network_offline",
  DNS_ERROR = "dns_error",
  HTTP_CLIENT_ERROR = "http_4xx",
  HTTP_SERVER_ERROR = "http_5xx",
  PARSER_ERROR = "parser_error",
  ABORTED = "aborted",
  CIRCUIT_BREAKER_OPEN = "circuit_breaker_open",
  UNKNOWN = "unknown", // Only when we can't classify the error
}

export class NetworkError extends Error {
  constructor(
    public readonly type: NetworkErrorType,
    message: string,
    public readonly status?: number,
    public readonly retryable: boolean = true,
  ) {
    super(message);
    this.name = "NetworkError";
  }
}

// Circuit breaker state
enum CircuitState {
  CLOSED = "closed",
  OPEN = "open",
  HALF_OPEN = "half_open",
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private successCount = 0;

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly recoveryTimeout: number = 30000, // 30s
    private readonly successThreshold: number = 3,
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime >= this.recoveryTimeout) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
      } else {
        throw new NetworkError(
          NetworkErrorType.CIRCUIT_BREAKER_OPEN,
          "Circuit breaker is open",
          undefined,
          true,
        );
      }
    }

    try {
      const result = await fn();

      if (this.state === CircuitState.HALF_OPEN) {
        this.successCount++;
        if (this.successCount >= this.successThreshold) {
          this.state = CircuitState.CLOSED;
          this.failureCount = 0;
        }
      } else if (this.state === CircuitState.CLOSED) {
        this.failureCount = 0;
      }

      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.failureThreshold) {
        this.state = CircuitState.OPEN;
      }

      throw error;
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}

// Request deduplication
const pendingRequests = new Map<string, Promise<any>>();

function getRequestKey(url: string, options: RequestInit): string {
  const method = options.method || "GET";
  const body = options.body ? JSON.stringify(options.body) : "";
  return `${method}:${url}:${body}`;
}

function getIdempotentKey(method: string, url: string): string {
  // Only GET requests are truly idempotent
  return method === "GET" ? url : `${method}:${url}:${Date.now()}`;
}

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  jitter: boolean;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 300,
  maxDelay: 5000,
  backoffFactor: 2,
  jitter: true,
};

// Main resilient fetch function
export interface FetchOptions extends RequestInit {
  timeout?: number;
  retry?: Partial<RetryConfig>;
  circuitBreaker?: boolean;
  deduplicate?: boolean;
  signal?: AbortSignal;
}

export async function resilientFetch<T = any>(
  url: string,
  options: FetchOptions = {},
): Promise<T> {
  const {
    timeout = 10000,
    retry = {},
    circuitBreaker = true,
    deduplicate = false,
    signal: externalSignal,
    ...fetchOptions
  } = options;

  const method = fetchOptions.method || "GET";
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...retry };
  const requestKey = deduplicate
    ? getRequestKey(url, fetchOptions)
    : getIdempotentKey(method, url);

  // Deduplicate pending requests
  if (deduplicate && pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey)!;
  }

  // Circuit breaker (per endpoint)
  const circuitKey = new URL(url).hostname;
  const circuits = new Map<string, CircuitBreaker>();
  let circuit = circuits.get(circuitKey);

  if (!circuit) {
    circuit = new CircuitBreaker();
    circuits.set(circuitKey, circuit);
  }

  const fetchFn = async (): Promise<T> => {
    const abortController = new AbortController();
    let timeoutId: NodeJS.Timeout;

    // Combine external signal with internal timeout
    const combinedSignal = externalSignal
      ? AbortSignal.any([externalSignal, abortController.signal])
      : abortController.signal;

    // Setup timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        abortController.abort();
        reject(
          new NetworkError(
            NetworkErrorType.NETWORK_TIMEOUT,
            `Request timeout after ${timeout}ms`,
            undefined,
            true,
          ),
        );
      }, timeout);
    });

    try {
      // Check online status
      if (!navigator.onLine) {
        throw new NetworkError(
          NetworkErrorType.NETWORK_OFFLINE,
          "Device is offline",
          undefined,
          true,
        );
      }

      // Execute fetch with timeout
      const fetchPromise = fetch(url, {
        ...fetchOptions,
        signal: combinedSignal,
      });

      const response = await Promise.race([fetchPromise, timeoutPromise]);

      clearTimeout(timeoutId!);

      // Handle HTTP errors
      if (!response.ok) {
        const errorType =
          response.status >= 500
            ? NetworkErrorType.HTTP_SERVER_ERROR
            : NetworkErrorType.HTTP_CLIENT_ERROR;

        const retryable = response.status >= 500 || response.status === 429;
        throw new NetworkError(
          errorType,
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          retryable,
        );
      }

      // Parse JSON with error handling
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          return await response.json();
        } catch (parseError) {
          throw new NetworkError(
            NetworkErrorType.PARSER_ERROR,
            "Failed to parse JSON response",
            undefined,
            false,
          );
        }
      }

      return response as any;
    } catch (error) {
      clearTimeout(timeoutId!);

      // Handle abort
      if (error instanceof Error && error.name === "AbortError") {
        throw new NetworkError(
          NetworkErrorType.ABORTED,
          "Request was aborted",
          undefined,
          false,
        );
      }

      // Re-throw network errors
      if (error instanceof NetworkError) {
        throw error;
      }

      // Wrap other errors
      throw new NetworkError(
        NetworkErrorType.HTTP_SERVER_ERROR,
        error instanceof Error ? error.message : "Unknown network error",
        undefined,
        true,
      );
    }
  };

  // Implement retry with exponential backoff
  const executeWithRetry = async (): Promise<T> => {
    let lastError: NetworkError = new NetworkError(
      NetworkErrorType.HTTP_SERVER_ERROR,
      "Unknown error",
      undefined,
      false,
    );

    for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
      try {
        const result = circuitBreaker
          ? await circuit!.execute(fetchFn)
          : await fetchFn();
        return result;
      } catch (error) {
        lastError =
          error instanceof NetworkError
            ? error
            : new NetworkError(
                NetworkErrorType.HTTP_SERVER_ERROR,
                "Unknown error",
                undefined,
                true,
              );

        // Don't retry non-retryable errors
        if (!lastError.retryable) {
          throw lastError;
        }

        // Don't retry on last attempt
        if (attempt === retryConfig.maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const baseDelay =
          retryConfig.baseDelay * Math.pow(retryConfig.backoffFactor, attempt);
        const delay = Math.min(baseDelay, retryConfig.maxDelay);
        const jitteredDelay = retryConfig.jitter
          ? delay * (0.5 + Math.random() * 0.5)
          : delay;

        logger.info(
          `Retrying request (attempt ${attempt + 1}/${retryConfig.maxRetries + 1}) after ${jitteredDelay}ms`,
          {
            url,
            method,
            error: lastError.message,
          },
        );

        await new Promise((resolve) => setTimeout(resolve, jitteredDelay));
      }
    }

    // Track failed request
    analytics.track("network_request_failed", {
      url,
      method,
      error_type: lastError.type,
      error_message: lastError.message,
      retry_attempts: retryConfig.maxRetries,
    });

    throw lastError;
  };

  // Execute with deduplication
  const requestPromise = executeWithRetry();

  if (deduplicate) {
    pendingRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      pendingRequests.delete(requestKey);
    }
  }

  return requestPromise;
}

// Convenience methods
export const api = {
  get: <T = any>(url: string, options?: Omit<FetchOptions, "method">) =>
    resilientFetch<T>(url, { ...options, method: "GET" }),

  post: <T = any>(
    url: string,
    data?: any,
    options?: Omit<FetchOptions, "method">,
  ) =>
    resilientFetch<T>(url, {
      ...options,
      method: "POST",
      headers: { "Content-Type": "application/json", ...options?.headers },
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = any>(
    url: string,
    data?: any,
    options?: Omit<FetchOptions, "method">,
  ) =>
    resilientFetch<T>(url, {
      ...options,
      method: "PUT",
      headers: { "Content-Type": "application/json", ...options?.headers },
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T = any>(
    url: string,
    data?: any,
    options?: Omit<FetchOptions, "method">,
  ) =>
    resilientFetch<T>(url, {
      ...options,
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...options?.headers },
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = any>(url: string, options?: Omit<FetchOptions, "method">) =>
    resilientFetch<T>(url, { ...options, method: "DELETE" }),
};
