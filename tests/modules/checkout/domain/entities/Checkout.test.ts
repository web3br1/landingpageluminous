// Unit Tests for Checkout Entity - Domain business rules
import { describe, it, expect, beforeEach } from "vitest";
import { Checkout } from "../../../../../modules/checkout/domain/entities/Checkout";

describe("Checkout Entity", () => {
  let checkoutData: {
    leadId: string;
    planId: string;
    paymentMethod: string;
    amount: number;
    currency: string;
  };

  beforeEach(() => {
    checkoutData = {
      leadId: "lead-123",
      planId: "plan-pro",
      paymentMethod: "credit_card",
      amount: 99.9,
      currency: "BRL",
    };
  });

  describe("Checkout Creation", () => {
    it("should create a valid checkout with all fields", () => {
      const checkout = Checkout.create(checkoutData);

      expect(checkout.getId()).toBeDefined();
      expect(checkout.getLeadId()).toBe("lead-123");
      expect(checkout.getPlanId()).toBe("plan-pro");
      expect(checkout.getPaymentMethod()).toBe("credit_card");
      expect(checkout.getAmount()).toBe(99.9);
      expect(checkout.getCurrency()).toBe("BRL");
      expect(checkout.getStatus()).toBe("pending");
    });

    it("should generate unique IDs for different checkouts", () => {
      const checkout1 = Checkout.create(checkoutData);
      const checkout2 = Checkout.create({
        ...checkoutData,
        planId: "plan-enterprise",
      });

      expect(checkout1.getId()).not.toBe(checkout2.getId());
    });
  });

  describe("Checkout Business Rules", () => {
    it("should reject checkout with zero amount", () => {
      expect(() =>
        Checkout.create({
          ...checkoutData,
          amount: 0,
        }),
      ).toThrow("Amount must be greater than zero");
    });

    it("should reject checkout with negative amount", () => {
      expect(() =>
        Checkout.create({
          ...checkoutData,
          amount: -10,
        }),
      ).toThrow("Amount must be greater than zero");
    });

    it("should reject checkout without lead ID", () => {
      expect(() =>
        Checkout.create({
          ...checkoutData,
          leadId: "",
        }),
      ).toThrow("Lead ID is required");
    });

    it("should reject checkout without plan ID", () => {
      expect(() =>
        Checkout.create({
          ...checkoutData,
          planId: "",
        }),
      ).toThrow("Plan ID is required");
    });

    it("should reject invalid payment method", () => {
      expect(() =>
        Checkout.create({
          ...checkoutData,
          paymentMethod: "invalid_method",
        }),
      ).toThrow("Invalid payment method");
    });

    it("should reject unsupported currency", () => {
      expect(() =>
        Checkout.create({
          ...checkoutData,
          currency: "BTC",
        }),
      ).toThrow("Unsupported currency");
    });
  });

  describe("Checkout Status Methods", () => {
    it("should identify pending status correctly", () => {
      const checkout = Checkout.create(checkoutData);
      expect(checkout.isPending()).toBe(true);
      expect(checkout.isCompleted()).toBe(false);
      expect(checkout.isFailed()).toBe(false);
    });

    it("should allow processing when pending", () => {
      const checkout = Checkout.create(checkoutData);
      expect(checkout.canBeProcessed()).toBe(true);
    });
  });

  describe("Checkout Formatting", () => {
    it("should format amount correctly for BRL", () => {
      const checkout = Checkout.create(checkoutData);
      const formatted = checkout.getFormattedAmount();
      expect(formatted).toContain("99");
      expect(formatted).toContain("R$");
    });

    it("should format amount correctly for USD", () => {
      const checkout = Checkout.create({
        ...checkoutData,
        currency: "USD",
        amount: 29.99,
      });
      const formatted = checkout.getFormattedAmount();
      expect(formatted).toContain("29");
      expect(formatted).toContain("$");
    });
  });

  describe("Checkout Immutability", () => {
    it("should not allow direct property modification", () => {
      const checkout = Checkout.create(checkoutData);

      // Test that direct property access throws (Object.freeze makes it read-only)
      expect(() => {
        // Try to modify frozen property - should throw
        (checkout as any).leadId = "modified-id";
      }).toThrow("Cannot assign to read only property");

      // Value should remain unchanged
      expect(checkout.getLeadId()).toBe("lead-123");
    });
  });
});
