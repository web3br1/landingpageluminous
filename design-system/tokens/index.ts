// Design System Tokens - Single Source of Truth (SSOT)
// This is the ONLY import path for tokens throughout the application
// All tokens used anywhere must come from here

import {
  colorTokens,
  type ColorTokens,
  type ColorKey,
  type ColorShade,
} from "./colors";
import { typographyTokens, type TypographyTokens } from "./typography";
import { spacingTokens, type SpacingTokens } from "./spacing";
import { animationTokens, type AnimationTokens } from "./animations";

// Re-export individual tokens
export { colorTokens, type ColorTokens, type ColorKey, type ColorShade };
export { typographyTokens, type TypographyTokens };
export { spacingTokens, type SpacingTokens };
export { animationTokens, type AnimationTokens };

// Create flattened spacing tokens for designTokens (only string values)
const flattenedSpacing = {
  ...spacingTokens.space, // xs, sm, md, lg, xl from space object
  ...spacingTokens.section.y, // xs, sm, md, lg, xl from section.y
  ...Object.fromEntries(
    Object.entries(spacingTokens.container).map(([key, value]) => [key, value]),
  ),
};

// Unified designTokens export for backward compatibility and testing
export const designTokens = {
  colors: colorTokens,
  typography: typographyTokens,
  spacing: flattenedSpacing,
  borderRadius: spacingTokens.borderRadius,
  shadows: spacingTokens.shadow,
} as const;

// Type for the unified designTokens
export type DesignTokens = typeof designTokens;
