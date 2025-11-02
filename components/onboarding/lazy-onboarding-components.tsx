// Lazy loaded onboarding components for better performance
// Onboarding flows are multi-step and not critical for initial page load

import dynamic from "next/dynamic";

// Loading fallback for onboarding
const OnboardingLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary/5 to-accent/5">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-neutral-600 dark:text-neutral-400">
        Preparando sua experiência...
      </p>
    </div>
  </div>
);

// Lazy load onboarding flow
export const LazyOnboardingFlow = dynamic(
  () =>
    import("./onboarding-flow").then((m) => ({ default: m.OnboardingFlow })),
  {
    loading: OnboardingLoadingFallback,
    ssr: false, // Onboarding requires user interaction and state management
  },
);
