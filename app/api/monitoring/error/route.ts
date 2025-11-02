// API endpoint for error monitoring
// Receives error data from ProductionMonitor

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createSuccessResponse,
  createErrorResponse,
  parseRequestBody,
  HTTP_STATUS,
} from "../../../../lib/architecture/api-handler";

// Import logger from shared if available, fallback to console
const logger = {
  error: (message: string, context?: any) => console.error(message, context),
  warn: (message: string, context?: any) => console.warn(message, context),
};

// Schema for error monitoring payload validation
const errorPayloadSchema = z.object({
  error: z.object({
    message: z.string().min(1, "Error message is required"),
    type: z.string().min(1, "Error type is required"),
    code: z.string().optional(),
    stack: z.string().optional(),
    details: z.unknown().optional(),
  }),
  context: z.object({
    url: z.string().min(1, "URL is required"),
    userAgent: z.string().min(1, "User agent is required"),
    timestamp: z.number().min(0, "Timestamp must be a positive number"),
    sessionId: z.string().min(1, "Session ID is required"),
    userId: z.string().optional(),
    viewport: z.object({
      width: z.number().min(1),
      height: z.number().min(1),
    }),
    connection: z.object({
      effectiveType: z.string().min(1),
      downlink: z.number().min(0),
    }),
    memory: z.object({
      used: z.number().min(0),
      total: z.number().min(0),
      limit: z.number().min(0),
    }).optional(),
    experiments: z.array(z.string()).optional().default([]),
    sections: z.array(z.string()).optional().default([]),
  }),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const parseResult = await parseRequestBody(request, errorPayloadSchema);
    if (!parseResult.success) {
      return (parseResult as { success: false; error: NextResponse }).error;
    }

    const payload = parseResult.data;

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
    return createSuccessResponse({
      success: true,
      reportId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("Error processing monitoring payload", {
      error: error instanceof Error ? error.message : String(error),
    });
    return createErrorResponse(
      "MONITORING_ERROR_PROCESSING",
      "Failed to process error report",
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}

// Health check endpoint
export async function GET() {
  return createSuccessResponse({
    status: "ok",
    service: "error-monitoring",
    timestamp: new Date().toISOString(),
  });
}
