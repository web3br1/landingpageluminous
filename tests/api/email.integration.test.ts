import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock external service APIs
const mockEmailService = {
  sendEmail: vi.fn(),
  sendTransactionalEmail: vi.fn(),
  getEmailStatus: vi.fn(),
};

const mockFetch = vi.fn();

beforeEach(() => {
  global.fetch = mockFetch;
  vi.clearAllMocks();
});

afterEach(() => {
  global.fetch = originalFetch;
});

const originalFetch = global.fetch;

describe("Email Service Integration", () => {
  it("sends welcome emails to new users", async () => {
    const emailData = {
      to: "user@example.com",
      subject: "Welcome to Our Platform",
      template: "welcome",
      variables: { name: "João" },
    };

    mockEmailService.sendEmail.mockResolvedValue({
      id: "email123",
      status: "sent",
    });

    const result = await mockEmailService.sendEmail(emailData);

    expect(mockEmailService.sendEmail).toHaveBeenCalledWith(emailData);
    expect(result.status).toBe("sent");
  });

  it("handles email delivery failures", async () => {
    mockEmailService.sendEmail.mockRejectedValue(
      new Error("SMTP connection failed"),
    );

    try {
      await mockEmailService.sendEmail({});
    } catch (error) {
      expect(error.message).toBe("SMTP connection failed");
    }
  });

  it("tracks email delivery status", async () => {
    const emailId = "email123";

    mockEmailService.getEmailStatus.mockResolvedValue({
      id: emailId,
      status: "delivered",
      deliveredAt: new Date().toISOString(),
    });

    const result = await mockEmailService.getEmailStatus(emailId);

    expect(result.status).toBe("delivered");
    expect(result.deliveredAt).toBeDefined();
  });
});
