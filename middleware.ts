import { NextRequest, NextResponse } from "next/server";

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100; // requests per window
const RATE_LIMIT_BURST_REQUESTS = 200; // burst limit

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function getClientIP(request: NextRequest): string {
  // Get IP from various headers (prioritize trusted ones)
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const clientIP = request.headers.get("x-client-ip");

  // Use the first available IP, fallback to a default for localhost
  return forwarded?.split(",")[0]?.trim() || realIP || clientIP || "unknown";
}

function isRateLimited(clientIP: string): boolean {
  const now = Date.now();
  const clientData = rateLimitStore.get(clientIP);

  if (!clientData || now > clientData.resetTime) {
    // First request or window expired
    rateLimitStore.set(clientIP, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  // Check burst limit first (more restrictive)
  if (clientData.count >= RATE_LIMIT_BURST_REQUESTS) {
    return true;
  }

  // Check normal rate limit
  if (clientData.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  // Increment counter
  clientData.count++;
  return false;
}

function cleanExpiredEntries() {
  const now = Date.now();
  for (const [ip, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
}

// Clean expired entries every 5 minutes
setInterval(cleanExpiredEntries, 5 * 60 * 1000);

// Types for middleware
interface ScriptAuditData {
  count: number;
  lastSeen: number;
  sources: Set<string>;
}

interface CSRFTokenData {
  token: string;
  expires: number;
}

// Script audit tracking
const scriptAuditStore = new Map<string, ScriptAuditData>();

// CSRF protection token store (in production, use Redis/database)
const csrfTokenStore = new Map<string, CSRFTokenData>();

function auditScriptRequest(request: NextRequest, pathname: string) {
  const referer = request.headers.get("referer");
  const userAgent = request.headers.get("user-agent");
  const scriptKey = pathname;

  // Track script usage for audit
  const existing = scriptAuditStore.get(scriptKey) || {
    count: 0,
    lastSeen: 0,
    sources: new Set(),
  };
  existing.count++;
  existing.lastSeen = Date.now();
  if (referer) existing.sources.add(referer);

  scriptAuditStore.set(scriptKey, existing);

  // Log unusual script requests (development only)
  if (process.env.NODE_ENV === "development" && existing.count > 10) {
    console.warn(
      `[Script Audit] High usage script: ${scriptKey} (${existing.count} requests)`,
    );
  }

  // Detect potential unauthorized scripts
  if (
    pathname.includes(".js") &&
    !pathname.startsWith("/_next/") &&
    !pathname.startsWith("/api/")
  ) {
    console.warn(`[Script Audit] Non-Next.js script detected: ${pathname}`, {
      referer,
      userAgent: userAgent?.substring(0, 100),
      timestamp: new Date().toISOString(),
    });
  }
}


// Clean old script audit entries (older than 24 hours)
function cleanScriptAuditEntries() {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago
  for (const [key, data] of scriptAuditStore.entries()) {
    if (data.lastSeen < cutoff) {
      scriptAuditStore.delete(key);
    }
  }
}

// Clean script audit entries every hour
setInterval(cleanScriptAuditEntries, 60 * 60 * 1000);

// CSRF Token Management
function generateCSRFToken(): string {
  return require("crypto").randomBytes(32).toString("hex");
}

function getOrCreateCSRFToken(sessionId: string): string {
  const existing = csrfTokenStore.get(sessionId);
  const now = Date.now();

  if (existing && existing.expires > now) {
    return existing.token;
  }

  // Create new token (24 hour expiry)
  const token = generateCSRFToken();
  csrfTokenStore.set(sessionId, {
    token,
    expires: now + 24 * 60 * 60 * 1000,
  });

  return token;
}

function validateCSRFToken(sessionId: string, token: string): boolean {
  const stored = csrfTokenStore.get(sessionId);
  if (!stored) return false;

  const now = Date.now();
  if (stored.expires < now) {
    csrfTokenStore.delete(sessionId);
    return false;
  }

  return stored.token === token;
}

// Clean expired CSRF tokens
setInterval(
  () => {
    const now = Date.now();
    for (const [sessionId, data] of csrfTokenStore.entries()) {
      if (data.expires < now) {
        csrfTokenStore.delete(sessionId);
      }
    }
  },
  60 * 60 * 1000,
); // Clean every hour

// Helper functions to reduce complexity
function handleRateLimited(clientIP: string, pathname: string): NextResponse {
  console.warn(`[RateLimit] Blocked request from ${clientIP} to ${pathname}`);

  return new NextResponse(
    JSON.stringify({
      error: "Too many requests",
      message: "Rate limit exceeded. Please try again later.",
      retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": Math.ceil(RATE_LIMIT_WINDOW_MS / 1000).toString(),
        "X-RateLimit-Limit": RATE_LIMIT_MAX_REQUESTS.toString(),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": (Date.now() + RATE_LIMIT_WINDOW_MS).toString(),
      },
    },
  );
}

function addRateLimitHeaders(response: NextResponse, clientIP: string): NextResponse {
  const clientData = rateLimitStore.get(clientIP);
  if (clientData) {
    response.headers.set("X-RateLimit-Limit", RATE_LIMIT_MAX_REQUESTS.toString());
    response.headers.set(
      "X-RateLimit-Remaining",
      Math.max(0, RATE_LIMIT_MAX_REQUESTS - clientData.count).toString(),
    );
    response.headers.set("X-RateLimit-Reset", clientData.resetTime.toString());
  }
  return response;
}

function handleCSRFValidation(request: NextRequest, pathname: string, method: string): Promise<NextResponse> {
  // Skip CSRF for CSP reports (they're automated)
  if (pathname === "/api/csp-report") {
    return Promise.resolve(NextResponse.next());
  }

  // Use session ID from cookie or generate temporary one
  const sessionCookie = request.cookies.get("session-id")?.value;
  const clientIP = getClientIP(request);
  const sessionId = sessionCookie || `temp-${clientIP}-${Date.now()}`;

  // Validate CSRF token
  const csrfToken = getCSRFToken(request);

  if (!csrfToken || !validateCSRFToken(sessionId, csrfToken)) {
    console.warn("[CSRF BLOCKED]", {
      pathname,
      method,
      clientIP,
      hasToken: !!csrfToken,
      timestamp: new Date().toISOString(),
    });

    return Promise.resolve(new NextResponse(
      JSON.stringify({
        error: "CSRF token missing or invalid",
        message: "Security validation failed. Please refresh the page and try again.",
        code: "CSRF_INVALID",
      }),
      {
        status: 403,
        headers: {
          "Content-Type": "application/json",
        },
      },
    ));
  }

  // Add CSRF token to response for future requests
  const response = NextResponse.next();
  const newToken = getOrCreateCSRFToken(sessionId);
  response.cookies.set("csrf-token", newToken, {
    httpOnly: false, // Allow client-side access
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60, // 24 hours
  });

  return Promise.resolve(response);
}

function getCSRFToken(request: NextRequest): string | null {
  return (
    request.headers.get("x-csrf-token") ||
    request.nextUrl.searchParams.get("csrf") ||
    null
  );
}

export async function middleware(request: NextRequest) {
  const url = request.url;
  const method = request.method;
  const pathname = new URL(url).pathname;

  // Script auditing for security monitoring
  if (pathname.endsWith(".js") || pathname.includes("/_next/static/chunks/")) {
    auditScriptRequest(request, pathname);
  }

  // Only log in development
  if (process.env.NODE_ENV === "development") {
    console.log(`[Middleware] ${method} ${pathname}`);
  }

  // Apply rate limiting to API routes
  if (pathname.startsWith("/api/")) {
    const clientIP = getClientIP(request);

    if (isRateLimited(clientIP)) {
      return handleRateLimited(clientIP, pathname);
    }

    // Add rate limit headers to successful requests
    return addRateLimitHeaders(NextResponse.next(), clientIP);
  }

  // CSRF Protection for sensitive routes
  if (
    ["POST", "PUT", "DELETE", "PATCH"].includes(method) &&
    (pathname.startsWith("/api/") ||
      pathname.includes("/contact") ||
      pathname.includes("/lead"))
  ) {
    return await handleCSRFValidation(request, pathname, method);
  }

  // Allow all other requests to pass through
  return NextResponse.next();
}
