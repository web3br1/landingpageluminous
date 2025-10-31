// Layout Registry System
// Similar to Section Registry but for layouts - ensures consistent layout composition

import React, { ReactNode } from "react";

// Import provider components
import { ThemeProvider } from "@/lib/theme/theme-context";
import { NotificationProvider } from "@/lib/notifications";

// Layout configuration types
export interface ProviderConfig {
  component: React.ComponentType<unknown>;
  props?: Record<string, unknown>;
  condition?: () => boolean;
}

export interface LayoutConfig {
  id: string;
  name: string;
  description: string;

  // HTML structure
  wrapper: "div" | "main" | "section"; // Never 'body' or 'html' - those are in root layout
  semanticRole?: "banner" | "main" | "complementary" | "contentinfo";

  // Styling
  baseClasses: string;
  responsiveClasses?: string;
  themeClasses?: string;

  // Providers and wrappers
  providers: ProviderConfig[];

  // Metadata and SEO
  metadata?: {
    title?: string;
    description?: string;
    structuredData?: unknown;
  };

  // Error boundaries
  errorBoundary?: boolean;
  errorFallback?: React.ComponentType;

  // Analytics
  analytics?: {
    pageType: string;
    conversionGoals: string[];
  };

  // Feature flags
  featureFlags?: string[];

  // Validation
  validation?: {
    requiredSections?: string[];
    maxSections?: number;
    allowedSections?: string[];
  };
}

// Base layout configuration that can be extended by domain layouts
const baseLayoutConfig: Partial<LayoutConfig> = {
  wrapper: "div",
  baseClasses: "min-h-screen font-sans antialiased",
  responsiveClasses: "px-4 md:px-6 lg:px-8",
  errorBoundary: true,
  featureFlags: ["layout-composition"],
};

// Layout registry - centralized layout definitions with domain consistency
export const layoutRegistry: Record<string, LayoutConfig> = {
  marketing: {
    ...baseLayoutConfig,
    id: "marketing",
    name: "Marketing Layout",
    description:
      "Standard marketing page layout with hero, sections, and footer",
    semanticRole: "main",

    // Marketing-specific overrides
    themeClasses:
      "bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-950",

    // Providers
    providers: [
      {
        component: ThemeProvider,
        props: { defaultTheme: { mode: "system", colorScheme: "default" } },
      },
      {
        component: NotificationProvider,
      },
    ],

    metadata: {
      title:
        "DataFlow — Relatórios automáticos em minutos | Business Intelligence",
      description:
        "Pare de perder tempo com planilhas manuais. Automatize seus relatórios de vendas, financeiro e operações. 14 dias grátis. Mais de 2.500 empresas confiam na DataFlow.",
      structuredData: {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Luminaris",
        description:
          "Plataforma de business intelligence que automatiza relatórios e dashboards para PME brasileiras",
      },
    },

    analytics: {
      pageType: "marketing",
      conversionGoals: [
        "cta_click",
        "signup_start",
        "demo_request",
        "scroll_depth",
        "time_on_page",
      ],
    },

    validation: {
      requiredSections: ["hero"],
      allowedSections: [
        "hero",
        "social-proof",
        "benefits",
        "features",
        "pricing",
        "faq",
        "final-cta",
        "footer",
      ],
      maxSections: 12,
    },
  } as LayoutConfig,

  conversion: {
    ...baseLayoutConfig,
    id: "conversion",
    name: "Conversion Layout",
    description:
      "Conversion-focused layout for signup, checkout, and trial pages",

    // Conversion-specific overrides
    themeClasses:
      "bg-gradient-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800",
    responsiveClasses: "px-4 md:px-6",

    // Providers
    providers: [
      {
        component: ThemeProvider,
        props: { defaultTheme: { mode: "system", colorScheme: "default" } },
      },
      {
        component: NotificationProvider,
      },
    ],

    metadata: {
      title: "Complete seu Cadastro | Luminaris",
      structuredData: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Cadastro Luminaris",
        description:
          "Complete seu cadastro na plataforma de business intelligence",
      },
    },

    analytics: {
      pageType: "conversion",
      conversionGoals: [
        "form_submit",
        "checkout_complete",
        "form_abandon",
        "field_interaction",
      ],
    },

    validation: {
      allowedSections: [
        "form",
        "progress",
        "trust-indicators",
        "pricing-summary",
      ],
      maxSections: 6,
    },
  } as LayoutConfig,

  product: {
    ...baseLayoutConfig,
    id: "product",
    name: "Product Layout",
    description: "Product pages layout with navigation and structured content",

    // Product-specific overrides
    semanticRole: "main",

    // Providers
    providers: [
      {
        component: ThemeProvider,
        props: { defaultTheme: { mode: "system", colorScheme: "default" } },
      },
      {
        component: NotificationProvider,
      },
    ],

    metadata: {
      title: "Funcionalidades | Luminaris",
      structuredData: {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "Funcionalidades Luminaris",
        description:
          "Explore todas as funcionalidades da plataforma de business intelligence",
      },
    },

    analytics: {
      pageType: "product",
      conversionGoals: [
        "feature_view",
        "demo_request",
        "pricing_view",
        "contact_submit",
      ],
    },

    validation: {
      requiredSections: ["navigation"],
      allowedSections: [
        "navigation",
        "hero",
        "features",
        "pricing",
        "demo",
        "faq",
        "footer",
      ],
      maxSections: 10,
    },
  } as LayoutConfig,
};

// Layout composer function
export interface ComposedLayout {
  config: LayoutConfig;
  wrapper: keyof React.JSX.IntrinsicElements;
  className: string;
  providers: ProviderConfig[];
  metadata: LayoutConfig["metadata"];
  validation: LayoutConfig["validation"];
}

export function composeLayout(layoutId: string): ComposedLayout {
  const config = layoutRegistry[layoutId];

  if (!config) {
    throw new Error(`Layout "${layoutId}" not found in registry`);
  }

  // Build className from config
  const className = [
    config.baseClasses,
    config.responsiveClasses,
    config.themeClasses,
  ]
    .filter(Boolean)
    .join(" ");

  // Compose providers - will be rendered in LayoutComposer
  const providers = config.providers.filter(
    (provider) => !provider.condition || provider.condition(),
  );

  return {
    config,
    wrapper: config.wrapper,
    className,
    providers,
    metadata: config.metadata,
    validation: config.validation,
  };
}

// Layout validation
export function validateLayoutComposition(
  layoutId: string,
  sections: Array<{ id: string }>,
): { valid: boolean; errors: string[] } {
  const layout = layoutRegistry[layoutId];
  if (!layout?.validation) {
    return { valid: true, errors: [] };
  }

  const errors: string[] = [];
  const { validation } = layout;

  // Check required sections
  if (validation.requiredSections) {
    const missingSections = validation.requiredSections.filter(
      (requiredId) => !sections.some((section) => section.id === requiredId),
    );
    if (missingSections.length > 0) {
      errors.push(`Missing required sections: ${missingSections.join(", ")}`);
    }
  }

  // Check max sections
  if (validation.maxSections && sections.length > validation.maxSections) {
    errors.push(
      `Too many sections (${sections.length}). Max allowed: ${validation.maxSections}`,
    );
  }

  // Check allowed sections
  if (validation.allowedSections) {
    const invalidSections = sections.filter(
      (section) => !validation.allowedSections!.includes(section.id),
    );
    if (invalidSections.length > 0) {
      errors.push(
        `Invalid sections for this layout: ${invalidSections.map((s) => s.id).join(", ")}`,
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

// Utility functions
export function getAvailableLayouts(): string[] {
  return Object.keys(layoutRegistry);
}

export function getLayoutConfig(layoutId: string): LayoutConfig | null {
  return layoutRegistry[layoutId] || null;
}
