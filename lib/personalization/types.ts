// Personalization Types and Interfaces

export interface UserSegment {
  id: string;
  name: string;
  description: string;
  criteria: UserCriteria;
  priority: number; // Higher priority segments take precedence
}

export interface UserCriteria {
  // Demographic
  companySize?: "startup" | "small" | "medium" | "enterprise";
  industry?: string[];
  role?: string[];

  // Behavioral
  visitCount?: { min: number; max?: number };
  timeOnSite?: { min: number; max?: number }; // in minutes
  pagesViewed?: string[];
  conversionStage?: "awareness" | "consideration" | "decision";

  // Technical
  deviceType?: "mobile" | "tablet" | "desktop";
  referrer?: string[];
  utmSource?: string[];
  location?: string[]; // country codes

  // Custom
  customFlags?: Record<string, any>;
}

export interface UserProfile {
  id: string; // Anonymous ID
  segments: string[]; // Active segment IDs
  attributes: UserAttributes;
  preferences: UserPreferences;
  behavior: UserBehavior;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAttributes {
  // Basic info (anonymized)
  deviceType: "mobile" | "tablet" | "desktop";
  location?: string; // Country code
  language: string;
  timezone?: string;

  // Business context
  companySize?: string;
  industry?: string;
  role?: string;

  // Technical
  browser: string;
  os: string;
  screenSize: string;
}

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  language: string;
  notifications: boolean;
  marketingEmails: boolean;
  contentTypes: string[]; // ['videos', 'blogs', 'webinars', etc.]
}

export interface UserBehavior {
  visitCount: number;
  totalTimeOnSite: number; // in minutes
  pagesViewed: string[];
  lastVisit: Date;
  conversionEvents: ConversionEvent[];
  experimentImpressions: ExperimentImpression[];
}

export interface ConversionEvent {
  id: string;
  type:
    | "signup"
    | "demo_request"
    | "pricing_view"
    | "checkout_start"
    | "purchase";
  value?: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ExperimentImpression {
  experimentId: string;
  variant: string;
  timestamp: Date;
  converted?: boolean;
  conversionGoal?: string;
}

// Personalization Rules
export interface PersonalizationRule {
  id: string;
  name: string;
  conditions: PersonalizationCondition[];
  actions: PersonalizationAction[];
  priority: number;
  active: boolean;
}

export interface PersonalizationCondition {
  type: "segment" | "behavior" | "attribute" | "experiment";
  key: string;
  operator:
    | "equals"
    | "contains"
    | "greater_than"
    | "less_than"
    | "in"
    | "not_in";
  value: any;
}

export interface PersonalizationAction {
  type:
    | "content_override"
    | "element_show"
    | "element_hide"
    | "redirect"
    | "custom";
  target: string; // CSS selector or content key
  value: any;
  metadata?: Record<string, any>;
}

// Content Personalization
export interface PersonalizedContent {
  baseContent: any;
  overrides: Record<string, any>; // segmentId -> content override
  experiments: Record<string, any>; // experimentId -> variant content
}

// Analytics for Personalization
export interface PersonalizationMetrics {
  segmentDistribution: Record<string, number>;
  rulePerformance: Record<string, RuleMetrics>;
  contentEffectiveness: Record<string, ContentMetrics>;
}

export interface RuleMetrics {
  impressions: number;
  conversions: number;
  conversionRate: number;
  avgTimeOnPage: number;
}

export interface ContentMetrics {
  views: number;
  engagement: number; // clicks, scrolls, etc.
  conversions: number;
  conversionRate: number;
}
