"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";
import {
  TOKENS_BRAND,
  TOKENS_BASE,
  TOKENS_INTENT,
} from "@/lib/theme/design-tokens";
import { useAnimations } from "@/lib/hooks/use-animations";
import { useExperimentTracking } from "@/lib/experiments/hooks";
import { useAnalytics } from "@/lib/analytics/use-analytics";

// Função utilitária para combinar classes CTA
const getCTAVariantClasses = (
  variant: CTAVariant = "primary",
  size: CTASize = "default",
  loading?: boolean,
  disabled?: boolean,
) => {
  const baseClasses =
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl font-semibold transition-all duration-200 " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 " +
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0";

  const variantClasses = {
    primary:
      "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline:
      "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    success: "bg-green-600 text-white hover:bg-green-700",
    danger: "bg-red-600 text-white hover:bg-red-700",
    promo:
      "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl",
  };

  const sizeClasses = {
    sm: "h-11 px-3 text-sm min-h-[44px]", // 44px minimum touch target
    md: "h-11 px-4 py-3 text-sm min-h-[44px]",
    default: "h-11 px-6 text-base min-h-[44px]",
    lg: "h-13 px-8 text-lg min-h-[44px]",
    xl: "h-15 px-10 text-xl min-h-[44px]",
  };

  const stateClasses = [
    loading && "cursor-wait opacity-70",
    disabled && "opacity-50 cursor-not-allowed disabled:hover:transform-none",
  ]
    .filter(Boolean)
    .join(" ");

  return `${baseClasses} ${variantClasses[variant] || variantClasses.primary} ${sizeClasses[size] || sizeClasses.default} ${stateClasses}`.trim();
};

export interface CTAProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  href?: string;
  loading?: boolean;
  success?: boolean;
  error?: boolean;
  variant?: CTAVariant;
  size?: CTASize;
  state?: CTAState;
  children: React.ReactNode;
  // Experiment tracking props
  experimentId?: string;
  experimentVariant?: string;
  trackClick?: boolean;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

// CTA Unificado - substitui Button + CtaButton
const CTA = React.forwardRef<HTMLElement, CTAProps>(
  (
    {
      className,
      variant,
      size,
      state,
      asChild = false,
      href,
      loading = false,
      success = false,
      error = false,
      disabled,
      experimentId,
      experimentVariant,
      trackClick = true,
      onClick,
      children,
      ...props
    },
    ref,
  ) => {
    // Experiment tracking
    const experimentTracking =
      experimentId && experimentVariant
        ? useExperimentTracking(experimentId, experimentVariant)
        : null;

    // Analytics tracking
    const { trackEvent } = useAnalytics();

    // Animações padronizadas
    const { animations } = useAnimations();

    // Determina estado baseado em props
    const computedState = success
      ? "success"
      : error
        ? "error"
        : loading
          ? "loading"
          : state;

    const isAnchor = !!href;

    // Handle click with tracking
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
      if (trackClick && !loading && !disabled) {
        // Track experiment click if experiment is active
        if (experimentTracking) {
          experimentTracking.trackClick("cta_button", {
            variant,
            size,
            href,
            text: typeof children === "string" ? children : "cta_button",
          });
        }

        // Track analytics click
        trackEvent("cta_click", "click", "cta_button", undefined, {
          variant,
          size,
          href,
          experimentId,
          experimentVariant,
          element: "cta_button",
        });
      }

      // Call original onClick
      onClick?.(event);
    };

    // Renderização com motion wrapper para animações padronizadas
    const MotionWrapper = ({
      children,
      isDisabled,
    }: {
      children: React.ReactElement;
      isDisabled?: boolean;
    }) => {
      // Em testes, usar div normal para evitar warnings do React sobre props não reconhecidas
      if (process.env.NODE_ENV === "test") {
        return <div>{children}</div>;
      }

      return (
        <motion.div
          {...(isDisabled ? {} : animations.buttonHover)}
          {...(isDisabled ? {} : animations.buttonTap)}
        >
          {children}
        </motion.div>
      );
    };

    // Loading state - renderização separada para evitar conflitos de tipos
    if (loading) {
      const buttonElement = isAnchor ? (
        <a
          className={cn(
            getCTAVariantClasses(variant, size, loading, disabled),
            className,
          )}
          href={disabled ? undefined : href}
          onClick={handleClick}
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        >
          <Loader2 className="animate-spin" />
          {children}
        </a>
      ) : (
        <button
          type={props.type || "button"}
          className={cn(
            getCTAVariantClasses(variant, size, loading, disabled),
            className,
          )}
          disabled
          onClick={handleClick}
          {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        >
          <Loader2 className="animate-spin" />
          {children}
        </button>
      );

      return <MotionWrapper isDisabled={true}>{buttonElement}</MotionWrapper>;
    }

    // Normal state - renderização separada para evitar conflitos de tipos
    const buttonElement = isAnchor ? (
      <a
        className={cn(
          getCTAVariantClasses(variant, size, loading, disabled),
          className,
        )}
        href={disabled ? undefined : href}
        onClick={handleClick}
        {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </a>
    ) : (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={props.type || "button"}
        className={cn(
          getCTAVariantClasses(variant, size, loading, disabled),
          className,
        )}
        disabled={disabled}
        onClick={handleClick}
        {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {children}
      </button>
    );

    return <MotionWrapper isDisabled={disabled}>{buttonElement}</MotionWrapper>;
  },
);

CTA.displayName = "CTA";

// Componente principal
export { CTA };

// Legacy aliases para migração suave (deprecated - usar CTA diretamente)
export const CtaButton = CTA; // Alias para CtaButton existente
export const Button = CTA; // Alias para Button existente

// Export variants para uso em outros componentes
// Tipos para TypeScript
export type CTAVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "success"
  | "danger"
  | "promo";
export type CTASize = "sm" | "md" | "default" | "lg" | "xl";
export type CTAState = "default" | "loading" | "success" | "error";
