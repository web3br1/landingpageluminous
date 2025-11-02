/**
 * Simple Section Renderer
 * Basic section rendering with error boundaries
 */

"use client";

import { SectionId } from "./registry/section-registry";
import { SectionErrorBoundary } from "../section-error-boundary";

interface SectionRendererProps {
  sectionId: SectionId;
  data?: Record<string, unknown>;
  className?: string;
}

interface RenderedSectionProps {
  content?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Simple section renderer with lazy loading
 */
export function SectionRenderer({ sectionId, data, className }: SectionRendererProps) {
  const LazySection = lazy(() =>
    import(`@/components/sections/${sectionId}/${sectionId}`)
      .catch(() => {
        // Fallback to placeholder section
        return import("./registry/placeholder-section");
      })
  );

  // Simple data mapping - just pass content as-is
  const sectionProps: RenderedSectionProps = data || {};

  return (
    <SectionErrorBoundary sectionId={sectionId}>
      <Suspense fallback={<div className="min-h-[200px] flex items-center justify-center">Loading...</div>}>
        <div className={className}>
          <LazySection {...sectionProps} />
        </div>
      </Suspense>
    </SectionErrorBoundary>
  );
}

/**
 * Render multiple sections
 */
export function renderSections(
  sections: Array<{ id: SectionId; data?: Record<string, unknown>; className?: string }>
) {
  return sections.map((section) => (
    <SectionRenderer
      key={section.id}
      sectionId={section.id}
      data={section.data}
      className={section.className}
    />
  ));
}
