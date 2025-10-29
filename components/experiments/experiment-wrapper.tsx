"use client";

import React, { JSX } from "react";
import {
  useExperiment,
  getVariantContent,
} from "@/lib/ab-testing/experiment-engine";

interface ExperimentWrapperProps {
  experimentId: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  trackEvents?: string[];
  onVariantAssigned?: (variantId: string, experimentId: string) => void;
}

/**
 * ExperimentWrapper - Wrapper component for A/B testing
 * Automatically assigns users to experiment variants and tracks events
 */
export function ExperimentWrapper({
  experimentId,
  children,
  fallback,
  trackEvents = [],
  onVariantAssigned,
}: ExperimentWrapperProps) {
  const { variantId, experiment, trackEvent, isInExperiment } =
    useExperiment(experimentId);

  // Track additional events
  React.useEffect(() => {
    if (isInExperiment && trackEvents.length > 0) {
      const timer = setTimeout(() => {
        trackEvents.forEach((event) => {
          trackEvent(event);
        });
      }, 100); // Small delay to ensure component is mounted

      return () => clearTimeout(timer);
    }
  }, [isInExperiment, trackEvents, trackEvent]);

  // Notify when variant is assigned
  React.useEffect(() => {
    if (variantId && experimentId && onVariantAssigned) {
      onVariantAssigned(variantId, experimentId);
    }
  }, [variantId, experimentId, onVariantAssigned]);

  // If not in experiment, show fallback or default children
  if (!isInExperiment) {
    return <>{fallback || children}</>;
  }

  // If in experiment but no variant assigned yet, show loading
  if (!variantId) {
    return <div className="animate-pulse">{children}</div>;
  }

  return <>{children}</>;
}

// Specialized wrapper for content experiments
interface ContentExperimentProps {
  experimentId: string;
  defaultContent: any;
  variantOverrides?: Record<string, any>;
  render: (content: any, variantId: string) => React.ReactNode;
  trackEvents?: string[];
}

export function ContentExperiment({
  experimentId,
  defaultContent,
  variantOverrides = {},
  render,
  trackEvents,
}: ContentExperimentProps) {
  const { variantId, trackEvent } = useExperiment(experimentId);

  // Get variant content or use default
  const variantContent = variantId
    ? getVariantContent(experimentId, variantId)
    : null;
  const content = variantContent || defaultContent;

  // Apply overrides
  const finalContent = {
    ...content,
    ...(variantOverrides[variantId || ""] || {}),
  };

  // Track events
  React.useEffect(() => {
    if (variantId && trackEvents) {
      trackEvents.forEach((event) => trackEvent(event));
    }
  }, [variantId, trackEvents, trackEvent]);

  return <>{render(finalContent, variantId || "control")}</>;
}

// Hook for tracking experiment conversions
export function useExperimentTracking(experimentId: string) {
  const { variantId, trackEvent } = useExperiment(experimentId);

  return {
    trackConversion: (event: string, metadata?: Record<string, any>) => {
      trackEvent(event, metadata);
    },
    variantId,
    isInExperiment: !!variantId,
  };
}

// Component for experiment-aware buttons
interface ExperimentButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  experimentId: string;
  conversionEvent?: string;
  variantStyles?: Record<string, React.CSSProperties>;
  variantClasses?: Record<string, string>;
}

export function ExperimentButton({
  experimentId,
  conversionEvent = "button_click",
  variantStyles = {},
  variantClasses = {},
  onClick,
  className,
  style,
  children,
  ...props
}: ExperimentButtonProps) {
  const { variantId, trackEvent } = useExperiment(experimentId);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Track conversion
    trackEvent(conversionEvent, {
      buttonText: children?.toString() || "button",
      experimentId,
      variantId,
    });

    // Call original onClick
    onClick?.(e);
  };

  // Apply variant-specific styles
  const variantStyle = variantStyles[variantId || ""] || {};
  const variantClass = variantClasses[variantId || ""] || "";

  return (
    <button
      {...props}
      onClick={handleClick}
      className={`${className} ${variantClass}`.trim()}
      style={{ ...style, ...variantStyle }}
      data-experiment-variant={variantId}
    >
      {children}
    </button>
  );
}

// Component for experiment-aware text content
interface ExperimentTextProps {
  experimentId: string;
  defaultText: string;
  variantTexts?: Record<string, string>;
  as?: "span" | "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "div";
  className?: string;
  trackImpression?: boolean;
}

export function ExperimentText({
  experimentId,
  defaultText,
  variantTexts = {},
  as: Component = "span",
  className,
  trackImpression = false,
}: ExperimentTextProps) {
  const { variantId, trackEvent } = useExperiment(experimentId);

  // Get variant text or use default
  const text = variantTexts[variantId || ""] || defaultText;

  // Track impression
  React.useEffect(() => {
    if (trackImpression && variantId) {
      trackEvent("text_impression", { text: text.substring(0, 50) + "..." });
    }
  }, [trackImpression, variantId, text, trackEvent]);

  const props = {
    className,
    "data-experiment-variant": variantId,
  };

  switch (Component) {
    case "span":
      return <span {...props}>{text}</span>;
    case "p":
      return <p {...props}>{text}</p>;
    case "h1":
      return <h1 {...props}>{text}</h1>;
    case "h2":
      return <h2 {...props}>{text}</h2>;
    case "h3":
      return <h3 {...props}>{text}</h3>;
    case "h4":
      return <h4 {...props}>{text}</h4>;
    case "h5":
      return <h5 {...props}>{text}</h5>;
    case "h6":
      return <h6 {...props}>{text}</h6>;
    case "div":
      return <div {...props}>{text}</div>;
    default:
      return <span {...props}>{text}</span>;
  }
}

// Hook for experiment statistics
export function useExperimentStats(experimentId: string) {
  const [stats, setStats] = React.useState<any>(null);

  React.useEffect(() => {
    // In a real implementation, this would fetch from an API
    const results = (window as any).experimentEngine?.getExperimentResults(
      experimentId,
    );
    if (results) {
      setStats(results);
    }
  }, [experimentId]);

  return stats;
}
