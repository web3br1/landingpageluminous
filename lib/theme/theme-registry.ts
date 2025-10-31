/**
 * Simple Theme Registry - Single Theme System
 * Minimal implementation for landing page themes
 */

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
}

export interface ThemeTypography {
  fontFamily: string;
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  };
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

export interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
}

export interface ThemeTokens {
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
}

export interface Theme {
  name: string;
  description?: string;
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

/**
 * Single theme for the landing page
 */
export const defaultTheme: Theme = {
  name: "default",
  colors: {
    primary: "#0066cc",
    secondary: "#666666",
    accent: "#ff6b35",
    background: "#ffffff",
    surface: "#f8f9fa",
    text: "#1a1a1a",
    textSecondary: "#666666",
    border: "#e1e5e9",
    error: "#dc3545",
    success: "#28a745",
    warning: "#ffc107",
  },
  typography: {
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      '2xl': "1.5rem",
      '3xl': "1.875rem",
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    '2xl': "3rem",
    '3xl': "4rem",
  },
  borderRadius: {
    sm: "0.25rem",
    md: "0.375rem",
    lg: "0.5rem",
    xl: "0.75rem",
  },
};

/**
 * Simple theme registry class
 */
export class ThemeRegistry {
  private static instance: ThemeRegistry;
  private currentTheme: Theme = defaultTheme;

  private constructor() {}

  static getInstance(): ThemeRegistry {
    if (!ThemeRegistry.instance) {
      ThemeRegistry.instance = new ThemeRegistry();
    }
    return ThemeRegistry.instance;
  }

  /**
   * Get current theme
   */
  getTheme(): Theme {
    return this.currentTheme;
  }

  /**
   * Get theme colors
   */
  getColors(): ThemeColors {
    return this.currentTheme.colors;
  }

  /**
   * Get theme typography
   */
  getTypography(): ThemeTypography {
    return this.currentTheme.typography;
  }

  /**
   * Get theme spacing
   */
  getSpacing(): ThemeSpacing {
    return this.currentTheme.spacing;
  }

  /**
   * Apply theme to CSS variables
   */
  applyTheme(): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const { colors, typography, spacing, borderRadius } = this.currentTheme;

    // Colors
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Typography
    root.style.setProperty('--font-family', typography.fontFamily);

    Object.entries(typography.fontSize).forEach(([key, value]) => {
      root.style.setProperty(`--font-size-${key}`, value);
    });

    Object.entries(typography.fontWeight).forEach(([key, value]) => {
      root.style.setProperty(`--font-weight-${key}`, value.toString());
    });

    Object.entries(typography.lineHeight).forEach(([key, value]) => {
      root.style.setProperty(`--line-height-${key}`, value.toString());
    });

    // Spacing
    Object.entries(spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });

    // Border radius
    Object.entries(borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--border-radius-${key}`, value);
    });
  }
}

// Export singleton instance
export const themeRegistry = ThemeRegistry.getInstance();

// Compatibility exports for existing code
export interface ThemePack {
  id: string;
  name: string;
  version: string;
  description?: string;
  category?: string;
  tokens: ThemeTokens;
  performance?: {
    lcp?: number;
    cls?: number;
  };
}

export const TOKEN_METADATA = {
  "--color-primary": { type: "color", required: true, contrast: 4.5 },
  "--color-secondary": { type: "color", required: true, contrast: 4.5 },
  "--color-accent": { type: "color", required: false, contrast: 3.0 },
  "--color-background": { type: "color", required: true, contrast: 4.5 },
  "--color-surface": { type: "color", required: true, contrast: 4.5 },
  "--color-text": { type: "color", required: true, contrast: 4.5 },
  "--color-text-secondary": { type: "color", required: true, contrast: 4.5 },
  "--color-border": { type: "color", required: true, contrast: 4.5 },
  "--color-error": { type: "color", required: true, contrast: 4.5 },
  "--color-success": { type: "color", required: true, contrast: 4.5 },
  "--color-warning": { type: "color", required: true, contrast: 4.5 },
} as const;

export const THEME_REGISTRY = themeRegistry;