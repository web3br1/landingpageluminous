// Domain Types - Demo Section Types
// Type-safe definitions for demo content and behavior

export interface DemoVideo {
  src: string;
  poster?: string;
  title: string;
  duration?: string;
  format: "mp4" | "webm" | "youtube" | "vimeo";
  videoId?: string; // for YouTube/Vimeo
}

export interface DemoScreenshot {
  src: string;
  alt: string;
  title: string;
  description?: string;
  hotspot?: {
    x: number; // percentage 0-100
    y: number; // percentage 0-100
    label: string;
    description: string;
  };
}

export interface DemoTourStep {
  title: string;
  description: string;
  screenshot?: DemoScreenshot;
  video?: DemoVideo;
  cta?: {
    text: string;
    link: string;
  };
}

export interface DemoFeatures {
  title: string;
  items: string[];
}

export interface DemoStats {
  label: string;
  value: string;
}

export interface DemoTestimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
}

export interface DemoCta {
  primary: {
    text: string;
    link: string;
  };
  secondary?: {
    text: string;
    link: string;
  };
}

export interface DemoContent {
  title: string;
  subtitle: string;
  description: string;
  demoType:
    | "video"
    | "interactive-tour"
    | "screenshots"
    | "live-demo"
    | "hybrid";
  primaryVideo?: DemoVideo;
  screenshots?: DemoScreenshot[];
  tourSteps?: DemoTourStep[];
  features: DemoFeatures;
  stats?: DemoStats[];
  cta: DemoCta;
  testimonial?: DemoTestimonial;
}

export interface DemoSectionProps {
  content: DemoContent;
  variant?: "default" | "video-only" | "interactive-tour";
  tracking?: {
    experimentId?: string;
    variant?: string;
    section: "demo";
  };
  onVideoPlay?: (video: DemoVideo) => void;
  onScreenshotClick?: (screenshot: DemoScreenshot, index: number) => void;
  onTourStepClick?: (step: DemoTourStep, index: number) => void;
  onCtaClick?: (cta: "primary" | "secondary") => void;
  headingId?: string;
}

export interface DemoTracking {
  experimentId?: string;
  variant?: string;
  section: "demo";
  interactions: {
    videoPlays: number;
    screenshotClicks: Record<number, number>;
    tourStepClicks: Record<number, number>;
    ctaClicks: Record<string, number>;
  };
}
