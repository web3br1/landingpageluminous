import {
  StripePaymentService,
  PaymentIntent,
  SubscriptionData as StripeSubscription,
} from "./stripe";

export type PaymentProvider = "stripe" | "pagbank";

export interface UnifiedPaymentIntent {
  id: string;
  clientSecret?: string;
  amount: number;
  currency: string;
  status: string;
  qrCode?: string;
  boletoUrl?: string;
}

export interface UnifiedSubscription {
  id: string;
  customerId: string;
  planId: string;
  status: "active" | "canceled" | "incomplete" | "suspended";
  currentPeriodEnd?: number;
  nextBillingDate?: string;
  cancelAtPeriodEnd: boolean;
  provider: PaymentProvider;
}

export class UnifiedPaymentService {
  private stripeService: StripePaymentService;
  private pagBankService: PagBankService;

  constructor() {
    this.stripeService = new StripePaymentService();
    this.pagBankService = new PagBankService();
  }

  // Factory method para escolher provider baseado na moeda ou configuração
  private getProvider(currency: string = "BRL"): PaymentProvider {
    // Para BRL, usar PagBank; para outras moedas, Stripe
    return currency.toLowerCase() === "brl" ? "pagbank" : "stripe";
  }

  async createPaymentIntent(
    amount: number,
    currency: string = "BRL",
    customerData: {
      name: string;
      email: string;
      cpf: string;
      phone?: string;
    },
    paymentMethod: "card" | "pix" | "boleto",
    paymentData?: unknown,
    metadata?: Record<string, string>,
  ): Promise<Result<UnifiedPaymentIntent, PaymentError>> {
    const provider = this.getProvider(currency);

    if (provider === "stripe") {
      const result = await this.stripeService.createPaymentIntent(
        amount,
        currency.toLowerCase() as "brl" | "usd",
        metadata,
      );

      if (isErr(result)) return result;

      const paymentIntent = result.value;
      return Result.ok({
        id: paymentIntent.id,
        clientSecret: paymentIntent.clientSecret,
        amount: paymentIntent.amount / 100, // Stripe retorna em centavos
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      });
    } else {
      // PagBank
      const result = await this.pagBankService.createOrder(
        amount,
        customerData,
        paymentMethod === "card"
          ? "CREDIT_CARD"
          : paymentMethod === "pix"
            ? "PIX"
            : "BOLETO",
        paymentData,
      );

      if (isErr(result)) return result;

      return Result.ok({
        id: result.value.id,
        qrCode: result.value.qrCode,
        boletoUrl: result.value.boletoUrl,
        amount: result.value.amount,
        currency: result.value.currency,
        status: result.value.status,
      });
    }
  }

  async createSubscription(
    customerData: {
      name: string;
      email: string;
      cpf: string;
      phone?: string;
    },
    planId: string,
    paymentMethodId: string,
    paymentData: unknown,
    couponCode?: string,
    currency: string = "BRL",
  ): Promise<Result<UnifiedSubscription, PaymentError>> {
    const provider = this.getProvider(currency);

    if (provider === "stripe") {
      const result = await this.stripeService.createSubscription(
        customerData.email,
        planId,
        paymentMethodId,
        couponCode,
      );

      if (isErr(result)) return result;

      return Result.ok({
        id: result.value.subscriptionId,
        customerId: result.value.customerId,
        planId: result.value.planId,
        status: result.value.status,
        currentPeriodEnd: result.value.currentPeriodEnd,
        nextBillingDate: new Date(
          result.value.currentPeriodEnd * 1000,
        ).toISOString(),
        cancelAtPeriodEnd: result.value.cancelAtPeriodEnd,
        provider: "stripe",
      });
    } else {
      // PagBank
      const result = await this.pagBankService.createSubscription(
        customerData,
        planId,
        paymentData,
        couponCode,
      );

      if (isErr(result)) return result;

      return Result.ok({
        id: result.value.id,
        customerId: result.value.customerId,
        planId: result.value.planId,
        status: result.value.status.toLowerCase() as
          | "active"
          | "canceled"
          | "incomplete"
          | "suspended",
        nextBillingDate: result.value.nextBillingDate,
        cancelAtPeriodEnd: result.value.cancelAtPeriodEnd,
        provider: "pagbank",
      });
    }
  }

  async cancelSubscription(
    subscriptionId: string,
    provider: PaymentProvider,
    immediate = false,
  ): Promise<Result<boolean, PaymentError>> {
    if (provider === "stripe") {
      return this.stripeService.cancelSubscription(subscriptionId, immediate);
    } else {
      return this.pagBankService.cancelSubscription(subscriptionId, immediate);
    }
  }

  async getSubscription(
    subscriptionId: string,
    provider: PaymentProvider,
  ): Promise<Result<UnifiedSubscription, PaymentError>> {
    if (provider === "stripe") {
      const result = await this.stripeService.getSubscription(subscriptionId);

      if (isErr(result)) return result;

      return Result.ok({
        id: result.value.subscriptionId,
        customerId: result.value.customerId,
        planId: result.value.planId,
        status: result.value.status,
        currentPeriodEnd: result.value.currentPeriodEnd,
        nextBillingDate: new Date(
          result.value.currentPeriodEnd * 1000,
        ).toISOString(),
        cancelAtPeriodEnd: result.value.cancelAtPeriodEnd,
        provider: "stripe",
      });
    } else {
      const result = await this.pagBankService.getOrder(subscriptionId);

      if (isErr(result)) return result;

      // Para PagBank, subscriptions são tratadas como orders recorrentes
      // Esta é uma simplificação - em produção você precisaria mapear
      return Result.ok({
        id: result.value.id,
        customerId: "", // Não temos essa info na order
        planId: "", // Não temos essa info na order
        status: result.value.status.toLowerCase() as
          | "active"
          | "canceled"
          | "incomplete"
          | "suspended",
        cancelAtPeriodEnd: false, // Valor padrão
        provider: "pagbank",
      });
    }
  }

  async validateCoupon(
    couponCode: string,
    provider: PaymentProvider,
  ): Promise<Result<unknown, PaymentError>> {
    if (provider === "stripe") {
      return this.stripeService.validateCoupon(couponCode);
    } else {
      return this.pagBankService.validateCoupon(couponCode);
    }
  }

  // Método utilitário para converter status entre providers
  static normalizeStatus(
    status: string,
    provider: PaymentProvider,
  ): "active" | "canceled" | "incomplete" | "suspended" {
    if (provider === "stripe") {
      switch (status.toLowerCase()) {
        case "active":
          return "active";
        case "canceled":
          return "canceled";
        case "incomplete":
          return "incomplete";
        default:
          return "suspended";
      }
    } else {
      // PagBank
      switch (status.toUpperCase()) {
        case "ACTIVE":
          return "active";
        case "CANCELLED":
          return "canceled";
        case "SUSPENDED":
          return "suspended";
        default:
          return "incomplete";
      }
    }
  }
}

export interface PaymentError {
  type: "PAYMENT_ERROR" | "STRIPE_ERROR" | "PAGBANK_ERROR" | "VALIDATION_ERROR";
  message: string;
  code: string;
}

// Singleton instance
export const paymentService = new UnifiedPaymentService();
