import { ReactNode } from "react";
import { render } from "@testing-library/react";
import { vi } from "vitest";

// Mocks globais para testes DOM
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

vi.mock("next/headers", () => ({
  headers: () => new Map(),
  cookies: () => ({ get: () => null, getAll: () => [] }),
}));

vi.mock("@/lib/analytics", () => ({
  trackEvent: vi.fn(),
  trackConversion: vi.fn(),
}));

vi.mock("@/lib/hooks/use-analytics", () => ({
  useAnalytics: () => ({
    trackEvent: vi.fn(),
    trackConversion: vi.fn(),
  }),
}));

vi.mock("@/lib/hooks/use-feature-flags", () => ({
  useExperiment: () => ({
    variant: null,
    trackEvent: vi.fn(),
    trackConversion: vi.fn(),
    loading: false,
    error: null,
    isControl: true,
    experimentId: "test_experiment",
  }),
  useABContent: () => "Test content",
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: Record<string, unknown>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

export function renderUI(ui: ReactNode) {
  return render(<>{ui}</>);
}

export function renderWithProviders(ui: ReactNode) {
  // Wrapper para futuros providers (theme, auth, etc.)
  return render(<>{ui}</>);
}
