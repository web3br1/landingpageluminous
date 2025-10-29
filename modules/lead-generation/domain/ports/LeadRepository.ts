// Port - Interface para persistência
import { Lead } from "../entities/Lead";
import { Result } from "@/shared/core/Result";

export interface LeadRepository {
  save(lead: Lead): Promise<Result<Lead, RepositoryError>>;
  findByEmail(email: string): Promise<Result<Lead | null, RepositoryError>>;
  countBySegment(segment: string): Promise<Result<number, RepositoryError>>;
}

export interface RepositoryError {
  type: "CONNECTION_ERROR" | "VALIDATION_ERROR" | "CONFLICT_ERROR";
  message: string;
}
