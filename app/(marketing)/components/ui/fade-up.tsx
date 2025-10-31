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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
