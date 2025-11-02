import { headers } from "next/headers";
import Stripe from "stripe";
import { paymentConfig, isStripeEnabled } from "@/lib/payments/config";
// import { observability } from '@/lib/observability' // Temporarily disabled due to build issues
import { userService, UserSubscription } from "@/lib/users/user-service";
import { emailService } from "@/lib/email/email-service";
import { billingService, BillingRecord } from "@/lib/billing/billing-service";
import { Result } from "@/lib/core/result";
import {
  createSuccessResponse,
  createErrorResponse,
  HTTP_STATUS,
} from "../../../../lib/architecture/api-handler";

// Initialize Stripe only if configured
const stripe =
  isStripeEnabled && paymentConfig.stripe
    ? new Stripe(paymentConfig.stripe.secretKey, {
        apiVersion: "2025-09-30.clover",
      })
    : null;

// Webhook secret for signature verification
const webhookSecret =
  isStripeEnabled && paymentConfig.stripe
    ? paymentConfig.stripe.webhookSecret
    : null;

// Utility function to log webhook events
async function logWebhookEvent(
  eventType: string,
  eventId: string,
  data: unknown,
) {
  console.log(`[Stripe Webhook] ${eventType}: ${eventId}`, {
    timestamp: new Date().toISOString(),
    eventType,
    eventId,
    data: JSON.stringify(data, null, 2),
  });

  // TODO: Send to observability when metrics system is stable
  // try {
  //   if (observability?.metrics?.incrementCounter) {
  //     await observability.metrics.incrementCounter(`stripe_webhook_${eventType}`, 1)
  //   }
  // } catch (error) {
  //   console.warn('Failed to send webhook metrics:', error)
  // }
}

// User and billing management functions using real services
async function updateUserSubscription(
  customerId: string,
  subscriptionData: Partial<UserSubscription>,
) {
  const result = await userService.updateUserSubscription(
    customerId,
    subscriptionData,
  );
  if (isErr(result)) {
    console.error(
      `[Stripe Webhook] Failed to update subscription for customer ${customerId}:`,
      result.error,
    );
    return false;
  }
  return true;
}

// Interface para dados de cobrança Stripe
interface StripeChargeData {
  customerId?: string;
  amount?: number;
  currency?: string;
  attemptCount?: number;
  errorMessage?: string;
  status?: string;
}

async function sendConfirmationEmail(
  customerEmail: string,
  eventType: string,
  data?: unknown,
) {
  const chargeData = data as StripeChargeData;
  try {
    let emailResult;

    switch (eventType) {
      case "payment-confirmation":
        emailResult = await emailService.sendPaymentConfirmationEmail(
          customerEmail,
          data,
        );
        break;
      case "receipt":
        emailResult = await emailService.sendReceiptEmail(customerEmail, data);
        break;
      case "payment-failed":
        emailResult = await emailService.sendPaymentFailedEmail(
          customerEmail,
          data,
        );
        break;
      case "subscription-cancelled":
        emailResult = await emailService.sendSubscriptionCancelledEmail(
          customerEmail,
          data,
        );
        break;
      case "welcome":
        emailResult = await emailService.sendWelcomeEmail(
          customerEmail,
          (data as { customerId?: string })?.customerId || "unknown",
        );
        break;
      default:
        console.log(`[Stripe Webhook] Unknown email type: ${eventType}`);
        return false;
    }

    if (isErr(emailResult)) {
      console.error(
        `[Stripe Webhook] Failed to send ${eventType} email to ${customerEmail}:`,
        emailResult.error,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error(`[Stripe Webhook] Error sending ${eventType} email:`, error);
    return false;
  }
}

async function updateBillingStatus(
  invoiceId: string,
  customerId: string,
  status: string,
  data?: unknown,
) {
  try {
    const chargeData = data as StripeChargeData;
    let billingResult;

    switch (status) {
      case "paid":
        billingResult = await billingService.recordSuccessfulPayment(
          invoiceId,
          customerId,
          chargeData.amount || 0,
          chargeData.currency || "BRL",
        );
        break;
      case "failed":
        billingResult = await billingService.recordPaymentFailure(
          invoiceId,
          customerId,
          chargeData.amount || 0,
          chargeData.currency || "BRL",
          chargeData.attemptCount || 1,
          chargeData.errorMessage,
        );
        break;
      default:
        billingResult = await billingService.updateBillingStatus(
          invoiceId,
          customerId,
          status as "paid" | "failed" | "pending" | "cancelled",
          data as Partial<BillingRecord>,
        );
    }

    if (isErr(billingResult)) {
      console.error(
        `[Stripe Webhook] Failed to update billing status for invoice ${invoiceId}:`,
        billingResult.error,
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error(`[Stripe Webhook] Error updating billing status:`, error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!isStripeEnabled || !stripe || !webhookSecret) {
      console.error("Stripe webhook: Stripe not configured");
      return createErrorResponse(
        "STRIPE_NOT_CONFIGURED",
        "Stripe payment processing not configured",
        {
          status: HTTP_STATUS.SERVICE_UNAVAILABLE,
          details: "Configure STRIPE_SECRET_KEY and other required environment variables",
        }
      );
    }

    const body = await request.text();
    const headersList = await headers();
    const sig = headersList.get("stripe-signature");

    if (!sig || !body) {
      console.error("Stripe webhook: Missing signature or body");
      return createErrorResponse(
        "MISSING_SIGNATURE",
        "Missing signature or body",
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`Webhook signature verification failed:`, errorMessage);
      return createErrorResponse(
        "INVALID_SIGNATURE",
        "Webhook signature verification failed",
        { status: HTTP_STATUS.BAD_REQUEST }
      );
    }

    // Process the event
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;
        await logWebhookEvent("checkout.session.completed", session.id, {
          customerId: session.customer,
          paymentStatus: session.payment_status,
          amountTotal: session.amount_total,
        });

        // Process successful payment
        if (session.customer && typeof session.customer === "string") {
          await updateUserSubscription(session.customer, {
            status: "active",
          });
        }

        // Send confirmation email
        if (session.customer_details?.email) {
          await sendConfirmationEmail(
            session.customer_details.email,
            "payment-confirmation",
            {
              id: session.id,
              amount: session.amount_total,
              currency: session.currency,
            },
          );
        }
        break;

      case "invoice.payment_succeeded":
        const invoice = event.data.object as Stripe.Invoice;
        await logWebhookEvent("invoice.payment_succeeded", invoice.id, {
          customerId: invoice.customer,
          amountPaid: invoice.amount_paid,
          currency: invoice.currency,
          subscriptionId: (invoice as { subscription?: string }).subscription,
        });

        // Update billing status
        await updateBillingStatus(
          invoice.id,
          invoice.customer as string,
          "paid",
          {
            amount: invoice.amount_paid,
            currency: invoice.currency,
          },
        );

        // Send receipt email
        if (invoice.customer_email) {
          await sendConfirmationEmail(invoice.customer_email, "receipt", {
            id: invoice.id,
            amount: invoice.amount_paid,
            currency: invoice.currency,
          });
        }
        break;

      case "invoice.payment_failed":
        const failedInvoice = event.data.object as Stripe.Invoice;
        await logWebhookEvent("invoice.payment_failed", failedInvoice.id, {
          customerId: failedInvoice.customer,
          amountDue: failedInvoice.amount_due,
          currency: failedInvoice.currency,
          attemptCount: failedInvoice.attempt_count,
        });

        // Update billing status
        await updateBillingStatus(
          failedInvoice.id,
          failedInvoice.customer as string,
          "failed",
          {
            amount: failedInvoice.amount_due,
            currency: failedInvoice.currency,
            attemptCount: failedInvoice.attempt_count,
          },
        );

        // Notify user of payment failure
        if (failedInvoice.customer_email) {
          await sendConfirmationEmail(
            failedInvoice.customer_email,
            "payment-failed",
            {
              id: failedInvoice.id,
              amount: failedInvoice.amount_due,
              currency: failedInvoice.currency,
            },
          );
        }
        break;

      case "customer.subscription.created":
        const subscription = event.data.object as Stripe.Subscription;
        await logWebhookEvent(
          "customer.subscription.created",
          subscription.id,
          {
            customerId: subscription.customer,
            status: subscription.status as
              | "active"
              | "canceled"
              | "incomplete"
              | "suspended",
            currentPeriodStart: (
              subscription as { current_period_start?: number }
            ).current_period_start,
            currentPeriodEnd: (subscription as { current_period_end?: number })
              .current_period_end,
          },
        );

        // Activate user account and send welcome email
        if (typeof subscription.customer === "string") {
          await updateUserSubscription(subscription.customer, {
            subscriptionId: subscription.id,
            status: subscription.status as
              | "active"
              | "canceled"
              | "incomplete"
              | "suspended",
            planId: (subscription as any).items?.data[0]?.price?.id,
            periodStart: (subscription as any).current_period_start,
            periodEnd: (subscription as any).current_period_end,
          });

          // Try to send welcome email if we have customer email
          const userResult = await userService.getUser(subscription.customer);
          if (isOk(userResult) && userResult.value.email) {
            await sendConfirmationEmail(userResult.value.email, "welcome", {
              customerId: subscription.customer,
            });
          }
        }
        break;

      case "customer.subscription.updated":
        const updatedSubscription = event.data.object as Stripe.Subscription;
        await logWebhookEvent(
          "customer.subscription.updated",
          updatedSubscription.id,
          {
            customerId: updatedSubscription.customer,
            status: updatedSubscription.status as any,
            previousAttributes: event.data.previous_attributes,
          },
        );

        // Update user plan
        if (typeof updatedSubscription.customer === "string") {
          await updateUserSubscription(updatedSubscription.customer, {
            subscriptionId: updatedSubscription.id,
            status: updatedSubscription.status as any,
            planId: (updatedSubscription as any).items?.data?.[0]?.price?.id,
            periodStart: (updatedSubscription as any).current_period_start,
            periodEnd: (updatedSubscription as any).current_period_end,
          });
        }
        break;

      case "customer.subscription.deleted":
        const cancelledSubscription = event.data.object as Stripe.Subscription;
        await logWebhookEvent(
          "customer.subscription.deleted",
          cancelledSubscription.id,
          {
            customerId: cancelledSubscription.customer,
            status: cancelledSubscription.status,
            cancelledAt: cancelledSubscription.canceled_at,
          },
        );

        // Downgrade user and send cancellation confirmation
        if (typeof cancelledSubscription.customer === "string") {
          await updateUserSubscription(cancelledSubscription.customer, {
            subscriptionId: cancelledSubscription.id,
            status: "canceled",
            cancelledAt: cancelledSubscription.canceled_at,
          });

          // Send cancellation confirmation email
          const userResult = await userService.getUser(
            cancelledSubscription.customer,
          );
          if (isOk(userResult) && userResult.value.email) {
            await sendConfirmationEmail(
              userResult.value.email,
              "subscription-cancelled",
              {
                id: cancelledSubscription.id,
                canceled_at: cancelledSubscription.canceled_at,
              },
            );
          }
        }
        break;

      default:
        await logWebhookEvent("unhandled", event.id, {
          eventType: event.type,
          data: event.data.object,
        });
        console.log(`Unhandled event type: ${event.type}`);
    }

    return createSuccessResponse({ received: true, event: event.type });
  } catch (error) {
    console.error("Stripe webhook processing error:", error);
    return createErrorResponse(
      "WEBHOOK_PROCESSING_FAILED",
      "Webhook processing failed",
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
