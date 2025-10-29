"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { COLORS } from "./colors";

// Theme types
export type ThemeMode = "light" | "dark" | "system";
export type ColorScheme = "default" | "high-contrast" | "colorblind";

// Theme configuration
export interface ThemeConfig {
  mode: ThemeMode;
  colorScheme: ColorScheme;
  reducedMotion: boolean;
  customColors?: Partial<typeof COLORS>;
}

// Theme context type
interface ThemeContextType {
  theme: ThemeConfig;
  setTheme: (theme: Partial<ThemeConfig>) => void;
  toggleMode: () => void;
  toggleColorScheme: () => void;
  resolvedMode: "light" | "dark"; // Resolved system preference
  applyTheme: (config: ThemeConfig) => void;
}

// Create context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme provider component
interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Partial<ThemeConfig>;
}

export function ThemeProvider({ children, defaultTheme }: ThemeProviderProps) {
  // Get system preference (works on server too)
  const getSystemTheme = (): "light" | "dark" => {
    // For SSR, default to light theme to match server rendering
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  // Get reduced motion preference
  const getReducedMotion = (): boolean => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  };

  // Simple initial theme - consistent for SSR
  const [theme, setThemeState] = useState<ThemeConfig>(() => ({
    mode: "system",
    colorScheme: "default",
    reducedMotion: false,
    ...defaultTheme,
  }));

  const [resolvedMode, setResolvedMode] = useState<"light" | "dark">("light");
  const [isHydrated, setIsHydrated] = useState(false);

  // Load theme from localStorage after hydration
  useEffect(() => {
    setIsHydrated(true);

    // Load saved theme if available
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("theme-config");
        if (saved) {
          const parsed = JSON.parse(saved);
          const loadedTheme = {
            mode: "system",
            colorScheme: "default",
            reducedMotion: getReducedMotion(),
            ...parsed,
            ...defaultTheme,
          };
          setThemeState(loadedTheme);
          setResolvedMode(
            loadedTheme.mode === "system" ? getSystemTheme() : loadedTheme.mode,
          );
        }
      } catch (error) {
        console.warn("Failed to load theme config:", error);
      }
    }
  }, [defaultTheme]);

  // Apply theme to DOM - Safe for both server and client
  const applyTheme = useCallback((config: ThemeConfig) => {
    // Skip on server - will be handled by ThemeScript
    if (typeof document === "undefined") {
      setResolvedMode(config.mode === "system" ? "light" : config.mode);
      return;
    }

    const root = document.documentElement;

    // Set theme mode
    const actualMode =
      config.mode === "system" ? getSystemTheme() : config.mode;

    // Remove previous theme classes
    root.classList.remove("light", "dark");
    root.classList.add(actualMode);

    // Set color scheme
    root.setAttribute("data-color-scheme", config.colorScheme);

    // Note: data-reduced-motion is set externally by script to prevent hydration mismatch
    // We don't control it here to avoid conflicts

    // Apply custom colors if provided
    if (config.customColors) {
      Object.entries(config.customColors).forEach(([key, value]) => {
        if (typeof value === "object" && value !== null) {
          Object.entries(value).forEach(([shade, hslValue]) => {
            if (typeof hslValue === "string") {
              root.style.setProperty(`--color-${key}-${shade}`, hslValue);
            }
          });
        }
      });
    }

    setResolvedMode(actualMode);
  }, []);

  // Set theme with persistence
  const setTheme = useCallback(
    (newTheme: Partial<ThemeConfig>) => {
      const updatedTheme = { ...theme, ...newTheme };
      setThemeState(updatedTheme);

      // Save to localStorage
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("theme-config", JSON.stringify(updatedTheme));
        } catch (error) {
          console.warn("Failed to save theme config:", error);
        }
      }

      // Apply changes
      applyTheme(updatedTheme);
    },
    [theme, applyTheme],
  );

  // Toggle between light/dark/system
  const toggleMode = () => {
    const modes: ThemeMode[] = ["light", "system", "dark"];
    const currentIndex = modes.indexOf(theme.mode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setTheme({ mode: nextMode });
  };

  // Toggle color scheme
  const toggleColorScheme = () => {
    const schemes: ColorScheme[] = ["default", "high-contrast", "colorblind"];
    const currentIndex = schemes.indexOf(theme.colorScheme);
    const nextScheme = schemes[(currentIndex + 1) % schemes.length];
    setTheme({ colorScheme: nextScheme });
  };

  // Listen for system theme changes (only after hydration)
  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme.mode === "system") {
        const newResolvedMode = mediaQuery.matches ? "dark" : "light";
        setResolvedMode(newResolvedMode);
        // Only update DOM when user changes happen, not system changes
        // The ThemeScript handles initial application
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme.mode, isHydrated]);

  // Listen for reduced motion changes (only after hydration)
  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => {
      const reducedMotion = mediaQuery.matches;
      if (theme.reducedMotion !== reducedMotion) {
        setTheme({ reducedMotion });
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme.reducedMotion, setTheme, isHydrated]);

  // Apply theme only after hydration and when theme changes
  useEffect(() => {
    if (isHydrated) {
      applyTheme(theme);
    }
  }, [theme, isHydrated, applyTheme]);

  const contextValue: ThemeContextType = {
    theme,
    setTheme,
    toggleMode,
    toggleColorScheme,
    resolvedMode,
    applyTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook to use theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// Theme utilities - simplified to avoid type complexity
export const themeUtils = {
  // Check if theme is dark
  isDark: (resolvedMode: "light" | "dark"): boolean => resolvedMode === "dark",

  // Get appropriate text color for background
  getContrastText: (
    backgroundColor: string,
    resolvedMode: "light" | "dark",
  ): string => {
    // Simple contrast calculation - in production, use a proper color library
    const isDarkBg =
      backgroundColor.includes("900") || backgroundColor.includes("800");
    return isDarkBg || resolvedMode === "dark" ? "text-white" : "text-black";
  },
};
