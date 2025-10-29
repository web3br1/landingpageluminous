// Ports & Interfaces for Dependency Inversion
// Application Layer Ports (interfaces that domain uses)

import type { Result } from "@/shared/core";
import { Result as ResultValue } from "@/shared/core";
import type { AppError as SharedAppError } from "@/shared/errors";

export { ResultValue as Result };

export interface IPageCompositionService {
  composePage(
    pageType: PageType,
    context?: CompositionContext,
  ): Promise<Result<PageComposition, SharedAppError>>;
  composePageSync(
    pageType: PageType,
    context?: CompositionContext,
  ): Result<PageComposition, SharedAppError>;
}

export interface IContentMapper {
  mapSectionContent(
    sectionId: SectionId,
    pageType: PageType,
    context?: CompositionContext,
  ): Promise<Result<SectionContent, SharedAppError>>;
  mapSectionContentSync(
    sectionId: SectionId,
    pageType: PageType,
    context?: CompositionContext,
  ): Result<SectionContent, SharedAppError>;
}

export interface IFallbackProvider {
  getFallbackComposition(
    pageType: string,
    error?: unknown,
  ): Result<PageComposition, SharedAppError>;
  getFallbackSectionContent(
    sectionId: SectionId,
  ): Result<SectionContent, SharedAppError>;
}

// Application Layer Ports (interfaces that domain uses)

export interface IExperimentService {
  getActiveVariant(
    experimentId: string,
  ): Promise<Result<string, SharedAppError>>;
  isExperimentActive(
    experimentId: string,
  ): Promise<Result<boolean, SharedAppError>>;
}

export interface IAnalyticsService {
  trackPageView(
    pageType: PageType,
    metadata: PageMetadata,
  ): Promise<Result<void, SharedAppError>>;
  trackSectionLoad(
    sectionId: SectionId,
    loadTime: number,
  ): Promise<Result<void, SharedAppError>>;
}

export interface IPerformanceMonitor {
  startTimer(operation: string): TimerHandle;
  endTimer(handle: TimerHandle): Promise<Result<number, SharedAppError>>;
  recordMetric(
    name: string,
    value: number,
    tags?: Record<string, string>,
  ): Promise<Result<void, SharedAppError>>;
}

export interface IErrorTracker {
  captureException(
    error: Error,
    context?: Record<string, unknown>,
  ): Promise<Result<void, SharedAppError>>;
  captureMessage(
    message: string,
    level: LogLevel,
    context?: Record<string, unknown>,
  ): Promise<Result<void, SharedAppError>>;
}

export interface ISSRAdapter {
  isServerContext(): boolean;
  isClientContext(): boolean;
  getEnvironmentInfo(): EnvironmentInfo;
  safeWindowAccess<T>(operation: () => T, fallback: T): T;
  safeLocalStorageAccess<T>(key: string, fallback: T): T;
  safeAsyncOperation<T>(
    operation: () => Promise<T>,
    fallback: T,
    context?: string,
  ): Promise<T>;
  isStaticGeneration(): boolean;
  safeTimeout(callback: () => void, delay: number): () => void;
  safeConsoleLog(level: "log" | "warn" | "error", ...args: any[]): void;
}

// Domain Types (pure, no dependencies)

// Unified PageType covering all application routes
export type PageType =
  | "landing"
  | "features"
  | "pricing"
  | "demo"
  | "signup"
  | "trial"
  | "checkout"
  // Admin pages - unified composition
  | "admin-experiments"
  | "admin-experiments-dashboard"
  | "admin-ml"
  | "admin-monitoring"
  | "admin-performance"
  | "admin-tracing"
  | "admin-logs"
  | "admin-webhooks"
  // Development pages (noindex, robots blocked)
  | "debug-styles"
  | "dev"
  | "playground"
  | "test"
  | "test-styles"
  | "ssr-test";

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

export interface SectionContent {
  content: any; // Will be properly typed per section
  variant: {
    id: string;
    name: string;
    description?: string;
  };
  experiment?: {
    id: string;
    variant: string;
  };
  timestamp?: number;
  // Admin page specific properties
  title?: string;
  subtitle?: string;
}

export interface PageComposition {
  sections: SectionConfig[];
  metadata: PageMetadata;
  experiments: ExperimentInfo[];
  analytics: AnalyticsInfo;
  pageType: PageType;
}

export interface SectionConfig {
  id: SectionId;
  component: string;
  content: SectionContent | null;
  order: number;
  enabled?: boolean;
  conditions?: SectionConditions;
  tracking?: {
    section: SectionId;
    experimentId?: string;
    variant?: string;
  };
}

export interface PageMetadata {
  title: string;
  description: string;
  keywords: readonly string[];
  ogImage?: string;
  robots?: string; // For admin pages (noindex,nofollow)
}

export interface ExperimentInfo {
  id: string;
  variant: string;
  sections: SectionId[];
}

export interface AnalyticsInfo {
  pageType: PageType;
  conversionGoals: readonly string[];
}

export interface SectionConditions {
  breakpoint?: "mobile" | "tablet" | "desktop";
  experiment?: {
    experimentId: string;
    variant?: string;
    userContext?: Record<string, any>;
  };
  userType?: "new" | "returning" | "enterprise";
}

export interface CompositionContext {
  userId?: string;
  tenantId?: string;
  userSegments?: string[];
  experiments?: Record<string, string>;
  locale?: string;
  featureFlags?: Record<string, boolean>;
  experimentOverrides?: Record<string, string>;
}

export interface EnvironmentInfo {
  isServer: boolean;
  isClient: boolean;
  isDevelopment: boolean;
  isProduction: boolean;
  nodeEnv: string;
}

export interface TimerHandle {
  id: string;
  operation: string;
  startTime: number;
}

export type LogLevel = "debug" | "info" | "warn" | "error";

// Shared AppError type re-exported for convenience
export type AppError = SharedAppError;
