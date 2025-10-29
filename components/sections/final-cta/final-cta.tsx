"use client";

import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FinalCtaSectionProps } from "@/domains/marketing";

export function FinalCta({
  content,
  variant = "default",
  tracking,
  onPrimaryClick,
  onSecondaryClick,
  headingId,
}: FinalCtaSectionProps) {
  // Safety check - if content is undefined or incomplete, provide minimal fallback
  if (
    !content ||
    !content.primaryButton ||
    !content.headline ||
    !content.subheadline
  ) {
    console.warn(
      "FinalCta component received undefined or incomplete content, using fallback",
    );
    content = {
      headline: content?.headline || "Pronto para começar?",
      subheadline:
        content?.subheadline ||
        "Junte-se a milhares de empresas que já transformaram seus negócios.",
      primaryButton: content?.primaryButton || {
        text: "Começar Grátis",
        link: "/signup",
      },
    };
  }

  return (
    <>
      {/* Background with gradient */}
      <div
        className={cn(
          "relative bg-linear-to-br from-primary via-primary/90 to-accent overflow-hidden",
          variant === "enterprise" && "from-accent via-accent/90 to-primary",
        )}
        data-section={tracking?.section}
        data-experiment-id={tracking?.experimentId}
        data-variant-experiment={tracking?.variant}
        data-variant={variant}
      >
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <h2
              id={headingId}
              className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight"
            >
              {content.headline}
            </h2>

            <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
              {content.subheadline}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <a
                href={content.primaryButton.link}
                onClick={onPrimaryClick}
                className="group inline-flex items-center px-8 py-4 bg-white text-primary font-semibold rounded-lg hover:bg-white/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary shadow-lg hover:shadow-xl"
              >
                {content.primaryButton.text}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform rtl-flip" />
              </a>

              {content.secondaryButton && (
                <a
                  href={content.secondaryButton.link}
                  onClick={onSecondaryClick}
                  className="inline-flex items-center px-8 py-4 border-2 border-white/30 text-white font-medium rounded-lg hover:bg-white/10 hover:border-white/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary"
                >
                  {content.secondaryButton.text}
                </a>
              )}
            </div>

            {/* Urgency/Social proof text */}
            {content.urgencyText && (
              <p className="text-white/80 text-sm md:text-base">
                {content.urgencyText}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
