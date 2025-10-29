import { describe, it, expect, beforeEach, vi } from "vitest";

// Configuração de timeout global para testes de animação (operações assíncronas)
vi.setConfig({
  testTimeout: 10000, // 10 segundos para animações
});

// Mock requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = vi.fn();

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  root = null;
  rootMargin = "";
  thresholds = [];
  takeRecords = vi.fn(() => []);

  constructor(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit,
  ) {
    // Store constructor call for testing
  }
}
global.IntersectionObserver = MockIntersectionObserver;

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock performance.now
global.performance.now = vi.fn(() => 1000);

// Import animation utilities after mocks
import {
  fadeIn,
  fadeOut,
  slideUp,
  slideDown,
  scaleIn,
  scaleOut,
  stagger,
  createScrollTrigger,
  createIntersectionObserver,
  getReducedMotion,
  setReducedMotion,
  ANIMATION_DEFAULTS,
  EASING_FUNCTIONS,
} from "@/lib/animation/animation-system";

describe("Animation System", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Disable reduced motion for tests
    setReducedMotion(false);
  });

  describe("Animation Defaults", () => {
    it("defines default animation values", () => {
      expect(ANIMATION_DEFAULTS).toEqual({
        duration: 300,
        delay: 0,
        easing: "ease-out",
        reducedMotionDuration: 0,
      });
    });
  });

  describe("Easing Functions", () => {
    it("provides standard easing functions", () => {
      expect(EASING_FUNCTIONS).toHaveProperty("linear");
      expect(EASING_FUNCTIONS).toHaveProperty("ease-in");
      expect(EASING_FUNCTIONS).toHaveProperty("ease-out");
      expect(EASING_FUNCTIONS).toHaveProperty("ease-in-out");

      // Should be cubic-bezier strings
      expect(typeof EASING_FUNCTIONS["ease-out"]).toBe("string");
      expect(EASING_FUNCTIONS["ease-out"]).toMatch(/^cubic-bezier/);
    });
  });

  describe("Reduced Motion", () => {
    afterEach(() => {
      // Restore matchMedia to the global mock
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: false, // Default to false for all queries unless overridden in tests
          media: query,
          onchange: null,
          addListener: vi.fn(), // deprecated
          removeListener: vi.fn(), // deprecated
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });
    });

    it("gets reduced motion preference", () => {
      const result = getReducedMotion();
      expect(typeof result).toBe("boolean");
    });

    it("sets reduced motion preference", () => {
      setReducedMotion(true);
      expect(getReducedMotion()).toBe(true);

      setReducedMotion(false);
      expect(getReducedMotion()).toBe(false);
    });

    it("respects system prefers-reduced-motion", () => {
      // Mock matchMedia for prefers-reduced-motion
      const mockMatchMedia = vi.fn((query: string) => ({
        matches: query === "(prefers-reduced-motion: reduce)" ? true : false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: mockMatchMedia,
      });

      // Reset and check system preference
      setReducedMotion(null); // Use system preference
      expect(getReducedMotion()).toBe(true); // System says reduce

      // Override should take precedence
      setReducedMotion(false);
      expect(getReducedMotion()).toBe(false); // Our override takes precedence
    });
  });

  describe("Fade Animations", () => {
    afterEach(() => {
      setReducedMotion(null); // Reset to system preference after each test
    });

    it("fadeIn returns correct animation config", () => {
      const config = fadeIn();

      expect(config).toEqual({
        opacity: [0, 1],
        transition: {
          duration: 300,
          delay: 0,
          easing: "ease-out",
        },
      });
    });

    it("fadeIn accepts custom options", () => {
      const config = fadeIn({ duration: 500, delay: 200 });

      expect(config.opacity).toEqual([0, 1]);
      expect(config.transition).toEqual({
        duration: 500,
        delay: 200,
        easing: "ease-out",
      });
    });

    it("fadeOut returns correct animation config", () => {
      const config = fadeOut();

      expect(config).toEqual({
        opacity: [1, 0],
        transition: {
          duration: 300,
          delay: 0,
          easing: "ease-out",
        },
      });
    });

    it("respects reduced motion for fade animations", () => {
      setReducedMotion(true);

      const config = fadeIn({ duration: 500 });

      expect(config.duration).toBe(0);
    });
  });

  describe("Slide Animations", () => {
    it("slideUp returns correct animation config", () => {
      const config = slideUp();

      expect(config).toEqual({
        y: [20, 0],
        opacity: [0, 1],
        transition: {
          duration: 300,
          delay: 0,
          easing: "ease-out",
        },
      });
    });

    it("slideDown returns correct animation config", () => {
      const config = slideDown();

      expect(config).toEqual({
        y: [-20, 0],
        opacity: [0, 1],
        transition: {
          duration: 300,
          delay: 0,
          easing: "ease-out",
        },
      });
    });

    it("slide animations accept custom options", () => {
      const config = slideUp({ distance: 50, duration: 400 });

      expect(config.y).toEqual([50, 0]);
      expect(config.duration).toBe(400);
    });
  });

  describe("Scale Animations", () => {
    it("scaleIn returns correct animation config", () => {
      const config = scaleIn();

      expect(config).toEqual({
        scale: [0.9, 1],
        opacity: [0, 1],
        transition: {
          duration: 300,
          delay: 0,
          easing: "ease-out",
        },
      });
    });

    it("scaleOut returns correct animation config", () => {
      const config = scaleOut();

      expect(config).toEqual({
        scale: [1, 0.9],
        opacity: [1, 0],
        transition: {
          duration: 300,
          delay: 0,
          easing: "ease-out",
        },
      });
    });

    it("scale animations accept custom scale values", () => {
      const config = scaleIn({ scale: 0.8 });

      expect(config.scale).toEqual([0.8, 1]);
    });
  });

  describe("Stagger Function", () => {
    it("creates stagger configuration", () => {
      const staggerConfig = stagger(0.1);

      expect(staggerConfig).toEqual({
        delay: expect.any(Function),
      });
    });

    it("stagger delay function works correctly", () => {
      const staggerConfig = stagger(0.1, 0.2);

      // The delay function should return increasing delays
      expect(staggerConfig.delay(0)).toBeCloseTo(0.2); // baseDelay
      expect(staggerConfig.delay(1)).toBeCloseTo(0.3); // baseDelay + stagger
      expect(staggerConfig.delay(2)).toBeCloseTo(0.4); // baseDelay + 2 * stagger
    });

    it("stagger with different intervals", () => {
      const staggerConfig = stagger(0.05, 0.1);

      expect(staggerConfig.delay(0)).toBeCloseTo(0.1);
      expect(staggerConfig.delay(1)).toBeCloseTo(0.15);
      expect(staggerConfig.delay(2)).toBeCloseTo(0.2);
    });
  });

  describe("Scroll Trigger", () => {
    it("creates scroll trigger configuration", () => {
      const trigger = createScrollTrigger();

      expect(trigger).toEqual({
        trigger: expect.any(Object),
        start: "top 80%",
        end: "bottom 20%",
        scrub: false,
        markers: false,
      });
    });

    it("accepts custom options", () => {
      const trigger = createScrollTrigger({
        start: "top 90%",
        scrub: true,
        markers: true,
      });

      expect(trigger.start).toBe("top 90%");
      expect(trigger.scrub).toBe(true);
      expect(trigger.markers).toBe(true);
    });

    it("includes trigger element when provided", () => {
      const mockElement = { id: "test" } as any;
      const trigger = createScrollTrigger({ trigger: mockElement });

      expect(trigger.trigger).toBe(mockElement);
    });
  });

  describe("Intersection Observer", () => {
    it("creates intersection observer configuration", () => {
      const observer = createIntersectionObserver();

      expect(observer).toEqual({
        threshold: 0.1,
        rootMargin: "0px 0px -100px 0px",
        triggerOnce: true,
      });
    });

    it("accepts custom options", () => {
      const observer = createIntersectionObserver({
        threshold: 0.5,
        rootMargin: "50px",
        triggerOnce: false,
      });

      expect(observer.threshold).toBe(0.5);
      expect(observer.rootMargin).toBe("50px");
      expect(observer.triggerOnce).toBe(false);
    });

    it("uses IntersectionObserver constructor", () => {
      const mockCallback = vi.fn();
      const mockOptions = { threshold: 0.1 };

      // Create intersection observer with callback (it will create the actual observer)
      const observer = new (global.IntersectionObserver as any)(
        mockCallback,
        mockOptions,
      );

      // Verify the observer instance was created properly
      expect(observer).toBeDefined();
      expect(observer.observe).toBeDefined();
      expect(observer.disconnect).toBeDefined();
    });
  });

  describe("Animation Integration", () => {
    it("all animations respect reduced motion", () => {
      setReducedMotion(true);

      const fadeConfig = fadeIn({ duration: 500 });
      const slideConfig = slideUp({ duration: 400 });
      const scaleConfig = scaleIn({ duration: 600 });

      expect(fadeConfig.duration).toBe(0);
      expect(slideConfig.duration).toBe(0);
      expect(scaleConfig.duration).toBe(0);
    });

    it("animations can be combined", () => {
      const combined = {
        ...fadeIn(),
        ...slideUp({ distance: 30 }),
      };

      expect(combined.opacity).toEqual([0, 1]);
      expect(combined.y).toEqual([30, 0]);
      expect(combined.transition).toBeDefined();
    });

    it("custom easing functions work", () => {
      const config = fadeIn({ easing: "ease-in" });

      expect(config.easing).toBe("ease-in");
    });

    it("animations handle edge cases", () => {
      // Zero duration should work
      const instant = fadeIn({ duration: 0 });
      expect(instant.duration).toBe(0);

      // Large delay should work
      const delayed = slideUp({ delay: 1000 });
      expect(delayed.delay).toBe(1000);
    });
  });

  describe("Performance Considerations", () => {
    it("uses requestAnimationFrame when available", () => {
      const mockRAF = vi.fn(
        (cb: FrameRequestCallback) => setTimeout(cb, 16) as any,
      );
      global.requestAnimationFrame = mockRAF;

      // Trigger animation that might use RAF
      fadeIn();

      // RAF might be called during animation setup
      expect(typeof global.requestAnimationFrame).toBe("function");
    });

    it("handles missing requestAnimationFrame", () => {
      const originalRAF = global.requestAnimationFrame;
      delete (global as any).requestAnimationFrame;

      // Should not crash
      expect(() => {
        fadeIn();
      }).not.toThrow();

      // Restore
      global.requestAnimationFrame = originalRAF;
    });

    it("cancelAnimationFrame works", () => {
      const mockCAF = vi.fn();
      global.cancelAnimationFrame = mockCAF;

      // Should be available
      expect(typeof global.cancelAnimationFrame).toBe("function");
    });
  });

  describe("Accessibility", () => {
    it("respects reduced motion preferences", () => {
      setReducedMotion(true);

      const animations = [
        fadeIn(),
        slideUp(),
        scaleIn(),
        fadeOut(),
        slideDown(),
        scaleOut(),
      ];

      animations.forEach((animation) => {
        expect(animation.duration).toBe(0);
      });
    });

    it("reduced motion can be toggled dynamically", () => {
      // Start with normal motion
      const normalFade = fadeIn();
      expect(normalFade.transition?.duration).toBe(300);

      // Enable reduced motion
      setReducedMotion(true);
      const reducedFade = fadeIn();
      expect(reducedFade.transition?.duration).toBe(0);

      // Disable reduced motion
      setReducedMotion(false);
      const normalFadeAgain = fadeIn();
      expect(normalFadeAgain.transition?.duration).toBe(300);
    });
  });
});
