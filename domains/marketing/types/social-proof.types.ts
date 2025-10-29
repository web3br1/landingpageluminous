// Domain Types - Social Proof Section Types
// Type-safe definitions for social proof content and behavior

export interface CompanyLogo {
  src: string;
  alt: string;
  href?: string;
  width?: number;
  height?: number;
}

export interface Testimonial {
  quote: string;
  author: {
    name: string;
    role: string;
    company: string;
    avatar?: string;
  };
  rating?: number; // 1-5 stars
  featured?: boolean;
}

export interface Metric {
  value: string;
  label: string;
  description?: string;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
}

export interface SocialProofContent {
  title?: string;
  subtitle?: string;
  logos: CompanyLogo[];
  testimonials: Testimonial[];
  metrics: Metric[];
  layout:
    | "logos-only"
    | "testimonials-only"
    | "metrics-only"
    | "mixed-logos-testimonials"
    | "mixed-testimonials-metrics"
    | "full";
  showRatings?: boolean;
  ctaText?: string;
  ctaLink?: string;
  envelope?: {
    id: string;
    type: string;
    version: string;
    timestamp: number;
  };
}

export interface SocialProofSectionProps {
  content: SocialProofContent;
  variant?: "default" | "logos-only" | "testimonials-only" | "metrics-only";
  tracking?: {
    experimentId?: string;
    variant?: string;
    section: "social-proof";
  };
  onLogoClick?: (logoIndex: number, logo: CompanyLogo) => void;
  onTestimonialClick?: (
    testimonialIndex: number,
    testimonial: Testimonial,
  ) => void;
  onMetricClick?: (metricIndex: number, metric: Metric) => void;
  onCtaClick?: () => void;
  headingId?: string;
}

export interface SocialProofTracking {
  experimentId?: string;
  variant?: string;
  section: "social-proof";
  interactions: {
    logoClicks: Record<number, number>;
    testimonialClicks: Record<number, number>;
    metricClicks: Record<number, number>;
    ctaClicks: number;
  };
}
