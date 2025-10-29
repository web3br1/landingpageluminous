// Debug script for contrast calculation
const { validateTokenContrast } = require("./lib/theme/token-linter.ts");
const { THEME_REGISTRY } = require("./lib/theme/theme-registry.ts");

console.log("=== DEBUG CONTRAST CALCULATION ===");

const theme = THEME_REGISTRY["liquid-glass"];
console.log("Theme:", theme.id);

const issues = validateTokenContrast(theme);
console.log("Issues found:", issues.length);

issues.forEach((issue, index) => {
  console.log(
    `${index + 1}. ${issue.token} on ${issue.background}: ${issue.actualRatio}:1 (req: ${issue.requiredRatio}:1) [${issue.status}]`,
  );
});

console.log("\n=== DETAILED COLOR PARSING ===");

// Teste direto da função parseColorValue
const { parseColorValue } = require("./lib/theme/token-linter.ts");

try {
  const fgColor = theme.tokens.colors.contrast;
  const bgColor = theme.tokens.colors.base;

  console.log("Foreground color (contrast):", fgColor);
  console.log("Background color (base):", bgColor);

  const fgRgb = parseColorValue(fgColor, "oklch");
  const bgRgb = parseColorValue(bgColor, "oklch");

  console.log("FG RGB:", fgRgb);
  console.log("BG RGB:", bgRgb);
} catch (error) {
  console.error("Error parsing colors:", error.message);
}
