/**
 * Webhook Processor - Fase 3
 * Processador avançado de webhooks com retry logic e idempotency
 */

import { logger } from "../observability/logger";
import { metrics } from "../observability/metrics";
import { tracer } from "../observability/tracer";
import {
  WebhookEvent,
  WebhookProcessor,
  WebhookProcessingResult,
  RetryConfig,
  RetryAttempt,
  QueueMessage,
  WebhookStatus,
  WEBHOOK_CONSTANTS,
} from "./types";
import { WebhookQueue, WebhookQueueManager } from "./queue";
import { DeadLetterQueue } from "./dead-letter";

/**
 * Retry Policy Implementation
 */
export class RetryPolicy {
  constructor(private config: RetryConfig) {}

  /**
   * Calculate delay for next retry attempt
   */
  calculateDelay(attempt: number): number {
    if (attempt >= this.config.maxAttempts) {
      return 0; // No more retries
    }

    let delay =
      this.config.initialDelayMs *
      Math.pow(this.config.backoffMultiplier, attempt - 1);
    delay = Math.min(delay, this.config.maxDelayMs);

    // Add jitter to prevent thundering herd
    if (this.config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5); // ±50% jitter
    }

    return Math.floor(delay);
  }

  /**
   * Check if should retry
   */
  shouldRetry(attempt: number, error: string): boolean {
    if (attempt >= this.config.maxAttempts) {
      return false;
    }

    // Define retryable errors
    const retryableErrors = [
      "network_error",
      "timeout",
      "rate_limit",
      "temporary_failure",
      "service_unavailable",
    ];

    // Check if error is retryable based on error message/type
    return retryableErrors.some((retryableError) =>
      error.toLowerCase().includes(retryableError.toLowerCase()),
    );
  }

  /**
   * Get max attempts
   */
  getMaxAttempts(): number {
    return this.config.maxAttempts;
  }
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: WEBHOOK_CONSTANTS.DEFAULT_MAX_ATTEMPTS,
  initialDelayMs: WEBHOOK_CONSTANTS.DEFAULT_RETRY_DELAY_MS,
  backoffMultiplier: WEBHOOK_CONSTANTS.DEFAULT_BACKOFF_MULTIPLIER,
  maxDelayMs: WEBHOOK_CONSTANTS.DEFAULT_MAX_BACKOFF_MS,
  jitter: true,
};

/**
 * Idempotency Manager
 */
export class IdempotencyManager {
  private processedKeys: Set<string> = new Set();
  private keyTimestamps: Map<string, number> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor(private ttlMs: number = 24 * 60 * 60 * 1000) {
    // 24 hours default
    // Cleanup expired keys every hour
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      60 * 60 * 1000,
    );
  }

  /**
   * Check if key was already processed
   */
  isProcessed(key: string): boolean {
    this.cleanupExpiredKey(key);
    return this.processedKeys.has(key);
  }

  /**
   * Mark key as processed
   */
  markProcessed(key: string): void {
    this.processedKeys.add(key);
    this.keyTimestamps.set(key, Date.now());

    metrics.incrementCounter("webhook_idempotent_keys_total", 1);
  }

  /**
   * Get processed keys count
   */
  getStats() {
    return {
      totalKeys: this.processedKeys.size,
      oldestKey: Math.min(...Array.from(this.keyTimestamps.values())),
      newestKey: Math.max(...Array.from(this.keyTimestamps.values())),
    };
  }

  /**
   * Cleanup expired keys
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, timestamp] of this.keyTimestamps) {
      if (now - timestamp > this.ttlMs) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.processedKeys.delete(key);
      this.keyTimestamps.delete(key);
    }

    if (expiredKeys.length > 0) {
      logger.info(`Cleaned up expired idempotency keys`, {
        cleanedCount: expiredKeys.length,
        remainingKeys: this.processedKeys.size,
      });
    }
  }

  /**
   * Cleanup specific key if expired
   */
  private cleanupExpiredKey(key: string): void {
    const timestamp = this.keyTimestamps.get(key);
    if (timestamp && Date.now() - timestamp > this.ttlMs) {
      this.processedKeys.delete(key);
      this.keyTimestamps.delete(key);
    }
  }

  /**
   * Destroy manager
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.processedKeys.clear();
    this.keyTimestamps.clear();
  }
}

/**
 * Advanced Webhook Processor
 */
export class AdvancedWebhookProcessor {
  private processors: Map<string, WebhookProcessor> = new Map();
  private retryPolicy: RetryPolicy;
  private idempotencyManager: IdempotencyManager;
  private deadLetterQueue: DeadLetterQueue;
  private queueManager: WebhookQueueManager;
  private isProcessing: boolean = false;

  constructor(
    queueManager: WebhookQueueManager,
    deadLetterQueue: DeadLetterQueue,
    retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG,
  ) {
    this.queueManager = queueManager;
    this.deadLetterQueue = deadLetterQueue;
    this.retryPolicy = new RetryPolicy(retryConfig);
    this.idempotencyManager = new IdempotencyManager();

    logger.info(`AdvancedWebhookProcessor initialized`, {
      retryConfig,
      queueCount: queueManager.getAllStats(),
    });
  }

  /**
   * Register a webhook processor
   */
  registerProcessor(processor: WebhookProcessor): void {
    for (const eventType of processor.getSupportedEventTypes()) {
      this.processors.set(eventType, processor);
    }

    logger.info(`Webhook processor registered`, {
      supportedEventTypes: processor.getSupportedEventTypes(),
    });
  }

  /**
   * Process webhook event
   */
  async processWebhookEvent(event: WebhookEvent): Promise<void> {
    const span = tracer.startSpan("webhook.process", undefined, {
      "webhook.event_type": event.eventType,
      "webhook.provider": event.provider,
      "webhook.event_id": event.eventId,
    });

    try {
      // Check idempotency
      if (this.idempotencyManager.isProcessed(event.idempotencyKey)) {
        logger.info(`Webhook event already processed (idempotent)`, {
          eventId: event.id,
          idempotencyKey: event.idempotencyKey,
        });

        metrics.incrementCounter("webhook_idempotent_hits_total", 1, {
          provider: event.provider,
          event_type: event.eventType,
        });

        return;
      }

      // Find appropriate processor
      const processor = this.processors.get(event.eventType);
      if (!processor) {
        throw new Error(
          `No processor found for event type: ${event.eventType}`,
        );
      }

      // Update processing status
      event.processing.status = "processing";
      event.processing.lastAttemptAt = Date.now();

      const startTime = Date.now();
      let result: WebhookProcessingResult;

      try {
        result = await processor.process(event);
        event.processing.processingTimeMs = Date.now() - startTime;
      } catch (error) {
        event.processing.processingTimeMs = Date.now() - startTime;
        throw error;
      }

      if (result.success) {
        // Mark as completed
        event.processing.status = "completed";
        this.idempotencyManager.markProcessed(event.idempotencyKey);

        metrics.recordHistogram(
          "webhook_processing_duration_seconds",
          event.processing.processingTimeMs / 1000,
          {
            provider: event.provider,
            event_type: event.eventType,
            status: "success",
          },
        );

        logger.info(`Webhook event processed successfully`, {
          eventId: event.id,
          eventType: event.eventType,
          provider: event.provider,
          processingTimeMs: event.processing.processingTimeMs,
        });
      } else {
        // Handle failure
        await this.handleProcessingFailure(
          event,
          result.error || "Unknown error",
          result.retryable,
        );
      }
    } catch (error) {
      await this.handleProcessingFailure(
        event,
        error instanceof Error ? error.message : "Unknown error",
        true,
      );
    } finally {
      tracer.finishSpan(span);
    }
  }

  /**
   * Handle processing failure with retry logic
   */
  private async handleProcessingFailure(
    event: WebhookEvent,
    error: string,
    retryable: boolean,
  ): Promise<void> {
    event.processing.attempts++;
    event.processing.lastError = error;

    const shouldRetry =
      retryable &&
      this.retryPolicy.shouldRetry(event.processing.attempts, error);

    if (shouldRetry) {
      // Schedule retry
      const retryDelay = this.retryPolicy.calculateDelay(
        event.processing.attempts,
      );
      event.processing.nextRetryAt = Date.now() + retryDelay;
      event.processing.status = "retrying";

      // Create retry queue message
      const retryMessage: QueueMessage = {
        id: `retry_${event.id}_${event.processing.attempts}`,
        type: "retry_event",
        payload: event,
        metadata: {
          enqueuedAt: Date.now(),
          priority: event.processing.priority,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
          correlationId: event.metadata.correlationId,
        },
      };

      // Add to retry queue
      const retryQueue = this.queueManager.getQueue("retry");
      if (retryQueue) {
        await retryQueue.enqueue(retryMessage);
      }

      const retryAttempt: RetryAttempt = {
        attempt: event.processing.attempts,
        timestamp: Date.now(),
        error,
        processingTimeMs: event.processing.processingTimeMs || 0,
        nextRetryDelayMs: retryDelay,
      };

      metrics.incrementCounter("webhook_retry_scheduled_total", 1, {
        provider: event.provider,
        event_type: event.eventType,
        attempt: event.processing.attempts.toString(),
      });

      logger.warn(`Webhook event scheduled for retry`, {
        eventId: event.id,
        eventType: event.eventType,
        provider: event.provider,
        attempt: event.processing.attempts,
        maxAttempts: event.processing.maxAttempts,
        retryDelayMs: retryDelay,
        nextRetryAt: event.processing.nextRetryAt,
        error: new Error(error),
      });
    } else {
      // Move to dead letter queue
      event.processing.status = "dead_letter";

      const retryHistory: RetryAttempt[] = []; // In real implementation, track retry history
      await this.deadLetterQueue.addToDeadLetter(
        event,
        error,
        retryHistory,
        "max_retries_exceeded",
      );

      metrics.incrementCounter("webhook_dead_letter_total", 1, {
        provider: event.provider,
        event_type: event.eventType,
        reason: "max_retries_exceeded",
      });

      logger.error(`Webhook event moved to dead letter queue`, {
        eventId: event.id,
        eventType: event.eventType,
        provider: event.provider,
        attempts: event.processing.attempts,
        maxAttempts: event.processing.maxAttempts,
        finalError: error,
      });
    }
  }

  /**
   * Start processing queues
   */
  async startProcessing(): Promise<void> {
    if (this.isProcessing) {
      logger.warn("Webhook processor already running");
      return;
    }

    this.isProcessing = true;
    logger.info("Advanced webhook processor started");

    // Start processing loop for each queue
    this.processQueue("default");
    this.processQueue("highPriority");
    this.processQueue("retry");
  }

  /**
   * Stop processing queues
   */
  async stopProcessing(): Promise<void> {
    this.isProcessing = false;
    logger.info("Advanced webhook processor stopped");
  }

  /**
   * Process specific queue
   */
  private async processQueue(queueName: string): Promise<void> {
    const queue = this.queueManager.getQueue(queueName);
    if (!queue) {
      logger.error(`Queue not found: ${queueName}`);
      return;
    }

    const processNext = async () => {
      if (!this.isProcessing) return;

      try {
        const message = await queue.dequeue();
        if (message) {
          await this.processWebhookEvent(message.payload);

          // Mark as completed
          await queue.complete(message.id);
        }
      } catch (error) {
        logger.error(`Error processing queue ${queueName}`, {
          error:
            error instanceof Error
              ? error
              : new Error("Unknown queue processing error"),
        });
      }

      // Continue processing
      if (this.isProcessing) {
        setTimeout(processNext, 100); // Small delay to prevent tight loop
      }
    };

    // Start processing
    processNext();
  }

  /**
   * Get processor statistics
   */
  getStats() {
    return {
      isProcessing: this.isProcessing,
      registeredProcessors: this.processors.size,
      supportedEventTypes: Array.from(this.processors.keys()),
      idempotencyStats: this.idempotencyManager.getStats(),
      queueStats: this.queueManager.getAllStats(),
      deadLetterStats: this.deadLetterQueue.getStats(),
    };
  }

  /**
   * Destroy processor
   */
  destroy(): void {
    this.isProcessing = false;
    this.idempotencyManager.destroy();
    logger.info("Advanced webhook processor destroyed");
  }
}
