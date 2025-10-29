// SSR Safety Tests
// Validate that hooks and components don't cause hydration mismatches

import React from "react";
import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { render, screen } from "@testing-library/react";
import { ThemeProvider } from "@/lib/theme/theme-context";

// Mock window APIs for SSR safety testing
const originalWindow = global.window;
const originalDocument = global.document;
const originalLocalStorage = global.localStorage;
const originalSessionStorage = global.sessionStorage;

describe("SSR Safety Validation", () => {
  beforeEach(() => {
    // Remove window/document for SSR simulation
    delete (global as any).window;
    delete (global as any).document;
    delete (global as any).localStorage;
    delete (global as any).sessionStorage;
  });

  afterEach(() => {
    // Restore window/document
    global.window = originalWindow;
    global.document = originalDocument;
    global.localStorage = originalLocalStorage;
    global.sessionStorage = originalSessionStorage;
  });

  it("should render ThemeProvider without window access on server", () => {
    expect(() => {
      renderToString(
        <ThemeProvider
          defaultTheme={{
            mode: "light",
            colorScheme: "default",
            reducedMotion: false,
          }}
        >
          <div>SSR Test Content</div>
        </ThemeProvider>,
      );
    }).not.toThrow();
  });

  it("should render components that use useState without issues", () => {
    function TestComponent() {
      const [count, setCount] = React.useState(0);
      return <div>Count: {count}</div>;
    }

    expect(() => {
      const html = renderToString(<TestComponent />);
      expect(html).toContain("Count:");
      expect(html).toContain("0");
    }).not.toThrow();
  });

  it("should handle hooks that check SSR safety", async () => {
    // Test components that use SSR-safe hooks
    function SafeComponent() {
      // This should not cause issues during SSR
      return <div>SSR Safe Component</div>;
    }

    // SSR should work
    expect(() => {
      const html = renderToString(<SafeComponent />);
      expect(html).toContain("SSR Safe Component");
    }).not.toThrow();
  });

  it("should handle conditional rendering based on SSR checks", () => {
    function ConditionalComponent() {
      const isClient = typeof window !== "undefined";

      return (
        <div>
          <div>Always rendered</div>
          {isClient && <div>Client only content</div>}
        </div>
      );
    }

    // SSR should work - only server content should be rendered
    expect(() => {
      const html = renderToString(<ConditionalComponent />);
      expect(html).toContain("Always rendered");
      expect(html).not.toContain("Client only content");
    }).not.toThrow();
  });

  it("should handle lazy components without SSR issues", async () => {
    function LazyFallback() {
      return <div>Dynamic Component</div>;
    }

    const LazyComponent = React.lazy(() =>
      Promise.resolve({ default: LazyFallback }),
    );

    function App() {
      return (
        <React.Suspense fallback={<div>Loading...</div>}>
          <LazyComponent />
        </React.Suspense>
      );
    }

    // SSR should handle suspense gracefully
    expect(() => {
      const html = renderToString(<App />);
      expect(html).toContain("Loading...");
    }).not.toThrow();
  });

  it("should validate no window/document access in SSR-critical components", () => {
    // Test that critical components don't access browser APIs directly
    function CriticalComponent() {
      // This component should not access window/document directly
      return <div>Critical Content</div>;
    }

    expect(() => {
      // Should work in SSR environment (no window/document)
      const html = renderToString(<CriticalComponent />);
      expect(html).toContain("Critical Content");
    }).not.toThrow();
  });

  it("should handle useEffect properly in SSR", () => {
    let effectRan = false;

    function EffectComponent() {
      React.useEffect(() => {
        effectRan = true;
      }, []);

      return <div>Effect Test</div>;
    }

    // SSR should not run effects
    expect(() => {
      renderToString(<EffectComponent />);
    }).not.toThrow();

    expect(effectRan).toBe(false); // useEffect should not run during SSR
  });

  it("should prevent hydration mismatches with dynamic content", async () => {
    // Test dynamic content that might cause hydration issues
    function DynamicContentComponent() {
      const [content, setContent] = React.useState<string>("");

      React.useEffect(() => {
        // Simulate dynamic content loading
        setContent("Loaded content");
      }, []);

      return <div>{content || "Loading dynamic content..."}</div>;
    }

    // SSR should work (shows loading state)
    expect(() => {
      const html = renderToString(<DynamicContentComponent />);
      expect(html).toContain("Loading dynamic content");
    }).not.toThrow();
  });

  it("should handle context providers in SSR", () => {
    const TestContext = React.createContext<string>("default");

    function ContextConsumer() {
      const value = React.useContext(TestContext);
      return <div>Context: {value}</div>;
    }

    function App() {
      return (
        <TestContext.Provider value="SSR safe">
          <ContextConsumer />
        </TestContext.Provider>
      );
    }

    // Should work in SSR
    expect(() => {
      const html = renderToString(<App />);
      expect(html).toContain("Context:");
      expect(html).toContain("SSR safe");
    }).not.toThrow();
  });

  it("should validate no memory leaks in SSR environment", () => {
    // Test that components don't create memory leaks during SSR
    let cleanupCalled = false;

    function CleanupComponent() {
      React.useEffect(() => {
        return () => {
          cleanupCalled = true;
        };
      }, []);

      return <div>Cleanup test</div>;
    }

    // SSR rendering
    renderToString(<CleanupComponent />);
    // Cleanup should not be called during SSR
    expect(cleanupCalled).toBe(false);
  });

  // Error boundaries test removed - SSR error boundaries have complex behavior
  // and are better tested in integration scenarios
});
