// Composition-First Benefits Component
// Pure UI component that receives composed content as props
// No business logic, no data fetching, no experiments - just rendering

"use client";

import Image from "next/image";
// SectionWrapper/SectionHeader removidos: renderer fornece <section> e headingId
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  TrendingUp,
  BarChart3,
  Users,
  Shield,
  Settings,
} from "lucide-react";
import type { BenefitsContent } from "@/domains/marketing";

export interface BenefitsProps {
  content: BenefitsContent;
  variant?: "default" | "enterprise" | "startup";
  tracking?: {
    experimentId?: string;
    variant?: string;
    section: "benefits";
  };
  onBenefitClick?: (benefitIndex: number) => void;
  headingId?: string;
  id?: string;
}

// Icon mapping for benefits
const iconMap = {
  Zap,
  TrendingUp,
  BarChart3,
  Users,
  Shield,
  Settings,
  Rocket: Zap, // fallback
  DollarSign: TrendingUp, // fallback
  Building: Shield, // fallback
};

export function Benefits({
  content,
  variant = "default",
  tracking,
  onBenefitClick,
  headingId,
  id,
}: BenefitsProps) {
  return (
    <div
      id={id}
      className="relative"
      data-variant={variant}
      data-experiment-id={tracking?.experimentId}
      data-experiment={tracking?.experimentId}
      data-variant-experiment={tracking?.variant}
      data-section={tracking?.section}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-b from-primary/5 via-transparent to-accent/5" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-16">
          {content.title && (
            <h2
              id={headingId}
              className="text-[clamp(2rem,4vw,3rem)] font-bold"
            >
              {content.title}
            </h2>
          )}
          {content.subtitle && (
            <p className="text-lg md:text-xl text-muted-foreground mt-4">
              {content.subtitle}
            </p>
          )}
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {content.benefits.map((benefit, index) => {
            const IconComponent =
              iconMap[benefit.icon as keyof typeof iconMap] || Zap;

            return (
              <Card
                key={index}
                className={cn(
                  "group relative cursor-pointer transition-all duration-300",
                  "hover:scale-105 hover:-translate-y-2 hover:shadow-lg",
                )}
                onClick={() => onBenefitClick?.(index)}
                data-benefit-index={index}
                data-tracking="benefit-card"
                data-experiment={tracking?.experimentId}
              >
                <CardContent className="p-8">
                  {/* Icon */}
                  <div
                    className={cn(
                      "inline-flex items-center justify-center w-12 h-12 rounded-xl mb-6",
                      "bg-primary/10 text-primary",
                      "group-hover:bg-primary group-hover:text-primary-foreground",
                      "transition-colors duration-300",
                    )}
                  >
                    <IconComponent className="w-6 h-6" />
                  </div>

                  {/* Metric Badge */}
                  {benefit.metric && (
                    <Badge
                      variant="secondary"
                      className="mb-4 bg-success/10 text-success border-success/20"
                    >
                      {benefit.metric}
                    </Badge>
                  )}

                  {/* Title */}
                  <h3
                    className={cn(
                      "text-xl font-bold mb-3",
                      "text-foreground group-hover:text-primary",
                      "transition-colors duration-300",
                    )}
                  >
                    {benefit.title}
                  </h3>

                  {/* Description */}
                  <p
                    className={cn(
                      "text-muted-foreground leading-relaxed",
                      "group-hover:text-foreground/80",
                      "transition-colors duration-300",
                    )}
                  >
                    {benefit.description}
                  </p>

                  {/* Hover effect decoration */}
                  <div
                    className={cn(
                      "absolute inset-0 rounded-2xl",
                      "bg-linear-to-br from-primary/5 via-transparent to-accent/5",
                      "opacity-0 group-hover:opacity-100",
                      "transition-opacity duration-300",
                      "pointer-events-none",
                    )}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA or additional content */}
        {content.bottomCta && (
          <div className="text-center mt-16">
            <p className="text-muted-foreground">{content.bottomCta}</p>
          </div>
        )}
      </div>
    </div>
  );
}
