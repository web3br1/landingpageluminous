// Design System Tokens - Single Source of Truth for Colors
// This file serves as the ONLY source of truth for colors in the entire application
// All colors used anywhere must come from here

export const colorTokens = {
  // Brand Colors - Primary Palette
  primary: {
    50: "258 90% 98%", // #F3E8FF - very light purple
    100: "258 90% 95%", // #E9D5FF - light purple
    200: "258 90% 88%", // #D4BFFF - light purple
    300: "258 90% 78%", // #B794FF - medium light purple
    400: "258 90% 68%", // #9A75FF - medium purple
    500: "258 90% 60%", // #7C4DFF - primary purple (CTA, links)
    600: "258 90% 52%", // #6A3DF0 - darker purple (hover)
    700: "258 90% 44%", // #5831CC - dark purple
    800: "258 90% 36%", // #4626A8 - darker purple
    900: "258 90% 28%", // #341B84 - darkest purple
    foreground: "0 0% 100%", // white text on primary
  },

  // Secondary Colors - Cyan
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

  // Accent Colors - Pastel Rose
  accent: {
    50: "340 93% 98%", // #FFF5F7 - very light rose
    100: "340 93% 95%", // #FFE9F0 - light rose
    200: "340 93% 88%", // #FFD3E0 - light rose
    300: "340 93% 78%", // #FFADC7 - medium light rose
    400: "340 93% 68%", // #FF87AE - medium rose
    500: "340 93% 72%", // #FFB3C6 - primary rose (soft)
    600: "340 93% 64%", // #FF8AAB - darker rose
    700: "340 93% 56%", // #FF6190 - dark rose
    800: "340 93% 48%", // #FF3875 - darker rose
    900: "340 93% 40%", // #FF0F5A - darkest rose
    foreground: "340 93% 10%", // dark text on accent
  },

  // Neutral Colors - Light FlowSync Neutrals
  neutral: {
    50: "210 20% 98%", // #FBFAFF - almost white with subtle purple tint
    100: "210 15% 96%", // #F3F4F6 - neutral-100
    200: "210 13% 92%", // #E5E7EB - neutral-200 (borders)
    300: "210 10% 82%", // #D1D5DB - neutral-300
    400: "210 8% 72%", // #9CA3AF - neutral-400
    500: "210 6% 62%", // #6B7280 - neutral-500
    600: "210 8% 52%", // #4B5563 - neutral-600 (secondary text)
    700: "210 10% 42%", // #374151 - neutral-700
    800: "210 13% 32%", // #1F2937 - neutral-800
    900: "210 15% 22%", // #111827 - neutral-900 (primary text)
  },

  // Semantic Colors - Status & Feedback
  success: {
    DEFAULT: "142 76% 36%", // #22C55E - green
    foreground: "0 0% 100%", // white text on success
  },

  warning: {
    DEFAULT: "38 92% 50%", // #F59E0B - amber
    foreground: "210 40% 2%", // dark text on warning
  },

  destructive: {
    DEFAULT: "0 84.2% 60.2%", // #EF4444 - red
    foreground: "210 40% 98%", // white text on destructive
  },

  // Alias for backward compatibility and tests
  error: {
    DEFAULT: "0 84.2% 60.2%", // #EF4444 - red (same as destructive)
    foreground: "210 40% 98%", // white text on error
  },

  info: {
    DEFAULT: "199 89% 48%", // #3B82F6 - blue
    foreground: "0 0% 100%", // white text on info
  },

  // Special Colors
  background: "210 20% 98%", // page background
  surface: "0 0% 100%", // card backgrounds
  overlay: "210 15% 22% / 0.8", // dark overlays
} as const;

// Type exports for TypeScript
export type ColorTokens = typeof colorTokens;
export type ColorKey = keyof ColorTokens;
export type ColorShade =
  | 50
  | 100
  | 200
  | 300
  | 400
  | 500
  | 600
  | 700
  | 800
  | 900;
