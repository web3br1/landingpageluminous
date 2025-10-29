"use client";

import React, { ReactNode } from "react";
import {
  composeLayout,
  ComposedLayout,
  validateLayoutComposition,
} from "./layout-registry";
import { SectionErrorBoundary } from "@/lib/utils/error-boundary";

interface LayoutComposerProps {
  layoutId: string;
  children: ReactNode;
  sections?: Array<{ id: string; content?: any }>;
  className?: string;
}

/**
 * Layout Composer Component
 *
 * Uses the layout registry to provide consistent layout composition
 * with proper provider wrapping, error boundaries, and validation.
 */
export function LayoutComposer({
  layoutId,
  children,
  sections = [],
  className,
}: LayoutComposerProps) {
  // Compose the layout from registry
  const composedLayout: ComposedLayout = composeLayout(layoutId);

  // Validate layout composition if sections are provided
  if (sections.length > 0) {
    const validation = validateLayoutComposition(layoutId, sections);
    if (!validation.valid) {
      console.warn(
        `Layout validation failed for "${layoutId}":`,
        validation.errors,
      );

      // In development, throw error to catch issues early
      if (process.env.NODE_ENV === "development") {
        throw new Error(
          `Invalid layout composition: ${validation.errors.join(", ")}`,
        );
      }
    }
  }

  // Build final className
  const finalClassName = [composedLayout.className, className]
    .filter(Boolean)
    .join(" ");

  // Create wrapper element with proper props
  const Wrapper = composedLayout.wrapper;
  const wrapperProps = {
    className: finalClassName,
    ...(composedLayout.config.semanticRole && {
      role: composedLayout.config.semanticRole,
    }),
    "data-layout": layoutId,
  };

  // Compose providers in correct order
  let content = children;
  composedLayout.providers.forEach((providerConfig, index) => {
    const ProviderComponent = providerConfig.component;
    const shouldRender =
      !providerConfig.condition || providerConfig.condition();

    if (shouldRender) {
      content = (
        <ProviderComponent key={index} {...(providerConfig.props || {})}>
          {content}
        </ProviderComponent>
      );
    }
  });

  // Wrap with error boundary if configured
  if (composedLayout.config.errorBoundary) {
    content = (
      <SectionErrorBoundary
        sectionName={layoutId}
        fallback={
          composedLayout.config.errorFallback ? (
            <composedLayout.config.errorFallback />
          ) : undefined
        }
      >
        {content}
      </SectionErrorBoundary>
    );
  }

  // Ensure Wrapper is a valid React component
  if (typeof Wrapper === "string") {
    return React.createElement(Wrapper as any, wrapperProps, content);
  }
  return React.createElement(Wrapper as any, wrapperProps, content);
}

// Hook for programmatic layout composition
export function useLayoutComposer(layoutId: string) {
  return composeLayout(layoutId);
}

// Utility for conditional layout rendering
export function renderWithLayout(
  layoutId: string,
  children: ReactNode,
  options?: { sections?: Array<{ id: string }>; className?: string },
) {
  return (
    <LayoutComposer
      layoutId={layoutId}
      sections={options?.sections}
      className={options?.className}
    >
      {children}
    </LayoutComposer>
  );
}
