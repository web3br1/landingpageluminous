"use client";

// ===== LUMINARIS DEBUG RIG =====
// Sistema de depuração visual para animações com HUD interativo
// Permite visualizar, controlar e depurar animações em tempo real

import * as React from "react";
import { AnimationLayer } from "./layers-model";
import { director } from "./director-api";
import { PerformanceMonitor } from "../utils/performance-monitor";

// ===== DEBUG STATE =====

interface DebugState {
  isVisible: boolean;
  selectedLayer: AnimationLayer | null;
  selectedAnimation: string | null;
  showPerformance: boolean;
  showLayers: boolean;
  showScroll: boolean;
  showTimelines: boolean;
  autoRefresh: boolean;
  refreshInterval: number;
}

interface DebugMetrics {
  fps: number;
  memoryUsage: number;
  activeAnimations: number;
  scrollVelocity: number;
  layerBreakdown: Record<AnimationLayer, number>;
  preemptionEvents: number;
  timelineInstances: number;
}

// ===== DEBUG RIG COMPONENT =====

export function LuminarisDebugRig() {
  const [debugState, setDebugState] = React.useState<DebugState>({
    isVisible: false,
    selectedLayer: null,
    selectedAnimation: null,
    showPerformance: true,
    showLayers: true,
    showScroll: false,
    showTimelines: false,
    autoRefresh: true,
    refreshInterval: 1000,
  });

  const [metrics, setMetrics] = React.useState<DebugMetrics>({
    fps: 60,
    memoryUsage: 0,
    activeAnimations: 0,
    scrollVelocity: 0,
    layerBreakdown: {
      [AnimationLayer.BG]: 0,
      [AnimationLayer.MID]: 0,
      [AnimationLayer.FG]: 0,
      [AnimationLayer.FX]: 0,
    },
    preemptionEvents: 0,
    timelineInstances: 0,
  });

  const [isDragging, setIsDragging] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 20, y: 20 });

  // Update metrics periodically
  React.useEffect(() => {
    if (!debugState.isVisible || !debugState.autoRefresh) return;

    const updateMetrics = () => {
      const perfMonitor = PerformanceMonitor.getInstance();
      const directorStatus = director.getStatus();

      setMetrics({
        fps: perfMonitor.getRuntimeContext().performance.fps,
        memoryUsage: perfMonitor.getMemoryUsage(),
        activeAnimations: Object.values(directorStatus.layerStates).reduce(
          (sum, state) => sum + state.activeAnimations.size,
          0,
        ),
        scrollVelocity:
          perfMonitor.getRuntimeContext().performance.connectionSpeed === "fast"
            ? 0
            : 1,
        layerBreakdown: Object.fromEntries(
          Object.entries(directorStatus.layerStates).map(([layer, state]) => [
            layer,
            state.activeAnimations.size,
          ]),
        ) as Record<AnimationLayer, number>,
        preemptionEvents: 0, // Would need to track this in director
        timelineInstances: directorStatus.activeTimelines.length,
      });
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, debugState.refreshInterval);

    return () => clearInterval(interval);
  }, [
    debugState.isVisible,
    debugState.autoRefresh,
    debugState.refreshInterval,
  ]);

  // Keyboard shortcuts
  React.useEffect(() => {
    // SSR safety: only run on client-side
    if (typeof window === "undefined") return;

    const handleKeyPress = (event: KeyboardEvent) => {
      // Toggle debug with Ctrl+Shift+D
      if (event.ctrlKey && event.shiftKey && event.key === "D") {
        event.preventDefault();
        setDebugState((prev) => ({ ...prev, isVisible: !prev.isVisible }));
      }

      // Emergency stop with Ctrl+Shift+E
      if (event.ctrlKey && event.shiftKey && event.key === "E") {
        event.preventDefault();
        director.reset();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  // Drag handling
  const handleMouseDown = (event: React.MouseEvent) => {
    // SSR safety: only run on client-side
    if (typeof document === "undefined") return;

    setIsDragging(true);
    const startX = event.clientX - position.x;
    const startY = event.clientY - position.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      setPosition({
        x: moveEvent.clientX - startX,
        y: moveEvent.clientY - startY,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  if (!debugState.isVisible) {
    return (
      <button
        onClick={() => setDebugState((prev) => ({ ...prev, isVisible: true }))}
        className="fixed top-4 right-4 z-9999 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
        title="Open Luminaris Debug Rig (Ctrl+Shift+D)"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>
    );
  }

  return (
    <div
      className="fixed z-9999 bg-black/90 text-white rounded-lg shadow-2xl border border-purple-500/30 backdrop-blur-sm font-mono text-xs"
      style={{
        left: position.x,
        top: position.y,
        width: 400,
        maxHeight: "80vh",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-3 bg-purple-600/20 border-b border-purple-500/30 cursor-move select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
          <span className="font-bold text-purple-300">LUMINARIS DIRECTOR</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() =>
              setDebugState((prev) => ({ ...prev, isVisible: false }))
            }
            className="p-1 hover:bg-white/10 rounded"
            title="Close (Ctrl+Shift+D)"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="p-3 border-b border-gray-600/30">
        <div className="flex flex-wrap gap-1 mb-2">
          <button
            onClick={() => director.reset()}
            className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
            title="Emergency Stop (Ctrl+Shift+E)"
          >
            🛑 STOP
          </button>
          <button
            onClick={() =>
              setDebugState((prev) => ({
                ...prev,
                showPerformance: !prev.showPerformance,
              }))
            }
            className={`px-2 py-1 rounded text-xs ${debugState.showPerformance ? "bg-blue-600" : "bg-gray-600"}`}
          >
            📊
          </button>
          <button
            onClick={() =>
              setDebugState((prev) => ({
                ...prev,
                showLayers: !prev.showLayers,
              }))
            }
            className={`px-2 py-1 rounded text-xs ${debugState.showLayers ? "bg-blue-600" : "bg-gray-600"}`}
          >
            🎭
          </button>
          <button
            onClick={() =>
              setDebugState((prev) => ({
                ...prev,
                showScroll: !prev.showScroll,
              }))
            }
            className={`px-2 py-1 rounded text-xs ${debugState.showScroll ? "bg-blue-600" : "bg-gray-600"}`}
          >
            📜
          </button>
          <button
            onClick={() =>
              setDebugState((prev) => ({
                ...prev,
                showTimelines: !prev.showTimelines,
              }))
            }
            className={`px-2 py-1 rounded text-xs ${debugState.showTimelines ? "bg-blue-600" : "bg-gray-600"}`}
          >
            ⏱️
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={debugState.autoRefresh}
              onChange={(e) =>
                setDebugState((prev) => ({
                  ...prev,
                  autoRefresh: e.target.checked,
                }))
              }
              className="w-3 h-3"
            />
            Auto
          </label>
          <select
            value={debugState.refreshInterval}
            onChange={(e) =>
              setDebugState((prev) => ({
                ...prev,
                refreshInterval: Number(e.target.value),
              }))
            }
            className="bg-gray-700 text-white rounded px-2 py-1 text-xs"
          >
            <option value={100}>100ms</option>
            <option value={500}>500ms</option>
            <option value={1000}>1s</option>
            <option value={2000}>2s</option>
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {/* Performance Metrics */}
        {debugState.showPerformance && (
          <div className="p-3 border-b border-gray-600/30">
            <h3 className="font-bold text-green-400 mb-2">📊 PERFORMANCE</h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                FPS:{" "}
                <span
                  className={
                    metrics.fps < 30 ? "text-red-400" : "text-green-400"
                  }
                >
                  {metrics.fps}
                </span>
              </div>
              <div>
                Memory:{" "}
                <span
                  className={
                    metrics.memoryUsage > 50 * 1024 * 1024
                      ? "text-red-400"
                      : "text-green-400"
                  }
                >
                  {(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB
                </span>
              </div>
              <div>
                Active:{" "}
                <span
                  className={
                    metrics.activeAnimations > 3
                      ? "text-yellow-400"
                      : "text-green-400"
                  }
                >
                  {metrics.activeAnimations}/3
                </span>
              </div>
              <div>
                Scroll:{" "}
                <span className="text-blue-400">
                  {metrics.scrollVelocity.toFixed(1)}px/ms
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Layer Status */}
        {debugState.showLayers && (
          <div className="p-3 border-b border-gray-600/30">
            <h3 className="font-bold text-purple-400 mb-2">🎭 LAYERS</h3>
            <div className="space-y-1">
              {Object.entries(metrics.layerBreakdown).map(([layer, count]) => (
                <div key={layer} className="flex items-center justify-between">
                  <span className="uppercase text-xs">{layer}:</span>
                  <div className="flex items-center gap-1">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        count > 0 ? "bg-green-400" : "bg-gray-600"
                      }`}
                    ></div>
                    <span
                      className={
                        count > 1 ? "text-yellow-400" : "text-gray-300"
                      }
                    >
                      {count}
                    </span>
                    <button
                      onClick={() => {
                        if (layer === AnimationLayer.BG)
                          director.lock(AnimationLayer.BG);
                        else if (layer === AnimationLayer.MID)
                          director.lock(AnimationLayer.MID);
                        else if (layer === AnimationLayer.FG)
                          director.lock(AnimationLayer.FG);
                        else if (layer === AnimationLayer.FX)
                          director.lock(AnimationLayer.FX);
                      }}
                      className="px-1 py-0 bg-red-600 hover:bg-red-700 rounded text-xs"
                      title={`Lock ${layer} layer`}
                    >
                      🔒
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scroll Sync */}
        {debugState.showScroll && (
          <div className="p-3 border-b border-gray-600/30">
            <h3 className="font-bold text-blue-400 mb-2">📜 SCROLL SYNC</h3>
            <div className="text-xs space-y-1">
              <div>Velocity: {metrics.scrollVelocity.toFixed(2)} px/ms</div>
              <div>
                Direction:{" "}
                <span className="text-yellow-400">
                  {metrics.scrollVelocity > 0
                    ? "↓"
                    : metrics.scrollVelocity < 0
                      ? "↑"
                      : "→"}
                </span>
              </div>
              <div>
                Hysteresis: <span className="text-green-400">Active</span>
              </div>
            </div>
          </div>
        )}

        {/* Timeline Status */}
        {debugState.showTimelines && (
          <div className="p-3">
            <h3 className="font-bold text-orange-400 mb-2">⏱️ TIMELINES</h3>
            <div className="text-xs space-y-1">
              <div>Active: {metrics.timelineInstances}</div>
              <div>Preemptions: {metrics.preemptionEvents}</div>
              <div className="flex gap-1 mt-2">
                <button
                  onClick={() => director.cue("hero.enter")}
                  className="px-2 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs"
                >
                  Hero
                </button>
                <button
                  onClick={() => director.cue("how.stepB")}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                >
                  How
                </button>
                <button
                  onClick={() => director.cue("pricing.highlight")}
                  className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs"
                >
                  Pricing
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 bg-gray-800/50 border-t border-gray-600/30 text-xs text-gray-400 text-center">
        Luminaris Director v1.0 • Ctrl+Shift+D to toggle
      </div>
    </div>
  );
}

// ===== DEBUG OVERLAY =====
// Visual overlay for debugging animations in the page

interface DebugOverlayProps {
  showGrid?: boolean;
  showScrollMarkers?: boolean;
  showAnimationBounds?: boolean;
}

export function DebugOverlay({
  showGrid = false,
  showScrollMarkers = false,
  showAnimationBounds = false,
}: DebugOverlayProps) {
  const [scrollY, setScrollY] = React.useState(0);

  React.useEffect(() => {
    // SSR safety: only run on client-side
    if (typeof window === "undefined") return;

    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-9998">
      {/* Grid overlay */}
      {showGrid && (
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
              linear-gradient(to right, #ff0000 1px, transparent 1px),
              linear-gradient(to bottom, #00ff00 1px, transparent 1px)
            `,
              backgroundSize: "50px 50px",
            }}
          ></div>
        </div>
      )}

      {/* Scroll markers */}
      {showScrollMarkers && (
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/80 text-white p-2 rounded text-xs font-mono">
          <div>ScrollY: {scrollY}px</div>
          <div>
            Viewport: {typeof window !== "undefined" ? window.innerHeight : 0}px
          </div>
          <div>
            Progress:{" "}
            {typeof window !== "undefined" && typeof document !== "undefined"
              ? (
                  (scrollY /
                    (document.body.scrollHeight - window.innerHeight)) *
                  100
                ).toFixed(1)
              : 0}
            %
          </div>
        </div>
      )}

      {/* Animation bounds */}
      {showAnimationBounds && (
        <div className="absolute inset-0">
          {/* Chapter markers would be added here */}
          <div
            className="absolute left-0 top-0 w-1 bg-red-500"
            style={{ height: "100vh" }}
          ></div>
        </div>
      )}
    </div>
  );
}

// ===== UTILITY HOOKS =====

/** Hook for debug logging */
export function useDebugLog(componentName: string) {
  const log = React.useCallback(
    (message: string, data?: any) => {
      if (process.env.NODE_ENV === "development") {
        console.log(`[Debug:${componentName}] ${message}`, data);
      }
    },
    [componentName],
  );

  const warn = React.useCallback(
    (message: string, data?: any) => {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[Debug:${componentName}] ${message}`, data);
      }
    },
    [componentName],
  );

  const error = React.useCallback(
    (message: string, data?: any) => {
      console.error(`[Debug:${componentName}] ${message}`, data);
    },
    [componentName],
  );

  return { log, warn, error };
}

/** Hook for performance timing */
export function usePerformanceTimer(label: string) {
  const startTime = React.useRef<number | undefined>(undefined);

  const start = React.useCallback(() => {
    startTime.current = performance.now();
  }, []);

  const end = React.useCallback(() => {
    if (startTime.current) {
      const duration = performance.now() - startTime.current;
      console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
      startTime.current = undefined;
    }
  }, [label]);

  return { start, end };
}

// ===== EXPORT ALL =====
export type { DebugState, DebugMetrics };
