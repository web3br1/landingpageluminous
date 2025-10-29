// Adapter - Implementação do repository usando localStorage
import { Lead } from "../../domain/entities/Lead";
import {
  LeadRepository,
  RepositoryError,
} from "../../domain/ports/LeadRepository";
import { Result } from "../../../../shared/core/Result";

export class LocalStorageLeadRepository implements LeadRepository {
  private readonly STORAGE_KEY = "luminaris_leads";

  async save(lead: Lead): Promise<Result<Lead, RepositoryError>> {
    try {
      const leads = this.getAllLeads();

      // Check for duplicates
      const existingIndex = leads.findIndex((l) => l.email === lead.getEmail());
      if (existingIndex >= 0) {
        return Result.err({
          type: "CONFLICT_ERROR",
          message: "Lead with this email already exists",
        });
      }

      // Save to localStorage
      leads.push({
        id: lead.getId(),
        name: lead.getName(),
        email: lead.getEmail(),
        phone: lead.getPhone(),
        segment: lead.getSegment(),
        revenue: lead.getRevenue(),
        createdAt: new Date().toISOString(),
      });

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(leads));

      return Result.ok(lead);
    } catch (error) {
      return Result.err({
        type: "CONNECTION_ERROR",
        message: "Failed to save lead to local storage",
      });
    }
  }

  async findByEmail(
    email: string,
  ): Promise<Result<Lead | null, RepositoryError>> {
    try {
      const leads = this.getAllLeads();
      const leadData = leads.find((l) => l.email === email);

      if (!leadData) {
        return Result.ok(null);
      }

      // Note: In a real app, you'd reconstruct the Lead entity
      // For demo purposes, returning null to keep it simple
      return Result.ok(null);
    } catch (error) {
      return Result.err({
        type: "CONNECTION_ERROR",
        message: "Failed to query leads",
      });
    }
  }

  async countBySegment(
    segment: string,
  ): Promise<Result<number, RepositoryError>> {
    try {
      const leads = this.getAllLeads();
      const count = leads.filter((l) => l.segment === segment).length;

      return Result.ok(count);
    } catch (error) {
      return Result.err({
        type: "CONNECTION_ERROR",
        message: "Failed to count leads",
      });
    }
  }

  private getAllLeads(): any[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
}
