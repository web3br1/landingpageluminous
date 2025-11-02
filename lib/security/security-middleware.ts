import { NextRequest, NextResponse } from "next/server";
import {
  InputSanitizer,
  SecurityHeaders,
  SecureErrorHandler,
} from "./input-sanitizer";

// ===== RATE LIMITING =====

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private storage = new Map<string, RateLimitEntry>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        const now = Date.now();
        for (const [key, entry] of this.storage.entries()) {
          if (now > entry.resetTime) {
            this.storage.delete(key);
          }
        }
      },
      5 * 60 * 1000,
    );
  }

  check(identifier: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const key = `${identifier}_${Math.floor(now / windowMs)}`;

    const entry = this.storage.get(key) || {
      count: 0,
      resetTime: now + windowMs,
    };

    if (now > entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + windowMs;
    }

    entry.count++;
    this.storage.set(key, entry);

    return entry.count <= maxRequests;
  }

  getRemainingRequests(identifier: string, windowMs: number): number {
    const now = Date.now();
    const key = `${identifier}_${Math.floor(now / windowMs)}`;
    const entry = this.storage.get(key);

    if (!entry || now > entry.resetTime) {
      return 100; // Default limit
    }

    return Math.max(0, 100 - entry.count);
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter();

// ===== SECURITY MIDDLEWARE =====

export interface SecurityMiddlewareOptions {
  rateLimit?: {
    maxRequests: number;
    windowMs: number;
  };
  allowedOrigins?: string[];
  enableSanitization?: boolean;
  enableSecurityHeaders?: boolean;
  enableLogging?: boolean;
}

export function createSecurityMiddleware(
  options: SecurityMiddlewareOptions = {},
) {
  const {
    rateLimit = { maxRequests: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes
    allowedOrigins = ["http://localhost:3000", "https://localhost:3000"],
    enableSanitization = true,
    enableSecurityHeaders = true,
    enableLogging = process.env.NODE_ENV === "development",
  } = options;

  return async function securityMiddleware(request: NextRequest) {
    try {
      // 1. Rate Limiting
      const clientIP =
        request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        "unknown";
      const userAgent = request.headers.get("user-agent") || "unknown";
      const identifier = `${clientIP}_${userAgent}`;

      if (
        !rateLimiter.check(
          identifier,
          rateLimit.maxRequests,
          rateLimit.windowMs,
        )
      ) {
        if (enableLogging) {
          console.warn(`[SECURITY] Rate limit exceeded for ${clientIP}`);
        }

        return new NextResponse(
          JSON.stringify({
            error: "Too Many Requests",
            message: "Muitas tentativas. Tente novamente mais tarde.",
            retryAfter: Math.ceil(rateLimit.windowMs / 1000),
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": Math.ceil(rateLimit.windowMs / 1000).toString(),
              "X-RateLimit-Remaining": "0",
            },
          },
        );
      }

      // 2. CORS Validation
      const origin = request.headers.get("origin");
      if (origin && !allowedOrigins.includes(origin)) {
        if (enableLogging) {
          console.warn(`[SECURITY] Invalid origin: ${origin}`);
        }

        return new NextResponse(
          JSON.stringify({
            error: "Forbidden",
            message: "Origem não permitida",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // 3. Input Sanitization
      if (enableSanitization) {
        await sanitizeRequestInput(request);
      }

      // 4. Request Validation
      const validationError = validateRequest(request);
      if (validationError) {
        return new NextResponse(
          JSON.stringify({
            error: "Bad Request",
            message: validationError,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // 5. Security Headers (applied to response)
      const response = NextResponse.next();

      if (enableSecurityHeaders) {
        const securityHeaders = SecurityHeaders.getSecurityHeaders();
        Object.entries(securityHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }

      // Add rate limit headers
      const remaining = rateLimiter.getRemainingRequests(
        identifier,
        rateLimit.windowMs,
      );
      response.headers.set("X-RateLimit-Remaining", remaining.toString());
      response.headers.set(
        "X-RateLimit-Reset",
        (Date.now() + rateLimit.windowMs).toString(),
      );

      // 6. Request Logging
      if (enableLogging) {
        console.log(
          `[SECURITY] Request: ${request.method} ${request.url} from ${clientIP}`,
        );
      }

      return response;
    } catch (error) {
      SecureErrorHandler.logErrorSecurely(error as Error, {
        url: request.url,
        method: request.method,
        ip:
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown",
      });

      return new NextResponse(
        JSON.stringify(
          SecureErrorHandler.createSafeErrorResponse(error as Error),
        ),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  };
}

// ===== HELPER FUNCTIONS =====

async function sanitizeRequestInput(request: NextRequest) {
  // Sanitize query parameters
  const url = new URL(request.url);
  for (const [key, value] of url.searchParams.entries()) {
    const sanitized = InputSanitizer.sanitizeGenericText(value, 500);
    if (sanitized !== value) {
      url.searchParams.set(key, sanitized);
    }
  }

  // Sanitize headers (be careful not to break legitimate headers)
  const headersToSanitize = ["user-agent", "referer", "x-forwarded-for"];
  headersToSanitize.forEach((headerName) => {
    const value = request.headers.get(headerName);
    if (value) {
      const sanitized = SecurityHeaders.sanitizeHeaderValue(value);
      if (sanitized !== value) {
        request.headers.set(headerName, sanitized);
      }
    }
  });

  // For POST/PUT/PATCH requests, we could sanitize body
  // but that would require parsing and re-encoding, which is complex
  // Better to handle this at the API route level
}

function validateRequest(request: NextRequest): string | null {
  // Check for suspicious patterns in URL
  if (InputSanitizer.containsSuspiciousContent(request.url)) {
    return "URL contém conteúdo suspeito";
  }

  // Check for extremely long URLs (potential DoS)
  if (request.url.length > 2048) {
    return "URL muito longa";
  }

  // Check for suspicious headers
  const suspiciousHeaders = ["x-forwarded-for", "user-agent", "referer"];
  for (const header of suspiciousHeaders) {
    const value = request.headers.get(header);
    if (value && InputSanitizer.containsSuspiciousContent(value)) {
      return `Header ${header} contém conteúdo suspeito`;
    }
  }

  // Check request method
  const allowedMethods = [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "HEAD",
    "OPTIONS",
  ];
  if (!allowedMethods.includes(request.method)) {
    return "Método HTTP não permitido";
  }

  return null;
}

// ===== API ROUTE SECURITY WRAPPER =====

export function withSecurity<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse> | NextResponse,
  options: SecurityMiddlewareOptions = {},
) {
  return async (...args: T) => {
    const request = args[0] as NextRequest;

    // Apply security checks
    const securityCheck = await createSecurityMiddleware(options)(request);

    // If security check returns a response (error), return it
    if (securityCheck.status !== 200) {
      return securityCheck;
    }

    // Otherwise, proceed with the handler
    try {
      return await handler(...args);
    } catch (error) {
      SecureErrorHandler.logErrorSecurely(error as Error, {
        url: request.url,
        method: request.method,
      });

      return new NextResponse(
        JSON.stringify(
          SecureErrorHandler.createSafeErrorResponse(error as Error),
        ),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  };
}

// ===== UTILITY FUNCTIONS =====

export function sanitizeApiInput(input: unknown): unknown {
  if (typeof input === "string") {
    return InputSanitizer.sanitizeGenericText(input);
  }

  if (typeof input === "object" && input !== null) {
    const sanitized: unknown = {};

    for (const [key, value] of Object.entries(input)) {
      if (typeof value === "string") {
        sanitized[key] = InputSanitizer.sanitizeGenericText(value);
      } else if (typeof value === "object") {
        sanitized[key] = sanitizeApiInput(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  return input;
}

export function validateApiInput<T>(
  schema: unknown,
  data: unknown,
): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error: unknown) {
    const errorMessage = error.errors?.[0]?.message || "Dados inválidos";
    return { success: false, error: errorMessage };
  }
}

// Cleanup on process exit (only in Node.js environment)
if (typeof process !== "undefined") {
  process.on("exit", () => {
    rateLimiter.destroy();
  });

  process.on("SIGINT", () => {
    rateLimiter.destroy();
    process.exit();
  });

  process.on("SIGTERM", () => {
    rateLimiter.destroy();
    process.exit();
  });
}
