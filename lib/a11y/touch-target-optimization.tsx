import React from "react";
import { cn } from "@/lib/utils";

// Accessibility optimization for touch targets
// Ensures all interactive elements meet minimum 44px touch target size

interface TouchTargetProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  minSize?: number; // Minimum touch target size in pixels
}

// Wrapper component that ensures touch targets meet accessibility standards
export function TouchTarget({
  children,
  className,
  as: Component = "div",
  minSize = 44,
  ...props
}: TouchTargetProps & React.HTMLAttributes<HTMLElement>) {
  return React.createElement(
    Component,
    {
      className: cn(
        "relative",
        // Ensure minimum touch target size
        `min-h-[${minSize}px] min-w-[${minSize}px]`,
        // Center content within touch target
        "flex items-center justify-center",
        className,
      ),
      style: {
        minHeight: `${minSize}px`,
        minWidth: `${minSize}px`,
      },
      ...props,
    },
    children,
  );
}

// Optimized button component with proper touch targets
interface AccessibleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
}

export function AccessibleButton({
  children,
  className,
  variant = "primary",
  size = "md",
  ...props
}: AccessibleButtonProps) {
  const sizeClasses = {
    sm: "min-h-[44px] min-w-[44px] px-3 py-2 text-sm",
    md: "min-h-[44px] min-w-[44px] px-4 py-3 text-base",
    lg: "min-h-[48px] min-w-[48px] px-6 py-4 text-lg",
  };

  const variantClasses = {
    primary:
      "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90",
    secondary:
      "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:bg-secondary/80",
    outline:
      "border border-input bg-background hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
  };

  return (
    <button
      className={cn(
        // Base accessibility styles
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        // Touch target and visual sizing
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// Optimized link component with proper touch targets
interface AccessibleLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: "primary" | "secondary" | "underline";
  size?: "sm" | "md" | "lg";
}

export function AccessibleLink({
  children,
  className,
  variant = "primary",
  size = "md",
  ...props
}: AccessibleLinkProps) {
  const sizeClasses = {
    sm: "min-h-[44px] min-w-[44px] px-3 py-2 text-sm",
    md: "min-h-[44px] min-w-[44px] px-4 py-3 text-base",
    lg: "min-h-[48px] min-w-[48px] px-6 py-4 text-lg",
  };

  const variantClasses = {
    primary: "text-primary hover:text-primary/80 focus:text-primary/80",
    secondary:
      "text-secondary-foreground hover:text-secondary-foreground/80 focus:text-secondary-foreground/80",
    underline:
      "text-primary underline hover:text-primary/80 focus:text-primary/80",
  };

  return (
    <a
      className={cn(
        // Base accessibility styles
        "inline-flex items-center justify-center font-medium transition-colors",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "rounded-md", // For focus ring
        // Touch target and visual sizing
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </a>
  );
}

// Skip link component for keyboard navigation
interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
}

export function SkipLink({ href, children }: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        // Skip link styles - visually hidden until focused
        "sr-only focus:not-sr-only",
        "fixed top-4 left-4 z-50",
        "bg-primary text-primary-foreground px-4 py-2 rounded-md",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "transition-transform focus:translate-y-0",
        "min-h-[44px] min-w-[44px]", // Ensure touch target
        "flex items-center justify-center",
      )}
    >
      {children}
    </a>
  );
}

// Focus trap utility for modals and dialogs
export function useFocusTrap(containerRef: React.RefObject<HTMLElement>) {
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    function handleTabKey(e: KeyboardEvent) {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }

    container.addEventListener("keydown", handleTabKey);
    return () => container.removeEventListener("keydown", handleTabKey);
  }, [containerRef]);
}

// High contrast mode detector
export function useHighContrast() {
  const [isHighContrast, setIsHighContrast] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-contrast: high)");
    setIsHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsHighContrast(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return isHighContrast;
}

// Reduced motion detector
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return prefersReducedMotion;
}
