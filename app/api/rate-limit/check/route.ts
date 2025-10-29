import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Rate limiting storage (in production, use Redis or similar)
const rateLimitStore = new Map<
  string,
  {
    count: number;
    resetTime: number;
    windowStart: number;
  }
>();

// Configuration
const DEFAULT_LIMIT = 5;
const DEFAULT_WINDOW_MS = 60000; // 1 minute
const DEFAULT_BLOCK_DURATION_MS = 300000; // 5 minutes

const requestSchema = z.object({
  action: z.string().min(1),
  identifier: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, identifier } = requestSchema.parse(body);

    // Create unique key for this action + identifier
    const key = `${action}:${identifier}`;
    const now = Date.now();
    const windowMs = DEFAULT_WINDOW_MS;
    const limit = DEFAULT_LIMIT;

    // Get or create rate limit data
    let rateData = rateLimitStore.get(key);

    if (!rateData || now > rateData.resetTime) {
      // Reset window
      rateData = {
        count: 0,
        resetTime: now + windowMs,
        windowStart: now,
      };
    }

    const remaining = Math.max(0, limit - rateData.count);

    if (rateData.count >= limit) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((rateData.resetTime - now) / 1000);

      return NextResponse.json(
        {
          allowed: false,
          remaining: 0,
          resetTime: Math.floor(rateData.resetTime / 1000),
          retryAfter,
          limit,
          windowMs,
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": Math.floor(
              rateData.resetTime / 1000,
            ).toString(),
          },
        },
      );
    }

    // Update count
    rateData.count++;
    rateLimitStore.set(key, rateData);

    // Check if this would exceed limit on next request
    const wouldExceed = rateData.count >= limit;

    return NextResponse.json(
      {
        allowed: true,
        remaining: Math.max(0, limit - rateData.count),
        resetTime: Math.floor(rateData.resetTime / 1000),
        limit,
        windowMs,
        warning: wouldExceed ? "Approaching rate limit" : undefined,
      },
      {
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": Math.max(
            0,
            limit - rateData.count,
          ).toString(),
          "X-RateLimit-Reset": Math.floor(rateData.resetTime / 1000).toString(),
        },
      },
    );
  } catch (error) {
    console.error("Rate limit check error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
