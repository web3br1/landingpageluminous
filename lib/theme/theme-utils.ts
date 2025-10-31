/**
 * Theme Utilities - SSR Safe
 * Provides theme management utilities with SSR protection
 */

import { isClient, readLocalStorage, writeLocalStorage } from "../utils/browser-storage";

/**
 * Available theme types
 */
export type Theme = "light" | "dark" | "system";

/**
 * Theme constants
 */
export const THEMES = {
  LIGHT: "light" as const,
  DARK: "dark" as const,
  SYSTEM: "system" as const,
} as const;

/**
 * Storage key for theme preference
 */
export const STORAGE_KEY = "dataflow-theme" as const;

/**
 * Gets the system theme preference
 */
export function getSystemTheme(): Theme {
  if (!isClient()) {
    return "light"; // Default fallback for SSR
  }

  try {
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  } catch (error) {
    console.warn("getSystemTheme: Failed to detect system theme:", error);
    return "light";
  }
}

/**
 * Gets the stored theme from localStorage
 */
export function getStoredTheme(): Theme | null {
  return readLocalStorage<Theme>(STORAGE_KEY);
}

/**
 * Applies a theme to the document
 */
export function applyTheme(theme: Theme): boolean {
  if (!isClient()) {
    return false;
  }

  try {
    const root = document.documentElement;
    const actualTheme = theme === "system" ? getSystemTheme() : theme;

    // Set data attribute
    root.setAttribute("data-theme", actualTheme);

    // Remove existing theme classes
    root.className = root.className.replace(/\btheme-\w+/g, "").trim();

    // Add new theme class
    root.classList.add(`theme-${actualTheme}`);

    // For dark theme, also add "dark" class as expected by tests
    if (actualTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    return true;
  } catch (error) {
    console.warn(`applyTheme: Failed to apply theme ${theme}:`, error);
    return false;
  }
}

/**
 * Sets and applies a theme
 */
export function setTheme(theme: Theme): boolean {
  try {
    // Store the theme preference
    const stored = writeLocalStorage(STORAGE_KEY, theme);
    if (!stored) {
      console.warn("setTheme: Failed to store theme preference");
    }

    // Apply the theme
    return applyTheme(theme);
  } catch (error) {
    console.warn(`setTheme: Failed to set theme ${theme}:`, error);
    return false;
  }
}

/**
 * Gets the current active theme
 */
export function getCurrentTheme(): Theme {
  if (!isClient()) {
    return "light";
  }

  try {
    const stored = getStoredTheme();
    if (stored && stored !== "system") {
      return stored;
    }

    // Check data attribute
    const root = document.documentElement;
    const dataTheme = root.getAttribute("data-theme") as Theme;
    if (dataTheme && dataTheme !== "system") {
      return dataTheme;
    }

    // Fallback to system preference
    return getSystemTheme();
  } catch (error) {
    console.warn("getCurrentTheme: Failed to get current theme:", error);
    return "light";
  }
}

/**
 * Initializes theme on page load
 */
export function initializeTheme(): boolean {
  if (!isClient()) {
    return false;
  }

  try {
    const stored = getStoredTheme();
    if (stored) {
      return applyTheme(stored);
    }

    // Apply system theme by default
    return applyTheme("system");
  } catch (error) {
    console.warn("initializeTheme: Failed to initialize theme:", error);
    return false;
  }
}

/**
 * Toggles between light and dark themes
 */
export function toggleTheme(): Theme | null {
  try {
    const current = getCurrentTheme();
    const newTheme: Theme = current === "light" ? "dark" : "light";
    const applied = setTheme(newTheme);
    return applied ? newTheme : null;
  } catch (error) {
    console.warn("toggleTheme: Failed to toggle theme:", error);
    return null;
  }
}

/**
 * Listens for system theme changes
 */
export function watchSystemTheme(callback: (theme: Theme) => void): (() => void) | null {
  if (!isClient() || !window.matchMedia) {
    return null;
  }

  try {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const listener = (event: MediaQueryListEvent) => {
      const stored = getStoredTheme();
      if (stored === "system") {
        const theme = event.matches ? "dark" : "light";
        callback(theme);
      }
    };

    mediaQuery.addEventListener("change", listener);

    return () => {
      mediaQuery.removeEventListener("change", listener);
    };
  } catch (error) {
    console.warn("watchSystemTheme: Failed to set up theme watcher:", error);
    return null;
  }
}