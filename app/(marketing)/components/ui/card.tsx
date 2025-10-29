import * as React from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/lib/theme/theme-context";

import { cn } from "@/lib/utils";

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    glassmorphism?: "none" | "subtle" | "medium" | "strong";
    animate?: boolean;
  }
>(({ className, glassmorphism = "none", animate = true, ...props }, ref) => {
  const { theme } = useTheme();
  const isDark = theme.mode === "dark";

  const getGlassmorphismStyles = (
    intensity: "subtle" | "medium" | "strong",
  ) => {
    const baseStyles = {
      backdropFilter:
        intensity === "subtle"
          ? "blur(12px)"
          : intensity === "medium"
            ? "blur(16px)"
            : "blur(20px)",
      WebkitBackdropFilter:
        intensity === "subtle"
          ? "blur(12px)"
          : intensity === "medium"
            ? "blur(16px)"
            : "blur(20px)",
      border:
        intensity === "subtle"
          ? "1px solid rgba(255, 255, 255, 0.2)"
          : intensity === "medium"
            ? "1px solid rgba(255, 255, 255, 0.3)"
            : "1px solid rgba(255, 255, 255, 0.4)",
      boxShadow:
        intensity === "subtle"
          ? "0 8px 32px rgba(17, 24, 39, 0.1)"
          : intensity === "medium"
            ? "0 12px 40px rgba(17, 24, 39, 0.12)"
            : "0 16px 48px rgba(17, 24, 39, 0.15)",
    };

    if (isDark) {
      return {
        ...baseStyles,
        background:
          intensity === "subtle"
            ? "rgba(17, 24, 39, 0.4)"
            : intensity === "medium"
              ? "rgba(17, 24, 39, 0.6)"
              : "rgba(17, 24, 39, 0.8)",
        color: "#ffffff",
      };
    } else {
      return {
        ...baseStyles,
        background:
          intensity === "subtle"
            ? "rgba(255, 255, 255, 0.7)"
            : intensity === "medium"
              ? "rgba(255, 255, 255, 0.8)"
              : "rgba(255, 255, 255, 0.9)",
        color: "#000000",
      };
    }
  };

  const cardElement = (
    <div
      ref={ref}
      className={cn("rounded-xl border shadow", className)}
      style={
        glassmorphism !== "none"
          ? getGlassmorphismStyles(glassmorphism)
          : undefined
      }
      {...props}
    />
  );

  if (animate) {
    return (
      <motion.div
        whileHover={{ y: -4, boxShadow: "0 10px 30px rgba(17, 24, 39, 0.08)" }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {cardElement}
      </motion.div>
    );
  }

  return cardElement;
});
Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
