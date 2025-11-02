/**
 * Brand Utilities - Type-safe branded types and validation
 * Extracted from advanced-utils.ts to reduce file size
 */

import type {
  ChapterId,
  HSLString,
  AnimationID,
  TokenName,
} from "../types/design-system";

/** Branded type utilities */
export const Brand = {
  /** Create a branded ChapterID */
  chapterId: (id: string): ChapterId => {
    if (!isChapterId(id)) {
      throw new Error(`Invalid chapter ID: ${id}`);
    }
    return id as ChapterId;
  },

  /** Create a branded AnimationID */
  animationId: (id: string): AnimationID =>
    `${id}_${Date.now()}` as AnimationID,

  /** Create a branded TokenName */
  tokenName: (name: string): TokenName => name as TokenName,
} as const;

/** Type guard for ChapterId */
export function isChapterId(value: unknown): value is ChapterId {
  return (
    typeof value === "string" &&
    [
      "hero",
      "howItWorks",
      "useCases",
      "features",
      "pricing",
      "ctaFinal",
    ].includes(value)
  );
}

/** Type guard for HSL string */
export function isHSLString(value: unknown): value is HSLString {
  if (typeof value !== "string") return false;

  // HSL format: hsl(hue, saturation%, lightness%) or hsla(hue, saturation%, lightness%, alpha)
  const hslRegex = /^hsl\((\d{1,3}),\s*(\d{1,3})%,\s*(\d{1,3})%\)$/;
  const hslaRegex = /^hsla\((\d{1,3}),\s*(\d{1,3})%,\s*(\d{1,3})%,\s*(0|1|0?\.\d+)\)$/;

  return hslRegex.test(value) || hslaRegex.test(value);
}

/** Type guard for AnimationID */
export function isAnimationId(value: unknown): value is AnimationID {
  return typeof value === "string" && value.includes("_") && !isNaN(Number(value.split("_")[1]));
}

/** Type guard for TokenName */
export function isTokenName(value: unknown): value is TokenName {
  return typeof value === "string" && value.startsWith("--");
}
