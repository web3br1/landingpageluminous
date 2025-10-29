// MSW Setup - Mock Server Worker para testes de rede padronizados
// Substitui mocking global ad-hoc por cenários controlados

import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

// ===== HANDLERS PADRÃO =====

// API Data Handler - Cenário de sucesso
export const apiDataSuccessHandler = http.get("/api/data", () => {
  return HttpResponse.json({
    success: true,
    data: { id: 1, message: "Success" },
  });
});

// API Data Handler - Cenário de erro 500
export const apiDataServerErrorHandler = http.get("/api/data", () => {
  return HttpResponse.json({ error: "Internal server error" }, { status: 500 });
});

// API Data Handler - Cenário de timeout
export const apiDataTimeoutHandler = http.get("/api/data", () => {
  // Simula timeout - não retorna resposta
  return new Promise(() => {
    // Never resolves - simulates hanging request
  });
});

// API Data Handler - Cenário de erro de rede
export const apiDataNetworkErrorHandler = http.get("/api/data", () => {
  return HttpResponse.error();
});

// API Data Handler - Cenário DNS
export const apiDataDnsErrorHandler = http.get("/api/data", () => {
  return HttpResponse.error();
});

// ===== SERVER MSW =====
export const server = setupServer(
  // Handler padrão - sucesso
  apiDataSuccessHandler,
);

// ===== UTILITÁRIOS =====
export const mswUtils = {
  // Reset para estado inicial
  resetHandlers: () => {
    server.resetHandlers();
    server.use(apiDataSuccessHandler);
  },

  // Simular cenários específicos
  simulateSuccess: () => {
    server.resetHandlers();
    server.use(apiDataSuccessHandler);
  },

  simulateServerError: () => {
    server.resetHandlers();
    server.use(apiDataServerErrorHandler);
  },

  simulateTimeout: () => {
    server.resetHandlers();
    server.use(apiDataTimeoutHandler);
  },

  simulateNetworkError: () => {
    server.resetHandlers();
    server.use(apiDataNetworkErrorHandler);
  },

  simulateDnsError: () => {
    server.resetHandlers();
    server.use(apiDataDnsErrorHandler);
  },

  // Setup custom handler
  useCustomHandler: (handler: any) => {
    server.use(handler);
  },
};

// ===== UTILITÁRIOS DE TESTE =====

// Flush microtasks para Promises assíncronas
export const flushMicrotasks = () =>
  new Promise((resolve) => setImmediate(resolve));

// ===== LIFECYCLE =====

// Setup antes de todos os testes
beforeAll(() => {
  server.listen({
    onUnhandledRequest: "warn", // Avisa sobre requests não mockados
  });
});

// Reset após cada teste
afterEach(() => {
  server.resetHandlers();
  mswUtils.resetHandlers();
});

// Cleanup após todos os testes
afterAll(() => {
  server.close();
});
