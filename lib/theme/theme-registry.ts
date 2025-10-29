// Theme Registry - Central Theme Management System
// Implements the complete theme framework for the landing page demo

export interface TokenMetadata {
  space: "hsl" | "oklch";
  function: "surface" | "text" | "interactive" | "border" | "shadow";
  contrastTarget: "AA" | "AAA";
  maxOpacity?: number;
  description: string;
}

export interface ThemePack {
  id: string;
  name: string;
  description: string;
  category: "modern" | "classic" | "experimental" | "seasonal";
  version: string; // SemVer: 1.2.0
  breakingFields?: string[]; // Campos que quebram compatibilidade
  tokens: {
    colors: {
      base: string;
      contrast: string;
      primary: string;
      secondary: string;
      accent: string;
      warning: string;
      success: string;
      error: string;
      border: string;
      surface: string;
      elevated: string;
    };
    typography: {
      family: {
        display: string;
        body: string;
      };
      scale: {
        h1: string;
        h2: string;
        h3: string;
        body: string;
        caption: string;
        overline: string;
      };
    };
    spacing: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
      xxl: string;
      section: { mobile: string; desktop: string };
    };
    radius: {
      xs: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    shadows: {
      none: string;
      sm: string;
      md: string;
      lg: string;
      xl: string;
    };
    motion: {
      duration: {
        instant: string;
        fast: string;
        normal: string;
        slow: string;
      };
      easing: {
        standard: string;
        entrance: string;
        emphasis: string;
      };
      distance: string;
    };
  };
  features: {
    glassmorphism: boolean;
    brutalism: boolean;
    neon: boolean;
    serif: boolean;
    bento: boolean;
    soft: boolean;
    monochrome: boolean;
    pixel: boolean;
    organic: boolean;
    blueprint: boolean;
  };
  performance: {
    lcp: number; // target LCP in ms
    inp: number; // target INP in ms
    cls: number; // target CLS
  };
}

// Token metadata registry for governance
export const TOKEN_METADATA: Record<string, TokenMetadata> = {
  "--primary": {
    space: "oklch",
    function: "interactive",
    contrastTarget: "AA",
    maxOpacity: 0.9,
    description: "Primary interactive elements (buttons, links)",
  },
  "--primary-foreground": {
    space: "oklch",
    function: "text",
    contrastTarget: "AA",
    description: "Text on primary backgrounds",
  },
  "--secondary": {
    space: "oklch",
    function: "interactive",
    contrastTarget: "AA",
    maxOpacity: 0.8,
    description: "Secondary interactive elements",
  },
  "--background": {
    space: "oklch",
    function: "surface",
    contrastTarget: "AAA",
    description: "Main page background",
  },
  "--foreground": {
    space: "oklch",
    function: "text",
    contrastTarget: "AA",
    description: "Primary text color",
  },
  "--border": {
    space: "oklch",
    function: "border",
    contrastTarget: "AA",
    description: "Borders and dividers",
  },
};

// Complete Theme Registry with all 10 theme packs
export const THEME_REGISTRY: Record<string, ThemePack> = {
  "liquid-glass": {
    id: "liquid-glass",
    name: "Liquid Glass",
    description: "Minimal glassmorphism with translucent surfaces",
    category: "modern",
    version: "1.2.0",
    tokens: {
      colors: {
        base: "oklch(210 20% 98%)",
        contrast: "oklch(0 0% 100%)",
        primary: "oklch(258 90% 60%)",
        secondary: "oklch(200 100% 50%)",
        accent: "oklch(340 93% 72%)",
        warning: "hsl(38 92% 50%)",
        success: "hsl(142 76% 36%)",
        error: "hsl(0 84.2% 60.2%)",
        border: "oklch(210 13% 92%)",
        surface: "oklch(0 0% 100% / 0.7)",
        elevated: "oklch(0 0% 100% / 0.9)",
      },
      typography: {
        family: {
          display: "Inter Tight, system-ui",
          body: "Inter, system-ui",
        },
        scale: {
          h1: "clamp(2rem, 5vw, 3.2rem)",
          h2: "clamp(1.5rem, 3vw, 2.25rem)",
          h3: "clamp(1.25rem, 2vw, 1.75rem)",
          body: "clamp(1rem, 2vw, 1.125rem)",
          caption: "0.875rem",
          overline: "0.75rem",
        },
      },
      spacing: {
        xs: "0.5rem",
        sm: "0.5rem",
        md: "1rem",
        lg: "1.5rem",
        xl: "2rem",
        xxl: "3rem",
        section: { mobile: "3rem", desktop: "6rem" },
      },
      radius: {
        xs: "0.25rem",
        sm: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
      },
      shadows: {
        none: "none",
        sm: "0 1px 2px rgb(0 0 0 / 0.05)",
        md: "0 4px 6px rgb(0 0 0 / 0.07)",
        lg: "0 10px 15px rgb(0 0 0 / 0.1)",
        xl: "0 20px 25px rgb(0 0 0 / 0.15)",
      },
      motion: {
        duration: {
          instant: "100ms",
          fast: "150ms",
          normal: "250ms",
          slow: "350ms",
        },
        easing: {
          standard: "cubic-bezier(0.4, 0, 0.2, 1)",
          entrance: "cubic-bezier(0, 0, 0.2, 1)",
          emphasis: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        },
        distance: "12px",
      },
    },
    features: {
      glassmorphism: true,
      brutalism: false,
      neon: false,
      serif: false,
      bento: false,
      soft: true,
      monochrome: false,
      pixel: false,
      organic: true,
      blueprint: false,
    },
    performance: {
      lcp: 2500,
      inp: 200,
      cls: 0.1,
    },
  },

  "neo-brutal": {
    id: "neo-brutal",
    name: "Neo Brutal",
    description: "Bold borders, hard shadows, and sharp edges",
    category: "experimental",
    version: "1.0.0",
    tokens: {
      colors: {
        base: "oklch(210 20% 98%)",
        contrast: "oklch(0 0% 100%)",
        primary: "oklch(258 90% 60%)",
        secondary: "oklch(200 100% 50%)",
        accent: "hsl(35 100% 70%)",
        warning: "hsl(38 92% 50%)",
        success: "hsl(142 76% 36%)",
        error: "hsl(0 84.2% 60.2%)",
        border: "oklch(210 10% 42%)",
        surface: "oklch(0 0% 100%)",
        elevated: "oklch(0 0% 100%)",
      },
      typography: {
        family: {
          display: "Inter Tight, system-ui",
          body: "Inter, system-ui",
        },
        scale: {
          h1: "clamp(2rem, 5vw, 3.2rem)",
          h2: "clamp(1.5rem, 3vw, 2.25rem)",
          h3: "clamp(1.25rem, 2vw, 1.75rem)",
          body: "clamp(1rem, 2vw, 1.125rem)",
          caption: "0.875rem",
          overline: "0.75rem",
        },
      },
      spacing: {
        xs: "0.5rem",
        sm: "0.5rem",
        md: "1rem",
        lg: "1.5rem",
        xl: "2rem",
        xxl: "3rem",
        section: { mobile: "3rem", desktop: "6rem" },
      },
      radius: {
        xs: "0",
        sm: "0",
        md: "0",
        lg: "0",
        xl: "0",
      },
      shadows: {
        none: "none",
        sm: "3px 3px 0 rgb(0 0 0)",
        md: "6px 6px 0 rgb(0 0 0)",
        lg: "9px 9px 0 rgb(0 0 0)",
        xl: "12px 12px 0 rgb(0 0 0)",
      },
      motion: {
        duration: {
          instant: "100ms",
          fast: "100ms",
          normal: "150ms",
          slow: "200ms",
        },
        easing: {
          standard: "ease-out",
          entrance: "ease-out",
          emphasis: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        },
        distance: "8px",
      },
    },
    features: {
      glassmorphism: false,
      brutalism: true,
      neon: false,
      serif: false,
      bento: false,
      soft: false,
      monochrome: false,
      pixel: false,
      organic: false,
      blueprint: false,
    },
    performance: {
      lcp: 2200,
      inp: 150,
      cls: 0.08,
    },
  },

  "cyber-neon": {
    id: "cyber-neon",
    name: "Cyber Neon",
    description: "Vibrant gradients and subtle glow effects",
    category: "experimental",
    version: "1.0.0",
    tokens: {
      colors: {
        base: "oklch(280 3% 12%)",
        contrast: "oklch(280 3% 95%)",
        primary: "oklch(320 23% 72%)",
        secondary: "oklch(200 23% 65%)",
        accent: "oklch(200 23% 75%)",
        warning: "hsl(45 100% 60%)",
        success: "hsl(120 60% 50%)",
        error: "hsl(0 75% 60%)",
        border: "oklch(280 8% 40%)",
        surface: "oklch(280 3% 15%)",
        elevated: "oklch(280 3% 20%)",
      },
      typography: {
        family: {
          display: "Inter Tight, system-ui",
          body: "Inter, system-ui",
        },
        scale: {
          h1: "clamp(2rem, 5vw, 3.2rem)",
          h2: "clamp(1.5rem, 3vw, 2.25rem)",
          h3: "clamp(1.25rem, 2vw, 1.75rem)",
          body: "clamp(1rem, 2vw, 1.125rem)",
          caption: "0.875rem",
          overline: "0.75rem",
        },
      },
      spacing: {
        xs: "0.5rem",
        sm: "0.5rem",
        md: "1rem",
        lg: "1.5rem",
        xl: "2rem",
        xxl: "3rem",
        section: { mobile: "3rem", desktop: "6rem" },
      },
      radius: {
        xs: "0.25rem",
        sm: "0.375rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.25rem",
      },
      shadows: {
        none: "none",
        sm: "0 0 0 1px hsl(var(--border))",
        md: "0 0 8px hsl(var(--primary) / 0.3), 0 0 0 1px hsl(var(--border))",
        lg: "0 0 16px hsl(var(--primary) / 0.4), 0 0 0 1px hsl(var(--border))",
        xl: "0 0 24px hsl(var(--primary) / 0.5), 0 0 0 1px hsl(var(--border))",
      },
      motion: {
        duration: {
          instant: "100ms",
          fast: "200ms",
          normal: "300ms",
          slow: "500ms",
        },
        easing: {
          standard: "cubic-bezier(0.4, 0, 0.2, 1)",
          entrance: "cubic-bezier(0.4, 0, 0.6, 1)",
          emphasis: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        },
        distance: "16px",
      },
    },
    features: {
      glassmorphism: false,
      brutalism: false,
      neon: true,
      serif: false,
      bento: false,
      soft: false,
      monochrome: false,
      pixel: false,
      organic: false,
      blueprint: false,
    },
    performance: {
      lcp: 2400,
      inp: 180,
      cls: 0.08,
    },
  },

  "editorial-serif": {
    id: "editorial-serif",
    name: "Editorial Serif",
    description: "High typography with serif accents",
    category: "classic",
    version: "1.0.0",
    tokens: {
      colors: {
        base: "oklch(210 20% 98%)",
        contrast: "oklch(0 0% 100%)",
        primary: "oklch(210 6% 45%)",
        secondary: "oklch(210 8% 55%)",
        accent: "oklch(210 10% 35%)",
        warning: "hsl(38 92% 50%)",
        success: "hsl(142 76% 36%)",
        error: "hsl(0 84.2% 60.2%)",
        border: "oklch(210 15% 85%)",
        surface: "oklch(0 0% 100%)",
        elevated: "oklch(0 0% 100%)",
      },
      typography: {
        family: {
          display: "Georgia, serif",
          body: "Inter, system-ui",
        },
        scale: {
          h1: "clamp(2rem, 5vw, 3.2rem)",
          h2: "clamp(1.5rem, 3vw, 2.25rem)",
          h3: "clamp(1.25rem, 2vw, 1.75rem)",
          body: "clamp(1rem, 2vw, 1.125rem)",
          caption: "0.875rem",
          overline: "0.75rem",
        },
      },
      spacing: {
        xs: "0.5rem",
        sm: "0.5rem",
        md: "1rem",
        lg: "1.5rem",
        xl: "2rem",
        xxl: "3rem",
        section: { mobile: "3rem", desktop: "6rem" },
      },
      radius: {
        xs: "0.125rem",
        sm: "0.25rem",
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
      },
      shadows: {
        none: "none",
        sm: "0 1px 3px rgb(0 0 0 / 0.1)",
        md: "0 4px 6px rgb(0 0 0 / 0.07)",
        lg: "0 8px 16px rgb(0 0 0 / 0.08)",
        xl: "0 12px 24px rgb(0 0 0 / 0.09)",
      },
      motion: {
        duration: {
          instant: "100ms",
          fast: "250ms",
          normal: "400ms",
          slow: "600ms",
        },
        easing: {
          standard: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          entrance: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          emphasis: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        },
        distance: "20px",
      },
    },
    features: {
      glassmorphism: false,
      brutalism: false,
      neon: false,
      serif: true,
      bento: false,
      soft: true,
      monochrome: false,
      pixel: false,
      organic: false,
      blueprint: false,
    },
    performance: {
      lcp: 2300,
      inp: 180,
      cls: 0.06,
    },
  },

  "bento-grid": {
    id: "bento-grid",
    name: "Bento Grid",
    description: "Asymmetrical cards with organic layouts",
    category: "modern",
    version: "1.0.0",
    tokens: {
      colors: {
        base: "oklch(105 20% 98%)",
        contrast: "oklch(0 0% 100%)",
        primary: "oklch(260 16% 62%)",
        secondary: "oklch(190 18% 55%)",
        accent: "oklch(40 20% 55%)",
        warning: "hsl(38 92% 50%)",
        success: "hsl(142 76% 36%)",
        error: "hsl(0 84.2% 60.2%)",
        border: "oklch(105 13% 90%)",
        surface: "oklch(0 0% 100%)",
        elevated: "oklch(0 0% 100%)",
      },
      typography: {
        family: {
          display: "Inter Tight, system-ui",
          body: "Inter, system-ui",
        },
        scale: {
          h1: "clamp(2rem, 5vw, 3.2rem)",
          h2: "clamp(1.5rem, 3vw, 2.25rem)",
          h3: "clamp(1.25rem, 2vw, 1.75rem)",
          body: "clamp(1rem, 2vw, 1.125rem)",
          caption: "0.875rem",
          overline: "0.75rem",
        },
      },
      spacing: {
        xs: "0.5rem",
        sm: "0.5rem",
        md: "1rem",
        lg: "1.5rem",
        xl: "2rem",
        xxl: "3rem",
        section: { mobile: "3rem", desktop: "6rem" },
      },
      radius: {
        xs: "0.5rem",
        sm: "0.75rem",
        md: "1rem",
        lg: "1.25rem",
        xl: "1.5rem",
      },
      shadows: {
        none: "none",
        sm: "0 2px 4px rgb(0 0 0 / 0.05)",
        md: "0 4px 12px rgb(0 0 0 / 0.08)",
        lg: "0 8px 24px rgb(0 0 0 / 0.1)",
        xl: "0 12px 32px rgb(0 0 0 / 0.12)",
      },
      motion: {
        duration: {
          instant: "100ms",
          fast: "150ms",
          normal: "250ms",
          slow: "350ms",
        },
        easing: {
          standard: "cubic-bezier(0.4, 0, 0.2, 1)",
          entrance: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          emphasis: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        },
        distance: "16px",
      },
    },
    features: {
      glassmorphism: false,
      brutalism: false,
      neon: false,
      serif: false,
      bento: true,
      soft: true,
      monochrome: false,
      pixel: false,
      organic: true,
      blueprint: false,
    },
    performance: {
      lcp: 2400,
      inp: 190,
      cls: 0.09,
    },
  },

  "soft-ui": {
    id: "soft-ui",
    name: "Soft UI",
    description: "Soft surfaces with gentle shadows",
    category: "modern",
    version: "1.0.0",
    tokens: {
      colors: {
        base: "oklch(250 20% 98%)",
        contrast: "oklch(0 0% 100%)",
        primary: "oklch(270 15% 66%)",
        secondary: "oklch(220 15% 60%)",
        accent: "oklch(330 20% 65%)",
        warning: "hsl(38 92% 50%)",
        success: "hsl(142 76% 36%)",
        error: "hsl(0 84.2% 60.2%)",
        border: "oklch(250 13% 92%)",
        surface: "oklch(0 0% 100%)",
        elevated: "oklch(0 0% 100%)",
      },
      typography: {
        family: {
          display: "Inter Tight, system-ui",
          body: "Inter, system-ui",
        },
        scale: {
          h1: "clamp(2rem, 5vw, 3.2rem)",
          h2: "clamp(1.5rem, 3vw, 2.25rem)",
          h3: "clamp(1.25rem, 2vw, 1.75rem)",
          body: "clamp(1rem, 2vw, 1.125rem)",
          caption: "0.875rem",
          overline: "0.75rem",
        },
      },
      spacing: {
        xs: "0.5rem",
        sm: "0.5rem",
        md: "1rem",
        lg: "1.5rem",
        xl: "2rem",
        xxl: "3rem",
        section: { mobile: "3rem", desktop: "6rem" },
      },
      radius: {
        xs: "0.75rem",
        sm: "1rem",
        md: "1.5rem",
        lg: "2rem",
        xl: "2.5rem",
      },
      shadows: {
        none: "none",
        sm: "4px 4px 8px rgb(0 0 0 / 0.08), -2px -2px 4px rgb(255 255 255)",
        md: "6px 6px 12px rgb(0 0 0 / 0.1), -3px -3px 6px rgb(255 255 255)",
        lg: "8px 8px 16px rgb(0 0 0 / 0.12), -4px -4px 8px rgb(255 255 255)",
        xl: "12px 12px 24px rgb(0 0 0 / 0.15), -6px -6px 12px rgb(255 255 255)",
      },
      motion: {
        duration: {
          instant: "100ms",
          fast: "150ms",
          normal: "250ms",
          slow: "400ms",
        },
        easing: {
          standard: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          entrance: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          emphasis: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        },
        distance: "16px",
      },
    },
    features: {
      glassmorphism: false,
      brutalism: false,
      neon: false,
      serif: false,
      bento: false,
      soft: true,
      monochrome: false,
      pixel: false,
      organic: true,
      blueprint: false,
    },
    performance: {
      lcp: 2350,
      inp: 170,
      cls: 0.07,
    },
  },

  "mono-luxe": {
    id: "mono-luxe",
    name: "Monochromatic Lux",
    description: "Single scale with subtle accents",
    category: "classic",
    version: "1.0.0",
    tokens: {
      colors: {
        base: "oklch(95 0% 99%)",
        contrast: "oklch(0 0% 100%)",
        primary: "oklch(95 0% 40%)",
        secondary: "oklch(95 0% 50%)",
        accent: "oklch(95 0% 30%)",
        warning: "hsl(45 10% 50%)",
        success: "hsl(120 10% 40%)",
        error: "hsl(0 10% 50%)",
        border: "oklch(95 0% 90%)",
        surface: "oklch(0 0% 100%)",
        elevated: "oklch(0 0% 100%)",
      },
      typography: {
        family: {
          display: "Inter Tight, system-ui",
          body: "Inter, system-ui",
        },
        scale: {
          h1: "clamp(2rem, 5vw, 3.2rem)",
          h2: "clamp(1.5rem, 3vw, 2.25rem)",
          h3: "clamp(1.25rem, 2vw, 1.75rem)",
          body: "clamp(1rem, 2vw, 1.125rem)",
          caption: "0.875rem",
          overline: "0.75rem",
        },
      },
      spacing: {
        xs: "0.5rem",
        sm: "0.5rem",
        md: "1rem",
        lg: "1.5rem",
        xl: "2rem",
        xxl: "3rem",
        section: { mobile: "3rem", desktop: "6rem" },
      },
      radius: {
        xs: "0.25rem",
        sm: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
      },
      shadows: {
        none: "none",
        sm: "0 1px 2px rgb(0 0 0 / 0.08)",
        md: "0 2px 4px rgb(0 0 0 / 0.06)",
        lg: "0 4px 8px rgb(0 0 0 / 0.05)",
        xl: "0 6px 12px rgb(0 0 0 / 0.04)",
      },
      motion: {
        duration: {
          instant: "100ms",
          fast: "150ms",
          normal: "250ms",
          slow: "350ms",
        },
        easing: {
          standard: "cubic-bezier(0.4, 0, 0.2, 1)",
          entrance: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          emphasis: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        },
        distance: "12px",
      },
    },
    features: {
      glassmorphism: false,
      brutalism: false,
      neon: false,
      serif: false,
      bento: false,
      soft: true,
      monochrome: true,
      pixel: false,
      organic: false,
      blueprint: false,
    },
    performance: {
      lcp: 2100,
      inp: 160,
      cls: 0.05,
    },
  },

  "retro-pixel": {
    id: "retro-pixel",
    name: "Retro Pixel",
    description: "8-bit inspired forms and limited palette",
    category: "experimental",
    version: "1.0.0",
    tokens: {
      colors: {
        base: "oklch(45 15% 96%)",
        contrast: "oklch(0 0% 100%)",
        primary: "oklch(210 70% 50%)",
        secondary: "oklch(120 60% 45%)",
        accent: "oklch(300 60% 55%)",
        warning: "hsl(45 80% 55%)",
        success: "hsl(120 60% 50%)",
        error: "hsl(0 70% 55%)",
        border: "oklch(45 25% 80%)",
        surface: "oklch(0 0% 100%)",
        elevated: "oklch(0 0% 100%)",
      },
      typography: {
        family: {
          display: "Inter Tight, system-ui",
          body: "Inter, system-ui",
        },
        scale: {
          h1: "clamp(2rem, 5vw, 3.2rem)",
          h2: "clamp(1.5rem, 3vw, 2.25rem)",
          h3: "clamp(1.25rem, 2vw, 1.75rem)",
          body: "clamp(1rem, 2vw, 1.125rem)",
          caption: "0.875rem",
          overline: "0.75rem",
        },
      },
      spacing: {
        xs: "0.5rem",
        sm: "0.5rem",
        md: "1rem",
        lg: "1.5rem",
        xl: "2rem",
        xxl: "3rem",
        section: { mobile: "3rem", desktop: "6rem" },
      },
      radius: {
        xs: "0",
        sm: "0",
        md: "0",
        lg: "0",
        xl: "0",
      },
      shadows: {
        none: "none",
        sm: "2px 2px 0 rgb(0 0 0)",
        md: "4px 4px 0 rgb(0 0 0)",
        lg: "6px 6px 0 rgb(0 0 0)",
        xl: "8px 8px 0 rgb(0 0 0)",
      },
      motion: {
        duration: {
          instant: "100ms",
          fast: "100ms",
          normal: "150ms",
          slow: "200ms",
        },
        easing: {
          standard: "steps(4, end)",
          entrance: "steps(4, end)",
          emphasis: "steps(8, end)",
        },
        distance: "8px",
      },
    },
    features: {
      glassmorphism: false,
      brutalism: false,
      neon: false,
      serif: false,
      bento: false,
      soft: false,
      monochrome: false,
      pixel: true,
      organic: false,
      blueprint: false,
    },
    performance: {
      lcp: 2000,
      inp: 140,
      cls: 0.04,
    },
  },

  "nature-organic": {
    id: "nature-organic",
    name: "Nature Organic",
    description: "Fluid forms with subtle noise textures",
    category: "modern",
    version: "1.0.0",
    tokens: {
      colors: {
        base: "oklch(150 20% 98%)",
        contrast: "oklch(0 0% 100%)",
        primary: "oklch(145 18% 62%)",
        secondary: "oklch(70 17% 55%)",
        accent: "oklch(25 20% 60%)",
        warning: "hsl(38 92% 50%)",
        success: "hsl(142 76% 36%)",
        error: "hsl(0 84.2% 60.2%)",
        border: "oklch(150 15% 88%)",
        surface: "oklch(0 0% 100%)",
        elevated: "oklch(0 0% 100%)",
      },
      typography: {
        family: {
          display: "Inter Tight, system-ui",
          body: "Inter, system-ui",
        },
        scale: {
          h1: "clamp(2rem, 5vw, 3.2rem)",
          h2: "clamp(1.5rem, 3vw, 2.25rem)",
          h3: "clamp(1.25rem, 2vw, 1.75rem)",
          body: "clamp(1rem, 2vw, 1.125rem)",
          caption: "0.875rem",
          overline: "0.75rem",
        },
      },
      spacing: {
        xs: "0.5rem",
        sm: "0.5rem",
        md: "1rem",
        lg: "1.5rem",
        xl: "2rem",
        xxl: "3rem",
        section: { mobile: "3rem", desktop: "6rem" },
      },
      radius: {
        xs: "1rem",
        sm: "1.5rem",
        md: "2rem",
        lg: "2.5rem",
        xl: "3rem",
      },
      shadows: {
        none: "none",
        sm: "0 2px 8px rgb(20 40 20 / 0.08)",
        md: "0 4px 12px rgb(20 40 20 / 0.1)",
        lg: "0 8px 20px rgb(20 40 20 / 0.12)",
        xl: "0 12px 28px rgb(20 40 20 / 0.15)",
      },
      motion: {
        duration: {
          instant: "100ms",
          fast: "200ms",
          normal: "320ms",
          slow: "480ms",
        },
        easing: {
          standard: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          entrance: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          emphasis: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        },
        distance: "18px",
      },
    },
    features: {
      glassmorphism: false,
      brutalism: false,
      neon: false,
      serif: false,
      bento: false,
      soft: true,
      monochrome: false,
      pixel: false,
      organic: true,
      blueprint: false,
    },
    performance: {
      lcp: 2450,
      inp: 190,
      cls: 0.09,
    },
  },

  "tech-blueprint": {
    id: "tech-blueprint",
    name: "Tech Blueprint",
    description: "Fine lines with visible grid patterns",
    category: "experimental",
    version: "1.0.0",
    tokens: {
      colors: {
        base: "oklch(220 25% 10%)",
        contrast: "oklch(220 10% 95%)",
        primary: "oklch(200 80% 60%)",
        secondary: "oklch(160 40% 55%)",
        accent: "oklch(40 60% 60%)",
        warning: "hsl(45 80% 65%)",
        success: "hsl(120 60% 55%)",
        error: "hsl(0 70% 65%)",
        border: "oklch(220 15% 25%)",
        surface: "oklch(220 20% 15%)",
        elevated: "oklch(220 15% 20%)",
      },
      typography: {
        family: {
          display: "Inter Tight, system-ui",
          body: "Inter, system-ui",
        },
        scale: {
          h1: "clamp(2rem, 5vw, 3.2rem)",
          h2: "clamp(1.5rem, 3vw, 2.25rem)",
          h3: "clamp(1.25rem, 2vw, 1.75rem)",
          body: "clamp(1rem, 2vw, 1.125rem)",
          caption: "0.875rem",
          overline: "0.75rem",
        },
      },
      spacing: {
        xs: "0.5rem",
        sm: "0.5rem",
        md: "1rem",
        lg: "1.5rem",
        xl: "2rem",
        xxl: "3rem",
        section: { mobile: "3rem", desktop: "6rem" },
      },
      radius: {
        xs: "0.25rem",
        sm: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.25rem",
      },
      shadows: {
        none: "none",
        sm: "0 0 0 1px hsl(var(--border))",
        md: "0 0 8px rgb(0 20 60 / 0.3), 0 0 0 1px hsl(var(--border))",
        lg: "0 0 16px rgb(0 20 60 / 0.4), 0 0 0 1px hsl(var(--border))",
        xl: "0 0 24px rgb(0 20 60 / 0.5), 0 0 0 1px hsl(var(--border))",
      },
      motion: {
        duration: {
          instant: "100ms",
          fast: "150ms",
          normal: "250ms",
          slow: "350ms",
        },
        easing: {
          standard: "cubic-bezier(0.4, 0, 0.2, 1)",
          entrance: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
          emphasis: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        },
        distance: "12px",
      },
    },
    features: {
      glassmorphism: false,
      brutalism: false,
      neon: false,
      serif: false,
      bento: false,
      soft: false,
      monochrome: false,
      pixel: false,
      organic: false,
      blueprint: true,
    },
    performance: {
      lcp: 2500,
      inp: 200,
      cls: 0.1,
    },
  },
};

// Utility functions for theme management
export function getThemePack(themeId: string): ThemePack | null {
  return THEME_REGISTRY[themeId] || null;
}

export function getAllThemePacks(): ThemePack[] {
  return Object.values(THEME_REGISTRY);
}

export function getThemesByCategory(
  category: ThemePack["category"],
): ThemePack[] {
  return Object.values(THEME_REGISTRY).filter(
    (theme) => theme.category === category,
  );
}

export function getThemePerformance(themeId: string) {
  const theme = getThemePack(themeId);
  return theme?.performance || null;
}
