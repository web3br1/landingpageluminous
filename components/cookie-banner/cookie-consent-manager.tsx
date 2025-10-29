"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";

// Dynamic import to avoid SSR issues
const CookieConsentInner = dynamic(
  () =>
    import("./cookie-consent-inner").then((mod) => ({
      default: mod.CookieConsentInner,
    })),
  {
    ssr: false, // Never render on server
    loading: () => null, // No loading state needed
  },
);

export function CookieConsentManager() {
  return (
    <Suspense fallback={null}>
      <CookieConsentInner />
    </Suspense>
  );
}
