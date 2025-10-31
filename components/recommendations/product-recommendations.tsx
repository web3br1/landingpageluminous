"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, ExternalLink, Star, TrendingUp } from "lucide-react";
import {
  ProductRecommendation,
  recommendationEngine,
  UserContext,
} from "@/lib/recommendations/product-recommendations";
import { usePersonalization } from "@/lib/personalization/personalization-context";
import { analytics } from "@/lib/analytics-core";

interface ProductRecommendationsProps {
  context?: Partial<UserContext>;
  position?: "floating" | "inline" | "modal";
  maxItems?: number;
  autoShow?: boolean;
  showDelay?: number;
}

export function ProductRecommendations({
  context,
  position = "floating",
  maxItems = 3,
  autoShow = true,
  showDelay = 10000,
}: ProductRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<
    ProductRecommendation[]
  >([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dismissedRecommendations, setDismissedRecommendations] = useState<
    Set<string>
  >(new Set());

  const { activeSegments, userProfile, trackUserAction } = usePersonalization();

  // Build user context - memoized to prevent infinite re-renders
  const userContext: UserContext = useMemo(
    () => ({
      segments: activeSegments,
      profile: (userProfile as unknown) || {},
      behavior:
        typeof window !== "undefined"
          ? {
              page_views: JSON.parse(
                localStorage.getItem("luminaris_page_views") || "[]",
              ),
              time_spent: JSON.parse(
                localStorage.getItem("luminaris_time_spent") || "{}",
              ),
              interactions: JSON.parse(
                localStorage.getItem("luminaris_interactions") || "[]",
              ),
              conversion_events: JSON.parse(
                localStorage.getItem("luminaris_conversions") || "[]",
              ),
            }
          : {
              page_views: [],
              time_spent: {},
              interactions: [],
              conversion_events: [],
            },
      current_page:
        typeof window !== "undefined" ? window.location.pathname : "/",
      ...context,
    }),
    [activeSegments, userProfile, context],
  );

  // Load recommendations
  useEffect(() => {
    const loadRecommendations = async () => {
      setIsLoading(true);
      try {
        const recs = await recommendationEngine.generateRecommendations(
          userContext,
          maxItems,
        );
        // Filter out dismissed recommendations
        const filteredRecs = recs.filter(
          (rec) => !dismissedRecommendations.has(rec.id),
        );
        setRecommendations(filteredRecs);
      } catch (error) {
        console.error("Failed to load recommendations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecommendations();
  }, [userContext, maxItems, dismissedRecommendations]);

  // Auto-show logic
  useEffect(() => {
    if (!autoShow || recommendations.length === 0) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
      analytics.track("recommendations_shown", {
        position,
        count: recommendations.length,
        auto_shown: true,
        delay: showDelay,
      });
    }, showDelay);

    return () => clearTimeout(timer);
  }, [recommendations, autoShow, showDelay, position]);

  const handleDismiss = (recommendationId: string) => {
    setDismissedRecommendations((prev) => new Set([...prev, recommendationId]));
    setRecommendations((prev) =>
      prev.filter((rec) => rec.id !== recommendationId),
    );

    analytics.track("recommendation_dismissed", {
      recommendation_id: recommendationId,
      position,
    });
  };

  const handleClick = (recommendation: ProductRecommendation) => {
    analytics.track("recommendation_clicked", {
      recommendation_id: recommendation.id,
      type: recommendation.type,
      cta_url: recommendation.cta_url,
      position,
    });

    trackUserAction("recommendation_click", {
      recommendation_id: recommendation.id,
      type: recommendation.type,
    });

    // Navigate to CTA URL
    window.location.href = recommendation.cta_url;
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
    analytics.track(
      isVisible ? "recommendations_hidden" : "recommendations_shown",
      {
        position,
        manual: true,
      },
    );
  };

  if (recommendations.length === 0 && !isLoading) return null;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "feature":
        return "✨";
      case "plan":
        return "💎";
      case "integration":
        return "🔗";
      case "resource":
        return "📚";
      default:
        return "🎯";
    }
  };

  if (position === "floating") {
    return (
      <AnimatePresence>
        {isVisible && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setIsVisible(false)}
            />

            {/* Recommendations Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed bottom-24 right-4 w-80 bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5" />
                    <h3 className="font-semibold">Recomendações para Você</h3>
                  </div>
                  <button
                    onClick={() => setIsVisible(false)}
                    className="p-1 hover:bg-white/20 rounded transition-colors"
                    aria-label="Fechar recomendações"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm opacity-90 mt-1">
                  Baseado no seu perfil e comportamento
                </p>
              </div>

              {/* Content */}
              <div className="max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Carregando recomendações...
                    </p>
                  </div>
                ) : (
                  <div className="p-2 space-y-2">
                    {recommendations.map((rec, index) => (
                      <motion.div
                        key={rec.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="relative bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                      >
                        {/* Priority Badge */}
                        <div
                          className={`absolute top-2 right-2 text-xs px-2 py-1 rounded-full ${getPriorityColor(rec.priority)}`}
                        >
                          {rec.priority === "high"
                            ? "🔥"
                            : rec.priority === "medium"
                              ? "⭐"
                              : "💡"}
                        </div>

                        {/* Dismiss Button */}
                        <button
                          onClick={() => handleDismiss(rec.id)}
                          className="absolute top-2 left-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
                          aria-label="Dispensar recomendação"
                        >
                          <X className="w-3 h-3" />
                        </button>

                        {/* Content */}
                        <div className="mt-6">
                          <div className="flex items-start space-x-3">
                            <span className="text-2xl">
                              {rec.visual?.icon || getTypeIcon(rec.type)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                {rec.title}
                              </h4>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                {rec.description}
                              </p>

                              {/* Reason */}
                              <p className="text-xs text-primary mt-2 font-medium">
                                {rec.reason}
                              </p>

                              {/* CTA Button */}
                              <button
                                onClick={() => handleClick(rec)}
                                className="mt-3 w-full flex items-center justify-center space-x-2 px-3 py-2 bg-primary hover:bg-primary/90 text-white text-xs rounded-lg transition-colors"
                              >
                                <span>{rec.cta_text}</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }

  if (position === "inline") {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Recomendações Personalizadas
            </h3>
          </div>
          <button
            onClick={toggleVisibility}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label={
              isVisible ? "Ocultar recomendações" : "Mostrar recomendações"
            }
          >
            {isVisible ? (
              <X className="w-4 h-4" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
          </button>
        </div>

        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <span className="text-xl mt-1">
                    {rec.visual?.icon || getTypeIcon(rec.type)}
                  </span>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                      {rec.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {rec.description}
                    </p>
                    <button
                      onClick={() => handleClick(rec)}
                      className="mt-2 text-xs text-primary hover:text-primary/80 font-medium"
                    >
                      {rec.cta_text} →
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return null;
}

// Hook for easy usage
export function useProductRecommendations(context?: Partial<UserContext>) {
  const [recommendations, setRecommendations] = useState<
    ProductRecommendation[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const { activeSegments, userProfile } = usePersonalization();

  // Memoize user context to prevent infinite re-renders
  const userContext: UserContext = useMemo(
    () => ({
      segments: activeSegments,
      profile: (userProfile as unknown) || {},
      behavior:
        typeof window !== "undefined"
          ? {
              page_views: JSON.parse(
                localStorage.getItem("luminaris_page_views") || "[]",
              ),
              time_spent: JSON.parse(
                localStorage.getItem("luminaris_time_spent") || "{}",
              ),
              interactions: JSON.parse(
                localStorage.getItem("luminaris_interactions") || "[]",
              ),
              conversion_events: JSON.parse(
                localStorage.getItem("luminaris_conversions") || "[]",
              ),
            }
          : {
              page_views: [],
              time_spent: {},
              interactions: [],
              conversion_events: [],
            },
      current_page:
        typeof window !== "undefined" ? window.location.pathname : "/",
      ...context,
    }),
    [activeSegments, userProfile, context],
  );

  useEffect(() => {
    const loadRecs = async () => {
      if (typeof window === "undefined") {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const recs =
          await recommendationEngine.generateRecommendations(userContext);
        setRecommendations(recs);
      } catch (error) {
        console.error("Failed to load recommendations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecs();
  }, [userContext]); // Now depends on memoized userContext

  return { recommendations, isLoading };
}
