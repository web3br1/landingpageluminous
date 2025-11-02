/**
 * Hero Content Component
 *
 * Handles the text content rendering portion of the hero
 * Separated to reduce main component complexity
 */

import React from 'react';
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { validateAndRenderText } from "./hero.helpers";
import type { HeroContent as HeroContentType } from "./hero.types";

interface HeroContentProps {
  content: HeroContentType;
  headingId?: string;
}

export function HeroContent({ content, headingId }: HeroContentProps) {
  return (
    <div className="space-y-8">
      {/* Badge */}
      {content?.badge && (
        <Badge variant="secondary" className="px-4 py-2 text-sm">
          {content.badge}
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
          {validateAndRenderText(content?.headline, "Headline")}
        </h1>

        {/* Subheadline */}
        <p
          className={cn(
            "leading-relaxed",
            "text-[clamp(1rem,2vw,1.25rem)]",
            "text-muted-foreground mt-4",
          )}
        >
          {validateAndRenderText(content?.subheadline, "Subheadline")}
        </p>
      </div>

      {/* Metrics */}
      {content?.metrics && content.metrics.length > 0 && (
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
    </div>
  );
}
