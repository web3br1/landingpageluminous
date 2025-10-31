// ===== SERVICE MOCK OBJECTS =====
// Pre-configured mock objects for common service testing

import { MockObject, HttpMock, DatabaseMock } from "../test-types";

// ===== ANALYTICS SERVICE MOCK =====

export const analyticsServiceMock: MockObject = {
  id: "analytics-service-mock",
  name: "Analytics Service Mock",
  type: "object",
  implementation: {
    track: jest.fn(),
    trackEvent: jest.fn(),
    trackPageView: jest.fn(),
    trackConversion: jest.fn(),
    setUserProperties: jest.fn(),
    getUserId: jest.fn(() => "test-user-123"),
    isInitialized: jest.fn(() => true),
  },
  calls: [],
  metadata: {
    module: "@/lib/analytics",
    function: "analytics",
    isAsync: false,
    callCount: 0,
  },
};

// ===== API CLIENT MOCK =====

export const apiClientMock: HttpMock = {
  id: "api-client-mock",
  name: "API Client Mock",
  type: "function",
  implementation: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
  calls: [],
  metadata: {
    module: "@/lib/api/client",
    function: "apiClient",
    isAsync: true,
    callCount: 0,
  },
};

// Configure default responses
apiClientMock.implementation.get.mockResolvedValue({
  data: { success: true },
  status: 200,
});

apiClientMock.implementation.post.mockResolvedValue({
  data: { success: true, id: "test-id" },
  status: 201,
});

apiClientMock.implementation.put.mockResolvedValue({
  data: { success: true },
  status: 200,
});

apiClientMock.implementation.delete.mockResolvedValue({
  data: { success: true },
  status: 204,
});

// ===== DATABASE MOCK =====

export const databaseMock: DatabaseMock = {
  id: "database-mock",
  name: "Database Mock",
  type: "object",
  implementation: {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  calls: [],
  metadata: {
    module: "@/lib/database",
    function: "db",
    isAsync: true,
    callCount: 0,
  },
};

// Configure default responses
databaseMock.implementation.find.mockResolvedValue([]);
databaseMock.implementation.findOne.mockResolvedValue(null);
databaseMock.implementation.create.mockResolvedValue({ id: "test-id" });
databaseMock.implementation.update.mockResolvedValue({ success: true });
databaseMock.implementation.delete.mockResolvedValue({ success: true });

// ===== CRM SERVICE MOCK =====

export const crmServiceMock: MockObject = {
  id: "crm-service-mock",
  name: "CRM Service Mock",
  type: "object",
  implementation: {
    createContact: jest.fn(),
    updateContact: jest.fn(),
    getContact: jest.fn(),
    deleteContact: jest.fn(),
    createDeal: jest.fn(),
    updateDeal: jest.fn(),
    getDeals: jest.fn(),
    sendEmail: jest.fn(),
  },
  calls: [],
  metadata: {
    module: "@/lib/crm",
    function: "crmService",
    isAsync: true,
    callCount: 0,
  },
};

// Configure default responses
crmServiceMock.implementation.createContact.mockResolvedValue({
  id: "contact-123",
  success: true,
});

crmServiceMock.implementation.getContact.mockResolvedValue({
  id: "contact-123",
  email: "test@example.com",
  name: "Test User",
});

crmServiceMock.implementation.createDeal.mockResolvedValue({
  id: "deal-456",
  success: true,
});

// ===== PAYMENT SERVICE MOCK =====

export const paymentServiceMock: MockObject = {
  id: "payment-service-mock",
  name: "Payment Service Mock",
  type: "object",
  implementation: {
    createOrder: jest.fn(),
    processPayment: jest.fn(),
    refundPayment: jest.fn(),
    getPaymentStatus: jest.fn(),
    createSubscription: jest.fn(),
    cancelSubscription: jest.fn(),
  },
  calls: [],
  metadata: {
    module: "@/lib/payments",
    function: "paymentService",
    isAsync: true,
    callCount: 0,
  },
};

// Configure default responses
paymentServiceMock.implementation.createOrder.mockResolvedValue({
  id: "order-789",
  status: "pending",
  amount: 99.99,
});

paymentServiceMock.implementation.processPayment.mockResolvedValue({
  success: true,
  transactionId: "txn-123",
});

paymentServiceMock.implementation.getPaymentStatus.mockResolvedValue({
  status: "completed",
  amount: 99.99,
});

// ===== FEATURE FLAGS MOCK =====

export const featureFlagsMock: MockObject = {
  id: "feature-flags-mock",
  name: "Feature Flags Mock",
  type: "object",
  implementation: {
    isEnabled: jest.fn(),
    getValue: jest.fn(),
    getAllFlags: jest.fn(),
    setOverride: jest.fn(),
    clearOverride: jest.fn(),
  },
  calls: [],
  metadata: {
    module: "@/lib/feature-flags",
    function: "featureFlags",
    isAsync: false,
    callCount: 0,
  },
};

// Configure default responses
featureFlagsMock.implementation.isEnabled.mockReturnValue(true);
featureFlagsMock.implementation.getValue.mockReturnValue("test-value");
featureFlagsMock.implementation.getAllFlags.mockReturnValue({
  analytics: true,
  darkMode: false,
  newUI: true,
});

// ===== LOCAL STORAGE MOCK =====

export const localStorageMock: MockObject = {
  id: "local-storage-mock",
  name: "Local Storage Mock",
  type: "object",
  implementation: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    key: jest.fn(),
    get length() { return 0; },
  },
  calls: [],
  metadata: {
    module: "localStorage",
    function: "localStorage",
    isAsync: false,
    callCount: 0,
  },
};

// Configure default behavior
localStorageMock.implementation.getItem.mockReturnValue(null);
localStorageMock.implementation.setItem.mockImplementation(() => {});
localStorageMock.implementation.removeItem.mockImplementation(() => {});
localStorageMock.implementation.clear.mockImplementation(() => {});

// ===== WINDOW OBJECT MOCK =====

export const windowMock: MockObject = {
  id: "window-mock",
  name: "Window Object Mock",
  type: "object",
  implementation: {
    location: {
      href: "http://localhost:3000",
      pathname: "/",
      search: "",
      hash: "",
    },
    navigator: {
      userAgent: "TestBrowser/1.0",
      language: "en-US",
      onLine: true,
    },
    document: {
      title: "Test Page",
      referrer: "",
      cookie: "",
    },
    innerWidth: 1024,
    innerHeight: 768,
    scrollX: 0,
    scrollY: 0,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  },
  calls: [],
  metadata: {
    module: "window",
    function: "window",
    isAsync: false,
    callCount: 0,
  },
};

// ===== FETCH API MOCK =====

export const fetchMock: MockObject = {
  id: "fetch-mock",
  name: "Fetch API Mock",
  type: "function",
  implementation: jest.fn(),
  calls: [],
  metadata: {
    module: "fetch",
    function: "fetch",
    isAsync: true,
    callCount: 0,
  },
};

// Configure default fetch response
(fetchMock.implementation as jest.MockedFunction<any>).mockResolvedValue({
  ok: true,
  status: 200,
  json: jest.fn().mockResolvedValue({ success: true }),
  text: jest.fn().mockResolvedValue("success"),
});

// ===== UTILITY FUNCTIONS =====

export function createMockWithTracking<T>(mock: MockObject): T {
  const trackedMock = { ...mock.implementation };

  // Add call tracking to all functions
  Object.keys(trackedMock).forEach(key => {
    if (typeof trackedMock[key] === "function") {
      const originalFn = trackedMock[key];
      trackedMock[key] = jest.fn((...args: any[]) => {
        mock.calls.push({
          args,
          timestamp: new Date(),
        });
        mock.metadata.callCount++;
        mock.metadata.lastCalled = new Date();

        try {
          const result = originalFn(...args);
          if (mock.calls[mock.calls.length - 1]) {
            mock.calls[mock.calls.length - 1].returnValue = result;
          }
          return result;
        } catch (error) {
          if (mock.calls[mock.calls.length - 1]) {
            mock.calls[mock.calls.length - 1].thrownError = error as Error;
          }
          throw error;
        }
      });
    }
  });

  return trackedMock as T;
}

export function resetMockCalls(mock: MockObject): void {
  mock.calls = [];
  mock.metadata.callCount = 0;
  mock.metadata.lastCalled = undefined;
}

export function getMockCallHistory(mock: MockObject): MockCall[] {
  return [...mock.calls];
}

export function getMockCallCount(mock: MockObject): number {
  return mock.metadata.callCount;
}

// ===== MOCK COLLECTIONS =====

export const serviceMocks = {
  analytics: analyticsServiceMock,
  api: apiClientMock,
  database: databaseMock,
  crm: crmServiceMock,
  payments: paymentServiceMock,
  featureFlags: featureFlagsMock,
  localStorage: localStorageMock,
  window: windowMock,
  fetch: fetchMock,
} as const;

export type ServiceMockType = keyof typeof serviceMocks;
