// Composition-First Hero Component
// Pure UI component that receives composed content as props
// No business logic, no data fetching, no experiments - just rendering

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AccessibleButton,
  AccessibleLink,
  SkipLink,
  useReducedMotion,
} from "@/lib/a11y/touch-target-optimization";
import Image from "next/image";
import type { HeroComponentProps, HeroContent } from "./hero.types";

// Helper functions to reduce complexity
function validateAndRenderText(value: unknown, fieldName: string): string {
  console.log(`[Hero] ${fieldName} result:`, value, typeof value);

  if (
    typeof value !== "string" &&
    typeof value !== "number" &&
    value !== undefined
  ) {
    console.error(
      `[Hero] INVALID ${fieldName.toUpperCase()} TYPE:`,
      typeof value,
      value,
    );
    return `Erro: ${fieldName} inválido`;
  }

  return value as string;
}

function extractHeroContent(content: any): HeroContent {
  // Handle nested content structure from production data
  if (content?.content?.content) {
    return content.content.content;
  } else if (content?.content) {
    return content.content;
  }

  // Safety check - if content is undefined, provide minimal fallback
  if (!content) {
    console.warn("Hero component received undefined content, using fallback");
    return {
      headline: "Sistema temporariamente indisponível",
      subheadline: "Estamos trabalhando para melhorar sua experiência.",
      primaryCta: "Tentar novamente",
      secondaryCta: "Contatar suporte",
    };
  }

  return content;
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
export function Hero({
  content,
  variant = "default",
  tracking,
  onPrimaryCta,
  onSecondaryCta,
  headingId,
  id,
}: HeroComponentProps & { id?: string }) {
  const heroContent = extractHeroContent(content);
  const reducedMotion = useReducedMotion();

  console.log("[Hero] About to create JSX elements");
  console.log("[Hero] Checking dynamic expressions:", {
    badge: heroContent?.badge,
    headline: heroContent?.headline,
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
    console.error("[Hero] Error in render:", error);
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
