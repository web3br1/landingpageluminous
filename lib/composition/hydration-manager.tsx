// Hydration Manager - Ensures consistent server/client rendering
// Prevents hydration mismatches by managing state transitions properly

"use client";

import React, { useState, useEffect, ReactNode } from "react";
import { getSSRAdapter } from "./container";

interface HydrationManagerProps {
  children: ReactNode;
  fallback?: ReactNode;
  onHydrated?: () => void;
}

export function HydrationManager({
  children,
  fallback = null,
  onHydrated,
}: HydrationManagerProps) {
  const ssrAdapter = getSSRAdapter();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Only run on client after hydration
    if (ssrAdapter.isClientContext()) {
      setIsHydrated(true);
      onHydrated?.();
    }
  }, [ssrAdapter, onHydrated]);

  // During SSR and initial render, show fallback or nothing
  if (ssrAdapter.isServerContext() || !isHydrated) {
    return <>{fallback}</>;
  }

  // After hydration, render children
  return <>{children}</>;
}

// Hook for components that need hydration awareness
export function useHydration() {
  const ssrAdapter = getSSRAdapter();
  const [isHydrated, setIsHydrated] = useState(ssrAdapter.isClientContext());

  useEffect(() => {
    if (!isHydrated && ssrAdapter.isClientContext()) {
      setIsHydrated(true);
    }
  }, [isHydrated, ssrAdapter]);

  return {
    isHydrated,
    isServer: ssrAdapter.isServerContext(),
    isClient: ssrAdapter.isClientContext(),
    environment: ssrAdapter.getEnvironmentInfo(),
  };
}

// Safe client-only component wrapper
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { isClient } = useHydration();

  if (!isClient) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

// Safe server-only component wrapper (useful for testing)
export function ServerOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const ssrAdapter = getSSRAdapter();

  if (ssrAdapter.isClientContext()) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
