"use client";

import React from "react";
import { CookieBanner, CookiePreferencesModal } from "./index";
import { useCookieConsent } from "@/lib/hooks/use-cookie-consent";

export function CookieConsentInner() {
  const {
    showBanner,
    showPreferences,
    saveConsent,
    acceptAll,
    rejectAll,
    openPreferences,
    closePreferences,
  } = useCookieConsent();

  return (
    <>
      <CookieBanner
        isVisible={showBanner}
        onAccept={acceptAll}
        onReject={rejectAll}
        onCustomize={openPreferences}
      />

      <CookiePreferencesModal
        isOpen={showPreferences}
        onClose={closePreferences}
        onSave={saveConsent}
      />
    </>
  );
}
