/**
 * Hero Actions Component
 *
 * Handles the CTA buttons portion of the hero
 * Separated to reduce main component complexity
 */

import React from 'react';
import { cn } from "@/lib/utils";
import { AccessibleButton, useReducedMotion } from "@/lib/a11y/touch-target-optimization";
import { validateAndRenderText, generateCtaAriaLabel, getAnimationClasses } from "./hero.helpers";

interface HeroActionsProps {
  primaryCta: string;
  secondaryCta?: string;
  onPrimaryCta: () => void;
  onSecondaryCta: () => void;
}

export function HeroActions({
  primaryCta,
  secondaryCta,
  onPrimaryCta,
  onSecondaryCta,
}: HeroActionsProps) {
  const reducedMotion = useReducedMotion();
  const animations = getAnimationClasses(reducedMotion);

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <AccessibleButton
        onClick={onPrimaryCta}
        aria-label={generateCtaAriaLabel(primaryCta, 'primary')}
        data-tracking="primary-cta"
        variant="primary"
        size="lg"
        className={cn(
          "rounded-2xl px-5 py-3 font-semibold shadow-md",
          animations.buttonHover,
        )}
      >
        {validateAndRenderText(primaryCta, "Primary CTA")}
      </AccessibleButton>

      {secondaryCta && (
        <AccessibleButton
          onClick={onSecondaryCta}
          aria-label={generateCtaAriaLabel(secondaryCta, 'secondary')}
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
