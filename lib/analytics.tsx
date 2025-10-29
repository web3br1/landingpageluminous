// Legacy analytics module - now re-exports from core for backward compatibility
// Use @/lib/analytics-core for new imports to avoid JSX in server code

export { analytics, consent, type ConsentState } from "./analytics-core";
export { PlausibleProvider } from "./analytics-provider.client";
