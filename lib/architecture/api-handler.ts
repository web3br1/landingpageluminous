/**
 * API Handler Utilities - Standardized API responses and error handling
 *
 * Eliminates code duplication in API routes by providing consistent patterns
 * for success responses, error handling, and validation.
 */

import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";

// ===== RESPONSE TYPES =====

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  timestamp?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: unknown;
  timestamp: string;
  code?: string;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ===== HTTP STATUS CODES =====

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// ===== RESPONSE BUILDERS =====

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T = unknown>(
  data: T,
  options: {
    message?: string;
    status?: number;
    headers?: Record<string, string>;
  } = {}
): NextResponse<ApiSuccessResponse<T>> {
  const { message, status = HTTP_STATUS.OK, headers = {} } = options;

  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    ...(message && { message }),
  };

  return NextResponse.json(response, { status, headers });
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: string,
  message: string,
  options: {
    status?: number;
    details?: unknown;
    code?: string;
    headers?: Record<string, string>;
  } = {}
): NextResponse<ApiErrorResponse> {
  const { status = HTTP_STATUS.INTERNAL_SERVER_ERROR, details, code, headers = {} } = options;

  const response: ApiErrorResponse = {
    success: false,
    error,
    message,
    timestamp: new Date().toISOString(),
    ...(details && { details }),
    ...(code && { code }),
  };

  return NextResponse.json(response, { status, headers });
}

// ===== VALIDATION HELPERS =====

/**
 * Safely parse request body with Zod validation
 */
export async function parseRequestBody<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<{ success: true; data: T } | { success: false; error: NextResponse }> {
  try {
    const body = await request.json();
    const validatedData = schema.parse(body);

    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: createErrorResponse(
          "VALIDATION_ERROR",
          "Invalid request data",
          {
            status: HTTP_STATUS.BAD_REQUEST,
            details: error.issues,
            code: "VALIDATION_FAILED",
          }
        ),
      };
    }

    return {
      success: false,
      error: createErrorResponse(
        "PARSE_ERROR",
        "Unable to parse request body",
        { status: HTTP_STATUS.BAD_REQUEST }
      ),
    };
  }
}

/**
 * Safely parse URL search params with Zod validation
 */
export function parseSearchParams<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: NextResponse } {
  try {
    // Convert search params to object
    const params: Record<string, unknown> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const validatedData = schema.parse(params);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false,
        error: createErrorResponse(
          "VALIDATION_ERROR",
          "Invalid query parameters",
          {
            status: HTTP_STATUS.BAD_REQUEST,
            details: error.issues,
            code: "INVALID_PARAMS",
          }
        ),
      };
    }

    return {
      success: false,
      error: createErrorResponse(
        "PARSE_ERROR",
        "Unable to parse query parameters",
        { status: HTTP_STATUS.BAD_REQUEST }
      ),
    };
  }
}

// ===== RATE LIMITING HELPERS =====

/**
 * Create rate limit exceeded response
 */
export function createRateLimitResponse(
  retryAfter: number,
  limit: number,
  remaining: number = 0
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    "RATE_LIMIT_EXCEEDED",
    `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
    {
      status: HTTP_STATUS.TOO_MANY_REQUESTS,
      code: "RATE_LIMITED",
      headers: {
        "Retry-After": retryAfter.toString(),
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": Math.floor(Date.now() / 1000 + retryAfter).toString(),
      },
    }
  );
}

// ===== ERROR HANDLING WRAPPER =====

/**
 * Wrap API handler with standardized error handling
 */
export function withApiHandler<T extends unknown[], R>(
  handler: (...args: T) => Promise<NextResponse>,
  options: {
    errorMessage?: string;
    logErrors?: boolean;
  } = {}
) {
  const { errorMessage = "An unexpected error occurred", logErrors = true } = options;

  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      if (logErrors) {
        console.error("API Handler Error:", error);
      }

      // Don't expose internal error details in production
      const isDevelopment = process.env.NODE_ENV === "development";

      return createErrorResponse(
        "INTERNAL_ERROR",
        errorMessage,
        {
          status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
          details: isDevelopment ? error : undefined,
          code: "INTERNAL_ERROR",
        }
      );
    }
  };
}

// ===== CORS HEADERS =====

/**
 * Standard CORS headers for API responses
 */
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
  "Access-Control-Max-Age": "86400", // 24 hours
} as const;

/**
 * Create OPTIONS response for CORS preflight requests
 */
export function createCorsOptionsResponse(): NextResponse {
  return new NextResponse(null, {
    status: HTTP_STATUS.NO_CONTENT,
    headers: CORS_HEADERS,
  });
}

// ===== PAGINATION HELPERS =====

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Create paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  options: {
    page: number;
    limit: number;
    total: number;
    baseUrl?: string;
  }
): NextResponse<ApiSuccessResponse<PaginatedResponse<T>>> {
  const { page, limit, total, baseUrl } = options;

  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  const pagination: PaginationMeta = {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
  };

  // Add pagination links if baseUrl provided
  const headers: Record<string, string> = {};
  if (baseUrl) {
    const links: string[] = [];

    if (hasPrev) {
      links.push(`<${baseUrl}?page=${page - 1}&limit=${limit}>; rel="prev"`);
    }

    if (hasNext) {
      links.push(`<${baseUrl}?page=${page + 1}&limit=${limit}>; rel="next"`);
    }

    links.push(`<${baseUrl}?page=1&limit=${limit}>; rel="first"`);
    links.push(`<${baseUrl}?page=${totalPages}&limit=${limit}>; rel="last"`);

    headers.Link = links.join(", ");
  }

  return createSuccessResponse(
    { data, pagination },
    {
      headers: {
        "X-Total-Count": total.toString(),
        "X-Total-Pages": totalPages.toString(),
        "X-Current-Page": page.toString(),
        "X-Per-Page": limit.toString(),
        ...headers,
      },
    }
  );
}

// ===== COMMON SCHEMAS =====

/**
 * Pagination query parameters schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type PaginationParams = z.infer<typeof paginationSchema>;
