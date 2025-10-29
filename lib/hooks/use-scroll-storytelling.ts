"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useScroll } from "framer-motion";
import { analytics } from "@/lib/analytics-core";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import {
  SCROLL_CONFIG,
  DEFAULT_CHAPTERS,
  SCROLL_FEATURES,
  ANALYTICS_EVENTS,
  DEBUG_CONFIG,
  type TransitionType,
} from "./scroll-config";

// Chapter definition interface
export interface Chapter {
  id: string;
  title: string;
  anchor: string;
  type: "hero" | "pinned" | "scroll" | "cta";
  height: {
    min: number; // minimum height in vh
    max: number; // maximum height in vh
  };
  subScenes?: number; // number of sub-scenes for pinned chapters
  zIndex?: number;
}

// Chapter progress interface
export interface ChapterProgress {
  chapterId: string;
  progress: number; // 0-1 within chapter
  globalProgress: number; // 0-1 across entire page
  isActive: boolean;
  subScene?: number; // current sub-scene (0-based)
  subSceneProgress?: number; // 0-1 within sub-scene
}

// Transition state interface
export interface ChapterTransition {
  from: string | null;
  to: string | null;
  progress: number; // 0-1 transition progress
  type: "crossfade" | "wipe" | "none";
  direction: "up" | "down" | null;
}

// Scroll storytelling configuration
interface ScrollStorytellingConfig {
  chapters?: Chapter[];
  transitionDuration?: number;
  enableAnalytics?: boolean;
  enablePinning?: boolean;
}

export function useScrollStorytelling(
  config: Partial<ScrollStorytellingConfig> = {},
) {
  const {
    chapters = DEFAULT_CHAPTERS,
    transitionDuration = SCROLL_CONFIG.TRANSITION_DURATION_MS,
    enableAnalytics = SCROLL_FEATURES.ENABLE_ANALYTICS,
    enablePinning = SCROLL_FEATURES.ENABLE_PINNING,
  } = config;

  // Refs and state
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentChapter, setCurrentChapter] = useState<ChapterProgress | null>(
    null,
  );
  const [transition, setTransition] = useState<ChapterTransition>({
    from: null,
    to: null,
    progress: 0,
    type: "none",
    direction: null,
  });
  const [isPinned, setIsPinned] = useState(false);
  const [chapterHistory, setChapterHistory] = useState<string[]>([]);
  const [lastChapterChangeTime, setLastChapterChangeTime] = useState(0);
  const previousChapterRef = useRef<ChapterProgress | null>(null);

  // Scroll tracking - use layoutEffect: false to prevent hydration issues
  const { scrollY, scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Reduced motion preference
  const prefersReducedMotion = useReducedMotion();

  // Calculate total scrollable height
  const [totalHeight, setTotalHeight] = useState(0);

  useEffect(() => {
    // SSR safety: only run on client-side
    if (typeof window === "undefined") return;

    const updateTotalHeight = () => {
      if (containerRef.current) {
        const height = containerRef.current.scrollHeight;
        setTotalHeight(height);
      }
    };

    updateTotalHeight();
    window.addEventListener("resize", updateTotalHeight);
    return () => window.removeEventListener("resize", updateTotalHeight);
  }, []);

  // Memoize chapter heights calculation to avoid recreating on every render
  const chapterHeights = useMemo(() => {
    // Use a default height for SSR to avoid window access
    const defaultViewportHeight = 1000; // fallback for SSR
    const viewportHeight =
      typeof window !== "undefined"
        ? window.innerHeight
        : defaultViewportHeight;
    return chapters.map(
      (chapter) => (chapter.height.max * viewportHeight) / 100,
    );
  }, [chapters]); // Note: intentionally not including window.innerHeight to avoid re-calculation

  // Calculate actual section heights from DOM elements when available
  const [actualSectionHeights, setActualSectionHeights] = useState<number[]>(
    [],
  );

  useEffect(() => {
    // SSR safety: only run on client-side
    if (typeof window === "undefined" || typeof document === "undefined")
      return;

    const updateActualHeights = () => {
      if (!containerRef.current) return;

      const newActualHeights: number[] = [];

      for (const chapter of chapters) {
        const sectionElement = document.querySelector(
          chapter.anchor,
        ) as HTMLElement;
        if (sectionElement) {
          const height = sectionElement.offsetHeight;
          newActualHeights.push(height);
        } else {
          // Fallback to calculated height
          const viewportHeight = window.innerHeight;
          newActualHeights.push((chapter.height.max * viewportHeight) / 100);
        }
      }

      setActualSectionHeights(newActualHeights);
    };

    // Initial calculation
    updateActualHeights();

    // Recalculate on resize
    window.addEventListener("resize", updateActualHeights);
    return () => window.removeEventListener("resize", updateActualHeights);
  }, [chapters]);

  // Use actual heights if available, otherwise use calculated heights
  const effectiveHeights =
    actualSectionHeights.length === chapters.length
      ? actualSectionHeights
      : chapterHeights;

  // Memoize cumulative chapter positions
  const chapterPositions = useMemo(() => {
    const positions = [0];
    for (let i = 1; i < chapters.length; i++) {
      positions[i] = positions[i - 1] + effectiveHeights[i - 1];
    }
    return positions;
  }, [chapters, effectiveHeights]);

  // Calculate chapter progress - optimized with memoized calculations
  const calculateChapterProgress = useCallback(() => {
    // SSR safety: only run on client-side
    if (typeof window === "undefined" || !containerRef.current) return null;

    // Use the scroll position relative to the container
    const containerRect = containerRef.current.getBoundingClientRect();
    const scrollTop = -containerRect.top; // This gives us the scroll position relative to container
    const windowHeight = window.innerHeight;
    const documentHeight = totalHeight;

    // Find current chapter based on scroll position using memoized positions
    let activeChapterIndex = -1;
    for (let i = 0; i < chapters.length; i++) {
      const chapterStart = chapterPositions[i];
      const chapterEnd = chapterStart + chapterHeights[i];

      if (scrollTop >= chapterStart && scrollTop < chapterEnd) {
        activeChapterIndex = i;
        break;
      }
    }

    if (activeChapterIndex === -1) return null;

    const activeChapter = chapters[activeChapterIndex];
    const chapterStartPosition = chapterPositions[activeChapterIndex];
    const chapterHeight = chapterHeights[activeChapterIndex];

    // Calculate progress within chapter
    const chapterProgress = Math.min(
      (scrollTop - chapterStartPosition) / chapterHeight,
      1,
    );

    // Calculate global progress
    const globalProgress = scrollTop / (documentHeight - windowHeight);

    // Calculate sub-scene progress for pinned chapters
    let subScene: number | undefined;
    let subSceneProgress: number | undefined;

    if (activeChapter.subScenes && activeChapter.subScenes > 1) {
      const scenesPerChapter = activeChapter.subScenes;
      const sceneProgress = chapterProgress * scenesPerChapter;
      subScene = Math.floor(sceneProgress);
      subSceneProgress = sceneProgress - subScene;

      // Ensure bounds
      if (subScene >= scenesPerChapter) {
        subScene = scenesPerChapter - 1;
        subSceneProgress = 1;
      }
    }

    return {
      chapterId: activeChapter.id,
      progress: chapterProgress,
      globalProgress,
      isActive: true,
      subScene,
      subSceneProgress,
    };
  }, [chapters, totalHeight, chapterPositions, chapterHeights]);

  // Update current chapter and handle transitions
  useEffect(() => {
    const updateChapter = () => {
      const newProgress = calculateChapterProgress();

      if (!newProgress) return;

      // Check if chapter changed with minimum time gap to prevent excessive navigation
      const now = Date.now();

      if (
        previousChapterRef.current?.chapterId !== newProgress.chapterId &&
        now - lastChapterChangeTime >= SCROLL_CONFIG.CHAPTER_CHANGE_DEBOUNCE_MS
      ) {
        const oldChapter = previousChapterRef.current?.chapterId;
        const newChapter = newProgress.chapterId;

        // Handle transition
        const oldChapterIndex = chapters.findIndex(
          (ch) => ch.id === oldChapter,
        );
        const newChapterIndex = chapters.findIndex(
          (ch) => ch.id === newChapter,
        );
        const direction: "up" | "down" =
          newChapterIndex > oldChapterIndex ? "down" : "up";

        // Determine transition type
        let transitionType: "crossfade" | "wipe" | "none" = "crossfade";
        if (chapters[newChapterIndex]?.type === "pinned") {
          transitionType = "wipe";
        }

        setTransition({
          from: oldChapter || null,
          to: newChapter,
          progress: 0,
          type: transitionType,
          direction,
        });

        // Animate transition progress
        if (!prefersReducedMotion) {
          const startTime = Date.now();
          const animateTransition = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / transitionDuration, 1);

            setTransition((prev) => ({ ...prev, progress }));

            if (progress < 1) {
              requestAnimationFrame(animateTransition);
            } else {
              setTransition((prev) => ({ ...prev, from: null, progress: 0 }));
            }
          };

          requestAnimationFrame(animateTransition);
        }

        // Update chapter history and timestamp
        setChapterHistory((prev) => {
          const newHistory = [...prev];
          if (newChapter && !newHistory.includes(newChapter)) {
            newHistory.push(newChapter);
          }
          return newHistory.slice(-10); // Keep last 10 chapters
        });
        setLastChapterChangeTime(now);

        // Analytics
        if (enableAnalytics) {
          analytics.track("chapter_enter", {
            chapter_id: newChapter,
            previous_chapter: oldChapter,
            direction,
            timestamp: Date.now(),
          });
        }
      }

      // Update sub-scene analytics
      if (
        enableAnalytics &&
        newProgress.subScene !== undefined &&
        newProgress.subScene !== previousChapterRef.current?.subScene
      ) {
        analytics.track("step_change", {
          chapter: newProgress.chapterId,
          step: newProgress.subScene + 1,
          step_progress: newProgress.subSceneProgress || 0,
        });
      }

      // Update the ref and state
      previousChapterRef.current = newProgress;
      setCurrentChapter(newProgress);

      // Handle pinning
      const chapter = chapters.find((ch) => ch.id === newProgress.chapterId);
      if (enablePinning && chapter?.type === "pinned") {
        setIsPinned(true);
      } else {
        setIsPinned(false);
      }
    };

    // Improved throttling with debounce to prevent browser hanging
    let ticking = false;
    let lastScrollTime = 0;

    const handleScroll = () => {
      const now = Date.now();
      if (now - lastScrollTime < SCROLL_CONFIG.SCROLL_THROTTLE_MS) return;
      lastScrollTime = now;

      if (!ticking) {
        requestAnimationFrame(() => {
          updateChapter();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    updateChapter(); // Initial call

    return () => window.removeEventListener("scroll", handleScroll);
  }, [
    calculateChapterProgress,
    transitionDuration,
    prefersReducedMotion,
    enableAnalytics,
    enablePinning,
  ]); // Removed chapters and lastChapterChangeTime as they cause unnecessary re-executions

  // Memoize navigation calculations to avoid recreating functions
  const navigateToChapter = useCallback(
    (chapterId: string) => {
      // SSR safety: only run on client-side
      if (typeof window === "undefined") return;

      const chapterIndex = chapters.findIndex((ch) => ch.id === chapterId);
      if (chapterIndex === -1) return;

      const chapterStartPosition = chapterPositions[chapterIndex] || 0;

      window.scrollTo({
        top: chapterStartPosition,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });

      if (enableAnalytics) {
        analytics.track("chapter_navigate", {
          target_chapter: chapterId,
          method: "button",
        });
      }
    },
    [chapters, chapterPositions, prefersReducedMotion, enableAnalytics],
  );

  const navigateToNextChapter = useCallback(() => {
    if (!currentChapter) return;
    const currentIndex = chapters.findIndex(
      (ch) => ch.id === currentChapter.chapterId,
    );
    if (currentIndex < chapters.length - 1) {
      navigateToChapter(chapters[currentIndex + 1].id);
    }
  }, [currentChapter, chapters, navigateToChapter]);

  const navigateToPreviousChapter = useCallback(() => {
    if (!currentChapter) return;
    const currentIndex = chapters.findIndex(
      (ch) => ch.id === currentChapter.chapterId,
    );
    if (currentIndex > 0) {
      navigateToChapter(chapters[currentIndex - 1].id);
    }
  }, [currentChapter, chapters, navigateToChapter]);

  // Update URL hash when chapter changes (SSR safe)
  useEffect(() => {
    // SSR safety: only run on client-side
    if (
      typeof window === "undefined" ||
      !currentChapter ||
      currentChapter.progress <= 0.5
    )
      return;

    const chapter = chapters.find((ch) => ch.id === currentChapter.chapterId);
    if (chapter) {
      window.history.replaceState(null, "", chapter.anchor);
    }
  }, [currentChapter, chapters]);

  return {
    // State
    currentChapter,
    transition,
    isPinned,
    chapterHistory,
    chapters,

    // Refs
    containerRef,

    // Navigation
    navigateToChapter,
    navigateToNextChapter,
    navigateToPreviousChapter,

    // Scroll values
    scrollY,
    scrollYProgress,

    // Configuration
    prefersReducedMotion,
    enablePinning,
    transitionDuration,

    // Debug info
    debug: {
      effectiveHeights,
      chapterPositions,
      totalHeight,
      actualSectionHeights,
      chapterHeights,
    },
  };
}
