// Use Case - Process Checkout business logic
import { Checkout } from "../../domain/entities/Checkout";
import { PaymentMethod } from "../../domain/value-objects/PaymentMethod";
import { CheckoutRepository } from "../../domain/ports/CheckoutRepository";
import { Result, isOk, isErr } from "@/shared/core/Result";

export interface ProcessCheckoutInput {
  leadId: string;
  planId: string;
  paymentMethod: string;
  amount: number;
  currency: string;
}

export interface ProcessCheckoutOutput {
  checkout: Checkout;
  paymentUrl?: string;
  estimatedCompletion: Date;
}

export class ProcessCheckoutUseCase {
  constructor(private checkoutRepository: CheckoutRepository) {}

  async execute(
    input: ProcessCheckoutInput,
  ): Promise<Result<ProcessCheckoutOutput, ProcessCheckoutError>> {
    try {
      // Validate input and check for duplicates
      const validationResult = await this.validateAndCheckDuplicates(input);
      if (isErr(validationResult)) {
        return validationResult;
      }

      // Create and persist checkout
      const checkoutResult = await this.createAndPersistCheckout(input);
      if (isErr(checkoutResult)) {
        return checkoutResult;
      }
      const savedCheckout = checkoutResult.value;

      // Process payment and finalize
      return await this.processPaymentAndFinalize(savedCheckout);
    } catch (error) {
      return this.handleExecutionError(error);
    }
  }

  private async validateAndCheckDuplicates(
    input: ProcessCheckoutInput,
  ): Promise<Result<void, ProcessCheckoutError>> {
    // 1. Validate payment method
    const paymentMethodResult = this.validatePaymentMethod(input.paymentMethod);
    if (isErr(paymentMethodResult)) {
      return paymentMethodResult;
    }

    // 2. Check for existing checkout
    const existingCheckout = await this.checkoutRepository.findByLeadId(
      input.leadId,
    );
    if (isOk(existingCheckout) && existingCheckout.value.length > 0) {
      const activeCheckout = existingCheckout.value.find((c) =>
        c.canBeProcessed(),
      );
      if (activeCheckout) {
        return Result.err({
          type: "DUPLICATE_CHECKOUT",
          message: "Lead already has an active checkout",
        });
      }
    }

    return Result.ok(undefined);
  }

  private async createAndPersistCheckout(
    input: ProcessCheckoutInput,
  ): Promise<Result<Checkout, ProcessCheckoutError>> {
    // 3. Create checkout entity
    const checkoutResult = this.createCheckout(input);
    if (isErr(checkoutResult)) {
      return checkoutResult;
    }
    const checkout = checkoutResult.value;

    // 4. Persist checkout
    const saveResult = await this.checkoutRepository.save(checkout);
    if (isErr(saveResult)) {
      return Result.err({
        type: "PERSISTENCE_ERROR",
        message: saveResult.error.message,
      });
    }

    return Result.ok(saveResult.value);
  }

  private async processPaymentAndFinalize(
    savedCheckout: Checkout,
  ): Promise<Result<ProcessCheckoutOutput, ProcessCheckoutError>> {
    // 5. Process payment
    const paymentResult = await this.processPayment(savedCheckout);
    if (isErr(paymentResult)) {
      // Update checkout status to failed
      await this.checkoutRepository.updateStatus(
        savedCheckout.getId(),
        "failed",
      );
      return paymentResult;
    }

    // 6. Update checkout status to processing
    const updateResult = await this.checkoutRepository.updateStatus(
      savedCheckout.getId(),
      "processing",
    );
    if (isErr(updateResult)) {
      return Result.err({
        type: "PERSISTENCE_ERROR",
        message: "Failed to update checkout status",
      });
    }

    // 7. Calculate estimated completion
    const estimatedCompletion = new Date();
    estimatedCompletion.setMinutes(
      estimatedCompletion.getMinutes() +
        (savedCheckout.getPaymentMethod() === "pix" ? 1 : 30),
    );

    return Result.ok({
      checkout: updateResult.value,
      paymentUrl: paymentResult.value.paymentUrl,
      estimatedCompletion,
    });
  }

  private handleExecutionError(
    error: unknown,
  ): Result<never, ProcessCheckoutError> {
    if (error instanceof Error) {
      return Result.err({
        type: "VALIDATION_ERROR",
        message: error.message,
      });
    }

    return Result.err({
      type: "UNKNOWN_ERROR",
      message: "Unexpected error occurred",
    });
  }

  private validatePaymentMethod(
    method: string,
  ): Result<PaymentMethod, ProcessCheckoutError> {
    try {
      const paymentMethod = PaymentMethod.create(method);
      return Result.ok(paymentMethod);
    } catch (error) {
      return Result.err({
        type: "VALIDATION_ERROR",
        message:
          error instanceof Error ? error.message : "Invalid payment method",
      });
    }
  }

  private createCheckout(
    input: ProcessCheckoutInput,
  ): Result<Checkout, ProcessCheckoutError> {
    try {
      const checkout = Checkout.create({
        leadId: input.leadId,
        planId: input.planId,
        paymentMethod: input.paymentMethod,
        amount: input.amount,
        currency: input.currency,
      });
      return Result.ok(checkout);
    } catch (error) {
      return Result.err({
        type: "VALIDATION_ERROR",
        message:
          error instanceof Error ? error.message : "Invalid checkout data",
      });
    }
  }

  private async processPayment(
    checkout: Checkout,
  ): Promise<Result<{ paymentUrl: string }, ProcessCheckoutError>> {
    // TODO: Implement payment service integration
    // const result = await this.paymentService.processPayment(checkout);
    return Result.ok({
      paymentUrl: `https://checkout.example.com/mock-checkout-id`,
    });
  }
}

// Payment Service abstraction
export interface PaymentService {
  processPayment(
    checkout: Checkout,
  ): Promise<Result<{ paymentUrl: string }, PaymentError>>;
}

export interface PaymentError {
  message: string;
  code?: string;
}

export interface ProcessCheckoutError {
  type:
    | "VALIDATION_ERROR"
    | "DUPLICATE_CHECKOUT"
    | "PERSISTENCE_ERROR"
    | "PAYMENT_ERROR"
    | "UNKNOWN_ERROR";
  message: string;
}
