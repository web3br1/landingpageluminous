import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import Script from "next/script";
import { defaultSeo, jsonLd, stringifyForScript } from "@/lib/seo";
import { ConsentBanner } from "@/app/(marketing)/components/ui/consent-banner";
import { LayoutComposer } from "@/lib/composition/layout-composer";
import { SkipLink } from "@/lib/a11y/touch-target-optimization";
import "@/styles/globals.css";

// Preload critical components and sections on module load
// preloadCriticalComponents();
// preloadCriticalSections();

// Client component for performance optimization
function PerformanceOptimizationWrapper() {
  // Temporarily simplified for build stability
  return null;
}

// Marketing Content Wrapper simplificado
function MarketingContentWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// UX Orchestrator Wrapper - Só carrega em rotas específicas quando necessário
function UXOrchestratorWrapper({ children }: { children: React.ReactNode }) {
  return <UXOrchestratorWrapperClient>{children}</UXOrchestratorWrapperClient>;
}

// ✅ CORREÇÃO: SSR-safe UX Orchestrator
function UXOrchestratorWrapperClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [shouldLoadUX, setShouldLoadUX] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // ✅ SSR-safe: só ativa na home page
    setIsHydrated(true);
    if (window.location.pathname === "/") {
      setShouldLoadUX(true);
    }
  }, []);

  if (!isHydrated || !shouldLoadUX) {
    return <>{children}</>;
  }

  // Lazy load do UX Orchestrator apenas quando necessário
  const UXOrchestrator = dynamic(
    () =>
      import("@/components/ui/ux-advanced-orchestrator").then((mod) => ({
        default: mod.UXAdvancedOrchestrator,
      })),
    {
      ssr: false,
      loading: () => null,
    },
  );

  return (
    <>
      {children}
      <UXOrchestrator
        debugMode={false}
        config={{
          enableChat: true,
          enableOnboarding: true,
          enableRecommendations: true,
          autoShowRecommendations: false,
          chatDelay: 15000, // 15 segundos
          onboardingDelay: 5000, // 5 segundos
          recommendationsDelay: 20000, // 20 segundos
        }}
      />
    </>
  );
}

// Fonts are applied at the RootLayout level to avoid duplication

// Merge default SEO with additional metadata
export const metadata: Metadata = {
  ...defaultSeo,
  keywords:
    "business intelligence, relatórios automáticos, BI Brasil, dashboards, análise de dados, automação PME, relatórios empresariais",
  authors: [{ name: "DataFlow Brasil" }],
  robots: "index, follow",
  openGraph: {
    ...defaultSeo.openGraph,
  },
  twitter: {
    ...defaultSeo.twitter,
  },
  alternates: {
    canonical: "https://dataflow.com.br",
  },
};

// Theme padrão para marketing (leve)
const defaultTheme = {
  mode: "system" as const,
  colorScheme: "default" as const,
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const debugDisableScript = process.env.NEXT_PUBLIC_DISABLE_JSONLD === "true";
  const debugBypassComposer =
    process.env.NEXT_PUBLIC_BYPASS_LAYOUT_COMPOSER === "true";

  return (
    <>
      {/* Structured Data for SEO */}
      {!debugDisableScript && (
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: stringifyForScript(jsonLd),
          }}
        />
      )}

      {/* Skip links for accessibility */}
      <SkipLink href="#main-content">Pular para conteúdo principal</SkipLink>
      <SkipLink href="#hero">Pular para início</SkipLink>
      <SkipLink href="#benefits">Pular para benefícios</SkipLink>
      <SkipLink href="#features">Pular para funcionalidades</SkipLink>
      <SkipLink href="#pricing">Pular para preços</SkipLink>
      <SkipLink href="#footer">Pular para rodapé</SkipLink>

      {/* Performance optimization wrapper */}
      <PerformanceOptimizationWrapper />

      {/* ✅ Providers essenciais para UX pública */}
      <UXOrchestratorWrapper>
        <MarketingContentWrapper>
          {debugBypassComposer ? (
            <div>
              {children}
              <ConsentBanner />
            </div>
          ) : (
            <LayoutComposer layoutId="marketing" className={""}>
              {children}
              <ConsentBanner />
            </LayoutComposer>
          )}
        </MarketingContentWrapper>
      </UXOrchestratorWrapper>
    </>
  );
}
