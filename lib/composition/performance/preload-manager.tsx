"use client";

import { useEffect } from "react";
import { getSSRAdapter } from "../container";

// Simplified preload manager - removed complex logic
interface PreloadManagerProps {
  enabled?: boolean;
}

export function PreloadManager({ enabled = true }: PreloadManagerProps) {
  const ssrAdapter = getSSRAdapter();

  useEffect(() => {
    if (!enabled || ssrAdapter.isServerContext()) return;

    // Simplified preloading - just preload hero and benefits on mount
    const preloadCritical = async () => {
      try {
        await import("../../../components/sections/hero");
        await import("../../../components/sections/benefits");
      } catch (error) {
        console.warn("Failed to preload critical sections:", error);
      }
    };

    // Small delay to not block initial render
    setTimeout(preloadCritical, 100);
  }, [enabled, ssrAdapter]);

  return null;
}
