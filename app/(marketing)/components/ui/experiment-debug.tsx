"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

// Lazy load do componente para evitar problemas de hidratação
const ExperimentDebugInner = dynamic(
  () =>
    import("./experiment-debug-inner").then((mod) => ({
      default: mod.ExperimentDebugInner,
    })),
  {
    ssr: false, // Nunca renderizar no servidor
    loading: () => null, // Não mostrar nada durante loading
  },
);

interface ExperimentDebugProps {
  className?: string;
}

export function ExperimentDebug({ className }: ExperimentDebugProps) {
  // Só renderizar no cliente via dynamic import
  return (
    <Suspense fallback={null}>
      <ExperimentDebugInner className={className} />
    </Suspense>
  );
}
