import { motion } from "@/lib/motion";
import { useAnimations } from "@/lib/hooks/use-animations";

interface FadeUpProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: "fast" | "normal" | "slow";
  trigger?: "mount" | "scroll"; // Add trigger option
}

export function FadeUp({
  children,
  className,
  delay,
  duration = "normal",
  trigger = "mount", // Default to mount instead of scroll
}: FadeUpProps) {
  const { animations, prefersReducedMotion } = useAnimations();

  // Choose animation based on trigger - default to mount
  const animationProps =
    trigger === "mount" ? animations.fadeUp : animations.fadeUp; // Fallback to basic fadeUp

  return (
    <motion.div
      {...animationProps}
      className={className}
      style={
        delay
          ? {
              ...((animationProps?.style as any) || {}),
              transitionDelay: `${delay}s`,
            }
          : animationProps?.style
      }
    >
      {children}
    </motion.div>
  );
}
