// Email Service - Basic email sending for Stripe webhooks
// Temporary implementation until full email system is ready

import { Result } from "@/lib/core/result";
import { edgeCache as cache } from "../cache/edge-cache";

export interface EmailMessage {
  to: string;
  subject: string;
  template: string;
  data: Record<string, unknown>;
  sentAt?: number;
  status: "pending" | "sent" | "failed";
}

export class EmailService {
  private static instance: EmailService;
  private readonly CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

  private constructor() {}

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendEmail(
    to: string,
    subject: string,
    template: string,
    data: Record<string, unknown> = {},
  ): Promise<Result<boolean, Error>> {
    try {
      const email: EmailMessage = {
        to,
        subject,
        template,
        data,
        status: "sent", // Simulating successful send
        sentAt: Date.now(),
      };

      // Store email in cache for tracking
      const emailId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await cache.set(`email:${emailId}`, email, { ttl: this.CACHE_TTL });

      // Log email details
      console.log(`[EmailService] 📧 Email sent to ${to}`);
      console.log(`   Subject: ${subject}`);
      console.log(`   Template: ${template}`);
      console.log(`   Data:`, JSON.stringify(data, null, 2));

      // Simulate email sending delay
      await new Promise((resolve) => setTimeout(resolve, 100));

      return Result.ok(true);
    } catch (error) {
      console.error("Error sending email:", error);
      return Result.err(new Error(`Failed to send email: ${error}`));
    }
  }

  async sendWelcomeEmail(
    email: string,
    customerId: string,
  ): Promise<Result<boolean, Error>> {
    return this.sendEmail(email, "Bem-vindo à nossa plataforma!", "welcome", {
      customerId,
      loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login`,
      supportEmail: "suporte@empresa.com",
    });
  }

  async sendPaymentConfirmationEmail(
    email: string,
    invoiceData: unknown,
  ): Promise<Result<boolean, Error>> {
    return this.sendEmail(
      email,
      "Confirmação de Pagamento",
      "payment-confirmation",
      {
        amount: (invoiceData as any).amount,
        currency: (invoiceData as any).currency,
        invoiceId: (invoiceData as any).id,
        downloadUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/invoice/${(invoiceData as any).id}`,
      },
    );
  }

  async sendReceiptEmail(
    email: string,
    invoiceData: unknown,
  ): Promise<Result<boolean, Error>> {
    return this.sendEmail(email, "Recibo de Pagamento", "receipt", {
      amount: (invoiceData as any).amount,
      currency: (invoiceData as any).currency,
      invoiceId: (invoiceData as any).id,
      downloadUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/receipt/${(invoiceData as any).id}`,
    });
  }

  async sendPaymentFailedEmail(
    email: string,
    invoiceData: unknown,
  ): Promise<Result<boolean, Error>> {
    return this.sendEmail(email, "Falha no Pagamento", "payment-failed", {
      amount: (invoiceData as any).amount,
      currency: (invoiceData as any).currency,
      invoiceId: (invoiceData as any).id,
      retryUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/billing`,
      supportEmail: "suporte@empresa.com",
    });
  }

  async sendSubscriptionCancelledEmail(
    email: string,
    subscriptionData: unknown,
  ): Promise<Result<boolean, Error>> {
    return this.sendEmail(
      email,
      "Confirmação de Cancelamento",
      "subscription-cancelled",
      {
        subscriptionId: (subscriptionData as any).id,
        cancelledAt: new Date(
          (subscriptionData as any).canceled_at * 1000,
        ).toLocaleDateString("pt-BR"),
        reactivateUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/billing`,
      },
    );
  }
}

export const emailService = EmailService.getInstance();
