import React from "react";
import { notify } from "./notifications";

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
  public readonly statusCode?: number;
  public readonly details?: unknown;
  public readonly retryable: boolean;
  public readonly cause?: Error;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    options: {
      code?: string;
      statusCode?: number;
      details?: unknown;
      retryable?: boolean;
      cause?: Error;
    } = {},
  ) {
    super(message);
    this.name = "AppError";
    this.type = type;
    this.code = options.code;
    this.statusCode = options.statusCode;
    this.details = options.details;
    this.retryable = options.retryable ?? false;

    if (options.cause) {
      this.cause = options.cause;
    }
  }
}

// Funções para criar erros específicos
export const createError = {
  network: (message: string, details?: unknown) =>
    new AppError(message, ErrorType.NETWORK, { retryable: true, details }),

  validation: (message: string, details?: unknown) =>
    new AppError(message, ErrorType.VALIDATION, { details }),

  authentication: (message: string = "Falha na autenticação") =>
    new AppError(message, ErrorType.AUTHENTICATION),

  authorization: (message: string = "Acesso negado") =>
    new AppError(message, ErrorType.AUTHORIZATION),

  business: (message: string, code?: string, details?: unknown) =>
    new AppError(message, ErrorType.BUSINESS_LOGIC, { code, details }),

  external: (message: string, service?: string) =>
    new AppError(message, ErrorType.EXTERNAL_SERVICE, {
      code: service,
      retryable: true,
    }),

  webpack: (message: string, chunkId?: string, details?: unknown) =>
    new AppError(message, ErrorType.WEBPACK_RUNTIME, {
      code: chunkId,
      details: { ...(details && typeof details === 'object' ? details : {}), errorType: "webpack" },
    }),

  module: (message: string, moduleId?: string, details?: unknown) =>
    new AppError(message, ErrorType.MODULE_LOADING, {
      code: moduleId,
      details: { ...(details && typeof details === 'object' ? details : {}), errorType: "module" },
    }),

  factory: (
    message: string = "Factory function error",
    factoryName?: string,
    details?: unknown,
  ) =>
    new AppError(message, ErrorType.FACTORY_ERROR, {
      code: factoryName,
      details: { ...(details && typeof details === 'object' ? details : {}), errorType: "factory", factoryCall: true },
    }),

  performance: (
    message: string,
    metric?: string,
    value?: number,
    details?: unknown,
  ) =>
    new AppError(message, ErrorType.PERFORMANCE, {
      code: metric,
      details: { ...(details && typeof details === 'object' ? details : {}), metric, value, errorType: "performance" },
    }),

  unknown: (message: string, details?: unknown) =>
    new AppError(message, ErrorType.UNKNOWN, { details }),
};

// Estratégias de tratamento de erro
export const errorStrategies = {
  // Mostra notificação e continua execução
  notify: (error: AppError) => {
    const { title, message } = getErrorMessage(error);
    notify.error(title, message, {
      action: error.retryable
        ? {
            label: "Tentar novamente",
            onClick: () => window.location.reload(),
          }
        : undefined,
    });
  },

  // Mostra notificação e redireciona
  redirect: (error: AppError, path: string = "/error") => {
    const { title, message } = getErrorMessage(error);
    notify.error(title, message);
    setTimeout(() => {
      window.location.href = path;
    }, 2000);
  },

  // Log detalhado para desenvolvimento
  log: (error: AppError, context?: unknown) => {
    console.error("AppError:", {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
      stack: error.stack,
      context,
    });

    // Em produção, enviar para serviço de monitoramento
    if (process.env.NODE_ENV === "production") {
      // sendToMonitoringService(error, context)
    }
  },

  // Ignora o erro silenciosamente
  silent: () => {
    // Não faz nada
  },

  // Estratégia completa: log + notify
  handle: (error: AppError, context?: unknown) => {
    errorStrategies.log(error, context);
    errorStrategies.notify(error);
  },
};

// Função para obter mensagens amigáveis de erro
function getErrorMessage(error: AppError): { title: string; message?: string } {
  switch (error.type) {
    case ErrorType.NETWORK:
      return {
        title: "Erro de conexão",
        message: "Verifique sua conexão com a internet e tente novamente.",
      };

    case ErrorType.VALIDATION:
      return {
        title: "Dados inválidos",
        message: error.message,
      };

    case ErrorType.AUTHENTICATION:
      return {
        title: "Sessão expirada",
        message: "Faça login novamente para continuar.",
      };

    case ErrorType.AUTHORIZATION:
      return {
        title: "Acesso negado",
        message: "Você não tem permissão para realizar esta ação.",
      };

    case ErrorType.BUSINESS_LOGIC:
      return {
        title: "Erro na operação",
        message: error.message,
      };

    case ErrorType.EXTERNAL_SERVICE:
      return {
        title: "Serviço indisponível",
        message: `O serviço ${error.code} está temporariamente indisponível.`,
      };

    case ErrorType.WEBPACK_RUNTIME:
      return {
        title: "Erro de carregamento",
        message:
          "Alguns recursos não carregaram corretamente. A página será recarregada.",
      };

    case ErrorType.MODULE_LOADING:
      return {
        title: "Erro de módulo",
        message:
          "Um componente não pôde ser carregado. Tente recarregar a página.",
      };

    case ErrorType.FACTORY_ERROR:
      return {
        title: "Erro interno",
        message:
          "Ocorreu um erro técnico. A página será recarregada automaticamente.",
      };

    case ErrorType.PERFORMANCE:
      return {
        title: "Performance degradada",
        message:
          "A página está lenta. Algumas funcionalidades podem estar limitadas.",
      };

    default:
      return {
        title: "Erro inesperado",
        message: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
      };
  }
}

// Hook para tratamento de erros em componentes
export function useErrorHandler() {
  const handleError = (
    error: unknown,
    strategy: keyof typeof errorStrategies = "handle",
  ) => {
    let appError: AppError;

    if (error instanceof AppError) {
      appError = error;
    } else if (error instanceof Error) {
      appError = new AppError(error.message, ErrorType.UNKNOWN, {
        cause: error,
      });
    } else {
      appError = new AppError("Erro desconhecido", ErrorType.UNKNOWN, {
        details: error,
      });
    }

    errorStrategies[strategy](appError);
    return appError;
  };

  const withErrorHandling = <T extends unknown[], R>(
    fn: (...args: T) => Promise<R>,
    errorStrategy: keyof typeof errorStrategies = "handle",
  ) => {
    return async (...args: T): Promise<R | undefined> => {
      try {
        return await fn(...args);
      } catch (error) {
        handleError(error, errorStrategy);
        return undefined;
      }
    };
  };

  return {
    handleError,
    withErrorHandling,
    createError,
  };
}

// Utilitários para tratamento de erros comuns
export const errorUtils = {
  // Trata erros de API
  handleApiError: (error: unknown): AppError => {
    if ((error as any).response) {
      const { status, data } = (error as any).response;

      switch (status) {
        case 400:
          return createError.validation(data?.message || "Dados inválidos");
        case 401:
          return createError.authentication(data?.message);
        case 403:
          return createError.authorization(data?.message);
        case 404:
          return createError.business("Recurso não encontrado");
        case 422:
          return createError.validation(data?.message || "Dados inválidos");
        case 500:
          return createError.external("Erro interno do servidor");
        default:
          return createError.network("Erro na comunicação com o servidor");
      }
    }

    if ((error as any).request) {
      return createError.network("Sem resposta do servidor");
    }

    return createError.unknown((error as Error).message || "Erro desconhecido");
  },

  // Trata erros de formulários
  handleFormError: (error: unknown): AppError => {
    if ((error as any).errors && Array.isArray((error as any).errors)) {
      const messages = (error as any).errors.map((e: unknown) => (e as Error).message).join(", ");
      return createError.validation(messages);
    }

    return createError.validation((error as Error).message || "Erro no formulário");
  },
};

// Boundary de erro para React
export class ErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    fallback?: React.ComponentType<{ error: Error }>;
  },
  { hasError: boolean; error?: Error }
> {
  constructor(props: unknown) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    // Only handle errors in browser, not during SSR
    if (typeof window !== "undefined") {
      errorStrategies.handle(
        new AppError(error.message, ErrorType.UNKNOWN, {
          details: errorInfo,
          cause: error,
        }),
      );
    }
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} />;
    }

    return this.props.children;
  }
}

// Componente de fallback padrão
function DefaultErrorFallback({ error }: { error: Error }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Ops! Algo deu errado
        </h2>
        <p className="text-gray-600 mb-6">
          Desculpe pelo inconveniente. Ocorreu um erro inesperado.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
