"use client";

import { motion } from "framer-motion";
import { useAnimations } from "@/lib/hooks/use-animations";
import { getViewportProps } from "@/lib/theme/animations";
import { cn } from "@/lib/utils";

interface AnimatedSectionProps {
  children: React.ReactNode;
  animation?: "fadeUp" | "scrollFadeUp" | "scrollScaleIn" | "stagger" | "none";
  className?: string;
  once?: boolean;
  margin?: string;
  delay?: number;
}

export function AnimatedSection({
  children,
  animation = "fadeUp",
  className,
  once = true,
  margin = "-100px",
  delay = 0,
}: AnimatedSectionProps) {
  const { animations } = useAnimations();

  if (animation === "none") {
    return <div className={className}>{children}</div>;
  }

  // Get animation based on type
  let animationPreset;
  switch (animation) {
    case "fadeUp":
      animationPreset = animations.fadeUp;
      break;
    case "scrollFadeUp":
      animationPreset = animations.scrollFadeUp;
      break;
    case "scrollScaleIn":
      animationPreset = animations.scrollScaleIn;
      break;
    case "stagger":
      animationPreset = animations.staggerContainer;
      break;
    default:
      animationPreset = animations.fadeUp;
  }

  // Get viewport props with custom options
  const viewportProps = getViewportProps(animationPreset, { once, margin });

  // Apply delay if specified
  const transitionProps =
    delay > 0
      ? {
          transition: { delay },
        }
      : {};

  return (
    <motion.div
      className={cn(className)}
      {...viewportProps}
      {...transitionProps}
    >
      {children}
    </motion.div>
  );
}

// Specialized animated wrapper for cards
export function AnimatedCard({
  children,
  className,
  hover = true,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  const { animations } = useAnimations();

  return (
    <motion.div
      className={className}
      {...animations.fadeUp}
      {...(hover ? animations.cardHover : {})}
    >
      {children}
    </motion.div>
  );
}

// Specialized animated wrapper for buttons
export function AnimatedButton({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) {
  const { animations } = useAnimations();

  return (
    <motion.div
      className={className}
      {...animations.buttonHover}
      {...animations.buttonTap}
      {...props}
    >
      {children}
    </motion.div>
  );
}
