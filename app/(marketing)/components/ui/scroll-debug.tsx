"use client";

import { useEffect, useState } from "react";
import { DEBUG_CONFIG } from "@/lib/hooks/scroll-config";

interface ScrollDebugProps {
  debug: {
    effectiveHeights: number[];
    chapterPositions: number[];
    totalHeight: number;
    actualSectionHeights: number[];
    chapterHeights: number[];
  };
}

export function ScrollStorytellingDebug({ debug }: ScrollDebugProps) {
  // Suppress hydration warnings for debug component
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!DEBUG_CONFIG.ENABLE_SCROLL_DEBUG) return null;

  if (!isMounted) {
    return (
      <div className="fixed top-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-sm">
        <h3 className="font-bold mb-2">Scroll Debug</h3>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-sm">
      <h3 className="font-bold mb-2">Scroll Debug</h3>
      <div>Total Height: {debug.totalHeight}px</div>
      <div>Chapters: {debug.effectiveHeights.length}</div>
      <div className="mt-2">
        <strong>Positions:</strong>
        {debug.chapterPositions.map((pos: number, i: number) => (
          <div key={i} className="ml-2">
            Ch{i}: {Math.round(pos)}px
          </div>
        ))}
      </div>
      <div className="mt-2">
        <strong>Heights:</strong>
        {debug.effectiveHeights.map((height: number, i: number) => (
          <div key={i} className="ml-2">
            Ch{i}: {Math.round(height)}px
          </div>
        ))}
      </div>
    </div>
  );
}
