"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  AccessibleButton,
  useReducedMotion,
} from "@/lib/a11y/touch-target-optimization";
import Image from "next/image";
import {
  ContentExperiment,
  ExperimentWrapper,
  useExperimentTracking,
} from "@/components/experiments/experiment-wrapper";
import type { HeroComponentProps } from "./hero.types";

/**
 * HeroExperiment - Hero component with integrated A/B testing
 * Demonstrates how to use the experiment system for content optimization
 */
export function HeroExperiment({
  content,
  variant = "default",
  tracking,
  onPrimaryCta,
  onSecondaryCta,
  headingId,
  id,
}: HeroComponentProps & { id?: string }) {
  // Safety check - if content is undefined, provide minimal fallback
  if (!content) {
    console.warn(
      "HeroExperiment component received undefined content, using fallback",
    );
    content = {
      headline: "Sistema temporariamente indisponível",
      subheadline: "Estamos trabalhando para melhorar sua experiência.",
      primaryCta: "Tentar novamente",
      secondaryCta: "Contatar suporte",
    };
  }

  const prefersReducedMotion = useReducedMotion();

  // Experiment tracking for conversions
  const experimentTracking = useExperimentTracking("hero_headline_test");

  const handlePrimaryCta = () => {
    // Track conversion
    experimentTracking.trackConversion("cta_click", {
      button: "primary",
      location: "hero",
    });
    onPrimaryCta?.();
  };

  const handleSecondaryCta = () => {
    // Track conversion
    experimentTracking.trackConversion("cta_click", {
      button: "secondary",
      location: "hero",
    });
    onSecondaryCta?.();
  };

  // Default content for experiment
  const defaultHeroContent = {
    headline:
      content?.headline || "Automatize seus dados. Acelere seus resultados.",
    subheadline:
      content?.subheadline ||
      "Conecte, orquestre e acelere seus fluxos — sem fricção.",
    primaryCta: content?.primaryCta || "Entrar na pré-venda",
    secondaryCta: content?.secondaryCta || "Ver demo",
  };

  return (
    <ExperimentWrapper
      experimentId="hero_headline_test"
      trackEvents={["hero_view", "hero_scroll"]}
    >
      <ContentExperiment
        experimentId="hero_headline_test"
        defaultContent={defaultHeroContent}
        render={(experimentContent, variantId) => (
          <section
            id={id || "hero"}
            data-section="hero"
            data-variant={variant}
            data-experiment-variant={variantId}
            className="relative min-h-screen flex items-center overflow-hidden"
          >
            {/* Background */}
            <div className="absolute inset-0 -z-10">
              <div
                className={cn(
                  "absolute inset-0 bg-linear-to-br",
                  "from-primary/5 via-transparent to-accent/5",
                )}
              />
              <div
                className={cn(
                  "absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))]",
                  "from-transparent via-primary/3 to-transparent",
                  !prefersReducedMotion && "animate-pulse",
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center relative z-10 max-w-7xl mx-auto px-4 md:px-6">
              {/* Content */}
              <div className="space-y-8">
                {/* Badge */}
                {content?.badge && (
                  <div className="inline-flex items-center rounded-md border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 text-sm">
                    {content.badge}
                  </div>
                )}

                {/* Headline */}
                <div className="min-h-[140px]" data-testid="hero-text-block">
                  <h1
                    id={headingId}
                    className="text-[clamp(2.5rem,5vw,4rem)] font-display font-bold text-foreground"
                  >
                    {experimentContent.headline}
                  </h1>
                  <p className="text-[clamp(1.125rem,2.5vw,1.25rem)] text-muted-foreground max-w-xl">
                    {experimentContent.subheadline}
                  </p>
                </div>

                {/* Metrics */}
                {content?.metrics && (
                  <div className="flex flex-wrap gap-6 py-4">
                    {content.metrics.map((metric, index) => (
                      <div key={index} className="text-center">
                        <div className="text-2xl font-bold text-primary mb-1">
                          {metric.value}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {metric.label}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <AccessibleButton
                    onClick={handlePrimaryCta}
                    aria-label={`Clique para ${experimentContent.primaryCta}`}
                    data-tracking="primary-cta"
                    variant="primary"
                    size="lg"
                    className={cn(
                      "rounded-2xl px-5 py-3 font-semibold shadow-md",
                      !prefersReducedMotion &&
                        "hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200",
                    )}
                  >
                    {experimentContent.primaryCta}
                  </AccessibleButton>

                  <AccessibleButton
                    onClick={handleSecondaryCta}
                    aria-label={`Clique para ${experimentContent.secondaryCta}`}
                    data-tracking="secondary-cta"
                    variant="outline"
                    size="lg"
                    className={cn(
                      "rounded-2xl px-5 py-3 border-2 font-semibold",
                      !prefersReducedMotion &&
                        "hover:bg-accent hover:text-accent-foreground transition-all duration-200",
                    )}
                  >
                    {experimentContent.secondaryCta}
                  </AccessibleButton>
                </div>
              </div>

              {/* Visual/Mockup */}
              <div className="lg:order-last relative">
                <div className="bg-card rounded-2xl p-8 border border-border/50 overflow-hidden">
                  <Image
                    src="/images/product/hero-dashboard.svg"
                    alt="Dashboard preview do sistema de automação empresarial"
                    width={600}
                    height={400}
                    priority={true}
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Experiment Debug Info (development only) */}
            {process.env.NODE_ENV === "development" && variantId && (
              <div className="fixed bottom-4 right-4 bg-black/80 text-white px-3 py-2 rounded-lg text-sm">
                Experiment: {variantId}
              </div>
            )}
          </section>
        )}
      />
    </ExperimentWrapper>
  );
}
