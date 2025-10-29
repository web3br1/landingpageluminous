"use client";

import { motion } from "framer-motion";
import { Section } from "./section";
import { cn } from "@/lib/utils";

interface SectionWrapperProps {
  id?: string;
  children: React.ReactNode;
  className?: string;
  containerSize?: "sm" | "md" | "lg" | "xl" | "full";
  padding?: "sm" | "md" | "lg" | "xl";
  background?: "default" | "muted" | "gradient" | "none";
  animate?: boolean;
  delay?: number;
}

export function SectionWrapper({
  id,
  children,
  className,
  containerSize = "xl",
  padding = "md",
  background = "default",
  animate = true,
  delay = 0,
}: SectionWrapperProps) {
  const backgroundClasses = {
    default: "",
    muted: "bg-neutral-50/50 dark:bg-neutral-900/50",
    gradient:
      "bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-800",
    none: "",
  };

  // Em testes, usar section normal para evitar warnings do React
  if (process.env.NODE_ENV === "test") {
    return (
      <section id={id} className={cn(backgroundClasses[background], className)}>
        <Section containerSize={containerSize} padding={padding}>
          {children}
        </Section>
      </section>
    );
  }

  const MotionSection = animate ? motion.section : "section";

  const sectionProps = animate
    ? {
        initial: { opacity: 0, y: 20 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-100px" },
        transition: { duration: 0.6, delay },
      }
    : {};

  return (
    <MotionSection
      id={id}
      className={cn(backgroundClasses[background], className)}
      {...sectionProps}
    >
      <Section containerSize={containerSize} padding={padding}>
        {children}
      </Section>
    </MotionSection>
  );
}

// Componente para cabeçalhos de seção padronizados
interface SectionHeaderProps {
  title?: string;
  subtitle?: string;
  alignment?: "left" | "center";
  size?: "sm" | "md" | "lg";
  className?: string;
  headingId?: string;
}

export function SectionHeader({
  title,
  subtitle,
  alignment = "center",
  size = "md",
  className,
  headingId,
}: SectionHeaderProps) {
  const alignmentClasses = {
    left: "text-left",
    center: "text-center",
  };

  const sizeClasses = {
    sm: {
      title: "text-2xl md:text-3xl font-bold",
      subtitle: "text-base md:text-lg",
    },
    md: {
      title: "text-3xl md:text-4xl lg:text-5xl font-bold",
      subtitle: "text-lg md:text-xl",
    },
    lg: {
      title: "text-4xl md:text-5xl lg:text-6xl font-bold",
      subtitle: "text-xl md:text-2xl",
    },
  };

  // Em testes, usar elementos normais para evitar warnings do React
  if (process.env.NODE_ENV === "test") {
    return (
      <div
        className={cn("mb-12 md:mb-16", alignmentClasses[alignment], className)}
      >
        {title && (
          <h2
            id={headingId}
            className={cn(
              "font-display text-neutral-900 dark:text-neutral-100 mb-4 md:mb-6",
              sizeClasses[size].title,
            )}
          >
            {title}
          </h2>
        )}
        {subtitle && (
          <p
            className={cn(
              "text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-3xl mx-auto",
              sizeClasses[size].subtitle,
              alignment === "left" && "mx-0",
            )}
          >
            {subtitle}
          </p>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn("mb-12 md:mb-16", alignmentClasses[alignment], className)}
    >
      {title && (
        <motion.h2
          id={headingId}
          className={cn(
            "font-display text-neutral-900 dark:text-neutral-100 mb-4 md:mb-6",
            sizeClasses[size].title,
          )}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {title}
        </motion.h2>
      )}
      {subtitle && (
        <motion.p
          className={cn(
            "text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-3xl mx-auto",
            sizeClasses[size].subtitle,
            alignment === "left" && "mx-0",
          )}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}
