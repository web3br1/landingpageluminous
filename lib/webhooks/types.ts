/**
 * Advanced Webhook System Types - Fase 3
 * Sistema avançado de processamento de webhooks com retry logic e dead letter queues
 */

import { z } from "zod";

// ===== WEBHOOK EVENT TYPES =====

export interface WebhookEvent {
  id: string;
  provider: "stripe" | "pagbank" | "custom";
  eventType: string;
  eventId: string;
  data: any;
  metadata: WebhookMetadata;
  processing: WebhookProcessingState;
  idempotencyKey: string;
}

export interface WebhookMetadata {
  timestamp: number;
  userAgent?: string;
  ipAddress?: string;
  userId?: string;
  sessionId?: string;
  correlationId: string;
  requestId: string;
}

export interface WebhookProcessingState {
  status: WebhookStatus;
  attempts: number;
  maxAttempts: number;
  nextRetryAt?: number;
  lastAttemptAt?: number;
  lastError?: string;
  processingTimeMs?: number;
  queueName: string;
  priority: WebhookPriority;
}

export type WebhookStatus =
  | "pending" // Aguardando processamento
  | "processing" // Sendo processado
  | "completed" // Processado com sucesso
  | "failed" // Falhou permanentemente
  | "retrying" // Aguardando retry
  | "dead_letter"; // Movido para dead letter queue

export type WebhookPriority = "low" | "normal" | "high" | "critical";

// ===== QUEUE TYPES =====

export interface QueueMessage {
  id: string;
  type: "webhook_event" | "retry_event" | "dead_letter_event";
  payload: WebhookEvent;
  metadata: {
    enqueuedAt: number;
    priority: WebhookPriority;
    expiresAt?: number;
    correlationId: string;
  };
}

export interface QueueConfig {
  name: string;
  maxConcurrency: number;
  maxRetries: number;
  retryDelayMs: number;
  backoffMultiplier: number;
  maxBackoffMs: number;
  deadLetterQueue?: string;
  visibilityTimeoutMs: number;
  messageRetentionMs: number;
}

// ===== PROCESSOR TYPES =====

export interface WebhookProcessor {
  process(event: WebhookEvent): Promise<WebhookProcessingResult>;
  canProcess(eventType: string, provider: string): boolean;
  getSupportedEventTypes(): string[];
}

export interface WebhookProcessingResult {
  success: boolean;
  error?: string;
  retryable: boolean;
  data?: any;
  processingTimeMs: number;
}

// ===== RETRY & DEAD LETTER TYPES =====

export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  backoffMultiplier: number;
  maxDelayMs: number;
  jitter: boolean;
}

export interface DeadLetterEvent extends WebhookEvent {
  deadLetteredAt: number;
  deadLetterReason: string;
  originalQueue: string;
  finalError: string;
  retryHistory: RetryAttempt[];
}

export interface RetryAttempt {
  attempt: number;
  timestamp: number;
  error: string;
  processingTimeMs: number;
  nextRetryDelayMs?: number;
}

// ===== ZOD SCHEMAS =====

export const WebhookMetadataSchema = z.object({
  timestamp: z.number(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  correlationId: z.string(),
  requestId: z.string(),
});

export const WebhookProcessingStateSchema = z.object({
  status: z.enum([
    "pending",
    "processing",
    "completed",
    "failed",
    "retrying",
    "dead_letter",
  ]),
  attempts: z.number().min(0),
  maxAttempts: z.number().min(1),
  nextRetryAt: z.number().optional(),
  lastAttemptAt: z.number().optional(),
  lastError: z.string().optional(),
  processingTimeMs: z.number().optional(),
  queueName: z.string(),
  priority: z.enum(["low", "normal", "high", "critical"]),
});

export const WebhookEventSchema = z.object({
  id: z.string(),
  provider: z.enum(["stripe", "pagbank", "custom"]),
  eventType: z.string(),
  eventId: z.string(),
  data: z.any(),
  metadata: WebhookMetadataSchema,
  processing: WebhookProcessingStateSchema,
  idempotencyKey: z.string(),
});

export const QueueMessageSchema = z.object({
  id: z.string(),
  type: z.enum(["webhook_event", "retry_event", "dead_letter_event"]),
  payload: WebhookEventSchema,
  metadata: z.object({
    enqueuedAt: z.number(),
    priority: z.enum(["low", "normal", "high", "critical"]),
    expiresAt: z.number().optional(),
    correlationId: z.string(),
  }),
});

// ===== CONFIGURATION TYPES =====

export interface WebhookSystemConfig {
  enabled: boolean;
  providers: {
    stripe: {
      enabled: boolean;
      secretKey: string;
      webhookSecret: string;
      supportedEvents: string[];
    };
    pagbank: {
      enabled: boolean;
      secretKey: string;
      webhookSecret: string;
      supportedEvents: string[];
    };
  };
  queues: {
    default: QueueConfig;
    highPriority: QueueConfig;
    retry: QueueConfig;
    deadLetter: QueueConfig;
  };
  retry: RetryConfig;
  security: {
    rateLimitPerMinute: number;
    maxPayloadSize: number;
    allowedIPs?: string[];
    requireSignature: boolean;
  };
  monitoring: {
    enableMetrics: boolean;
    enableTracing: boolean;
    alertThresholds: {
      queueSize: number;
      errorRate: number;
      processingDelay: number;
    };
  };
}

// ===== UTILITY TYPES =====

export type WebhookEventInput = {
  provider: "stripe" | "pagbank" | "custom";
  rawBody: string;
  signature: string;
  ipAddress?: string;
  userAgent?: string;
};

export type WebhookValidationResult = {
  isValid: boolean;
  event?: WebhookEvent;
  error?: string;
  shouldRetry?: boolean;
};

// ===== CONSTANTS =====

export const WEBHOOK_CONSTANTS = {
  DEFAULT_MAX_ATTEMPTS: 5,
  DEFAULT_RETRY_DELAY_MS: 1000,
  DEFAULT_BACKOFF_MULTIPLIER: 2,
  DEFAULT_MAX_BACKOFF_MS: 300000, // 5 minutes
  DEFAULT_QUEUE_VISIBILITY_TIMEOUT: 30000, // 30 seconds
  DEFAULT_MESSAGE_RETENTION: 604800000, // 7 days
  DEFAULT_MAX_CONCURRENCY: 10,
  IDEMPOTENCY_KEY_PREFIX: "webhook_",
} as const;

export const WEBHOOK_PRIORITIES: Record<string, WebhookPriority> = {
  // Stripe high priority events
  "checkout.session.completed": "critical",
  "payment_intent.succeeded": "high",
  "payment_intent.payment_failed": "high",
  "invoice.payment_failed": "high",

  // Medium priority
  "customer.subscription.created": "normal",
  "customer.subscription.updated": "normal",
  "invoice.payment_succeeded": "normal",

  // Low priority
  "customer.created": "low",
  "payment_method.attached": "low",
  default: "normal",
} as const;
