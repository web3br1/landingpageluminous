"use client";

import React, { useState, useEffect, useCallback } from "react";
import { cacheUtils } from "@/lib/cache/edge-cache";
import {
  useResilientFetch,
  useResilientMutation,
} from "@/lib/network/use-resilient-fetch";

// ===== API RESPONSE TYPES =====

export interface EdgePersonalizationApiResponse {
  success: boolean;
  data?: EdgePersonalizationData;
  error?: string;
  cached: boolean;
  timestamp: number;
  processingTime: number;
  version: string;
}

// Types for edge personalization
interface EdgePersonalizationData {
  userId: string;
  segments: string[];
  content: Record<string, unknown>;
  experiments: Record<string, string>;
  geo: {
    country: string;
    city: string;
  };
  timestamp: string;
  edge: boolean;
  error?: string;
}

interface UseEdgePersonalizationOptions {
  page?: string;
  enableCache?: boolean;
  cacheTtl?: number;
  onError?: (error: Error) => void;
}

export function useEdgePersonalization(
  options: UseEdgePersonalizationOptions = {},
) {
  const {
    page = "landing",
    enableCache = true,
    cacheTtl = 1800, // 30 minutes
    onError,
  } = options;

  const [data, setData] = useState<EdgePersonalizationData | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Custom fetch function that handles caching
  const customFetch = useCallback(
    async (url: string) => {
      // Try cache first
      let personalizationData: EdgePersonalizationData | null = null;

      if (enableCache) {
        personalizationData = (await cacheUtils.getUserPersonalization(
          "current",
        )) as EdgePersonalizationData | null;
      }

      // If not in cache or cache disabled, fetch from edge
      if (!personalizationData) {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Edge personalization failed: ${response.status}`);
        }

        let apiResponse: EdgePersonalizationApiResponse;
        try {
          apiResponse = await response.json();
        } catch (parseError) {
          console.warn("Failed to parse personalization response:", parseError);
          personalizationData = null;
          return;
        }

        if (!apiResponse.success || !apiResponse.data) {
          console.warn("Personalization API returned error:", apiResponse.error);
          personalizationData = null;
          return;
        }

        personalizationData = apiResponse.data;

        // Cache the result
        if (enableCache && personalizationData) {
          await cacheUtils.setUserPersonalization(
            "current",
            personalizationData,
            cacheTtl,
          );
        }
      }

      return personalizationData;
    },
    [enableCache, cacheTtl],
  );

  const {
    data: fetchedData,
    loading: isLoading,
    error: fetchError,
    refetch,
  } = useResilientFetch(`/api/edge/personalize?page=${page}`, {
    enabled: true,
    onSuccess: (data) => setData(data),
    onError: (err) => {
      const error = new Error(err.message || "Unknown error");
      setError(error);
      onError?.(error);
      console.error("Edge personalization error:", error);
    },
  });

  // Sync data from hook
  useEffect(() => {
    if (fetchedData) {
      setData(fetchedData);
    }
  }, [fetchedData]);

  // Sync error from hook
  useEffect(() => {
    if (fetchError) {
      const error = new Error(fetchError.message || "Unknown error");
      setError(error);
      onError?.(error);
      console.error("Edge personalization error:", error);
    }
  }, [fetchError, onError]);

  const { mutate: updatePersonalization } = useResilientMutation(
    "POST",
    "/api/edge/personalize",
    {
      onSuccess: async () => {
        // Invalidate cache on update
        if (enableCache) {
          await cacheUtils.clearUserCache("current");
        }
      },
      onError: (err) => {
        const error = new Error(err.message || "Update failed");
        onError?.(error);
        console.error("Personalization update error:", error);
      },
    },
  );

  const updatePersonalizationWrapper = async (
    action: string,
    updateData: unknown,
  ) => {
    return await updatePersonalization({
      userId: data?.userId || "anonymous",
      action,
      data: updateData,
      timestamp: new Date().toISOString(),
    });
  };

  const refresh = () => {
    if (enableCache) {
      cacheUtils.clearUserCache("current");
    }
    refetch();
  };

  return {
    data,
    isLoading,
    error,
    segments: data?.segments || [],
    experiments: data?.experiments || {},
    geo: data?.geo || { country: "unknown", city: "unknown" },
    content: data?.content || {},
    updatePersonalization: updatePersonalizationWrapper,
    refresh,
    isEdgeEnabled: data?.edge || false,
  };
}

// Hook for geo-based personalization
export function useGeoPersonalization() {
  const [geo, setGeo] = useState({ country: "unknown", city: "unknown" });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // SSR safety: only run on client-side
    if (typeof document === "undefined") return;

    // Try to get from cookie first
    const cookieGeo = document.cookie
      .split("; ")
      .find((row) => row.startsWith("user_geo="))
      ?.split("=")[1];

    if (cookieGeo) {
      const [country, city] = cookieGeo.split(":");
      setGeo({ country, city });
      setIsLoading(false);
      return;
    }

    // Fallback: try to get from API
    fetch("/api/edge/personalize")
      .then((response) => response.json())
      .then((data) => {
        if (data.geo) {
          setGeo(data.geo);
        }
      })
      .catch((err) => {
        console.warn("Geo detection failed:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return { geo, isLoading };
}

// Hook for real-time content personalization
export function usePersonalizedContent<T>(
  contentKey: string,
  defaultContent: T,
  options: UseEdgePersonalizationOptions = {},
): T {
  const { content, isLoading } = useEdgePersonalization(options);

  if (isLoading) {
    return defaultContent;
  }

  return content[contentKey] || defaultContent;
}

// Hook for segment-based rendering
export function useSegmentGate(segmentName: string) {
  const { segments, isLoading } = useEdgePersonalization();

  const Gate: React.FC<{
    children: React.ReactNode;
    fallback?: React.ReactNode;
  }> = ({ children, fallback = null }) =>
    isLoading ? null : segments.includes(segmentName) ? (
      <>{children}</>
    ) : (
      <>{fallback}</>
    );

  return {
    isInSegment: segments.includes(segmentName),
    isLoading,
    Gate,
  };
}

// Hook for experiment-based rendering with edge context
export function useEdgeExperiment(experimentId: string) {
  const { experiments, isLoading } = useEdgePersonalization();

  const variant = experiments[experimentId] || "control";

  return {
    variant,
    isActive: variant !== "control",
    isLoading,
    isVariant: (variantId: string) => variant === variantId,
  };
}

// Utility hook for edge-enabled features
export function useEdgeFeatures() {
  const personalization = useEdgePersonalization();
  const geo = useGeoPersonalization();

  return {
    ...personalization,
    geo,
    // Combined features
    isEnterpriseUser: personalization.segments.includes("enterprise"),
    isMobileUser: personalization.segments.includes("mobile_user"),
    isFromBrazil: geo.geo.country === "BR",
    isFromUS: geo.geo.country === "US",
    hasActiveExperiments: Object.keys(personalization.experiments).length > 0,
  };
}
