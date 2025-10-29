import type { ComponentType } from "react";
import { lazy } from "react";
import { PlaceholderSection } from "./placeholder-section";

// Import critical sections (synchronous)
import { Hero } from "../../../components/sections/hero";
import { Pricing } from "../../../components/sections/pricing";
import { FinalCta } from "../../../components/sections/final-cta";

// Lazy load important sections
const BenefitsSection = lazy(
  () => import("../../../components/sections/benefits"),
);

const FeaturesSection = lazy(
  () => import("../../../components/sections/features"),
);

const SocialProofSection = lazy(
  () => import("../../../components/sections/social-proof"),
);

const FaqSection = lazy(() => import("../../../components/sections/faq"));

const DemoSection = lazy(() => import("../../../components/sections/demo"));

// Lazy load secondary sections
const Footer = lazy(() => import("../../../components/sections/footer"));

// Placeholder component for sections not yet implemented

// Placeholder components for sections not yet implemented
const Checkout = PlaceholderSection;
const Trial = PlaceholderSection;
const Signup = PlaceholderSection;
const Pillars = PlaceholderSection;
const HowItWorks = PlaceholderSection;
const Verticals = PlaceholderSection;
const PricingPresale = PlaceholderSection;

const ProofTraction = lazy(
  () => import("../../../components/sections/proof-traction"),
);

const LeadForm = lazy(() => import("../../../components/sections/lead-form"));

// Define section ID type for type safety (matches ports.ts)
export type SectionId =
  | "hero"
  | "benefits"
  | "features"
  | "pricing"
  | "social-proof"
  | "demo"
  | "faq"
  | "final-cta"
  | "footer"
  | "checkout"
  | "trial"
  | "signup"
  | "pillars"
  | "how-it-works"
  | "verticals"
  | "proof-traction"
  | "lead-form"
  | "pricing-presale";

// Component type mapping for type safety
export type SectionComponentMap = {
  readonly hero: typeof Hero;
  readonly pricing: typeof Pricing;
  readonly "final-cta": typeof FinalCta;
  readonly benefits: typeof BenefitsSection;
  readonly features: typeof FeaturesSection;
  readonly "social-proof": typeof SocialProofSection;
  readonly faq: typeof FaqSection;
  readonly demo: typeof DemoSection;
  readonly footer: typeof Footer;
  readonly checkout: typeof Checkout;
  readonly trial: typeof Trial;
  readonly signup: typeof Signup;
  readonly pillars: typeof Pillars;
  readonly "how-it-works": typeof HowItWorks;
  readonly verticals: typeof Verticals;
  readonly "proof-traction": typeof ProofTraction;
  readonly "lead-form": typeof LeadForm;
  readonly "pricing-presale": typeof PricingPresale;
};

// Section criticality classification
export type SectionCriticality = "critical" | "important" | "secondary";

export interface SectionMetadata {
  readonly id: SectionId;
  readonly criticality: SectionCriticality;
  readonly lazyLoad: boolean;
  readonly ssrEnabled: boolean;
}

/**
 * Central registry for all section components with type safety
 */
export class SectionRegistry {
  // Component registry with strict typing
  private static readonly componentRegistry: SectionComponentMap = {
    hero: Hero,
    pricing: Pricing,
    "final-cta": FinalCta,
    benefits: BenefitsSection,
    features: FeaturesSection,
    "social-proof": SocialProofSection,
    faq: FaqSection,
    demo: DemoSection,
    footer: Footer,
    checkout: Checkout,
    trial: Trial,
    signup: Signup,
    pillars: Pillars,
    "how-it-works": HowItWorks,
    verticals: Verticals,
    "proof-traction": ProofTraction,
    "lead-form": LeadForm,
    "pricing-presale": PricingPresale,
  } as const;

  // Section metadata registry
  private static readonly metadataRegistry: Record<SectionId, SectionMetadata> =
    {
      // Critical sections - no lazy loading, always SSR
      hero: {
        id: "hero",
        criticality: "critical",
        lazyLoad: false,
        ssrEnabled: true,
      },
      pricing: {
        id: "pricing",
        criticality: "critical",
        lazyLoad: false,
        ssrEnabled: true,
      },
      "final-cta": {
        id: "final-cta",
        criticality: "critical",
        lazyLoad: false,
        ssrEnabled: true,
      },

      // Important sections - lazy loading with SSR
      benefits: {
        id: "benefits",
        criticality: "important",
        lazyLoad: true,
        ssrEnabled: false,
      },
      features: {
        id: "features",
        criticality: "important",
        lazyLoad: true,
        ssrEnabled: false,
      },
      "social-proof": {
        id: "social-proof",
        criticality: "important",
        lazyLoad: true,
        ssrEnabled: false,
      },
      faq: {
        id: "faq",
        criticality: "important",
        lazyLoad: true,
        ssrEnabled: false,
      },
      demo: {
        id: "demo",
        criticality: "important",
        lazyLoad: true,
        ssrEnabled: false,
      },

      // Secondary sections - lazy loading without SSR
      footer: {
        id: "footer",
        criticality: "secondary",
        lazyLoad: true,
        ssrEnabled: false,
      },
      checkout: {
        id: "checkout",
        criticality: "secondary",
        lazyLoad: true,
        ssrEnabled: false,
      },
      trial: {
        id: "trial",
        criticality: "secondary",
        lazyLoad: true,
        ssrEnabled: false,
      },
      signup: {
        id: "signup",
        criticality: "secondary",
        lazyLoad: true,
        ssrEnabled: false,
      },
      pillars: {
        id: "pillars",
        criticality: "secondary",
        lazyLoad: true,
        ssrEnabled: false,
      },
      "how-it-works": {
        id: "how-it-works",
        criticality: "secondary",
        lazyLoad: true,
        ssrEnabled: false,
      },
      verticals: {
        id: "verticals",
        criticality: "secondary",
        lazyLoad: true,
        ssrEnabled: false,
      },
      "proof-traction": {
        id: "proof-traction",
        criticality: "secondary",
        lazyLoad: true,
        ssrEnabled: false,
      },
      "lead-form": {
        id: "lead-form",
        criticality: "secondary",
        lazyLoad: true,
        ssrEnabled: false,
      },
      "pricing-presale": {
        id: "pricing-presale",
        criticality: "secondary",
        lazyLoad: true,
        ssrEnabled: false,
      },
    } as const;

  /**
   * Get component for section ID with type safety
   */
  static getComponent<K extends SectionId>(
    sectionId: K,
  ): SectionComponentMap[K] {
    const component = this.componentRegistry[sectionId];

    if (!component) {
      throw new Error(
        `Component not found in registry for section: ${sectionId}. ` +
          `Available sections: ${this.getAllSectionIds().join(", ")}`,
      );
    }

    return component;
  }

  /**
   * Get metadata for section ID
   */
  static getMetadata(sectionId: SectionId): SectionMetadata {
    const metadata = this.metadataRegistry[sectionId];

    if (!metadata) {
      throw new Error(`Metadata not found for section: ${sectionId}`);
    }

    return metadata;
  }

  /**
   * Check if section should use lazy loading
   */
  static shouldLazyLoad(sectionId: SectionId): boolean {
    return this.getMetadata(sectionId).lazyLoad;
  }

  /**
   * Check if section should use SSR
   */
  static shouldUseSSR(sectionId: SectionId): boolean {
    return this.getMetadata(sectionId).ssrEnabled;
  }

  /**
   * Get criticality level of section
   */
  static getCriticality(sectionId: SectionId): SectionCriticality {
    return this.getMetadata(sectionId).criticality;
  }

  /**
   * Get all registered section IDs
   */
  static getAllSectionIds(): SectionId[] {
    return Object.keys(this.metadataRegistry) as SectionId[];
  }

  /**
   * Get sections by criticality
   */
  static getSectionsByCriticality(
    criticality: SectionCriticality,
  ): SectionId[] {
    return this.getAllSectionIds().filter(
      (id) => this.getCriticality(id) === criticality,
    );
  }

  /**
   * Validate that a section ID is registered
   */
  static isValidSectionId(sectionId: string): sectionId is SectionId {
    return sectionId in this.metadataRegistry;
  }

  /**
   * Get registry statistics
   */
  static getStats() {
    const allSections = this.getAllSectionIds();
    const criticalSections = this.getSectionsByCriticality("critical");
    const importantSections = this.getSectionsByCriticality("important");
    const secondarySections = this.getSectionsByCriticality("secondary");

    return {
      totalSections: allSections.length,
      criticalSections: criticalSections.length,
      importantSections: importantSections.length,
      secondarySections: secondarySections.length,
      lazyLoadedSections: allSections.filter((id) => this.shouldLazyLoad(id))
        .length,
      ssrEnabledSections: allSections.filter((id) => this.shouldUseSSR(id))
        .length,
    };
  }
}
