// Value Object - Payment Method validation
export class PaymentMethod {
  private constructor(private readonly value: string) {}

  static create(method: string): PaymentMethod {
    const validMethods = ["credit_card", "debit_card", "pix", "boleto"];

    if (!validMethods.includes(method)) {
      throw new Error(
        `Invalid payment method. Valid options: ${validMethods.join(", ")}`,
      );
    }

    return new PaymentMethod(method);
  }

  getValue(): string {
    return this.value;
  }

  isCard(): boolean {
    return this.value === "credit_card" || this.value === "debit_card";
  }

  isInstant(): boolean {
    return this.value === "pix";
  }

  isDeferred(): boolean {
    return this.value === "boleto";
  }

  getDisplayName(): string {
    const names = {
      credit_card: "Cartão de Crédito",
      debit_card: "Cartão de Débito",
      pix: "PIX",
      boleto: "Boleto Bancário",
    };

    return names[this.value as keyof typeof names] || this.value;
  }
}
