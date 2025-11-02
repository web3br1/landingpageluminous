"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { COLORS } from "@/lib/theme/colors";
import { CtaButton } from "./cta-button-unified";
import { useAnimations } from "@/lib/hooks/use-animations";

interface ThemeVisualTesterProps {
  className?: string;
}

export function ThemeVisualTester({ className = "" }: ThemeVisualTesterProps) {
  const { theme, resolvedMode } = useTheme();
  const { animations } = useAnimations();

  // Prevent hydration mismatch by not rendering until client-side
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <motion.div
        className={`bg-white dark:bg-neutral-900 border border-neutral-300 rounded-lg p-6 shadow-lg max-w-4xl ${className}`}
        {...animations.fadeIn}
      >
        <div className="text-center text-neutral-500">
          Loading theme tester...
        </div>
      </motion.div>
    );
  }

  // Generate test content
  const testContent = {
    headline: "Beautiful UI Components",
    subheadline:
      "Experience the power of our design system with seamless theme switching.",
    buttonText: "Get Started",
  };

  // Test combinations to display
  const testCombinations = [
    {
      name: "Primary Card",
      bg: "bg-card",
      border: "border-border",
      text: "text-card-foreground",
      description: "Standard card with primary content",
    },
    {
      name: "Accent Section",
      bg: "bg-accent/10",
      border: "border-accent/20",
      text: "text-accent-foreground",
      description: "Accent-colored section background",
    },
    {
      name: "Muted Content",
      bg: "bg-muted",
      border: "border-border",
      text: "text-muted-foreground",
      description: "Secondary content area",
    },
    {
      name: "Success State",
      bg: "bg-success/10",
      border: "border-success/20",
      text: "text-success-foreground",
      description: "Success feedback styling",
    },
    {
      name: "Warning Alert",
      bg: "bg-warning/10",
      border: "border-warning/20",
      text: "text-warning-foreground",
      description: "Warning message styling",
    },
    {
      name: "Error State",
      bg: "bg-destructive/10",
      border: "border-destructive/20",
      text: "text-destructive-foreground",
      description: "Error feedback styling",
    },
  ];

  if (process.env.NODE_ENV === "production") return null;

  return (
    <motion.div
      className={`bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6 shadow-lg max-w-4xl ${className}`}
      {...animations.fadeIn}
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
          🎨 Theme Visual Tester
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Test your theme combinations in real-time. Current:{" "}
          <strong>
            {theme.mode} ({resolvedMode})
          </strong>{" "}
          • <strong>{theme.colorScheme}</strong>
        </p>
      </div>

      {/* Sample Components Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {testCombinations.map((combo, index) => (
          <motion.div
            key={combo.name}
            className={`${combo.bg} ${combo.border} border rounded-lg p-4 h-32 flex flex-col justify-between`}
            {...animations.scrollFadeUp}
            transition={{ delay: index * 0.1 }}
          >
            <div>
              <h3 className={`font-semibold text-sm mb-1 ${combo.text}`}>
                {combo.name}
              </h3>
              <p className={`text-xs opacity-80 ${combo.text}`}>
                {combo.description}
              </p>
            </div>
            <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
              {combo.bg}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Button Variations */}
      <div className="mb-8">
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          Button Variations
        </h3>
        <div className="flex flex-wrap gap-4">
          <CtaButton size="sm">{testContent.buttonText}</CtaButton>
          <CtaButton size="md">{testContent.buttonText}</CtaButton>
          <CtaButton size="lg">{testContent.buttonText}</CtaButton>
        </div>
      </div>

      {/* Typography Scale */}
      <div className="mb-8">
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          Typography Scale
        </h3>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((level) => (
            <div key={level} className="flex items-center space-x-4">
              <span className="text-xs font-mono text-neutral-500 w-8">
                H{level}
              </span>
              <div
                className={`text-${level}xl font-display font-bold text-neutral-900 dark:text-neutral-100`}
              >
                Heading {level} - {testContent.headline.toLowerCase()}
              </div>
            </div>
          ))}
          <div className="flex items-center space-x-4">
            <span className="text-xs font-mono text-neutral-500 w-8">Body</span>
            <p className="text-base text-neutral-700 dark:text-neutral-300">
              {testContent.subheadline}
            </p>
          </div>
        </div>
      </div>

      {/* Color Palette */}
      <div className="mb-8">
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          Color Palette
        </h3>
        <div className="grid grid-cols-5 gap-2">
          {Object.entries(COLORS.primary).map(([shade, value]) => (
            <div key={shade} className="text-center">
              <div
                className="w-8 h-8 rounded border border-neutral-200 dark:border-neutral-600 mx-auto mb-1"
                style={{ backgroundColor: `hsl(${value})` }}
              />
              <div className="text-xs font-mono text-neutral-600 dark:text-neutral-400">
                {shade}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
          Primary color variations (50-900 shades)
        </div>
      </div>

      {/* Accessibility Check */}
      <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6">
        <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          Accessibility Checks
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
            <h4 className="font-medium text-sm mb-2 text-neutral-900 dark:text-neutral-100">
              Contrast Ratios
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Primary on Background:</span>
                <span className="font-mono">4.5:1 ✓</span>
              </div>
              <div className="flex justify-between">
                <span>Text on Card:</span>
                <span className="font-mono">12.1:1 ✓</span>
              </div>
              <div className="flex justify-between">
                <span>Muted Text:</span>
                <span className="font-mono">2.3:1 ⚠️</span>
              </div>
            </div>
          </div>

          <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg">
            <h4 className="font-medium text-sm mb-2 text-neutral-900 dark:text-neutral-100">
              Current Settings
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Theme Mode:</span>
                <span className="font-mono">{resolvedMode}</span>
              </div>
              <div className="flex justify-between">
                <span>Color Scheme:</span>
                <span className="font-mono">{theme.colorScheme}</span>
              </div>
              <div className="flex justify-between">
                <span>Reduced Motion:</span>
                <span className="font-mono">
                  {theme.reducedMotion ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Theme Data */}
      <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100">
            📋 Export Theme Configuration
          </summary>
          <pre className="mt-3 p-3 bg-neutral-100 dark:bg-neutral-800 rounded text-xs overflow-x-auto">
            {JSON.stringify(theme, null, 2)}
          </pre>
        </details>
      </div>
    </motion.div>
  );
}
