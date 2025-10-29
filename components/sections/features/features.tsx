// Composition-First Features Component
// Pure UI component that receives composed content as props
// No business logic, no data fetching, no experiments - just rendering

"use client";

import Image from "next/image";
// SectionWrapper/SectionHeader removidos: renderer fornece <section> e headingId
import { cn } from "@/lib/utils";
import {
  Database,
  Zap,
  Brain,
  Shield,
  BarChart3,
  Users,
  Server,
  Lock,
  Globe,
  Code,
  Settings,
} from "lucide-react";

// Define types locally to avoid import issues
interface FeatureContent {
  icon: string;
  title: string;
  description: string;
  highlight?: string;
}

interface FeaturesContent {
  title: string;
  subtitle: string;
  features: FeatureContent[];
  layout?: "grid" | "zigzag" | "list";
}

export interface FeaturesProps {
  content: FeaturesContent;
  variant?: "default" | "enterprise";
  tracking?: {
    experimentId?: string;
    variant?: string;
    section: "features";
  };
  onFeatureClick?: (featureIndex: number) => void;
  headingId?: string;
  id?: string;
}

const iconMap = {
  Database,
  Zap,
  Brain,
  Shield,
  BarChart3,
  Users,
  Server,
  Lock,
  Globe,
  Code,
  Settings,
} as const;

export function Features({
  content,
  variant = "default",
  tracking,
  onFeatureClick,
  headingId,
  id,
}: FeaturesProps) {
  // Safety check - if content is undefined or features is undefined, provide minimal fallback
  if (!content || !content.features || !Array.isArray(content.features)) {
    console.warn(
      "Features component received undefined content, features, or features is not an array, using fallback",
    );
    content = {
      title: "Recursos",
      subtitle: "Descubra as funcionalidades da nossa plataforma",
      features: [
        {
          icon: "Zap",
          title: "Automação Inteligente",
          description: "Automatize processos repetitivos com IA avançada",
          highlight: "70% mais rápido",
        },
      ],
      layout: "grid",
    };
  }

  const layout = content?.layout || "grid";

  return (
    <div
      id={id ?? "features"}
      className="py-20 md:py-28"
      data-variant={variant}
      data-experiment-id={tracking?.experimentId}
      data-variant-experiment={tracking?.variant}
      data-section={tracking?.section}
      data-experiment={tracking?.experimentId}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-16">
          {content?.title && (
            <h2
              id={headingId}
              className="text-[clamp(2rem,4vw,3rem)] font-bold"
            >
              {content.title}
            </h2>
          )}
          {content?.subtitle && (
            <p className="text-lg text-muted-foreground mt-4">
              {content.subtitle}
            </p>
          )}
        </div>

        {/* Features Grid */}
        {layout === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {content.features.map((feature, index) => {
              const IconComponent =
                iconMap[feature.icon as keyof typeof iconMap] || Database;

              return (
                <article
                  key={index}
                  className={cn(
                    "group relative p-6 rounded-2xl border border-border/50",
                    "bg-card/50 backdrop-blur-sm hover:bg-card/80",
                    "shadow-soft-sm hover:shadow-soft-lg",
                    "transition-all duration-300 hover:-translate-y-1",
                    "cursor-pointer",
                  )}
                  onClick={() => onFeatureClick?.(index)}
                  data-tracking="feature-card"
                  data-experiment={tracking?.experimentId}
                  role="article"
                  aria-label={`${feature.title}: ${feature.description}`}
                >
                  {/* Icon */}
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                    <IconComponent className="w-6 h-6 text-primary" />
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                        {feature.title}
                      </h3>
                      {feature.highlight && (
                        <span className="ml-2 px-2 py-1 text-xs font-medium bg-accent/20 text-accent rounded-full">
                          {feature.highlight}
                        </span>
                      )}
                    </div>

                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </article>
              );
            })}
          </div>
        )}

        {/* Features Zigzag Layout */}
        {layout === "zigzag" && (
          <div className="space-y-16">
            {content.features.map((feature, index) => {
              const IconComponent =
                iconMap[feature.icon as keyof typeof iconMap] || Database;
              const isEven = index % 2 === 0;

              return (
                <article
                  key={index}
                  className={cn(
                    "flex flex-col lg:flex-row items-center gap-8 lg:gap-16",
                    isEven ? "lg:flex-row" : "lg:flex-row-reverse",
                  )}
                  role="article"
                  aria-label={`${feature.title}: ${feature.description}`}
                >
                  {/* Content */}
                  <div
                    className={cn(
                      "flex-1 space-y-4",
                      isEven ? "lg:text-left" : "lg:text-right",
                    )}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                        <IconComponent className="w-6 h-6 text-primary" />
                      </div>
                      {feature.highlight && (
                        <span className="px-3 py-1 text-sm font-medium bg-accent/20 text-accent rounded-full">
                          {feature.highlight}
                        </span>
                      )}
                    </div>

                    <h3 className="text-2xl font-bold text-foreground">
                      {feature.title}
                    </h3>

                    <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                      {feature.description}
                    </p>
                  </div>

                  {/* Visual Element */}
                  <div className="flex-1 relative">
                    <div className="aspect-video rounded-2xl bg-linear-to-br from-primary/10 to-accent/10 border border-border/50 flex items-center justify-center">
                      <IconComponent className="w-24 h-24 text-primary/40" />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
