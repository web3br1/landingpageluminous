// API endpoint for error monitoring
// Receives error data from ProductionMonitor

import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

interface ErrorPayload {
  error: {
    message: string;
    type: string;
    code?: string;
    stack?: string;
    details?: any;
  };
  context: {
    url: string;
    userAgent: string;
    timestamp: number;
    sessionId: string;
    userId?: string;
    viewport: { width: number; height: number };
    connection: { effectiveType: string; downlink: number };
    memory?: { used: number; total: number; limit: number };
    experiments?: string[];
    sections?: string[];
  };
}

export async function POST(request: NextRequest) {
  try {
    // Handle malformed JSON gracefully
    let payload: ErrorPayload;
    try {
      payload = await request.json();
    } catch (jsonError) {
      logger.error("Invalid JSON in error report payload", {
        error: jsonError instanceof Error ? jsonError.message : "Invalid JSON",
      });
      return NextResponse.json(
        { error: "Invalid JSON format" },
        {
          status: 400,
          headers: {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
          },
        },
      );
    }

    // Validate required fields
    const validationErrors: string[] = [];

    if (!payload.error) {
      validationErrors.push("error field is required");
    } else {
      if (!payload.error.message || typeof payload.error.message !== "string") {
        validationErrors.push("error.message must be a non-empty string");
      }
      if (!payload.error.type || typeof payload.error.type !== "string") {
        validationErrors.push("error.type must be a valid string");
      }
    }

    if (!payload.context) {
      validationErrors.push("context field is required");
    } else {
      if (!payload.context.url || typeof payload.context.url !== "string") {
        validationErrors.push("context.url must be a valid string");
      }
      if (
        !payload.context.userAgent ||
        typeof payload.context.userAgent !== "string"
      ) {
        validationErrors.push("context.userAgent must be a valid string");
      }
      if (
        !payload.context.sessionId ||
        typeof payload.context.sessionId !== "string"
      ) {
        validationErrors.push("context.sessionId must be a valid string");
      }
      if (
        !payload.context.timestamp ||
        typeof payload.context.timestamp !== "number"
      ) {
        validationErrors.push("context.timestamp must be a valid number");
      }
      if (
        !payload.context.viewport ||
        typeof payload.context.viewport !== "object"
      ) {
        validationErrors.push(
          "context.viewport must be an object with width and height",
        );
      }
      if (
        !payload.context.connection ||
        typeof payload.context.connection !== "object"
      ) {
        validationErrors.push(
          "context.connection must be an object with effectiveType and downlink",
        );
      }
    }

    if (validationErrors.length > 0) {
      logger.warn("Invalid error report format", {
        validationErrors,
        receivedPayload: payload,
      });
      return NextResponse.json(
        {
          error: "Invalid error report format",
          details: validationErrors,
        },
        {
          status: 400,
          headers: {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
          },
        },
      );
    }

    // Log error with structured data
    logger.error("Client Error Reported", {
      error: {
        message: payload.error.message,
        type: payload.error.type,
        code: payload.error.code,
        stack: payload.error.stack,
        details: payload.error.details,
      },
      context: {
        url: payload.context.url,
        userAgent: payload.context.userAgent,
        sessionId: payload.context.sessionId,
        timestamp: new Date(payload.context.timestamp).toISOString(),
        viewport: payload.context.viewport,
        connection: payload.context.connection,
        memory: payload.context.memory,
        experiments: payload.context.experiments,
        sections: payload.context.sections,
      },
      source: "production_monitor",
    });

    // Here you would typically send to your monitoring service
    // Examples: Sentry, LogRocket, DataDog, etc.

    // For now, we'll just acknowledge receipt
    return NextResponse.json(
      {
        success: true,
        reportId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
          "X-XSS-Protection": "1; mode=block",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
      },
    );
  } catch (error) {
    logger.error("Error processing monitoring payload", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to process error report" },
      {
        status: 500,
        headers: {
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
        },
      },
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "error-monitoring",
    timestamp: new Date().toISOString(),
  });
}
