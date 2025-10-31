import { NextRequest, NextResponse } from "next/server";
import {
  createSuccessResponse,
  createErrorResponse,
  createRateLimitResponse,
  HTTP_STATUS,
} from "../../../lib/architecture/api-handler";

// Rate limiting for CSP reports (prevent DoS)
const CSP_REPORT_RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // 10 reports per minute per IP
  store: new Map<string, { count: number; resetTime: number }>(),
};

// Clean expired rate limit entries
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of Array.from(CSP_REPORT_RATE_LIMIT.store.entries())) {
    if (now > data.resetTime) {
      CSP_REPORT_RATE_LIMIT.store.delete(key);
    }
  }
}, 30 * 1000); // Clean every 30 seconds

function checkCSPReportRateLimit(clientIP: string): boolean {
  const now = Date.now();
  const key = `csp-report-${clientIP}`;
  const data = CSP_REPORT_RATE_LIMIT.store.get(key);

  if (!data || now > data.resetTime) {
    // First request or window expired
    CSP_REPORT_RATE_LIMIT.store.set(key, {
      count: 1,
      resetTime: now + CSP_REPORT_RATE_LIMIT.windowMs,
    });
    return true; // Allow
  }

  if (data.count >= CSP_REPORT_RATE_LIMIT.maxRequests) {
    return false; // Rate limited
  }

  data.count++;
  return true; // Allow
}

// CSP Violation Report Handler
export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    const clientIP =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      request.headers.get("x-client-ip") ||
      "unknown";

    if (!checkCSPReportRateLimit(clientIP)) {
      console.warn("[CSP REPORT RATE LIMITED]", { clientIP });
      return createRateLimitResponse(60, CSP_REPORT_RATE_LIMIT.maxRequests);
    }

    const report = await request.json();

    // Extract CSP violation details
    const cspReport = report["csp-report"] || report;

    // Sanitize PII from reports
    const sanitizedReport = {
      timestamp: new Date().toISOString(),
      // Remove or anonymize potentially sensitive data
      userAgent:
        request.headers.get("user-agent")?.substring(0, 100) + "..." ||
        "unknown",
      // Anonymize IP (keep first octet for geographic analysis)
      ipPrefix: clientIP.split(".")[0] || "unknown",
      // Keep violation details (not PII)
      "violated-directive": cspReport["violated-directive"],
      "blocked-uri": cspReport["blocked-uri"]?.replace(/[?#].*$/, ""), // Remove query params
      "document-uri": cspReport["document-uri"]?.replace(/[?#].*$/, ""), // Remove query params
      "original-policy":
        cspReport["original-policy"]?.substring(0, 200) + "...", // Truncate
      "source-file": cspReport["source-file"],
      "line-number": cspReport["line-number"],
      "column-number": cspReport["column-number"],
    };

    // Log CSP violations for analysis (PII-filtered)
    console.warn("[CSP VIOLATION]", sanitizedReport);

    // In production, you would store this in a database or send to monitoring service
    if (process.env.NODE_ENV === "production") {
      // Example: Send to monitoring service (replace with your actual service)
      // await sendToMonitoringService('csp-violation', sanitizedReport)
      // Example: Store in database for analysis
      // await db.cspViolations.create({
      //   data: {
      //     ...sanitizedReport,
      //     rawReport: JSON.stringify(report), // Store full report separately for forensics
      //     severity: calculateSeverity(cspReport)
      //   }
      // })
    }

    // Always return 200 OK to CSP reports
    return createSuccessResponse({ status: "ok" });
  } catch (error) {
    console.error("[CSP REPORT ERROR]", error);

    // Still return 200 to avoid browser retries
    return createSuccessResponse({
      status: "error",
      message: "Failed to process CSP report"
    });
  }
}

// GET endpoint to view CSP violations (development only)
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return createErrorResponse(
      "NOT_ALLOWED_IN_PRODUCTION",
      "CSP violations endpoint only available in development",
      { status: HTTP_STATUS.FORBIDDEN }
    );
  }

  try {
    // In a real implementation, this would query a database
    // For now, return mock data structure
    const mockViolations = {
      summary: {
        totalViolations: 0,
        uniqueDirectives: 0,
        lastViolation: null,
        timeRange: "24h",
      },
      violations: [],
      recommendations: [
        "Add missing script hashes to CSP",
        "Consider using nonces instead of hashes for dynamic content",
        "Monitor for new violations in production",
      ],
    };

    return createSuccessResponse(mockViolations);
  } catch (error) {
    console.error("[CSP VIOLATIONS FETCH ERROR]", error);
    return createErrorResponse(
      "FETCH_CSP_VIOLATIONS_FAILED",
      "Failed to fetch CSP violations",
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

// Handle OPTIONS for CORS if needed
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
