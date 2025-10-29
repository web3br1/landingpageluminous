import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock console methods to capture logs
const mockConsole = {
  debug: vi.fn(),
  log: vi.fn(), // info level uses log
  warn: vi.fn(),
  error: vi.fn(),
};

vi.stubGlobal("console", mockConsole);

describe("Logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should export logger functions", async () => {
    const { logger } = await import("@/lib/logger");

    expect(typeof logger.debug).toBe("function");
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.error).toBe("function");
  });

  it("should log messages with correct level", async () => {
    const { logger } = await import("@/lib/logger");

    logger.info("Test message", { userId: "123" });

    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('"level":"info"')
    );
    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('"msg":"Test message"')
    );
    expect(mockConsole.log).toHaveBeenCalledWith(
      expect.stringContaining('"userId":"123"')
    );
  });

  it("should serialize errors correctly", async () => {
    const { logger } = await import("@/lib/logger");

    const testError = new Error("Test error");
    logger.error("Error occurred", { error: testError });

    const loggedMessage = mockConsole.error.mock.calls[0][0];
    const parsed = JSON.parse(loggedMessage);

    expect(parsed.level).toBe("error");
    expect(parsed.msg).toBe("Error occurred");
    expect(parsed.error.name).toBe("Error");
    expect(parsed.error.message).toBe("Test error");
  });

  it("should handle different log levels", async () => {
    const { logger } = await import("@/lib/logger");

    // Debug only logs in development, not in test/production
    logger.debug("Debug message");
    logger.warn("Warning message");
    logger.error("Error message");

    // Debug might not be called depending on environment
    expect(mockConsole.warn).toHaveBeenCalled();
    expect(mockConsole.error).toHaveBeenCalled();
  });
});
