"use client";

import { useState } from "react";
import { flags, type Experiment } from "@/lib/flags";
import { isHTMLElement } from "@/lib/utils/dom-type-guards";
import { DEBUG_CONFIG } from "@/lib/hooks/scroll-config";

interface UnifiedDebugProps {
  scrollDebug?: {
    effectiveHeights: number[];
    chapterPositions: number[];
    totalHeight: number;
    actualSectionHeights: number[];
    chapterHeights: number[];
  };
}

export function UnifiedDebug({ scrollDebug }: UnifiedDebugProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "scroll" | "experiments" | "features"
  >("scroll");

  if (
    !DEBUG_CONFIG.ENABLE_SCROLL_DEBUG &&
    !DEBUG_CONFIG.ENABLE_EXPERIMENT_DEBUG
  )
    return null;

  const experiments = Object.entries(flags.experiments).map(
    ([id, experiment]: [string, Experiment]) => ({
      id,
      name: experiment.name,
      active: experiment.active,
      variants: experiment.variants,
      currentVariant: flags.getExperimentVariant(id),
    }),
  );

  const features = Object.entries(flags.features);

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm font-mono hover:bg-neutral-800 transition"
        title="Toggle Debug Panel"
      >
        🐛 Debug
      </button>

      {/* Debug panel */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 z-50 bg-white border border-neutral-300 rounded-lg shadow-lg p-0 max-w-md max-h-96 overflow-hidden">
          {/* Header with tabs */}
          <div className="border-b border-neutral-200 p-4">
            <h3 className="font-semibold text-neutral-900 mb-3">
              🐛 Debug Panel
            </h3>
            <div className="flex space-x-2">
              {scrollDebug && (
                <button
                  onClick={() => setActiveTab("scroll")}
                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                    activeTab === "scroll"
                      ? "bg-primary text-white"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                  }`}
                >
                  Scroll
                </button>
              )}
              <button
                onClick={() => setActiveTab("experiments")}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  activeTab === "experiments"
                    ? "bg-primary text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                A/B Tests
              </button>
              <button
                onClick={() => setActiveTab("features")}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  activeTab === "features"
                    ? "bg-primary text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                Features
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 max-h-80 overflow-y-auto">
            {activeTab === "scroll" && scrollDebug && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-medium text-neutral-700">
                      Total Height:
                    </span>
                    <div className="font-mono bg-neutral-100 px-2 py-1 rounded mt-1">
                      {scrollDebug.totalHeight}px
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-neutral-700">
                      Chapters:
                    </span>
                    <div className="font-mono bg-neutral-100 px-2 py-1 rounded mt-1">
                      {scrollDebug.effectiveHeights.length}
                    </div>
                  </div>
                </div>

                <div>
                  <span className="font-medium text-neutral-700 text-xs">
                    Positions:
                  </span>
                  <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
                    {scrollDebug.chapterPositions.map(
                      (pos: number, i: number) => (
                        <div
                          key={i}
                          className="flex justify-between text-xs font-mono bg-neutral-50 px-2 py-1 rounded"
                        >
                          <span>Ch{i}:</span>
                          <span>{Math.round(pos)}px</span>
                        </div>
                      ),
                    )}
                  </div>
                </div>

                <div>
                  <span className="font-medium text-neutral-700 text-xs">
                    Heights:
                  </span>
                  <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
                    {scrollDebug.effectiveHeights.map(
                      (height: number, i: number) => (
                        <div
                          key={i}
                          className="flex justify-between text-xs font-mono bg-neutral-50 px-2 py-1 rounded"
                        >
                          <span>Ch{i}:</span>
                          <span>{Math.round(height)}px</span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "experiments" && (
              <div className="space-y-3">
                {experiments.map((exp) => (
                  <div
                    key={exp.id}
                    className="border border-neutral-200 rounded p-3"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-sm">{exp.name}</span>
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          exp.active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {exp.active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="text-neutral-600 mb-2 text-xs">
                      Current:{" "}
                      <span className="font-mono bg-neutral-200 px-1 rounded">
                        {exp.currentVariant}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {exp.variants.map((variant: unknown) => {
                        if (typeof variant !== 'object' || variant === null || !('id' in variant) || !('name' in variant)) {
                          return null;
                        }
                        const v = variant as { id: string; name: string };
                        return (
                          <span
                            key={v.id}
                            className={`px-2 py-1 rounded text-xs ${
                              v.id === exp.currentVariant
                                ? "bg-blue-100 text-blue-800 font-medium"
                                : "bg-neutral-200 text-neutral-600"
                            }`}
                          >
                            {v.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "features" && (
              <div className="space-y-2">
                {features.map(([key, value]) => (
                  <div
                    key={key}
                    className="flex justify-between items-center text-xs"
                  >
                    <span className="font-mono">{key}</span>
                    <span
                      className={`px-2 py-1 rounded ${
                        value
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {value ? "On" : "Off"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-neutral-200 p-3">
            <button
              onClick={() => {
                flags.resetCache();
                window.location.reload();
              }}
              className="w-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-3 py-2 rounded text-xs transition"
            >
              🔄 Reset & Reload
            </button>
          </div>
        </div>
      )}
    </>
  );
}
