"use client";

import React from "react";
import { SimpleErrorBoundary } from "@/lib/architecture/error-boundary-pattern";

/**
 * Error Boundary UI Component
 * Provides a consistent error boundary UI for the application
 */

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: (error: Error, retry: () => void) => React.ReactNode;
  maxRetries?: number;
  onError?: (error: Error) => void;
  className?: string;
}

export function ErrorBoundary({
  children,
  fallback,
  maxRetries = 2,
  onError,
  className,
}: ErrorBoundaryProps) {
  return (
    <SimpleErrorBoundary
      maxRetries={maxRetries}
      onError={onError}
      fallback={fallback}
    >
      {children}
    </SimpleErrorBoundary>
  );
}

export default ErrorBoundary;
