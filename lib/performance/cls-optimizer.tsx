"use client";

import React, { useEffect, useRef, useState } from "react";

interface CLSOptimizerProps {
  children: React.ReactNode;
  reserveSpace?: boolean;
  minHeight?: string;
  aspectRatio?: string;
}

/**
 * CLS Optimizer Component
 * Reserves space for dynamic content to prevent layout shifts
 */
export function CLSOptimizer({
  children,
  reserveSpace = true,
  minHeight,
  aspectRatio
}: CLSOptimizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !reserveSpace) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        if (height > 0 && contentHeight !== height) {
          setContentHeight(height);
        }
      }
    });

    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [reserveSpace, contentHeight]);

  const style: React.CSSProperties = {};

  if (reserveSpace) {
    if (aspectRatio) {
      style.aspectRatio = aspectRatio;
    }
    if (minHeight) {
      style.minHeight = minHeight;
    }
    if (contentHeight) {
      style.minHeight = `${contentHeight}px`;
    }
  }

  return (
    <div
      ref={containerRef}
      className="cls-optimized-content"
      style={style}
      data-cls-optimized="true"
    >
      {children}
    </div>
  );
}

/**
 * Image CLS Optimizer - Reserves space for images
 */
export function ImageCLSOptimizer({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
}) {
  const aspectRatio = width && height ? `${width}/${height}` : undefined;
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <CLSOptimizer
      reserveSpace={true}
      aspectRatio={aspectRatio}
      minHeight={aspectRatio ? `calc(${height}/${width} * 100vw)` : undefined}
    >
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        className={`w-full h-auto ${className}`}
        onLoad={() => setImageLoaded(true)}
        style={{
          aspectRatio,
          // Ensure image doesn't cause layout shift once loaded
          contentVisibility: imageLoaded ? 'auto' : 'hidden'
        }}
      />
    </CLSOptimizer>
  );
}

/**
 * Text CLS Optimizer - Reserves space for dynamic text content
 */
export function TextCLSOptimizer({
  children,
  lines = 3,
  className = ""
}: {
  children: React.ReactNode;
  lines?: number;
  className?: string;
}) {
  const lineHeight = 1.5; // rem
  const fontSize = 1; // rem
  const estimatedHeight = `${lines * lineHeight * fontSize}rem`;

  return (
    <CLSOptimizer
      reserveSpace={true}
      minHeight={estimatedHeight}
    >
      <div className={className}>
        {children}
      </div>
    </CLSOptimizer>
  );
}

/**
 * Dynamic Content CLS Optimizer - For content that changes size
 */
export function DynamicContentCLSOptimizer({
  children,
  initialHeight = "200px",
  className = ""
}: {
  children: React.ReactNode;
  initialHeight?: string;
  className?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Mark as expanded after initial render to prevent CLS
    const timer = setTimeout(() => setIsExpanded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <CLSOptimizer
      reserveSpace={true}
      minHeight={initialHeight}
    >
      <div
        className={`${className} ${isExpanded ? 'animate-in' : ''}`}
        style={{
          transition: isExpanded ? 'all 0.3s ease-out' : 'none',
        }}
      >
        {children}
      </div>
    </CLSOptimizer>
  );
}

/**
 * Card CLS Optimizer - For card-based layouts
 */
export function CardCLSOptimizer({
  children,
  height = "300px",
  className = ""
}: {
  children: React.ReactNode;
  height?: string;
  className?: string;
}) {
  return (
    <CLSOptimizer
      reserveSpace={true}
      minHeight={height}
    >
      <div className={`bg-white dark:bg-neutral-800 rounded-lg shadow-md overflow-hidden ${className}`}>
        {children}
      </div>
    </CLSOptimizer>
  );
}

/**
 * List CLS Optimizer - For dynamic lists
 */
export function ListCLSOptimizer({
  children,
  itemHeight = "60px",
  estimatedItems = 5,
  className = ""
}: {
  children: React.ReactNode;
  itemHeight?: string;
  estimatedItems?: number;
  className?: string;
}) {
  const estimatedHeight = `calc(${itemHeight} * ${estimatedItems})`;

  return (
    <CLSOptimizer
      reserveSpace={true}
      minHeight={estimatedHeight}
    >
      <div className={className}>
        {children}
      </div>
    </CLSOptimizer>
  );
}

/**
 * Form CLS Optimizer - Prevents layout shifts during form interactions
 */
export function FormCLSOptimizer({
  children,
  className = ""
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    // Prevent layout shifts on form validation
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach((input) => {
      input.style.transition = 'border-color 0.2s ease, box-shadow 0.2s ease';
    });

    // Reserve space for validation messages
    const validateInputs = () => {
      inputs.forEach((input) => {
        const errorElement = input.parentElement?.querySelector('.error-message');
        if (errorElement) {
          (errorElement as HTMLElement).style.minHeight = '20px';
        }
      });
    };

    form.addEventListener('input', validateInputs);
    form.addEventListener('blur', validateInputs, true);

    return () => {
      form.removeEventListener('input', validateInputs);
      form.removeEventListener('blur', validateInputs, true);
    };
  }, []);

  return (
    <CLSOptimizer reserveSpace={false}>
      <form
        ref={formRef}
        className={className}
        data-cls-form="true"
      >
        {children}
      </form>
    </CLSOptimizer>
  );
}

/**
 * Modal CLS Optimizer - Prevents layout shifts when modals open
 */
export function ModalCLSOptimizer({
  children,
  isOpen,
  className = ""
}: {
  children: React.ReactNode;
  isOpen: boolean;
  className?: string;
}) {
  const [hasOpened, setHasOpened] = useState(false);

  useEffect(() => {
    if (isOpen && !hasOpened) {
      setHasOpened(true);
    }
  }, [isOpen, hasOpened]);

  return (
    <CLSOptimizer reserveSpace={hasOpened}>
      <div
        className={`${className} ${isOpen ? 'fixed inset-0 z-50' : 'hidden'}`}
        style={{
          // Reserve viewport space to prevent scroll jumping
          position: isOpen ? 'fixed' : 'static',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
        data-cls-modal="true"
      >
        {children}
      </div>
    </CLSOptimizer>
  );
}
