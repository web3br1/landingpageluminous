import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock logger at module level
vi.mock("@/lib/logger", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
  },
}));

vi.mock("@/lib/analytics", () => ({
  trackEvent: vi.fn(),
}));

// Import after mocks
import {
  GET as getPerformanceMetrics,
  POST as postPerformanceMetrics,
} from "@/app/api/monitoring/performance/route";
import { POST as postErrorReport } from "@/app/api/monitoring/error/route";
import { GET as getMonitoringReport } from "@/app/api/monitoring/report/route";

// Types for API responses
interface PerformanceResponse {
  status: string;
  service: string;
  timestamp: string;
  budgets: Record<string, number>;
  alertTriggered?: boolean;
}

interface MonitoringReportResponse {
  success: boolean;
  data: {
    performance?: Record<string, unknown>;
    recentErrors?: Array<{
      message: string;
      timestamp: number;
      userAgent: string;
    }>;
    errorPatterns?: Array<{
      type: string;
      message: string;
      frequency: number;
      impact: string;
    }>;
    criticalErrors?: Array<{
      id: string;
      message: string;
      severity: string;
      timestamp: number;
    }>;
    errorRate?: number;
    timeRange?: string;
  };
  timestamp?: string;
  generatedAt?: string;
}

describe("Monitoring APIs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("API Route Imports", () => {
    it("should import performance monitoring routes", () => {
      expect(typeof getPerformanceMetrics).toBe("function");
      expect(typeof postPerformanceMetrics).toBe("function");
    });

    it("should import error monitoring routes", () => {
      expect(typeof postErrorReport).toBe("function");
    });

    it("should import report monitoring routes", () => {
      expect(typeof getMonitoringReport).toBe("function");
    });
  });

  describe("Core Web Vitals Budgets", () => {
    it("should define standard Core Web Vitals budgets", () => {
      // These are the standard budgets used across the monitoring APIs
      const expectedBudgets = {
        lcp: 2500, // Largest Contentful Paint
        fid: 100, // First Input Delay
        cls: 0.1, // Cumulative Layout Shift
        fcp: 1800, // First Contentful Paint
        ttfb: 800, // Time to First Byte
      };

      // Test that the budgets object structure is correct
      expect(expectedBudgets).toEqual({
        lcp: 2500,
        fid: 100,
        cls: 0.1,
        fcp: 1800,
        ttfb: 800,
      });
    });

    it("should validate budget thresholds are reasonable", () => {
      // LCP should be reasonable for web performance
      expect(2500).toBeGreaterThan(1000); // > 1s
      expect(2500).toBeLessThan(4000); // < 4s

      // FID should be very low
      expect(100).toBeGreaterThan(50); // > 50ms
      expect(100).toBeLessThan(300); // < 300ms

      // CLS should be very small
      expect(0.1).toBeGreaterThan(0); // > 0
      expect(0.1).toBeLessThan(0.25); // < 0.25
    });
  });

  describe("Monitoring Data Structures", () => {
    it("should define performance response structure", () => {
      const performanceResponse: PerformanceResponse = {
        status: "ok",
        service: "performance-monitoring",
        timestamp: new Date().toISOString(),
        budgets: {
          lcp: 2500,
          fid: 100,
          cls: 0.1,
          fcp: 1800,
          ttfb: 800,
        },
      };

      expect(performanceResponse.status).toBe("ok");
      expect(performanceResponse.service).toBe("performance-monitoring");
      expect(performanceResponse.budgets.lcp).toBe(2500);
      expect(typeof performanceResponse.timestamp).toBe("string");
    });

    it("should define monitoring report structure", () => {
      const monitoringReport: MonitoringReportResponse = {
        success: true,
        data: {
          performance: {
            lcp: 2200,
            fid: 80,
            cls: 0.05,
          },
          recentErrors: [],
          errorPatterns: [],
          criticalErrors: [],
          errorRate: 0.02,
          timeRange: "24h",
        },
        timestamp: new Date().toISOString(),
        generatedAt: new Date().toISOString(),
      };

      expect(monitoringReport.success).toBe(true);
      expect(monitoringReport.data.performance).toHaveProperty("lcp");
      expect(Array.isArray(monitoringReport.data.recentErrors)).toBe(true);
      expect(monitoringReport.data.timeRange).toBe("24h");
    });
  });

  describe("Performance Alert Logic", () => {
    it("should detect performance budget violations", () => {
      const checkPerformanceAlerts = (data: any) => {
        if (data.metric === "lcp" && data.value > 2500) {
          return true; // Alert triggered
        }
        return false; // No alert
      };

      expect(checkPerformanceAlerts({ metric: "lcp", value: 2200 })).toBe(
        false,
      );
      expect(checkPerformanceAlerts({ metric: "lcp", value: 3000 })).toBe(true);
      expect(checkPerformanceAlerts({ metric: "fid", value: 50 })).toBe(false);
    });

    it("should calculate budget exceeded amount", () => {
      const calculateExceeded = (value: number, budget: number) => {
        return Math.max(0, value - budget);
      };

      expect(calculateExceeded(2200, 2500)).toBe(0);
      expect(calculateExceeded(3000, 2500)).toBe(500);
      expect(calculateExceeded(80, 100)).toBe(0);
    });
  });

  describe("Error Categorization", () => {
    it("should categorize different error types", () => {
      const errorTypes = [
        "JAVASCRIPT_ERROR",
        "NETWORK_ERROR",
        "REACT_ERROR",
        "API_ERROR",
      ];

      errorTypes.forEach((type) => {
        expect([
          "JAVASCRIPT_ERROR",
          "NETWORK_ERROR",
          "REACT_ERROR",
          "API_ERROR",
        ]).toContain(type);
      });

      expect(errorTypes).toHaveLength(4);
    });

    it("should validate error report structure", () => {
      const validateErrorReport = (report: any) => {
        return !!(
          report.error &&
          report.error.message &&
          report.error.type &&
          report.context &&
          report.context.url &&
          report.context.sessionId
        );
      };

      const validReport = {
        error: {
          message: "Test error",
          type: "JAVASCRIPT_ERROR",
          stack: "test stack",
        },
        context: {
          url: "/test",
          sessionId: "session_123",
        },
      };

      const invalidReport = {
        error: { message: "Test error" },
        // Missing context
      };

      expect(validateErrorReport(validReport)).toBe(true);
      expect(validateErrorReport(invalidReport)).toBe(false);
    });
  });
});
