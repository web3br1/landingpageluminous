// Lazy Loading Configuration
// Defines which components should be lazy loaded for better performance

export interface LazyLoadConfig {
  component: string;
  priority: "critical" | "high" | "medium" | "low";
  ssr: boolean;
  chunkName?: string;
  fallback?: React.ComponentType;
}

// Priority levels:
// - critical: Above the fold, always load immediately
// - high: Important for UX, load soon
// - medium: Nice to have, load when visible
// - low: Optional features, load on demand

export const LAZY_LOAD_CONFIGS: Record<string, LazyLoadConfig> = {
  // Admin components - only load when needed
  "admin-layout": {
    component: "components/admin/admin-layout",
    priority: "low",
    ssr: false,
    chunkName: "admin",
  },
  "experiment-dashboard": {
    component: "components/admin/experiment-dashboard",
    priority: "low",
    ssr: false,
    chunkName: "admin-experiments",
  },
  "ml-dashboard": {
    component: "components/admin/ml-dashboard",
    priority: "low",
    ssr: false,
    chunkName: "admin-ml",
  },
  "monitoring-dashboard": {
    component: "components/admin/monitoring-dashboard",
    priority: "low",
    ssr: false,
    chunkName: "admin-monitoring",
  },
  "performance-dashboard": {
    component: "components/admin/performance-dashboard",
    priority: "low",
    ssr: false,
    chunkName: "admin-performance",
  },

  // Demo components - heavy animations
  "demo-controls": {
    component: "components/demo/demo-controls",
    priority: "low",
    ssr: false,
    chunkName: "demo",
  },
  "morph-svg-demo": {
    component: "components/demo/morph-svg-demo",
    priority: "low",
    ssr: false,
    chunkName: "demo-svg",
  },
  "parallax-demo": {
    component: "components/demo/parallax-demo",
    priority: "low",
    ssr: false,
    chunkName: "demo-parallax",
  },
  "path-motion-demo": {
    component: "components/demo/path-motion-demo",
    priority: "low",
    ssr: false,
    chunkName: "demo-motion",
  },
  "performance-hud": {
    component: "components/demo/performance-hud",
    priority: "low",
    ssr: false,
    chunkName: "demo-hud",
  },

  // UI components with complex state/behavior
  "experiment-dashboard-ui": {
    component: "components/ui/experiment-dashboard",
    priority: "medium",
    ssr: false,
    chunkName: "ui-experiments",
  },
  "live-chat": {
    component: "components/ui/live-chat",
    priority: "low",
    ssr: false,
    chunkName: "ui-chat",
  },
  "ux-advanced-orchestrator": {
    component: "components/ui/ux-advanced-orchestrator",
    priority: "low",
    ssr: false,
    chunkName: "ui-orchestrator",
  },
  dialog: {
    component: "components/ui/dialog",
    priority: "low",
    ssr: false,
    chunkName: "ui-modals",
  },
  sheet: {
    component: "components/ui/sheet",
    priority: "low",
    ssr: false,
    chunkName: "ui-modals",
  },
  popover: {
    component: "components/ui/popover",
    priority: "low",
    ssr: false,
    chunkName: "ui-modals",
  },
  table: {
    component: "components/ui/table",
    priority: "medium",
    ssr: true,
    chunkName: "ui-table",
  },
  "theme-switcher": {
    component: "components/ui/theme-switcher",
    priority: "high",
    ssr: false,
    chunkName: "ui-theme",
  },

  // Onboarding components
  "onboarding-flow": {
    component: "components/onboarding/onboarding-flow",
    priority: "low",
    ssr: false,
    chunkName: "onboarding",
  },

  // Personalization components
  "personalized-hero": {
    component: "components/personalization/personalized-hero",
    priority: "high",
    ssr: false,
    chunkName: "personalization",
  },

  // Recommendation components
  "product-recommendations": {
    component: "components/recommendations/product-recommendations",
    priority: "medium",
    ssr: false,
    chunkName: "recommendations",
  },
};

// Helper function to get lazy load config by component name
export function getLazyLoadConfig(
  componentName: string,
): LazyLoadConfig | undefined {
  return LAZY_LOAD_CONFIGS[componentName];
}

// Helper function to check if component should be lazy loaded
export function shouldLazyLoad(componentName: string): boolean {
  const config = getLazyLoadConfig(componentName);
  return config ? config.priority !== "critical" : false;
}

// Helper function to get components by priority
export function getComponentsByPriority(
  priority: LazyLoadConfig["priority"],
): string[] {
  return Object.entries(LAZY_LOAD_CONFIGS)
    .filter(([_, config]) => config.priority === priority)
    .map(([componentName]) => componentName);
}
