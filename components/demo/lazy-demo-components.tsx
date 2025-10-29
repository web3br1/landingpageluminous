// Lazy loaded demo components for better performance
// Demo components often have heavy animations and are not critical for initial load

import dynamic from "next/dynamic";
import { Suspense } from "react";

// Loading fallback for demo components
const DemoLoadingFallback = () => (
  <div className="min-h-[400px] flex items-center justify-center bg-linear-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-neutral-600 dark:text-neutral-400">
        Carregando demonstração...
      </p>
    </div>
  </div>
);

// Lazy load demo components
export const LazyDemoControls = dynamic(
  () => import("./demo-controls").then((m) => ({ default: m.DemoControls })),
  {
    loading: DemoLoadingFallback,
    ssr: false, // Demo controls have client-side interactions
  },
);

export const LazyMorphSvgDemo = dynamic(
  () => import("./morph-svg-demo").then((m) => ({ default: m.MorphSvgDemo })),
  {
    loading: DemoLoadingFallback,
    ssr: false, // SVG animations don't work with SSR
  },
);

export const LazyParallaxDemo = dynamic(
  () => import("./parallax-demo").then((m) => ({ default: m.ParallaxDemo })),
  {
    loading: DemoLoadingFallback,
    ssr: false, // Parallax effects require client-side
  },
);

export const LazyPathMotionDemo = dynamic(
  () =>
    import("./path-motion-demo").then((m) => ({ default: m.PathMotionDemo })),
  {
    loading: DemoLoadingFallback,
    ssr: false, // Path animations require client-side
  },
);

export const LazyPerformanceHud = dynamic(
  () =>
    import("./performance-hud").then((m) => ({ default: m.PerformanceHud })),
  {
    loading: DemoLoadingFallback,
    ssr: false, // Performance monitoring is client-side only
  },
);
