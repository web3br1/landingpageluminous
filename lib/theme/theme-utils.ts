/**
 * Theme utilities for SSR-safe theme management
 * Handles theme detection, storage, and application across server and client
 */

import { useEffect, useState } from 'react';

// Theme types
export type Theme = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

// Storage key
const THEME_STORAGE_KEY = 'app-theme';

// Default theme
const DEFAULT_THEME: Theme = 'system';

/**
 * Check if we're running in a browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Get the current theme from localStorage or default
 */
export function getStoredTheme(): Theme {
  if (!isBrowser()) {
    return DEFAULT_THEME;
  }

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      return stored as Theme;
    }
  } catch (error) {
    // localStorage not available or corrupted
    console.warn('Failed to read theme from localStorage:', error);
  }

  return DEFAULT_THEME;
}

/**
 * Store theme preference in localStorage
 */
export function setStoredTheme(theme: Theme): void {
  if (!isBrowser()) {
    return;
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.warn('Failed to store theme in localStorage:', error);
  }
}

/**
 * Get system theme preference (light/dark)
 */
export function getSystemTheme(): ResolvedTheme {
  if (!isBrowser()) {
    return 'light'; // Default for SSR
  }

  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch (error) {
    console.warn('Failed to detect system theme:', error);
    return 'light';
  }
}

/**
 * Resolve theme to actual light/dark value
 */
export function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
}

/**
 * Apply theme to document
 */
export function applyTheme(theme: ResolvedTheme): void {
  if (!isBrowser()) {
    return;
  }

  try {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  } catch (error) {
    console.warn('Failed to apply theme:', error);
  }
}

/**
 * Set theme and apply it
 */
export function setTheme(theme: Theme): void {
  setStoredTheme(theme);
  applyTheme(resolveTheme(theme));
}

/**
 * Get current resolved theme
 */
export function getCurrentTheme(): ResolvedTheme {
  return resolveTheme(getStoredTheme());
}

/**
 * Initialize theme on page load (client-side only)
 */
export function initializeTheme(): void {
  if (!isBrowser()) {
    return;
  }

  const theme = getStoredTheme();
  applyTheme(resolveTheme(theme));
}

/**
 * React hook for theme management
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');

  useEffect(() => {
    // Initialize theme on mount
    const storedTheme = getStoredTheme();
    const resolved = resolveTheme(storedTheme);

    setThemeState(storedTheme);
    setResolvedTheme(resolved);
    applyTheme(resolved);

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (storedTheme === 'system') {
        const newResolved = resolveTheme(storedTheme);
        setResolvedTheme(newResolved);
        applyTheme(newResolved);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setThemeValue = (newTheme: Theme) => {
    setThemeState(newTheme);
    const resolved = resolveTheme(newTheme);
    setResolvedTheme(resolved);
    setStoredTheme(newTheme);
    applyTheme(resolved);
  };

  return {
    theme,
    resolvedTheme,
    setTheme: setThemeValue,
  };
}

/**
 * Get initial theme for SSR (always returns default)
 */
export function getInitialTheme(): Theme {
  return DEFAULT_THEME;
}

/**
 * Get initial resolved theme for SSR
 */
export function getInitialResolvedTheme(): ResolvedTheme {
  return 'light';
}