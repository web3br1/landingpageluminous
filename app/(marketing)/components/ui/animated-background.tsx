"use client";

import { motion, useMotionValue, useTransform, useSpring } from "@/lib/motion";
import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { useAnimations } from "@/lib/hooks/use-animations";

interface AnimatedBackgroundProps {
  className?: string;
  variant?: "hero" | "demo" | "features";
}

export function AnimatedBackground({
  className = "",
  variant = "hero",
}: AnimatedBackgroundProps) {
  // Always call hooks at the top level - never conditionally
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const prefersReducedMotion = useReducedMotion();
  const { animations } = useAnimations();

  // Scroll-based parallax - DISABLED
  // const { scrollYProgress } = useScroll({
  //   target: containerRef,
  //   offset: ["start end", "end start"]
  // })

  // Ensure consistent values between SSR and client
  const y2 = 0; // Disabled parallax
  const y3 = 0; // Disabled parallax

  // Spring animations for smooth mouse following
  const springX = useSpring(
    mouseX,
    prefersReducedMotion
      ? { stiffness: 0, damping: 0 }
      : { stiffness: 100, damping: 25 },
  );
  const springY = useSpring(
    mouseY,
    prefersReducedMotion
      ? { stiffness: 0, damping: 0 }
      : { stiffness: 100, damping: 25 },
  );

  // Transform values for orb animations
  const orb1X = useTransform(
    springX,
    [-200, 200],
    prefersReducedMotion ? [0, 0] : [-8, 8],
  );
  const orb1Y = useTransform(
    springY,
    [-200, 200],
    prefersReducedMotion ? [0, 0] : [-8, 8],
  );
  const orb2X = useTransform(
    springX,
    [-200, 200],
    prefersReducedMotion ? [0, 0] : [6, -6],
  );
  const orb2Y = useTransform(
    springY,
    [-200, 200],
    prefersReducedMotion ? [0, 0] : [6, -6],
  );
  const orb3X = useTransform(
    springX,
    [-200, 200],
    prefersReducedMotion ? [0, 0] : [-4, 4],
  );
  const orb3Y = useTransform(
    springY,
    [-200, 200],
    prefersReducedMotion ? [0, 0] : [-4, 4],
  );
  const particlesX = useTransform(springX, [-200, 200], [-2, 2]);
  const particlesY = useTransform(springY, [-200, 200], [-2, 2]);

  // Mouse tracking for interactive elements (disabled if reduced motion)
  useEffect(() => {
    if (prefersReducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        mouseX.set(e.clientX - rect.left - rect.width / 2);
        mouseY.set(e.clientY - rect.top - rect.height / 2);
      }
    };

    const element = containerRef.current;
    if (element) {
      element.addEventListener("mousemove", handleMouseMove);
      return () => element.removeEventListener("mousemove", handleMouseMove);
    }
  }, [mouseX, mouseY, prefersReducedMotion]);

  // State to track if we're hydrated (client-side)
  const [isHydrated, setIsHydrated] = useState(false);

  // Effect to mark as hydrated after first client render
  useEffect(() => {
    setIsHydrated(true);
  }, []); // Empty dependency array - runs only once

  const orbVariants = {
    hero: {
      initial: { scale: 1, opacity: 0.1 },
      animate: { scale: 1, opacity: 0.1 },
      transition: { duration: 0 },
    },
    demo: {
      initial: { scale: 1, opacity: 0.05 },
      animate: { scale: 1, opacity: 0.05 },
      transition: { duration: 0 },
    },
    features: {
      initial: { scale: 1, opacity: 0.08 },
      animate: { scale: 1, opacity: 0.08 },
      transition: { duration: 0 },
    },
  };

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
    >
      {/* Light Gradient Background */}
      <motion.div
        className="absolute inset-0 opacity-40"
        style={{
          background:
            variant === "hero"
              ? "radial-gradient(ellipse 80% 50% at 50% 50%, rgba(124, 77, 255, 0.08) 0%, rgba(255, 179, 198, 0.06) 50%, transparent 70%)"
              : "radial-gradient(ellipse 60% 40% at 30% 60%, rgba(0, 212, 255, 0.06) 0%, rgba(255, 179, 198, 0.04) 50%, transparent 70%)",
        }}
      />

      {/* Subtle Floating Orbs - static on first render, animated after hydration */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-48 h-48 bg-gradient-to-br from-primary/6 to-accent/4 rounded-full blur-2xl"
        style={
          isHydrated
            ? {
                x: orb1X,
                y: orb1Y,
              }
            : {}
        }
        variants={orbVariants[variant]}
        initial="initial"
        animate={isHydrated ? "animate" : "initial"}
      />

      <motion.div
        className="absolute top-3/4 right-1/4 w-36 h-36 bg-gradient-to-br from-accent/5 to-secondary/4 rounded-full blur-xl"
        style={
          isHydrated
            ? {
                x: orb2X,
                y: orb2Y,
              }
            : {}
        }
        variants={orbVariants[variant]}
        initial="initial"
        animate={isHydrated ? "animate" : "initial"}
        transition={isHydrated && !prefersReducedMotion ? { delay: 1 } : {}}
      />

      <motion.div
        className="absolute top-1/2 left-3/4 w-24 h-24 bg-gradient-to-br from-secondary/4 to-primary/3 rounded-full blur-lg"
        style={
          isHydrated
            ? {
                x: orb3X,
                y: orb3Y,
              }
            : {}
        }
        variants={orbVariants[variant]}
        initial="initial"
        animate={isHydrated ? "animate" : "initial"}
        transition={isHydrated && !prefersReducedMotion ? { delay: 2 } : {}}
      />

      {/* Gentle Flow Lines - DISABLED */}
      {/* Flow lines removed to eliminate scroll-based animations */}

      {/* Subtle Particle System - DISABLED */}
      {/* Particle system removed to eliminate scroll/mouse-based animations */}
    </div>
  );
}
