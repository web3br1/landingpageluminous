/**
 * Advanced Stripe Webhook Route - Fase 3
 * Rota avançada com processamento assíncrono, retry logic e dead letter queues
 */

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { getWebhookService } from "@/lib/webhooks/service";
import { WebhookEventInput } from "@/lib/webhooks/types";
import { logger } from "@/lib/observability/logger";
import { metrics } from "@/lib/observability/metrics";

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `webhook_advanced_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Get request details
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");
    const userAgent = headersList.get("user-agent");
    const forwardedFor = headersList.get("x-forwarded-for");
    const realIP = headersList.get("x-real-ip");
    const clientIP =
      forwardedFor?.split(",")[0]?.trim() ||
      realIP ||
      headersList.get("cf-connecting-ip") ||
      "unknown";

    logger.info("Advanced Stripe webhook received", {
      requestId,
      contentLength: body.length,
      hasSignature: !!signature,
      userAgent: userAgent || undefined,
      clientIP,
    });

    // Validate required headers
    if (!signature) {
      logger.warn("Advanced Stripe webhook: Missing signature", { requestId });
      return NextResponse.json(
        {
          error: "Missing stripe-signature header",
          requestId,
        },
        { status: 400 },
      );
    }

    if (!body) {
      logger.warn("Advanced Stripe webhook: Empty body", { requestId });
      return NextResponse.json(
        {
          error: "Empty request body",
          requestId,
        },
        { status: 400 },
      );
    }

    // Prepare webhook input
    const webhookInput: WebhookEventInput = {
      provider: "stripe",
      rawBody: body,
      signature,
      ipAddress: clientIP,
      userAgent: userAgent || undefined,
    };

    // Get webhook service and process
    const webhookService = getWebhookService();

    // Check if service is initialized
    if (!webhookService.getStats().isInitialized) {
      await webhookService.initialize();
    }

    // Process webhook asynchronously
    const result = await webhookService.processWebhook(webhookInput);

    const processingTime = Date.now() - startTime;

    if (result.isValid) {
      metrics.incrementCounter("webhook_stripe_advanced_received_total", 1, {
        status: "accepted",
      });

      // Note: Histogram not available in current metrics API
      // metrics.recordHistogram('webhook_stripe_advanced_processing_duration_seconds', processingTime / 1000, {
      //   status: 'accepted'
      // })

      logger.info("Advanced Stripe webhook accepted for processing", {
        requestId,
        eventId: result.event?.id,
        eventType: result.event?.eventType,
        processingTimeMs: processingTime,
        queueName: result.event?.processing.queueName,
      });

      return NextResponse.json({
        received: true,
        status: "accepted",
        eventId: result.event?.id,
        eventType: result.event?.eventType,
        processingTimeMs: processingTime,
        requestId,
      });
    } else {
      metrics.incrementCounter("webhook_stripe_advanced_received_total", 1, {
        status: "rejected",
        reason: result.error?.split(":")[0] || "unknown",
      });

      logger.warn("Advanced Stripe webhook rejected", {
        requestId,
        error: result.error ? new Error(result.error) : undefined,
        processingTimeMs: processingTime,
      });

      return NextResponse.json(
        {
          received: false,
          status: "rejected",
          error: result.error,
          processingTimeMs: processingTime,
          requestId,
        },
        { status: 400 },
      );
    }
  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    metrics.incrementCounter("webhook_stripe_advanced_error_total", 1);

    logger.error("Advanced Stripe webhook processing error", {
      requestId,
      error: error instanceof Error ? error : new Error(errorMessage),
      processingTimeMs: processingTime,
    });

    return NextResponse.json(
      {
        error: "Webhook processing failed",
        requestId,
        processingTimeMs: processingTime,
      },
      { status: 500 },
    );
  }
}

// ===== HEALTH CHECK ENDPOINT =====

export async function GET() {
  try {
    const webhookService = getWebhookService();
    const health = await webhookService.healthCheck();

    return NextResponse.json({
      service: "stripe-advanced-webhook",
      status: health.healthy ? "healthy" : "unhealthy",
      timestamp: Date.now(),
      ...health.details,
    });
  } catch (error) {
    logger.error("Health check failed", {
      error: error instanceof Error ? error : new Error("Health check failed"),
    });

    return NextResponse.json(
      {
        service: "stripe-advanced-webhook",
        status: "error",
        timestamp: Date.now(),
        error: "Health check failed",
      },
      { status: 500 },
    );
  }
}
