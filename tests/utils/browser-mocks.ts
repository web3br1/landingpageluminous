// ===== MOCKS DETERMINÍSTICOS NO CONTEXTO DO NAVEGADOR - PR-2 =====
// Sistema de mocks que roda dentro do navegador, não no Node.js
// Garante determinismo para testes E2E e visuais

import { Page } from "@playwright/test";

/**
 * Configuração de mocks determinísticos para testes E2E
 */
export interface DeterministicMockConfig {
  // Feature flags determinísticas
  featureFlags?: Record<string, boolean | string | number>;
  // Dados de usuário mockados
  user?: {
    id: string;
    email: string;
    name: string;
    plan: string;
  };
  // Dados de analytics mockados
  analytics?: {
    events: Array<{ name: string; properties: Record<string, any> }>;
    userId: string;
  };
  // Dados de formulários mockados
  forms?: {
    signup?: {
      success: boolean;
      delay: number;
      response: any;
    };
    demo?: {
      success: boolean;
      delay: number;
      response: any;
    };
  };
  // Geolocation mockada
  geolocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

/**
 * Valores padrão para mocks determinísticos
 */
export const DEFAULT_MOCK_CONFIG: DeterministicMockConfig = {
  featureFlags: {
    abVariant: "A",
    geo: "BR",
    reducedMotion: true,
    userBucket: 1,
    theme: "light",
    analytics: true,
    notifications: false,
    socialProof: true,
  },
  user: {
    id: "test-user-123",
    email: "test@example.com",
    name: "João Silva",
    plan: "free",
  },
  analytics: {
    events: [],
    userId: "test-user-123",
  },
  forms: {
    signup: {
      success: true,
      delay: 500,
      response: {
        user: { id: "test-user-123", email: "test@example.com" },
        token: "mock-jwt-token",
        redirectUrl: "/dashboard",
      },
    },
    demo: {
      success: true,
      delay: 800,
      response: {
        meetingId: "demo-123",
        meetingUrl: "https://meet.example.com/demo-123",
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    },
  },
  geolocation: {
    latitude: -23.5505, // São Paulo
    longitude: -46.6333,
    accuracy: 100,
  },
};

/**
 * Instala mocks determinísticos no contexto do navegador
 * Executa dentro do browser, não no Node.js
 */
export async function installBrowserMocks(
  page: Page,
  config: DeterministicMockConfig = DEFAULT_MOCK_CONFIG,
): Promise<void> {
  // 1. Mock de APIs REST/GraphQL
  await mockApiEndpoints(page, config);

  // 2. Mock de WebSockets (se usado)
  await mockWebSocketEndpoints(page, config);

  // 3. Mock de localStorage/sessionStorage
  await mockBrowserStorage(page, config);

  // 4. Mock de Service Workers
  await mockServiceWorkers(page, config);

  // 5. Mock de Third-party scripts (analytics, etc)
  await mockThirdPartyScripts(page, config);

  // 6. Override de funções globais para determinismo
  await mockGlobalFunctions(page, config);

  console.log("Browser mocks installed deterministically");
}

/**
 * Mock de endpoints de API no contexto do navegador
 */
async function mockApiEndpoints(
  page: Page,
  config: DeterministicMockConfig,
): Promise<void> {
  // Mock de feature flags
  await page.route("**/api/feature-flags", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(config.featureFlags || {}),
    });
  });

  // Mock de signup
  await page.route("**/api/auth/signup", (route) => {
    const signupMock = config.forms?.signup;
    if (signupMock) {
      setTimeout(() => {
        route.fulfill({
          status: signupMock.success ? 200 : 400,
          contentType: "application/json",
          body: JSON.stringify(signupMock.response),
        });
      }, signupMock.delay);
    } else {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(DEFAULT_MOCK_CONFIG.forms?.signup?.response),
      });
    }
  });

  // Mock de demo request
  await page.route("**/api/demo/request", (route) => {
    const demoMock = config.forms?.demo;
    if (demoMock) {
      setTimeout(() => {
        route.fulfill({
          status: demoMock.success ? 200 : 400,
          contentType: "application/json",
          body: JSON.stringify(demoMock.response),
        });
      }, demoMock.delay);
    } else {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(DEFAULT_MOCK_CONFIG.forms?.demo?.response),
      });
    }
  });

  // Mock de analytics
  await page.route("**/api/analytics/**", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });

  // Mock de geolocation API
  if (config.geolocation) {
    await page.context().setGeolocation(config.geolocation);
  }
}

/**
 * Mock de WebSockets para comunicação em tempo real
 */
async function mockWebSocketEndpoints(
  page: Page,
  config: DeterministicMockConfig,
): Promise<void> {
  // Override do WebSocket constructor para testes
  await page.addScriptTag({
    content: `
      const OriginalWebSocket = window.WebSocket;
      window.WebSocket = class MockWebSocket extends EventTarget {
        constructor(url) {
          super();
          this.url = url;
          this.readyState = 1; // OPEN

          // Simular conexão bem-sucedida
          setTimeout(() => {
            this.dispatchEvent(new Event('open'));
          }, 100);

          // Enviar dados mockados periodicamente
          this.mockInterval = setInterval(() => {
            if (this.onmessage) {
              this.onmessage({
                data: JSON.stringify({
                  type: 'live_update',
                  payload: {
                    users: Math.floor(Math.random() * 100) + 50,
                    timestamp: Date.now()
                  }
                })
              });
            }
          }, 5000);
        }

        send(data) {
          // Simular envio bem-sucedido
          console.log('Mock WebSocket sent:', data);
        }

        close() {
          this.readyState = 3; // CLOSED
          clearInterval(this.mockInterval);
          this.dispatchEvent(new Event('close'));
        }
      };
    `,
  });
}

/**
 * Mock de localStorage/sessionStorage para estado consistente
 */
async function mockBrowserStorage(
  page: Page,
  config: DeterministicMockConfig,
): Promise<void> {
  await page.addScriptTag({
    content: `
      // Override localStorage
      const originalLocalStorage = window.localStorage;
      window.localStorage = {
        getItem: (key) => {
          const mockData = {
            'user': JSON.stringify(${JSON.stringify(config.user || DEFAULT_MOCK_CONFIG.user)}),
            'theme': 'light',
            'ab-test-variant': 'A',
            'geo': 'BR'
          };
          return mockData[key] || originalLocalStorage.getItem(key);
        },
        setItem: (key, value) => {
          originalLocalStorage.setItem(key, value);
        },
        removeItem: (key) => {
          originalLocalStorage.removeItem(key);
        },
        clear: () => {
          originalLocalStorage.clear();
        },
        get length() {
          return originalLocalStorage.length;
        },
        key: (index) => {
          return originalLocalStorage.key(index);
        }
      };

      // Override sessionStorage similar
      const originalSessionStorage = window.sessionStorage;
      window.sessionStorage = {
        ...originalSessionStorage,
        getItem: (key) => {
          const mockData = {
            'session_id': 'test-session-123',
            'csrf_token': 'mock-csrf-token'
          };
          return mockData[key] || originalSessionStorage.getItem(key);
        }
      };
    `,
  });
}

/**
 * Mock de Service Workers para funcionalidades offline/PWA
 */
async function mockServiceWorkers(
  page: Page,
  config: DeterministicMockConfig,
): Promise<void> {
  await page.addScriptTag({
    content: `
      // Mock Service Worker registration
      const originalNavigator = navigator;
      navigator.serviceWorker = {
        register: async (scriptURL, options) => {
          console.log('Mock Service Worker registered:', scriptURL);
          return {
            active: { state: 'activated' },
            installing: null,
            waiting: null,
            scope: window.location.origin,
            update: async () => ({ active: { state: 'activated' } }),
            unregister: async () => true
          };
        },
        ready: Promise.resolve({
          active: { state: 'activated' },
          scope: window.location.origin
        }),
        getRegistration: async () => ({
          active: { state: 'activated' },
          scope: window.location.origin
        }),
        getRegistrations: async () => [{
          active: { state: 'activated' },
          scope: window.location.origin
        }]
      };
    `,
  });
}

/**
 * Mock de scripts third-party (Google Analytics, etc)
 */
async function mockThirdPartyScripts(
  page: Page,
  config: DeterministicMockConfig,
): Promise<void> {
  // Mock Google Analytics
  await page.addScriptTag({
    content: `
      window.gtag = function() {
        console.log('Mock gtag called:', arguments);
      };
      window.ga = function() {
        console.log('Mock ga called:', arguments);
      };
    `,
  });

  // Mock outros third-party scripts
  await page.route("**/googletagmanager.com/**", (route) => route.abort());
  await page.route("**/google-analytics.com/**", (route) => route.abort());
  await page.route("**/facebook.com/tr**", (route) =>
    route.fulfill({ status: 200, body: "{}" }),
  );
}

/**
 * Override de funções globais para determinismo
 */
async function mockGlobalFunctions(
  page: Page,
  config: DeterministicMockConfig,
): Promise<void> {
  await page.addScriptTag({
    content: `
      // Congelar timestamp para screenshots consistentes
      const frozenTime = 1640995200000; // 2022-01-01 00:00:00 UTC
      const originalDateNow = Date.now;
      Date.now = () => frozenTime;

      // RNG determinístico
      let rngSeed = 0.5;
      const originalRandom = Math.random;
      Math.random = () => {
        rngSeed = (rngSeed * 9301 + 49297) % 233280;
        return rngSeed / 233280;
      };

      // Performance.now determinístico
      let perfTime = 1000;
      const originalPerfNow = performance.now;
      performance.now = () => perfTime += 16.67; // ~60fps

      // Mock de IntersectionObserver para lazy loading consistente
      window.IntersectionObserver = class MockIntersectionObserver {
        constructor(callback) {
          this.callback = callback;
          // Trigger imediatamente para lazy loading
          setTimeout(() => {
            callback([{
              isIntersecting: true,
              intersectionRatio: 1,
              target: document.body
            }]);
          }, 100);
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      };

      // Mock de ResizeObserver para responsividade
      window.ResizeObserver = class MockResizeObserver {
        constructor(callback) {
          this.callback = callback;
          setTimeout(() => {
            callback([{
              contentRect: {
                width: 1280,
                height: 720
              }
            }]);
          }, 50);
        }
        observe() {}
        unobserve() {}
        disconnect() {}
      };
    `,
  });
}

/**
 * Configurações específicas para diferentes tipos de teste
 */
export const TEST_CONFIGS = {
  // Para testes visuais - foco em determinismo visual
  visual: {
    ...DEFAULT_MOCK_CONFIG,
    featureFlags: {
      ...DEFAULT_MOCK_CONFIG.featureFlags,
      showDebugPanels: false,
      enableAnimations: false,
    },
  },

  // Para testes E2E - foco em fluxos funcionais
  e2e: {
    ...DEFAULT_MOCK_CONFIG,
    forms: {
      signup: {
        success: true,
        delay: 300,
        response: DEFAULT_MOCK_CONFIG.forms?.signup?.response,
      },
      demo: {
        success: true,
        delay: 500,
        response: DEFAULT_MOCK_CONFIG.forms?.demo?.response,
      },
    },
  },

  // Para testes de performance - foco em medições consistentes
  performance: {
    ...DEFAULT_MOCK_CONFIG,
    featureFlags: {
      ...DEFAULT_MOCK_CONFIG.featureFlags,
      analytics: false, // Desabilitar analytics para perf
      thirdParty: false,
    },
  },
};
