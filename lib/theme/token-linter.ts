// ===== TOKEN GOVERNANCE LINTER =====
// Validates contrast ratios, token ranges, and breaking changes

import { ThemePack, TOKEN_METADATA } from "./theme-registry";

// Color space conversion utilities
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;

  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (300 <= h && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

function oklchToRgb(l: number, c: number, h: number): [number, number, number] {
  // Simplified OKLCH to RGB conversion
  // In production, use a proper color library
  const lightness = l / 100;
  const chroma = c;

  // Approximate conversion (not 100% accurate but good for linting)
  const hue = (h * Math.PI) / 180;
  const a = chroma * Math.cos(hue);
  const b = chroma * Math.sin(hue);

  // Convert to RGB approximation
  const r = Math.max(
    0,
    Math.min(255, (lightness + 0.3963377774 * a + 0.2158037573 * b) * 255),
  );
  const g = Math.max(
    0,
    Math.min(255, (lightness - 0.1055613458 * a - 0.0638541728 * b) * 255),
  );
  const b_val = Math.max(
    0,
    Math.min(255, (lightness - 0.0894841775 * a - 1.291485548 * b) * 255),
  );

  return [r, g, b_val];
}

function parseColorValue(
  colorStr: string,
  space: "hsl" | "oklch",
): [number, number, number] {
  const values = colorStr.split(" ").map((v) => parseFloat(v.replace("%", "")));

  if (space === "hsl") {
    return hslToRgb(values[0], values[1] / 100, values[2] / 100);
  } else {
    return oklchToRgb(values[0], values[1], values[2]);
  }
}

function getContrastRatio(
  rgb1: [number, number, number],
  rgb2: [number, number, number],
): number {
  const lum1 = getRelativeLuminance(rgb1);
  const lum2 = getRelativeLuminance(rgb2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

function getRelativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Contrast validation
export interface ContrastIssue {
  token: string;
  background: string;
  foreground: string;
  actualRatio: number;
  requiredRatio: number;
  status: "pass" | "fail";
}

export function validateTokenContrast(theme: ThemePack): ContrastIssue[] {
  const issues: ContrastIssue[] = [];

  // Validate text on surface combinations - using available theme colors
  const textOnSurface = [
    { fg: "contrast", bg: "base", context: "Primary text on base background" },
    { fg: "contrast", bg: "surface", context: "Text on card surface" },
    { fg: "contrast", bg: "primary", context: "Text on primary" },
    { fg: "contrast", bg: "secondary", context: "Text on secondary" },
  ];

  textOnSurface.forEach(({ fg, bg, context }) => {
    const fgColor = theme.tokens.colors[
      fg as keyof typeof theme.tokens.colors
    ] as string;
    const bgColor = theme.tokens.colors[
      bg as keyof typeof theme.tokens.colors
    ] as string;

    const fgMetadata =
      TOKEN_METADATA[`--${fg}`] || TOKEN_METADATA[`--${fg.split("-")[0]}`];
    const bgMetadata =
      TOKEN_METADATA[`--${bg}`] || TOKEN_METADATA[`--${bg.split("-")[0]}`];

    if (!fgMetadata || !bgMetadata) return;

    try {
      const fgRgb = parseColorValue(fgColor, fgMetadata.space);
      const bgRgb = parseColorValue(bgColor, bgMetadata.space);

      const ratio = getContrastRatio(fgRgb, bgRgb);
      const requiredRatio = fgMetadata.contrastTarget === "AAA" ? 7 : 4.5;

      issues.push({
        token: `--${fg}`,
        background: `--${bg}`,
        foreground: fg,
        actualRatio: Math.round(ratio * 100) / 100,
        requiredRatio,
        status: ratio >= requiredRatio ? "pass" : "fail",
      });
    } catch (error) {
      issues.push({
        token: `--${fg}`,
        background: `--${bg}`,
        foreground: fg,
        actualRatio: 0,
        requiredRatio: 4.5,
        status: "fail",
      });
    }
  });

  return issues;
}

// Breaking change detection
export interface BreakingChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  impact: "low" | "medium" | "high";
  description: string;
}

export function detectBreakingChanges(
  oldTheme: ThemePack,
  newTheme: ThemePack,
): BreakingChange[] {
  const changes: BreakingChange[] = [];

  // Check version bump
  if (oldTheme.version !== newTheme.version) {
    const oldParts = oldTheme.version.split(".").map(Number);
    const newParts = newTheme.version.split(".").map(Number);

    if (newParts[0] > oldParts[0]) {
      changes.push({
        field: "version",
        oldValue: oldTheme.version,
        newValue: newTheme.version,
        impact: "high",
        description: "Major version bump - potential breaking changes",
      });
    }
  }

  // Check for removed tokens
  const oldTokens = Object.keys(oldTheme.tokens.colors);
  const newTokens = Object.keys(newTheme.tokens.colors);

  const removedTokens = oldTokens.filter((token) => !newTokens.includes(token));
  removedTokens.forEach((token) => {
    changes.push({
      field: `tokens.colors.${token}`,
      oldValue:
        oldTheme.tokens.colors[token as keyof typeof oldTheme.tokens.colors],
      newValue: null,
      impact: "high",
      description: `Token ${token} was removed - will break existing usage`,
    });
  });

  // Check for significant color changes (more than 10% difference)
  oldTokens.forEach((token) => {
    if (newTokens.includes(token)) {
      const oldColor = oldTheme.tokens.colors[
        token as keyof typeof oldTheme.tokens.colors
      ] as string;
      const newColor = newTheme.tokens.colors[
        token as keyof typeof newTheme.tokens.colors
      ] as string;

      try {
        const oldRgb = parseColorValue(oldColor, "hsl"); // Assume HSL for simplicity
        const newRgb = parseColorValue(newColor, "hsl");

        const diff = Math.sqrt(
          Math.pow(oldRgb[0] - newRgb[0], 2) +
            Math.pow(oldRgb[1] - newRgb[1], 2) +
            Math.pow(oldRgb[2] - newRgb[2], 2),
        );

        if (diff > 25) {
          // Significant color difference
          changes.push({
            field: `tokens.colors.${token}`,
            oldValue: oldColor,
            newValue: newColor,
            impact: "medium",
            description: `Significant color change (Δ=${Math.round(diff)}) - may affect visual hierarchy`,
          });
        }
      } catch {
        // Skip if parsing fails
      }
    }
  });

  return changes;
}

// Main validation function
export interface ValidationResult {
  themeId: string;
  contrastIssues: ContrastIssue[];
  breakingChanges: BreakingChange[];
  overallStatus: "pass" | "fail";
  recommendations: string[];
}

export function validateTheme(
  theme: ThemePack,
  previousVersion?: ThemePack,
): ValidationResult {
  const contrastIssues = validateTokenContrast(theme);
  const breakingChanges = previousVersion
    ? detectBreakingChanges(previousVersion, theme)
    : [];

  const hasContrastFailures = contrastIssues.some(
    (issue) => issue.status === "fail",
  );
  const hasBreakingChanges = breakingChanges.some(
    (change) => change.impact === "high",
  );

  const recommendations: string[] = [];

  if (hasContrastFailures) {
    recommendations.push("Fix contrast ratios below AA/AAA targets");
  }

  if (hasBreakingChanges) {
    recommendations.push(
      "Review breaking changes and update version accordingly",
    );
  }

  if (breakingChanges.some((change) => change.impact === "medium")) {
    recommendations.push("Test medium-impact changes in staging environment");
  }

  return {
    themeId: theme.id,
    contrastIssues,
    breakingChanges,
    overallStatus: hasContrastFailures || hasBreakingChanges ? "fail" : "pass",
    recommendations,
  };
}

// Export for CLI usage
export function runThemeValidation(
  themeId: string,
  allThemes: Record<string, ThemePack>,
) {
  const theme = allThemes[themeId];
  if (!theme) {
    console.error(`Theme "${themeId}" not found`);
    process.exit(1);
  }

  const result = validateTheme(theme);

  console.log(`\n🎨 Theme Validation: ${theme.name} (${theme.version})`);
  console.log("=".repeat(50));

  // Contrast results
  console.log("\n📊 Contrast Validation:");
  result.contrastIssues.forEach((issue) => {
    const status = issue.status === "pass" ? "✅" : "❌";
    console.log(
      `${status} ${issue.token} on ${issue.background}: ${issue.actualRatio}:1 (req: ${issue.requiredRatio}:1)`,
    );
  });

  // Breaking changes
  if (result.breakingChanges.length > 0) {
    console.log("\n🔄 Breaking Changes:");
    result.breakingChanges.forEach((change) => {
      const impact =
        change.impact === "high"
          ? "🔴"
          : change.impact === "medium"
            ? "🟡"
            : "🟢";
      console.log(`${impact} ${change.field}: ${change.description}`);
    });
  }

  // Recommendations
  if (result.recommendations.length > 0) {
    console.log("\n💡 Recommendations:");
    result.recommendations.forEach((rec) => console.log(`• ${rec}`));
  }

  // Overall status
  const status = result.overallStatus === "pass" ? "✅ PASS" : "❌ FAIL";
  console.log(`\n🏁 Overall Status: ${status}`);

  return result.overallStatus === "pass" ? 0 : 1;
}
