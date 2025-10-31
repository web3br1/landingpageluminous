import { Result } from "../../shared/core/Result";

// ===== PAGBANK API RESPONSE TYPES =====

export interface PagBankAmount {
  value: number;
  currency: string;
}

export interface PagBankLink {
  rel: string;
  href: string;
  method: string;
}

export interface PagBankQrCode {
  amount: PagBankAmount;
  text: string;
}

export interface PagBankPaymentMethod {
  type: "CREDIT_CARD" | "PIX" | "BOLETO";
  installments?: number;
  capture?: boolean;
  card?: {
    brand: string;
    first_digits: string;
    last_digits: string;
    exp_month: string;
    exp_year: string;
  };
}

export interface PagBankCharge {
  id: string;
  reference_id: string;
  status: "AUTHORIZED" | "PAID" | "DECLINED" | "CANCELLED" | "WAITING";
  created_at: string;
  paid_at?: string;
  description: string;
  amount: PagBankAmount;
  payment_response: {
    code: string;
    message: string;
  };
  payment_method: PagBankPaymentMethod;
  qr_codes?: PagBankQrCode[];
  links?: PagBankLink[];
}

export interface PagBankOrderApiResponse {
  id: string;
  reference_id: string;
  created_at: string;
  customer: {
    name: string;
    email: string;
    tax_id: string;
  };
  items: Array<{
    reference_id: string;
    name: string;
    quantity: number;
    unit_amount: number;
  }>;
  charges: PagBankCharge[];
  links?: PagBankLink[];
}

export interface PagBankOrder {
  id: string;
  referenceId: string;
  amount: number;
  currency: string;
  status: "AUTHORIZED" | "PAID" | "DECLINED" | "CANCELLED" | "WAITING";
  paymentMethod: "CREDIT_CARD" | "PIX" | "BOLETO";
  qrCode?: string;
  boletoUrl?: string;
  installments?: number;
}

export interface PagBankSubscription {
  id: string;
  customerId: string;
  planId: string;
  status: "ACTIVE" | "SUSPENDED" | "CANCELLED";
  nextBillingDate: string;
  cancelAtPeriodEnd: boolean;
}

export class PagBankService {
  private baseUrl = "https://api.pagseguro.com";
  private token: string;

  constructor() {
    this.token = process.env.PAGBANK_TOKEN!;
  }

  // Criar pedido único
  async createOrder(
    amount: number,
    customer: {
      name: string;
      email: string;
      cpf: string;
      phone?: string;
    },
    paymentMethod: "CREDIT_CARD" | "PIX" | "BOLETO",
    paymentData?: unknown,
    referenceId?: string,
  ): Promise<Result<PagBankOrder, PaymentError>> {
    try {
      const orderData = {
        reference_id: referenceId || `LUM-${Date.now()}`,
        customer: {
          name: customer.name,
          email: customer.email,
          tax_id: customer.cpf,
          phones: customer.phone
            ? [
                {
                  country: "55",
                  area: customer.phone.substring(1, 3),
                  number: customer.phone.substring(4).replace("-", ""),
                  type: "MOBILE",
                },
              ]
            : undefined,
        },
        items: [
          {
            reference_id: "LUMINARIS_SUBSCRIPTION",
            name: "Assinatura Luminaris",
            quantity: 1,
            unit_amount: Math.round(amount * 100),
          },
        ],
        charges: [
          {
            reference_id: `charge-${Date.now()}`,
            description: "Assinatura Luminaris",
            amount: {
              value: Math.round(amount * 100),
              currency: "BRL",
            },
            payment_method: this.buildPaymentMethod(paymentMethod, paymentData),
          },
        ],
      };

      const response = await fetch(`${this.baseUrl}/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error(`PagBank API error: ${response.status}`);
      }

      const data: PagBankOrderApiResponse = await response.json();

      return Result.ok({
        id: data.id,
        referenceId: data.reference_id,
        amount: data.charges[0].amount.value / 100,
        currency: data.charges[0].amount.currency,
        status: data.charges[0].status,
        paymentMethod: data.charges[0].payment_method.type,
        qrCode: data.charges[0].qr_codes?.[0]?.text,
        boletoUrl: data.charges[0].links?.find(
          (link: unknown) => link.rel === "PRINT_BOLETO",
        )?.href,
        installments: paymentData?.installments,
      });
    } catch (error) {
      return Result.err({
        type: "PAGBANK_ERROR",
        message:
          error instanceof Error ? error.message : "Erro ao criar pedido",
        code: "ORDER_CREATION_FAILED",
      });
    }
  }

  // Criar assinatura recorrente
  async createSubscription(
    customer: {
      name: string;
      email: string;
      cpf: string;
      phone?: string;
    },
    planId: string,
    paymentData: unknown,
    couponCode?: string,
  ): Promise<Result<PagBankSubscription, PaymentError>> {
    try {
      const subscriptionData = {
        reference_id: `SUB-${Date.now()}`,
        customer: {
          name: customer.name,
          email: customer.email,
          tax_id: customer.cpf,
          phones: customer.phone
            ? [
                {
                  country: "55",
                  area: customer.phone.substring(1, 3),
                  number: customer.phone.substring(4).replace("-", ""),
                  type: "MOBILE",
                },
              ]
            : undefined,
        },
        plan_id: planId,
        payment_method: this.buildPaymentMethod("CREDIT_CARD", paymentData),
        ...(couponCode && { coupon_code: couponCode }),
      };

      const response = await fetch(`${this.baseUrl}/subscriptions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscriptionData),
      });

      if (!response.ok) {
        throw new Error(`PagBank API error: ${response.status}`);
      }

      const data: PagBankOrderApiResponse = await response.json();

      return Result.ok({
        id: data.id,
        customerId: data.customer.id,
        planId: data.plan.id,
        status: data.status,
        nextBillingDate: data.next_billing_date,
        cancelAtPeriodEnd: false,
      });
    } catch (error) {
      return Result.err({
        type: "PAGBANK_ERROR",
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
      const response = await fetch(
        `${this.baseUrl}/subscriptions/${subscriptionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`PagBank API error: ${response.status}`);
      }

      return Result.ok(true);
    } catch (error) {
      return Result.err({
        type: "PAGBANK_ERROR",
        message: "Erro ao cancelar assinatura",
        code: "SUBSCRIPTION_CANCEL_FAILED",
      });
    }
  }

  // Buscar pedido por ID
  async getOrder(orderId: string): Promise<Result<PagBankOrder, PaymentError>> {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`PagBank API error: ${response.status}`);
      }

      const data: PagBankOrderApiResponse = await response.json();

      return Result.ok({
        id: data.id,
        referenceId: data.reference_id,
        amount: data.charges[0].amount.value / 100,
        currency: data.charges[0].amount.currency,
        status: data.charges[0].status,
        paymentMethod: data.charges[0].payment_method.type,
        qrCode: data.charges[0].qr_codes?.[0]?.text,
        boletoUrl: data.charges[0].links?.find(
          (link: unknown) => link.rel === "PRINT_BOLETO",
        )?.href,
      });
    } catch (error) {
      return Result.err({
        type: "PAGBANK_ERROR",
        message: "Pedido não encontrado",
        code: "ORDER_NOT_FOUND",
      });
    }
  }

  // Validar cupom
  async validateCoupon(
    couponCode: string,
  ): Promise<Result<unknown, PaymentError>> {
    try {
      const response = await fetch(`${this.baseUrl}/coupons/${couponCode}`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Cupom inválido: ${response.status}`);
      }

      const coupon = await response.json();
      return Result.ok(coupon);
    } catch (error) {
      return Result.err({
        type: "PAGBANK_ERROR",
        message: "Cupom inválido ou expirado",
        code: "INVALID_COUPON",
      });
    }
  }

  private buildPaymentMethod(type: string, paymentData?: unknown) {
    switch (type) {
      case "CREDIT_CARD":
        return {
          type: "CREDIT_CARD",
          installments: paymentData?.installments || 1,
          card: {
            number: paymentData.cardNumber?.replace(/\s/g, ""),
            exp_month: paymentData.expiryDate?.split("/")[0],
            exp_year: `20${paymentData.expiryDate?.split("/")[1]}`,
            security_code: paymentData.cvv,
            holder: {
              name: paymentData.cardName,
            },
          },
        };

      case "PIX":
        return {
          type: "PIX",
        };

      case "BOLETO":
        return {
          type: "BOLETO",
          instructions: "Aceitaremos até a data de vencimento.",
          due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0], // 3 dias
        };

      default:
        throw new Error("Método de pagamento não suportado");
    }
  }
}

export interface PaymentError {
  type: "PAGBANK_ERROR" | "VALIDATION_ERROR";
  message: string;
  code: string;
}
