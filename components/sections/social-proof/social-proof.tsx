"use client";

import Image from "next/image";
import {
  Star,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  SocialProofSectionProps,
  CompanyLogo,
  Testimonial,
  Metric,
} from "@/domains/marketing/types/social-proof.types";

// Helper functions to reduce complexity
function getLayoutFlags(layout?: string) {
  return {
    shouldShowLogos:
      layout === "logos-only" ||
      layout === "mixed-logos-testimonials" ||
      layout === "full",
    shouldShowTestimonials:
      layout === "testimonials-only" ||
      layout === "mixed-logos-testimonials" ||
      layout === "mixed-testimonials-metrics" ||
      layout === "full",
    shouldShowMetrics:
      layout === "metrics-only" ||
      layout === "mixed-testimonials-metrics" ||
      layout === "full",
  };
}

function renderStars(rating: number) {
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={cn(
        "w-4 h-4",
        i < rating
          ? "text-yellow-400 fill-current"
          : "text-muted-foreground/30",
      )}
    />
  ));
}

function renderHeader(title?: string, subtitle?: string, headingId?: string) {
  if (!title && !subtitle) return null;

  return (
    <div className="text-center mb-12">
      {title && (
        <h2
          id={headingId}
          className="text-3xl md:text-4xl font-bold text-foreground mb-4"
        >
          {title}
        </h2>
      )}
      {subtitle && (
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function renderLogos(
  logos: CompanyLogo[],
  onLogoClick?: (index: number, logo: CompanyLogo) => void,
) {
  if (!logos.length) return null;

  return (
    <div className="mb-16">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center">
        {logos.map((logo: CompanyLogo, index: number) => (
          <div
            key={index}
            className="flex items-center justify-center p-4 grayscale hover:grayscale-0 transition-all duration-300"
          >
            {logo.href ? (
              <a
                href={logo.href}
                onClick={() => onLogoClick?.(index, logo)}
                className="block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
              >
                <Image
                  src={logo.src}
                  alt={logo.alt}
                  width={logo.width || 120}
                  height={logo.height || 40}
                  className="h-auto max-h-10 w-auto object-contain"
                />
              </a>
            ) : (
              <Image
                src={logo.src}
                alt={logo.alt}
                width={logo.width || 120}
                height={logo.height || 40}
                className="h-auto max-h-10 w-auto object-contain"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function renderTestimonials(
  testimonials: Testimonial[],
  showRatings: boolean,
  onTestimonialClick?: (index: number, testimonial: Testimonial) => void,
  hasPreviousSections = false,
) {
  if (!testimonials.length) return null;

  return (
    <div className={cn("mb-16", hasPreviousSections && "mt-16")}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {testimonials.map(
          (testimonial: Testimonial, index: number): React.ReactElement => (
            <div
              key={index}
              className={cn(
                "bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow duration-300 cursor-pointer",
                testimonial.featured && "ring-2 ring-primary/20 bg-primary/5",
              )}
              onClick={() => onTestimonialClick?.(index, testimonial)}
              data-featured={testimonial.featured ? "true" : undefined}
            >
              {/* Rating */}
              {showRatings && testimonial.rating && (
                <div className="flex items-center gap-1 mb-4">
                  {renderStars(testimonial.rating)}
                </div>
              )}

              {/* Quote */}
              <blockquote className="text-foreground mb-6 leading-relaxed">
                "{testimonial.quote}"
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-3">
                {testimonial.author.avatar && (
                  <Image
                    src={testimonial.author.avatar}
                    alt={`Avatar of ${testimonial.author.name}`}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                )}
                <div>
                  <div className="font-semibold text-foreground">
                    {testimonial.author.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.author.role}, {testimonial.author.company}
                  </div>
                </div>
              </div>

              {/* Featured badge */}
              {testimonial.featured && (
                <div className="mt-4 inline-flex items-center px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                  Destaque
                </div>
              )}
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function renderMetrics(
  metrics: Metric[],
  onMetricClick?: (index: number, metric: Metric) => void,
  hasPreviousSections = false,
) {
  if (!metrics.length) return null;

  return (
    <div className={cn(hasPreviousSections && "mt-16")}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {metrics.map((metric: Metric, index: number) => (
          <div
            key={index}
            className="bg-card border border-border rounded-lg p-6 text-center group cursor-pointer hover:shadow-lg transition-shadow duration-300"
            onClick={() => onMetricClick?.(index, metric)}
          >
            <div className="text-3xl md:text-4xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
              {metric.value}
            </div>
            <div className="text-lg font-semibold text-foreground mb-1">
              {metric.label}
            </div>
            {metric.description && (
              <div className="text-sm text-muted-foreground mb-2">
                {metric.description}
              </div>
            )}

            {/* Trend indicator */}
            {metric.trend && metric.trendValue && (
              <div
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full",
                  metric.trend === "up" && "bg-green-100 text-green-800",
                  metric.trend === "down" && "bg-red-100 text-red-800",
                  metric.trend === "stable" && "bg-blue-100 text-blue-800",
                )}
              >
                {metric.trend === "up" && <TrendingUp className="w-3 h-3" />}
                {metric.trend === "down" && (
                  <TrendingDown className="w-3 h-3" />
                )}
                {metric.trend === "stable" && <Minus className="w-3 h-3" />}
                {metric.trendValue}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function renderCta(
  ctaText?: string,
  ctaLink?: string,
  onCtaClick?: () => void,
) {
  if (!ctaText || !ctaLink) return null;

  return (
    <div className="text-center mt-12">
      <a
        href={ctaLink}
        onClick={onCtaClick}
        className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        {ctaText}
        <ArrowRight className="ml-2 w-4 h-4 rtl-flip" />
      </a>
    </div>
  );
}

// Main SocialProof component - now much simpler
export function SocialProof({
  content,
  variant = "default",
  tracking,
  onLogoClick,
  onTestimonialClick,
  onMetricClick,
  onCtaClick,
  headingId,
}: SocialProofSectionProps) {
  const { shouldShowLogos, shouldShowTestimonials, shouldShowMetrics } =
    getLayoutFlags(content?.layout);

  return (
    <section
      data-section={tracking?.section}
      data-experiment-id={tracking?.experimentId}
      data-variant-experiment={tracking?.variant}
      data-variant={variant}
    >
      {/* Header */}
      {renderHeader(content?.title, content?.subtitle, headingId)}

      {/* Logos Section */}
      {shouldShowLogos && renderLogos(content.logos, onLogoClick)}

      {/* Testimonials Section */}
      {shouldShowTestimonials &&
        renderTestimonials(
          content.testimonials,
          content.showRatings ?? true,
          onTestimonialClick,
          shouldShowLogos,
        )}

      {/* Metrics Section */}
      {shouldShowMetrics &&
        renderMetrics(
          content.metrics,
          onMetricClick,
          shouldShowLogos || shouldShowTestimonials,
        )}

      {/* CTA Section */}
      {renderCta(content.ctaText, content.ctaLink, onCtaClick)}
    </section>
  );
}
