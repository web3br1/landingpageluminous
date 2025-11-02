// Error types and utilities that can be imported by .ts files
// Extracted from error-handling.tsx to avoid JSX import issues

// Tipos de erro da aplicação
export enum ErrorType {
  NETWORK = "NETWORK",
  VALIDATION = "VALIDATION",
  AUTHENTICATION = "AUTHENTICATION",
  AUTHORIZATION = "AUTHORIZATION",
  BUSINESS_LOGIC = "BUSINESS_LOGIC",
  EXTERNAL_SERVICE = "EXTERNAL_SERVICE",
  WEBPACK_RUNTIME = "WEBPACK_RUNTIME",
  MODULE_LOADING = "MODULE_LOADING",
  FACTORY_ERROR = "FACTORY_ERROR",
  PERFORMANCE = "PERFORMANCE",
  UNKNOWN = "UNKNOWN",
}

// Classe de erro customizada
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly code?: string;
  public readonly context?: Record<string, unknown>;
  public readonly timestamp: Date;
  public readonly userId?: string;
  public readonly sessionId?: string;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    code?: string,
    context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
    this.type = type;
    this.code = code;
    this.context = context;
    this.timestamp = new Date();

    // Mantém o stack trace adequado
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  // Método para serialização
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }
}

// Função helper para criar erros
export function createError(
  message: string,
  type: ErrorType = ErrorType.UNKNOWN,
  code?: string,
  context?: Record<string, unknown>,
): AppError {
  return new AppError(message, type, code, context);
}

// Type guards
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isNetworkError(error: AppError): boolean {
  return error.type === ErrorType.NETWORK;
}

export function isValidationError(error: AppError): boolean {
  return error.type === ErrorType.VALIDATION;
}

export function isAuthError(error: AppError): boolean {
  return (
    error.type === ErrorType.AUTHENTICATION ||
    error.type === ErrorType.AUTHORIZATION
  );
}
