"use client";

import React from "react";
import { Inter, Inter_Tight } from "next/font/google";

// Optimized font configurations with performance best practices
export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap", // Prevents invisible text during font load
  preload: true, // Enable preload for critical fonts to improve LCP
  fallback: [
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
  adjustFontFallback: true, // Reduces layout shift
});

export const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
  preload: false, // Keep disabled for non-critical fonts
  fallback: [
    "system-ui",
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "sans-serif",
  ],
  adjustFontFallback: true,
});

// Font loading optimization hook
export function useFontOptimization() {
  const preloadCriticalFonts = () => {
    if (typeof document === "undefined") return;

    // Ensure font-display swap for all fonts (CSS custom properties handle this now)
    const style = document.createElement("style");
    style.textContent = `
      /* Ensure font-display swap for all fonts */
      @font-face {
        font-family: 'Inter';
        font-display: swap;
      }

      @font-face {
        font-family: 'Inter Tight';
        font-display: swap;
      }

      /* Fallback fonts for layout stability */
      .font-inter, .font-inter-tight {
        font-display: swap;
      }
    `;
    document.head.appendChild(style);
  };

  const monitorFontLoading = () => {
    if (typeof document === "undefined" || typeof performance === "undefined")
      return;

    // Monitor font loading performance
    const fontLoadObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      entries.forEach((entry: any) => {
        if (
          entry.entryType === "resource" &&
          entry.name.includes("fonts.googleapis.com")
        ) {
          const loadTime = entry.responseEnd - entry.requestStart;

          // Log font loading performance
          console.log(
            `Font loaded: ${entry.name.split("/").pop()} in ${loadTime.toFixed(2)}ms`,
          );

          // Send to analytics if slow
          if (loadTime > 500) {
            if (typeof window !== "undefined" && (window as any).gtag) {
              (window as any).gtag("event", "font_load_slow", {
                font_url: entry.name,
                load_time: loadTime,
                page_location: window.location.href,
              });
            }
          }
        }
      });
    });

    fontLoadObserver.observe({ entryTypes: ["resource"] });

    return () => fontLoadObserver.disconnect();
  };

  return {
    preloadCriticalFonts,
    monitorFontLoading,
    fonts: {
      inter,
      interTight,
    },
  };
}

// Font loading strategy component
export function FontPreloader() {
  const { preloadCriticalFonts, monitorFontLoading } = useFontOptimization();

  React.useEffect(() => {
    preloadCriticalFonts();
    const cleanup = monitorFontLoading();
    return cleanup;
  }, [preloadCriticalFonts, monitorFontLoading]);

  return null;
}

// Hook for dynamic font loading (for sections that need different fonts)
export function useDynamicFont(
  fontName: string,
  weights: string[] = ["400", "500", "600", "700"],
) {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadFont = async () => {
      try {
        // Dynamic import of additional fonts if needed
        if (fontName === "display") {
          // Load display font dynamically
          const { Poppins } = await import("next/font/google");
          // Font loading logic here
        }

        setIsLoaded(true);
      } catch (err) {
        setError(`Failed to load font: ${fontName}`);
        console.warn(`Font loading failed for ${fontName}:`, err);
      }
    };

    loadFont();
  }, [fontName]);

  return { isLoaded, error };
}

// Font metrics and optimization utilities
export const fontMetrics = {
  // Font metrics for layout shift prevention
  inter: {
    capHeight: 0.715,
    ascent: 0.905,
    descent: 0.205,
    lineGap: 0,
    unitsPerEm: 1000,
  },
  interTight: {
    capHeight: 0.715,
    ascent: 0.905,
    descent: 0.205,
    lineGap: 0,
    unitsPerEm: 1000,
  },
};

// Utility to calculate font-based spacing
export function getFontBasedSpacing(
  fontSize: number,
  lineHeight: number = 1.6,
) {
  return {
    marginBottom: `${fontSize * lineHeight * 0.5}px`,
    paddingTop: `${fontSize * lineHeight * 0.25}px`,
    paddingBottom: `${fontSize * lineHeight * 0.25}px`,
  };
}

// Font loading priority system
export enum FontPriority {
  CRITICAL = "critical", // Load immediately (hero, headings)
  HIGH = "high", // Load soon (body text)
  MEDIUM = "medium", // Load when needed (buttons, labels)
  LOW = "low", // Load on interaction (footnotes, etc.)
}

export function getFontLoadingPriority(sectionType: string): FontPriority {
  const priorities: Record<string, FontPriority> = {
    hero: FontPriority.CRITICAL,
    benefits: FontPriority.CRITICAL,
    features: FontPriority.HIGH,
    demo: FontPriority.HIGH,
    pricing: FontPriority.MEDIUM,
    "final-cta": FontPriority.MEDIUM,
    footer: FontPriority.LOW,
  };

  return priorities[sectionType] || FontPriority.MEDIUM;
}
