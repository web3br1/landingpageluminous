import { SectionId } from "../registry/section-registry";
import { LoadingContext } from "./lazy-loading-policy";
import { ProgressiveLoader } from "./progressive-loader";

/**
 * Scaffold B Integration - Progressive Loading Metadata
 * Each SectionComposer returns loading configuration alongside content
 */

export interface SectionLoadingMetadata {
  sectionId: SectionId;

  // Loading priority (Scaffold B integration)
  loadPriority: "hero" | "early" | "deferred";

  // Loading strategy
  strategy: "eager" | "progressive" | "deferred";

  // Progressive loading stages (Phase 1)
  stages: {
    skeleton: React.ComponentType;
    placeholder?: React.ComponentType;
    preview?: React.ComponentType;
  };

  // Context requirements
  requiresAnalyticsConsent?: boolean; // For privacy compliance

  // Performance hints
  estimatedSize?: number; // KB estimate for resource planning
  criticalPath?: boolean; // Part of critical rendering path
}

/**
 * Section Composer Response - Enhanced for Progressive Loading
 */
export interface SectionComposerResponse {
  sectionId: SectionId;
  content: React.ComponentType;
  loadingMetadata: SectionLoadingMetadata;

  // Scaffold B existing fields
  props?: Record<string, unknown>;
  experimentVariant?: string;
}

/**
 * Page Renderer Integration - Uses loading metadata from composers
 */
export class ScaffoldBProgressiveRenderer {
  private context: LoadingContext;

  constructor(context: LoadingContext) {
    this.context = context;
  }

  /**
   * Render section with progressive loading based on composer metadata
   */
  renderSection(composerResponse: SectionComposerResponse) {
    const { sectionId, content, loadingMetadata, props } = composerResponse;

    // Adapt strategy based on context (Phase 1)
    const adaptedStrategy = this.adaptStrategy(loadingMetadata);

    return (
      <ProgressiveLoader
        sectionId={sectionId}
        component={() => Promise.resolve({ default: content })}
        stages={loadingMetadata.stages}
        loadPriority={loadingMetadata.loadPriority}
        strategy={adaptedStrategy}
        context={{
          effectiveType: this.context.effectiveType,
          hardwareConcurrency: this.context.hardwareConcurrency,
          cookieConsent: this.context.cookieConsent,
        }}
        preserveLayout={true}
        onStageComplete={(stage) => {
          // Log for observability
          console.log(`Section ${sectionId} reached stage: ${stage}`);
        }}
        onError={(error) => {
          // Log error for monitoring
          console.error(`Section ${sectionId} failed to load:`, error);
        }}
      />
    );
  }

  /**
   * Adapt loading strategy based on context (Phase 1 logic)
   */
  private adaptStrategy(metadata: SectionLoadingMetadata): "eager" | "progressive" | "deferred" {
    const baseStrategy = metadata.strategy;

    // Privacy gate: no aggressive loading without consent
    if (metadata.requiresAnalyticsConsent && !this.context.cookieConsent?.analytics) {
      return baseStrategy === "eager" ? "progressive" : baseStrategy;
    }

    // Network/capability adaptation
    const isSlowNetwork = this.context.effectiveType === "slow-2g" || this.context.effectiveType === "2g";
    const isLowPower = (this.context.hardwareConcurrency || 4) < 4;

    if (isSlowNetwork || isLowPower) {
      return "deferred";
    }

    return baseStrategy;
  }

  /**
   * Batch render sections with priority ordering
   */
  renderSections(composerResponses: SectionComposerResponse[]) {
    // Sort by priority for optimal loading order
    const sortedResponses = composerResponses.sort((a, b) => {
      const priorityOrder = { hero: 0, early: 1, deferred: 2 };
      return priorityOrder[a.loadingMetadata.loadPriority] - priorityOrder[b.loadingMetadata.loadPriority];
    });

    return sortedResponses.map(response => this.renderSection(response));
  }
}

/**
 * Example: How a Section Composer declares loading metadata
 *
 * This shows how HeroSectionComposer integrates with progressive loading
 */
export function createHeroSectionComposer(): SectionComposerResponse {
  return {
    sectionId: "hero",
    content: React.lazy(() => import("@/components/sections/hero")),

    // Loading metadata - Scaffold B integration
    loadingMetadata: {
      sectionId: "hero",
      loadPriority: "hero", // Critical for LCP
      strategy: "eager", // Load immediately
      stages: {
        skeleton: HeroSkeleton,
        placeholder: HeroPlaceholder,
        // Preview optional in Phase 1
      },
      requiresAnalyticsConsent: false, // Hero can load without consent
      estimatedSize: 150, // KB estimate
      criticalPath: true, // Part of critical rendering path
    },

    props: {
      headline: "Build amazing products",
      subheadline: "The fastest way to ship software",
      ctaText: "Get started",
    },
  };
}

/**
 * Example: How PricingSectionComposer uses deferred loading
 */
export function createPricingSectionComposer(): SectionComposerResponse {
  return {
    sectionId: "pricing",
    content: React.lazy(() => import("@/components/sections/pricing")),

    loadingMetadata: {
      sectionId: "pricing",
      loadPriority: "early", // Important for conversion
      strategy: "progressive", // Load with enhancement
      stages: {
        skeleton: PricingSkeleton,
        placeholder: PricingPlaceholder,
        preview: PricingPreview, // Low-quality pricing table
      },
      requiresAnalyticsConsent: true, // May include conversion tracking
      estimatedSize: 80,
      criticalPath: false,
    },

    props: {
      plans: [],
    },
  };
}

// Import React for lazy loading
import React from "react";

// Skeleton components (examples)
function HeroSkeleton() {
  return (
    <div className="hero-skeleton animate-pulse">
      <div className="h-12 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
      <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto mb-8"></div>
      <div className="h-10 bg-gray-200 rounded w-32 mx-auto"></div>
    </div>
  );
}

function HeroPlaceholder() {
  return (
    <div className="hero-placeholder">
      <h1 className="text-4xl font-bold text-gray-400">Loading...</h1>
      <p className="text-lg text-gray-300 mt-4">Building amazing experiences</p>
    </div>
  );
}

function PricingSkeleton() {
  return (
    <div className="pricing-skeleton animate-pulse grid md:grid-cols-3 gap-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-6 bg-gray-100 rounded-xl">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-8 bg-gray-200 rounded mb-6"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PricingPlaceholder() {
  return (
    <div className="pricing-placeholder grid md:grid-cols-3 gap-8">
      {[1, 2, 3].map((i) => (
        <div key={i} className="p-6 border rounded-xl">
          <h3 className="text-lg font-semibold text-gray-400">Plan {i}</h3>
          <p className="text-2xl font-bold text-gray-300 mt-2">$XX</p>
        </div>
      ))}
    </div>
  );
}

function PricingPreview() {
  return (
    <div className="pricing-preview grid md:grid-cols-3 gap-8 opacity-60">
      {/* Low-quality preview of pricing */}
      <div className="p-6 border rounded-xl">
        <h3 className="text-lg font-semibold">Starter</h3>
        <p className="text-2xl font-bold">$29</p>
        <p className="text-sm text-gray-500">per month</p>
      </div>
      <div className="p-6 border rounded-xl border-blue-200 bg-blue-50">
        <h3 className="text-lg font-semibold">Pro</h3>
        <p className="text-2xl font-bold">$99</p>
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Popular</span>
      </div>
      <div className="p-6 border rounded-xl">
        <h3 className="text-lg font-semibold">Enterprise</h3>
        <p className="text-2xl font-bold">Custom</p>
      </div>
    </div>
  );
}
