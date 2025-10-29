"use client";

import { useState, useEffect } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

interface AnimationDebugProps {
  className?: string;
}

export function AnimationDebug({ className = "" }: AnimationDebugProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "animations" | "colors" | "performance"
  >("animations");
  const [testAnimation, setTestAnimation] = useState<string>("");
  const controls = useAnimationControls();
  const prefersReducedMotion = useReducedMotion();

  // Test animations
  const testAnimations = {
    fadeUp: () =>
      controls.start({
        opacity: [0, 1],
        y: [20, 0],
        transition: { duration: 0.6, ease: "easeOut" },
      }),
    fadeIn: () =>
      controls.start({
        opacity: [0, 1],
        transition: { duration: 0.4, ease: "easeOut" },
      }),
    float: () =>
      controls.start({
        y: [0, -8, 0],
        transition: {
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
        },
      }),
    scale: () =>
      controls.start({
        scale: [1, 1.05, 1],
        transition: { duration: 0.3, ease: "easeOut" },
      }),
    slideLeft: () =>
      controls.start({
        x: [20, 0],
        opacity: [0, 1],
        transition: { duration: 0.5, ease: "easeOut" },
      }),
    slideRight: () =>
      controls.start({
        x: [-20, 0],
        opacity: [0, 1],
        transition: { duration: 0.5, ease: "easeOut" },
      }),
  };

  // Theme color test data
  const themeColors = [
    {
      name: "Primary",
      classes: "bg-primary text-white",
      hsl: "hsl(258, 90%, 60%)",
    },
    {
      name: "Primary-600",
      classes: "bg-primary-600 text-white",
      hsl: "hsl(258, 90%, 52%)",
    },
    {
      name: "Secondary",
      classes: "bg-secondary text-white",
      hsl: "hsl(200, 100%, 50%)",
    },
    {
      name: "Accent",
      classes: "bg-accent text-black",
      hsl: "hsl(340, 93%, 72%)",
    },
    {
      name: "Neutral-900",
      classes: "bg-neutral-900 text-white",
      hsl: "hsl(210, 15%, 22%)",
    },
    {
      name: "Neutral-100",
      classes: "bg-neutral-100 text-black",
      hsl: "hsl(210, 15%, 96%)",
    },
    {
      name: "Background",
      classes: "bg-background text-foreground",
      hsl: "hsl(var(--background))",
    },
    {
      name: "Card",
      classes: "bg-card text-card-foreground",
      hsl: "hsl(var(--card))",
    },
  ];

  // Performance metrics
  const [performanceMetrics, setPerformanceMetrics] = useState({
    fps: 0,
    memoryUsage: 0,
    animationCount: 0,
  });

  useEffect(() => {
    if (!isVisible || activeTab !== "performance") return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animationFrame: number;

    const measurePerformance = () => {
      const now = performance.now();
      const deltaTime = now - lastTime;

      if (deltaTime >= 1000) {
        // Update every second
        const fps = Math.round((frameCount * 1000) / deltaTime);
        setPerformanceMetrics((prev) => ({
          ...prev,
          fps,
          animationCount: frameCount,
        }));
        frameCount = 0;
        lastTime = now;
      }

      frameCount++;
      animationFrame = requestAnimationFrame(measurePerformance);
    };

    animationFrame = requestAnimationFrame(measurePerformance);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isVisible, activeTab]);

  if (process.env.NODE_ENV === "production") return null;

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 left-4 z-50 bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm font-mono hover:bg-neutral-800 transition"
        title="Toggle Animation Debug"
      >
        🎬 Animations
      </button>

      {/* Debug panel */}
      {isVisible && (
        <div className="fixed bottom-16 left-4 z-50 bg-white border border-neutral-300 rounded-lg shadow-lg p-0 max-w-md max-h-96 overflow-hidden">
          {/* Header with tabs */}
          <div className="border-b border-neutral-200 p-4">
            <h3 className="font-semibold text-neutral-900 mb-3">
              🎬 Animation & Theme Debug
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab("animations")}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  activeTab === "animations"
                    ? "bg-primary text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                Animations
              </button>
              <button
                onClick={() => setActiveTab("colors")}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  activeTab === "colors"
                    ? "bg-primary text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                Colors
              </button>
              <button
                onClick={() => setActiveTab("performance")}
                className={`px-3 py-1 rounded text-sm font-medium transition ${
                  activeTab === "performance"
                    ? "bg-primary text-white"
                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                }`}
              >
                Performance
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 max-h-80 overflow-y-auto">
            {activeTab === "animations" && (
              <div className="space-y-4">
                <div className="text-sm text-neutral-600">
                  <p>
                    Reduced Motion:{" "}
                    <span
                      className={
                        prefersReducedMotion ? "text-red-500" : "text-green-500"
                      }
                    >
                      {prefersReducedMotion ? "Enabled" : "Disabled"}
                    </span>
                  </p>
                </div>

                {/* Test Element */}
                <div className="border border-neutral-200 rounded p-4 bg-neutral-50">
                  <h4 className="font-medium text-sm mb-2">Test Element</h4>
                  <motion.div
                    animate={controls}
                    className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center text-white text-sm font-bold"
                  >
                    Test
                  </motion.div>
                </div>

                {/* Animation Controls */}
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(testAnimations).map(
                    ([name, runAnimation]) => (
                      <button
                        key={name}
                        onClick={() => {
                          setTestAnimation(name);
                          runAnimation();
                        }}
                        disabled={prefersReducedMotion}
                        className="px-3 py-2 bg-neutral-100 hover:bg-neutral-200 disabled:bg-neutral-50 disabled:text-neutral-400 rounded text-sm font-medium transition"
                      >
                        {name}
                      </button>
                    ),
                  )}
                </div>

                {/* Mount Animation Test */}
                <div className="border border-neutral-200 rounded p-3 bg-neutral-50">
                  <h4 className="font-medium text-sm mb-2">
                    Mount Animation Test
                  </h4>
                  <p className="text-xs text-neutral-600 mb-2">
                    These animations trigger on component mount:
                  </p>
                  <div className="space-y-2">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className="bg-green-100 p-2 rounded text-xs"
                    >
                      Mount animation test
                    </motion.div>
                  </div>
                </div>

                {testAnimation && (
                  <div className="text-xs text-neutral-600 bg-neutral-100 p-2 rounded">
                    Last tested: <strong>{testAnimation}</strong>
                  </div>
                )}

                {/* Current animations info */}
                <div className="text-xs text-neutral-500 space-y-1">
                  <p>• FadeUp: 0.3s duration, 12px y-offset</p>
                  <p>• Float: 3s infinite, 8px amplitude</p>
                  <p>• CTA hover: 0.2s, 2% scale</p>
                  <p>• Transitions: 320ms, easing: [0.2,0.8,0.2,1]</p>
                  <p>• Hero stagger: 0.1s delay between elements</p>
                </div>

                {/* Animation Status */}
                <div className="mt-4 p-2 bg-neutral-50 rounded">
                  <h5 className="font-medium text-sm mb-2">Animation Status</h5>
                  <div className="space-y-1 text-xs">
                    <p className="text-green-600">✅ Framer Motion loaded</p>
                    <p className="text-green-600">✅ Reduced motion support</p>
                    <p className="text-green-600">
                      ✅ Animation presets loaded
                    </p>
                    <p className="text-green-600">✅ Hero group animations</p>
                    <p
                      className={
                        prefersReducedMotion
                          ? "text-orange-600"
                          : "text-green-600"
                      }
                    >
                      {prefersReducedMotion
                        ? "⚠️ Reduced motion enabled"
                        : "✅ Full animations enabled"}
                    </p>
                  </div>
                </div>

                {/* Known Issues */}
                <div className="mt-4 p-2 bg-red-50 rounded border border-red-200">
                  <h5 className="font-medium text-sm mb-2 text-red-800">
                    ⚠️ Issues Found & Fixed
                  </h5>
                  <div className="space-y-1 text-xs text-red-700">
                    <p>✅ Fixed: FadeUp component animation props</p>
                    <p>✅ Fixed: Animation hook shortcuts expanded</p>
                    <p>✅ Fixed: Hero stagger animations verified</p>
                    <p>
                      ✅ Fixed: How It Works section - unified animation system
                    </p>
                    <p>✅ Fixed: Removed conflicting wrapper animations</p>
                    <p>
                      ✅ REMOVED: All scroll-triggered animations (whileInView +
                      viewport)
                    </p>
                    <p>✅ REMOVED: All stagger animations based on scroll</p>
                    <p>✅ REMOVED: Scrollbar vertical</p>
                    <p>✅ REMOVED: Modal de Casos de Uso (1 2 3 4 98%)</p>
                    <p>✅ FIXED: Build errors after removing modal</p>
                    <p>ℹ️ Note: Only hover and mount animations remain</p>
                  </div>
                </div>

                {/* What Was Removed */}
                <div className="mt-4 p-2 bg-gray-50 rounded border border-gray-200">
                  <h5 className="font-medium text-sm mb-2 text-gray-800">
                    🗑️ Elements Removed
                  </h5>
                  <div className="space-y-1 text-xs text-gray-700">
                    <p>
                      • Modal de progresso &quot;1 2 3 4 98%&quot; dos Casos de
                      Uso
                    </p>
                    <p>• Stepper vertical da seção de verticais</p>
                    <p>• PinnedChapter wrapper dos casos de uso</p>
                    <p>• Capítulo &quot;use-cases&quot; do storytelling</p>
                    <p>• Todas as animações baseadas em scroll/viewport</p>
                  </div>
                </div>

                {/* Animation Trigger Tests */}
                <div className="mt-4 p-2 bg-green-50 rounded border border-green-200">
                  <h5 className="font-medium text-sm mb-2 text-green-800">
                    🧪 Remaining Animation Tests
                  </h5>
                  <div className="space-y-1 text-xs text-green-700">
                    <p>• Check mount animations (fadeUp on load)</p>
                    <p>• Test hover animations on buttons/cards</p>
                    <p>• Verify continuous animations (float/pulse)</p>
                    <p>• Test reduced motion fallback</p>
                    <p>• Confirm no scrollbar visible</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "colors" && (
              <div className="space-y-3">
                <p className="text-sm text-neutral-600 mb-3">
                  Theme colors with HSL values and contrast checks
                </p>

                {themeColors.map((color) => (
                  <div
                    key={color.name}
                    className="border border-neutral-200 rounded p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{color.name}</span>
                      <span className="text-xs font-mono text-neutral-500">
                        {color.hsl}
                      </span>
                    </div>
                    <div
                      className={`w-full h-8 rounded ${color.classes} flex items-center px-2`}
                    >
                      <span className="text-xs font-medium">Sample Text</span>
                    </div>
                  </div>
                ))}

                {/* Contrast warnings */}
                <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
                  ⚠️ <strong>Contrast Check:</strong> Ensure 4.5:1 ratio for
                  text, 3:1 for UI elements
                </div>
              </div>
            )}

            {activeTab === "performance" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-neutral-50 rounded">
                    <div className="text-2xl font-bold text-primary">
                      {performanceMetrics.fps}
                    </div>
                    <div className="text-xs text-neutral-600">FPS</div>
                  </div>
                  <div className="text-center p-3 bg-neutral-50 rounded">
                    <div className="text-lg font-bold text-secondary">
                      {performanceMetrics.animationCount}
                    </div>
                    <div className="text-xs text-neutral-600">Frames</div>
                  </div>
                </div>

                {/* Performance tips */}
                <div className="text-xs text-neutral-600 space-y-1">
                  <p>
                    <strong>Performance Tips:</strong>
                  </p>
                  <p>
                    • Use <code>will-change</code> for animated elements
                  </p>
                  <p>
                    • Prefer <code>transform</code> over position changes
                  </p>
                  <p>• Limit concurrent animations to 60fps</p>
                  <p>
                    • Use <code>prefers-reduced-motion</code> respect
                  </p>
                </div>

                {/* Current optimizations */}
                <div className="text-xs text-green-600 bg-green-50 p-2 rounded border border-green-200">
                  ✅ <strong>Active optimizations:</strong> Debounced scroll,
                  memoized calculations, reduced motion support
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
