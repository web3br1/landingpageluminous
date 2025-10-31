// Unit Tests for SSRAdapter
// Tests server/client environment handling

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";

import { SSRAdapter } from "../ssr-adapter";
import { Factory, Utils } from "../../../../tests/__shared__/lib/test-helpers";

describe("SSRAdapter", () => {
  let adapter: SSRAdapter;

  beforeEach(() => {
    adapter = new SSRAdapter();
  });

  afterEach(() => {
    // Reset any global state if needed
    jest.restoreAllMocks();
  });

  describe("environment detection", () => {
    it("should detect client environment correctly", () => {
      // In test environment, we're typically running in Node.js (server context)
      // but the adapter should handle both cases

      const info = adapter.getEnvironmentInfo();

      // These should always be boolean values
      expect(typeof info.isServer).toBe("boolean");
      expect(typeof info.isClient).toBe("boolean");
      expect(typeof info.isDevelopment).toBe("boolean");
      expect(typeof info.isProduction).toBe("boolean");
      expect(typeof info.nodeEnv).toBe("string");

      // Server and client should be opposites
      expect(info.isServer).not.toBe(info.isClient);
    });

    it("should return consistent environment info", () => {
      // Act
      const info1 = adapter.getEnvironmentInfo();
      const info2 = adapter.getEnvironmentInfo();

      // Assert
      expect(info1).toEqual(info2);
    });

    it("should detect development environment", () => {
      // This depends on the actual NODE_ENV
      const info = adapter.getEnvironmentInfo();

      if (process.env.NODE_ENV === "development") {
        expect(info.isDevelopment).toBe(true);
        expect(info.isProduction).toBe(false);
      } else if (process.env.NODE_ENV === "production") {
        expect(info.isDevelopment).toBe(false);
        expect(info.isProduction).toBe(true);
      }
    });
  });

  describe("safe window access", () => {
    it("should handle window access safely", () => {
      // Arrange
      const testValue = "test-value";
      const fallbackValue = "fallback";

      // Mock window object for testing
      const originalWindow = global.window;
      (global as any).window = { testProperty: testValue };

      try {
        // Act
        const result = adapter.safeWindowAccess(
          () => (window as any).testProperty,
          fallbackValue,
        );

        // Assert
        expect(result).toBe(testValue);
      } finally {
        // Cleanup
        (global as any).window = originalWindow;
      }
    });

    it("should return fallback when window access fails", () => {
      // Arrange
      const fallbackValue = "fallback";

      // Ensure window is not available (server environment)
      const originalWindow = global.window;
      delete (global as any).window;

      try {
        // Act
        const result = adapter.safeWindowAccess(
          () => (window as any).nonExistentProperty,
          fallbackValue,
        );

        // Assert
        expect(result).toBe(fallbackValue);
      } finally {
        // Cleanup
        (global as any).window = originalWindow;
      }
    });

    it("should handle exceptions in window access operations", () => {
      // Arrange
      const fallbackValue = "fallback";

      // Mock window that throws
      const originalWindow = global.window;
      (global as any).window = {
        get testProperty() {
          throw new Error("Access denied");
        },
      };

      try {
        // Act
        const result = adapter.safeWindowAccess(
          () => (window as any).testProperty,
          fallbackValue,
        );

        // Assert
        expect(result).toBe(fallbackValue);
      } finally {
        // Cleanup
        (global as any).window = originalWindow;
      }
    });
  });

  describe("safe localStorage access", () => {
    it("should access localStorage safely", () => {
      // Arrange
      const testKey = "test-key";
      const testValue = { data: "test" };
      const fallbackValue = "fallback";

      // Mock localStorage
      const originalLocalStorage = global.localStorage;
      const mockLocalStorage = {
        getItem: jest.fn((key: string) =>
          key === testKey ? JSON.stringify(testValue) : null,
        ),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
        key: jest.fn(),
        get length() {
          return 1;
        },
      };

      Object.defineProperty(window, "localStorage", {
        value: mockLocalStorage,
        writable: true,
      });

      try {
        // Act
        const result = adapter.safeLocalStorageAccess(testKey, fallbackValue);

        // Assert
        expect(result).toEqual(testValue);
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith(testKey);
      } finally {
        // Cleanup
        Object.defineProperty(window, "localStorage", {
          value: originalLocalStorage,
          writable: true,
        });
      }
    });

    it("should handle localStorage JSON parsing errors", () => {
      // Arrange
      const testKey = "test-key";
      const fallbackValue = "fallback";

      // Mock localStorage with invalid JSON
      const originalLocalStorage = global.localStorage;
      const mockLocalStorage = {
        getItem: jest.fn(() => "invalid json {"),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
        key: jest.fn(),
        get length() {
          return 1;
        },
      };

      Object.defineProperty(window, "localStorage", {
        value: mockLocalStorage,
        writable: true,
      });

      try {
        // Act
        const result = adapter.safeLocalStorageAccess(testKey, fallbackValue);

        // Assert
        expect(result).toBe(fallbackValue);
      } finally {
        // Cleanup
        Object.defineProperty(window, "localStorage", {
          value: originalLocalStorage,
          writable: true,
        });
      }
    });

    it("should return fallback when localStorage is unavailable", () => {
      // Arrange
      const testKey = "test-key";
      const fallbackValue = "fallback";

      // Remove localStorage
      const originalLocalStorage = global.localStorage;
      delete (global as any).localStorage;

      try {
        // Act
        const result = adapter.safeLocalStorageAccess(testKey, fallbackValue);

        // Assert
        expect(result).toBe(fallbackValue);
      } finally {
        // Cleanup
        (global as any).localStorage = originalLocalStorage;
      }
    });
  });

  describe("safe async operations", () => {
    it("should execute async operations safely on client", async () => {
      // Arrange
      const testValue = "success";
      const fallbackValue = "fallback";

      // Mock client environment
      const originalWindow = global.window;
      (global as any).window = {};

      try {
        // Act
        const result = await adapter.safeAsyncOperation(
          () => Promise.resolve(testValue),
          fallbackValue,
          "test-operation",
        );

        // Assert
        expect(result).toBe(testValue);
      } finally {
        // Cleanup
        (global as any).window = originalWindow;
      }
    });

    it("should return fallback for async operations on server", async () => {
      // Arrange
      const fallbackValue = "fallback";

      // Mock server environment (no window)
      const originalWindow = global.window;
      delete (global as any).window;

      try {
        // Act
        const result = await adapter.safeAsyncOperation(
          () => Promise.resolve("should-not-execute"),
          fallbackValue,
          "test-operation",
        );

        // Assert
        expect(result).toBe(fallbackValue);
      } finally {
        // Cleanup
        (global as any).window = originalWindow;
      }
    });

    it("should handle async operation failures gracefully", async () => {
      // Arrange
      const fallbackValue = "fallback";

      // Mock client environment
      const originalWindow = global.window;
      (global as any).window = {};

      try {
        // Act
        const result = await adapter.safeAsyncOperation(
          () => Promise.reject(new Error("Async operation failed")),
          fallbackValue,
          "test-operation",
        );

        // Assert
        expect(result).toBe(fallbackValue);
      } finally {
        // Cleanup
        (global as any).window = originalWindow;
      }
    });
  });

  describe("static generation detection", () => {
    it("should detect static generation correctly", () => {
      // Test depends on actual NEXT_PHASE environment
      const isStatic = adapter.isStaticGeneration();

      // Should be boolean
      expect(typeof isStatic).toBe("boolean");
    });
  });

  describe("safe timeout operations", () => {
    it("should create timeouts safely on client", () => {
      // Arrange
      const originalWindow = global.window;
      const mockSetTimeout = jest.fn();
      (global as any).window = { setTimeout: mockSetTimeout };

      try {
        // Act
        const clearFn = adapter.safeTimeout(() => {}, 1000);

        // Assert
        expect(mockSetTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);
        expect(typeof clearFn).toBe("function");
      } finally {
        // Cleanup
        (global as any).window = originalWindow;
      }
    });

    it("should not create timeouts on server", () => {
      // Arrange
      const originalWindow = global.window;
      delete (global as any).window;

      try {
        // Act
        const clearFn = adapter.safeTimeout(() => {}, 1000);

        // Assert - Should return no-op function
        expect(typeof clearFn).toBe("function");
        clearFn(); // Should not throw
      } finally {
        // Cleanup
        (global as any).window = originalWindow;
      }
    });
  });

  describe("safe console logging", () => {
    it("should log safely on client", () => {
      // Arrange
      const originalWindow = global.window;
      const mockConsole = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };
      (global as any).window = {};
      const originalGlobalConsole = global.console;
      global.console = mockConsole as any;

      try {
        // Act
        adapter.safeConsoleLog("log", "Test message", { data: "test" });

        // Assert
        expect(mockConsole.log).toHaveBeenCalledWith("Test message", {
          data: "test",
        });
      } finally {
        // Cleanup
        (global as any).window = originalWindow;
        global.console = originalGlobalConsole;
      }
    });

    it("should prefix logs on server", () => {
      // Arrange
      const originalWindow = global.window;
      delete (global as any).window;

      const mockConsole = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };
      const originalGlobalConsole = global.console;
      global.console = mockConsole as any;

      try {
        // Act
        adapter.safeConsoleLog("log", "Test message", { data: "test" });

        // Assert
        expect(mockConsole.log).toHaveBeenCalledWith("[SSR]", "Test message", {
          data: "test",
        });
      } finally {
        // Cleanup
        (global as any).window = originalWindow;
        global.console = originalGlobalConsole;
      }
    });
  });

  describe("safe JSON operations", () => {
    it("should stringify objects safely", () => {
      // Arrange
      const testObject = { data: "test", nested: { value: 123 } };
      const fallback = "{}";

      // Act
      const result = adapter.safeStringify(testObject, fallback);

      // Assert
      expect(result).toBe(JSON.stringify(testObject));
    });

    it("should return fallback on stringify failure", () => {
      // Arrange
      const circularObject: any = { self: null };
      circularObject.self = circularObject; // Create circular reference

      const fallback = "{}";

      // Act
      const result = adapter.safeStringify(circularObject, fallback);

      // Assert
      expect(result).toBe(fallback);
    });

    it("should parse JSON safely", () => {
      // Arrange
      const testJson = '{"data": "test", "value": 123}';
      const fallback = { default: true };

      // Act
      const result = adapter.safeParse(testJson, fallback);

      // Assert
      expect(result).toEqual(JSON.parse(testJson));
    });

    it("should return fallback on parse failure", () => {
      // Arrange
      const invalidJson = "invalid json {{{";
      const fallback = { default: true };

      // Act
      const result = adapter.safeParse(invalidJson, fallback);

      // Assert
      expect(result).toEqual(fallback);
    });
  });

  describe("IntersectionObserver safety", () => {
    it("should create IntersectionObserver safely on client", () => {
      // Arrange
      const originalWindow = global.window;
      const mockObserver = {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
      const mockConstructor = jest.fn(() => mockObserver);

      (global as any).window = {
        IntersectionObserver: mockConstructor,
      };

      try {
        // Act
        const observer = adapter.safeIntersectionObserver(() => {});

        // Assert
        expect(observer).toBe(mockObserver);
        expect(mockConstructor).toHaveBeenCalledWith(
          expect.any(Function),
          undefined,
        );
      } finally {
        // Cleanup
        (global as any).window = originalWindow;
      }
    });

    it("should return null when IntersectionObserver unavailable", () => {
      // Arrange
      const originalWindow = global.window;
      delete (global as any).window;

      try {
        // Act
        const observer = adapter.safeIntersectionObserver(() => {});

        // Assert
        expect(observer).toBeNull();
      } finally {
        // Cleanup
        (global as any).window = originalWindow;
      }
    });

    it("should handle IntersectionObserver constructor failures", () => {
      // Arrange
      const originalWindow = global.window;
      (global as any).window = {
        IntersectionObserver: jest.fn(() => {
          throw new Error("Constructor failed");
        }),
      };

      try {
        // Act
        const observer = adapter.safeIntersectionObserver(() => {});

        // Assert
        expect(observer).toBeNull();
      } finally {
        // Cleanup
        (global as any).window = originalWindow;
      }
    });
  });

  describe("ResizeObserver safety", () => {
    it("should create ResizeObserver safely on client", () => {
      // Arrange
      const originalWindow = global.window;
      const mockObserver = {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
      const mockConstructor = jest.fn(() => mockObserver);

      (global as any).window = {
        ResizeObserver: mockConstructor,
      };

      try {
        // Act
        const observer = adapter.safeResizeObserver(() => {});

        // Assert
        expect(observer).toBe(mockObserver);
        expect(mockConstructor).toHaveBeenCalledWith(expect.any(Function));
      } finally {
        // Cleanup
        (global as any).window = originalWindow;
      }
    });

    it("should return null when ResizeObserver unavailable", () => {
      // Arrange
      const originalWindow = global.window;
      delete (global as any).window;

      try {
        // Act
        const observer = adapter.safeResizeObserver(() => {});

        // Assert
        expect(observer).toBeNull();
      } finally {
        // Cleanup
        (global as any).window = originalWindow;
      }
    });
  });

  describe("requestAnimationFrame safety", () => {
    it("should schedule animation frames safely on client", () => {
      // Arrange
      const originalWindow = global.window;
      const mockRaf = jest.fn(() => 123);

      (global as any).window = {
        requestAnimationFrame: mockRaf,
      };

      try {
        // Act
        const id = adapter.safeRequestAnimationFrame(() => {});

        // Assert
        expect(id).toBe(123);
        expect(mockRaf).toHaveBeenCalledWith(expect.any(Function));
      } finally {
        // Cleanup
        (global as any).window = originalWindow;
      }
    });

    it("should return null when requestAnimationFrame unavailable", () => {
      // Arrange
      const originalWindow = global.window;
      delete (global as any).window;

      try {
        // Act
        const id = adapter.safeRequestAnimationFrame(() => {});

        // Assert
        expect(id).toBeNull();
      } finally {
        // Cleanup
        (global as any).window = originalWindow;
      }
    });

    it("should cancel animation frames safely", () => {
      // Arrange
      const originalWindow = global.window;
      const mockCancel = jest.fn();

      (global as any).window = {
        cancelAnimationFrame: mockCancel,
      };

      try {
        // Act
        adapter.safeCancelAnimationFrame(123);

        // Assert
        expect(mockCancel).toHaveBeenCalledWith(123);
      } finally {
        // Cleanup
        (global as any).window = originalWindow;
      }
    });

    it("should not cancel when requestAnimationFrame unavailable", () => {
      // Arrange
      const originalWindow = global.window;
      delete (global as any).window;

      try {
        // Act & Assert - Should not throw
        expect(() => adapter.safeCancelAnimationFrame(123)).not.toThrow();
      } finally {
        // Cleanup
        (global as any).window = originalWindow;
      }
    });
  });

  describe("isServerContext and isClientContext", () => {
    it("should return boolean values", () => {
      // Act
      const isServer = adapter.isServerContext();
      const isClient = adapter.isClientContext();

      // Assert
      expect(typeof isServer).toBe("boolean");
      expect(typeof isClient).toBe("boolean");
      expect(isServer).not.toBe(isClient); // Should be opposites
    });

    it("should be consistent across calls", () => {
      // Act
      const server1 = adapter.isServerContext();
      const server2 = adapter.isServerContext();
      const client1 = adapter.isClientContext();
      const client2 = adapter.isClientContext();

      // Assert
      expect(server1).toBe(server2);
      expect(client1).toBe(client2);
    });
  });
});
