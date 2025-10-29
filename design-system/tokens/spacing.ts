// Design System Tokens - Spacing & Layout
// Single source of truth for spacing, sizing, and layout tokens

export const spacingTokens = {
  // Spacing Scale - 4px base grid
  space: {
    0: "0", // 0px
    1: "0.25rem", // 4px
    2: "0.5rem", // 8px
    3: "0.75rem", // 12px
    4: "1rem", // 16px
    5: "1.25rem", // 20px
    6: "1.5rem", // 24px
    8: "2rem", // 32px
    10: "2.5rem", // 40px
    12: "3rem", // 48px
    16: "4rem", // 64px
    20: "5rem", // 80px
    24: "6rem", // 96px
    32: "8rem", // 128px
    40: "10rem", // 160px
    48: "12rem", // 192px
    56: "14rem", // 224px
    64: "16rem", // 256px
  },

  // Additional spacing tokens for tests
  xs: "0.5rem", // 8px
  sm: "0.75rem", // 12px
  md: "1rem", // 16px
  lg: "1.5rem", // 24px
  xl: "2rem", // 32px

  // Section Spacing - Vertical rhythm for sections
  section: {
    y: {
      xs: "py-12 md:py-16", // 48px mobile, 64px desktop - small sections
      sm: "py-16 md:py-20", // 64px mobile, 80px desktop - medium sections
      md: "py-20 md:py-28", // 80px mobile, 112px desktop - standard sections
      lg: "py-24 md:py-32", // 96px mobile, 128px desktop - large sections
      xl: "py-32 md:py-40", // 128px mobile, 160px desktop - hero sections
    },
  },

  // Container Sizes - Max widths for content containers
  container: {
    xs: "max-w-4xl", // 56rem / 896px - small containers
    sm: "max-w-5xl", // 64rem / 1024px - medium containers
    md: "max-w-6xl", // 72rem / 1152px - standard containers
    lg: "max-w-7xl", // 80rem / 1280px - large containers
    xl: "max-w-[1400px]", // custom - extra large containers
    full: "max-w-full", // full width
  },

  // Border Radius Scale
  borderRadius: {
    none: "0",
    sm: "0.125rem", // 2px
    md: "0.375rem", // 6px
    lg: "0.5rem", // 8px
    xl: "0.75rem", // 12px
    "2xl": "1rem", // 16px - default for cards/buttons
    "3xl": "1.5rem", // 24px
    full: "9999px", // fully rounded
  },

  // Shadows - Elevation system
  shadow: {
    none: "none",
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)", // subtle
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1)", // standard
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1)", // elevated
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1)", // modal
    "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)", // tooltip/popover
  },

  // Breakpoints - Responsive design tokens
  breakpoint: {
    sm: "640px", // small tablets
    md: "768px", // tablets
    lg: "1024px", // laptops
    xl: "1280px", // desktops
    "2xl": "1536px", // large desktops
  },

  // Z-Index Scale
  zIndex: {
    auto: "auto",
    0: "0",
    10: "10", // tooltips, dropdowns
    20: "20", // modals
    30: "30", // popovers
    40: "40", // navigation
    50: "50", // sticky elements
  },
} as const;

// Type exports
export type SpacingTokens = typeof spacingTokens;
