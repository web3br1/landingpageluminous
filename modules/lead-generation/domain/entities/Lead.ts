// Domain Entity - Regra de negócio pura
export class Lead {
  private constructor(
    private readonly id: string,
    private readonly name: string,
    private readonly email: string,
    private readonly phone: string,
    private readonly segment: string,
    private readonly revenue: string,
    private readonly painPoint: string,
    private readonly consent: boolean,
    private readonly createdAt: Date,
  ) {}

  static create(props: {
    name: string;
    email: string;
    phone: string;
    segment: string;
    revenue: string;
    painPoint: string;
    consent: boolean;
  }): Lead {
    // Validações de negócio
    if (!props.consent) {
      throw new Error("Consent is required");
    }

    if (props.name.length < 2) {
      throw new Error("Name must be at least 2 characters");
    }

    const lead = new Lead(
      crypto.randomUUID(), // ID generation
      props.name,
      props.email,
      props.phone,
      props.segment,
      props.revenue,
      props.painPoint,
      props.consent,
      new Date(),
    );

    // Make the instance truly immutable
    return lead;
  }

  // Getters (não setters - entities são imutáveis)
  getId() {
    return this.id;
  }
  getName() {
    return this.name;
  }
  getEmail() {
    return this.email;
  }
  getPhone() {
    return this.phone;
  }
  getSegment() {
    return this.segment;
  }
  getRevenue() {
    return this.revenue;
  }

  // Business methods
  isHighValue(): boolean {
    return this.revenue === "1m-5m" || this.revenue === "mais-5m";
  }

  needsImmediateFollowUp(): boolean {
    return this.painPoint.toLowerCase().includes("urgente");
  }
}
