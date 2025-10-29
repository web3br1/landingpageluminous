"use client";

import { useState, useEffect, useCallback } from "react";
import { ConsentState } from "@/components/cookie-banner";
import { ConsentManager } from "@/lib/privacy/consent-manager";

export function useCookieConsent() {
  const [consent, setConsentState] = useState<ConsentState>({
    essential: true,
    analytics: false,
    marketing: false,
    functional: false,
  });

  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load consent from storage on mount
  useEffect(() => {
    try {
      const storedConsent = ConsentManager.getConsent();

      // If no consent stored, show banner
      if (
        !ConsentManager.hasAnyNonEssentialConsent() &&
        ConsentManager.getLastUpdateTimestamp() === null
      ) {
        setShowBanner(true);
      }

      setConsentState(storedConsent);
    } catch (error) {
      console.warn("Failed to load consent:", error);
      setShowBanner(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen for consent changes from other parts of the app
  useEffect(() => {
    const handleConsentChanged = (event: CustomEvent) => {
      setConsentState(event.detail.consent);
      setShowBanner(false);
      setShowPreferences(false);

      // Reload third-party scripts based on new consent
      if (typeof window !== "undefined") {
        try {
          const {
            ThirdPartyManager,
          } = require("@/lib/privacy/third-party-manager");
          ThirdPartyManager.reloadScripts();
        } catch (error) {
          console.warn("Failed to reload third-party scripts:", error);
        }
      }
    };

    window.addEventListener(
      "consentChanged",
      handleConsentChanged as EventListener,
    );

    return () => {
      window.removeEventListener(
        "consentChanged",
        handleConsentChanged as EventListener,
      );
    };
  }, []);

  const saveConsent = useCallback((newConsent: ConsentState) => {
    ConsentManager.setConsent(newConsent, "banner");
    setConsentState(newConsent);
    setShowBanner(false);
    setShowPreferences(false);
  }, []);

  const acceptAll = useCallback(() => {
    const fullConsent: ConsentState = {
      essential: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    saveConsent(fullConsent);
  }, [saveConsent]);

  const rejectAll = useCallback(() => {
    const minimalConsent: ConsentState = {
      essential: true,
      analytics: false,
      marketing: false,
      functional: false,
    };
    saveConsent(minimalConsent);
  }, [saveConsent]);

  const openPreferences = useCallback(() => {
    setShowPreferences(true);
  }, []);

  const closePreferences = useCallback(() => {
    setShowPreferences(false);
  }, []);

  // Check if user has given consent for specific category
  const hasConsent = useCallback((category: keyof ConsentState): boolean => {
    return ConsentManager.hasConsent(category);
  }, []);

  // Check if user has given any non-essential consent
  const hasAnyConsent = useCallback((): boolean => {
    return ConsentManager.hasAnyNonEssentialConsent();
  }, []);

  return {
    consent,
    showBanner,
    showPreferences,
    isLoading,
    saveConsent,
    acceptAll,
    rejectAll,
    openPreferences,
    closePreferences,
    hasConsent,
    hasAnyConsent,
  };
}
