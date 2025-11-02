// Composition-First Hero Component
// Pure UI component that receives composed content as props
// No business logic, no data fetching, no experiments - just rendering

"use client";

import React from "react";
import type { HeroComponentProps } from "./hero.types";
import { SimpleErrorBoundary } from "@/lib/architecture/error-boundary-pattern";
import { withComponentContext } from "@/lib/architecture/logger-pattern";

// Import separated components to reduce complexity
import { extractHeroContent, generateTrackingAttributes } from "./hero.helpers";
import { HeroContent } from "./HeroContent";
import { HeroActions } from "./HeroActions";
import { HeroBackground } from "./HeroBackground";

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
}: HeroComponentProps & { id?: string }) {
  const heroContent = extractHeroContent(content);
  const logger = withComponentContext("hero", "render");

  logger.debug("Rendering hero component", {
    hasBadge: !!heroContent?.badge,
    hasHeadline: !!heroContent?.headline,
  });

  return (
    <div
      id={id}
      className="relative min-h-screen flex items-center overflow-hidden"
      data-variant={variant}
      {...generateTrackingAttributes(tracking)}
    >
      <HeroBackground variant={variant} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center relative z-10 max-w-7xl mx-auto px-4 md:px-6">
        {/* Content Section */}
        <div className="space-y-8">
          <HeroContent content={heroContent} headingId={headingId} />

          <HeroActions
            primaryCta={heroContent?.primaryCta || "Começar"}
            secondaryCta={heroContent?.secondaryCta}
            onPrimaryCta={() => onPrimaryCta?.()}
            onSecondaryCta={() => onSecondaryCta?.()}
          />
        </div>

        {/* Visual Section */}
        <div className="relative">
          <div className="aspect-square rounded-2xl bg-muted/50 flex items-center justify-center">
            <p className="text-muted-foreground text-center px-8">
              Seu visual ou mockup aqui
              <br />
              <span className="text-sm opacity-75">
                (prop visual será passada via composition)
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
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
