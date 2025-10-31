// Composition-First Hero Component
// Pure UI component that receives composed content as props
// No business logic, no data fetching, no experiments - just rendering

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  AccessibleButton,
  useReducedMotion,
} from "@/lib/a11y/touch-target-optimization";
import type { HeroComponentProps, HeroContent } from "./hero.types";
import { SimpleErrorBoundary } from "@/lib/architecture/error-boundary-pattern";
import { withComponentContext } from "@/lib/architecture/logger-pattern";

// Helper functions to reduce complexity
function validateAndRenderText(value: unknown, fieldName: string): string {
  const logger = withComponentContext("hero", "validateAndRenderText");
  logger.debug(`${fieldName} validation`, { value, type: typeof value });

  if (
    typeof value !== "string" &&
    typeof value !== "number" &&
    value !== undefined
  ) {
    logger.error(
      `Invalid ${fieldName} type`,
      undefined,
      {
        expectedType: "string | number | undefined",
        actualType: typeof value,
        value,
        fieldName
      }
    );
    return `Erro: ${fieldName} inválido`;
  }

  return value as string;
}

function extractHeroContent(content: unknown): HeroContent {
  // Safety check - if content is undefined, provide minimal fallback
  if (!content) {
    withComponentContext("hero", "extractHeroContent").warn(
      "Hero component received undefined content, using fallback"
    );
    return {
      headline: "Sistema temporariamente indisponível",
      subheadline: "Estamos trabalhando para melhorar sua experiência.",
      primaryCta: "Tentar novamente",
      secondaryCta: "Contatar suporte",
    };
  }

  // Handle nested content structure from production data
  const contentObj = content as Record<string, unknown>; // Type assertion for legacy compatibility
  if (contentObj?.content && typeof contentObj.content === 'object' && contentObj.content !== null) {
    const nestedContent = contentObj.content as Record<string, unknown>;
    if (nestedContent?.content) {
      return nestedContent.content as HeroContent;
    }
    return contentObj.content as HeroContent;
  }

  return contentObj as unknown as HeroContent;
}

function renderHeroMetrics(metrics?: HeroContent["metrics"]) {
  if (!metrics || metrics.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-6 py-4">
      {metrics.map((metric, index) => (
        <div key={index} className="text-center">
          <div className="text-2xl font-bold text-primary mb-1">
            {metric.value}
          </div>
          <div className="text-sm text-muted-foreground">{metric.label}</div>
        </div>
      ))}
    </div>
  );
}

function renderHeroCtas(
  primaryCta: string,
  secondaryCta: string | undefined,
  onPrimaryCta: () => void,
  onSecondaryCta: () => void,
  reducedMotion: boolean,
) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <AccessibleButton
        onClick={onPrimaryCta}
        aria-label={`Clique para ${primaryCta}`}
        data-tracking="primary-cta"
        variant="primary"
        size="lg"
        className={cn(
          "rounded-2xl px-5 py-3 font-semibold shadow-md",
          !reducedMotion &&
            "hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200",
        )}
      >
        {validateAndRenderText(primaryCta, "Primary CTA")}
      </AccessibleButton>

      {secondaryCta && (
        <AccessibleButton
          onClick={onSecondaryCta}
          aria-label={`Clique para ${secondaryCta}`}
          data-tracking="secondary-cta"
          variant="outline"
          size="lg"
          className={cn(
            "rounded-2xl px-5 py-3 border-2 font-semibold",
            !reducedMotion &&
              "hover:bg-accent hover:text-accent-foreground transition-all duration-200",
          )}
        >
          {validateAndRenderText(secondaryCta, "Secondary CTA")}
        </AccessibleButton>
      )}
    </div>
  );
}

// Main Hero component - now much simpler
// Internal hero component implementation
function HeroInternal({
  content,
  variant = "default",
  tracking,
  onPrimaryCta,
  onSecondaryCta,
  headingId,
  id,
  className,
}: HeroComponentProps & { id?: string; className?: string }) {
  const heroContent = extractHeroContent(content);
  const reducedMotion = useReducedMotion();
  const logger = withComponentContext("hero", "render");

  logger.debug("Rendering hero component", {
    hasBadge: !!heroContent?.badge,
    hasHeadline: !!heroContent?.headline,
    subheadline: heroContent?.subheadline,
    metrics: heroContent?.metrics,
    primaryCta: heroContent?.primaryCta,
    secondaryCta: heroContent?.secondaryCta,
  });
  try {
    return (
      <div
        id={id}
        className="relative min-h-screen flex items-center overflow-hidden"
        data-variant={variant}
        data-experiment-id={tracking?.experimentId}
        data-variant-experiment={tracking?.variant}
        data-section={tracking?.section}
      >
        {/* Animated Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-accent/5" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-transparent via-primary/3 to-transparent animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center relative z-10 max-w-7xl mx-auto px-4 md:px-6">
          {/* Content */}
          <div className="space-y-8">
            {/* Badge */}
            {heroContent?.badge && (
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                {heroContent.badge}
              </Badge>
            )}

            {/* Text Block */}
            <div data-testid="hero-text-block" className="min-h-[140px]">
              {/* Headline */}
              <h1
                id={headingId}
                className={cn(
                  "font-display font-bold leading-tight",
                  "text-[clamp(2.5rem,5vw,4rem)]",
                  "text-foreground",
                )}
              >
                {validateAndRenderText(heroContent?.headline, "Headline")}
              </h1>

              {/* Subheadline */}
              <p
                className={cn(
                  "leading-relaxed",
                  "text-[clamp(1.125rem,2.5vw,1.25rem)]",
                  "text-muted-foreground max-w-xl",
                )}
              >
                {validateAndRenderText(heroContent?.subheadline, "Subheadline")}
              </p>
            </div>

            {/* Metrics */}
            {renderHeroMetrics(heroContent?.metrics)}

            {/* CTAs */}
            {renderHeroCtas(
              heroContent?.primaryCta as string,
              heroContent?.secondaryCta,
              () => onPrimaryCta?.(),
              () => onSecondaryCta?.(),
              reducedMotion,
            )}
          </div>

          {/* Visual/Illustration */}
          <div className="relative">
            <div className="relative aspect-square max-w-md mx-auto">
              {/* Mockup/Image placeholder */}
              <div className="w-full h-full bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 rounded-3xl border border-primary/20 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">📊</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Dashboard Preview
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    withComponentContext("hero", "render").error(
      "Error in hero render",
      error instanceof Error ? error : undefined,
      { componentProps: { content, className, headingId } }
    );
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Erro no componente Hero</h2>
          <p className="text-muted-foreground">
            Ocorreu um erro ao renderizar o componente. Tente recarregar a
            página.
          </p>
        </div>
      </div>
    );
  }
}

// Main Hero component with error boundary
export function Hero(props: HeroComponentProps & { id?: string }) {
  return (
    <SimpleErrorBoundary
      maxRetries={2}
      onError={(error) => {
        withComponentContext("hero", "errorBoundary").error(
          "Hero component error boundary triggered",
          error,
          { componentProps: props }
        );
      }}
      fallback={(error, retry) => (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
            <div className="text-6xl mb-4">🚀</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Ops! Algo deu errado
            </h2>
            <p className="text-gray-600 mb-6">
              Não conseguimos carregar a seção principal. Isso pode ser temporário.
            </p>
            <div className="space-y-3">
              <button
                onClick={retry}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Tentar novamente
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Recarregar página
              </button>
            </div>
          </div>
        </div>
      )}
    >
      <HeroInternal {...props} />
    </SimpleErrorBoundary>
  );
}
