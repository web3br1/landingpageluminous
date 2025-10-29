"use client";

import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { useRef, useEffect, useState, useCallback } from "react";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { SCROLL_CONFIG } from "@/lib/hooks/scroll-config";

interface PinnedChapterProps {
  id: string;
  children: React.ReactNode;
  height: {
    min: number; // vh
    max: number; // vh
  };
  subScenes?: number;
  className?: string;
  onProgress?: (
    progress: number,
    subScene?: number,
    subSceneProgress?: number,
  ) => void;
}

export function PinnedChapter({
  id,
  children,
  height,
  subScenes = 1,
  className = "",
  onProgress,
}: PinnedChapterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isPinned, setIsPinned] = useState(false);
  const [pinOffset, setPinOffset] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  // Calculate dynamic height based on viewport
  const [dynamicHeight, setDynamicHeight] = useState(0);

  const updateHeight = useCallback(() => {
    // SSR safety: only run on client-side
    if (typeof window === "undefined") return;

    const vh = window.innerHeight;
    const minHeight = (height.min * vh) / 100;
    const maxHeight = (height.max * vh) / 100;
    setDynamicHeight(maxHeight);
  }, [height.min, height.max]);

  useEffect(() => {
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, [updateHeight]);

  // Scroll tracking for pinning logic
  const { scrollY } = useScroll();

  const updatePin = useCallback(() => {
    if (!containerRef.current || prefersReducedMotion) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;

    // Calculate if we should pin
    const containerTop = rect.top + scrollTop;
    const containerBottom = containerTop + dynamicHeight;

    // Pin when container reaches top of viewport
    const shouldPin =
      scrollTop >= containerTop - windowHeight * 0.1 &&
      scrollTop < containerBottom - windowHeight;

    setIsPinned(shouldPin);

    if (shouldPin) {
      const progress = Math.min(
        (scrollTop - (containerTop - windowHeight * 0.1)) /
          (dynamicHeight - windowHeight * 0.2),
        1,
      );

      // Calculate sub-scene progress
      const scenesPerChapter = subScenes;
      const sceneProgress = progress * scenesPerChapter;
      const currentSubScene = Math.floor(sceneProgress);
      const subSceneProgress = sceneProgress - currentSubScene;

      setPinOffset(windowHeight * 0.1);

      // Notify progress
      onProgress?.(progress, currentSubScene, subSceneProgress);
    } else {
      setPinOffset(0);
      onProgress?.(0);
    }
  }, [dynamicHeight, subScenes, onProgress, prefersReducedMotion]);

  useEffect(() => {
    let lastScrollTime = 0;

    const handleScroll = () => {
      const now = Date.now();
      if (now - lastScrollTime >= SCROLL_CONFIG.SCROLL_THROTTLE_MS) {
        lastScrollTime = now;
        requestAnimationFrame(updatePin);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    updatePin(); // Initial call

    return () => window.removeEventListener("scroll", handleScroll);
  }, [updatePin]);

  // Disable pinning on mobile for better UX
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  if (isMobile || prefersReducedMotion) {
    return (
      <div
        id={id}
        ref={containerRef}
        className={className}
        style={{
          minHeight: `${height.min}vh`,
          height: "auto",
        }}
      >
        <div ref={contentRef}>{children}</div>
      </div>
    );
  }

  return (
    <div
      id={id}
      ref={containerRef}
      className={`relative ${className}`}
      style={{
        height: `${dynamicHeight}px`,
        minHeight: `${height.min}vh`,
        position: "relative",
      }}
    >
      <AnimatePresence>
        <motion.div
          ref={contentRef}
          className="w-full"
          style={{
            position: isPinned ? "fixed" : "relative",
            top: isPinned ? `${pinOffset}px` : "auto",
            zIndex: isPinned ? 30 : "auto",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.3,
            ease: [0.2, 0.8, 0.2, 1],
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {/* Spacer to maintain document flow */}
      <div
        style={{
          height: isPinned ? `${dynamicHeight - pinOffset}px` : "0px",
          transition: "height 0.3s ease",
        }}
      />
    </div>
  );
}

// Hook for managing pinned chapter state
export function usePinnedChapter(
  chapterId: string,
  height: { min: number; max: number },
  subScenes: number = 1,
) {
  const [progress, setProgress] = useState(0);
  const [currentSubScene, setCurrentSubScene] = useState(0);
  const [subSceneProgress, setSubSceneProgress] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const handleProgress = (
    newProgress: number,
    subScene?: number,
    newSubSceneProgress?: number,
  ) => {
    setProgress(newProgress);
    setIsActive(newProgress > 0);

    if (subScene !== undefined) {
      setCurrentSubScene(subScene);
    }

    if (newSubSceneProgress !== undefined) {
      setSubSceneProgress(newSubSceneProgress);
    }
  };

  return {
    progress,
    currentSubScene,
    subSceneProgress,
    isActive,
    onProgress: handleProgress,
    chapterProps: {
      id: chapterId,
      height,
      subScenes,
      onProgress: handleProgress,
    },
  };
}
