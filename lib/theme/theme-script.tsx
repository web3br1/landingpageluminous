"use client";

import { useEffect } from "react";

// Critical theme variables that prevent FOUC
const CRITICAL_THEME_VARS = {
  background: "--background",
  foreground: "--foreground",
  surface: "--surface-1",
  "card-background": "--surface-2",
  border: "--border",
  primary: "--primary",
  "primary-foreground": "--primary-foreground",
  muted: "--muted",
  "muted-foreground": "--muted-foreground",
};

// Generate inline styles for critical theme variables
function generateCriticalStyles(themeId: string): string {
  // Default Liquid Glass values for SSR
  const defaultValues = {
    "--background": "oklch(99% 0.02 250)",
    "--foreground": "oklch(16% 0.03 260)",
    "--surface-1": "oklch(99% 0.02 250)",
    "--surface-2": "oklch(95% 0.01 250)",
    "--border": "oklch(88% 0.02 250)",
    "--primary": "oklch(63% 0.18 270)",
    "--primary-foreground": "oklch(98% 0.01 250)",
    "--muted": "oklch(85% 0.02 250)",
    "--muted-foreground": "oklch(45% 0.03 260)",
  };

  // Override with theme-specific values if available
  const themeOverrides: Record<string, Partial<typeof defaultValues>> = {
    "tech-blueprint": {
      "--background": "oklch(20% 0.03 220)",
      "--foreground": "oklch(95% 0.03 220)",
      "--surface-1": "oklch(20% 0.03 220)",
      "--surface-2": "oklch(22% 0.04 220)",
      "--border": "oklch(25% 0.08 220)",
      "--primary": "oklch(60% 0.23 200)",
      "--primary-foreground": "oklch(95% 0.03 220)",
      "--muted": "oklch(25% 0.02 220)",
      "--muted-foreground": "oklch(70% 0.05 220)",
    },
    "cyber-neon": {
      "--background": "oklch(12% 0.03 280)",
      "--foreground": "oklch(95% 0.03 280)",
      "--surface-1": "oklch(15% 0.03 280)",
      "--surface-2": "oklch(18% 0.04 280)",
      "--border": "oklch(25% 0.08 280)",
      "--primary": "oklch(72% 0.23 320)",
      "--primary-foreground": "oklch(95% 0.03 280)",
      "--muted": "oklch(20% 0.02 280)",
      "--muted-foreground": "oklch(65% 0.05 280)",
    },
  };

  const themeValues = { ...defaultValues, ...(themeOverrides[themeId] || {}) };

  return Object.entries(themeValues)
    .map(([prop, value]) => `${prop}: ${value}`)
    .join("; ");
}

// Generate CSS for critical elements
function generateCriticalCSS(themeId: string): string {
  const criticalStyles = generateCriticalStyles(themeId);

  return `
    :root[data-theme="${themeId}"] {
      ${criticalStyles}
    }

    /* Prevent FOUC by setting critical styles immediately */
    html[data-theme="${themeId}"] body {
      background-color: var(--background);
      color: var(--foreground);
      transition: none; /* Disable transitions during initial load */
    }

    html[data-theme="${themeId}"] .card,
    html[data-theme="${themeId}"] .bg-surface-2 {
      background-color: var(--surface-2);
      border-color: var(--border);
    }

    html[data-theme="${themeId}"] .btn-primary {
      background-color: var(--primary);
      color: var(--primary-foreground);
    }

    html[data-theme="${themeId}"] .text-muted {
      color: var(--muted-foreground);
    }

    /* Re-enable transitions after load */
    html[data-theme]:not([data-loading]) body,
    html[data-theme]:not([data-loading]) .card,
    html[data-theme]:not([data-loading]) .btn-primary {
      transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
    }
  `.trim();
}

interface ThemeScriptProps {
  themeId?: string;
  nonce?: string;
}

// SSR-safe theme script that prevents FOUC
export function ThemeScript({
  themeId = "liquid-glass",
  nonce,
}: ThemeScriptProps) {
  // Generate critical CSS inline for SSR
  const criticalCSS = generateCriticalCSS(themeId);

  // Client-side script for theme management (moved to layout.tsx inline script)
  const scriptContent = `
    // Theme script moved to layout.tsx inline script to prevent hydration mismatch
    console.log('🎨 Theme script loaded:', '${themeId}');
  `;

  return (
    <>
      {/* Critical CSS inline to prevent FOUC */}
      <style
        dangerouslySetInnerHTML={{ __html: criticalCSS }}
        nonce={nonce}
        data-theme-critical
      />

      {/* Theme initialization script */}
      <script
        dangerouslySetInnerHTML={{ __html: scriptContent }}
        nonce={nonce}
        data-theme-script
      />
    </>
  );
}

// Hook for client-side theme management
export function useThemeScript() {
  useEffect(() => {
    // Ensure loading state is removed
    const timer = setTimeout(() => {
      document.documentElement.removeAttribute("data-loading");
    }, 100);

    return () => clearTimeout(timer);
  }, []);
}
