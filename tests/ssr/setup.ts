// Setup para testes SSR (Node environment)
import { vi } from "vitest";

// Mock console para SSR
const mockConsoleError = vi
  .spyOn(console, "error")
  .mockImplementation(() => {});
const mockConsoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});

// Mock Next.js para SSR
vi.mock("next/headers", () => ({
  headers: () => new Map(),
  cookies: () => ({ get: () => null, getAll: () => [] }),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

// Mock analytics para SSR
vi.mock("@/lib/analytics", () => ({
  trackEvent: vi.fn(),
  trackConversion: vi.fn(),
}));

// Limpar mocks entre testes
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});
