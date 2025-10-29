// Domain - Marketing
// Main exports for the marketing domain

// Content Layer - Export only data, not types
export { heroContentVariants } from "./content/hero-content";
export { benefitsContentVariants } from "./content/benefits-content";
export { featuresContentVariants } from "./content/features-content";
export { pricingContentVariants } from "./content/pricing-content";
export { pricingPresaleContentVariants } from "./content/pricing-presale-content";
export { faqContentVariants } from "./content/faq-content";
export { pillarsContentVariants } from "./content/pillars-content";
export { howItWorksContentVariants } from "./content/how-it-works-content";
export { verticalsContentVariants } from "./content/verticals-content";
export { socialProofContentVariants } from "./content/social-proof-content";
export { proofTractionContentVariants } from "./content/proof-traction-content";
export { demoContentVariants } from "./content/demo-content";
export { leadFormContentVariants } from "./content/lead-form-content";
export { finalCtaContentVariants } from "./content/final-cta-content";
export { footerContentVariants } from "./content/footer-content";

// Composers
export * from "./composers/hero-composer";
export * from "./composers/benefits-composer";
export * from "./composers/features-composer";
export * from "./composers/pricing-composer";
export * from "./composers/pricing-presale-composer";
export * from "./composers/faq-composer";
export * from "./composers/pillars-composer";
export * from "./composers/how-it-works-composer";
export * from "./composers/verticals-composer";
export * from "./composers/social-proof-composer";
export * from "./composers/proof-traction-composer";
export * from "./composers/demo-composer";
export * from "./composers/lead-form-composer";
export * from "./composers/final-cta-composer";
export * from "./composers/footer-composer";
export * from "./composers/checkout-composer";
export * from "./composers/trial-composer";
export * from "./composers/signup-composer";

// Types
export * from "./types/hero.types";
export * from "./types/benefits.types";
export * from "./types/features.types";
export * from "./types/pricing.types";
export type {
  PricingPresaleContent,
  PricingPresaleVariant,
  ComposedPricingPresaleData,
} from "./types/pricing-presale.types";
export * from "./types/faq.types";
export * from "./types/pillars.types";
export * from "./types/how-it-works.types";
export * from "./types/verticals.types";
export type {
  SocialProofContent,
  CompanyLogo,
  SocialProofSectionProps,
} from "./types/social-proof.types";
export * from "./types/proof-traction.types";
export * from "./types/demo.types";
export * from "./types/lead-form.types";
export * from "./types/final-cta.types";
export * from "./types/footer.types";
export * from "./types/checkout.types";
export * from "./types/trial.types";
export * from "./types/signup.types";
