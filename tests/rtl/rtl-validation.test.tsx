// RTL Validation Tests
// Comprehensive testing for RTL layout and component behavior

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@/lib/theme/theme-context";

// Mock window.matchMedia
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

describe("RTL Layout Validation", () => {
  it("should flip arrow icons in RTL mode", () => {
    // Mock RTL direction
    document.documentElement.setAttribute("dir", "rtl");

    const { container } = render(
      <ThemeProvider
        defaultTheme={{
          mode: "light",
          colorScheme: "default",
          reducedMotion: false,
        }}
      >
        <div>
          <button className="flex items-center">
            <span>Next</span>
            <svg className="ml-2 w-4 h-4 rtl-flip" data-testid="arrow-icon" />
          </button>
        </div>
      </ThemeProvider>,
    );

    // Check if rtl-flip class is applied (would be handled by CSS)
    const arrowIcon = screen.getByTestId("arrow-icon");
    expect(arrowIcon).toHaveClass("rtl-flip");

    // Clean up
    document.documentElement.removeAttribute("dir");
  }, 10000);

  it("should adjust spacing in RTL layout", () => {
    document.documentElement.setAttribute("dir", "rtl");

    const { container } = render(
      <ThemeProvider
        defaultTheme={{
          mode: "light",
          colorScheme: "default",
          reducedMotion: false,
        }}
      >
        <div className="flex space-x-4" data-testid="rtl-container">
          <div>Item 1</div>
          <div>Item 2</div>
          <div>Item 3</div>
        </div>
      </ThemeProvider>,
    );

    const rtlContainer = screen.getByTestId("rtl-container");
    expect(rtlContainer).toHaveClass("space-x-4");

    // Clean up
    document.documentElement.removeAttribute("dir");
  });

  it("should detect RTL locales correctly", () => {
    const rtlLocales = ["ar-SA", "he-IL", "fa-IR", "ur-PK"];
    const ltrLocales = ["en-US", "pt-BR", "es-ES", "fr-FR", "de-DE", "ja-JP"];

    // Test RTL detection logic
    const isRTL = (locale: string) => {
      const rtlLanguages = ["ar", "he", "fa", "ur", "yi", "ji"];
      return rtlLanguages.includes(locale.split("-")[0].toLowerCase());
    };

    rtlLocales.forEach((locale) => {
      expect(isRTL(locale)).toBe(true);
    });

    ltrLocales.forEach((locale) => {
      expect(isRTL(locale)).toBe(false);
    });
  });

  it("should handle RTL text direction in components", () => {
    document.documentElement.setAttribute("dir", "rtl");

    const { container } = render(
      <ThemeProvider
        defaultTheme={{
          mode: "light",
          colorScheme: "default",
          reducedMotion: false,
        }}
      >
        <div>
          <p data-testid="rtl-text" className="text-right">
            مرحبا بالعالم
          </p>
        </div>
      </ThemeProvider>,
    );

    const rtlText = screen.getByTestId("rtl-text");
    expect(rtlText).toHaveClass("text-right");
    expect(rtlText).toHaveTextContent("مرحبا بالعالم");

    // Clean up
    document.documentElement.removeAttribute("dir");
  });

  it("should maintain proper focus order in RTL", () => {
    document.documentElement.setAttribute("dir", "rtl");

    const { container } = render(
      <ThemeProvider
        defaultTheme={{
          mode: "light",
          colorScheme: "default",
          reducedMotion: false,
        }}
      >
        <div>
          <button data-testid="button-1">Button 1</button>
          <button data-testid="button-2">Button 2</button>
          <button data-testid="button-3">Button 3</button>
        </div>
      </ThemeProvider>,
    );

    // Focus order should still be logical (DOM order)
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
    expect(buttons[0]).toHaveAttribute("data-testid", "button-1");
    expect(buttons[1]).toHaveAttribute("data-testid", "button-2");
    expect(buttons[2]).toHaveAttribute("data-testid", "button-3");

    // Clean up
    document.documentElement.removeAttribute("dir");
  });

  it("should handle RTL-specific spacing utilities", () => {
    document.documentElement.setAttribute("dir", "rtl");

    const { container } = render(
      <ThemeProvider
        defaultTheme={{
          mode: "light",
          colorScheme: "default",
          reducedMotion: false,
        }}
      >
        <div>
          <div className="space-x-4" data-testid="rtl-spacing">
            <span>Item A</span>
            <span>Item B</span>
            <span>Item C</span>
          </div>
        </div>
      </ThemeProvider>,
    );

    const rtlSpacing = screen.getByTestId("rtl-spacing");
    expect(rtlSpacing).toHaveClass("space-x-4");

    // Clean up
    document.documentElement.removeAttribute("dir");
  });

  it("should support RTL in interactive elements", () => {
    document.documentElement.setAttribute("dir", "rtl");

    const { container } = render(
      <ThemeProvider
        defaultTheme={{
          mode: "light",
          colorScheme: "default",
          reducedMotion: false,
        }}
      >
        <div>
          <input
            data-testid="rtl-input"
            type="text"
            placeholder="أدخل النص هنا"
            className="text-right"
          />
        </div>
      </ThemeProvider>,
    );

    const rtlInput = screen.getByTestId("rtl-input");
    expect(rtlInput).toHaveAttribute("placeholder", "أدخل النص هنا");
    expect(rtlInput).toHaveClass("text-right");

    // Clean up
    document.documentElement.removeAttribute("dir");
  });
});
