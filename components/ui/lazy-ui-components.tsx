// Lazy loaded UI components for better performance
// Components with heavy dependencies or complex animations

import dynamic from "next/dynamic";
import { Suspense } from "react";

// Loading fallback for UI components
const UIComponentFallback = ({ componentName }: { componentName?: string }) => (
  <div className="animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded h-10">
    {componentName && (
      <span className="sr-only">Carregando {componentName}...</span>
    )}
  </div>
);

// Lazy load heavy UI components
export const LazyExperimentDashboard = dynamic(
  () =>
    import("./experiment-dashboard").then((m) => ({
      default: m.ExperimentDashboard,
    })),
  {
    loading: () => (
      <UIComponentFallback componentName="Dashboard de Experimentos" />
    ),
    ssr: false, // Experiment tracking requires client-side
  },
);

export const LazyLiveChat = dynamic(
  () => import("./live-chat").then((m) => ({ default: m.LiveChat })),
  {
    loading: () => <UIComponentFallback componentName="Chat ao Vivo" />,
    ssr: false, // Chat requires real-time connections
  },
);

export const LazyUxAdvancedOrchestrator = dynamic(
  () =>
    import("./ux-advanced-orchestrator").then((m) => ({
      default: m.UXAdvancedOrchestrator,
    })),
  {
    loading: () => <UIComponentFallback componentName="Orquestrador UX" />,
    ssr: false, // UX orchestration requires client-side state management
  },
);

// Lazy load dialog/modal components (only load when needed)
export const LazyDialog = dynamic(
  () => import("./dialog").then((m) => ({ default: m.Dialog })),
  {
    loading: () => null, // Dialogs are hidden by default
    ssr: false, // Modals don't work well with SSR
  },
);

export const LazySheet = dynamic(
  () => import("./sheet").then((m) => ({ default: m.Sheet })),
  {
    loading: () => null, // Sheets are hidden by default
    ssr: false, // Side panels don't work with SSR
  },
);

export const LazyPopover = dynamic(
  () => import("./popover").then((m) => ({ default: m.Popover })),
  {
    loading: () => null, // Popovers are hidden by default
    ssr: false, // Popovers require client-side positioning
  },
);

// Lazy load complex form components
export const LazyTextarea = dynamic(
  () => import("./textarea").then((m) => ({ default: m.Textarea })),
  {
    loading: () => (
      <div className="animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded h-20" />
    ),
    ssr: true, // Basic textareas can be SSR'd
  },
);

// Lazy load table component (can be heavy with large datasets)
export const LazyTable = dynamic(
  () => import("./table").then((m) => ({ default: m.Table })),
  {
    loading: () => (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-full"></div>
        <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-5/6"></div>
        <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-4/6"></div>
      </div>
    ),
    ssr: true, // Tables can be SSR'd but may be heavy
  },
);

// Lazy load theme switcher (has complex state management)
export const LazyThemeSwitcher = dynamic(
  () => import("./theme-switcher").then((m) => ({ default: m.ThemeSwitcher })),
  {
    loading: () => <UIComponentFallback componentName="Seletor de Tema" />,
    ssr: false, // Theme switching requires client-side state
  },
);
