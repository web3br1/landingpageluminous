/**
 * Advanced Webhook Service - Fase 3
 * Serviço principal para processamento avançado de webhooks
 */

import { logger } from "../observability/logger";
import { metrics } from "../observability/metrics";
import {
  WebhookEvent,
  WebhookEventInput,
  WebhookValidationResult,
  WebhookSystemConfig,
  WEBHOOK_CONSTANTS,
  WEBHOOK_PRIORITIES,
} from "./types";
import { WebhookQueueManager, DEFAULT_QUEUE_CONFIGS } from "./queue";
import { DeadLetterQueue, DeadLetterMonitor } from "./dead-letter";
import { AdvancedWebhookProcessor, DEFAULT_RETRY_CONFIG } from "./processor";
import { WebhookSecurityManager, getWebhookSecurityManager } from "./security";
import Stripe from "stripe";

/**
 * Webhook Service Configuration
 */
const DEFAULT_WEBHOOK_CONFIG: WebhookSystemConfig = {
  enabled: process.env.NODE_ENV === "production", // Only enable in production by default
  providers: {
    stripe: {
      enabled: !!process.env.STRIPE_SECRET_KEY,
      secretKey: process.env.STRIPE_SECRET_KEY || "",
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
      supportedEvents: [
        "checkout.session.completed",
        "payment_intent.succeeded",
        "payment_intent.payment_failed",
        "invoice.payment_succeeded",
        "invoice.payment_failed",
        "customer.subscription.created",
        "customer.subscription.updated",
        "customer.subscription.deleted",
      ],
    },
    pagbank: {
      enabled: !!process.env.PAGBANK_SECRET_KEY,
      secretKey: process.env.PAGBANK_SECRET_KEY || "",
      webhookSecret: process.env.PAGBANK_WEBHOOK_SECRET || "",
      supportedEvents: [
        "payment.created",
        "payment.approved",
        "payment.denied",
        "subscription.created",
        "subscription.updated",
      ],
    },
  },
  queues: {
    default: DEFAULT_QUEUE_CONFIGS.default,
    highPriority: DEFAULT_QUEUE_CONFIGS.highPriority,
    retry: DEFAULT_QUEUE_CONFIGS.retry,
    deadLetter: DEFAULT_QUEUE_CONFIGS.deadLetter,
  },
  retry: DEFAULT_RETRY_CONFIG,
  security: {
    rateLimitPerMinute: 100,
    maxPayloadSize: 1024 * 1024, // 1MB
    allowedIPs: process.env.WEBHOOK_ALLOWED_IPS?.split(","),
    requireSignature: true,
  },
  monitoring: {
    enableMetrics: true,
    enableTracing: true,
    alertThresholds: {
      queueSize: 100,
      errorRate: 0.1, // 10%
      processingDelay: 300000, // 5 minutes
    },
  },
};

/**
 * Advanced Webhook Service
 */
export class AdvancedWebhookService {
  private config: WebhookSystemConfig;
  private queueManager: WebhookQueueManager;
  private deadLetterQueue: DeadLetterQueue;
  private deadLetterMonitor: DeadLetterMonitor;
  private processor: AdvancedWebhookProcessor;
  private securityManager: WebhookSecurityManager;
  private stripe?: Stripe;
  private isInitialized: boolean = false;

  constructor(config: Partial<WebhookSystemConfig> = {}) {
    this.config = { ...DEFAULT_WEBHOOK_CONFIG, ...config };

    // Initialize Stripe if enabled
    if (this.config.providers.stripe.enabled) {
      this.stripe = new Stripe(this.config.providers.stripe.secretKey, {
        apiVersion: "2025-09-30.clover",
      });
    }

    // Initialize components
    this.queueManager = new WebhookQueueManager(this.config.queues);
    this.deadLetterQueue = new DeadLetterQueue(1000); // Max 1000 dead letters
    this.deadLetterMonitor = new DeadLetterMonitor(
      this.deadLetterQueue,
      this.config.monitoring.alertThresholds.queueSize,
    );
    this.processor = new AdvancedWebhookProcessor(
      this.queueManager,
      this.deadLetterQueue,
      this.config.retry,
    );

    this.securityManager = getWebhookSecurityManager({
      rateLimit: {
        requestsPerMinute: this.config.security.rateLimitPerMinute,
        blockDurationMs: 15 * 60 * 1000, // 15 minutes
      },
      inputValidation: {
        maxPayloadSize: this.config.security.maxPayloadSize,
      },
      audit: {
        logAllRequests: process.env.NODE_ENV === "development",
        logFailedRequests: true,
        logRateLimited: true,
      },
      allowedIPs: this.config.security.allowedIPs,
    });

    logger.info(`AdvancedWebhookService initialized`, {
      enabled: this.config.enabled,
      stripeEnabled: this.config.providers.stripe.enabled,
      pagbankEnabled: this.config.providers.pagbank.enabled,
    });
  }

  /**
   * Initialize the webhook service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn("Webhook service already initialized");
      return;
    }

    try {
      // Start queue processing
      await this.queueManager.start();
      await this.processor.startProcessing();

      // Start dead letter monitoring
      this.deadLetterMonitor.start();

      this.isInitialized = true;

      logger.info("Advanced webhook service started successfully");
    } catch (error) {
      logger.error("Failed to initialize webhook service", {
        error:
          error instanceof Error
            ? error
            : new Error("Unknown initialization error"),
      });
      throw error;
    }
  }

  /**
   * Shutdown the webhook service
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) return;

    try {
      await this.processor.stopProcessing();
      await this.queueManager.stop();
      this.deadLetterMonitor.stop();
      this.processor.destroy();

      this.isInitialized = false;

      logger.info("Advanced webhook service shut down successfully");
    } catch (error) {
      logger.error("Error during webhook service shutdown", {
        error:
          error instanceof Error ? error : new Error("Unknown shutdown error"),
      });
    }
  }

  /**
   * Process incoming webhook
   */
  async processWebhook(
    input: WebhookEventInput,
  ): Promise<WebhookValidationResult> {
    const startTime = Date.now();
    const span = metrics.startTimer("webhook_processing_total");

    try {
      // Check if service is enabled
      if (!this.config.enabled) {
        this.securityManager.logProcessing(
          {
            id: "disabled",
            provider: input.provider,
            eventType: "service_disabled",
            eventId: "service_disabled",
            data: {},
            metadata: {
              correlationId: "",
              requestId: "",
              timestamp: Date.now(),
            },
            processing: {
              status: "failed",
              attempts: 0,
              maxAttempts: 1,
              queueName: "default",
              priority: "low",
            },
            idempotencyKey: "",
          },
          "failed",
          { reason: "service_disabled" },
        );
        return {
          isValid: false,
          error: "Webhook service is disabled",
          shouldRetry: false,
        };
      }

      // Security checks first
      const securityResult = await this.securityManager.processSecurity(input);
      if (!securityResult.allowed) {
        return {
          isValid: false,
          error: securityResult.error || "Security check failed",
          shouldRetry: false,
        };
      }

      // Use sanitized input
      const sanitizedInput = securityResult.sanitizedInput!;

      // Validate webhook
      const validation = await this.validateWebhook(sanitizedInput);
      if (!validation.isValid) {
        this.securityManager.logProcessing(
          {
            id: "validation_failed",
            provider: input.provider,
            eventType: "validation_error",
            eventId: "validation_failed",
            data: {},
            metadata: {
              correlationId: "",
              requestId: "",
              timestamp: Date.now(),
            },
            processing: {
              status: "failed",
              attempts: 0,
              maxAttempts: 1,
              queueName: "default",
              priority: "low",
            },
            idempotencyKey: "",
          },
          "failed",
          { error: validation.error },
        );
        metrics.incrementCounter("webhook_validation_failed_total", 1);
        return validation;
      }

      const event = validation.event!;
      const queueName = this.getQueueForEvent(event);

      // Create queue message
      const queueMessage = {
        id: `webhook_${event.id}_${Date.now()}`,
        type: "webhook_event" as const,
        payload: event,
        metadata: {
          enqueuedAt: Date.now(),
          priority: event.processing.priority,
          correlationId: event.metadata.correlationId,
        },
      };

      // Add to appropriate queue
      const queue = this.queueManager.getQueue(queueName);
      if (!queue) {
        throw new Error(`Queue not found: ${queueName}`);
      }

      await queue.enqueue(queueMessage);

      span();
      metrics.recordHistogram(
        "webhook_enqueue_duration_seconds",
        (Date.now() - startTime) / 1000,
      );

      // Log successful processing start
      this.securityManager.logProcessing(event, "started", {
        queueName,
        priority: event.processing.priority,
      });

      logger.info(`Webhook enqueued for processing`, {
        eventId: event.id,
        eventType: event.eventType,
        provider: event.provider,
        queueName,
        priority: event.processing.priority,
      });

      return { isValid: true, event };
    } catch (error) {
      span();
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      logger.error("Webhook processing failed", {
        error: error instanceof Error ? error : new Error(errorMessage),
        processingTimeMs: Date.now() - startTime,
      });

      return {
        isValid: false,
        error: errorMessage,
        shouldRetry: false,
      };
    }
  }

  /**
   * Validate incoming webhook
   */
  private async validateWebhook(
    input: WebhookEventInput,
  ): Promise<WebhookValidationResult> {
    try {
      // Check if service is enabled
      if (!this.config.enabled) {
        return {
          isValid: false,
          error: "Webhook service is disabled",
          shouldRetry: false,
        };
      }

      // Basic validation
      if (!input.rawBody || !input.signature) {
        return {
          isValid: false,
          error: "Missing body or signature",
          shouldRetry: false,
        };
      }

      // Size validation
      if (input.rawBody.length > this.config.security.maxPayloadSize) {
        return {
          isValid: false,
          error: "Payload too large",
          shouldRetry: false,
        };
      }

      // IP validation (if configured)
      if (this.config.security.allowedIPs && input.ipAddress) {
        if (!this.config.security.allowedIPs.includes(input.ipAddress)) {
          return {
            isValid: false,
            error: "IP address not allowed",
            shouldRetry: false,
          };
        }
      }

      // Parse and validate the webhook event
      let event: WebhookEvent;

      if (input.provider === "stripe") {
        const validation = await this.validateStripeWebhook(input);
        if (!validation.isValid) return validation;
        event = validation.event!;
      } else if (input.provider === "pagbank") {
        const validation = await this.validatePagbankWebhook(input);
        if (!validation.isValid) return validation;
        event = validation.event!;
      } else {
        return {
          isValid: false,
          error: `Unsupported provider: ${input.provider}`,
          shouldRetry: false,
        };
      }

      return { isValid: true, event };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Validation error";
      logger.error("Webhook validation error", {
        error: error instanceof Error ? error : new Error(errorMessage),
      });

      return {
        isValid: false,
        error: errorMessage,
        shouldRetry: false,
      };
    }
  }

  /**
   * Validate Stripe webhook
   */
  private async validateStripeWebhook(
    input: WebhookEventInput,
  ): Promise<WebhookValidationResult> {
    if (!this.stripe || !this.config.providers.stripe.enabled) {
      return {
        isValid: false,
        error: "Stripe provider not enabled",
        shouldRetry: false,
      };
    }

    try {
      // Verify signature
      const event = this.stripe.webhooks.constructEvent(
        input.rawBody,
        input.signature,
        this.config.providers.stripe.webhookSecret,
      );

      // Check if event type is supported
      if (!this.config.providers.stripe.supportedEvents.includes(event.type)) {
        return {
          isValid: false,
          error: `Unsupported event type: ${event.type}`,
          shouldRetry: false,
        };
      }

      // Create webhook event
      const webhookEvent: WebhookEvent = {
        id: event.id,
        provider: "stripe",
        eventType: event.type,
        eventId: event.id,
        data: event.data.object,
        metadata: {
          timestamp: event.created * 1000, // Convert to milliseconds
          userAgent: input.userAgent,
          ipAddress: input.ipAddress,
          correlationId: `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          requestId: `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        },
        processing: {
          status: "pending",
          attempts: 0,
          maxAttempts: this.config.retry.maxAttempts,
          queueName: this.getQueueForPriority(
            WEBHOOK_PRIORITIES[event.type] || "normal",
          ),
          priority: WEBHOOK_PRIORITIES[event.type] || "normal",
        },
        idempotencyKey: `${WEBHOOK_CONSTANTS.IDEMPOTENCY_KEY_PREFIX}${event.id}`,
      };

      return { isValid: true, event: webhookEvent };
    } catch (error) {
      return {
        isValid: false,
        error: `Stripe validation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        shouldRetry: false,
      };
    }
  }

  /**
   * Validate PagBank webhook (placeholder - implement based on PagBank API)
   */
  private async validatePagbankWebhook(
    input: WebhookEventInput,
  ): Promise<WebhookValidationResult> {
    // Placeholder implementation - adapt based on actual PagBank webhook format
    return {
      isValid: false,
      error: "PagBank webhook validation not implemented",
      shouldRetry: false,
    };
  }

  /**
   * Get appropriate queue for event
   */
  private getQueueForEvent(event: WebhookEvent): string {
    return event.processing.queueName;
  }

  /**
   * Get queue name for priority
   */
  private getQueueForPriority(
    priority: keyof typeof WEBHOOK_PRIORITIES,
  ): string {
    switch (priority) {
      case "critical":
      case "high":
        return "highPriority";
      case "normal":
      case "low":
      default:
        return "default";
    }
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      isInitialized: this.isInitialized,
      config: {
        enabled: this.config.enabled,
        stripeEnabled: this.config.providers.stripe.enabled,
        pagbankEnabled: this.config.providers.pagbank.enabled,
      },
      processor: this.processor.getStats(),
      deadLetterMonitor: this.deadLetterMonitor.getStatus(),
      security: this.securityManager.getStats(),
    };
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    details: Record<string, unknown>;
  }> {
    try {
      const stats = this.getStats();
      const queueStats = this.queueManager.getAllStats();

      // Basic health checks
      const healthy =
        this.isInitialized &&
        Object.values(queueStats).every(
          (q) => q.total < this.config.monitoring.alertThresholds.queueSize,
        );

      return {
        healthy,
        details: {
          ...stats,
          queueStats,
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      return {
        healthy: false,
        details: {
          error: error instanceof Error ? error.message : "Health check failed",
          timestamp: Date.now(),
        },
      };
    }
  }
}

// ===== SINGLETON INSTANCE =====

let webhookServiceInstance: AdvancedWebhookService | null = null;

export function getWebhookService(
  config?: Partial<WebhookSystemConfig>,
): AdvancedWebhookService {
  if (!webhookServiceInstance) {
    webhookServiceInstance = new AdvancedWebhookService(config);
  }
  return webhookServiceInstance;
}

export function destroyWebhookService(): void {
  if (webhookServiceInstance) {
    webhookServiceInstance.shutdown();
    webhookServiceInstance = null;
  }
}
