"use client";

import { logger } from "../../observability/logger";

/**
 * Privacy Gateway - Phase 1 Foundation
 * Ensures progressive loading respects user consent and privacy preferences
 */

export interface PrivacyContext {
  cookieConsent?: {
    analytics: boolean;
    necessary: boolean;
    marketing?: boolean;
    preferences?: boolean;
  };
  doNotTrack?: boolean;
  globalPrivacyControl?: boolean;
}

export interface LoadingCapability {
  canUseAdvancedLoading: boolean;
  canCollectNetworkInfo: boolean;
  canCollectDeviceInfo: boolean;
  canUseBehavioralData: boolean;
  restrictions: string[];
  reason: string;
}

/**
 * Privacy Gateway Class
 * Centralizes all privacy-related decisions for progressive loading
 */
export class PrivacyGateway {
  /**
   * Assess what loading capabilities are allowed based on privacy context
   */
  static assessCapabilities(context: PrivacyContext): LoadingCapability {
    const restrictions: string[] = [];
    let canUseAdvancedLoading = true;
    let canCollectNetworkInfo = true;
    let canCollectDeviceInfo = true;
    let canUseBehavioralData = false;

    // Check Global Privacy Control (GPC)
    if (context.globalPrivacyControl) {
      canUseAdvancedLoading = false;
      canCollectNetworkInfo = false;
      canCollectDeviceInfo = false;
      restrictions.push("Global Privacy Control enabled");
    }

    // Check Do Not Track
    if (context.doNotTrack) {
      canUseAdvancedLoading = false;
      restrictions.push("Do Not Track enabled");
    }

    // Check cookie consent
    if (!context.cookieConsent) {
      canUseAdvancedLoading = false;
      canCollectNetworkInfo = false;
      restrictions.push("No cookie consent provided");
    } else {
      // Necessary cookies are always allowed (required for functionality)
      if (!context.cookieConsent.necessary) {
        restrictions.push("Necessary cookies not accepted");
      }

      // Analytics consent required for advanced loading
      if (!context.cookieConsent.analytics) {
        canUseAdvancedLoading = false;
        canCollectNetworkInfo = false;
        restrictions.push("Analytics consent required for advanced loading");
      }

      // Marketing consent enables behavioral data
      if (context.cookieConsent.marketing) {
        canUseBehavioralData = true;
      } else {
        restrictions.push("Marketing consent required for behavioral optimization");
      }

      // Preferences consent allows device info collection
      if (!context.cookieConsent.preferences) {
        canCollectDeviceInfo = false;
        restrictions.push("Preferences consent required for device information");
      }
    }

    const reason = restrictions.length > 0
      ? `Privacy restrictions: ${restrictions.join(", ")}`
      : "All privacy requirements met";

    logger.info("Privacy capabilities assessed", {
      event: "ll_privacy_assessment",
      ll_can_advanced_loading: canUseAdvancedLoading,
      ll_can_network_info: canCollectNetworkInfo,
      ll_can_device_info: canCollectDeviceInfo,
      ll_can_behavioral: canUseBehavioralData,
      ll_restrictions_count: restrictions.length,
      ll_has_gpc: context.globalPrivacyControl,
      ll_has_dnt: context.doNotTrack,
      ll_has_analytics_consent: context.cookieConsent?.analytics,
    });

    return {
      canUseAdvancedLoading,
      canCollectNetworkInfo,
      canCollectDeviceInfo,
      canUseBehavioralData,
      restrictions,
      reason,
    };
  }

  /**
   * Apply privacy restrictions to loading configuration
   */
  static applyPrivacyRestrictions(
    baseConfig: {
      strategy: "eager" | "progressive" | "deferred";
      requiresAnalyticsConsent: boolean;
    },
    capabilities: LoadingCapability
  ): {
    effectiveStrategy: "eager" | "progressive" | "deferred";
    isRestricted: boolean;
    restrictionReason: string;
  } {
    let effectiveStrategy = baseConfig.strategy;
    let isRestricted = false;
    let restrictionReason = "No restrictions applied";

    // If analytics consent is required but not given
    if (baseConfig.requiresAnalyticsConsent && !capabilities.canUseAdvancedLoading) {
      // Downgrade strategy for privacy compliance
      switch (baseConfig.strategy) {
        case "eager":
          effectiveStrategy = "progressive";
          break;
        case "progressive":
          effectiveStrategy = "deferred";
          break;
        case "deferred":
          // Already most conservative
          break;
      }

      isRestricted = true;
      restrictionReason = "Analytics consent required for optimal loading";

      logger.info("Loading strategy restricted for privacy", {
        event: "ll_strategy_restricted",
        ll_original_strategy: baseConfig.strategy,
        ll_effective_strategy: effectiveStrategy,
        ll_restriction_reason: restrictionReason,
        ll_requires_consent: baseConfig.requiresAnalyticsConsent,
      });
    }

    return {
      effectiveStrategy,
      isRestricted,
      restrictionReason,
    };
  }

  /**
   * Get privacy-compliant context data
   */
  static getCompliantContext(
    fullContext: {
      effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
      hardwareConcurrency?: number;
      cookieConsent?: PrivacyContext["cookieConsent"];
    },
    capabilities: LoadingCapability
  ): {
    effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
    hardwareConcurrency?: number;
    cookieConsent?: PrivacyContext["cookieConsent"];
  } {
    const compliantContext: any = {
      cookieConsent: fullContext.cookieConsent,
    };

    // Only include network info if allowed
    if (capabilities.canCollectNetworkInfo) {
      compliantContext.effectiveType = fullContext.effectiveType;
    } else {
      logger.debug("Network info collection blocked by privacy settings", {
        event: "ll_network_info_blocked",
      });
    }

    // Only include device info if allowed
    if (capabilities.canCollectDeviceInfo) {
      compliantContext.hardwareConcurrency = fullContext.hardwareConcurrency;
    } else {
      logger.debug("Device info collection blocked by privacy settings", {
        event: "ll_device_info_blocked",
      });
    }

    return compliantContext;
  }

  /**
   * Check if a loading feature requires explicit consent
   */
  static requiresConsent(feature: string): boolean {
    const consentRequiredFeatures = [
      "advanced_loading",
      "network_adaptation",
      "behavioral_optimization",
      "performance_tracking",
      "device_capability_detection",
    ];

    return consentRequiredFeatures.includes(feature);
  }

  /**
   * Get privacy notice for users
   */
  static getPrivacyNotice(capabilities: LoadingCapability): string {
    if (capabilities.canUseAdvancedLoading && capabilities.canUseBehavioralData) {
      return ""; // No notice needed, all capabilities available
    }

    const notices: string[] = [];

    if (!capabilities.canUseAdvancedLoading) {
      notices.push("Some content loads more conservatively to respect your privacy preferences.");
    }

    if (!capabilities.canUseBehavioralData) {
      notices.push("Loading is not personalized based on your behavior.");
    }

    if (!capabilities.canCollectDeviceInfo) {
      notices.push("Device-specific optimizations are disabled.");
    }

    return notices.length > 0
      ? `Privacy Notice: ${notices.join(" ")}`
      : "";
  }
}

/**
 * React Hook for Privacy-Aware Loading
 */
export function usePrivacyGateway(context: PrivacyContext) {
  const capabilities = PrivacyGateway.assessCapabilities(context);
  const privacyNotice = PrivacyGateway.getPrivacyNotice(capabilities);

  return {
    capabilities,
    privacyNotice,
    isFullyCompliant: capabilities.restrictions.length === 0,
    hasRestrictions: capabilities.restrictions.length > 0,
    canUseAdvancedFeatures: capabilities.canUseAdvancedLoading,
  };
}

/**
 * Utility to create privacy-compliant loader config
 */
export function createPrivacyCompliantConfig(
  baseConfig: {
    strategy: "eager" | "progressive" | "deferred";
    requiresAnalyticsConsent: boolean;
  },
  privacyContext: PrivacyContext
) {
  const capabilities = PrivacyGateway.assessCapabilities(privacyContext);
  const privacyRestrictions = PrivacyGateway.applyPrivacyRestrictions(baseConfig, capabilities);

  return {
    originalStrategy: baseConfig.strategy,
    effectiveStrategy: privacyRestrictions.effectiveStrategy,
    isRestricted: privacyRestrictions.isRestricted,
    restrictionReason: privacyRestrictions.restrictionReason,
    capabilities,
    privacyNotice: PrivacyGateway.getPrivacyNotice(capabilities),
  };
}

/**
 * Consent Manager Integration
 * Connects with existing consent management systems
 */
export class ConsentManager {
  static async getCurrentConsent(): Promise<PrivacyContext["cookieConsent"]> {
    // In real implementation, this would read from cookie consent manager
    // For now, simulate based on document.cookie or localStorage

    try {
      // Check for common consent cookie patterns
      const cookies = document.cookie.split(";").map(c => c.trim());
      const consentCookie = cookies.find(c => c.startsWith("cookie-consent="));

      if (consentCookie) {
        const consentValue = consentCookie.split("=")[1];
        const consent = JSON.parse(decodeURIComponent(consentValue));

        return {
          analytics: consent.analytics || false,
          necessary: consent.necessary !== false, // Default to true
          marketing: consent.marketing || false,
          preferences: consent.preferences || false,
        };
      }

      // Check localStorage as fallback
      const localConsent = localStorage.getItem("cookie-consent");
      if (localConsent) {
        const consent = JSON.parse(localConsent);
        return {
          analytics: consent.analytics || false,
          necessary: consent.necessary !== false,
          marketing: consent.marketing || false,
          preferences: consent.preferences || false,
        };
      }
    } catch (error) {
      logger.warn("Failed to parse consent data", {
        event: "ll_consent_parse_error",
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Default: no consent given
    return {
      analytics: false,
      necessary: true, // Necessary cookies are always allowed
      marketing: false,
      preferences: false,
    };
  }

  static async getPrivacySignals(): Promise<Pick<PrivacyContext, "doNotTrack" | "globalPrivacyControl">> {
    return {
      doNotTrack: navigator.doNotTrack === "1",
      globalPrivacyControl: (navigator as any).globalPrivacyControl === true,
    };
  }

  static async getFullPrivacyContext(): Promise<PrivacyContext> {
    const [cookieConsent, privacySignals] = await Promise.all([
      this.getCurrentConsent(),
      this.getPrivacySignals(),
    ]);

    return {
      cookieConsent,
      ...privacySignals,
    };
  }
}
