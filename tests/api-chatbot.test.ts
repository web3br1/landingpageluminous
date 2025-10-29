import { describe, it, expect, jest, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock external dependencies - now handled within vi.mock block

vi.mock("next/server", async () => {
  const actual = await vi.importActual("next/server");

  const mockResponse = {
    json: vi.fn((data, options) => ({
      data,
      options: options || {},
      status: options?.status || 200,
      headers: options?.headers || {},
    })),
    status: vi.fn((code) => ({ status: code, headers: {} })),
  };

  const MockNextRequest = class {
    url: string;
    method: string;
    headers: Map<string, string>;
    private body?: string;

    constructor(
      url: string,
      options?: {
        method?: string;
        headers?: Record<string, string>;
        body?: string;
      },
    ) {
      if (!url) throw new Error("URL is required for NextRequest");

      this.url = url;
      this.method = options?.method || "GET";
      this.headers = new Map(Object.entries(options?.headers || {}));
      this.body = options?.body;
    }

    async json() {
      if (
        this.body &&
        typeof this.body === "string" &&
        this.body === "invalid json"
      ) {
        throw new SyntaxError(
          "Unexpected token 'i', \"invalid json\" is not valid JSON",
        );
      }
      if (!this.body) return {};
      try {
        return JSON.parse(this.body);
      } catch (e) {
        throw e;
      }
    }

    async text() {
      return this.body || "";
    }

    async formData() {
      return new FormData();
    }

    async arrayBuffer() {
      return new ArrayBuffer(0);
    }

    async blob() {
      return new Blob();
    }
  };

  return {
    ...actual,
    NextResponse: mockResponse,
    NextRequest: MockNextRequest,
  };
});

// Mock chatbot engine
const mockProcessMessage = vi.fn() as any;
const mockAnalyzeConversation = vi.fn() as any;
vi.mock("@/lib/chatbot/engine", () => ({
  chatbotEngine: {
    processMessage: (...args: unknown[]) => mockProcessMessage(...args),
    analyzeConversation: (...args: unknown[]) =>
      mockAnalyzeConversation(...args),
  },
}));

// Mock analytics
const mockTrack = vi.fn();
vi.mock("@/lib/analytics-core", () => ({
  analytics: {
    track: (...args: unknown[]) => mockTrack(...args),
    trackExperiment: (...args: unknown[]) => mockTrack(...args),
  },
}));

// Mock logger
const mockLogger = {
  info: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};
vi.mock("@/lib/logger", () => mockLogger);

// Import API after mocks
import { POST } from "@/app/api/chatbot/route";

describe("Chatbot API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (mockProcessMessage as any).mockReset();
    (mockAnalyzeConversation as any).mockReset();
    mockTrack.mockReset();
  });

  describe("POST /api/chatbot", () => {
    it("handles valid chat request successfully", async () => {
      const mockRequestBody = {
        message: "Olá, como funciona o produto?",
        sessionId: "session_123",
        context: {
          page: "/",
          segments: ["new"],
          conversation_history: [],
        },
      };

      (mockProcessMessage as any).mockResolvedValue({
        intent: "product_info",
        confidence: 0.92,
        type: "text",
        content: "Olá! Nosso produto ajuda a automatizar relatórios.",
        metadata: {},
      });
      (mockAnalyzeConversation as any).mockReturnValue({
        engagement_score: 0.8,
        conversion_potential: 0.6,
        topics_discussed: ["preço"],
      });

      const request = new NextRequest("http://localhost/api/chatbot", {
        method: "POST",
        body: JSON.stringify(mockRequestBody),
        headers: {
          "content-type": "application/json",
        },
      });

      const response = await POST(request);

      // Should track generation and analysis
      expect(mockTrack).toHaveBeenCalledWith(
        "chatbot_response_generated",
        expect.objectContaining({ intent: "product_info", confidence: 0.92 }),
      );
      expect(mockTrack).toHaveBeenCalledWith(
        "chatbot_conversation_analysis",
        expect.objectContaining({ engagement_score: 0.8 }),
      );

      // Should return enhanced response
      expect(response.data).toHaveProperty("metadata");
      expect(response.data.metadata).toHaveProperty("processing_time");
    });

    it("returns error for missing message", async () => {
      const request = new NextRequest("http://localhost/api/chatbot", {
        method: "POST",
        body: JSON.stringify({}),
        headers: {
          "content-type": "application/json",
        },
      });

      const response = await POST(request);

      expect(response.options?.status).toBe(400);
      expect(response.data.error).toBe("Invalid message");
    });

    it("handles engine errors gracefully", async () => {
      const mockRequestBody = {
        message: "Test message",
        sessionId: "session_123",
        context: { page: "/", segments: [], conversation_history: [] },
      };

      (mockProcessMessage as any).mockRejectedValue(new Error("engine error"));

      const request = new NextRequest("http://localhost/api/chatbot", {
        method: "POST",
        body: JSON.stringify(mockRequestBody),
        headers: {
          "content-type": "application/json",
        },
      });

      const response = await POST(request);

      expect(mockTrack).toHaveBeenCalledWith(
        "chatbot_error",
        expect.objectContaining({ error_type: "Error" }),
      );

      expect(response.options?.status).toBe(500);
    });

    it("validates message length limits", async () => {
      const longMessage = "a".repeat(1001); // Exceeds limit (1000)

      const request = new NextRequest("http://localhost/api/chatbot", {
        method: "POST",
        body: JSON.stringify({
          message: longMessage,
          sessionId: "session_123",
        }),
        headers: {
          "content-type": "application/json",
        },
      });

      const response = await POST(request);
      expect(response.options?.status).toBe(400);
    });

    it("handles malformed JSON", async () => {
      const request = new NextRequest("http://localhost/api/chatbot", {
        method: "POST",
        body: "invalid json",
        headers: {
          "content-type": "application/json",
        },
      });

      const response = await POST(request);

      // JSON parse error propagates to catch → 500
      expect(response.options?.status).toBe(500);
    });

    it("includes session context in analytics enrichment", async () => {
      const mockRequestBody = {
        message: "Como funciona?",
        sessionId: "session_456",
        context: ["Usuário já viu a página de preços"],
      };

      (mockProcessMessage as any).mockResolvedValue({
        intent: "info",
        confidence: 0.8,
        type: "text",
        content: "ok",
        metadata: {},
      });

      const request = new NextRequest("http://localhost/api/chatbot", {
        method: "POST",
        body: JSON.stringify(mockRequestBody),
        headers: {
          "content-type": "application/json",
        },
      });

      await POST(request);

      expect(mockTrack).toHaveBeenCalledWith(
        "chatbot_response_generated",
        expect.objectContaining({
          message_length: mockRequestBody.message.length,
        }),
      );
    });
  });

  // Unit tests for MockNextRequest
  describe("MockNextRequest", () => {
    it("should create instance correctly with minimal options", () => {
      const request = new NextRequest("http://test.com");
      expect(request.url).toBe("http://test.com");
      expect(request.method).toBe("GET");
    });

    it("should create instance with custom options", () => {
      const request = new NextRequest("http://test.com", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: '{"test": true}',
      });
      expect(request.url).toBe("http://test.com");
      expect(request.method).toBe("POST");
    });

    it("should throw error for missing URL", () => {
      expect(() => new NextRequest("")).toThrow(
        "URL is required for NextRequest",
      );
    });

    it("should parse valid JSON in json() method", async () => {
      const request = new NextRequest("http://test.com", {
        body: '{"message": "hello"}',
      });
      const result = await request.json();
      expect(result).toEqual({ message: "hello" });
    });

    it("should handle empty body in json() method", async () => {
      const request = new NextRequest("http://test.com");
      const result = await request.json();
      expect(result).toEqual({});
    });

    it('should throw specific error for "invalid json" string', async () => {
      const request = new NextRequest("http://test.com", {
        body: "invalid json",
      });
      await expect(request.json()).rejects.toThrow(
        "Unexpected token 'i', \"invalid json\" is not valid JSON",
      );
    });
  });
});
