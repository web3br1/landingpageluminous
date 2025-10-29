"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  THEME_REGISTRY,
  getThemePack,
  type ThemePack,
} from "@/lib/theme/theme-registry";

// Theme switcher component
interface ThemeSwitcherProps {
  currentTheme?: string;
  onThemeChange?: (themeId: string) => void;
  showPreview?: boolean;
  compact?: boolean;
}

export function ThemeSwitcher({
  currentTheme = "liquid-glass",
  onThemeChange,
  showPreview = false,
  compact = false,
}: ThemeSwitcherProps) {
  const [selectedTheme, setSelectedTheme] = useState<string>(currentTheme);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [previewTheme, setPreviewTheme] = useState<string | null>(null);

  // Get all available themes
  const themes = Object.values(THEME_REGISTRY);

  // Apply theme to document
  const applyTheme = useCallback((themeId: string) => {
    console.log(`🎨 [ThemeSwitcher] Aplicando tema no DOM: ${themeId}`);
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      const oldTheme = root.getAttribute("data-theme");

      // Remove previous theme data attributes
      root.removeAttribute("data-theme");
      // Apply new theme
      root.setAttribute("data-theme", themeId);

      console.log(`🎨 [ThemeSwitcher] Tema alterado: ${oldTheme} → ${themeId}`);
      console.log(
        `🎨 [ThemeSwitcher] data-theme aplicado em:`,
        root.tagName,
        root,
      );
      console.log(
        `🎨 [ThemeSwitcher] data-theme atual:`,
        root.getAttribute("data-theme"),
      );
      console.log(
        `🎨 [ThemeSwitcher] HTML completo:`,
        root.outerHTML.substring(0, 200),
      );

      // DEBUG DETALHADO para tech-blueprint
      if (themeId === "tech-blueprint") {
        // Verificação básica para garantir que o tema foi aplicado
        setTimeout(() => {
          const currentPrimary =
            getComputedStyle(root).getPropertyValue("--primary");
          if (!currentPrimary.includes("oklch(60% 0.23 200)")) {
            console.warn(
              "⚠️ [ThemeSwitcher] Tema Tech Blueprint pode não ter sido aplicado corretamente",
            );
          }

          if (currentPrimary.includes("oklch(60% 0.23 200)")) {
            console.log(
              "✅ [ThemeSwitcher] Tema Tech Blueprint aplicado com sucesso!",
            );
          } else {
            console.error(
              "❌ [ThemeSwitcher] Tema Tech Blueprint NÃO foi aplicado via CSS!",
            );
            console.log(
              "🔧 [ThemeSwitcher] Forçando aplicação via JavaScript...",
            );

            // FORÇAR aplicação das variáveis CSS diretamente
            root.style.setProperty(
              "--primary",
              "oklch(60% 0.23 200)",
              "important",
            );
            root.style.setProperty(
              "--background",
              "oklch(20% 0.03 220)",
              "important",
            );
            root.style.setProperty(
              "--foreground",
              "oklch(95% 0.03 220)",
              "important",
            );
            root.style.setProperty(
              "--card",
              "oklch(22% 0.04 220)",
              "important",
            );
            root.style.setProperty(
              "--border",
              "oklch(25% 0.08 220)",
              "important",
            );

            console.log(
              "✅ [ThemeSwitcher] Variáveis forçadas via JavaScript!",
            );
          }
        }, 100);
      }
    }
  }, []);

  // Handle theme selection
  const handleThemeSelect = useCallback(
    (themeId: string) => {
      console.log(`🎨 [ThemeSwitcher] Selecionando tema: ${themeId}`);
      setSelectedTheme(themeId);
      applyTheme(themeId);
      onThemeChange?.(themeId);
      setIsOpen(false);

      // Log adicional para tema tech-blueprint
      if (themeId === "tech-blueprint") {
        console.log(
          "🔧 [ThemeSwitcher] Aplicando tema Tech Blueprint com variáveis customizadas",
        );
        console.log("🔧 [ThemeSwitcher] Variáveis esperadas:", {
          background: "oklch(20% 0.03 220)",
          foreground: "oklch(95% 0.03 220)",
          primary: "oklch(60% 0.23 200)",
          secondary: "oklch(55% 0.17 160)",
        });
      }
    },
    [applyTheme, onThemeChange],
  );

  // Handle preview on hover
  const handlePreview = useCallback(
    (themeId: string | null) => {
      if (showPreview && themeId) {
        setPreviewTheme(themeId);
        applyTheme(themeId);
      }
    },
    [showPreview, applyTheme],
  );

  // Reset preview on mouse leave
  const handleResetPreview = useCallback(() => {
    if (showPreview && previewTheme) {
      setPreviewTheme(null);
      applyTheme(selectedTheme);
    }
  }, [showPreview, previewTheme, selectedTheme, applyTheme]);

  // Initialize theme on mount
  useEffect(() => {
    applyTheme(selectedTheme);
  }, [selectedTheme, applyTheme]);

  // Get theme info
  const currentThemeData = getThemePack(selectedTheme);
  const previewThemeData = previewTheme ? getThemePack(previewTheme) : null;

  if (compact) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          aria-label="Alterar tema"
        >
          <div
            className="w-4 h-4 rounded border-2 border-gray-300"
            style={{
              background: currentThemeData?.tokens.colors.primary
                ? `hsl(${currentThemeData.tokens.colors.primary})`
                : "#3b82f6",
            }}
          />
          <span className="hidden sm:inline">
            {currentThemeData?.name || "Tema"}
          </span>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
            {themes.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleThemeSelect(theme.id)}
                onMouseEnter={() => handlePreview(theme.id)}
                onMouseLeave={handleResetPreview}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 ${
                  selectedTheme === theme.id
                    ? "bg-blue-50 dark:bg-blue-900/20"
                    : ""
                }`}
              >
                <div
                  className="w-3 h-3 rounded border border-gray-300"
                  style={{
                    background: `hsl(${theme.tokens.colors.primary})`,
                  }}
                />
                <span>{theme.name}</span>
                {selectedTheme === theme.id && (
                  <svg
                    className="w-4 h-4 ml-auto text-blue-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Seletor de Temas
        </h3>
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded border-2 border-gray-300"
            style={{
              background: currentThemeData?.tokens.colors.primary
                ? `hsl(${currentThemeData.tokens.colors.primary})`
                : "#3b82f6",
            }}
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {currentThemeData?.name || "Tema Atual"}
          </span>
        </div>
      </div>

      {showPreview && previewThemeData && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Preview:</strong> {previewThemeData.name} -{" "}
            {previewThemeData.description}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {themes.map((theme) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => handleThemeSelect(theme.id)}
            onMouseEnter={() => handlePreview(theme.id)}
            onMouseLeave={handleResetPreview}
            className={`relative p-3 rounded-lg border-2 transition-all hover:scale-105 ${
              selectedTheme === theme.id
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
            }`}
            title={`${theme.name}: ${theme.description}`}
          >
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg border-2 border-gray-300 shadow-sm"
                style={{
                  background: `linear-gradient(135deg, hsl(${theme.tokens.colors.primary}), hsl(${theme.tokens.colors.secondary}))`,
                }}
              />
              <div className="text-center">
                <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
                  {theme.name}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {theme.category}
                </div>
              </div>
            </div>

            {selectedTheme === theme.id && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        Passe o mouse sobre os temas para preview (se habilitado)
      </div>
    </div>
  );
}

// Theme preview card component
interface ThemePreviewCardProps {
  theme: ThemePack;
  isSelected?: boolean;
  onSelect?: (themeId: string) => void;
  onPreview?: (themeId: string | null) => void;
}

export function ThemePreviewCard({
  theme,
  isSelected = false,
  onSelect,
  onPreview,
}: ThemePreviewCardProps) {
  const handleClick = () => {
    onSelect?.(theme.id);
  };

  const handleMouseEnter = () => {
    onPreview?.(theme.id);
  };

  const handleMouseLeave = () => {
    onPreview?.(null);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`group relative w-full p-4 rounded-xl border-2 transition-all duration-200 ${
        isSelected
          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg"
          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md"
      }`}
    >
      <div className="flex flex-col items-center gap-3">
        {/* Color swatches */}
        <div className="flex gap-1">
          <div
            className="w-4 h-4 rounded border border-gray-300"
            style={{ background: `hsl(${theme.tokens.colors.primary})` }}
          />
          <div
            className="w-4 h-4 rounded border border-gray-300"
            style={{ background: `hsl(${theme.tokens.colors.secondary})` }}
          />
          <div
            className="w-4 h-4 rounded border border-gray-300"
            style={{ background: `hsl(${theme.tokens.colors.accent})` }}
          />
        </div>

        {/* Theme info */}
        <div className="text-center">
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
            {theme.name}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {theme.description}
          </p>
          <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full capitalize">
            {theme.category}
          </span>
        </div>
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
          <svg
            className="w-4 h-4 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
    </button>
  );
}
