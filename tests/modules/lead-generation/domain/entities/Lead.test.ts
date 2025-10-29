// Unit Tests for Lead Entity - Fase 2 Implementation
// Tests domain invariants and business rules for Lead entity

import { describe, it, expect, beforeEach } from "vitest";
import { Lead } from "../../../../../modules/lead-generation/domain/entities/Lead";

describe("Lead Entity", () => {
  let leadData: {
    name: string;
    email: string;
    phone: string;
    segment: string;
    revenue: string;
    painPoint: string;
    consent: boolean;
  };

  beforeEach(() => {
    leadData = {
      name: "João Silva",
      email: "joao.silva@empresa.com.br",
      phone: "+55 11 99999-9999",
      segment: "tecnologia",
      revenue: "500k-1m",
      painPoint: "Preciso otimizar processos urgentemente",
      consent: true,
    };
  });

  describe("Lead Creation", () => {
    it("should create a valid lead with all fields", () => {
      const lead = Lead.create(leadData);

      expect(lead.getId()).toBeDefined();
      expect(lead.getEmail()).toBe("joao.silva@empresa.com.br");
      expect(lead.getName()).toBe("João Silva");
      expect(lead.getPhone()).toBe("+55 11 99999-9999");
      expect(lead.getSegment()).toBe("tecnologia");
      expect(lead.getRevenue()).toBe("500k-1m");
    });

    it("should generate unique IDs for different leads", () => {
      const lead1 = Lead.create(leadData);
      const lead2 = Lead.create({
        ...leadData,
        email: "jane@empresa.com.br",
      });

      expect(lead1.getId()).not.toBe(lead2.getId());
    });
  });

  describe("Lead Business Rules", () => {
    it("should identify high-value leads correctly", () => {
      const highValueLead = Lead.create({
        ...leadData,
        revenue: "1m-5m",
      });

      expect(highValueLead.isHighValue()).toBe(true);
    });

    it("should identify leads requiring immediate follow-up", () => {
      const urgentLead = Lead.create({
        ...leadData,
        painPoint: "Problema urgente que precisa ser resolvido",
      });

      expect(urgentLead.needsImmediateFollowUp()).toBe(true);
    });

    it("should not require immediate follow-up for non-urgent issues", () => {
      const normalLead = Lead.create({
        ...leadData,
        painPoint: "Preciso melhorar a eficiência",
      });

      expect(normalLead.needsImmediateFollowUp()).toBe(false);
    });

    it("should reject leads without consent", () => {
      expect(() =>
        Lead.create({
          ...leadData,
          consent: false,
        }),
      ).toThrow("Consent is required");
    });

    it("should reject leads with short names", () => {
      expect(() =>
        Lead.create({
          ...leadData,
          name: "A",
        }),
      ).toThrow("Name must be at least 2 characters");
    });
  });

  describe("Lead Immutability", () => {
    it("should not allow direct property modification", () => {
      const lead = Lead.create(leadData);

      // Test that direct property access throws (Object.freeze makes it read-only)
      expect(() => {
        // Try to modify frozen property - should throw
        (lead as any).name = "New Name";
      }).toThrow("Cannot assign to read only property");

      // Value should remain unchanged
      expect(lead.getName()).toBe("João Silva");

      // Test that we cannot modify through getters
      expect(() => {
        // @ts-ignore - testing immutability
        lead.getName = () => "Modified Name";
      }).toThrow(); // Should throw because Object.freeze also freezes the prototype

      expect(lead.getName()).toBe("João Silva");
    });
  });
});
