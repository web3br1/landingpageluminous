// Simple Result type implementation to replace @shared/core
// Following Railway Oriented Programming pattern

export class AppError extends Error {
  public readonly type: string;
  public readonly code: string;
  public readonly status: number;
  public readonly traceId?: string;

  constructor(
    type: string,
    message: string,
    code: string,
    status: number = 500,
    traceId?: string
  ) {
    super(message);
    this.name = "AppError";
    this.type = type;
    this.code = code;
    this.status = status;
    this.traceId = traceId;
  }

  static isAppError(error: unknown): error is AppError {
    return error instanceof AppError;
  }
}

export interface Result<T, E = AppError> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: E;
}

export const Result = {
  ok: <T>(data: T): Result<T> => ({
    success: true,
    data,
  }),

  err: <E = AppError>(error: E): Result<never, E> => ({
    success: false,
    error,
  }),

  isOk: <T, E>(result: Result<T, E>): result is Result<T, E> & { success: true } => {
    return result.success;
  },

  isErr: <T, E>(result: Result<T, E>): result is Result<T, E> & { success: false } => {
    return !result.success;
  },
};

// Helper functions for common patterns
export const isOk = Result.isOk;
export const isErr = Result.isErr;
