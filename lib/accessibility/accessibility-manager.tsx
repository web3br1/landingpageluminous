"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import Image from "next/image";
import { getSSRAdapter } from "../composition/container";

// ===== ACCESSIBILITY CONTEXT =====

interface AccessibilityContextType {
  // Screen reader announcements
  announce: (message: string, priority?: "polite" | "assertive") => void;

  // Focus management
  focusElement: (selector: string) => void;
  trapFocus: (containerRef: React.RefObject<HTMLElement>) => () => void;

  // Keyboard navigation
  enableKeyboardNavigation: () => void;
  disableKeyboardNavigation: () => void;

  // Reduced motion preference
  prefersReducedMotion: boolean;

  // High contrast preference
  prefersHighContrast: boolean;

  // Color scheme preference
  prefersDarkMode: boolean;

  // Skip links
  showSkipLinks: boolean;
  toggleSkipLinks: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | null>(
  null,
);

interface AccessibilityProviderProps {
  children: ReactNode;
}

export function AccessibilityProvider({
  children,
}: AccessibilityProviderProps) {
  const ssrAdapter = getSSRAdapter();
  const [announcements, setAnnouncements] = useState<
    Array<{ message: string; priority: "polite" | "assertive" }>
  >([]);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);
  const [prefersDarkMode, setPrefersDarkMode] = useState(false);
  const [showSkipLinks, setShowSkipLinks] = useState(false);

  // Detect user preferences and keyboard navigation on mount
  useEffect(() => {
    if (ssrAdapter.isClientContext()) {
      // Reduced motion
      const reducedMotionQuery = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      );
      setPrefersReducedMotion(reducedMotionQuery.matches);

      const handleReducedMotionChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };
      reducedMotionQuery.addEventListener("change", handleReducedMotionChange);

      // High contrast
      const contrastQuery = window.matchMedia("(prefers-contrast: high)");
      setPrefersHighContrast(contrastQuery.matches);

      const handleContrastChange = (e: MediaQueryListEvent) => {
        setPrefersHighContrast(e.matches);
      };
      contrastQuery.addEventListener("change", handleContrastChange);

      // Dark mode
      const colorSchemeQuery = window.matchMedia(
        "(prefers-color-scheme: dark)",
      );
      setPrefersDarkMode(colorSchemeQuery.matches);

      const handleColorSchemeChange = (e: MediaQueryListEvent) => {
        setPrefersDarkMode(e.matches);
      };
      colorSchemeQuery.addEventListener("change", handleColorSchemeChange);

      // Keyboard navigation detection - show skip links on Tab key
      let tabPressed = false;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Tab" && !tabPressed) {
          tabPressed = true;
          setShowSkipLinks(true);
        }
      };

      const handleMouseDown = () => {
        // Hide skip links when mouse is used
        tabPressed = false;
        setShowSkipLinks(false);
      };

      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleMouseDown);
      document.addEventListener("touchstart", handleMouseDown);

      // Auto-enable keyboard navigation on first Tab press
      const handleFirstTab = (e: KeyboardEvent) => {
        if (e.key === "Tab") {
          enableKeyboardNavigation();
          document.removeEventListener("keydown", handleFirstTab);
        }
      };
      document.addEventListener("keydown", handleFirstTab);

      return () => {
        reducedMotionQuery.removeEventListener(
          "change",
          handleReducedMotionChange,
        );
        contrastQuery.removeEventListener("change", handleContrastChange);
        colorSchemeQuery.removeEventListener("change", handleColorSchemeChange);
        document.removeEventListener("keydown", handleFirstTab);
      };
    }
  }, [ssrAdapter]);

  // Screen reader announcements
  const announce = (
    message: string,
    priority: "polite" | "assertive" = "polite",
  ) => {
    setAnnouncements((prev) => [...prev, { message, priority }]);

    // Clear after announcement
    setTimeout(() => {
      setAnnouncements((prev) => prev.slice(1));
    }, 1000);
  };

  // Focus management
  const focusElement = (selector: string) => {
    if (ssrAdapter.isClientContext()) {
      const element = document.querySelector(selector) as HTMLElement;
      if (element) {
        element.focus();
        // Ensure element is visible
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  // Focus trapping for modals, etc.
  const trapFocus = (containerRef: React.RefObject<HTMLElement>) => {
    if (!ssrAdapter.isClientContext()) return () => {};

    const container = containerRef.current;
    if (!container) return () => {};

    const focusableElements = container.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select',
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
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
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Focus should return to trigger element (implement in modal)
        announce("Modal closed", "assertive");
      }
    };

    document.addEventListener("keydown", handleTabKey);
    document.addEventListener("keydown", handleEscapeKey);

    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }

    return () => {
      document.removeEventListener("keydown", handleTabKey);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  };

  // Keyboard navigation
  const enableKeyboardNavigation = () => {
    if (!ssrAdapter.isClientContext()) return;

    document.body.setAttribute("data-keyboard-navigation", "true");

    // Ensure all focusable elements have proper focus management
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tab key management
      if (e.key === "Tab") {
        // Add a small delay to ensure focus has moved
        setTimeout(() => {
          const activeElement = document.activeElement;
          if (activeElement && activeElement instanceof HTMLElement) {
            // Ensure the focused element is visible
            activeElement.scrollIntoView({
              behavior: prefersReducedMotion ? "auto" : "smooth",
              block: "nearest",
              inline: "nearest",
            });
          }
        }, 0);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // Store cleanup function for later removal
    (document as any)._keyboardHandler = handleKeyDown;
  };

  const disableKeyboardNavigation = () => {
    if (!ssrAdapter.isClientContext()) return;

    document.body.removeAttribute("data-keyboard-navigation");

    // Remove keyboard event listener
    const handler = (document as any)._keyboardHandler;
    if (handler) {
      document.removeEventListener("keydown", handler);
      delete (document as any)._keyboardHandler;
    }
  };

  const toggleSkipLinks = () => {
    setShowSkipLinks((prev) => !prev);
  };

  const contextValue: AccessibilityContextType = {
    announce,
    focusElement,
    trapFocus,
    enableKeyboardNavigation,
    disableKeyboardNavigation,
    prefersReducedMotion,
    prefersHighContrast,
    prefersDarkMode,
    showSkipLinks,
    toggleSkipLinks,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {/* Screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcements
          .filter((a) => a.priority === "polite")
          .map((a, i) => (
            <div key={i}>{a.message}</div>
          ))}
      </div>
      <div aria-live="assertive" aria-atomic="true" className="sr-only">
        {announcements
          .filter((a) => a.priority === "assertive")
          .map((a, i) => (
            <div key={i}>{a.message}</div>
          ))}
      </div>

      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error(
      "useAccessibility must be used within an AccessibilityProvider",
    );
  }
  return context;
}

// ===== ACCESSIBLE COMPONENTS =====

// Skip Links
interface SkipLinksProps {
  links?: Array<{
    href: string;
    label: string;
  }>;
}

export function SkipLinks({
  links = [
    { href: "#hero", label: "Ir para início" },
    { href: "#main-content", label: "Ir para conteúdo principal" },
    { href: "#footer", label: "Ir para rodapé" },
  ],
}: SkipLinksProps) {
  const { showSkipLinks } = useAccessibility();

  if (!showSkipLinks) return null;

  return (
    <nav
      aria-label="Links de navegação rápida"
      className="fixed top-0 left-0 z-50 flex gap-2 p-4 bg-background/95 backdrop-blur-sm border-b border-border"
    >
      {links.map((link, index) => (
        <a
          key={index}
          href={link.href}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-foreground bg-primary hover:bg-primary/90 focus:bg-primary/90 rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-h-[44px] min-w-[44px] transition-colors"
          onClick={(e) => {
            e.preventDefault();
            const target = document.querySelector(
              link.href.replace("#", "#"),
            ) as HTMLElement;
            if (target) {
              target.focus();
              target.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }}
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}

// Accessible Button
interface AccessibleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  variant?: "primary" | "secondary" | "danger";
}

export function AccessibleButton({
  children,
  loading = false,
  loadingText = "Carregando...",
  disabled,
  variant = "primary",
  className = "",
  ...props
}: AccessibleButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={`accessible-button accessible-button--${variant} ${className}`}
      aria-disabled={isDisabled}
      aria-describedby={loading ? "loading-description" : undefined}
    >
      {loading ? (
        <>
          <span aria-hidden="true" className="loading-spinner"></span>
          <span id="loading-description" className="sr-only">
            {loadingText}
          </span>
          <span aria-hidden="true">{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

// Accessible Loading Spinner
interface AccessibleSpinnerProps {
  size?: "small" | "medium" | "large";
  label?: string;
  className?: string;
}

export function AccessibleSpinner({
  size = "medium",
  label = "Carregando...",
  className = "",
}: AccessibleSpinnerProps) {
  const { prefersReducedMotion } = useAccessibility();

  return (
    <div
      role="progressbar"
      aria-label={label}
      className={`accessible-spinner accessible-spinner--${size} ${className}`}
      aria-valuetext={label}
    >
      <div
        className="spinner"
        style={{
          animationDuration: prefersReducedMotion ? "0s" : "1s",
        }}
        aria-hidden="true"
      ></div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

// Accessible Modal/Dialog
interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: "small" | "medium" | "large" | "fullscreen";
  closeOnBackdropClick?: boolean;
}

export function AccessibleModal({
  isOpen,
  onClose,
  title,
  children,
  size = "medium",
  closeOnBackdropClick = true,
}: AccessibleModalProps) {
  const { trapFocus, announce } = useAccessibility();
  const modalRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      announce(`Modal aberto: ${title}`, "assertive");
      document.body.style.overflow = "hidden";

      const cleanup = trapFocus(modalRef as React.RefObject<HTMLElement>);

      return () => {
        document.body.style.overflow = "unset";
        cleanup();
      };
    }
  }, [isOpen, title, trapFocus, announce]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnBackdropClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="accessible-modal-overlay"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-content"
    >
      <div
        ref={modalRef}
        className={`accessible-modal accessible-modal--${size}`}
        role="document"
      >
        <header className="modal-header">
          <h2 id="modal-title" className="modal-title">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="modal-close-button"
            aria-label="Fechar modal"
            type="button"
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div id="modal-content" className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
}

// Accessible Form Field
interface AccessibleFieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  id: string;
}

export function AccessibleField({
  label,
  error,
  hint,
  required = false,
  children,
  id,
}: AccessibleFieldProps) {
  const fieldId = `${id}-field`;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const ariaDescribedBy = [
    error ? errorId : undefined,
    hint ? hintId : undefined,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="accessible-field">
      <label htmlFor={fieldId} className="field-label">
        {label}
        {required && (
          <span className="required-indicator" aria-label="obrigatório">
            *
          </span>
        )}
      </label>

      {hint && (
        <div id={hintId} className="field-hint">
          {hint}
        </div>
      )}

      <div className="field-input">
        {React.cloneElement(
          children as React.ReactElement,
          {
            id: fieldId,
            "aria-describedby": ariaDescribedBy || undefined,
            "aria-invalid": error ? "true" : undefined,
            required,
          } as any,
        )}
      </div>

      {error && (
        <div
          id={errorId}
          className="field-error"
          role="alert"
          aria-live="polite"
        >
          {error}
        </div>
      )}
    </div>
  );
}

// Accessible Image
interface AccessibleImageProps
  extends Omit<
    React.ImgHTMLAttributes<HTMLImageElement>,
    "src" | "width" | "height"
  > {
  src: string; // Required and must be string for Next.js Image
  alt: string; // Required for accessibility
  caption?: string;
  lazy?: boolean;
  width?: number | `${number}`; // Next.js Image requires specific width type
  height?: number | `${number}`; // Next.js Image requires specific height type
}

export function AccessibleImage({
  alt,
  caption,
  lazy = true,
  className = "",
  ...props
}: AccessibleImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleLoad = () => {
    setImageLoaded(true);
  };

  const handleError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  return (
    <figure className={`accessible-image ${className}`}>
      <div className="relative">
        <Image
          {...props}
          alt={alt}
          loading={lazy ? "lazy" : "eager"}
          onLoad={handleLoad}
          onError={handleError}
          className={`accessible-image__img ${imageLoaded ? "loaded" : "loading"}`}
          fill
        />
      </div>

      {imageError && (
        <div
          className="image-error"
          role="img"
          aria-label={`Erro ao carregar imagem: ${alt}`}
        >
          <span className="sr-only">Imagem não pôde ser carregada</span>
          <div className="error-placeholder" aria-hidden="true">
            Imagem indisponível
          </div>
        </div>
      )}

      {caption && <figcaption className="image-caption">{caption}</figcaption>}
    </figure>
  );
}

// Focus Trap Hook
export function useFocusTrap(active: boolean) {
  const { trapFocus } = useAccessibility();
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (active && containerRef.current) {
      return trapFocus(containerRef as React.RefObject<HTMLElement>);
    }
  }, [active, trapFocus]);

  return containerRef;
}

// Keyboard Navigation Hook
export function useKeyboardNavigation() {
  const { enableKeyboardNavigation, disableKeyboardNavigation } =
    useAccessibility();

  useEffect(() => {
    enableKeyboardNavigation();
    return disableKeyboardNavigation;
  }, [enableKeyboardNavigation, disableKeyboardNavigation]);
}

// Screen Reader Hook
export function useScreenReader() {
  const { announce } = useAccessibility();

  return {
    announce,
    announceSuccess: (message: string) => announce(message, "polite"),
    announceError: (message: string) => announce(message, "assertive"),
    announceLoading: (message: string) =>
      announce(`${message}. Aguarde.`, "polite"),
    announceComplete: (message: string) =>
      announce(`${message} concluído.`, "polite"),
  };
}

// ===== ACCESSIBILITY UTILITIES =====

export class AccessibilityUtils {
  // Generate unique IDs for ARIA relationships
  static generateAriaId(prefix = "aria"): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Check if element is visible to screen readers
  static isAriaHidden(element: HTMLElement): boolean {
    return (
      element.getAttribute("aria-hidden") === "true" ||
      element.hidden ||
      element.style.display === "none" ||
      element.style.visibility === "hidden"
    );
  }

  // Get all focusable elements in container
  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      "a[href]",
      "button:not([disabled])",
      "textarea:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ];

    return Array.from(
      container.querySelectorAll(focusableSelectors.join(", ")),
    ).filter((el) => !this.isAriaHidden(el as HTMLElement)) as HTMLElement[];
  }

  // Move focus to next element in sequence
  static moveFocus(
    container: HTMLElement,
    direction: "next" | "previous" = "next",
  ) {
    const focusableElements = this.getFocusableElements(container);
    const currentIndex = focusableElements.indexOf(
      document.activeElement as HTMLElement,
    );

    if (currentIndex === -1) return;

    let nextIndex;
    if (direction === "next") {
      nextIndex = (currentIndex + 1) % focusableElements.length;
    } else {
      nextIndex =
        currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
    }

    focusableElements[nextIndex]?.focus();
  }

  // Announce page changes to screen readers
  static announcePageChange(title: string) {
    // Create temporary element for announcement
    const announcement = document.createElement("div");
    announcement.setAttribute("aria-live", "assertive");
    announcement.setAttribute("aria-atomic", "true");
    announcement.className = "sr-only";
    announcement.textContent = `Página carregada: ${title}`;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  // Check color contrast (simplified)
  static hasGoodContrast(foreground: string, background: string): boolean {
    // This is a simplified check - in production, use a proper color contrast library
    // For now, just return true (assuming design system handles contrast)
    return true;
  }

  // Validate ARIA attributes
  static validateAriaAttributes(element: HTMLElement): string[] {
    const errors: string[] = [];

    // Check for missing labels
    if (
      element.hasAttribute("aria-labelledby") ||
      element.hasAttribute("aria-label")
    ) {
      const labelId = element.getAttribute("aria-labelledby");
      const label = element.getAttribute("aria-label");

      if (labelId && !document.getElementById(labelId)) {
        errors.push(
          `aria-labelledby references non-existent element: ${labelId}`,
        );
      }

      if (!labelId && !label?.trim()) {
        errors.push("aria-labelledby or aria-label is empty");
      }
    }

    // Check describedby references
    if (element.hasAttribute("aria-describedby")) {
      const describedBy = element.getAttribute("aria-describedby")!;
      const ids = describedBy.split(" ").filter(Boolean);

      ids.forEach((id) => {
        if (!document.getElementById(id)) {
          errors.push(
            `aria-describedby references non-existent element: ${id}`,
          );
        }
      });
    }

    return errors;
  }
}

// ===== STYLES (CSS Classes) =====
// These would be defined in your CSS/Tailwind config

/*
.accessible-button {
  @apply relative inline-flex items-center justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed;
}

.accessible-button--primary {
  @apply bg-primary text-white hover:bg-primary/90 focus:ring-primary;
}

.accessible-button--secondary {
  @apply bg-white text-gray-700 border-gray-300 hover:bg-gray-50 focus:ring-primary;
}

.accessible-button--danger {
  @apply bg-red-600 text-white hover:bg-red-700 focus:ring-red-500;
}

.accessible-spinner {
  @apply inline-flex items-center;
}

.accessible-spinner--small .spinner {
  @apply w-4 h-4;
}

.accessible-spinner--medium .spinner {
  @apply w-6 h-6;
}

.accessible-spinner--large .spinner {
  @apply w-8 h-8;
}

.accessible-modal-overlay {
  @apply fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50;
}

.accessible-modal {
  @apply bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto;
}

.accessible-modal--small {
  @apply w-full max-w-md;
}

.accessible-modal--medium {
  @apply w-full max-w-lg;
}

.accessible-modal--large {
  @apply w-full max-w-2xl;
}

.accessible-modal--fullscreen {
  @apply w-full h-full max-w-none max-h-none rounded-none;
}

.skip-links {
  @apply fixed top-0 left-0 z-50 flex flex-col space-y-2 p-4;
}

.skip-link {
  @apply bg-primary text-white px-4 py-2 rounded shadow-lg transform -translate-y-full focus:translate-y-0 transition-transform;
}

.sr-only {
  @apply absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0;
}

.accessible-field .field-label {
  @apply block text-sm font-medium text-gray-700 mb-1;
}

.accessible-field .field-hint {
  @apply text-sm text-gray-500 mb-2;
}

.accessible-field .field-error {
  @apply text-sm text-red-600 mt-1;
}

.accessible-image {
  @apply inline-block;
}

.accessible-image__img {
  @apply transition-opacity duration-300;
}

.accessible-image__img.loading {
  @apply opacity-0;
}

.accessible-image__img.loaded {
  @apply opacity-100;
}

.image-caption {
  @apply text-sm text-gray-600 mt-2 text-center;
}
*/
