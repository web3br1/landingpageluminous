// ===== THEME UTILITIES =====
// Utilitários para gerenciamento de tema e preferências

/** Theme constants */
export const THEMES = {
  LIGHT: "light" as const,
  DARK: "dark" as const,
  SYSTEM: "system" as const,
} as const;

/** Storage key for theme */
export const STORAGE_KEY = "dataflow-theme";

/** Theme mode type */
export type ThemeMode = "light" | "dark" | "system";

/** Get system color scheme preference */
export function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/** Get stored theme preference */
export function getStoredTheme(): ThemeMode | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // Ignore localStorage errors
  }

  return null;
}

/** Get current theme (resolves system preference) */
export function getTheme(): "light" | "dark" {
  const stored = getStoredTheme();
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return getSystemTheme();
}

/** Set theme and apply it */
export function setTheme(theme: ThemeMode): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Ignore localStorage errors
  }

  applyTheme(resolveTheme(theme));
}

/** Toggle between light and dark themes */
export function toggleTheme(): void {
  const currentTheme = getTheme();
  const newTheme = currentTheme === "light" ? "dark" : "light";
  setTheme(newTheme);
}

/** Apply theme to document */
export function applyTheme(theme: "light" | "dark" | "system"): void {
  if (typeof window === "undefined") return;

  const actualTheme = theme === "system" ? getSystemTheme() : theme;

  const root = window.document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(actualTheme);

  // Set data attribute for CSS custom properties
  root.setAttribute("data-theme", actualTheme);
}

/** Resolve theme mode to actual theme */
export function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") {
    return getSystemTheme();
  }
  return mode;
}

/** Watch system theme changes */
export function watchSystemTheme(
  callback: (theme: "light" | "dark") => void,
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const handleChange = (e: MediaQueryListEvent) => {
    callback(e.matches ? "dark" : "light");
  };

  mediaQuery.addEventListener("change", handleChange);

  return () => {
    mediaQuery.removeEventListener("change", handleChange);
  };
}

/** Generate theme classes for body element */
export function getThemeClasses(
  defaultTheme?: string | { mode: "light" | "dark" | "system" },
): string {
  // Always return a valid string, never undefined
  if (typeof window === "undefined") {
    // Server-side rendering fallback
    if (typeof defaultTheme === "string") {
      return defaultTheme === "dark" ? "dark" : "light";
    }
    if (defaultTheme && typeof defaultTheme === "object" && defaultTheme.mode) {
      const mode = defaultTheme.mode;
      if (mode === "system") {
        // For system theme on server, default to light
        return "light";
      }
      return mode === "dark" ? "dark" : "light";
    }
    return "light"; // Default fallback
  }

  try {
    const theme = getTheme();
    return theme === "dark" ? "dark" : "light";
  } catch (error) {
    console.warn("Failed to get theme, using light as fallback", error);
    return "light";
  }
}
