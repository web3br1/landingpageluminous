"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import styles from "./path-motion-demo.module.css";

interface PathMotionDemoProps {
  enabled: boolean;
  speed: number;
}

export function PathMotionDemo({ enabled, speed }: PathMotionDemoProps) {
  const pathRef = useRef<SVGPathElement>(null);
  const moverRef = useRef<HTMLDivElement>(null);
  const scrubberRef = useRef<HTMLInputElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const animationRef = useRef<Animation | null>(null);
  const rafRef = useRef<number | null>(null);

  // Path SVG string
  const pathD = "M20,160 C80,40 220,40 280,160";

  // Utility functions
  const updateScrubber = (value: number) => {
    if (scrubberRef.current) {
      scrubberRef.current.value = value.toString();
    }
  };

  const updateScrubberLoop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    const loop = () => {
      if (animationRef.current && scrubberRef.current) {
        const currentTime = animationRef.current.currentTime || 0;
        const duration =
          (animationRef.current.effect as any)?.getTiming?.()?.duration ||
          1;
        const progress = (Number(currentTime) / Number(duration)) * 100;
        updateScrubber(Math.max(0, Math.min(100, progress)));
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    loop();
  }, []);

  const playAnimation = useCallback(() => {
    if (!moverRef.current) return;

    const mover = moverRef.current;

    // Cancel existing animation
    if (animationRef.current) {
      animationRef.current.cancel();
    }

    const duration = 4000 / speed;

    animationRef.current = mover.animate(
      [{ offsetDistance: "0%" }, { offsetDistance: "100%" }],
      {
        duration,
        easing: "ease-in-out",
        fill: "forwards",
      },
    );

    animationRef.current.onfinish = () => {
      setIsPlaying(false);
      updateScrubber(100);
    };

    setIsPlaying(true);
    updateScrubberLoop();
  }, [speed, updateScrubberLoop]);

  // Initialize path motion
  useEffect(() => {
    if (!pathRef.current || !moverRef.current) return;

    const setOffsetPath = () => {
      const path = pathRef.current;
      const mover = moverRef.current;
      if (!path || !mover) return;

      mover.style.offsetPath = `path('${path.getAttribute("d")}')`;
    };

    setOffsetPath();

    // Start initial animation
    playAnimation();
  }, [playAnimation]);

  const handleScrubberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (animationRef.current) {
      const duration =
        (animationRef.current.effect as any)?.getTiming?.()?.duration || 1;
      animationRef.current.currentTime = (value / 100) * duration;
    }
  };

  const handleReplay = () => {
    playAnimation();
  };

  // Update speed when it changes
  useEffect(() => {
    if (animationRef.current && isPlaying) {
      const currentProgress = animationRef.current.currentTime || 0;
      const currentDuration =
        (animationRef.current.effect as any)?.getTiming?.()?.duration || 1;
      const newDuration = 4000 / speed;
      const newTime =
        (Number(currentProgress) / Number(currentDuration)) * newDuration;

      (animationRef.current.effect as any)?.updateTiming?.({
        duration: newDuration,
      });
      animationRef.current.currentTime = newTime;
    }
  }, [speed, isPlaying]);

  return (
    <div className={styles.card}>
      <h3>Path Motion</h3>
      <p className={styles.description}>
        Animação seguindo um caminho SVG personalizado
      </p>

      <div className={styles.pathContainer}>
        <svg
          viewBox="0 0 300 200"
          className={styles.pathSvg}
          role="img"
          aria-label="Caminho de animação"
        >
          <defs>
            <linearGradient id="pathGradient" x1="0" y1="0" x2="1" y2="1">
              <stop
                offset="0%"
                stopColor="hsl(var(--primary))"
                stopOpacity="0.25"
              />
              <stop
                offset="100%"
                stopColor="hsl(var(--primary))"
                stopOpacity="0.05"
              />
            </linearGradient>
          </defs>
          <path
            ref={pathRef}
            d={pathD}
            fill="none"
            stroke="url(#pathGradient)"
            strokeWidth="3"
          />
        </svg>

        <div
          ref={moverRef}
          className={styles.mover}
          aria-label="Elemento em movimento"
        />
      </div>

      <div className={styles.controls}>
        <div className={styles.scrubberGroup}>
          <label className={styles.label}>Scrub</label>
          <input
            ref={scrubberRef}
            type="range"
            min="0"
            max="100"
            defaultValue="0"
            onChange={handleScrubberChange}
            className={styles.scrubber}
            aria-label="Controlar posição da animação"
          />
        </div>

        <button
          onClick={handleReplay}
          className={styles.replayButton}
          aria-label="Repetir animação"
        >
          ▶️ Repetir
        </button>
      </div>
    </div>
  );
}
