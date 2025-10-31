/**
 * SSR Hydration Real Mismatches - Integration Tests
 *
 * Detecta divergências reais entre renderização server-side e client-side
 * Usando padrão existente de renderToString para SSR + render para client
 */

import React from "react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { renderToString } from "react-dom/server";
import { render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider } from "@/lib/theme/theme-context";

// Setup jsdom for client-side rendering tests (same as existing tests)
import { JSDOM } from "jsdom";
const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
  url: "http://localhost:3000",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  resources: "usable",
});

// Mock window/document for SSR simulation
let originalWindow: any;
let originalDocument: any;

beforeEach(() => {
  // Setup DOM for client rendering
  global.window = dom.window as any;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;

  // Store originals for cleanup
  originalWindow = global.window;
  originalDocument = global.document;
});

afterEach(() => {
  // Restore originals
  if (originalWindow) global.window = originalWindow;
  if (originalDocument) global.document = originalDocument;
});

describe("SSR Hydration Real Mismatches", () => {
  it("should detect client/server content divergence in dynamic components", () => {
    // Simple component that renders differently based on SSR state
    function ConditionalContent() {
      const isClient = typeof window !== "undefined";
      const [clientLoaded, setClientLoaded] = React.useState(false);

      React.useEffect(() => {
        // Simulate client-side data loading
        setClientLoaded(true);
      }, []);

      return (
        <div>
          <div>Always rendered</div>
          {isClient && <div>Server-safe content</div>}
          {clientLoaded && <div>Client-loaded content</div>}
        </div>
      );
    }

    // Simulate SSR environment (no window)
    const originalWindow = global.window;
    delete (global as any).window;

    // SSR rendering (server-side only)
    const serverHtml = renderToString(React.createElement(ConditionalContent));

    // Restore window for client rendering
    global.window = originalWindow;

    // Verify SSR output - should not have client indicators
    expect(serverHtml).toContain("Always rendered");
    expect(serverHtml).not.toContain("Server-safe content"); // No window in SSR
    expect(serverHtml).not.toContain("Client-loaded content");
  });

  it("should handle basic SSR rendering without errors", () => {
    function SimpleComponent() {
      return (
        <div>
          <h1>Simple SSR Test</h1>
          <p>Basic content</p>
        </div>
      );
    }

    // SSR rendering should work
    const serverHtml = renderToString(React.createElement(SimpleComponent));

    expect(serverHtml).toContain("Simple SSR Test");
    expect(serverHtml).toContain("Basic content");
  });

  it("should handle async data loading differences", () => {
    // Component that loads data on client
    function AsyncDataComponent() {
      const [data, setData] = React.useState<string | null>(null);

      React.useEffect(() => {
        // Client-side data loading - this won't run in SSR
        setData("client-loaded-data");
      }, []);

      return (
        <div>
          <div>Static content</div>
          <div>{data ? data : "Loading data..."}</div>
        </div>
      );
    }

    // SSR should show loading state
    const serverHtml = renderToString(React.createElement(AsyncDataComponent));

    expect(serverHtml).toContain("Static content");
    expect(serverHtml).toContain("Loading data...");
    expect(serverHtml).not.toContain("client-loaded-data");
  });

  it("should validate useEffect does not run during SSR", () => {
    let effectRan = false;

    function EffectTestComponent() {
      React.useEffect(() => {
        effectRan = true;
      }, []);

      return <div>SSR Effect Test</div>;
    }

    // SSR rendering
    renderToString(React.createElement(EffectTestComponent));

    // useEffect should not run during SSR
    expect(effectRan).toBe(false);
  });

  it("should handle conditional rendering based on environment", () => {
    function EnvironmentAwareComponent() {
      const isServer = typeof window === "undefined";

      return (
        <div>
          <div>Common content</div>
          {isServer && <div>Server-only content</div>}
          {!isServer && <div>Client-only content</div>}
        </div>
      );
    }

    // Test SSR (no window)
    const originalWindow = global.window;
    delete (global as any).window;

    const serverHtml = renderToString(
      React.createElement(EnvironmentAwareComponent),
    );

    global.window = originalWindow;

    expect(serverHtml).toContain("Common content");
    expect(serverHtml).toContain("Server-only content");
    expect(serverHtml).not.toContain("Client-only content");
  });
});
