import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { GenericContainer, StartedTestContainer } from "testcontainers";
import { createCRMClient } from "@/lib/crm/client";
import { createContact, getContact } from "@/lib/crm/operations";

describe("CRM Real Integration Tests", () => {
  let crmContainer: StartedTestContainer;
  let crmClient: any;

  beforeAll(async () => {
    // Start real CRM instance for testing
    crmContainer = await new GenericContainer("hubspot/crm-api:latest")
      .withExposedPorts(8080)
      .withEnvironment({
        HUBSPOT_API_KEY: "test-api-key",
        DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      })
      .start();

    // Start PostgreSQL for CRM data
    const postgresContainer = await new GenericContainer("postgres:15")
      .withExposedPorts(5432)
      .withEnvironment({
        POSTGRES_USER: "test",
        POSTGRES_PASSWORD: "test",
        POSTGRES_DB: "test",
      })
      .start();

    // Wait for services to be ready
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Create real CRM client
    crmClient = createCRMClient({
      baseURL: `http://localhost:${crmContainer.getMappedPort(8080)}`,
      apiKey: "test-api-key",
    });
  }, 60000); // 60 second timeout for container startup

  afterAll(async () => {
    await crmContainer.stop();
  });

  describe("Contact Creation", () => {
    it("creates contact successfully in real CRM", async () => {
      const contactData = {
        name: "Integration Test User",
        email: `test-${Date.now()}@example.com`,
        company: "Test Company",
        role: "Developer",
        source: "integration_test",
        tags: ["test", "integration"],
        custom_properties: {
          test_run_id: Date.now(),
          test_type: "crm_integration",
        },
      };

      // Create contact in real CRM
      const result = await createContact(crmClient, contactData);

      expect(result.success).toBe(true);
      expect(result.contactId).toBeDefined();
      expect(typeof result.contactId).toBe("string");

      // Verify contact was created by fetching it back
      const fetchedContact = await getContact(crmClient, result.contactId!);

      expect(fetchedContact.email).toBe(contactData.email);
      expect(fetchedContact.name).toBe(contactData.name);
      expect(fetchedContact.company).toBe(contactData.company);
    });

    it("handles duplicate email addresses", async () => {
      const email = `duplicate-${Date.now()}@example.com`;
      const contactData1 = {
        name: "First User",
        email,
        company: "Company A",
      };

      const contactData2 = {
        name: "Second User",
        email, // Same email
        company: "Company B",
      };

      // Create first contact
      const result1 = await createContact(crmClient, contactData1);
      expect(result1.success).toBe(true);

      // Attempt to create duplicate
      const result2 = await createContact(crmClient, contactData2);

      // Should either update existing or return specific error
      expect(result2.success || result2.error?.code === "DUPLICATE_EMAIL").toBe(
        true,
      );
    });

    it("validates required fields", async () => {
      const invalidData = {
        name: "", // Empty name
        email: "invalid-email", // Invalid email
        company: "Test Company",
      };

      const result = await createContact(crmClient, invalidData);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toMatch(/name.*required|email.*invalid/i);
    });
  });

  describe("Contact Updates", () => {
    it("updates contact information", async () => {
      // Create initial contact
      const initialData = {
        name: "Update Test User",
        email: `update-${Date.now()}@example.com`,
        company: "Initial Company",
      };

      const createResult = await createContact(crmClient, initialData);
      expect(createResult.success).toBe(true);

      // Update contact
      const updateData = {
        company: "Updated Company",
        role: "Senior Developer",
        tags: ["updated", "integration"],
      };

      const updateResult = await updateContact(
        crmClient,
        createResult.contactId!,
        updateData,
      );
      expect(updateResult.success).toBe(true);

      // Verify update
      const fetchedContact = await getContact(
        crmClient,
        createResult.contactId!,
      );
      expect(fetchedContact.company).toBe("Updated Company");
      expect(fetchedContact.role).toBe("Senior Developer");
      expect(fetchedContact.tags).toContain("updated");
    });
  });

  describe("Error Handling", () => {
    it("handles CRM API timeouts", async () => {
      // Configure client with very short timeout
      const timeoutClient = createCRMClient({
        baseURL: `http://localhost:${crmContainer.getMappedPort(8080)}`,
        apiKey: "test-api-key",
        timeout: 1, // 1ms timeout
      });

      const contactData = {
        name: "Timeout Test",
        email: `timeout-${Date.now()}@example.com`,
      };

      // This should timeout
      const result = await createContact(timeoutClient, contactData);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("TIMEOUT");
    });

    it("handles rate limiting", async () => {
      // Make many rapid requests to trigger rate limiting
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          createContact(crmClient, {
            name: `Rate Limit Test ${i}`,
            email: `rate-limit-${Date.now()}-${i}@example.com`,
          }),
        );
      }

      const results = await Promise.allSettled(promises);

      // Some requests should succeed, some should fail with rate limit
      const successful = results.filter(
        (r) => r.status === "fulfilled" && r.value.success,
      ).length;
      const rateLimited = results.filter(
        (r) => r.status === "fulfilled" && r.value.error?.code === "RATE_LIMIT",
      ).length;

      expect(successful).toBeGreaterThan(0);
      expect(rateLimited).toBeGreaterThan(0);
    });
  });

  describe("Data Synchronization", () => {
    it("syncs contact data correctly", async () => {
      const contactData = {
        name: "Sync Test User",
        email: `sync-${Date.now()}@example.com`,
        company: "Sync Corp",
        custom_properties: {
          last_sync: new Date().toISOString(),
          sync_source: "integration_test",
        },
      };

      // Create contact
      const createResult = await createContact(crmClient, contactData);

      // Simulate data sync by fetching and comparing
      const syncedContact = await getContact(
        crmClient,
        createResult.contactId!,
      );

      expect(syncedContact.name).toBe(contactData.name);
      expect(syncedContact.email).toBe(contactData.email);
      expect(syncedContact.company).toBe(contactData.company);
      expect(syncedContact.custom_properties?.sync_source).toBe(
        "integration_test",
      );
    });

    it("handles concurrent updates", async () => {
      // Create contact
      const contactData = {
        name: "Concurrent Test",
        email: `concurrent-${Date.now()}@example.com`,
        company: "Concurrent Corp",
      };

      const createResult = await createContact(crmClient, contactData);

      // Simulate concurrent updates
      const updatePromises = [
        updateContact(crmClient, createResult.contactId!, {
          company: "Company A",
        }),
        updateContact(crmClient, createResult.contactId!, {
          company: "Company B",
        }),
        updateContact(crmClient, createResult.contactId!, {
          company: "Company C",
        }),
      ];

      const results = await Promise.allSettled(updatePromises);

      // At least one should succeed, others might fail due to optimistic locking
      const successful = results.filter(
        (r) => r.status === "fulfilled" && r.value.success,
      ).length;
      expect(successful).toBeGreaterThan(0);

      // Final state should be one of the updates
      const finalContact = await getContact(crmClient, createResult.contactId!);
      expect(["Company A", "Company B", "Company C"]).toContain(
        finalContact.company,
      );
    });
  });
});
