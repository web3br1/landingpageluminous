import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { logger } from "@/lib/observability/logger";

// Initialize Stripe with secret key
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-09-30.clover",
    })
  : null;

// Webhook secret for signature verification (simple endpoint)
const webhookSecret =
  process.env.STRIPE_WEBHOOK_SECRET_SIMPLE || process.env.STRIPE_WEBHOOK_SECRET;

// Check if Stripe is properly configured
const isStripeConfigured = stripe && webhookSecret;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Check if Stripe is configured
    if (!isStripeConfigured) {
      logger.warn("Stripe webhook (simple): Service not configured", {
        requestId,
        reason: "Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET",
      });
      return NextResponse.json(
        {
          error: "Stripe payment processing not configured",
          requestId,
        },
        { status: 503 },
      );
    }

    const body = await request.text();
    const headersList = await headers();
    const sig = headersList.get("stripe-signature");

    // Basic validation
    if (!sig || !body) {
      logger.warn("Stripe webhook (simple): Missing signature or body", {
        requestId,
        hasSignature: !!sig,
        hasBody: !!body,
      });
      return NextResponse.json(
        {
          error: "Missing signature or body",
          requestId,
        },
        { status: 400 },
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;

    try {
      event = stripe!.webhooks.constructEvent(body, sig, webhookSecret!);
    } catch (err: any) {
      logger.error("Stripe webhook (simple): Signature verification failed", {
        requestId,
        error: err.message,
        signatureLength: sig.length,
      });
      return NextResponse.json(
        {
          error: "Webhook signature verification failed",
          requestId,
        },
        { status: 400 },
      );
    }

    // Log successful event reception
    logger.info("Stripe webhook (simple): Event received", {
      requestId,
      eventType: event.type,
      eventId: event.id,
      created: event.created,
    });

    // Process simplified events (focus on essential payment events)
    let processingResult = "unhandled";
    let customerId: string | null = null;

    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;
        customerId =
          typeof session.customer === "string" ? session.customer : null;

        logger.info("Stripe webhook (simple): Checkout session completed", {
          requestId,
          sessionId: session.id,
          customerId,
          paymentStatus: session.payment_status,
          amountTotal: session.amount_total,
        });

        if (session.payment_status === "paid") {
          processingResult = "payment_confirmed";
          // In a real implementation, this would trigger business logic
          // For now, just log the successful payment
        } else {
          processingResult = "payment_pending";
        }
        break;

      case "payment_intent.succeeded":
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        customerId =
          typeof paymentIntent.customer === "string"
            ? paymentIntent.customer
            : null;

        logger.info("Stripe webhook (simple): Payment intent succeeded", {
          requestId,
          paymentIntentId: paymentIntent.id,
          customerId,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
        });

        processingResult = "payment_intent_succeeded";
        break;

      case "payment_intent.payment_failed":
        const failedPaymentIntent = event.data.object as Stripe.PaymentIntent;
        customerId =
          typeof failedPaymentIntent.customer === "string"
            ? failedPaymentIntent.customer
            : null;

        logger.warn("Stripe webhook (simple): Payment intent failed", {
          requestId,
          paymentIntentId: failedPaymentIntent.id,
          customerId,
          amount: failedPaymentIntent.amount,
          lastPaymentError: failedPaymentIntent.last_payment_error?.message,
        });

        processingResult = "payment_intent_failed";
        break;

      default:
        logger.info("Stripe webhook (simple): Unhandled event type", {
          requestId,
          eventType: event.type,
          eventId: event.id,
        });
        processingResult = "unhandled";
    }

    const processingTime = Date.now() - startTime;

    logger.info("Stripe webhook (simple): Event processed successfully", {
      requestId,
      eventType: event.type,
      processingResult,
      processingTimeMs: processingTime,
      customerId,
    });

    return NextResponse.json({
      received: true,
      event: event.type,
      status: "processed",
      processingResult,
      requestId,
      processingTimeMs: processingTime,
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;

    logger.error("Stripe webhook (simple): Processing error", {
      requestId,
      error: error instanceof Error ? error : new Error("Unknown error"),
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
