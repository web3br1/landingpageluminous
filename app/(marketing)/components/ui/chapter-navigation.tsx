"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, List } from "lucide-react";
import { useEffect } from "react";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { type Chapter } from "@/lib/hooks/use-scroll-storytelling";
import { SCROLL_CONFIG } from "@/lib/hooks/scroll-config";
import { useAnimations } from "@/lib/hooks/use-animations";

interface ChapterNavigationProps {
  chapters: Chapter[];
  currentChapterId: string | null;
  onNavigateToChapter: (chapterId: string) => void;
  onNavigateNext: () => void;
  onNavigatePrevious: () => void;
  className?: string;
  variant?: "floating" | "fixed-bottom" | "sidebar" | "header";
}

export function ChapterNavigation({
  chapters,
  currentChapterId,
  onNavigateToChapter,
  onNavigateNext,
  onNavigatePrevious,
  className = "",
  variant = "header",
}: ChapterNavigationProps) {
  const prefersReducedMotion = useReducedMotion();
  const { animations } = useAnimations();

  // Mobile optimization (SSR safe)
  const isMobile = false; // Default for SSR, will be updated on client

  const currentIndex = currentChapterId
    ? chapters.findIndex((ch) => ch.id === currentChapterId)
    : -1;

  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex < chapters.length - 1;

  const currentChapter = chapters[currentIndex];

  // Header navigation bar - always visible
  return (
    <motion.header
      {...animations.fadeIn}
      className={`fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200/50 dark:border-neutral-800/50 ${className}`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Current chapter info */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {currentChapter?.title || "Carregando..."}
              </span>
            </div>

            {/* Progress indicator */}
            <div className="hidden sm:flex items-center space-x-2">
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {currentIndex + 1} / {chapters.length}
              </span>
              <div className="w-16 h-1 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${((currentIndex + 1) / chapters.length) * 100}%`,
                  }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
            </div>
          </div>

          {/* Center - Chapter navigation dots */}
          <div className="hidden md:flex items-center space-x-1">
            {chapters.map((chapter, index) => {
              const isActive = chapter.id === currentChapterId;
              const isPassed = index < currentIndex;

              return (
                <motion.button
                  key={chapter.id}
                  onClick={() => onNavigateToChapter(chapter.id)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    isActive
                      ? "bg-primary"
                      : isPassed
                        ? "bg-primary/50"
                        : "bg-neutral-300 dark:bg-neutral-600 hover:bg-neutral-400 dark:hover:bg-neutral-500"
                  }`}
                  aria-label={`Ir para ${chapter.title}`}
                />
              );
            })}
          </div>

          {/* Right side - Navigation controls */}
          <div className="flex items-center space-x-2">
            {/* Chapter list toggle - only on mobile */}
            {isMobile && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
                aria-label="Ver todos os capítulos"
              >
                <List className="w-4 h-4" />
              </motion.button>
            )}

            {/* Navigation buttons */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onNavigatePrevious}
              disabled={!canGoPrevious}
              className={`p-2 rounded-lg transition-colors ${
                canGoPrevious
                  ? "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  : "text-neutral-400 dark:text-neutral-500 cursor-not-allowed"
              }`}
              aria-label="Capítulo anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onNavigateNext}
              disabled={!canGoNext}
              className={`p-2 rounded-lg transition-colors ${
                canGoNext
                  ? "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  : "text-neutral-400 dark:text-neutral-500 cursor-not-allowed"
              }`}
              aria-label="Próximo capítulo"
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}

// Enhanced keyboard navigation hook with chapter jumping
export function useKeyboardNavigation(
  onNavigateNext: () => void,
  onNavigatePrevious: () => void,
  chapters: Chapter[],
  currentChapterId: string | null,
  onNavigateToChapter: (chapterId: string) => void,
  enabled: boolean = true,
) {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    let lastNavigationTime = 0;

    const handleKeyDown = (event: KeyboardEvent) => {
      const now = Date.now();
      if (
        now - lastNavigationTime <
        SCROLL_CONFIG.KEYBOARD_NAVIGATION_DEBOUNCE_MS
      ) {
        event.preventDefault();
        return;
      }
      // Only handle if no input/textarea is focused (SSR safe)
      if (typeof document !== "undefined") {
        const activeElement = document.activeElement as HTMLElement;
        if (
          activeElement &&
          (activeElement.tagName === "INPUT" ||
            activeElement.tagName === "TEXTAREA" ||
            activeElement.tagName === "SELECT" ||
            activeElement.contentEditable === "true")
        ) {
          return;
        }
      }

      // Check for modifier keys for chapter jumping
      if (event.ctrlKey || event.metaKey) {
        const currentIndex = currentChapterId
          ? chapters.findIndex((ch) => ch.id === currentChapterId)
          : -1;

        switch (event.key) {
          case "ArrowDown":
          case "PageDown":
          case " ":
            event.preventDefault();
            if (currentIndex < chapters.length - 1) {
              lastNavigationTime = now;
              onNavigateToChapter(chapters[currentIndex + 1].id);
            }
            break;
          case "ArrowUp":
          case "PageUp":
            event.preventDefault();
            if (currentIndex > 0) {
              lastNavigationTime = now;
              onNavigateToChapter(chapters[currentIndex - 1].id);
            }
            break;
          case "Home":
            event.preventDefault();
            lastNavigationTime = now;
            onNavigateToChapter(chapters[0].id);
            break;
          case "End":
            event.preventDefault();
            lastNavigationTime = now;
            onNavigateToChapter(chapters[chapters.length - 1].id);
            break;
          default:
            // Check for number keys (1-9) to jump to specific chapters
            const num = parseInt(event.key);
            if (num >= 1 && num <= 9 && num <= chapters.length) {
              event.preventDefault();
              lastNavigationTime = now;
              onNavigateToChapter(chapters[num - 1].id);
            }
            break;
        }
      } else {
        // Standard navigation without modifiers
        switch (event.key) {
          case "ArrowDown":
          case "PageDown":
          case " ":
            event.preventDefault();
            lastNavigationTime = now;
            onNavigateNext();
            break;
          case "ArrowUp":
          case "PageUp":
            event.preventDefault();
            lastNavigationTime = now;
            onNavigatePrevious();
            break;
        }
      }
    };

    // SSR safety: only add listeners on client-side
    if (typeof window === "undefined") return;

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    onNavigateNext,
    onNavigatePrevious,
    chapters,
    currentChapterId,
    onNavigateToChapter,
    enabled,
  ]);

  return {
    prefersReducedMotion,
  };
}
