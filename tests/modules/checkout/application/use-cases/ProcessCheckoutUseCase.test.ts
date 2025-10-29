// Unit Tests for ProcessCheckoutUseCase - Business logic orchestration
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  ProcessCheckoutUseCase,
  ProcessCheckoutInput,
  PaymentService,
} from "../../../../../modules/checkout/application/use-cases/ProcessCheckoutUseCase";
import { CheckoutRepository } from "../../../../../modules/checkout/domain/ports/CheckoutRepository";
import { Checkout } from "../../../../../modules/checkout/domain/entities/Checkout";
import { Result, isOk, isErr } from "@/shared/core/Result";

// Mock repository
const mockCheckoutRepository = {
  save: vi.fn(),
  findById: vi.fn(),
  findByLeadId: vi.fn(),
  updateStatus: vi.fn(),
  findAll: vi.fn(),
} satisfies CheckoutRepository;

// Mock payment service
const mockPaymentService = {
  processPayment: vi.fn(),
} satisfies PaymentService;

describe("ProcessCheckoutUseCase", () => {
  let useCase: ProcessCheckoutUseCase;
  let validInput: ProcessCheckoutInput;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new ProcessCheckoutUseCase(
      mockCheckoutRepository,
      mockPaymentService,
    );

    validInput = {
      leadId: "lead-123",
      planId: "plan-pro",
      paymentMethod: "credit_card",
      amount: 99.9,
      currency: "BRL",
    };
  });

  describe("Successful Checkout Processing", () => {
    it("should create and process a checkout successfully", async () => {
      // Arrange
      const expectedCheckout = Checkout.create(validInput);
      mockCheckoutRepository.findByLeadId.mockResolvedValue(Result.ok([]));
      mockCheckoutRepository.save.mockImplementation(async (checkout) => Result.ok(checkout));
      mockPaymentService.processPayment.mockImplementation(async (checkout) =>
        Result.ok({ paymentUrl: `https://payment.example.com/checkout/${checkout.getId()}` })
      );
      mockCheckoutRepository.updateStatus.mockImplementation(async (id, status) => Result.ok(expectedCheckout));

      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(isOk(result)).toBe(true);
      const output = (result as any).value;

      expect(output.checkout).toBeDefined();
      expect(output.checkout.getLeadId()).toBe("lead-123");
      expect(output.checkout.getPlanId()).toBe("plan-pro");
      expect(output.checkout.getPaymentMethod()).toBe("credit_card");
      expect(output.checkout.getAmount()).toBe(99.9);
      expect(output.paymentUrl).toContain("https://payment.example.com/checkout/");
      expect(output.estimatedCompletion).toBeInstanceOf(Date);

      expect(mockCheckoutRepository.findByLeadId).toHaveBeenCalledWith(
        "lead-123",
      );
      expect(mockCheckoutRepository.save).toHaveBeenCalledTimes(1);
      expect(mockPaymentService.processPayment).toHaveBeenCalledTimes(1);
      expect(mockCheckoutRepository.updateStatus).toHaveBeenCalledWith(
        expect.any(String),
        "processing",
      );
    });

    it("should calculate different completion times for different payment methods", async () => {
      // Arrange
      const pixInput = { ...validInput, paymentMethod: "pix" };
      const boletoInput = { ...validInput, paymentMethod: "boleto" };

      const pixCheckout = Checkout.create(pixInput);
      const boletoCheckout = Checkout.create(boletoInput);

      mockCheckoutRepository.findByLeadId.mockResolvedValue(Result.ok([]));
      mockCheckoutRepository.save
        .mockResolvedValueOnce(Result.ok(pixCheckout))
        .mockResolvedValueOnce(Result.ok(boletoCheckout));
      mockPaymentService.processPayment.mockImplementation(async (checkout) =>
        Result.ok({ paymentUrl: `https://payment.example.com/checkout/${checkout.getId()}` })
      );
      mockCheckoutRepository.updateStatus
        .mockResolvedValueOnce(Result.ok(pixCheckout))
        .mockResolvedValueOnce(Result.ok(boletoCheckout));

      // Act
      const pixResult = await useCase.execute(pixInput);
      const boletoResult = await useCase.execute(boletoInput);

      // Assert
      expect(isOk(pixResult)).toBe(true);
      expect(isOk(boletoResult)).toBe(true);

      const pixCompletion = (pixResult as any).value.estimatedCompletion;
      const boletoCompletion = (boletoResult as any).value.estimatedCompletion;

      // PIX should be faster (1 minute) than boleto (30 minutes)
      const pixTime = pixCompletion.getTime() - new Date().getTime();
      const boletoTime = boletoCompletion.getTime() - new Date().getTime();

      expect(pixTime).toBeLessThan(boletoTime);
    });
  });

  describe("Business Rule Validation", () => {
    it("should reject invalid payment method", async () => {
      // Arrange
      const invalidInput = { ...validInput, paymentMethod: "invalid_method" };

      // Act
      const result = await useCase.execute(invalidInput);

      // Assert
      expect(isErr(result)).toBe(true);
      expect((result as any).error.type).toBe("VALIDATION_ERROR");
      expect((result as any).error.message).toContain("Invalid payment method");

      expect(mockCheckoutRepository.save).not.toHaveBeenCalled();
    });

    it("should reject duplicate active checkout", async () => {
      // Arrange
      const existingCheckout = Checkout.create(validInput);
      mockCheckoutRepository.findByLeadId.mockResolvedValue(
        Result.ok([existingCheckout]),
      );

      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(isErr(result)).toBe(true);
      expect((result as any).error.type).toBe("DUPLICATE_CHECKOUT");
      expect((result as any).error.message).toBe(
        "Lead already has an active checkout",
      );

      expect(mockCheckoutRepository.save).not.toHaveBeenCalled();
    });

    it("should reject checkout with invalid amount", async () => {
      // Arrange
      const invalidInput = { ...validInput, amount: 0 };
      mockCheckoutRepository.findByLeadId.mockResolvedValue(Result.ok([])); // No existing checkouts

      // Act
      const result = await useCase.execute(invalidInput);

      // Assert
      expect(isErr(result)).toBe(true);
      expect((result as any).error.type).toBe("VALIDATION_ERROR");
      expect((result as any).error.message).toBe(
        "Amount must be greater than zero",
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle repository save errors", async () => {
      // Arrange
      mockCheckoutRepository.findByLeadId.mockResolvedValue(Result.ok([]));
      mockCheckoutRepository.save.mockResolvedValue(
        Result.err({ message: "Database connection failed" }),
      );

      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(isErr(result)).toBe(true);
      expect((result as any).error.type).toBe("PERSISTENCE_ERROR");
      expect((result as any).error.message).toBe("Database connection failed");
    });

    it("should handle payment processing errors", async () => {
      // Arrange
      const checkout = Checkout.create(validInput);
      mockCheckoutRepository.findByLeadId.mockResolvedValue(Result.ok([]));
      mockCheckoutRepository.save.mockImplementation(async (c) => Result.ok(c));
      mockPaymentService.processPayment.mockImplementation(async (c) =>
        Result.err({ type: "PAYMENT_ERROR", message: "Payment processing failed" })
      );
      mockCheckoutRepository.updateStatus.mockImplementation(async (id, status) => Result.ok(checkout));

      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(isErr(result)).toBe(true);
      expect((result as any).error.type).toBe("PAYMENT_ERROR");
      expect((result as any).error.message).toBe("Payment processing failed");

      // Should update status to failed
      expect(mockCheckoutRepository.updateStatus).toHaveBeenCalledWith(
        expect.any(String),
        "failed",
      );
    });

    it("should handle unexpected errors", async () => {
      // Arrange
      mockCheckoutRepository.findByLeadId.mockRejectedValue(
        new Error("Unexpected database error"),
      );

      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(isErr(result)).toBe(true);
      expect((result as any).error.type).toBe("VALIDATION_ERROR");
      expect((result as any).error.message).toBe("Unexpected database error");
    });
  });

  describe("Repository Interaction", () => {
    it("should call repository methods in correct order", async () => {
      // Arrange
      const checkout = Checkout.create(validInput);
      mockCheckoutRepository.findByLeadId.mockResolvedValue(Result.ok([]));
      mockCheckoutRepository.save.mockImplementation(async (c) => Result.ok(c));
      mockPaymentService.processPayment.mockImplementation(async (checkout) =>
        Result.ok({ paymentUrl: `https://payment.example.com/checkout/${checkout.getId()}` })
      );
      mockCheckoutRepository.updateStatus.mockImplementation(async (id, status) => Result.ok(Checkout.create(validInput)));

      // Act
      await useCase.execute(validInput);

      // Assert
      expect(mockCheckoutRepository.findByLeadId).toHaveBeenCalledWith(
        "lead-123",
      );
      expect(mockCheckoutRepository.save).toHaveBeenCalledTimes(1);
      expect(mockPaymentService.processPayment).toHaveBeenCalledTimes(1);
      expect(mockCheckoutRepository.updateStatus).toHaveBeenCalledWith(
        expect.any(String),
        "processing",
      );

      expect(mockCheckoutRepository.findByLeadId).toHaveBeenCalledBefore(
        mockCheckoutRepository.save,
      );
      expect(mockCheckoutRepository.save).toHaveBeenCalledBefore(
        mockPaymentService.processPayment,
      );
      expect(mockPaymentService.processPayment).toHaveBeenCalledBefore(
        mockCheckoutRepository.updateStatus,
      );
    });

    it("should not save checkout if duplicate found", async () => {
      // Arrange
      const existingCheckout = Checkout.create(validInput);
      mockCheckoutRepository.findByLeadId.mockResolvedValue(
        Result.ok([existingCheckout]),
      );

      // Act
      await useCase.execute(validInput);

      // Assert
      expect(mockCheckoutRepository.save).not.toHaveBeenCalled();
      expect(mockPaymentService.processPayment).not.toHaveBeenCalled();
    });
  });
});
