"use client";
import { useEffect } from "react";
import { advancedAnalytics } from "@/lib/analytics/advanced-analytics";

type Props = { tenant: string; ab: "A" | "B" | "C"; page: string };

export function AnalyticsBridge({ tenant, ab, page }: Props) {
  useEffect(() => {
    try {
      void advancedAnalytics.trackEvent("page", "view", page, undefined, {
        tenant,
        ab,
      });
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
