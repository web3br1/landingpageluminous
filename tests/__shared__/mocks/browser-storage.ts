// Browser Storage Mocks - TDD Safe
// Utilitários centralizados para mocks de localStorage, sessionStorage e window
// Segue padrões Vitest para evitar problemas de restoreWindow

import { vi } from "vitest";

/**
 * Cria uma implementação em memória de Storage API (localStorage/sessionStorage)
 * Compatível com testes SSR e isolamento de estado
 */
export function createMemoryStorage(): Storage {
  const store = new Map<string, string>();

  return {
    get length(): number {
      return store.size;
    },

    getItem(key: string): string | null {
      return store.get(key) ?? null;
    },

    setItem(key: string, value: string): void {
      store.set(key, value);
    },

    removeItem(key: string): void {
      store.delete(key);
    },

    clear(): void {
      store.clear();
    },

    key(index: number): string | null {
      const keys = Array.from(store.keys());
      return keys[index] ?? null;
    },
  };
}

/**
 * Mock seguro de window para testes SSR
 * Evita problemas de acesso a propriedades inexistentes
 */
export function createMockWindow(): Window & typeof globalThis {
  const mockWindow = {
    ...globalThis,
    localStorage: createMemoryStorage(),
    sessionStorage: createMemoryStorage(),
    location: {
      href: "http://localhost:3000",
      pathname: "/",
      search: "",
      hash: "",
    },
    navigator: {
      userAgent: "test-user-agent",
    },
    document: global.document,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    matchMedia: vi.fn().mockReturnValue({
      matches: false,
      media: "",
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  };

  return mockWindow as Window & typeof globalThis;
}

/**
 * Setup de mocks de browser storage (Vitest way)
 * Retorna função de cleanup compatível com afterEach
 */
export function setupBrowserStorageMocks(): () => void {
  const localStorageMock = createMemoryStorage();
  const sessionStorageMock = createMemoryStorage();

  // Criar mockWindow completo
  const mockWindow = createMockWindow();
  mockWindow.localStorage = localStorageMock;
  mockWindow.sessionStorage = sessionStorageMock;

  // Stub globals com Vitest - ORDEM IMPORTA!
  vi.stubGlobal("window", mockWindow);
  vi.stubGlobal("localStorage", localStorageMock);
  vi.stubGlobal("sessionStorage", sessionStorageMock);

  // Retorna função de cleanup
  return () => {
    vi.unstubAllGlobals();
  };
}

/**
 * Setup específico para testes SSR (window = undefined)
 * Retorna função de cleanup
 */
export function setupSSREnvironment(): () => void {
  // Stub window como undefined para simular SSR
  vi.stubGlobal("window", undefined);

  // Retorna função de cleanup
  return () => {
    vi.unstubAllGlobals();
  };
}

/**
 * Setup completo para testes de browser APIs
 * Inclui localStorage, sessionStorage e window properties
 */
export function setupFullBrowserEnvironment(): () => void {
  const mockWindow = createMockWindow();

  vi.stubGlobal("window", mockWindow);

  // Retorna função de cleanup
  return () => {
    vi.unstubAllGlobals();
  };
}

/**
 * Cleanup utilitário para todos os mocks de browser
 * Chamar no afterEach para garantir isolamento
 */
export function cleanupBrowserMocks(): void {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
}
