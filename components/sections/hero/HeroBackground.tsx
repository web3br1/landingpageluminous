/**
 * Hero Background Component
 *
 * Handles the animated background portion of the hero
 * Separated to reduce main component complexity
 */

import React from 'react';
import { getAnimationClasses } from "./hero.helpers";
import { useReducedMotion } from "@/lib/a11y/touch-target-optimization";

interface HeroBackgroundProps {
  variant?: string;
}

export function HeroBackground({ variant = "default" }: HeroBackgroundProps) {
  const reducedMotion = useReducedMotion();
  const animations = getAnimationClasses(reducedMotion);

  return (
    <div className="absolute inset-0 -z-10">
      <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-accent/5" />
      <div
        className={cn(
          "absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-transparent via-primary/3 to-transparent",
          animations.backgroundPulse
        )}
      />
    </div>
  );
}
