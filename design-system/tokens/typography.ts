// Design System Tokens - Typography
// Single source of truth for all typography-related tokens

export const typographyTokens = {
  // Font Families
  fontFamily: {
    sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
    display: [
      "Inter Tight",
      "Inter",
      "system-ui",
      "-apple-system",
      "sans-serif",
    ],
    mono: ["JetBrains Mono", "Fira Code", "monospace"],
  },

  // Font Sizes - Clamp-based responsive scaling with mobile-first approach
  fontSize: {
    // Headings - Mobile-first with better readability
    h1: "clamp(1.75rem, 4vw, 3.5rem)", // 28-56px (melhor para mobile)
    h2: "clamp(1.5rem, 3.5vw, 2.5rem)", // 24-40px
    h3: "clamp(1.25rem, 3vw, 2rem)", // 20-32px
    h4: "clamp(1.125rem, 2.5vw, 1.5rem)", // 18-24px

    // Body Text - Improved mobile readability
    lg: "clamp(1rem, 1.125rem, 1.125rem)", // 16-18px - large body
    base: "clamp(0.9375rem, 1rem, 1rem)", // 15-16px - base body (melhor que 14px)
    sm: "clamp(0.875rem, 0.9375rem, 0.9375rem)", // 14-15px - small body
    xs: "clamp(0.8125rem, 0.875rem, 0.875rem)", // 13-14px - extra small

    // Additional sizes for tests
    xl: "clamp(1.25rem, 1.375rem, 1.375rem)", // 20-22px - extra large
    "2xl": "clamp(1.5rem, 1.75rem, 1.75rem)", // 24-28px - 2x large
    "3xl": "clamp(1.875rem, 2.25rem, 2.25rem)", // 30-36px - 3x large

    // Special - Better mobile scaling
    display: "clamp(2rem, 6vw, 4.5rem)", // 32-72px - hero headlines (mais legível)
    caption: "clamp(0.75rem, 0.8125rem, 0.8125rem)", // 12-13px - captions

    // Additional mobile-optimized sizes
    mobile: {
      xl: "clamp(1.25rem, 2rem, 2rem)", // 20-32px - extra large for mobile
      heading: "clamp(1.625rem, 3vw, 2.75rem)", // 26-44px - mobile heading
      subheading: "clamp(1.1875rem, 2.5vw, 1.875rem)", // 19-30px - mobile subheading
    },
  },

  // Line Heights
  lineHeight: {
    none: 1,
    tight: 1.25, // headings
    normal: 1.5, // body text
    relaxed: 1.625, // spacious paragraphs
    loose: 2, // very spacious
  },

  // Font Weights
  fontWeight: {
    thin: 100,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },

  // Letter Spacing
  letterSpacing: {
    tighter: "-0.05em",
    tight: "-0.025em",
    normal: "0em",
    wide: "0.025em",
    wider: "0.05em",
    widest: "0.1em",
  },

  // Text Colors (semantic)
  textColor: {
    primary: "hsl(var(--color-neutral-900))", // main text
    secondary: "hsl(var(--color-neutral-600))", // secondary text
    tertiary: "hsl(var(--color-neutral-400))", // tertiary text
    inverse: "hsl(var(--color-neutral-50))", // text on dark backgrounds
    accent: "hsl(var(--color-primary-500))", // accent text
    success: "hsl(var(--color-success-default))", // success text
    warning: "hsl(var(--color-warning-default))", // warning text
    error: "hsl(var(--color-destructive-default))", // error text
  },
} as const;

// Type exports
export type TypographyTokens = typeof typographyTokens;
