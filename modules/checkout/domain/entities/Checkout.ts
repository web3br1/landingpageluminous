// Domain Entity - Checkout business rules
export class Checkout {
  private constructor(
    private readonly id: string,
    private readonly leadId: string,
    private readonly planId: string,
    private readonly paymentMethod: string,
    private readonly amount: number,
    private readonly currency: string,
    private readonly status: CheckoutStatus,
    private readonly createdAt: Date,
    private readonly updatedAt: Date,
  ) {}

  static create(props: {
    leadId: string;
    planId: string;
    paymentMethod: string;
    amount: number;
    currency: string;
  }): Checkout {
    // Business validations
    if (props.amount <= 0) {
      throw new Error("Amount must be greater than zero");
    }

    if (!props.leadId.trim()) {
      throw new Error("Lead ID is required");
    }

    if (!props.planId.trim()) {
      throw new Error("Plan ID is required");
    }

    if (
      !["credit_card", "debit_card", "pix", "boleto"].includes(
        props.paymentMethod,
      )
    ) {
      throw new Error("Invalid payment method");
    }

    if (!["BRL", "USD", "EUR"].includes(props.currency)) {
      throw new Error("Unsupported currency");
    }

    const checkout = new Checkout(
      crypto.randomUUID(),
      props.leadId,
      props.planId,
      props.paymentMethod,
      props.amount,
      props.currency,
      "pending",
      new Date(),
      new Date(),
    );

    return checkout;
  }

  // Getters

  getId(): string {
    return this.id;
  }

  getLeadId(): string {
    return this.leadId;
  }

  getPlanId(): string {
    return this.planId;
  }

  getPaymentMethod(): string {
    return this.paymentMethod;
  }

  getAmount(): number {
    return this.amount;
  }

  getCurrency(): string {
    return this.currency;
  }

  getStatus(): CheckoutStatus {
    return this.status;
  }

  // Business methods
  isPending(): boolean {
    return this.status === "pending";
  }

  isCompleted(): boolean {
    return this.status === "completed";
  }

  isFailed(): boolean {
    return this.status === "failed";
  }

  canBeProcessed(): boolean {
    return this.status === "pending";
  }

  getFormattedAmount(): string {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: this.currency,
    }).format(this.amount);
  }
}

export type CheckoutStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";
