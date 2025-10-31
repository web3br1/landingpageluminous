// Composition-First Pricing Component
// Pure UI component that receives composed content as props
// No business logic, no data fetching, no experiments - just rendering

"use client";

import React, { useState, useMemo, useCallback } from "react";
import { z } from "zod";
// SectionWrapper/SectionHeader removidos: renderer fornece <section> e headingId
import { cn } from "@/lib/utils";
import { Check, X, Zap } from "lucide-react";
import type { PricingContent } from "@/domains/marketing";
import { SimpleErrorBoundary } from "@/lib/architecture/error-boundary-pattern";
import { withComponentContext } from "@/lib/architecture/logger-pattern";
import { useValidatedProps } from "@/lib/architecture/component-props";
import { useAnalytics } from "@/lib/analytics/use-analytics";
import { usePerformanceMonitor } from "@/lib/performance/optimized-lazy-loading";

export interface PricingProps {
  content: PricingContent;
  variant?: "default" | "enterprise";
  tracking?: {
    experimentId?: string;
    variant?: string;
    section: "pricing";
  };
  onPlanSelect?: (planId: string, billingPeriod: "monthly" | "annual") => void;
  onToggleBilling?: (period: "monthly" | "annual") => void;
  headingId?: string;
}

// Internal pricing component implementation
function PricingInternal({
  content,
  variant = "default",
  tracking,
  onPlanSelect,
  onToggleBilling,
  headingId,
}: PricingProps) {
  const logger = withComponentContext("pricing", "render");

  // Safety check - if content is undefined or plans is undefined, provide minimal fallback
  if (!content || !content.plans || !Array.isArray(content.plans)) {
    logger.warn(
      "Invalid pricing content received, using fallback",
      { hasContent: !!content, hasPlans: !!(content?.plans), plansIsArray: Array.isArray(content?.plans) }
    );
    content = {
      title: "Planos",
      subtitle: "Escolha o plano ideal para seu negócio",
      plans: [],
      billingToggle: { enabled: true, defaultPeriod: "annual" },
    };
  }

  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">(
    content.billingToggle?.defaultPeriod || "annual",
  );

  // Log component initialization
  logger.debug("Initializing pricing component", {
    variant,
    planCount: content.plans?.length || 0,
    hasTracking: !!tracking,
    experimentId: tracking?.experimentId
  });
  const analytics = useAnalytics({
    trackErrors: true,
    customTracking: { component: "pricing", variant }
  });
  const performanceMonitor = usePerformanceMonitor("MemoizedPricing");

  // Track component lifecycle
  React.useEffect(() => {
    analytics.trackEvent("component", "mount", "pricing", undefined, {
      variant,
      planCount: content.plans?.length || 0,
      hasBillingToggle: !!content.billingToggle?.enabled,
      experimentId: tracking?.experimentId,
    }).catch(err => logger.warn("Failed to track pricing mount", { error: err }));

    return () => {
      analytics.trackEvent("component", "unmount", "pricing", undefined, {
        variant,
        renderCount: performanceMonitor.renderCount,
        billingPeriod,
      }).catch(err => logger.warn("Failed to track pricing unmount", { error: err }));
    };
  }, [analytics, logger, variant, content.plans?.length, content.billingToggle?.enabled, tracking?.experimentId, performanceMonitor.renderCount, billingPeriod]);

  // Memoize billing toggle handler with analytics
  const handleBillingToggle = useCallback((period: "monthly" | "annual") => {
    const previousPeriod = billingPeriod;

    setBillingPeriod(period);
    onToggleBilling?.(period);

    // Track billing toggle interaction
    analytics.trackEvent("pricing", "billing_toggle", period, undefined, {
      previousPeriod,
      newPeriod: period,
      experimentId: tracking?.experimentId,
      variant: tracking?.variant,
      planCount: content.plans?.length || 0,
    }).catch(err => logger.warn("Failed to track billing toggle", { error: err, period }));
  }, [billingPeriod, onToggleBilling, analytics, tracking, content.plans?.length, logger]);

  const formatPrice = (price: number, currency: string) => {
    if (!currency || currency.trim() === "") {
      return `R$ ${price.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }

    try {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: currency.toUpperCase(),
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(price);
    } catch (error) {
      // Fallback se a currency for inválida
      logger.warn(
        `Invalid currency code: ${currency}. Using fallback formatting.`,
        { currency, price }
      );
      return `R$ ${price.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
  };

  const getDiscountPercentage = (monthly: number, annual: number) => {
    if (annual === 0 || monthly === 0) return 0;
    const monthlyYearly = monthly * 12;
    return Math.round(((monthlyYearly - annual) / monthlyYearly) * 100);
  };

  return (
    <div
      className="py-20 md:py-28 bg-muted/30"
      data-variant={variant}
      data-experiment-id={tracking?.experimentId}
      data-variant-experiment={tracking?.variant}
      data-section={tracking?.section}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-12">
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

        {/* Billing Toggle */}
        {content.billingToggle?.enabled && (
          <div className="flex items-center justify-center mb-12">
            <div className="bg-muted p-1 rounded-lg flex items-center">
              <button
                type="button"
                onClick={() => handleBillingToggle("monthly")}
                className={cn(
                  "px-6 py-2 rounded-md text-sm font-medium transition-colors",
                  billingPeriod === "monthly"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Mensal
              </button>
              <button
                type="button"
                onClick={() => handleBillingToggle("annual")}
                className={cn(
                  "px-6 py-2 rounded-md text-sm font-medium transition-colors relative",
                  billingPeriod === "annual"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Anual
                {billingPeriod === "annual" &&
                  content.plans &&
                  content.plans.length > 0 &&
                  content.plans.some(
                    (p) =>
                      getDiscountPercentage(p.price.monthly, p.price.annual) >
                      0,
                  ) && (
                    <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs px-2 py-1 rounded-full font-bold">
                      -
                      {Math.max(
                        ...content.plans.map((p) =>
                          getDiscountPercentage(
                            p.price.monthly,
                            p.price.annual,
                          ),
                        ),
                      )}
                      %
                    </span>
                  )}
              </button>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto card-container">
          {(content.plans || []).map((plan, index) => {
            const isPopular = content.highlightPopular && plan.popular;
            const price =
              billingPeriod === "annual"
                ? plan.price.annual
                : plan.price.monthly;
            const discount = getDiscountPercentage(
              plan.price.monthly,
              plan.price.annual,
            );

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative bg-card rounded-2xl border shadow-soft-sm hover:shadow-soft-lg transition-all duration-300 pricing-card",
                  "hover:-translate-y-1",
                  isPopular
                    ? "border-primary shadow-primary/20 scale-105"
                    : "border-border",
                )}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                      {plan.badge || "Mais Popular"}
                    </div>
                  </div>
                )}

                {/* Plan Badge (non-popular) */}
                {plan.badge && !isPopular && (
                  <div className="absolute -top-3 right-4">
                    <div className="bg-accent/20 text-accent px-3 py-1 rounded-full text-xs font-medium">
                      {plan.badge}
                    </div>
                  </div>
                )}

                <div className="p-8">
                  {/* Plan Header */}
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      {plan.description}
                    </p>

                    {/* Price */}
                    <div className="mb-4">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold text-foreground">
                          {formatPrice(price, plan.price.currency)}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          {billingPeriod === "annual" ? "/ano" : "/mês"}
                        </span>
                      </div>

                      {/* Annual discount */}
                      {billingPeriod === "annual" && discount > 0 && (
                        <div className="text-accent text-sm font-medium mt-1">
                          Economize {discount}% vs. mensal
                        </div>
                      )}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button
                    type="button"
                    onClick={() => onPlanSelect?.(plan.id, billingPeriod)}
                    className={cn(
                      "w-full py-3 px-5 rounded-2xl font-semibold text-sm transition-all duration-200 mb-6 min-h-[44px] inline-flex items-center justify-center",
                      "focus:outline-none focus:ring-2 focus:ring-offset-2",
                      isPopular
                        ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl focus:ring-primary"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary",
                    )}
                    data-tracking="pricing-cta"
                    data-plan={plan.id}
                    data-experiment={tracking?.experimentId}
                  >
                    {typeof plan.cta === "string" ? plan.cta : "CTA"}
                  </button>

                  {/* Features List */}
                  <div className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <div
                        key={featureIndex}
                        className="flex items-start gap-3"
                      >
                        <div className="shrink-0 mt-0.5">
                          {feature.included ? (
                            <Check className="w-4 h-4 text-accent" />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground/50" />
                          )}
                        </div>
                        <span
                          className={cn(
                            "text-sm",
                            feature.included
                              ? "text-foreground"
                              : "text-muted-foreground line-through",
                            feature.highlight && "font-semibold text-accent",
                          )}
                        >
                          {feature.name}
                          {feature.highlight && (
                            <Zap className="w-3 h-3 inline ml-1 text-accent" />
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Disclaimer */}
        {content.disclaimer && (
          <div className="text-center mt-12">
            <p className="text-muted-foreground text-sm max-w-2xl mx-auto">
              {content.disclaimer}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Main Pricing component with error boundary and props validation
export function Pricing(props: PricingProps) {
  // Validate props using our pattern
  const validatedProps = useValidatedProps(props, z.object({
    content: z.any(), // Allow any object, we'll handle validation in component
    variant: z.enum(["default", "enterprise"]).optional().default("default"),
    tracking: z.object({
      experimentId: z.string().optional(),
      variant: z.string().optional(),
      section: z.literal("pricing"),
    }).optional(),
    onPlanSelect: z.function().optional(),
    onToggleBilling: z.function().optional(),
    headingId: z.string().optional(),
  }), {
    componentName: "Pricing",
    logErrors: true,
    fallbackValues: {
      variant: "default"
    }
  });

  return (
    <SimpleErrorBoundary
      maxRetries={2}
      onError={(error) => {
        withComponentContext("pricing", "errorBoundary").error(
          "Pricing component error boundary triggered",
          error,
          { variant: validatedProps.variant, experimentId: validatedProps.tracking?.experimentId }
        );
      }}
      fallback={(error, retry) => (
        <div className="max-w-4xl mx-auto p-8 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-center">
            <div className="text-6xl mb-4">💰</div>
            <h3 className="text-2xl font-semibold text-red-900 mb-4">
              Planos Indisponíveis
            </h3>
            <p className="text-red-700 mb-6">
              Houve um problema ao carregar os planos de preços. Tente novamente ou entre em contato conosco.
            </p>
            <div className="space-y-3">
              <button
                onClick={retry}
                className="w-full bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
              >
                Tentar Novamente
              </button>
              <a
                href="#contact"
                className="block w-full bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors text-center"
              >
                Falar com Vendas
              </a>
            </div>
          </div>
        </div>
      )}
    >
      <PricingInternal {...validatedProps} />
    </SimpleErrorBoundary>
  );
}

// Memoize the pricing component for performance optimization
export const MemoizedPricing = React.memo(Pricing, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return (
    prevProps.content === nextProps.content &&
    prevProps.variant === nextProps.variant &&
    prevProps.tracking?.experimentId === nextProps.tracking?.experimentId &&
    prevProps.tracking?.variant === nextProps.tracking?.variant &&
    prevProps.headingId === nextProps.headingId &&
    prevProps.onPlanSelect === nextProps.onPlanSelect &&
    prevProps.onToggleBilling === nextProps.onToggleBilling
  );
});

// Export the memoized version as default
export default MemoizedPricing;

// Export the original for specific use cases
export { Pricing as PricingComponent };
