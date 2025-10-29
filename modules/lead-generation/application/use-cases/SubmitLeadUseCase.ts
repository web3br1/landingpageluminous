// Use Case - Lógica de negócio pura (sem UI/Infra)
import { Lead } from "../../domain/entities/Lead";
import { Email } from "../../domain/value-objects/Email";
import {
  LeadRepository,
  RepositoryError,
} from "../../domain/ports/LeadRepository";
import { Result, isOk, isErr } from "@/shared/core/Result";

export interface SubmitLeadInput {
  name: string;
  email: string;
  phone: string;
  segment: string;
  revenue: string;
  painPoint: string;
  consent: boolean;
}

export interface SubmitLeadOutput {
  lead: Lead;
  requiresImmediateFollowUp: boolean;
  isHighValue: boolean;
}

export class SubmitLeadUseCase {
  constructor(private leadRepository: LeadRepository) {}

  async execute(
    input: SubmitLeadInput,
  ): Promise<Result<SubmitLeadOutput, SubmitLeadError>> {
    try {
      // 1. Validate domain rules
      const emailResult = this.validateEmail(input.email);
      if (isErr(emailResult)) {
        return emailResult;
      }

      // 2. Create domain entity
      const leadResult = this.createLead(input);
      if (isErr(leadResult)) {
        return leadResult;
      }
      const lead = leadResult.value;

      // 3. Check for duplicates
      const existingLead = await this.leadRepository.findByEmail(input.email);
      if (isOk(existingLead) && existingLead.value) {
        return Result.err({
          type: "DUPLICATE_ERROR",
          message: "Lead already exists",
        });
      }

      // 4. Persist
      const saveResult = await this.leadRepository.save(lead);
      if (isErr(saveResult)) {
        return Result.err({
          type: "PERSISTENCE_ERROR",
          message: saveResult.error.message,
        });
      }

      // 5. Return business result
      return Result.ok({
        lead: saveResult.value,
        requiresImmediateFollowUp: lead.needsImmediateFollowUp(),
        isHighValue: lead.isHighValue(),
      });
    } catch (error) {
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
  }

  private validateEmail(email: string): Result<Email, SubmitLeadError> {
    try {
      const emailObj = Email.create(email);
      if (!emailObj.isCorporate()) {
        return Result.err({
          type: "VALIDATION_ERROR",
          message: "Please use a corporate email address",
        });
      }
      return Result.ok(emailObj);
    } catch (error) {
      return Result.err({
        type: "VALIDATION_ERROR",
        message: error instanceof Error ? error.message : "Invalid email",
      });
    }
  }

  private createLead(input: SubmitLeadInput): Result<Lead, SubmitLeadError> {
    try {
      const lead = Lead.create(input);
      return Result.ok(lead);
    } catch (error) {
      return Result.err({
        type: "VALIDATION_ERROR",
        message: error instanceof Error ? error.message : "Invalid lead data",
      });
    }
  }
}

export interface SubmitLeadError {
  type:
    | "VALIDATION_ERROR"
    | "DUPLICATE_ERROR"
    | "PERSISTENCE_ERROR"
    | "UNKNOWN_ERROR";
  message: string;
}
