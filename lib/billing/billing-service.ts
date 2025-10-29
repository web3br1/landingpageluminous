// Billing Service - Basic billing status management for Stripe webhooks
// Temporary implementation until full billing system is ready

import { Result, isOk } from "../../shared/core/Result";
import { edgeCache as cache } from "../cache/edge-cache";

export interface BillingRecord {
  invoiceId: string;
  customerId: string;
  status: "paid" | "pending" | "failed" | "cancelled";
  amount: number;
  currency: string;
  createdAt: number;
  updatedAt: number;
  attempts: number;
  nextRetryAt?: number;
  lastError?: string;
}

export class BillingService {
  private static instance: BillingService;
  private readonly CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

  private constructor() {}

  static getInstance(): BillingService {
    if (!BillingService.instance) {
      BillingService.instance = new BillingService();
    }
    return BillingService.instance;
  }

  async getBillingRecord(
    invoiceId: string,
  ): Promise<Result<BillingRecord, Error>> {
    try {
      const cacheKey = `billing:${invoiceId}`;
      const cached = await cache.get<BillingRecord>(cacheKey);

      if (cached) {
        return Result.ok(cached);
      }

      return Result.err(new Error(`Billing record not found: ${invoiceId}`));
    } catch (error) {
      console.error("Error getting billing record:", error);
      return Result.err(new Error(`Failed to get billing record: ${error}`));
    }
  }

  async updateBillingStatus(
    invoiceId: string,
    customerId: string,
    status: BillingRecord["status"],
    additionalData: Partial<BillingRecord> = {},
  ): Promise<Result<boolean, Error>> {
    try {
      const existingRecordResult = await this.getBillingRecord(invoiceId);
      const now = Date.now();

      let record: BillingRecord;

      if (isOk(existingRecordResult)) {
        // Update existing record
        record = {
          ...existingRecordResult.value,
          status,
          updatedAt: now,
          ...additionalData,
        };
      } else {
        // Create new record
        record = {
          invoiceId,
          customerId,
          status,
          amount: additionalData.amount || 0,
          currency: additionalData.currency || "BRL",
          createdAt: now,
          updatedAt: now,
          attempts: additionalData.attempts || 0,
          ...additionalData,
        };
      }

      // Cache the billing record
      const cacheKey = `billing:${invoiceId}`;
      await cache.set(cacheKey, record, { ttl: this.CACHE_TTL });

      console.log(
        `[BillingService] Updated billing status for invoice ${invoiceId}: ${status}`,
      );
      console.log(
        `   Customer: ${customerId}, Amount: ${record.amount} ${record.currency}`,
      );

      return Result.ok(true);
    } catch (error) {
      console.error("Error updating billing status:", error);
      return Result.err(new Error(`Failed to update billing status: ${error}`));
    }
  }

  async recordPaymentFailure(
    invoiceId: string,
    customerId: string,
    amount: number,
    currency: string,
    attemptCount: number,
    errorMessage?: string,
  ): Promise<Result<boolean, Error>> {
    const nextRetryAt =
      attemptCount < 3
        ? Date.now() + 24 * 60 * 60 * 1000 // Retry in 24 hours
        : undefined;

    return this.updateBillingStatus(invoiceId, customerId, "failed", {
      amount,
      currency,
      attempts: attemptCount,
      nextRetryAt,
      lastError: errorMessage,
    });
  }

  async recordSuccessfulPayment(
    invoiceId: string,
    customerId: string,
    amount: number,
    currency: string,
  ): Promise<Result<boolean, Error>> {
    return this.updateBillingStatus(invoiceId, customerId, "paid", {
      amount,
      currency,
      attempts: 0,
      nextRetryAt: undefined,
      lastError: undefined,
    });
  }

  async getPendingPayments(): Promise<Result<BillingRecord[], Error>> {
    try {
      // This would need a more sophisticated cache implementation
      // For now, return empty array
      console.log("[BillingService] TODO: Implement getPendingPayments query");
      return Result.ok([]);
    } catch (error) {
      console.error("Error getting pending payments:", error);
      return Result.err(new Error(`Failed to get pending payments: ${error}`));
    }
  }
}

export const billingService = BillingService.getInstance();
