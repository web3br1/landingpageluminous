// SSR Safety Utilities - TDD Safe
// Utilitários para acesso seguro a browser APIs em testes
// Previne erros de SSR e garante isolamento de testes

/**
 * Acesso seguro a APIs do browser com fallback
 * Padrão recomendado para todos os testes que acessam window/document/navigator
 */
export function safeBrowserAccess<T>(
  callback: () => T,
  fallback: T = null as T,
): T {
  try {
    if (typeof window === "undefined") {
      return fallback;
    }
    return callback();
  } catch (error) {
    // Log para debug em desenvolvimento
    if (process.env.NODE_ENV === "development") {
      console.warn("[SSR Safety] Browser API access failed:", error);
    }
    return fallback;
  }
}

/**
 * Acesso seguro a propriedades do window
 * Com verificação de existência da propriedade
 */
export function safeWindowAccess<T>(property: keyof Window, fallback: T): T {
  return safeBrowserAccess(() => {
    const value = (window as any)[property];
    return value !== undefined ? value : fallback;
  }, fallback);
}

/**
 * Acesso seguro ao localStorage
 */
export function safeLocalStorageAccess<T>(
  callback: (storage: Storage) => T,
  fallback: T,
): T {
  return safeBrowserAccess(() => {
    if (!window.localStorage) {
      return fallback;
    }
    return callback(window.localStorage);
  }, fallback);
}

/**
 * Acesso seguro ao sessionStorage
 */
export function safeSessionStorageAccess<T>(
  callback: (storage: Storage) => T,
  fallback: T,
): T {
  return safeBrowserAccess(() => {
    if (!window.sessionStorage) {
      return fallback;
    }
    return callback(window.sessionStorage);
  }, fallback);
}

/**
 * Verificação de ambiente client-side
 */
export function isClientSide(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

/**
 * Verificação de ambiente server-side
 */
export function isServerSide(): boolean {
  return typeof window === "undefined" || typeof document === "undefined";
}

/**
 * Wrapper para operações que podem falhar no SSR
 * Útil para componentes que fazem operações condicionais
 */
export function withBrowserGuard<T>(operation: () => T, fallback: T): T {
  if (isServerSide()) {
    return fallback;
  }

  try {
    return operation();
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[Browser Guard] Operation failed:", error);
    }
    return fallback;
  }
}

/**
 * Hook-like pattern para testes (simula useEffect + cleanup)
 */
export function createBrowserEffect(
  effect: () => (() => void) | void,
  deps: any[] = [],
): { run: () => void; cleanup: () => void } {
  let cleanupFn: (() => void) | undefined;

  const run = () => {
    if (isClientSide()) {
      cleanupFn = effect() || undefined;
    }
  };

  const cleanup = () => {
    if (cleanupFn) {
      cleanupFn();
      cleanupFn = undefined;
    }
  };

  return { run, cleanup };
}
