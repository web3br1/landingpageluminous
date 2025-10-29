"use client";

import React from "react";
import { useExperiment, useFeatureFlag } from "@/lib/hooks/use-feature-flags";
import { analytics } from "@/lib/analytics-core";

// Personalized CTA component that adapts based on experiments and user segments
interface PersonalizedCTAProps {
  baseText: string;
  baseHref: string;
  className?: string;
  variant?: "primary" | "secondary";
}

export function PersonalizedCTA({
  baseText,
  baseHref,
  className = "",
  variant = "primary",
}: PersonalizedCTAProps) {
  // Experiment hooks
  const headlineExperiment = useExperiment("hero_headline");
  const ctaColorExperiment = useExperiment("cta_color");

  // Feature flag hook
  const newCtaDesign = useFeatureFlag("betaFeatures", false);

  // Determine CTA text based on experiment
  const getCTAText = () => {
    if (headlineExperiment.variant === "variant_a") {
      return "Comece Sua Transformação";
    }
    if (headlineExperiment.variant === "variant_b") {
      return "Experimente Grátis";
    }
    return baseText;
  };

  // Determine CTA styling based on experiment
  const getCTAStyling = () => {
    const baseClasses = `inline-flex items-center px-6 py-3 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2`;

    if (ctaColorExperiment.variant === "accent") {
      return `${baseClasses} bg-accent hover:bg-accent/90 text-white focus:ring-accent`;
    }

    // Default primary styling
    return `${baseClasses} bg-primary hover:bg-primary/90 text-white focus:ring-primary shadow-lg hover:shadow-xl`;
  };

  const handleCTAClick = () => {
    // Track CTA click with experiment context
    analytics.trackCtaClick(getCTAText(), "hero");

    // Track experiment conversions
    headlineExperiment.trackConversion("cta_click");
    ctaColorExperiment.trackConversion("cta_click");

    // Track personalized CTA performance
    analytics.track("personalized_cta_click", {
      experiment_headline: headlineExperiment.variant,
      experiment_cta_color: ctaColorExperiment.variant,
      cta_text: getCTAText(),
      feature_new_design: newCtaDesign,
    });
  };

  const ctaText = getCTAText();
  const ctaClasses = getCTAStyling();

  return (
    <a
      href={baseHref}
      className={`${ctaClasses} ${className}`}
      onClick={handleCTAClick}
      data-experiment-headline={headlineExperiment.variant}
      data-experiment-cta={ctaColorExperiment.variant}
      data-cta-text={ctaText}
    >
      {ctaText}
      <svg
        className="ml-2 -mr-1 w-4 h-4"
        fill="currentColor"
        viewBox="0 0 20 20"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fillRule="evenodd"
          d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
          clipRule="evenodd"
        />
      </svg>
    </a>
  );
}

// Hook for using personalized CTAs
export function usePersonalizedCTA(baseText: string, baseHref: string) {
  const headlineExperiment = useExperiment("hero_headline");
  const ctaColorExperiment = useExperiment("cta_color");

  const getPersonalizedProps = () => {
    let text = baseText;
    let href = baseHref;

    // Customize based on experiments
    if (headlineExperiment.variant === "variant_a") {
      text = "Comece Sua Transformação";
      href = `${baseHref}?campaign=transformation`;
    } else if (headlineExperiment.variant === "variant_b") {
      text = "Experimente Grátis";
      href = `${baseHref}?campaign=free_trial`;
    }

    return {
      text,
      href,
      experiments: { headlineExperiment, ctaColorExperiment },
    };
  };

  return getPersonalizedProps();
}

// Component for A/B testing different CTA variations
export function ABTestCTA({
  variations,
}: {
  variations: Record<
    string,
    { text: string; href: string; className?: string }
  >;
}) {
  const experiment = useExperiment("cta_text_test");

  const currentVariation = variations[experiment.variant] || variations.control;

  const handleClick = () => {
    experiment.trackConversion("cta_click");
    analytics.track("ab_test_cta_click", {
      experiment: "cta_text_test",
      variant: experiment.variant,
      cta_text: currentVariation.text,
    });
  };

  return (
    <a
      href={currentVariation.href}
      className={currentVariation.className || "btn-primary"}
      onClick={handleClick}
      data-experiment="cta_text_test"
      data-variant={experiment.variant}
    >
      {currentVariation.text}
    </a>
  );
}
