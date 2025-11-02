import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createSuccessResponse,
  createErrorResponse,
  parseRequestBody,
  HTTP_STATUS,
} from "../../../../lib/architecture/api-handler";

const reportSchema = z.object({
  action: z.string().min(1),
  identifier: z.string().min(1),
  success: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).optional(),
  timestamp: z.number().optional(),
});

// Simple analytics storage (in production, use proper analytics/logging system)
const rateLimitAnalytics: Array<{
  action: string;
  identifier: string;
  success: boolean;
  timestamp: number;
  metadata?: Record<string, unknown>;
}> = [];

export async function POST(request: NextRequest) {
  // Parse and validate request body
  const parseResult = await parseRequestBody(request, reportSchema);
  if (!parseResult.success) {
    return (parseResult as { success: false; error: NextResponse }).error;
  }

  const validatedData = parseResult.data;

    // Store analytics data (in production, send to analytics service)
    rateLimitAnalytics.push({
      ...validatedData,
      timestamp: validatedData.timestamp || Date.now(),
    });

    // Clean old analytics data (keep last 1000 entries)
    if (rateLimitAnalytics.length > 1000) {
      rateLimitAnalytics.splice(0, rateLimitAnalytics.length - 1000);
    }

    // In production, you might want to:
    // - Send to analytics service (Mixpanel, Amplitude, etc.)
    // - Log to monitoring system (DataDog, New Relic, etc.)
    // - Store in database for analysis

    console.log("Rate limit usage reported:", {
      action: validatedData.action,
      identifier: validatedData.identifier,
      success: validatedData.success,
      timestamp: validatedData.timestamp,
    });

    return createSuccessResponse({ success: true });
}

// GET endpoint to retrieve analytics (for debugging/admin purposes)
export async function GET() {
  try {
    // Calculate some basic analytics
    const totalReports = rateLimitAnalytics.length;
    const successfulReports = rateLimitAnalytics.filter(
      (r) => r.success,
    ).length;
    const failedReports = totalReports - successfulReports;

    const actionStats = rateLimitAnalytics.reduce(
      (acc, report) => {
        acc[report.action] = (acc[report.action] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return createSuccessResponse({
      totalReports,
      successfulReports,
      failedReports,
      successRate:
        totalReports > 0 ? (successfulReports / totalReports) * 100 : 0,
      actionStats,
      recentReports: rateLimitAnalytics.slice(-10), // Last 10 reports
    });
  } catch (error) {
    console.error("Rate limit analytics error:", error);
    return createErrorResponse(
      "INTERNAL_ERROR",
      "An unexpected error occurred",
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    );
  }
}
