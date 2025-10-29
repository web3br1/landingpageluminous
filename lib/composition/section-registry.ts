// Composition System - Section Registry
// Registry of available sections and their configurations

// Section registry for dynamic component loading
export interface SectionDefinition {
  id: string;
  name: string;
  component: string;
  category: "hero" | "content" | "conversion" | "social" | "footer";
  requiredProps?: string[];
  optionalProps?: string[];
  defaultConfig?: Record<string, any>;
}

// Available sections registry - Canonical composition-first sections
export const sectionRegistry: Record<string, SectionDefinition> = {
  // Hero sections
  hero: {
    id: "hero",
    name: "Hero Section",
    component: "Hero",
    category: "hero",
    requiredProps: ["content"],
    defaultConfig: {
      animate: true,
      showMetrics: true,
    },
  },

  // Content sections
  benefits: {
    id: "benefits",
    name: "Benefits Section",
    component: "Benefits",
    category: "content",
    requiredProps: ["content"],
    defaultConfig: {
      columns: 3,
      animate: true,
    },
  },

  features: {
    id: "features",
    name: "Features Section",
    component: "Features",
    category: "content",
    requiredProps: ["content"],
    defaultConfig: {
      layout: "grid",
      animate: true,
    },
  },

  pricing: {
    id: "pricing",
    name: "Pricing Section",
    component: "Pricing",
    category: "conversion",
    requiredProps: ["content"],
    defaultConfig: {
      layout: "cards",
      showAnnualToggle: true,
    },
  },

  faq: {
    id: "faq",
    name: "FAQ Section",
    component: "Faq",
    category: "content",
    requiredProps: ["content"],
    defaultConfig: {
      collapsible: true,
      showSearch: false,
    },
  },

  "final-cta": {
    id: "final-cta",
    name: "Final CTA Section",
    component: "FinalCta",
    category: "conversion",
    requiredProps: ["content"],
    defaultConfig: {
      variant: "primary",
      showUrgency: true,
    },
  },

  footer: {
    id: "footer",
    name: "Footer Section",
    component: "Footer",
    category: "footer",
    requiredProps: ["content"],
    defaultConfig: {
      showNewsletter: true,
      showSocialLinks: true,
    },
  },

  "social-proof": {
    id: "social-proof",
    name: "Social Proof Section",
    component: "SocialProof",
    category: "social",
    requiredProps: ["content"],
    defaultConfig: {
      showLogos: true,
      showTestimonials: true,
      showMetrics: true,
    },
  },

  demo: {
    id: "demo",
    name: "Demo Section",
    component: "Demo",
    category: "content",
    requiredProps: ["content"],
    defaultConfig: {
      autoplay: false,
      showTour: true,
      showScreenshots: true,
    },
  },

  checkout: {
    id: "checkout",
    name: "Checkout Section",
    component: "Checkout",
    category: "conversion",
    requiredProps: ["content"],
    defaultConfig: {
      showSecurityBadges: true,
      showTestimonials: false,
      enableDiscounts: true,
    },
  },
};

// Utility functions
export function getSectionDefinition(
  sectionId: string,
): SectionDefinition | null {
  return sectionRegistry[sectionId] || null;
}

export function getSectionsByCategory(
  category: SectionDefinition["category"],
): SectionDefinition[] {
  return Object.values(sectionRegistry).filter(
    (section) => section.category === category,
  );
}

export function getAllSections(): SectionDefinition[] {
  return Object.values(sectionRegistry);
}

export function validateSectionConfig(
  sectionId: string,
  config: Record<string, any>,
): boolean {
  const definition = getSectionDefinition(sectionId);
  if (!definition) return false;

  // Check required props
  if (definition.requiredProps) {
    const missingProps = definition.requiredProps.filter(
      (prop) => !(prop in config),
    );
    if (missingProps.length > 0) {
      console.warn(
        `Section ${sectionId} missing required props:`,
        missingProps,
      );
      return false;
    }
  }

  return true;
}
