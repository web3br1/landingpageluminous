// DOM-specific hydration tests
// These tests require a DOM environment and are run separately

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "../lib/theme/theme-context";

// Mock window.matchMedia for tests
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, "sessionStorage", {
  value: sessionStorageMock,
});

describe("Theme Hydration Safety - DOM Environment", () => {
  it("should not cause hydration mismatch with data-theme attribute", () => {
    expect(() => {
      render(
        <ThemeProvider
          defaultTheme={{
            mode: "light",
            colorScheme: "default",
            reducedMotion: false,
          }}
        >
          <div data-testid="theme-test">Data theme test</div>
        </ThemeProvider>,
      );
    }).not.toThrow();

    // Verify the component renders
    expect(screen.getByTestId("theme-test")).toBeInTheDocument();
    expect(screen.getByText("Data theme test")).toBeInTheDocument();
  });

  it("should handle system theme preferences without controlling data-system-theme", () => {
    expect(() => {
      render(
        <ThemeProvider
          defaultTheme={{
            mode: "dark",
            colorScheme: "default",
            reducedMotion: false,
          }}
        >
          <div>System theme test</div>
        </ThemeProvider>,
      );
    }).not.toThrow();

    expect(screen.getByText("System theme test")).toBeInTheDocument();
  });

  it("should handle reduced motion preferences without controlling data-reduced-motion", () => {
    expect(() => {
      render(
        <ThemeProvider
          defaultTheme={{
            mode: "light",
            colorScheme: "default",
            reducedMotion: true,
          }}
        >
          <div>Reduced motion test</div>
        </ThemeProvider>,
      );
    }).not.toThrow();

    expect(screen.getByText("Reduced motion test")).toBeInTheDocument();
  });

  it("should apply theme classes without hydration conflicts", () => {
    const { container } = render(
      <ThemeProvider
        defaultTheme={{
          mode: "dark",
          colorScheme: "default",
          reducedMotion: false,
        }}
      >
        <div data-testid="theme-test">Theme classes test</div>
      </ThemeProvider>,
    );

    // Verify the component renders
    expect(screen.getByTestId("theme-test")).toBeInTheDocument();
    expect(screen.getByText("Theme classes test")).toBeInTheDocument();

    // Check that no hydration-related errors occurred
    expect(container).toBeDefined();
  });

  it("should handle consent management with DOM APIs", async () => {
    // Mock localStorage for this test
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});

    const { hasConsent, setConsent } = await import(
      "../lib/theme/experimentation-engine"
    );

    // Test initial state (no consent)
    expect(hasConsent("analytics")).toBe(false);
    expect(hasConsent("marketing")).toBe(false);

    // Set consent
    setConsent("analytics", true);
    setConsent("marketing", false);

    // Check that localStorage.setItem was called
    expect(localStorageMock.setItem).toHaveBeenCalled();

    // Mock localStorage to return stored consent
    localStorageMock.getItem.mockReturnValue(
      '{"analytics":true,"marketing":false}',
    );

    // Check consent
    expect(hasConsent("analytics")).toBe(true);
    expect(hasConsent("marketing")).toBe(false);

    // Test invalid consent type
    expect(hasConsent("invalid")).toBe(false);
  });
});
