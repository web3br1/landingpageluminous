// Repository Port - Data access abstraction
import { Checkout, CheckoutStatus } from "../entities/Checkout";
import { Result } from "@/shared/core/Result";

export interface CheckoutRepository {
  save(checkout: Checkout): Promise<Result<Checkout, RepositoryError>>;
  findById(id: string): Promise<Result<Checkout | null, RepositoryError>>;
  findByLeadId(leadId: string): Promise<Result<Checkout[], RepositoryError>>;
  updateStatus(
    id: string,
    status: CheckoutStatus,
  ): Promise<Result<Checkout, RepositoryError>>;
  findAll(): Promise<Result<Checkout[], RepositoryError>>;
}

export interface RepositoryError {
  message: string;
  code?: string;
}
