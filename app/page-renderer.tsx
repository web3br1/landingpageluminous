"use client";

import React, { Suspense } from "react";
import { PageComposition } from "@/lib/composition/ports";
import { OptimizedLazySection } from "@/lib/composition/performance/optimized-lazy-section";

// Client-side error boundary component
class SectionErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    sectionId: string;
  },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; sectionId: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      `[SectionErrorBoundary] Error in section ${this.props.sectionId}:`,
      error,
      errorInfo,
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <section
          id={this.props.sectionId}
          className="section-wrapper py-20 bg-red-50 border border-red-200"
          data-debug="error-boundary"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-red-600">⚠️</span>
            </div>
            <h3 className="text-lg font-semibold text-red-700 mb-2">
              Erro na seção {this.props.sectionId}
            </h3>
            <p className="text-red-600 text-sm mb-4">
              {this.state.error?.message || "Erro desconhecido"}
            </p>
            <details className="text-left text-xs text-gray-600 mb-4">
              <summary className="cursor-pointer hover:text-gray-800">
                Stack Trace
              </summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                {this.state.error?.stack}
              </pre>
            </details>
            <button
              onClick={() =>
                this.setState({ hasError: false, error: undefined })
              }
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Tentar novamente
            </button>
          </div>
        </section>
      );
    }

    return this.props.children;
  }
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

interface PageRendererProps {
  composition: PageComposition;
  pageType: string;
}

// Core renderer - client-side with frozen composition
function PageRendererCore({ composition }: PageRendererProps) {
  // [HIPÓTESE 2] Logs para detectar problemas de hidratação SSR/CSR
  console.log("[PageRenderer] PageRendererCore called", {
    isServer: typeof window === "undefined",
    hasWindow: typeof window !== "undefined",
    hasDocument: typeof document !== "undefined",
    navigator:
      typeof navigator !== "undefined"
        ? { userAgent: navigator.userAgent?.substring(0, 50) }
        : "undefined",
    timestamp: Date.now(),
    compositionSectionsCount: composition?.sections?.length || 0,
  });

  // [HIPÓTESE 4] Verificar contexto do React
  console.log("[PageRenderer] React context check", {
    React: typeof React,
    ReactVersion: React?.version,
    createElement: typeof React?.createElement,
    useState: typeof React?.useState,
    useEffect: typeof React?.useEffect,
  });

  try {
    if (!composition.sections || composition.sections.length === 0) {
      console.warn("[PageRenderer] No sections found in composition", {
        composition,
      });
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">
              Nenhuma seção encontrada
            </h2>
            <p className="text-gray-600">A composição da página está vazia.</p>
          </div>
        </div>
      );
    }

    console.log("[PageRenderer] Processing sections", {
      sectionsCount: composition.sections.length,
      sectionIds: composition.sections.map((s) => s.id || "unnamed"),
      sectionComponents: composition.sections.map(
        (s) => s.component || "unknown",
      ),
    });

    return (
      <div className="page-container">
        {composition.sections.map((section, index) => {
          console.log(`[PageRenderer] Rendering section ${index}`, {
            sectionId: section.id,
            component: section.component,
            hasContent: !!section.content,
            contentKeys: section.content ? Object.keys(section.content) : [],
            sectionIndex: index,
          });

          return (
            <SectionErrorBoundary
              key={section.id || `section-${index}`}
              sectionId={section.id || `section-${index}`}
            >
              <Suspense
                fallback={
                  <SectionLoadingFallback
                    sectionId={section.id || `section-${index}`}
                  />
                }
              >
                <OptimizedLazySection section={section} index={index} />
              </Suspense>
            </SectionErrorBoundary>
          );
        })}
      </div>
    );
  } catch (error) {
    console.error("[PageRenderer] Critical error in PageRendererCore:", {
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : error,
      composition: composition
        ? {
            hasSections: !!composition.sections,
            sectionsCount: composition.sections?.length,
            pageType: composition.pageType,
          }
        : "undefined",
      environment: {
        isServer: typeof window === "undefined",
        nodeVersion: process?.version,
        nextVersion: process?.env?.NEXT_RUNTIME,
      },
    });

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2 text-red-600">
            Erro no PageRenderer
          </h2>
          <p className="text-gray-600">
            {error instanceof Error ? error.message : "Erro desconhecido"}
          </p>
        </div>
      </div>
    );
  }
}

// Main PageRenderer - client component
export default function PageRenderer({
  composition,
  pageType,
}: PageRendererProps) {
  return (
    <div data-testid="page-renderer" data-page-type={pageType}>
      {/* Metadata elements for testing */}
      <div data-testid="metadata-title" className="sr-only">
        DataFlow Brasil - Automatize seus Relatórios
      </div>
      <div data-testid="metadata-description" className="sr-only">
        Plataforma completa de business intelligence para PMEs brasileiras
      </div>
      <PageRendererCore composition={composition} pageType={pageType} />
    </div>
  );
}
