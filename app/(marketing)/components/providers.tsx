"use client";

import { PlausibleProvider } from "@/lib/analytics";
import { NotificationProvider } from "@/lib/notifications";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PlausibleProvider>
      <NotificationProvider>{children}</NotificationProvider>
    </PlausibleProvider>
  );
}
