"use client";

import { useABTest } from "@/lib/experiments/hooks";
import { X } from "lucide-react";
import { useState } from "react";

/**
 * Debug component to show current experiment variant
 * Remove this in production
 */
export function ExperimentIndicator() {
  const { variant: heroVariant } = useABTest("hero_headline");
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 max-w-xs z-50">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
          A/B Test Active
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            Hero Headline:
          </span>
          <span className="font-medium text-gray-900 dark:text-white">
            {heroVariant === "control"
              ? "Control"
              : `Variant ${heroVariant.slice(-1)}`}
          </span>
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Visit /admin/experiments to manage tests
      </div>
    </div>
  );
}
