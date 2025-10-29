// Shared Errors Module
// RFC7807 Problem+JSON error handling

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "SERVICE_UNAVAILABLE"
  | "TIMEOUT"
  | "CONFIG_ERROR";

export interface AppError {
  name: string;
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  cause?: Error;
}

export function createAppError(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>,
  cause?: Error,
): AppError {
  return {
    name: "AppError",
    code,
    message,
    details,
    cause,
  };
}

// Common error constructors
export const errors = {
  validation: (message: string, details?: Record<string, unknown>) =>
    createAppError("VALIDATION_ERROR", message, details),

  notFound: (resource: string) =>
    createAppError("NOT_FOUND", `${resource} not found`),

  unauthorized: (message = "Unauthorized access") =>
    createAppError("UNAUTHORIZED", message),

  forbidden: (message = "Forbidden access") =>
    createAppError("FORBIDDEN", message),

  conflict: (message: string, details?: Record<string, unknown>) =>
    createAppError("CONFLICT", message, details),

  rateLimited: (message = "Too many requests") =>
    createAppError("RATE_LIMITED", message),

  internal: (message = "Internal server error", cause?: Error) =>
    createAppError("INTERNAL_ERROR", message, undefined, cause),

  serviceUnavailable: (service: string) =>
    createAppError("SERVICE_UNAVAILABLE", `${service} is unavailable`),

  timeout: (operation: string) =>
    createAppError("TIMEOUT", `${operation} timed out`),
};

export default AppError;
