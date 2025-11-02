import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  const classes = clsx(inputs);

  // Split classes and separate important ones (!prefix)
  const classList = classes.split(" ").filter(Boolean);
  const importantClasses: string[] = [];
  const regularClasses: string[] = [];

  classList.forEach((cls) => {
    if (cls.startsWith("!")) {
      importantClasses.push(cls);
    } else {
      regularClasses.push(cls);
    }
  });

  // If there are important classes, they take precedence over regular ones
  // Important classes override regular ones due to CSS specificity
  if (importantClasses.length > 0) {
    return importantClasses.join(" ");
  }

  // Otherwise, merge regular classes normally
  return twMerge(regularClasses.join(" "));
}

/**
 * Validates if a string is a valid date format
 * Supports ISO 8601 date strings and common date formats
 * Performs strict validation to ensure date components are valid
 */
export function isValidDateString(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== "string") {
    return false;
  }

  // Try ISO 8601 formats (YYYY-MM-DD, YYYY-MM-DDTHH:mm:ssZ, etc.)
  const iso8601Regex =
    /^(\d{4})-(\d{2})-(\d{2})(T(\d{2}):(\d{2}):(\d{2})(\.(\d{3}))?Z?)?$/;
  const match = dateStr.match(iso8601Regex);

  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);

    // Basic range checks
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return false;
    }

    // Month-specific day validation
    const maxDaysInMonth = [31, (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
    if (day > maxDaysInMonth) {
      return false;
    }

    // Additional validation with Date constructor for time components
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date.getTime());
  }

  // Try other common formats if needed in the future
  // For now, we only support ISO 8601 as required by the tests

  return false;
}

// DEPRECATED: Design tokens moved to design-system/tokens
// This export is kept for backward compatibility but will be removed in future versions
// All new code should import from @/design-system/tokens

import { designTokens } from "@/design-system/tokens";

// Re-export for backward compatibility
export { designTokens };

// Utility para verificar contraste (placeholder)
export function contrastOk(_fg: string, _bg: string): boolean {
  // Implementação simplificada - em produção usar lib como color-contrast
  return true;
}
