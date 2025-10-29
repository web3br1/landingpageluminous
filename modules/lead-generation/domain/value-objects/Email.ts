// Value Object - Email validation
export class Email {
  private constructor(private readonly value: string) {}

  static create(email: string): Email {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }

    // Domain validation - only business emails
    if (
      email.includes("@gmail.com") ||
      email.includes("@yahoo.com") ||
      email.includes("@hotmail.com")
    ) {
      throw new Error("Please use a business email");
    }

    return new Email(email.toLowerCase());
  }

  getValue(): string {
    return this.value;
  }

  getDomain(): string {
    return this.value.split("@")[1];
  }

  isCorporate(): boolean {
    const corporateDomains = [".com.br", ".com", ".net", ".org", ".io"];
    return corporateDomains.some((domain) => this.value.includes(domain));
  }
}
