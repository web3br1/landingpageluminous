// Unit Tests for PaymentMethod Value Object - Domain validation
import { describe, it, expect } from "vitest";
import { PaymentMethod } from "../../../../../modules/checkout/domain/value-objects/PaymentMethod";

describe("PaymentMethod Value Object", () => {
  describe("PaymentMethod Creation", () => {
    it("should create valid payment methods", () => {
      const validMethods = ["credit_card", "debit_card", "pix", "boleto"];

      validMethods.forEach((method) => {
        const paymentMethod = PaymentMethod.create(method);
        expect(paymentMethod).toBeInstanceOf(PaymentMethod);
        expect(paymentMethod.getValue()).toBe(method);
      });
    });

    it("should reject invalid payment methods", () => {
      const invalidMethods = ["", "cash", "bitcoin", "transfer"];

      invalidMethods.forEach((method) => {
        expect(() => PaymentMethod.create(method)).toThrow(
          "Invalid payment method",
        );
      });
    });
  });

  describe("PaymentMethod Business Rules", () => {
    it("should identify card payment methods", () => {
      const creditCard = PaymentMethod.create("credit_card");
      const debitCard = PaymentMethod.create("debit_card");
      const pix = PaymentMethod.create("pix");

      expect(creditCard.isCard()).toBe(true);
      expect(debitCard.isCard()).toBe(true);
      expect(pix.isCard()).toBe(false);
    });

    it("should identify instant payment methods", () => {
      const pix = PaymentMethod.create("pix");
      const creditCard = PaymentMethod.create("credit_card");

      expect(pix.isInstant()).toBe(true);
      expect(creditCard.isInstant()).toBe(false);
    });

    it("should identify deferred payment methods", () => {
      const boleto = PaymentMethod.create("boleto");
      const pix = PaymentMethod.create("pix");

      expect(boleto.isDeferred()).toBe(true);
      expect(pix.isDeferred()).toBe(false);
    });
  });

  describe("PaymentMethod Display Names", () => {
    it("should provide correct display names", () => {
      const testCases = [
        { method: "credit_card", expected: "Cartão de Crédito" },
        { method: "debit_card", expected: "Cartão de Débito" },
        { method: "pix", expected: "PIX" },
        { method: "boleto", expected: "Boleto Bancário" },
      ];

      testCases.forEach(({ method, expected }) => {
        const paymentMethod = PaymentMethod.create(method);
        expect(paymentMethod.getDisplayName()).toBe(expected);
      });
    });
  });
});
