"use client";

import React from "react";
import { THEMES } from "@/lib/theme/theme-utils";
import { animationTokens } from "@/design-system/tokens/animations";
import { ThemeRegistry } from "@/lib/theme/theme-registry";
import { resolveTheme } from "@/lib/theme/personalization-engine";
import styles from "./demo-controls.module.css";

interface DemoControlsProps {
  theme: string;
  onThemeChange: (theme: string) => void;
  animationType: string;
  onAnimationTypeChange: (type: string) => void;
  animationIntensity: string;
  onAnimationIntensityChange: (intensity: string) => void;
  animationSpeed: number;
  onAnimationSpeedChange: (speed: number) => void;
  density: string;
  onDensityChange: (density: string) => void;
  parallaxEnabled: boolean;
  onParallaxToggle: (enabled: boolean) => void;
  gridOverlay: boolean;
  onGridOverlayToggle: (enabled: boolean) => void;
  rtlEnabled: boolean;
  onRtlToggle: (enabled: boolean) => void;
  forceFocus: boolean;
  onForceFocusToggle: (enabled: boolean) => void;
  // New personalization props
  personalizationContext?: {
    tenant?: string;
    campaign?: string;
    abVariant?: "A" | "B";
    country?: string;
    locale?: string;
  };
  onPersonalizationChange?: (context: unknown) => void;
  resolvedTheme?: unknown;
  experimentResults?: unknown;
}

export function DemoControls({
  theme,
  onThemeChange,
  animationType,
  onAnimationTypeChange,
  animationIntensity,
  onAnimationIntensityChange,
  animationSpeed,
  onAnimationSpeedChange,
  density,
  onDensityChange,
  parallaxEnabled,
  onParallaxToggle,
  gridOverlay,
  onGridOverlayToggle,
  rtlEnabled,
  onRtlToggle,
  forceFocus,
  onForceFocusToggle,
  personalizationContext = {},
  onPersonalizationChange,
  resolvedTheme,
  experimentResults,
}: DemoControlsProps) {
  const allThemes = [
    { id: 'light', name: 'Claro' },
    { id: 'dark', name: 'Escuro' }
  ]; // Simple fallback for demo

  const handlePersonalizationChange = (field: string, value: string) => {
    const newContext = { ...personalizationContext, [field]: value };
    onPersonalizationChange?.(newContext);

    // Re-resolve theme when context changes
    if (onPersonalizationChange) {
      const resolved = resolveTheme(newContext);
      onThemeChange(resolved.themeId);
    }
  };
  return (
    <div
      className={styles.demoControls}
      role="region"
      aria-label="Painel de controles da demo"
    >
      {/* Personalization Context */}
      <div className={styles.controlsBar}>
        <div className={styles.controlsGroup}>
          <label className={styles.controlLabel}>
            Tenant:
            <select
              value={personalizationContext.tenant || ""}
              onChange={(e) =>
                handlePersonalizationChange("tenant", e.target.value)
              }
              className={styles.controlSelect}
              aria-label="Selecionar tenant"
            >
              <option value="">Default</option>
              <option value="acme">ACME Corp</option>
              <option value="techcorp">TechCorp</option>
              <option value="startup">StartupXYZ</option>
            </select>
          </label>
        </div>

        <div className={styles.controlsGroup}>
          <label className={styles.controlLabel}>
            Campaign:
            <select
              value={personalizationContext.campaign || ""}
              onChange={(e) =>
                handlePersonalizationChange("campaign", e.target.value)
              }
              className={styles.controlSelect}
              aria-label="Selecionar campanha"
            >
              <option value="">Default</option>
              <option value="black-friday">Black Friday</option>
              <option value="holiday">Holiday</option>
              <option value="launch">Product Launch</option>
              <option value="education">Education</option>
            </select>
          </label>
        </div>

        <div className={styles.controlsGroup}>
          <label className={styles.controlLabel}>
            A/B Variant:
            <select
              value={personalizationContext.abVariant || "A"}
              onChange={(e) =>
                handlePersonalizationChange("abVariant", e.target.value)
              }
              className={styles.controlSelect}
              aria-label="Selecionar variante A/B"
            >
              <option value="A">Variant A</option>
              <option value="B">Variant B</option>
            </select>
          </label>
        </div>

        <div className={styles.controlsGroup}>
          <label className={styles.controlLabel}>
            Country:
            <select
              value={personalizationContext.country || "US"}
              onChange={(e) =>
                handlePersonalizationChange("country", e.target.value)
              }
              className={styles.controlSelect}
              aria-label="Selecionar país"
            >
              <option value="US">🇺🇸 United States</option>
              <option value="BR">🇧🇷 Brazil</option>
              <option value="DE">🇩🇪 Germany</option>
              <option value="AE">🇦🇪 UAE</option>
              <option value="JP">🇯🇵 Japan</option>
            </select>
          </label>
        </div>
      </div>

      {/* Theme and Animation Controls */}
      <div className={styles.controlsBar}>
        <div className={styles.controlsGroup}>
          <label className={styles.controlLabel}>
            Tema:
            <select
              value={theme}
              onChange={(e) => onThemeChange(e.target.value)}
              className={styles.controlSelect}
              aria-label="Selecionar tema visual"
            >
              {allThemes.map((themePack) => (
                <option key={themePack.id} value={themePack.id}>
                  {themePack.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className={styles.controlsGroup}>
          <label className={styles.controlLabel}>
            Tipo de Animação:
            <select
              value={animationType}
              onChange={(e) => onAnimationTypeChange(e.target.value)}
              className={styles.controlSelect}
              aria-label="Selecionar tipo de animação"
            >
              <option value="none">Nenhuma</option>
              <option value="fade-up">Fade Up</option>
              <option value="slide-up">Slide Up</option>
              <option value="pop">Pop In</option>
              <option value="glass">Glass In</option>
              <option value="tilt">Tilt In</option>
            </select>
          </label>
        </div>

        <div className={styles.controlsGroup}>
          <label className={styles.controlLabel}>
            Intensidade:
            <select
              value={animationIntensity}
              onChange={(e) => onAnimationIntensityChange(e.target.value)}
              className={styles.controlSelect}
              aria-label="Selecionar intensidade da animação"
            >
              <option value="off">Off</option>
              <option value="subtle">Sutil</option>
              <option value="normal">Normal</option>
              <option value="strong">Forte</option>
            </select>
          </label>
        </div>

        <div className={styles.controlsGroup}>
          <label className={styles.controlLabel}>
            Velocidade:
            <input
              type="range"
              min="0.25"
              max="2"
              step="0.25"
              value={animationSpeed}
              onChange={(e) =>
                onAnimationSpeedChange(parseFloat(e.target.value))
              }
              className={styles.controlSlider}
              aria-label="Velocidade da animação"
            />
            <span className={styles.controlValue}>{animationSpeed}x</span>
          </label>
        </div>

        <div className={styles.controlsGroup}>
          <label className={styles.controlLabel}>
            Densidade:
            <select
              value={density}
              onChange={(e) => onDensityChange(e.target.value)}
              className={styles.controlSelect}
              aria-label="Selecionar densidade do layout"
            >
              <option value="compact">Compacta</option>
              <option value="standard">Padrão</option>
              <option value="comfort">Conforto</option>
            </select>
          </label>
        </div>
      </div>

      <div className={`${styles.controlsBar} ${styles.secondary}`}>
        <div className={styles.controlsGroup}>
          <label className={styles.controlCheckbox}>
            <input
              type="checkbox"
              checked={parallaxEnabled}
              onChange={(e) => onParallaxToggle(e.target.checked)}
              aria-label="Ativar parallax"
            />
            Parallax
          </label>
        </div>

        <div className={styles.controlsGroup}>
          <label className={styles.controlCheckbox}>
            <input
              type="checkbox"
              checked={gridOverlay}
              onChange={(e) => onGridOverlayToggle(e.target.checked)}
              aria-label="Mostrar overlay de grid"
            />
            Grid
          </label>
        </div>

        <div className={styles.controlsGroup}>
          <label className={styles.controlCheckbox}>
            <input
              type="checkbox"
              checked={rtlEnabled}
              onChange={(e) => onRtlToggle(e.target.checked)}
              aria-label="Ativar layout da direita para esquerda"
            />
            RTL
          </label>
        </div>

        <div className={styles.controlsGroup}>
          <label className={styles.controlCheckbox}>
            <input
              type="checkbox"
              checked={forceFocus}
              onChange={(e) => onForceFocusToggle(e.target.checked)}
              aria-label="Forçar indicadores de foco visuais"
            />
            Focus Rings
          </label>
        </div>
      </div>

      {/* Resolved Theme Info */}
      {resolvedTheme && (
        <div className={`${styles.controlsBar} ${styles.info}`}>
          <div className={styles.themeInfo}>
            <span className={styles.infoLabel}>
              Tema Resolvido:{" "}
              <strong>
                {((resolvedTheme as any)?.themeId || 'unknown')}
              </strong>
            </span>
            <span className={styles.infoLabel}>
              Variante: <strong>{(resolvedTheme as any).variant}</strong>
            </span>
            <span className={styles.infoLabel}>
              Locale: <strong>{(resolvedTheme as any).locale}</strong>
            </span>
            <span className={styles.infoLabel}>
              Moeda: <strong>{(resolvedTheme as any).currency}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Experiment Results */}
      {experimentResults && (experimentResults as any).length > 0 && (
        <div className={`${styles.controlsBar} ${styles.results}`}>
          <div className={styles.experimentResults}>
            <span className={styles.resultsTitle}>Resultados A/B:</span>
            {(experimentResults as any).map((result: unknown, index: number) => (
              <div key={index} className={styles.resultItem}>
                <span className={styles.variantLabel}>
                  Variant {(result as any).variant}:
                </span>
                <span className={styles.metricValue}>
                  {(result as any).winner ? "🏆" : ""} CTR:{" "}
                  {((result as any).metrics.cta_click * 100).toFixed(1)}%
                </span>
                <span className={styles.confidence}>
                  Confiança: {((result as any).confidence * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
