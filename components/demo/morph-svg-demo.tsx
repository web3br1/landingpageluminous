"use client";

import React, { useRef, useCallback } from "react";
import styles from "./morph-svg-demo.module.css";

export function MorphSvgDemo() {
  const pathRef = useRef<SVGPathElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const morphShapes = {
    circle:
      "M50 5 C70 5 95 30 95 50 C95 70 70 95 50 95 C30 95 5 70 5 50 C5 30 30 5 50 5Z",
    star: "M50 5 L61 35 L95 35 L69 57 L78 91 L50 71 L22 91 L31 57 L5 35 L39 35 Z",
    triangle: "M50 5 L90 85 L10 85 Z",
    diamond: "M50 5 L85 50 L50 95 L15 50 Z",
    hexagon: "M50 5 L85 25 L85 75 L50 95 L15 75 L15 25 Z",
  };

  const handleMorph = useCallback(() => {
    if (!pathRef.current) return;

    const shapes = Object.values(morphShapes);
    const currentD = pathRef.current.getAttribute("d") || shapes[0];
    const currentIndex = shapes.indexOf(currentD);
    const nextIndex = (currentIndex + 1) % shapes.length;
    const nextShape = shapes[nextIndex];

    // Animate the morph
    const animation = pathRef.current.animate(
      [{ d: currentD }, { d: nextShape }],
      {
        duration: 600,
        easing: "ease-in-out",
        fill: "forwards",
      },
    );

    // Update the actual attribute after animation completes
    animation.addEventListener(
      "finish",
      () => {
        pathRef.current?.setAttribute("d", nextShape);
      },
      { once: true },
    );
  }, []);

  return (
    <div className={styles.card}>
      <h3>Morph SVG</h3>
      <p className={styles.description}>Transições suaves entre formas SVG</p>

      <div className={styles.svgContainer}>
        <svg
          ref={svgRef}
          viewBox="0 0 100 100"
          className={styles.morphSvg}
          role="img"
          aria-label="SVG que muda de forma"
        >
          <path
            ref={pathRef}
            d={morphShapes.circle}
            fill="hsl(var(--primary))"
            opacity="0.8"
          />
        </svg>
      </div>

      <div className={styles.controls}>
        <button
          onClick={handleMorph}
          className={styles.morphButton}
          aria-label="Alterar forma do SVG"
        >
          🔄 Morph
        </button>
      </div>
    </div>
  );
}
