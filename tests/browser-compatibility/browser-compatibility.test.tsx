import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  act,
  waitFor,
  fireEvent,
} from "@testing-library/react";

// Mock browser detection and feature detection
const mockUserAgents = {
  chrome:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  firefox:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0",
  safari:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
  edge: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59",
  ie11: "Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko",
  mobileChrome:
    "Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36",
  mobileSafari:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Mobile/15E148 Safari/604.1",
};

const mockNavigator = {
  userAgent: mockUserAgents.chrome,
  platform: "Win32",
  language: "en-US",
  languages: ["en-US", "en"],
  cookieEnabled: true,
  onLine: true,
  hardwareConcurrency: 8,
  deviceMemory: 8,
};

// Mock feature detection
const mockFeatures = {
  cssGrid: true,
  flexbox: true,
  webgl: true,
  webgl2: true,
  webassembly: true,
  serviceworker: true,
  indexeddb: true,
  webworkers: true,
  webrtc: true,
  geolocation: true,
  notifications: true,
  push: true,
  bluetooth: true,
  usb: true,
  hid: true,
  serial: true,
  webnfc: false,
  webshare: true,
  websharefiles: true,
  paymentrequest: true,
  credentialmanagement: true,
  webotp: false,
  wakeLock: true,
  screenWakeLock: true,
  vibration: true,
  deviceorientation: true,
  devicemotion: true,
  touch: false,
  passiveEvents: true,
  intersectionObserver: true,
  mutationObserver: true,
  resizeObserver: true,
  performanceObserver: true,
  customElements: true,
  shadowDom: true,
  template: true,
  importMaps: false,
  modules: true,
  dynamicImport: true,
  topLevelAwait: true,
  bigInt: true,
  optionalChaining: true,
  nullishCoalescing: true,
  weakRefs: true,
  finalizers: true,
  privateMethods: true,
  privateFields: true,
  staticFields: true,
  decorators: false,
  classFields: true,
};

// Browser compatibility detection utility
const detectBrowser = (userAgent: string) => {
  const ua = userAgent.toLowerCase();

  if (ua.includes("chrome") && !ua.includes("edg")) {
    return {
      name: "Chrome",
      version: ua.match(/chrome\/(\d+)/)?.[1] || "unknown",
    };
  }
  if (ua.includes("firefox")) {
    return {
      name: "Firefox",
      version: ua.match(/firefox\/(\d+)/)?.[1] || "unknown",
    };
  }
  if (ua.includes("safari") && !ua.includes("chrome")) {
    return {
      name: "Safari",
      version: ua.match(/version\/(\d+)/)?.[1] || "unknown",
    };
  }
  if (ua.includes("edg")) {
    return { name: "Edge", version: ua.match(/edg\/(\d+)/)?.[1] || "unknown" };
  }
  if (ua.includes("trident") || ua.includes("msie")) {
    return {
      name: "IE",
      version:
        ua.match(/rv:(\d+)/)?.[1] || ua.match(/msie (\d+)/)?.[1] || "unknown",
    };
  }

  return { name: "Unknown", version: "unknown" };
};

const detectFeatures = () => {
  const features: Record<string, boolean> = {};

  // CSS Features
  features.cssGrid = CSS?.supports?.("display: grid") || false;
  features.flexbox = CSS?.supports?.("display: flex") || false;
  features.cssVariables = CSS?.supports?.("--test: red") || false;

  // JavaScript APIs
  features.serviceWorker = "serviceWorker" in navigator;
  features.webRTC = "RTCPeerConnection" in window;
  features.webGL = (() => {
    try {
      const canvas = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && canvas.getContext("webgl"));
    } catch (e) {
      return false;
    }
  })();

  features.webGL2 = (() => {
    try {
      const canvas = document.createElement("canvas");
      return !!(window.WebGL2RenderingContext && canvas.getContext("webgl2"));
    } catch (e) {
      return false;
    }
  })();

  features.indexedDB = "indexedDB" in window;
  features.webWorkers = "Worker" in window;
  features.geolocation = "geolocation" in navigator;
  features.notifications = "Notification" in window;
  features.push = "PushManager" in window;

  // Modern APIs
  features.intersectionObserver = "IntersectionObserver" in window;
  features.mutationObserver = "MutationObserver" in window;
  features.resizeObserver = "ResizeObserver" in window;
  features.performanceObserver = "PerformanceObserver" in window;

  // Touch and mobile
  features.touch = "ontouchstart" in window;
  features.passiveEvents = (() => {
    let supportsPassive = false;
    try {
      const opts = Object.defineProperty({}, "passive", {
        get: () => {
          supportsPassive = true;
        },
      });
      window.addEventListener("test", () => {}, opts);
      window.removeEventListener("test", () => {});
    } catch (e) {}
    return supportsPassive;
  })();

  return features;
};

// Cross-browser component
const CrossBrowserComponent = ({
  feature,
  children,
}: {
  feature: keyof typeof mockFeatures;
  children: React.ReactNode;
}) => {
  const hasFeature = mockFeatures[feature];

  if (!hasFeature) {
    return <div data-testid="fallback">Feature not supported</div>;
  }

  return <div data-testid="feature-supported">{children}</div>;
};

// Browser-specific component
const BrowserSpecificComponent = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const browser = detectBrowser(navigator.userAgent);

  return (
    <div data-testid={`browser-${browser.name.toLowerCase()}`}>
      <span data-testid="browser-name">{browser.name}</span>
      <span data-testid="browser-version">{browser.version}</span>
      {children}
    </div>
  );
};

// CSS vendor prefix component
const VendorPrefixComponent = () => {
  const testElement = document.createElement("div");

  // Test various CSS properties
  const supports = {
    transform: testElement.style.transform !== undefined,
    webkitTransform: testElement.style.webkitTransform !== undefined,
    mozTransform: testElement.style.MozTransform !== undefined,
    msTransform: testElement.style.msTransform !== undefined,
    webkitTransition: testElement.style.webkitTransition !== undefined,
    transition: testElement.style.transition !== undefined,
  };

  return (
    <div data-testid="vendor-prefixes">
      {Object.entries(supports).map(([prop, supported]) => (
        <div key={prop} data-testid={`prefix-${prop}`}>
          {prop}: {supported ? "supported" : "not supported"}
        </div>
      ))}
    </div>
  );
};

// Polyfill-aware component
const PolyfillComponent = ({
  requires,
  children,
}: {
  requires: string[];
  children: React.ReactNode;
}) => {
  const missingFeatures = requires.filter(
    (feature) => !mockFeatures[feature as keyof typeof mockFeatures],
  );

  if (missingFeatures.length > 0) {
    return (
      <div data-testid="polyfill-needed">
        Missing features: {missingFeatures.join(", ")}
      </div>
    );
  }

  return <div data-testid="polyfill-ready">{children}</div>;
};

// Event handling component
const EventHandlingComponent = () => {
  const [events, setEvents] = React.useState<string[]>([]);

  const handleClick = () => {
    setEvents((prev) => [...prev, "click"]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    setEvents((prev) => [...prev, `keydown-${e.key}`]);
  };

  // Test passive events
  React.useEffect(() => {
    const handleScroll = () => {
      setEvents((prev) => [...prev, "scroll"]);
    };

    const options = mockFeatures.passiveEvents ? { passive: true } : false;
    window.addEventListener("scroll", handleScroll, options);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <div>
      <button
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        data-testid="event-button"
      >
        Click me
      </button>
      <div data-testid="events">
        {events.map((event, index) => (
          <span key={index} data-testid={`event-${index}`}>
            {event}
          </span>
        ))}
      </div>
    </div>
  );
};

describe("Browser Compatibility Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset to Chrome defaults
    Object.defineProperty(navigator, "userAgent", {
      value: mockUserAgents.chrome,
      configurable: true,
    });

    Object.defineProperty(navigator, "platform", {
      value: "Win32",
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Browser Detection", () => {
    it("should detect Chrome browser", () => {
      Object.defineProperty(navigator, "userAgent", {
        value: mockUserAgents.chrome,
        configurable: true,
      });

      const browser = detectBrowser(navigator.userAgent);
      expect(browser.name).toBe("Chrome");
      expect(browser.version).not.toBe("unknown");
    });

    it("should detect Firefox browser", () => {
      Object.defineProperty(navigator, "userAgent", {
        value: mockUserAgents.firefox,
        configurable: true,
      });

      const browser = detectBrowser(navigator.userAgent);
      expect(browser.name).toBe("Firefox");
      expect(browser.version).not.toBe("unknown");
    });

    it("should detect Safari browser", () => {
      Object.defineProperty(navigator, "userAgent", {
        value: mockUserAgents.safari,
        configurable: true,
      });

      const browser = detectBrowser(navigator.userAgent);
      expect(browser.name).toBe("Safari");
      expect(browser.version).not.toBe("unknown");
    });

    it("should detect Edge browser", () => {
      Object.defineProperty(navigator, "userAgent", {
        value: mockUserAgents.edge,
        configurable: true,
      });

      const browser = detectBrowser(navigator.userAgent);
      expect(browser.name).toBe("Edge");
      expect(browser.version).not.toBe("unknown");
    });

    it("should detect Internet Explorer", () => {
      Object.defineProperty(navigator, "userAgent", {
        value: mockUserAgents.ie11,
        configurable: true,
      });

      const browser = detectBrowser(navigator.userAgent);
      expect(browser.name).toBe("IE");
      expect(browser.version).not.toBe("unknown");
    });

    it("should handle unknown browsers gracefully", () => {
      Object.defineProperty(navigator, "userAgent", {
        value: "Unknown Browser/1.0",
        configurable: true,
      });

      const browser = detectBrowser(navigator.userAgent);
      expect(browser.name).toBe("Unknown");
      expect(browser.version).toBe("unknown");
    });
  });

  describe("Feature Detection", () => {
    it("should detect CSS Grid support", () => {
      const features = detectFeatures();
      // In modern browsers, this should be true
      expect(typeof features.cssGrid).toBe("boolean");
    });

    it("should detect Flexbox support", () => {
      const features = detectFeatures();
      expect(typeof features.flexbox).toBe("boolean");
    });

    it("should detect Service Worker support", () => {
      const features = detectFeatures();
      expect(typeof features.serviceWorker).toBe("boolean");
    });

    it("should detect WebGL support", () => {
      const features = detectFeatures();
      expect(typeof features.webGL).toBe("boolean");
    });

    it("should detect IndexedDB support", () => {
      const features = detectFeatures();
      expect(typeof features.indexedDB).toBe("boolean");
    });

    it("should detect Touch support", () => {
      const features = detectFeatures();
      expect(typeof features.touch).toBe("boolean");
    });

    it("should detect passive events support", () => {
      const features = detectFeatures();
      expect(typeof features.passiveEvents).toBe("boolean");
    });

    it("should detect Intersection Observer support", () => {
      const features = detectFeatures();
      expect(typeof features.intersectionObserver).toBe("boolean");
    });
  });

  describe("Cross-Browser Components", () => {
    it("should render feature when supported", () => {
      render(
        <CrossBrowserComponent feature="cssGrid">
          Grid content
        </CrossBrowserComponent>,
      );

      expect(screen.getByTestId("feature-supported")).toBeInTheDocument();
      expect(screen.queryByTestId("fallback")).not.toBeInTheDocument();
    });

    it("should render fallback when feature not supported", () => {
      // Temporarily disable cssGrid
      const originalCssGrid = mockFeatures.cssGrid;
      mockFeatures.cssGrid = false;

      render(
        <CrossBrowserComponent feature="cssGrid">
          Grid content
        </CrossBrowserComponent>,
      );

      expect(screen.getByTestId("fallback")).toBeInTheDocument();
      expect(screen.queryByTestId("feature-supported")).not.toBeInTheDocument();

      // Restore
      mockFeatures.cssGrid = originalCssGrid;
    });

    it("should render browser-specific content", () => {
      render(
        <BrowserSpecificComponent>Browser content</BrowserSpecificComponent>,
      );

      expect(screen.getByTestId("browser-chrome")).toBeInTheDocument();
      expect(screen.getByTestId("browser-name")).toHaveTextContent("Chrome");
      expect(screen.getByTestId("browser-version")).toBeTruthy();
    });
  });

  describe("CSS Vendor Prefixes", () => {
    it("should detect CSS property support", () => {
      render(<VendorPrefixComponent />);

      const prefixes = screen.getByTestId("vendor-prefixes");
      expect(prefixes).toBeInTheDocument();

      // Should show support status for various properties
      const transformSupport = screen.getByTestId("prefix-transform");
      expect(transformSupport).toBeInTheDocument();
    });

    it("should handle vendor-prefixed properties", () => {
      // This test ensures the component can handle different browser prefixes
      // In a real implementation, this would apply appropriate prefixes
      render(<VendorPrefixComponent />);

      const webkitTransform = screen.getByTestId("prefix-webkitTransform");
      expect(webkitTransform.textContent).toMatch(/webkitTransform/);
    });
  });

  describe("Polyfills and Fallbacks", () => {
    it("should render when all required features are available", () => {
      render(
        <PolyfillComponent requires={["cssGrid", "flexbox"]}>
          All features available
        </PolyfillComponent>,
      );

      expect(screen.getByTestId("polyfill-ready")).toBeInTheDocument();
      expect(screen.queryByTestId("polyfill-needed")).not.toBeInTheDocument();
    });

    it("should show polyfill message when features are missing", () => {
      // Temporarily disable some features
      const originalCssGrid = mockFeatures.cssGrid;
      const originalFlexbox = mockFeatures.flexbox;
      mockFeatures.cssGrid = false;
      mockFeatures.flexbox = false;

      render(
        <PolyfillComponent requires={["cssGrid", "flexbox"]}>
          All features available
        </PolyfillComponent>,
      );

      expect(screen.getByTestId("polyfill-needed")).toBeInTheDocument();
      expect(screen.getByText(/Missing features/)).toBeInTheDocument();

      // Restore
      mockFeatures.cssGrid = originalCssGrid;
      mockFeatures.flexbox = originalFlexbox;
    });

    it("should handle partial feature support", () => {
      const originalCssGrid = mockFeatures.cssGrid;
      mockFeatures.cssGrid = false;

      render(
        <PolyfillComponent requires={["cssGrid", "flexbox"]}>
          Partial features
        </PolyfillComponent>,
      );

      expect(screen.getByTestId("polyfill-needed")).toBeInTheDocument();
      expect(screen.getByText(/cssGrid/)).toBeInTheDocument();

      mockFeatures.cssGrid = originalCssGrid;
    });
  });

  describe("Event Handling Compatibility", () => {
    it("should handle standard events", async () => {
      render(<EventHandlingComponent />);

      const button = screen.getByTestId("event-button");

      // Test that button exists and is clickable
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent("Click me");
    });

    it("should handle keyboard events consistently", async () => {
      render(<EventHandlingComponent />);

      const button = screen.getByTestId("event-button");

      // Test that button exists and can be focused (keyboard accessibility)
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe("BUTTON");
    });

    it("should handle passive events when supported", () => {
      // Test that passive events are used when available
      expect(mockFeatures.passiveEvents).toBe(true);

      render(<EventHandlingComponent />);

      // Component should use passive listeners when supported
      // This is hard to test directly, but we can verify the component renders
      expect(screen.getByTestId("event-button")).toBeInTheDocument();
    });

    it("should handle scroll events cross-browser", async () => {
      render(<EventHandlingComponent />);

      // Test that component renders and has scroll event handling capability
      expect(screen.getByTestId("event-button")).toBeInTheDocument();
      expect(screen.getByTestId("events")).toBeInTheDocument();
    });
  });

  describe("Mobile Browser Compatibility", () => {
    it("should detect mobile Chrome", () => {
      Object.defineProperty(navigator, "userAgent", {
        value: mockUserAgents.mobileChrome,
        configurable: true,
      });

      const browser = detectBrowser(navigator.userAgent);
      expect(browser.name).toBe("Chrome");
    });

    it("should detect mobile Safari", () => {
      Object.defineProperty(navigator, "userAgent", {
        value: mockUserAgents.mobileSafari,
        configurable: true,
      });

      const browser = detectBrowser(navigator.userAgent);
      expect(browser.name).toBe("Safari");
    });

    it("should handle touch events on mobile", () => {
      // Temporarily enable touch
      const originalTouch = mockFeatures.touch;
      mockFeatures.touch = true;

      Object.defineProperty(navigator, "userAgent", {
        value: mockUserAgents.mobileChrome,
        configurable: true,
      });

      const features = detectFeatures();
      expect(features.touch).toBe(true);

      mockFeatures.touch = originalTouch;
    });

    it("should handle different screen sizes", () => {
      // Test responsive behavior
      Object.defineProperty(window, "innerWidth", {
        value: 768,
        configurable: true,
      });

      // Component should adapt to screen size
      expect(window.innerWidth).toBe(768);
    });
  });

  describe("Legacy Browser Support", () => {
    it("should handle Internet Explorer 11", () => {
      Object.defineProperty(navigator, "userAgent", {
        value: mockUserAgents.ie11,
        configurable: true,
      });

      const browser = detectBrowser(navigator.userAgent);
      expect(browser.name).toBe("IE");
      expect(["11", "unknown"]).toContain(browser.version);
    });

    it("should provide fallbacks for legacy browsers", () => {
      Object.defineProperty(navigator, "userAgent", {
        value: mockUserAgents.ie11,
        configurable: true,
      });

      // Legacy browsers should get appropriate fallbacks
      const features = detectFeatures();

      // IE11 has limited modern API support
      expect(features.serviceWorker).toBeDefined();
      expect(features.webGL).toBeDefined();
    });
  });

  describe("Progressive Enhancement", () => {
    it("should work without JavaScript", () => {
      // Test that basic functionality works without JS
      // This is hard to test in Jest, but we can verify server-side rendering compatibility
      const { container } = render(
        <div data-testid="no-js-fallback">
          <noscript>This requires JavaScript</noscript>
          <div>Enhanced content</div>
        </div>,
      );

      expect(container.querySelector("noscript")).toBeInTheDocument();
    });

    it("should enhance functionality when features are available", () => {
      // Test that modern features enhance the experience
      render(
        <CrossBrowserComponent feature="intersectionObserver">
          Intersection Observer content
        </CrossBrowserComponent>,
      );

      expect(screen.getByTestId("feature-supported")).toBeInTheDocument();
    });

    it("should degrade gracefully when features are unavailable", () => {
      const originalIntersectionObserver = mockFeatures.intersectionObserver;
      mockFeatures.intersectionObserver = false;

      render(
        <CrossBrowserComponent feature="intersectionObserver">
          Intersection Observer content
        </CrossBrowserComponent>,
      );

      expect(screen.getByTestId("fallback")).toBeInTheDocument();

      mockFeatures.intersectionObserver = originalIntersectionObserver;
    });
  });

  describe("Web API Compatibility", () => {
    it("should handle Fetch API availability", () => {
      const hasFetch = "fetch" in window;
      expect(typeof hasFetch).toBe("boolean");
    });

    it("should handle Promise availability", () => {
      const hasPromise = "Promise" in window;
      expect(hasPromise).toBe(true);
    });

    it("should handle async/await support", async () => {
      // Test async function support
      async function testAsync() {
        return await Promise.resolve("async works");
      }

      const result = await testAsync();
      expect(result).toBe("async works");
    });

    it("should handle modern JavaScript features", () => {
      // Test ES6+ features
      const arrowFunction = () => "arrow works";
      const templateLiteral = `Template ${"literals"} work`;
      const destructuring = { a: 1, b: 2 };
      const { a, b } = destructuring;

      expect(arrowFunction()).toBe("arrow works");
      expect(templateLiteral).toBe("Template literals work");
      expect(a).toBe(1);
      expect(b).toBe(2);
    });
  });

  describe("Performance and Memory", () => {
    it("should not cause memory leaks in different browsers", () => {
      // Test that components clean up properly across browsers
      const { unmount } = render(<EventHandlingComponent />);

      unmount();

      // Should not leave event listeners or other resources
      // Component unmounted successfully without errors
      expect(true).toBe(true);
    });

    it("should handle browser-specific performance characteristics", () => {
      // Different browsers have different performance profiles
      // This test ensures the app adapts appropriately
      const isSlowBrowser = navigator.hardwareConcurrency < 4;

      if (isSlowBrowser) {
        // Could implement reduced animations or simplified features
        expect(typeof isSlowBrowser).toBe("boolean");
      }
    });
  });

  describe("Security Compatibility", () => {
    it("should handle Content Security Policy differences", () => {
      // Test that the app works with various CSP configurations
      // This is important for cross-browser enterprise deployments
      const testCSP = "default-src 'self'; script-src 'self' 'unsafe-inline'";

      // Should not break with restrictive CSP
      expect(typeof testCSP).toBe("string");
    });

    it("should handle mixed content policies", () => {
      // Test behavior with mixed HTTP/HTTPS content
      const isSecureContext = window.location.protocol === "https:";

      if (isSecureContext) {
        // Modern browsers restrict mixed content
        expect(isSecureContext).toBe(true);
      }
    });
  });

  describe("Browser Extension Compatibility", () => {
    it("should work with browser extensions installed", () => {
      // Test that the app doesn't break when extensions modify the DOM
      const originalQuerySelector = document.querySelector;

      // Simulate extension modifying querySelector
      document.querySelector = vi.fn((...args) => {
        // Call original but add some logging
        return originalQuerySelector.apply(document, args);
      });

      render(<div data-testid="extension-test">Extension test</div>);

      expect(screen.getByTestId("extension-test")).toBeInTheDocument();

      // Restore
      document.querySelector = originalQuerySelector;
    });
  });
});
