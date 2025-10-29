// ===== CRITICAL CSS GENERATOR =====
// Pure function to generate critical CSS - DETERMINISTIC based on theme only
// Extracted from layout.tsx for better testability

// Critical tokens for first paint - same values used in SSR and client
const CRITICAL_TOKENS = {
  "liquid-glass": {
    background: "hsl(210 20% 98%)",
    foreground: "hsl(210 15% 22%)",
    card: "hsl(0 0% 100%)",
    "card-foreground": "hsl(210 15% 22%)",
    border: "hsl(210 13% 92%)",
    primary: "hsl(258 90% 60%)",
    "primary-foreground": "hsl(0 0% 100%)",
  },
  "tech-blueprint": {
    background: "hsl(220 25% 12%)",
    foreground: "hsl(220 10% 95%)",
    card: "hsl(220 20% 18%)",
    "card-foreground": "hsl(220 10% 95%)",
    border: "hsl(220 15% 30%)",
    primary: "hsl(200 80% 60%)",
    "primary-foreground": "hsl(220 25% 12%)",
  },
} as const;

/**
 * Pure function to generate critical CSS - DETERMINISTIC based on theme only
 * @param theme - Theme identifier (e.g., 'liquid-glass', 'tech-blueprint')
 * @returns CSS string that is identical between SSR and client
 */
export function getCriticalThemeCSS(theme: string): string {
  const tokens =
    CRITICAL_TOKENS[theme as keyof typeof CRITICAL_TOKENS] ||
    CRITICAL_TOKENS["liquid-glass"];
  // Use the actual theme for CSS selectors, but fallback tokens for values
  const actualTheme = theme in CRITICAL_TOKENS ? theme : "liquid-glass";

  return `
    /* Critical theme tokens - DETERMINISTIC CONTENT */
    :root {
      --background: ${tokens.background};
      --foreground: ${tokens.foreground};
      --card: ${tokens.card};
      --card-foreground: ${tokens["card-foreground"]};
      --border: ${tokens.border};
      --primary: ${tokens.primary};
      --primary-foreground: ${tokens["primary-foreground"]};
    }

    /* Prevent FOUC during hydration */
    html[data-theme="${actualTheme}"] body {
      background-color: var(--background);
      color: var(--foreground);
      transition: none;
    }

    /* Re-enable transitions after hydration */
    html[data-theme]:not([data-loading]) body {
      transition: background-color 0.2s ease, color 0.2s ease;
    }
  `.trim();
}

/**
 * Get available theme IDs that have critical tokens
 */
export function getAvailableCriticalThemes(): string[] {
  return Object.keys(CRITICAL_TOKENS);
}

/**
 * Check if a theme has critical tokens defined
 */
export function hasCriticalTokens(theme: string): boolean {
  return theme in CRITICAL_TOKENS;
}
