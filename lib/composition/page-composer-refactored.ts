// Composition System - Page Composer (Refactored with SOLID Architecture)
// Facade for the composition system using dependency injection
/**
 * @deprecated Use header-based resolver + adapter flow for marketing landing.
 * This facade remains for product/checkout pages until migration.
 */

import { getPageCompositionService, getSSRAdapter } from "./container";
import { logger } from "@/lib/logger";
import { PageComposition, PageType, SectionConfig } from "./ports";

// Re-export types for backward compatibility
export type { SectionConfig, PageComposition } from "./ports";

// Legacy facade functions - delegate to new architecture
export async function composePage(
  pageType: PageType,
): Promise<PageComposition> {
  const service = getPageCompositionService();
  const result = await service.composePage(pageType);

  if (!result.success) {
    logger.error("Page composition failed", { pageType, error: (result as any).error });
    throw new Error(`Page composition failed: ${(result as any).error.message}`);
  }

  return result.value;
}

export async function composePageAsync(
  pageType: PageType,
): Promise<PageComposition> {
  // For backward compatibility, async version delegates to main composePage
  return composePage(pageType);
}

export function composePageSync(pageType: PageType): PageComposition {
  const service = getPageCompositionService();
  const result = service.composePageSync(pageType);

  if (!result.success) {
    logger.error("Sync page composition failed", {
      pageType,
      error: (result as any).error,
    });
    throw new Error(`Sync page composition failed: ${(result as any).error.message}`);
  }

  return result.value;
}

// Utility functions for backward compatibility
export function getAvailablePages(): PageType[] {
  return [
    "landing",
    "features",
    "pricing",
    "demo",
    "signup",
    "trial",
    "checkout",
  ];
}

// Legacy validation functions - delegate to new system
export function validatePageType(
  pageType: string,
): asserts pageType is PageType {
  const availablePages = getAvailablePages();
  if (!pageType || typeof pageType !== "string") {
    throw new Error(
      `Invalid pageType: must be a non-empty string, got ${typeof pageType}`,
    );
  }

  if (pageType.length > 50) {
    throw new Error(
      `Invalid pageType: too long (max 50 chars), got ${pageType.length}`,
    );
  }

  if (!availablePages.includes(pageType as PageType)) {
    throw new Error(
      `Invalid pageType: "${pageType}" not found in available pages: ${availablePages.join(", ")}`,
    );
  }
}

export function validateSectionIdInput(
  sectionId: string,
): asserts sectionId is SectionId {
  const validIds = [
    "hero",
    "benefits",
    "features",
    "pricing",
    "social-proof",
    "demo",
    "faq",
    "final-cta",
    "footer",
    "checkout",
    "trial",
    "signup",
    "pillars",
    "how-it-works",
    "verticals",
    "proof-traction",
    "lead-form",
    "pricing-presale",
  ] as const;

  if (!sectionId || typeof sectionId !== "string") {
    throw new Error(
      `Invalid sectionId: must be a non-empty string, got ${typeof sectionId}`,
    );
  }

  if (sectionId.length > 50) {
    throw new Error(
      `Invalid sectionId: too long (max 50 chars), got ${sectionId.length}`,
    );
  }

  if (!validIds.includes(sectionId as SectionId)) {
    throw new Error(`Invalid section id: ${sectionId}`);
  }
}

// Legacy type for backward compatibility
export type SectionId =
  | "hero"
  | "benefits"
  | "features"
  | "pricing"
  | "social-proof"
  | "demo"
  | "faq"
  | "final-cta"
  | "footer"
  | "checkout"
  | "trial"
  | "signup"
  | "pillars"
  | "how-it-works"
  | "verticals"
  | "proof-traction"
  | "lead-form"
  | "pricing-presale";

function assertSectionId(id: string): asserts id is SectionId {
  validateSectionIdInput(id);
}

// Legacy environment utilities
export function getUserSegmentsSafe(): string[] {
  const ssrAdapter = getSSRAdapter();
  return ssrAdapter.safeLocalStorageAccess("dataflow_user_segments", []);
}

// Legacy fallback content - minimal implementation
function getFallbackContent(sectionId: string): unknown {
  logger.warn("Using legacy fallback content", { sectionId });

  const fallbacks: Record<string, unknown> = {
    hero: {
      content: {
        headline: "Sistema Temporariamente Indisponível",
        subheadline: "Estamos trabalhando para restaurar o serviço.",
        primaryCta: "Tentar Novamente",
      },
      variant: {
        id: "fallback",
        name: "Fallback",
        description: "Emergency fallback content",
      },
    },
    benefits: {
      content: {
        title: "Benefícios Comprovados",
        subtitle: "Resultados que você pode medir",
        benefits: [
          {
            icon: "Zap",
            title: "75% mais rápido",
            description: "Automatize processos manuais",
            metric: "75% economia",
          },
        ],
      },
      variant: {
        id: "fallback",
        name: "Fallback",
        description: "Emergency fallback content",
      },
    },
  };

  return fallbacks[sectionId] || null;
}

// Legacy sync composition functions - simplified
async function composeSectionContent(
  sectionId: string,
  pageType: string,
): Promise<unknown> {
  // This would delegate to content mapper in a full implementation
  // For now, return fallback
  logger.warn("Using legacy section composition", { sectionId, pageType });
  return getFallbackContent(sectionId);
}

async function composeSectionContentAsync(
  sectionId: string,
  pageType: string,
): Promise<unknown> {
  return composeSectionContent(sectionId, pageType);
}

function composeSectionContentSync(
  sectionId: string,
  pageType: string,
): unknown {
  logger.warn("Using legacy sync section composition", { sectionId, pageType });
  return getFallbackContent(sectionId);
}

function collectExperiments(sections: SectionConfig[]) {
  const experiments: Array<{
    id: string;
    variant: string;
    sections: string[];
  }> = [];

  sections.forEach((section) => {
    if (section.content?.experiment) {
      const exp = section.content.experiment;
      const existing = experiments.find((e) => e.id === exp.id);

      if (existing) {
        existing.sections.push(section.id);
      } else {
        experiments.push({
          id: exp.id,
          variant: exp.variant,
          sections: [section.id],
        });
      }
    }
  });

  return experiments;
}

async function createFallbackComposition(
  pageType: PageType,
  error: unknown,
): Promise<PageComposition> {
  logger.warn("Creating legacy fallback composition", { pageType, error });

  // Simplified fallback - in real implementation would use FallbackProvider
  const fallbackSections = [
    {
      id: "hero" as SectionId,
      component: "Hero",
      content: getFallbackContent("hero"),
      order: 1,
    },
  ];

  return {
    pageType,
    sections: fallbackSections as SectionConfig[],
    metadata: {
      title: "Sistema Temporariamente Indisponível",
      description: "Estamos trabalhando para restaurar o serviço.",
      keywords: ["indisponível", "manutenção"],
    },
    experiments: [],
    analytics: {
      pageType,
      conversionGoals: [],
    },
  };
}

function createFallbackCompositionSync(
  pageType: PageType,
  error: unknown,
): PageComposition {
  // Sync version of fallback
  logger.warn("Creating legacy sync fallback composition", { pageType, error });

  return {
    sections: [
      {
        id: "hero",
        component: "Hero",
        content: getFallbackContent("hero"),
        order: 1,
      },
    ],
    metadata: {
      title: "Sistema Temporariamente Indisponível",
      description: "Estamos trabalhando para restaurar o serviço.",
      keywords: ["indisponível", "manutenção"],
    },
    experiments: [],
    analytics: {
      pageType,
      conversionGoals: [],
    },
    pageType,
  };
}

function createMinimalFallbackContent(sectionId: string): unknown {
  return getFallbackContent(sectionId);
}
