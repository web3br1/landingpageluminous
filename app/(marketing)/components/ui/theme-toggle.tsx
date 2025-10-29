"use client";

import { motion } from "framer-motion";
import { Sun, Moon, Monitor, Palette, Eye, EyeOff } from "lucide-react";
import { useTheme } from "@/lib/theme/theme-context";
import { useAnimations } from "@/lib/hooks/use-animations";

interface ThemeToggleProps {
  className?: string;
  variant?: "button" | "minimal" | "full";
}

export function ThemeToggle({
  className = "",
  variant = "button",
}: ThemeToggleProps) {
  const { theme, toggleMode, toggleColorScheme, resolvedMode } = useTheme();
  const { animations } = useAnimations();

  if (variant === "minimal") {
    return (
      <motion.button
        onClick={toggleMode}
        className={`p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors ${className}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={`Switch to ${theme.mode === "light" ? "dark" : theme.mode === "dark" ? "system" : "light"} mode`}
      >
        <motion.div
          key={theme.mode}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {theme.mode === "light" && <Sun className="w-4 h-4" />}
          {theme.mode === "dark" && <Moon className="w-4 h-4" />}
          {theme.mode === "system" && <Monitor className="w-4 h-4" />}
        </motion.div>
      </motion.button>
    );
  }

  if (variant === "full") {
    return (
      <motion.div
        className={`bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-4 shadow-lg ${className}`}
        {...animations.fadeIn}
      >
        <h3 className="font-semibold text-sm mb-4 text-neutral-900 dark:text-neutral-100">
          Theme Settings
        </h3>

        {/* Mode Selection */}
        <div className="space-y-3 mb-6">
          <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
            Mode
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { key: "light", label: "Light", icon: Sun },
              { key: "system", label: "System", icon: Monitor },
              { key: "dark", label: "Dark", icon: Moon },
            ].map(({ key, label, icon: Icon }) => (
              <motion.button
                key={key}
                onClick={() => theme.mode !== key && toggleMode()}
                className={`p-3 rounded-lg border-2 transition-all ${
                  theme.mode === key
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-neutral-200 dark:border-neutral-600 hover:border-neutral-300 dark:hover:border-neutral-500"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Icon className="w-4 h-4 mx-auto mb-1" />
                <span className="text-xs font-medium">{label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Color Scheme Selection */}
        <div className="space-y-3 mb-6">
          <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
            Color Scheme
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              {
                key: "default",
                label: "Default",
                colors: ["bg-primary", "bg-secondary", "bg-accent"],
              },
              {
                key: "high-contrast",
                label: "High Contrast",
                colors: ["bg-black", "bg-neutral-900", "bg-neutral-700"],
              },
              {
                key: "colorblind",
                label: "Colorblind",
                colors: ["bg-blue-600", "bg-orange-500", "bg-green-600"],
              },
            ].map(({ key, label, colors }) => (
              <motion.button
                key={key}
                onClick={() => theme.colorScheme !== key && toggleColorScheme()}
                className={`p-3 rounded-lg border-2 transition-all ${
                  theme.colorScheme === key
                    ? "border-primary bg-primary/10"
                    : "border-neutral-200 dark:border-neutral-600 hover:border-neutral-300 dark:hover:border-neutral-500"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex space-x-1 mb-2">
                  {colors.map((color, i) => (
                    <div key={i} className={`w-3 h-3 rounded-full ${color}`} />
                  ))}
                </div>
                <span className="text-xs font-medium">{label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Accessibility Settings */}
        <div className="space-y-3">
          <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wide">
            Accessibility
          </label>
          <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
            <div className="flex items-center space-x-2">
              {theme.reducedMotion ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">Reduced Motion</span>
            </div>
            <div
              className={`w-10 h-6 rounded-full p-1 transition-colors ${
                theme.reducedMotion
                  ? "bg-primary"
                  : "bg-neutral-300 dark:bg-neutral-600"
              }`}
            >
              <motion.div
                className="w-4 h-4 bg-white rounded-full shadow-sm"
                animate={{ x: theme.reducedMotion ? 16 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </div>
          </div>
        </div>

        {/* Current Theme Info */}
        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-600">
          <div className="text-xs text-neutral-500 dark:text-neutral-400 space-y-1">
            <div>
              Active:{" "}
              <strong>
                {theme.mode} ({resolvedMode})
              </strong>
            </div>
            <div>
              Scheme: <strong>{theme.colorScheme}</strong>
            </div>
            <div>
              Motion:{" "}
              <strong>{theme.reducedMotion ? "Reduced" : "Normal"}</strong>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Default button variant
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Mode Toggle */}
      <motion.button
        onClick={toggleMode}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        aria-label={`Switch to ${theme.mode === "light" ? "dark" : theme.mode === "dark" ? "system" : "light"} mode`}
      >
        <motion.div
          key={theme.mode}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {theme.mode === "light" && <Sun className="w-4 h-4" />}
          {theme.mode === "dark" && <Moon className="w-4 h-4" />}
          {theme.mode === "system" && <Monitor className="w-4 h-4" />}
        </motion.div>
        <span className="text-sm font-medium capitalize hidden sm:inline">
          {theme.mode}
        </span>
      </motion.button>

      {/* Color Scheme Toggle */}
      <motion.button
        onClick={toggleColorScheme}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        aria-label={`Switch to ${theme.colorScheme === "default" ? "high-contrast" : theme.colorScheme === "high-contrast" ? "colorblind" : "default"} color scheme`}
      >
        <Palette className="w-4 h-4" />
        <span className="text-sm font-medium capitalize hidden sm:inline">
          {theme.colorScheme.replace("-", " ")}
        </span>
      </motion.button>
    </div>
  );
}
