import { Result } from "@/lib/core/result";

// Lazy load Stripe to reduce initial bundle size
let stripeInstance: any = null;

async function getStripeInstance() {
  if (!stripeInstance) {
    const { default: Stripe } = await import("stripe");
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return stripeInstance;
}

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface SubscriptionData {
  customerId: string;
  subscriptionId: string;
  planId: string;
  status: "active" | "canceled" | "incomplete";
  currentPeriodEnd: number;
  cancelAtPeriodEnd: boolean;
}

export class StripePaymentService {
  // Criar Payment Intent para cartão/Pix
  async createPaymentIntent(
    amount: number,
    currency: "brl" | "usd" = "brl",
    metadata: Record<string, string> = {},
  ): Promise<Result<PaymentIntent, PaymentError>> {
    try {
      const stripe = await getStripeInstance();
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe usa centavos
        currency,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
        // Para Pix no Brasil
        ...(currency === "brl" && {
          payment_method_types: ["card", "pix"],
        }),
      });

      return Result.ok({
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      });
    } catch (error) {
      return Result.err({
        type: "STRIPE_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Erro ao criar intent de pagamento",
        code: "PAYMENT_INTENT_CREATION_FAILED",
      });
    }
  }

  // Confirmar pagamento (webhook)
  async confirmPaymentIntent(
    paymentIntentId: string,
  ): Promise<Result<PaymentIntent, PaymentError>> {
    try {
      const stripe = await getStripeInstance();
      const paymentIntent =
        await stripe.paymentIntents.retrieve(paymentIntentId);

      return Result.ok({
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      });
    } catch (error) {
      return Result.err({
        type: "STRIPE_ERROR",
        message: "Erro ao confirmar pagamento",
        code: "PAYMENT_CONFIRMATION_FAILED",
      });
    }
  }

  // Criar assinatura recorrente
  async createSubscription(
    customerEmail: string,
    planId: string,
    paymentMethodId: string,
    couponId?: string,
  ): Promise<Result<SubscriptionData, PaymentError>> {
    try {
      const stripe = await getStripeInstance();
      // Criar ou buscar customer
      let customer = await stripe.customers
        .list({
          email: customerEmail,
          limit: 1,
        })
        .then((res) => res.data[0]);

      if (!customer) {
        customer = await stripe.customers.create({
          email: customerEmail,
        });
      }

      // Anexar método de pagamento
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customer.id,
      });

      // Atualizar customer com payment method padrão
      await stripe.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Criar assinatura
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: planId }],
        ...(couponId && { coupon: couponId }),
        expand: ["latest_invoice.payment_intent"],
      });

      return Result.ok({
        customerId: customer.id,
        subscriptionId: subscription.id,
        planId,
        status: subscription.status as "active" | "canceled" | "incomplete",
        currentPeriodEnd: (subscription as unknown).current_period_end || 0,
        cancelAtPeriodEnd:
          (subscription as unknown).cancel_at_period_end || false,
      });
    } catch (error) {
      return Result.err({
        type: "STRIPE_ERROR",
        message:
          error instanceof Error ? error.message : "Erro ao criar assinatura",
        code: "SUBSCRIPTION_CREATION_FAILED",
      });
    }
  }

  // Cancelar assinatura
  async cancelSubscription(
    subscriptionId: string,
    immediate = false,
  ): Promise<Result<boolean, PaymentError>> {
    try {
      const stripe = await getStripeInstance();
      if (immediate) {
        await stripe.subscriptions.cancel(subscriptionId);
      } else {
        await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });
      }

      return Result.ok(true);
    } catch (error) {
      return Result.err({
        type: "STRIPE_ERROR",
        message: "Erro ao cancelar assinatura",
        code: "SUBSCRIPTION_CANCEL_FAILED",
      });
    }
  }

  // Buscar assinatura por ID
  async getSubscription(
    subscriptionId: string,
  ): Promise<Result<SubscriptionData, PaymentError>> {
    try {
      const stripe = await getStripeInstance();
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);

      return Result.ok({
        customerId: subscription.customer as string,
        subscriptionId: subscription.id,
        planId: subscription.items.data[0].price.id,
        status: subscription.status as "active" | "canceled" | "incomplete",
        currentPeriodEnd: (subscription as unknown).current_period_end || 0,
        cancelAtPeriodEnd:
          (subscription as unknown).cancel_at_period_end || false,
      });
    } catch (error) {
      return Result.err({
        type: "STRIPE_ERROR",
        message: "Assinatura não encontrada",
        code: "SUBSCRIPTION_NOT_FOUND",
      });
    }
  }

  // Aplicar cupom
  async validateCoupon(
    couponCode: string,
  ): Promise<Result<any, PaymentError>> { // Stripe.Coupon
    try {
      const stripe = await getStripeInstance();
      const coupon = await stripe.coupons.retrieve(couponCode);
      return Result.ok(coupon);
    } catch (error) {
      return Result.err({
        type: "STRIPE_ERROR",
        message: "Cupom inválido ou expirado",
        code: "INVALID_COUPON",
      });
    }
  }
}

export interface PaymentError {
  type: "STRIPE_ERROR" | "VALIDATION_ERROR";
  message: string;
  code: string;
}
