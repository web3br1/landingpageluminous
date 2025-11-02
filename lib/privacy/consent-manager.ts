// Consent Manager - Centralizado para LGPD compliance
// Gerencia consentimento de cookies e analytics de forma consistente

import type { ConsentState } from "@/components/cookie-banner";

// Re-export for compatibility
export type { ConsentState } from "@/components/cookie-banner";

// Storage key for consent data
const CONSENT_STORAGE_KEY = "dataflow-consent";

// Default consent state - only non-essential cookies (analytics, marketing, functional)
const DEFAULT_CONSENT: Omit<ConsentState, 'essential'> = {
  analytics: false,
  marketing: false,
  functional: false,
};

// Cache for consent state to avoid repeated localStorage access
let consentCache: ConsentState | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export class ConsentManager {
  // Cookie categories definition
  static readonly CATEGORIES = {
    analytics: {
      id: 'analytics',
      name: 'Analytics',
      description: 'Help us understand how you use our website',
      required: false,
      details: [
        'Track page views and user interactions',
        'Measure website performance',
        'Analyze user behavior patterns'
      ]
    },
    marketing: {
      id: 'marketing',
      name: 'Marketing',
      description: 'Used to deliver personalized advertisements',
      required: false,
      details: [
        'Show relevant advertisements',
        'Track ad campaign effectiveness',
        'Personalize content recommendations'
      ]
    },
    functional: {
      id: 'functional',
      name: 'Functional',
      description: 'Essential for website functionality',
      required: false,
      details: [
        'Remember user preferences',
        'Enable interactive features',
        'Provide better user experience'
      ]
    },
    essential: {
      id: 'essential',
      name: 'Essential',
      description: 'Required for basic website operation',
      required: true,
      details: [
        'Website security and authentication',
        'Basic navigation and functionality',
        'Error reporting and debugging'
      ]
    }
  };
  /**
   * Get current consent state with caching
   */
  static getConsent(): Omit<ConsentState, 'essential'> {
    // Return cached value if still valid
    if (consentCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
      const { essential, ...nonEssential } = consentCache;
      return { ...nonEssential };
    }

    try {
      // Try to load from localStorage
      const stored = this.getStoredConsent();
      if (stored) {
        consentCache = stored;
        cacheTimestamp = Date.now();
        const { essential, ...nonEssential } = stored;
        return { ...nonEssential };
      }
    } catch (error) {
      console.warn("Failed to load consent from storage:", error);
    }

    // Return defaults (without essential)
    const fullDefault: ConsentState = { essential: true, ...DEFAULT_CONSENT };
    consentCache = fullDefault;
    cacheTimestamp = Date.now();
    return { ...DEFAULT_CONSENT };
  }

  /**
   * Set consent state and persist to storage
   */
  static setConsent(consentData: Omit<ConsentState, 'essential'>, source: string = "unknown"): void {
    try {
      // Add essential and validate
      const fullConsent: ConsentState = { essential: true, ...consentData };
      const validatedConsent = this.validateConsentData(fullConsent);

      // Persist to localStorage
      this.setStoredConsent(validatedConsent);

      // Update cache
      consentCache = { ...validatedConsent };
      cacheTimestamp = Date.now();

      console.log(`Consent updated from ${source}:`, consentData);
    } catch (error) {
      console.error("Failed to save consent:", error);
      throw new Error("Unable to save consent preferences");
    }
  }

  /**
   * Clear stored consent (reset to defaults)
   */
  static clearConsent(): void {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(CONSENT_STORAGE_KEY);
      }
      consentCache = null;
      cacheTimestamp = 0;
    } catch (error) {
      console.warn("Failed to clear consent:", error);
    }
  }

  /**
   * Check if user has consented to analytics
   */
  static hasAnalyticsConsent(): boolean {
    return this.getConsent().analytics;
  }

  /**
   * Check if user has consented to marketing
   */
  static hasMarketingConsent(): boolean {
    return this.getConsent().marketing;
  }

  /**
   * Check if user has consented to functional cookies
   */
  static hasFunctionalConsent(): boolean {
    return this.getConsent().functional;
  }

  /**
   * Check if user has consented to essential cookies (always true)
   */
  static hasEssentialConsent(): boolean {
    return true; // Essential cookies are always allowed
  }

  /**
   * Check if user has consented to any non-essential cookies
   */
  static hasAnyNonEssentialConsent(): boolean {
    const consent = this.getConsent();
    return consent.analytics || consent.marketing || consent.functional;
  }

  /**
   * Get last update timestamp (for checking if consent was ever set)
   */
  static getLastUpdateTimestamp(): number | null {
    try {
      if (typeof window === "undefined" || !window.localStorage) {
        return null;
      }

      const stored = window.localStorage.getItem(`${CONSENT_STORAGE_KEY}_timestamp`);
      return stored ? parseInt(stored, 10) : null;
    } catch (error) {
      console.warn("Failed to get consent timestamp:", error);
      return null;
    }
  }

  /**
   * Check if consent has been explicitly set by user (not just defaults)
   */
  static hasUserSetConsent(): boolean {
    return this.getLastUpdateTimestamp() !== null;
  }

  // Private methods

  private static getStoredConsent(): ConsentState | null {
    if (typeof window === "undefined" || !window.localStorage) {
      return null;
    }

    try {
      const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
      if (!stored) return null;

      const parsed = JSON.parse(stored);

      // Validate structure
      if (typeof parsed === "object" && parsed !== null) {
        return this.validateConsentData(parsed);
      }

      return null;
    } catch (error) {
      console.warn("Invalid consent data in storage:", error);
      return null;
    }
  }

  private static setStoredConsent(consent: ConsentState): void {
    if (typeof window === "undefined" || !window.localStorage) {
      // Silently fail in test environments or when localStorage is not available
      console.warn("localStorage not available, consent not persisted");
      return;
    }

    try {
      window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
      // Save timestamp for tracking when consent was last updated
      window.localStorage.setItem(`${CONSENT_STORAGE_KEY}_timestamp`, Date.now().toString());
    } catch (error) {
      // Silently fail in test environments
      console.warn("Failed to save to localStorage:", error);
    }
  }

  private static validateConsentData(data: any): ConsentState {
    if (typeof data !== "object" || data === null) {
      throw new Error("Invalid consent data structure");
    }

    // Ensure all required properties exist and are booleans
    const validated: ConsentState = {
      essential: true, // Always true
      analytics: Boolean(data.analytics ?? false),
      marketing: Boolean(data.marketing ?? false),
      functional: Boolean(data.functional ?? false),
    };

    return validated;
  }
}

// Export singleton instance methods for convenience
export const consentManager = {
  getConsent: ConsentManager.getConsent.bind(ConsentManager),
  setConsent: ConsentManager.setConsent.bind(ConsentManager),
  clearConsent: ConsentManager.clearConsent.bind(ConsentManager),
  hasAnalyticsConsent: ConsentManager.hasAnalyticsConsent.bind(ConsentManager),
  hasMarketingConsent: ConsentManager.hasMarketingConsent.bind(ConsentManager),
  hasFunctionalConsent: ConsentManager.hasFunctionalConsent.bind(ConsentManager),
  hasEssentialConsent: ConsentManager.hasEssentialConsent.bind(ConsentManager),
  hasAnyNonEssentialConsent: ConsentManager.hasAnyNonEssentialConsent.bind(ConsentManager),
  getLastUpdateTimestamp: ConsentManager.getLastUpdateTimestamp.bind(ConsentManager),
  hasUserSetConsent: ConsentManager.hasUserSetConsent.bind(ConsentManager),
};

// Export type for external use
export type ConsentData = Omit<ConsentState, 'essential'>;