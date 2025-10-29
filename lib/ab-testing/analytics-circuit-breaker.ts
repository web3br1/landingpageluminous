// Circuit Breaker for Analytics Tracking
// Prevents cascading failures when analytics services are down

interface CircuitBreakerState {
  state: "closed" | "open" | "half-open";
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
}

interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening circuit
  recoveryTimeout: number; // Time to wait before trying again (ms)
  monitoringPeriod: number; // Time window to count failures (ms)
  successThreshold: number; // Number of successes needed in half-open state
}

class AnalyticsCircuitBreaker {
  private state: CircuitBreakerState = {
    state: "closed",
    failureCount: 0,
    lastFailureTime: 0,
    nextAttemptTime: 0,
  };

  private config: CircuitBreakerConfig;
  private halfOpenSuccessCount = 0;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      monitoringPeriod: 300000, // 5 minutes
      successThreshold: 3,
      ...config,
    };
  }

  async execute<T>(operation: () => Promise<T>): Promise<T | null> {
    if (!this.canExecute()) {
      console.warn(
        "[Analytics Circuit Breaker] Circuit is open, skipping operation",
      );
      return null;
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private canExecute(): boolean {
    const now = Date.now();

    switch (this.state.state) {
      case "closed":
        return true;

      case "open":
        if (now >= this.state.nextAttemptTime) {
          this.state.state = "half-open";
          this.halfOpenSuccessCount = 0;
          console.log(
            "[Analytics Circuit Breaker] Circuit moving to half-open",
          );
          return true;
        }
        return false;

      case "half-open":
        return true;

      default:
        return false;
    }
  }

  private onSuccess(): void {
    // Reset failure count in monitoring window
    this.resetFailuresIfExpired();

    if (this.state.state === "half-open") {
      this.halfOpenSuccessCount++;

      if (this.halfOpenSuccessCount >= this.config.successThreshold) {
        this.closeCircuit();
      }
    }
  }

  private onFailure(): void {
    this.state.failureCount++;
    this.state.lastFailureTime = Date.now();

    if (this.state.state === "half-open") {
      this.openCircuit();
    } else if (this.state.failureCount >= this.config.failureThreshold) {
      this.openCircuit();
    }
  }

  private openCircuit(): void {
    this.state.state = "open";
    this.state.nextAttemptTime = Date.now() + this.config.recoveryTimeout;
    console.warn(
      `[Analytics Circuit Breaker] Circuit opened. Next attempt at ${new Date(this.state.nextAttemptTime).toISOString()}`,
    );
  }

  private closeCircuit(): void {
    this.state.state = "closed";
    this.state.failureCount = 0;
    this.halfOpenSuccessCount = 0;
    console.log(
      "[Analytics Circuit Breaker] Circuit closed - service recovered",
    );
  }

  private resetFailuresIfExpired(): void {
    const now = Date.now();
    if (now - this.state.lastFailureTime > this.config.monitoringPeriod) {
      this.state.failureCount = 0;
    }
  }

  getState(): Readonly<CircuitBreakerState> {
    return { ...this.state };
  }

  // Force state changes for testing/admin purposes
  forceClose(): void {
    this.closeCircuit();
  }

  forceOpen(): void {
    this.openCircuit();
  }
}

// Global circuit breaker instance
let globalCircuitBreaker: AnalyticsCircuitBreaker | null = null;

export function getAnalyticsCircuitBreaker(): AnalyticsCircuitBreaker {
  if (!globalCircuitBreaker) {
    globalCircuitBreaker = new AnalyticsCircuitBreaker({
      failureThreshold: 5, // Open after 5 failures
      recoveryTimeout: 60000, // Wait 1 minute before retry
      monitoringPeriod: 300000, // Reset failure count after 5 minutes
      successThreshold: 3, // Need 3 successes to close circuit
    });
  }
  return globalCircuitBreaker;
}

// Wrapper function for analytics operations with circuit breaker
export async function withCircuitBreaker<T>(
  operation: () => Promise<T>,
  fallback?: () => T | null,
): Promise<T | null> {
  const circuitBreaker = getAnalyticsCircuitBreaker();

  try {
    return await circuitBreaker.execute(operation);
  } catch (error) {
    console.error("[Analytics Circuit Breaker] Operation failed:", error);

    if (fallback) {
      try {
        return fallback();
      } catch (fallbackError) {
        console.error(
          "[Analytics Circuit Breaker] Fallback also failed:",
          fallbackError,
        );
      }
    }

    return null;
  }
}

// Analytics-specific wrapper with queue for failed operations
interface QueuedOperation<T = any> {
  id: string;
  operation: () => Promise<T>;
  timestamp: number;
  retryCount: number;
}

class AnalyticsQueue {
  private queue: QueuedOperation[] = [];
  private maxQueueSize = 100;
  private maxRetries = 3;
  private processing = false;

  async enqueue<T>(operation: () => Promise<T>): Promise<void> {
    if (this.queue.length >= this.maxQueueSize) {
      console.warn("[Analytics Queue] Queue full, dropping operation");
      return;
    }

    const queuedOp: QueuedOperation<T> = {
      id: `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      operation,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.queue.push(queuedOp);
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    const circuitBreaker = getAnalyticsCircuitBreaker();

    while (this.queue.length > 0) {
      const operation = this.queue.shift()!;
      const timeSinceQueued = Date.now() - operation.timestamp;

      // Skip if too old (5 minutes)
      if (timeSinceQueued > 300000) {
        console.warn("[Analytics Queue] Dropping old operation");
        continue;
      }

      try {
        await circuitBreaker.execute(operation.operation);
        // Success - operation completed
      } catch (error) {
        operation.retryCount++;

        if (operation.retryCount < this.maxRetries) {
          // Re-queue for retry
          this.queue.unshift(operation);
          break; // Stop processing to wait for circuit breaker recovery
        } else {
          console.error(
            "[Analytics Queue] Operation failed permanently:",
            error,
          );
        }
      }

      // Small delay between operations
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    this.processing = false;
  }

  getStats() {
    return {
      queueLength: this.queue.length,
      maxQueueSize: this.maxQueueSize,
      processing: this.processing,
    };
  }
}

// Global analytics queue
let globalAnalyticsQueue: AnalyticsQueue | null = null;

export function getAnalyticsQueue(): AnalyticsQueue {
  if (!globalAnalyticsQueue) {
    globalAnalyticsQueue = new AnalyticsQueue();
  }
  return globalAnalyticsQueue;
}

// Enhanced wrapper with queuing for failed operations
export async function withAnalyticsResilience<T>(
  operation: () => Promise<T>,
  options: {
    useQueue?: boolean;
    fallback?: () => T | null;
  } = {},
): Promise<T | null> {
  const { useQueue = true, fallback } = options;

  try {
    return await withCircuitBreaker(operation, fallback);
  } catch (error) {
    if (useQueue) {
      // Queue for later retry
      const queue = getAnalyticsQueue();
      queue.enqueue(operation).catch((queueError) => {
        console.error(
          "[Analytics Resilience] Failed to queue operation:",
          queueError,
        );
      });
    }

    return fallback ? fallback() : null;
  }
}
