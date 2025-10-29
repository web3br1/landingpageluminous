// Lazy loaded admin components for better performance
// These components are only loaded when needed in admin routes

import dynamic from "next/dynamic";
import React, { Suspense, ComponentType } from "react";

// Loading fallback component
const AdminLoadingFallback = () => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
      <p className="text-sm text-muted-foreground">Carregando...</p>
    </div>
  </div>
);

// Lazy load admin components
export const LazyAdminLayout = dynamic(
  () => import("./admin-layout").then((m) => ({ default: m.AdminLayout })),
  {
    loading: AdminLoadingFallback,
    ssr: false, // Admin components don't need SSR
  },
);

export const LazyExperimentDashboard = dynamic(
  () =>
    import("./experiment-dashboard").then((m) => ({
      default: m.ExperimentDashboard,
    })),
  {
    loading: AdminLoadingFallback,
    ssr: false,
  },
);

export const LazyExperimentsDashboard = dynamic(
  () =>
    import("./experiments-dashboard").then((m) => ({
      default: m.ExperimentsDashboard,
    })),
  {
    loading: AdminLoadingFallback,
    ssr: false,
  },
);

export const LazyMLDashboard = dynamic(
  () => import("./ml-dashboard").then((m) => ({ default: m.MLDashboard })),
  {
    loading: AdminLoadingFallback,
    ssr: false,
  },
);

export const LazyMonitoringDashboard = dynamic(
  () =>
    import("./monitoring-dashboard").then((m) => ({
      default: m.MonitoringDashboard,
    })),
  {
    loading: AdminLoadingFallback,
    ssr: false,
  },
);

export const LazyPerformanceDashboard = dynamic(
  () =>
    import("./performance-dashboard").then((m) => ({
      default: m.PerformanceDashboard,
    })),
  {
    loading: AdminLoadingFallback,
    ssr: false,
  },
);

// Wrapper component with error boundary
export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  fallback?: React.ComponentType,
) {
  const LazyComponent = dynamic(() => Promise.resolve({ default: Component }), {
    loading: fallback
      ? () => React.createElement(fallback)
      : () => React.createElement("div", null, "Loading..."),
    ssr: false,
  });

  return LazyComponent;
}
