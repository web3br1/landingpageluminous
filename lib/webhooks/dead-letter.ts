/**
 * Dead Letter Queue Handler - Fase 3
 * Gerenciamento de eventos que falharam permanentemente
 */

import { logger } from "../observability/logger";
import { metrics } from "../observability/metrics";
import {
  DeadLetterEvent,
  RetryAttempt,
  WebhookEvent,
  QueueMessage,
} from "./types";

/**
 * Dead Letter Queue Manager
 */
export class DeadLetterQueue {
  private deadLetters: DeadLetterEvent[] = [];
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
    logger.info(`DeadLetterQueue initialized`, { maxSize });
  }

  /**
   * Add event to dead letter queue
   */
  async addToDeadLetter(
    event: WebhookEvent,
    finalError: string,
    retryHistory: RetryAttempt[],
    reason: string = "max_retries_exceeded",
  ): Promise<void> {
    const deadLetterEvent: DeadLetterEvent = {
      ...event,
      deadLetteredAt: Date.now(),
      deadLetterReason: reason,
      originalQueue: event.processing.queueName,
      finalError,
      retryHistory,
    };

    this.deadLetters.push(deadLetterEvent);

    // Maintain size limit (remove oldest)
    if (this.deadLetters.length > this.maxSize) {
      const removed = this.deadLetters.shift();
      logger.warn(
        `Dead letter queue size limit exceeded, removed oldest event`,
        {
          removedEventId: removed?.id,
          maxSize: this.maxSize,
        },
      );
    }

    metrics.incrementCounter("webhook_dead_letter_total", 1, {
      provider: event.provider,
      event_type: event.eventType,
      reason,
    });

    logger.error(`Event moved to dead letter queue`, {
      eventId: event.id,
      eventType: event.eventType,
      provider: event.provider,
      reason,
      finalError,
      retryAttempts: retryHistory.length,
      deadLetterQueueSize: this.deadLetters.length,
    });
  }

  /**
   * Get dead letter events
   */
  getDeadLetters(
    provider?: string,
    eventType?: string,
    limit: number = 50,
    offset: number = 0,
  ): DeadLetterEvent[] {
    let filtered = this.deadLetters;

    if (provider) {
      filtered = filtered.filter((dl) => dl.provider === provider);
    }

    if (eventType) {
      filtered = filtered.filter((dl) => dl.eventType === eventType);
    }

    // Sort by dead letter timestamp (newest first)
    filtered.sort((a, b) => b.deadLetteredAt - a.deadLetteredAt);

    return filtered.slice(offset, offset + limit);
  }

  /**
   * Get dead letter statistics
   */
  getStats() {
    const total = this.deadLetters.length;
    const byProvider: Record<string, number> = {};
    const byReason: Record<string, number> = {};
    const byEventType: Record<string, number> = {};

    for (const dl of this.deadLetters) {
      byProvider[dl.provider] = (byProvider[dl.provider] || 0) + 1;
      byReason[dl.deadLetterReason] = (byReason[dl.deadLetterReason] || 0) + 1;
      byEventType[dl.eventType] = (byEventType[dl.eventType] || 0) + 1;
    }

    const recentDeadLetters = this.deadLetters.filter(
      (dl) => Date.now() - dl.deadLetteredAt < 24 * 60 * 60 * 1000, // Last 24 hours
    ).length;

    return {
      total,
      recentDeadLetters,
      byProvider,
      byReason,
      byEventType,
      avgRetryAttempts:
        total > 0
          ? this.deadLetters.reduce(
              (sum, dl) => sum + dl.retryHistory.length,
              0,
            ) / total
          : 0,
    };
  }

  /**
   * Replay dead letter event (move back to processing queue)
   */
  async replayDeadLetter(eventId: string): Promise<QueueMessage | null> {
    const index = this.deadLetters.findIndex((dl) => dl.id === eventId);

    if (index === -1) {
      logger.warn(`Dead letter event not found for replay`, { eventId });
      return null;
    }

    const deadLetter = this.deadLetters[index];

    // Create new queue message for replay
    const queueMessage: QueueMessage = {
      id: `replay_${deadLetter.id}_${Date.now()}`,
      type: "retry_event",
      payload: {
        ...deadLetter,
        processing: {
          ...deadLetter.processing,
          status: "pending" as const,
          attempts: 0, // Reset attempts for replay
          lastError: undefined,
          nextRetryAt: undefined,
        },
      },
      metadata: {
        enqueuedAt: Date.now(),
        priority: "normal", // Replay with normal priority
        correlationId: deadLetter.metadata.correlationId,
      },
    };

    // Remove from dead letter queue
    this.deadLetters.splice(index, 1);

    metrics.incrementCounter("webhook_dead_letter_replayed_total", 1, {
      provider: deadLetter.provider,
      event_type: deadLetter.eventType,
    });

    logger.info(`Dead letter event replayed`, {
      originalEventId: eventId,
      newMessageId: queueMessage.id,
      eventType: deadLetter.eventType,
      provider: deadLetter.provider,
      remainingDeadLetters: this.deadLetters.length,
    });

    return queueMessage;
  }

  /**
   * Remove dead letter event permanently
   */
  async removeDeadLetter(eventId: string): Promise<boolean> {
    const index = this.deadLetters.findIndex((dl) => dl.id === eventId);

    if (index === -1) {
      logger.warn(`Dead letter event not found for removal`, { eventId });
      return false;
    }

    const removed = this.deadLetters.splice(index, 1)[0];

    metrics.incrementCounter("webhook_dead_letter_removed_total", 1, {
      provider: removed.provider,
      event_type: removed.eventType,
    });

    logger.info(`Dead letter event removed permanently`, {
      eventId,
      eventType: removed.eventType,
      provider: removed.provider,
      remainingDeadLetters: this.deadLetters.length,
    });

    return true;
  }

  /**
   * Clear all dead letters (for maintenance/testing)
   */
  clear(): void {
    const clearedCount = this.deadLetters.length;
    this.deadLetters = [];

    logger.info(`Dead letter queue cleared`, {
      clearedCount,
    });
  }

  /**
   * Export dead letters for backup/analysis
   */
  exportDeadLetters(): DeadLetterEvent[] {
    return [...this.deadLetters];
  }

  /**
   * Get dead letter by ID
   */
  getDeadLetter(eventId: string): DeadLetterEvent | null {
    return this.deadLetters.find((dl) => dl.id === eventId) || null;
  }
}

/**
 * Dead Letter Queue Monitor
 */
export class DeadLetterMonitor {
  private deadLetterQueue: DeadLetterQueue;
  private alertThreshold: number;
  private checkInterval: number;
  private intervalId?: NodeJS.Timeout;

  constructor(
    deadLetterQueue: DeadLetterQueue,
    alertThreshold: number = 50,
    checkInterval: number = 300000, // 5 minutes
  ) {
    this.deadLetterQueue = deadLetterQueue;
    this.alertThreshold = alertThreshold;
    this.checkInterval = checkInterval;
  }

  /**
   * Start monitoring
   */
  start(): void {
    logger.info(`DeadLetterMonitor started`, {
      alertThreshold: this.alertThreshold,
      checkInterval: this.checkInterval,
    });

    this.intervalId = setInterval(() => {
      this.checkDeadLetterQueue();
    }, this.checkInterval);

    // Initial check
    this.checkDeadLetterQueue();
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    logger.info(`DeadLetterMonitor stopped`);
  }

  /**
   * Check dead letter queue and alert if needed
   */
  private checkDeadLetterQueue(): void {
    const stats = this.deadLetterQueue.getStats();
    const recentCount = stats.recentDeadLetters;

    metrics.recordHistogram("webhook_dead_letter_queue_size", stats.total);

    if (recentCount >= this.alertThreshold) {
      logger.error(`Dead letter queue alert threshold exceeded`, {
        recentCount,
        totalCount: stats.total,
        alertThreshold: this.alertThreshold,
        byProvider: stats.byProvider,
        byReason: stats.byReason,
      });

      // In a real implementation, this would trigger alerts (Slack, email, etc.)
      // For now, just log the alert
    }

    // Log periodic stats
    logger.info(`Dead letter queue status`, {
      total: stats.total,
      recent: recentCount,
      avgRetries: stats.avgRetryAttempts,
    });
  }

  /**
   * Get current monitoring status
   */
  getStatus() {
    return {
      isActive: !!this.intervalId,
      alertThreshold: this.alertThreshold,
      checkInterval: this.checkInterval,
      lastCheck: Date.now(), // Simplified - in real implementation track last check time
    };
  }
}
