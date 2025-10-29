"use client";

import { useState, lazy, Suspense } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  OptimizedImage,
  imageOptimization,
} from "@/lib/performance/image-optimization";
import type { DemoSectionProps } from "@/domains/marketing";

// Lazy load video component to reduce initial bundle size
const LazyVideoPlayer = lazy(() => import("./lazy-video-player"));

export function Demo({
  content,
  variant = "default",
  tracking,
  onVideoPlay,
  onScreenshotClick,
  onTourStepClick,
  onCtaClick,
  headingId,
}: DemoSectionProps) {
  // Safety check - if content is undefined or incomplete, provide minimal fallback
  if (!content) {
    console.warn("Demo component received undefined content, using fallback");
    content = {
      title: "Demonstração",
      subtitle: "Veja nossa plataforma em ação",
      description:
        "Explore as funcionalidades da nossa solução através desta demonstração interativa.",
      demoType: "screenshots",
      screenshots: [],
      tourSteps: [],
      features: {
        title: "Recursos Principais",
        items: [],
      },
      stats: [],
      cta: {
        primary: {
          text: "Começar Grátis",
          link: "/signup",
        },
      },
    };
  }

  // Ensure nested objects exist
  if (!content.features) {
    content.features = {
      title: "Recursos Principais",
      items: [],
    };
  }

  if (!content.cta) {
    content.cta = {
      primary: {
        text: "Começar Grátis",
        link: "/signup",
      },
    };
  }

  if (!content.stats) {
    content.stats = [];
  }

  if (!content.screenshots) {
    content.screenshots = [];
  }

  if (!content.tourSteps) {
    content.tourSteps = [];
  }

  const [currentTourStep, setCurrentTourStep] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState<number | null>(
    null,
  );

  const handleVideoPlay = (video: any) => {
    setIsVideoPlaying(true);
    onVideoPlay?.(video);
  };

  const handleScreenshotClick = (screenshot: any, index: number) => {
    setSelectedScreenshot(index);
    onScreenshotClick?.(screenshot, index);
  };

  const handleTourNavigation = (direction: "prev" | "next") => {
    if (!content.tourSteps) return;

    const newStep =
      direction === "next"
        ? Math.min(currentTourStep + 1, content.tourSteps.length - 1)
        : Math.max(currentTourStep - 1, 0);

    setCurrentTourStep(newStep);
    onTourStepClick?.(content.tourSteps[newStep], newStep);
  };

  const renderVideoPlayer = (video: any) => {
    return (
      <Suspense
        fallback={
          <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        }
      >
        <LazyVideoPlayer
          video={video}
          onPlay={handleVideoPlay}
          className="aspect-video bg-muted rounded-lg overflow-hidden"
        />
      </Suspense>
    );
  };

  const renderScreenshots = () => {
    if (!content.screenshots) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {content.screenshots.map((screenshot, index) => (
          <div
            key={index}
            className="group relative bg-card border border-border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleScreenshotClick(screenshot, index)}
          >
            <div
              className="aspect-video relative"
              style={{ position: "relative", minHeight: "200px" }}
            >
              <OptimizedImage
                src={screenshot.src}
                alt={screenshot.alt}
                fill
                priority={index === 0 ? "high" : "medium"}
                loadingStrategy="viewport"
                sizes={imageOptimization.getResponsiveSizes(
                  index === 0 ? "high" : "medium",
                )}
                quality={imageOptimization.getOptimalQuality(
                  index === 0 ? "high" : "medium",
                )}
                className="object-cover"
                unoptimized={screenshot.src.endsWith(".svg")}
              />
              {screenshot.hotspot && (
                <div
                  className="absolute w-4 h-4 bg-primary rounded-full border-2 border-white shadow-lg animate-pulse"
                  style={{
                    left: `${screenshot.hotspot.x}%`,
                    top: `${screenshot.hotspot.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                  title={screenshot.hotspot.label}
                >
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {screenshot.hotspot.label}
                  </div>
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-foreground mb-2">
                {screenshot.title}
              </h3>
              {screenshot.description && (
                <p className="text-sm text-muted-foreground">
                  {screenshot.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderTour = () => {
    if (!content.tourSteps || content.tourSteps.length === 0) return null;

    const currentStep = content.tourSteps[currentTourStep];

    return (
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {/* Tour Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Passo {currentTourStep + 1} de {content.tourSteps.length}
              </h3>
              <div className="flex gap-1 mt-2">
                {content.tourSteps.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors",
                      index === currentTourStep
                        ? "bg-primary"
                        : "bg-muted-foreground/30",
                    )}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleTourNavigation("prev")}
                disabled={currentTourStep === 0}
                className="p-2 border border-border rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleTourNavigation("next")}
                disabled={currentTourStep === content.tourSteps.length - 1}
                className="p-2 border border-border rounded-md hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <h4 className="text-xl font-bold text-foreground mb-2">
            {currentStep.title}
          </h4>
          <p className="text-muted-foreground">{currentStep.description}</p>
        </div>

        {/* Tour Content */}
        <div className="p-6">
          {currentStep.screenshot && (
            <div className="mb-4" style={{ position: "relative" }}>
              <OptimizedImage
                src={currentStep.screenshot.src}
                alt={currentStep.screenshot.alt}
                width={800}
                height={500}
                priority="high"
                loadingStrategy="eager"
                quality={imageOptimization.getOptimalQuality("high")}
                className="w-full rounded-lg"
                unoptimized={currentStep.screenshot.src.endsWith(".svg")}
              />
            </div>
          )}

          {currentStep.cta && (
            <a
              href={currentStep.cta.link}
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md hover:bg-primary/90 transition-colors"
            >
              {currentStep.cta.text}
              <ExternalLink className="ml-2 w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Header */}
      <div className="text-center mb-12">
        <h2
          id={headingId}
          className="text-3xl md:text-4xl font-bold text-foreground mb-4"
        >
          {content.title}
        </h2>
        <p className="text-lg text-muted-foreground mb-2">{content.subtitle}</p>
        <p className="text-muted-foreground max-w-3xl mx-auto">
          {content.description}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Demo Content */}
        <div className="space-y-8">
          {/* Primary Video */}
          {content.primaryVideo && (
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                {content.primaryVideo.title}
              </h3>
              {renderVideoPlayer(content.primaryVideo)}
            </div>
          )}

          {/* Tour */}
          {content.demoType === "interactive-tour" && renderTour()}

          {/* Screenshots */}
          {(content.demoType === "screenshots" ||
            content.demoType === "hybrid") &&
            content.screenshots && (
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  Capturas de Tela
                </h3>
                {renderScreenshots()}
              </div>
            )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Features */}
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4">
              {content.features.title}
            </h3>
            <ul className="space-y-3">
              {content.features.items.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Stats */}
          {content.stats && (
            <div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Resultados Comprovados
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {content.stats.map((stat, index) => (
                  <div
                    key={index}
                    className="bg-card border border-border rounded-lg p-4"
                  >
                    <div className="text-2xl font-bold text-foreground mb-1">
                      {stat.value}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Testimonial */}
          {content.testimonial && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
              <blockquote className="text-foreground mb-4">
                &ldquo;{content.testimonial.quote}&rdquo;
              </blockquote>
              <div className="text-sm">
                <div className="font-semibold text-foreground">
                  {content.testimonial.author}
                </div>
                <div className="text-muted-foreground">
                  {content.testimonial.role}, {content.testimonial.company}
                </div>
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="space-y-3">
            <a
              href={content.cta.primary.link}
              onClick={() => onCtaClick?.("primary")}
              className="w-full inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {content.cta.primary.text}
            </a>

            {content.cta.secondary && (
              <a
                href={content.cta.secondary.link}
                onClick={() => onCtaClick?.("secondary")}
                className="w-full inline-flex items-center justify-center px-6 py-3 border border-border text-foreground font-medium rounded-lg hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                {content.cta.secondary.text}
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
