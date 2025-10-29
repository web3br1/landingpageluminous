// SSR-Safe Page Renderer - Renders on server and client
// Direct server-side rendering for critical elements

import React, { Suspense } from "react";
import { PageComposition } from "./ports";
import { OptimizedLazySection } from "./performance/optimized-lazy-section";

// Import the proper SectionErrorBoundary
import { SectionErrorBoundary } from "../section-error-boundary";

interface PageRendererProps {
  composition: PageComposition;
  pageType: string;
}

// Loading fallback for sections
function SectionLoadingFallback({ sectionId }: { sectionId: string }) {
  return (
    <section id={sectionId} className="section-wrapper">
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-sm text-gray-600">Carregando...</p>
      </div>
    </section>
  );
}

// Core renderer - SSR-safe
function PageRendererCore({ composition }: PageRendererProps) {
  return (
    <main
      id="main-content"
      className="relative"
      role="main"
      aria-label="Conteúdo principal da página"
    >
      {/* Visible H1 for SEO and accessibility */}
      <h1 className="sr-only">Página Principal - {composition.pageType}</h1>

      {composition.sections.map((section, index) => (
        <SectionErrorBoundary key={section.id} sectionId={section.id}>
          <Suspense
            fallback={<SectionLoadingFallback sectionId={section.id} />}
          >
            <OptimizedLazySection section={section} index={index} />
          </Suspense>
        </SectionErrorBoundary>
      ))}
    </main>
  );
}

// Main PageRenderer - SSR-safe
export function PageRenderer({ composition, pageType }: PageRendererProps) {
  return <PageRendererCore composition={composition} pageType={pageType} />;
}
