// Domain Types - Marketing Pillars Section
// Type definitions for pillars section content and configuration

export interface Pillar {
  icon: string;
  title: string;
  description: string;
  order?: number;
}

export interface PillarsContent {
  title?: string;
  subtitle?: string;
  pillars?: Pillar[];
}

export interface PillarsVariant {
  id: string;
  name: string;
  description: string;
  content: PillarsContent;
  weight?: number; // For A/B testing (0-100)
  conditions?: {
    device?: "mobile" | "desktop" | "all";
    userType?: "new" | "returning" | "all";
  };
}

export interface PillarsConfiguration {
  variants: PillarsVariant[];
  defaultVariant: string;
  experimentId?: string;
}

// Type for pillars composer result
export interface ComposedPillarsData {
  content: PillarsContent;
  variant: PillarsVariant;
  experiment?: {
    id: string;
    variant: string;
    isActive: boolean;
  };
}
