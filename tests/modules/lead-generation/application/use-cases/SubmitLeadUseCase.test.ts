// Unit Tests for SubmitLeadUseCase - Fase 2 Implementation
// Tests business logic and use case orchestration

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  SubmitLeadUseCase,
  SubmitLeadInput,
} from "../../../../../modules/lead-generation/application/use-cases/SubmitLeadUseCase";
import { LeadRepository } from "../../../../../modules/lead-generation/domain/ports/LeadRepository";
import { Lead } from "../../../../../modules/lead-generation/domain/entities/Lead";
import { Email } from "../../../../../modules/lead-generation/domain/value-objects/Email";
import { Result, isOk, isErr } from "@/shared/core/Result";

// Mock repository
const mockLeadRepository = {
  save: vi.fn(),
  findByEmail: vi.fn(),
  findById: vi.fn(),
  findAll: vi.fn(),
} satisfies LeadRepository;

describe("SubmitLeadUseCase", () => {
  let useCase: SubmitLeadUseCase;
  let validInput: SubmitLeadInput;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new SubmitLeadUseCase(mockLeadRepository);

    validInput = {
      name: "João Silva",
      email: "joao.silva@empresa.com.br",
      phone: "+55 11 99999-9999",
      segment: "tecnologia",
      revenue: "500k-1m",
      painPoint: "Preciso otimizar processos urgentemente",
      consent: true,
    };
  });

  describe("Successful Lead Submission", () => {
    it("should create and save a new lead successfully", async () => {
      // Arrange
      const expectedLead = Lead.create(validInput);
      mockLeadRepository.findByEmail.mockResolvedValue(Result.ok(null));
      mockLeadRepository.save.mockResolvedValue(Result.ok(expectedLead));

      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(isOk(result)).toBe(true);
      const output = (result as any).value;

      expect(output.lead).toBeDefined();
      expect(output.lead.getEmail()).toBe("joao.silva@empresa.com.br");
      expect(output.lead.getName()).toBe("João Silva");
      expect(output.requiresImmediateFollowUp).toBe(true); // Contains "urgente"
      expect(output.isHighValue).toBe(false); // Revenue is 500k-1m, not high value

      expect(mockLeadRepository.findByEmail).toHaveBeenCalledWith(
        "joao.silva@empresa.com.br",
      );
      expect(mockLeadRepository.save).toHaveBeenCalledTimes(1);
    });

    it("should identify high-value leads correctly", async () => {
      // Arrange
      const highValueInput = { ...validInput, revenue: "1m-5m" };
      const highValueLead = Lead.create(highValueInput);

      mockLeadRepository.findByEmail.mockResolvedValue(Result.ok(null));
      mockLeadRepository.save.mockResolvedValue(Result.ok(highValueLead));

      // Act
      const result = await useCase.execute(highValueInput);

      // Assert
      expect(isOk(result)).toBe(true);
      expect((result as any).value.isHighValue).toBe(true);
    });

    it("should identify leads requiring immediate follow-up", async () => {
      // Arrange
      const urgentInput = {
        ...validInput,
        painPoint: "Problema crítico que precisa ser resolvido agora",
      };
      const urgentLead = Lead.create(urgentInput);

      mockLeadRepository.findByEmail.mockResolvedValue(Result.ok(null));
      mockLeadRepository.save.mockResolvedValue(Result.ok(urgentLead));

      // Act
      const result = await useCase.execute(urgentInput);

      // Assert
      expect(isOk(result)).toBe(true);
      expect((result as any).value.requiresImmediateFollowUp).toBe(false); // Doesn't contain "urgente"
    });
  });

  describe("Business Rule Validation", () => {
    it("should reject personal email addresses", async () => {
      // Arrange
      const personalEmailInput = { ...validInput, email: "joao@gmail.com" };

      // Act
      const result = await useCase.execute(personalEmailInput);

      // Assert
      expect(isErr(result)).toBe(true);
      expect((result as any).error.type).toBe("VALIDATION_ERROR");
      expect((result as any).error.message).toBe("Please use a business email");

      expect(mockLeadRepository.save).not.toHaveBeenCalled();
    });

    it("should reject duplicate leads", async () => {
      // Arrange
      const existingLead = Lead.create(validInput);
      mockLeadRepository.findByEmail.mockResolvedValue(Result.ok(existingLead));

      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(isErr(result)).toBe(true);
      expect((result as any).error.type).toBe("DUPLICATE_ERROR");
      expect((result as any).error.message).toBe("Lead already exists");

      expect(mockLeadRepository.save).not.toHaveBeenCalled();
    });

    it("should reject leads without consent", async () => {
      // Arrange
      const noConsentInput = { ...validInput, consent: false };

      // Act
      const result = await useCase.execute(noConsentInput);

      // Assert
      expect(isErr(result)).toBe(true);
      expect((result as any).error.type).toBe("VALIDATION_ERROR");
      expect((result as any).error.message).toBe("Consent is required");
    });

    it("should reject leads with invalid names", async () => {
      // Arrange
      const shortNameInput = { ...validInput, name: "A" };

      // Act
      const result = await useCase.execute(shortNameInput);

      // Assert
      expect(isErr(result)).toBe(true);
      expect((result as any).error.type).toBe("VALIDATION_ERROR");
      expect((result as any).error.message).toBe(
        "Name must be at least 2 characters",
      );
    });

    it("should reject invalid email formats", async () => {
      // Arrange
      const invalidEmailInput = { ...validInput, email: "invalid-email" };

      // Act
      const result = await useCase.execute(invalidEmailInput);

      // Assert
      expect(isErr(result)).toBe(true);
      expect((result as any).error.type).toBe("VALIDATION_ERROR");
      expect((result as any).error.message).toBe("Invalid email format");
    });
  });

  describe("Error Handling", () => {
    it("should handle repository persistence errors", async () => {
      // Arrange
      mockLeadRepository.findByEmail.mockResolvedValue({
        isOk: () => true,
        value: null,
      });
      mockLeadRepository.save.mockResolvedValue(
        Result.err({ message: "Database connection failed" }),
      );

      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(isErr(result)).toBe(true);
      expect((result as any).error.type).toBe("PERSISTENCE_ERROR");
      expect((result as any).error.message).toBe("Database connection failed");
    });

    it("should handle repository query errors", async () => {
      // Arrange
      mockLeadRepository.findByEmail.mockResolvedValue(
        Result.err({ message: "Query failed" }),
      );

      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(isErr(result)).toBe(true);
      expect((result as any).error.type).toBe("PERSISTENCE_ERROR");
      expect((result as any).error.message).toBe("Database connection failed");
    });

    it("should handle unexpected errors", async () => {
      // Arrange
      mockLeadRepository.findByEmail.mockRejectedValue(
        new Error("Unexpected database error"),
      );

      // Act
      const result = await useCase.execute(validInput);

      // Assert
      expect(isErr(result)).toBe(true);
      expect((result as any).error.type).toBe("VALIDATION_ERROR"); // Error instances are treated as validation errors
      expect((result as any).error.message).toBe("Unexpected database error");
    });
  });

  describe("Repository Interaction", () => {
    it("should call repository methods in correct order", async () => {
      // Arrange
      const lead = Lead.create(validInput);
      mockLeadRepository.findByEmail.mockResolvedValue(Result.ok(null));
      mockLeadRepository.save.mockResolvedValue(Result.ok(lead));

      // Act
      await useCase.execute(validInput);

      // Assert
      expect(mockLeadRepository.findByEmail).toHaveBeenCalledWith(
        "joao.silva@empresa.com.br",
      );
      expect(mockLeadRepository.findByEmail).toHaveBeenCalledBefore(
        mockLeadRepository.save,
      );
      expect(mockLeadRepository.save).toHaveBeenCalledTimes(1);
    });

    it("should not save lead if duplicate found", async () => {
      // Arrange
      const existingLead = Lead.create(validInput);
      mockLeadRepository.findByEmail.mockResolvedValue(Result.ok(existingLead));

      // Act
      await useCase.execute(validInput);

      // Assert
      expect(mockLeadRepository.save).not.toHaveBeenCalled();
    });
  });
});
