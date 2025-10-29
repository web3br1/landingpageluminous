/**
 * Advanced Webhook Queue System - Fase 3
 * Sistema de filas para processamento assíncrono de webhooks com retry logic
 */

import { logger } from "../observability/logger";
import { metrics } from "../observability/metrics";
import {
  QueueMessage,
  QueueConfig,
  WebhookEvent,
  WebhookStatus,
  WebhookPriority,
  WEBHOOK_CONSTANTS,
} from "./types";

/**
 * In-Memory Queue Implementation
 * Pode ser substituído por Redis/BullMQ em produção
 */
export class WebhookQueue {
  private queues: Map<string, QueueMessage[]> = new Map();
  private processing: Map<string, Set<string>> = new Map();
  private config: QueueConfig;
  private isProcessing: boolean = false;

  constructor(config: QueueConfig) {
    this.config = config;
    this.queues.set(config.name, []);
    this.processing.set(config.name, new Set());

    logger.info(`WebhookQueue initialized`, {
      queueName: config.name,
      maxConcurrency: config.maxConcurrency,
    });
  }

  /**
   * Add message to queue
   */
  async enqueue(message: QueueMessage): Promise<void> {
    const queue = this.queues.get(this.config.name) || [];
    queue.push(message);

    // Sort by priority (higher priority first)
    queue.sort(
      (a, b) =>
        this.getPriorityWeight(b.metadata.priority) -
        this.getPriorityWeight(a.metadata.priority),
    );

    this.queues.set(this.config.name, queue);

    metrics.recordHistogram("webhook_queue_size", queue.length, {
      queue_name: this.config.name,
    });

    logger.info(`Message enqueued`, {
      queueName: this.config.name,
      messageId: message.id,
      messageType: message.type,
      priority: message.metadata.priority,
      queueSize: queue.length,
    });
  }

  /**
   * Dequeue message for processing
   */
  async dequeue(): Promise<QueueMessage | null> {
    const queue = this.queues.get(this.config.name) || [];
    const processing = this.processing.get(this.config.name) || new Set();

    // Check concurrency limit
    if (processing.size >= this.config.maxConcurrency) {
      return null;
    }

    // Find next available message
    for (let i = 0; i < queue.length; i++) {
      const message = queue[i];

      // Check if message is being processed
      if (processing.has(message.id)) {
        continue;
      }

      // Check if message has expired
      if (
        message.metadata.expiresAt &&
        Date.now() > message.metadata.expiresAt
      ) {
        logger.warn(`Message expired, removing from queue`, {
          messageId: message.id,
          expiresAt: message.metadata.expiresAt,
          currentTime: Date.now(),
        });
        queue.splice(i, 1);
        i--; // Adjust index after removal
        continue;
      }

      // Mark as processing
      processing.add(message.id);
      this.processing.set(this.config.name, processing);

      // Remove from queue
      queue.splice(i, 1);
      this.queues.set(this.config.name, queue);

      metrics.recordHistogram("webhook_queue_size", queue.length, {
        queue_name: this.config.name,
      });

      logger.info(`Message dequeued for processing`, {
        queueName: this.config.name,
        messageId: message.id,
        messageType: message.type,
        remainingQueueSize: queue.length,
      });

      return message;
    }

    return null;
  }

  /**
   * Mark message as completed
   */
  async complete(messageId: string): Promise<void> {
    const processing = this.processing.get(this.config.name) || new Set();
    processing.delete(messageId);
    this.processing.set(this.config.name, processing);

    metrics.incrementCounter("webhook_message_completed_total", 1, {
      queue_name: this.config.name,
    });

    logger.info(`Message completed`, {
      queueName: this.config.name,
      messageId,
    });
  }

  /**
   * Mark message as failed and handle retry
   */
  async fail(
    messageId: string,
    error: string,
    retryable: boolean = true,
  ): Promise<void> {
    const processing = this.processing.get(this.config.name) || new Set();
    processing.delete(messageId);
    this.processing.set(this.config.name, processing);

    metrics.incrementCounter("webhook_message_failed_total", 1, {
      queue_name: this.config.name,
      retryable: retryable.toString(),
    });

    logger.warn(`Message failed`, {
      queueName: this.config.name,
      messageId,
      error: new Error(error),
      retryable,
    });
  }

  /**
   * Get queue statistics
   */
  getStats() {
    const queue = this.queues.get(this.config.name) || [];
    const processing = this.processing.get(this.config.name) || new Set();

    return {
      queueName: this.config.name,
      queued: queue.length,
      processing: processing.size,
      total: queue.length + processing.size,
    };
  }

  /**
   * Clear all messages (for testing)
   */
  clear(): void {
    this.queues.set(this.config.name, []);
    this.processing.set(this.config.name, new Set());

    logger.info(`Queue cleared`, {
      queueName: this.config.name,
    });
  }

  private getPriorityWeight(priority: WebhookPriority): number {
    switch (priority) {
      case "critical":
        return 4;
      case "high":
        return 3;
      case "normal":
        return 2;
      case "low":
        return 1;
      default:
        return 2;
    }
  }
}

/**
 * Queue Manager - Manages multiple queues
 */
export class WebhookQueueManager {
  private queues: Map<string, WebhookQueue> = new Map();
  private isRunning: boolean = false;

  constructor(private configs: Record<string, QueueConfig>) {
    for (const [name, config] of Object.entries(configs)) {
      this.queues.set(name, new WebhookQueue(config));
    }

    logger.info(`WebhookQueueManager initialized`, {
      queueCount: this.queues.size,
      queues: Object.keys(configs),
    });
  }

  /**
   * Start processing all queues
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn("QueueManager already running");
      return;
    }

    this.isRunning = true;
    logger.info("WebhookQueueManager started");
  }

  /**
   * Stop processing all queues
   */
  async stop(): Promise<void> {
    this.isRunning = false;
    logger.info("WebhookQueueManager stopped");
  }

  /**
   * Get queue by name
   */
  getQueue(name: string): WebhookQueue | undefined {
    return this.queues.get(name);
  }

  /**
   * Get all queue statistics
   */
  getAllStats() {
    const stats: Record<string, any> = {};

    for (const [name, queue] of this.queues) {
      stats[name] = queue.getStats();
    }

    return stats;
  }

  /**
   * Clear all queues
   */
  clearAll(): void {
    for (const queue of this.queues.values()) {
      queue.clear();
    }

    logger.info("All queues cleared");
  }

  /**
   * Check if manager is running
   */
  isActive(): boolean {
    return this.isRunning;
  }
}

/**
 * Default queue configurations
 */
export const DEFAULT_QUEUE_CONFIGS: Record<string, QueueConfig> = {
  default: {
    name: "webhook_default",
    maxConcurrency: WEBHOOK_CONSTANTS.DEFAULT_MAX_CONCURRENCY,
    maxRetries: WEBHOOK_CONSTANTS.DEFAULT_MAX_ATTEMPTS,
    retryDelayMs: WEBHOOK_CONSTANTS.DEFAULT_RETRY_DELAY_MS,
    backoffMultiplier: WEBHOOK_CONSTANTS.DEFAULT_BACKOFF_MULTIPLIER,
    maxBackoffMs: WEBHOOK_CONSTANTS.DEFAULT_MAX_BACKOFF_MS,
    visibilityTimeoutMs: WEBHOOK_CONSTANTS.DEFAULT_QUEUE_VISIBILITY_TIMEOUT,
    messageRetentionMs: WEBHOOK_CONSTANTS.DEFAULT_MESSAGE_RETENTION,
  },

  highPriority: {
    name: "webhook_high_priority",
    maxConcurrency: 5, // Higher concurrency for critical events
    maxRetries: WEBHOOK_CONSTANTS.DEFAULT_MAX_ATTEMPTS,
    retryDelayMs: 500, // Faster retry for high priority
    backoffMultiplier: WEBHOOK_CONSTANTS.DEFAULT_BACKOFF_MULTIPLIER,
    maxBackoffMs: WEBHOOK_CONSTANTS.DEFAULT_MAX_BACKOFF_MS,
    visibilityTimeoutMs: WEBHOOK_CONSTANTS.DEFAULT_QUEUE_VISIBILITY_TIMEOUT,
    messageRetentionMs: WEBHOOK_CONSTANTS.DEFAULT_MESSAGE_RETENTION,
  },

  retry: {
    name: "webhook_retry",
    maxConcurrency: 3, // Lower concurrency for retries
    maxRetries: WEBHOOK_CONSTANTS.DEFAULT_MAX_ATTEMPTS,
    retryDelayMs: WEBHOOK_CONSTANTS.DEFAULT_RETRY_DELAY_MS * 2,
    backoffMultiplier: WEBHOOK_CONSTANTS.DEFAULT_BACKOFF_MULTIPLIER,
    maxBackoffMs: WEBHOOK_CONSTANTS.DEFAULT_MAX_BACKOFF_MS,
    visibilityTimeoutMs: WEBHOOK_CONSTANTS.DEFAULT_QUEUE_VISIBILITY_TIMEOUT,
    messageRetentionMs: WEBHOOK_CONSTANTS.DEFAULT_MESSAGE_RETENTION,
  },

  deadLetter: {
    name: "webhook_dead_letter",
    maxConcurrency: 1, // Sequential processing for dead letters
    maxRetries: 0, // No retries for dead letters
    retryDelayMs: 0,
    backoffMultiplier: 1,
    maxBackoffMs: 0,
    visibilityTimeoutMs: WEBHOOK_CONSTANTS.DEFAULT_QUEUE_VISIBILITY_TIMEOUT,
    messageRetentionMs: WEBHOOK_CONSTANTS.DEFAULT_MESSAGE_RETENTION * 2, // Keep longer
  },
};
