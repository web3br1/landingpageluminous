// Central Color Definitions - Single Source of Truth
// This file serves as the single source of truth for all colors in the application
// Colors defined here are used by both CSS custom properties and Tailwind config

export const COLORS = {
  // Primary Palette - Light FlowSync Theme
  primary: {
    50: "258 90% 98%", // #F3E8FF - very light purple
    100: "258 90% 95%", // #E9D5FF - light purple
    200: "258 90% 88%", // #D4BFFF - light purple
    300: "258 90% 78%", // #B794FF - medium light purple
    400: "258 90% 68%", // #9A75FF - medium purple
    500: "258 90% 60%", // #7C4DFF - primary purple
    600: "258 90% 52%", // #6A3DF0 - darker purple (hover)
    700: "258 90% 44%", // #5831CC - dark purple
    800: "258 90% 36%", // #4626A8 - darker purple
    900: "258 90% 28%", // #341B84 - darkest purple
    foreground: "0 0% 100%", // white text on primary
  },

  // Secondary Palette - Cyan
  secondary: {
    50: "200 100% 98%", // #E6FFFF - very light cyan
    100: "200 100% 95%", // #CCFFFF - light cyan
    200: "200 100% 88%", // #99FFFF - light cyan
    300: "200 100% 78%", // #66FFFF - medium light cyan
    400: "200 100% 68%", // #33FFFF - medium cyan
    500: "200 100% 50%", // #00D4FF - primary cyan
    600: "200 100% 42%", // #00ADCC - darker cyan
    700: "200 100% 34%", // #008799 - dark cyan
    800: "200 100% 26%", // #006066 - darker cyan
    900: "200 100% 18%", // #003933 - darkest cyan
    foreground: "210 40% 2%", // dark text on secondary
  },

  // Accent Palette - Pastel Rose
  accent: {
    50: "340 93% 98%", // #FFF5F7 - very light rose
    100: "340 93% 95%", // #FFE9F0 - light rose
    200: "340 93% 88%", // #FFD3E0 - light rose
    300: "340 93% 78%", // #FFADC7 - medium light rose
    400: "340 93% 68%", // #FF87AE - medium rose
    500: "340 93% 72%", // #FFB3C6 - primary rose (slightly different saturation)
    600: "340 93% 64%", // #FF8AAB - darker rose
    700: "340 93% 56%", // #FF6190 - dark rose
    800: "340 93% 48%", // #FF3875 - darker rose
    900: "340 93% 40%", // #FF0F5A - darkest rose
    foreground: "340 93% 10%", // dark text on accent
  },

  // Neutral Palette - Light FlowSync Neutrals
  neutral: {
    50: "210 20% 98%", // #FBFAFF - almost white with subtle purple tint
    100: "210 15% 96%", // #F3F4F6 - neutral-100
    200: "210 13% 92%", // #E5E7EB - neutral-200
    300: "210 10% 82%", // #D1D5DB - neutral-300
    400: "210 8% 72%", // #9CA3AF - neutral-400
    500: "210 6% 62%", // #6B7280 - neutral-500
    600: "210 8% 52%", // #4B5563 - neutral-600
    700: "210 10% 42%", // #374151 - neutral-700
    800: "210 13% 32%", // #1F2937 - neutral-800
    900: "210 15% 22%", // #111827 - neutral-900
  },

  // Semantic Colors
  destructive: {
    DEFAULT: "0 84.2% 60.2%", // #EF4444 - red
    foreground: "210 40% 98%", // white text on destructive
  },

  // Status Colors
  success: {
    DEFAULT: "142 76% 36%", // #22C55E - green
    foreground: "0 0% 100%", // white text on success
  },

  warning: {
    DEFAULT: "38 92% 50%", // #F59E0B - amber
    foreground: "210 40% 2%", // dark text on warning
  },

  info: {
    DEFAULT: "199 89% 48%", // #3B82F6 - blue
    foreground: "0 0% 100%", // white text on info
  },
} as const;

// Gradient Definitions
export const GRADIENTS = {
  // Background Gradients
  hero: `linear-gradient(135deg,
    hsl(${COLORS.neutral[50]}) 0%,
    hsl(320 40% 97%) 50%,
    hsl(320 50% 96%) 100%
  )`,

  section: `linear-gradient(180deg,
    hsl(${COLORS.neutral[50]}) 0%,
    hsl(0 0% 100%) 100%
  )`,

  // Button Gradients
  primary: `linear-gradient(135deg,
    hsl(${COLORS.primary[500]}) 0%,
    hsl(${COLORS.primary[600]}) 100%
  )`,

  secondary: `linear-gradient(135deg,
    hsl(${COLORS.secondary[500]}) 0%,
    hsl(${COLORS.secondary[600]}) 100%
  )`,

  accent: `linear-gradient(135deg,
    hsl(${COLORS.accent[500]}) 0%,
    hsl(${COLORS.accent[600]}) 100%
  )`,

  // Special Gradients
  rainbow: `linear-gradient(135deg,
    hsl(${COLORS.primary[500]}) 0%,
    hsl(${COLORS.secondary[500]}) 33%,
    hsl(${COLORS.accent[500]}) 66%,
    hsl(${COLORS.primary[500]}) 100%
  )`,
} as const;

// Shadow Definitions
export const SHADOWS = {
  sm: "0 1px 2px rgba(17, 24, 39, 0.04)",
  md: "0 10px 30px rgba(17, 24, 39, 0.06)",
  lg: "0 20px 40px rgba(17, 24, 39, 0.08)",
  xl: "0 25px 50px rgba(17, 24, 39, 0.12)",
} as const;

// Glassmorphism Definitions - Liquid Glass Effect
export const GLASSMORPHISM = {
  // Light mode glassmorphism
  light: {
    subtle: {
      background: "rgba(255, 255, 255, 0.7)",
      backdropBlur: "blur(12px)",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      shadow: "0 8px 32px rgba(17, 24, 39, 0.1)",
    },
    medium: {
      background: "rgba(255, 255, 255, 0.8)",
      backdropBlur: "blur(16px)",
      border: "1px solid rgba(255, 255, 255, 0.3)",
      shadow: "0 12px 40px rgba(17, 24, 39, 0.12)",
    },
    strong: {
      background: "rgba(255, 255, 255, 0.9)",
      backdropBlur: "blur(20px)",
      border: "1px solid rgba(255, 255, 255, 0.4)",
      shadow: "0 16px 48px rgba(17, 24, 39, 0.15)",
    },
  },

  // Dark mode glassmorphism
  dark: {
    subtle: {
      background: "rgba(17, 24, 39, 0.4)",
      backdropBlur: "blur(12px)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      shadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
    },
    medium: {
      background: "rgba(17, 24, 39, 0.6)",
      backdropBlur: "blur(16px)",
      border: "1px solid rgba(255, 255, 255, 0.15)",
      shadow: "0 12px 40px rgba(0, 0, 0, 0.4)",
    },
    strong: {
      background: "rgba(17, 24, 39, 0.8)",
      backdropBlur: "blur(20px)",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      shadow: "0 16px 48px rgba(0, 0, 0, 0.5)",
    },
  },
} as const;

// Export types for TypeScript
export type ColorPalette = typeof COLORS;
export type ColorKey = keyof ColorPalette;
export type GradientKey = keyof typeof GRADIENTS;
export type ShadowKey = keyof typeof SHADOWS;
export type GlassmorphismKey = keyof typeof GLASSMORPHISM.light;
