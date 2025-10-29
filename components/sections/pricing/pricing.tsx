// Composition-First Pricing Component
// Pure UI component that receives composed content as props
// No business logic, no data fetching, no experiments - just rendering

"use client";

import { useState } from "react";
// SectionWrapper/SectionHeader removidos: renderer fornece <section> e headingId
import { cn } from "@/lib/utils";
import { Check, X, Zap } from "lucide-react";
import type { PricingContent } from "@/domains/marketing";

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

export function Pricing({
  content,
  variant = "default",
  tracking,
  onPlanSelect,
  onToggleBilling,
  headingId,
}: PricingProps) {
  // Safety check - if content is undefined or plans is undefined, provide minimal fallback
  if (!content || !content.plans || !Array.isArray(content.plans)) {
    console.warn(
      "Pricing component received undefined content, plans, or plans is not an array, using fallback",
    );
    content = {
      title: "Planos",
      subtitle: "Escolha o plano ideal para seu negócio",
      plans: [],
      billingToggle: { enabled: true, defaultPeriod: "annual" },
    };
  }

  // Debug: Log received content
  console.log(
    "Pricing component received content:",
    JSON.stringify(content, null, 2),
  );

  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">(
    content.billingToggle?.defaultPeriod || "annual",
  );

  const handleBillingToggle = (period: "monthly" | "annual") => {
    setBillingPeriod(period);
    onToggleBilling?.(period);
  };

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
      console.warn(
        `Invalid currency code: ${currency}. Using fallback formatting.`,
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
