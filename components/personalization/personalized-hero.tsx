"use client";

import React from "react";
import { useExperiment, useABContent } from "@/lib/hooks/use-feature-flags";
import { usePersonalization } from "@/lib/personalization/personalization-context";
import { PersonalizedCTA } from "../ui/personalized-cta";
import { createPerformanceValidator } from "../../lib/architecture/component-props";
import { withComponentContext } from "../../lib/architecture/logger-pattern";
import { SimpleErrorBoundary } from "../../lib/architecture/error-boundary-pattern";

// Cache for personalization results (in-memory for this component)
const personalizationCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Schema for personalization props validation
const personalizationPropsSchema = {
  // Component doesn't have explicit props, but we validate internal state
};

// Example of a personalized hero component that adapts based on user segments and experiments
function PersonalizedHero() {
  // Component-specific logger
  const logger = withComponentContext("PersonalizedHero");

  const { activeSegments, personalizeContent, trackUserAction } =
    usePersonalization();
  const headlineExperiment = useExperiment("hero_headline");

  // Generate cache key based on user context
  const cacheKey = React.useMemo(() => {
    const segmentsKey = activeSegments.sort().join(",");
    const experimentKey = headlineExperiment?.variant || "default";
    return `${segmentsKey}:${experimentKey}`;
  }, [activeSegments, headlineExperiment?.variant]);

  // Check cache first
  const cachedResult = personalizationCache.get(cacheKey);
  const isCacheValid = cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_TTL;

  // Personalized content based on user segments (with caching)
  const personalizedContent = React.useMemo(() => {
    if (isCacheValid) {
      logger.debug("Using cached personalization", { cacheKey, age: Date.now() - cachedResult!.timestamp });
      return cachedResult!.data;
    }

    logger.debug("Computing fresh personalization", { cacheKey, segments: activeSegments.length });

    const startTime = performance.now();
    const result = personalizeContent(
      {
        headline: "Sistema de Automação Empresarial",
        subheadline:
          "Transforme dados em decisões inteligentes com nossa plataforma de automação empresarial.",
        badge: "Novo: IA Conversacional",
      },
      "hero",
    );

    const computationTime = performance.now() - startTime;
    logger.info("Personalization computed", {
      cacheKey,
      computationTimeMs: Math.round(computationTime),
      segments: activeSegments.length,
      experimentVariant: headlineExperiment?.variant
    });

    // Cache the result
    personalizationCache.set(cacheKey, { data: result, timestamp: Date.now() });

    return result;
  }, [cacheKey, isCacheValid, cachedResult, personalizeContent, activeSegments.length, headlineExperiment?.variant, logger]);

  // Safety check for content with structured validation
  const content = personalizedContent as {
    headline?: string;
    subheadline?: string;
    badge?: string;
  } | null;

  const isContentValid = content && content.headline && content.subheadline;

  if (!isContentValid) {
    logger.error("PersonalizedHero: Invalid personalized content, using fallback", {
      hasContent: !!content,
      hasHeadline: !!(content?.headline),
      hasSubheadline: !!(content?.subheadline),
      cacheKey,
      segments: activeSegments.length,
      experimentVariant: headlineExperiment?.variant
    });

    return (
      <div className="text-center py-16">
        <h1 className="text-4xl font-bold text-red-600">
          Erro de Personalização
        </h1>
        <p className="text-gray-600 mt-4">
          Conteúdo personalizado não pôde ser carregado.
        </p>
      </div>
    );
  }

  // Log successful render
  React.useEffect(() => {
    logger.info("PersonalizedHero rendered successfully", {
      cacheKey,
      segments: activeSegments.length,
      experimentVariant: headlineExperiment?.variant,
      hasValidContent: isContentValid,
      cacheUsed: isCacheValid
    });
  }, [cacheKey, activeSegments.length, headlineExperiment?.variant, isContentValid, isCacheValid, logger]);

  // A/B test different value propositions
  const valueProposition = useABContent(
    "hero_headline",
    {
      control: "Transforme dados em decisões inteligentes",
      variant_a: "Automatize seus relatórios em minutos, não dias",
      variant_b: "Da planilha manual para o dashboard inteligente",
    },
  ) as string;

  // Track hero view
  React.useEffect(() => {
    trackUserAction("hero_view", {
      segments: activeSegments.map((s) => s.id),
      experiment_variant: headlineExperiment.variant,
    });
  }, [activeSegments, headlineExperiment.variant, trackUserAction]);

  return (
    <section className="min-h-screen flex items-center relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-primary/3 to-transparent animate-pulse" />
      </div>

      <div className="grid lg:grid-cols-2 gap-12 items-center relative z-10 max-w-7xl mx-auto px-4 md:px-6">
        {/* Content */}
        <div className="space-y-8">
          {/* Personalized Badge */}
          {content.badge && (
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
              {content.badge}
            </div>
          )}

          {/* Personalized Headline */}
          <h1
            id="hero-headline"
            className="font-display font-bold leading-tight text-[clamp(1.5rem,4vw,3.75rem)] text-foreground"
            data-experiment={`headline_${headlineExperiment.variant}`}
          >
            {content.headline}
          </h1>

          {/* Personalized Subheadline with A/B tested value prop */}
          <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
            {valueProposition}. {content.subheadline}
          </p>

          {/* Personalized CTA */}
          <div className="flex flex-col sm:flex-row gap-4">
            <PersonalizedCTA
              baseText="Comece Grátis"
              baseHref="/signup"
              className="text-lg"
            />

            {/* Secondary CTA - only show for certain segments */}
            {activeSegments.some((s) => s.id === "returning_visitor") && (
              <button
                className="inline-flex items-center px-6 py-3 border border-border rounded-xl hover:bg-accent/5 transition-colors text-lg"
                onClick={() =>
                  trackUserAction("demo_request", { source: "hero_secondary" })
                }
              >
                Agendar Demo
              </button>
            )}
          </div>

          {/* User Segment Indicator (for development/debugging) */}
          {process.env.NODE_ENV === "development" && (
            <div className="text-xs text-muted-foreground border border-dashed border-muted p-2 rounded">
              Active Segments:{" "}
              {activeSegments.map((s) => s.name).join(", ") || "None"}
              <br />
              Experiment: {headlineExperiment.variant}
            </div>
          )}
        </div>

        {/* Dashboard Preview */}
        <div className="relative">
          <div className="rounded-xl overflow-hidden shadow-soft-lg hover:shadow-soft-xl transition-shadow duration-300 border border-border/50 backdrop-blur-sm bg-card/80">
            {/* This would be replaced with actual dashboard preview */}
            <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/20 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                </div>
                <p className="font-medium">Dashboard Preview</p>
                <p className="text-sm">Personalized for your segment</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Hook for easy hero personalization
export function usePersonalizedHero() {
  const { personalizeContent } = usePersonalization();
  const headlineExperiment = useExperiment("hero_headline");

  return {
    getPersonalizedContent: (baseContent: unknown) =>
      personalizeContent(baseContent, "hero"),
    experiment: headlineExperiment,
  };
}

// Export the component with error boundary protection
const PersonalizedHeroWithErrorBoundary = ({ children }: { children?: React.ReactNode }) => (
  <SimpleErrorBoundary
    onError={(error) => {
      const logger = withComponentContext("PersonalizedHero");
      logger.error("PersonalizedHero crashed", error, {
        component: "PersonalizedHero",
        hasErrorBoundary: true,
      });
    }}
  >
    <PersonalizedHero />
  </SimpleErrorBoundary>
);

export { PersonalizedHeroWithErrorBoundary as PersonalizedHero };
export default PersonalizedHeroWithErrorBoundary;
