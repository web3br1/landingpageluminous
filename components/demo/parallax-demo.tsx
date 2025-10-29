"use client";

import React, { useEffect, useRef } from "react";
import styles from "./parallax-demo.module.css";

interface ParallaxDemoProps {
  enabled: boolean;
}

export function ParallaxDemo({ enabled }: ParallaxDemoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const parallaxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLHeadingElement>(null);
  const paragraphRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!enabled) return;

    let rafId: number;

    const handleScroll = () => {
      if (!parallaxRef.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const parallaxY = scrollY * 0.06;

      parallaxRef.current.style.transform = `translateY(${parallaxY}px)`;

      // Update clip-path for reveal effect
      if (textRef.current && paragraphRef.current) {
        const containerTop = rect.top;
        const windowHeight = window.innerHeight;
        const progress = Math.max(
          0,
          Math.min(1, (windowHeight - containerTop) / windowHeight),
        );

        const textClip = 100 - progress * 100;
        const paraClip = 100 - (progress - 0.2) * 100;

        textRef.current.style.clipPath = `inset(0 0 ${textClip}% 0)`;
        paragraphRef.current.style.clipPath = `inset(0 0 ${Math.max(0, paraClip)}% 0)`;
      }
    };

    const loop = () => {
      handleScroll();
      rafId = requestAnimationFrame(loop);
    };

    // Use passive scroll listener for better performance
    window.addEventListener("scroll", handleScroll, { passive: true });

    // Start the animation loop
    loop();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [enabled]);

  return (
    <div ref={containerRef} className={styles.card}>
      <h3>Parallax & Scroll Reveal</h3>
      <p className={styles.description}>
        Efeitos parallax no background e reveal por scroll
      </p>

      <div className={styles.contentWrapper}>
        <div
          ref={parallaxRef}
          className={styles.parallaxBg}
          aria-hidden="true"
        />

        <div className={styles.content}>
          <h4 ref={textRef} className={styles.revealText}>
            Texto revelado por scroll
          </h4>
          <p ref={paragraphRef} className={styles.revealPara}>
            Este texto aparece gradualmente conforme você rola a página. O
            background se move em parallax criando profundidade visual.
          </p>
        </div>
      </div>

      <div className={styles.status}>
        <span className={styles.statusIndicator}>
          {enabled ? "🟢 Ativo" : "🔴 Inativo"}
        </span>
        <span className={styles.statusText}>
          {enabled
            ? "Role para ver os efeitos"
            : "Ative o parallax nos controles"}
        </span>
      </div>
    </div>
  );
}
