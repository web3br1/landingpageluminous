import { describe, it, expect, vi, beforeEach } from "vitest";
import { WhatsAppIntegration } from "@/lib/whatsapp/integration";
import { analytics } from "@/lib/analytics-core";

// Mock analytics
vi.mock("@/lib/analytics-core", () => ({
  analytics: {
    track: vi.fn(),
  },
}));

describe("WhatsAppIntegration", () => {
  let whatsapp: WhatsAppIntegration;

  beforeEach(() => {
    vi.clearAllMocks();
    whatsapp = new WhatsAppIntegration({
      phoneNumber: "5511999999999",
    });
  });

  describe("URL Generation", () => {
    it("should generate basic WhatsApp URL", () => {
      const url = whatsapp.generateWhatsAppUrl("Test message");
      expect(url).toBe("https://wa.me/5511999999999?text=Test%20message");
    });

    it("should encode special characters in message", () => {
      const url = whatsapp.generateWhatsAppUrl("Olá, como vai? & teste");
      expect(url).toContain("Ol%C3%A1%2C%20como%20vai%3F%20%26%20teste");
    });

    it("should track redirect analytics", () => {
      const context = {
        segments: ["mobile_user"],
        intent: "contact",
        page: "/home",
      };

      whatsapp.generateWhatsAppUrl("Test", context);

      expect(analytics.track).toHaveBeenCalledWith("whatsapp_redirect", {
        message_length: 4,
        has_context: true,
        segments: ["mobile_user"],
        intent: "contact",
        page: "/home",
      });
    });
  });

  describe("Message Personalization", () => {
    it("should generate personalized message for pricing intent", () => {
      const context = {
        segments: ["enterprise"],
        intent: "pricing",
        page: "/pricing",
      };

      const message = whatsapp.generatePersonalizedMessage(context);

      expect(message).toContain("planos da Luminaris");
      expect(message).toContain("empresa");
      expect(message).toContain("página de preços");
    });

    it("should generate personalized message for demo intent", () => {
      const context = {
        segments: ["mobile_user"],
        intent: "demo",
        page: "/demo",
      };

      const message = whatsapp.generatePersonalizedMessage(context);

      expect(message).toContain("demonstração");
      expect(message).toContain("celular");
      expect(message).toContain("página de demo");
    });

    it("should handle unknown intent gracefully", () => {
      const context = {
        segments: [],
        intent: "unknown",
        page: "/unknown",
      };

      const message = whatsapp.generatePersonalizedMessage(context);

      expect(message).toContain("sistema de automação Luminaris");
    });
  });

  describe("Contact URLs Generation", () => {
    it("should generate all contact method URLs", () => {
      const urls = whatsapp.generateContactUrls();

      expect(urls.whatsapp).toContain("https://wa.me/");
      expect(urls.phone).toBe("tel:5511999999999");
      expect(urls.email).toContain("mailto:");
    });

    it("should include personalized message in URLs", () => {
      const context = {
        segments: ["enterprise"],
        intent: "contact",
      };

      const urls = whatsapp.generateContactUrls(context);

      // Check that the message is URL encoded (contains % for special chars)
      expect(urls.whatsapp).toMatch(/%[A-F0-9]{2}/);
      expect(urls.email).toContain("Contato%20Site");
      expect(urls.email).toContain("empresa"); // Should include personalized content
    });
  });

  describe("Business API Configuration", () => {
    it("should return false when API is not configured", () => {
      expect(whatsapp.isBusinessAPIConfigured()).toBe(false);
    });

    it("should return true when API is configured", () => {
      const apiWhatsapp = new WhatsAppIntegration({
        phoneNumber: "5511999999999",
        businessAccountId: "test-id",
        accessToken: "test-token",
      });

      expect(apiWhatsapp.isBusinessAPIConfigured()).toBe(true);
    });
  });

  describe("Phone Number Validation", () => {
    it("should warn about invalid phone format", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      new WhatsAppIntegration({
        phoneNumber: "11999999999", // Missing country code
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("may not be in correct format"),
      );

      consoleSpy.mockRestore();
    });

    it("should warn about + prefix", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      new WhatsAppIntegration({
        phoneNumber: "+5511999999999",
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("should not include + prefix"),
      );

      consoleSpy.mockRestore();
    });
  });

  describe("Message Validation", () => {
    const apiWhatsapp = new WhatsAppIntegration({
      phoneNumber: "5511999999999",
      businessAccountId: "test-id",
      accessToken: "test-token",
    });

    it("should reject empty recipient", async () => {
      const result = await apiWhatsapp.sendMessage({
        to: "",
        message: "Test",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Recipient phone number is required");
    });

    it("should reject empty message", async () => {
      const result = await apiWhatsapp.sendMessage({
        to: "5511987654321",
        message: "",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Message cannot be empty");
    });

    it("should reject message too long", async () => {
      const longMessage = "a".repeat(4097);

      const result = await apiWhatsapp.sendMessage({
        to: "5511987654321",
        message: longMessage,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Message too long");
    });

    it("should reject invalid phone format", async () => {
      const result = await apiWhatsapp.sendMessage({
        to: "11999999999", // Missing country code
        message: "Test",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid recipient phone number format");
    });
  });

  describe("API Message Sending", () => {
    const apiWhatsapp = new WhatsAppIntegration({
      phoneNumber: "5511999999999",
      businessAccountId: "test-id",
      accessToken: "test-token",
    });

    it("should handle API not configured", async () => {
      const basicWhatsapp = new WhatsAppIntegration({
        phoneNumber: "5511999999999",
      });

      const result = await basicWhatsapp.sendMessage({
        to: "5511987654321",
        message: "Test",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Business API not configured");
    });

    it("should handle network errors gracefully", async () => {
      // Mock fetch to throw error
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      const result = await apiWhatsapp.sendMessage({
        to: "5511987654321",
        message: "Test message",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");

      expect(analytics.track).toHaveBeenCalledWith("whatsapp_api_error", {
        error_type: "network",
        error_message: "Network error",
        context: undefined,
      });
    });

    it("should handle API errors gracefully", async () => {
      // Mock fetch to return error response
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () =>
          Promise.resolve({
            error: {
              message: "Invalid request",
              code: 100,
            },
          }),
      });

      const result = await apiWhatsapp.sendMessage({
        to: "5511987654321",
        message: "Test message",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid request");

      expect(analytics.track).toHaveBeenCalledWith("whatsapp_api_error", {
        error_code: 100,
        error_message: "Invalid request",
        http_status: 400,
        context: undefined,
      });
    });

    it("should handle successful API response", async () => {
      // Mock successful response
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            messages: [
              {
                id: "test-message-id",
              },
            ],
          }),
      });

      const result = await apiWhatsapp.sendMessage({
        to: "5511987654321",
        message: "Test message",
        context: { intent: "test" },
      });

      expect(result.success).toBe(true);
      expect(result.messageId).toBe("test-message-id");

      expect(analytics.track).toHaveBeenCalledWith(
        "whatsapp_api_message_sent",
        {
          message_id: "test-message-id",
          recipient: "5511987654321",
          message_length: 12,
          context: { intent: "test" },
        },
      );
    });
  });

  describe("WhatsApp Availability Check", () => {
    it("should return false on server-side", async () => {
      // Mock server environment
      const originalWindow = global.window;
      delete (global as any).window;

      const result = await whatsapp.isWhatsAppAvailable();
      expect(result).toBe(false);

      // Restore window
      global.window = originalWindow;
    });

    it("should handle iframe creation errors gracefully", async () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      // Mock document.createElement to throw
      const originalCreateElement = document.createElement;
      document.createElement = vi.fn().mockImplementation(() => {
        throw new Error("DOM error");
      });

      const result = await whatsapp.isWhatsAppAvailable();
      expect(result).toBe(false);

      expect(consoleSpy).toHaveBeenCalledWith(
        "WhatsApp availability check failed:",
        expect.any(Error),
      );

      // Restore
      document.createElement = originalCreateElement;
      consoleSpy.mockRestore();
    });
  });

  describe("API Connection Test", () => {
    it("should return not configured when API not set up", async () => {
      const result = await whatsapp.testAPIConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Business API not configured");
    });

    it("should handle API test errors", async () => {
      const apiWhatsapp = new WhatsAppIntegration({
        phoneNumber: "5511999999999",
        businessAccountId: "test-id",
        accessToken: "test-token",
      });

      global.fetch = vi.fn().mockRejectedValue(new Error("Connection failed"));

      const result = await apiWhatsapp.testAPIConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Connection failed");
    });
  });
});
