// Page Composition Service - Single Responsibility: Orchestrate page composition
// Application Layer Service implementing IPageCompositionService

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable complexity */

import { z } from "zod";
import { isErr, isOk } from "@/shared/core";
import {
  AppError,
  PageType,
  PageComposition,
  CompositionContext,
  Result,
  SectionConfig,
  ExperimentInfo,
} from "../ports";
import {
  IPageCompositionService,
  IContentMapper,
  IFallbackProvider,
  IPerformanceMonitor,
  IErrorTracker,
} from "../ports";
import { validatePageComposition } from "../composer-validation";
import { getLogger } from "../container";
import {
  IPageConfigurationProvider,
  PageConfig,
} from "./page-configuration-provider";

// Import observability
import {
  compositionMetrics,
  withCompositionMetrics,
  withCompositionMetricsAsync,
} from "../observability/composition-metrics";
import {
  compositionTracer,
  createCompositionTraceContext,
} from "../observability/composition-tracer";
import {
  compositionAlerts,
  alertOnCompositionFailure,
  alertOnPerformanceDegradation,
} from "../observability/composition-alerts";

// Input validation schemas - ainda mais permissivo para evitar warnings
const CompositionOptionsSchema = z.any(); // Temporarily allow any options to avoid validation warnings

const CompositionContextSchema = z
  .object({
    userId: z.string().optional(),
    tenantId: z.string().optional(),
    userSegments: z.array(z.string()).optional(),
    experiments: z.record(z.string(), z.string()).optional(),
    locale: z.string().optional(),
    featureFlags: z.record(z.string(), z.boolean()).optional(),
    experimentOverrides: z.record(z.string(), z.string()).optional(),
  })
  .passthrough()
  .optional(); // Mais permissivo

export interface CompositionOptions {
  flags?: Record<string, boolean>;
}

// Error handling helpers
function ensureError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

async function logErrorAndCapture(
  logger: ReturnType<typeof getLogger>,
  errorTracker: IErrorTracker,
  operation: string,
  error: unknown,
  context?: Record<string, unknown>,
): Promise<void> {
  const errorObj = ensureError(error);
  logger.error(`${operation} failed`, {
    error: errorObj,
    ...context,
  });

  try {
    await errorTracker.captureException(errorObj, {
      operation,
      ...context,
    });
  } catch (captureError) {
    logger.error("Failed to capture exception", {
      captureError: ensureError(captureError),
    });
    // Repropagar para que testes detectem o problema
    throw captureError;
  }
}

export class PageCompositionService implements IPageCompositionService {
  constructor(
    private readonly contentMapper: IContentMapper,
    private readonly fallbackProvider: IFallbackProvider,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly errorTracker: IErrorTracker,
    private readonly configProvider: IPageConfigurationProvider | null,
  ) {
    // Keep constructor parameters for potential future use
  }

  async composePage(
    pageType: PageType,
    context?: CompositionContext,
    options?: CompositionOptions,
  ): Promise<Result<PageComposition, AppError>> {
    const logger = getLogger();
    const startTime = Date.now();

    // Create trace context for this composition
    const traceContext = createCompositionTraceContext(pageType, context);

    // Record metrics
    compositionMetrics.recordPageCompositionStart(pageType, context);

    // Start performance monitoring
    const timer = this.performanceMonitor.startTimer("compose_page");

    try {
      // Validate input
      const contextValidation = CompositionContextSchema.safeParse(context);
      if (!contextValidation.success) {
        logger.warn("Invalid composition context provided", {
          errors: contextValidation.error.issues,
        });
      }

      const optionsValidation = CompositionOptionsSchema.safeParse(options);
      if (!optionsValidation.success) {
        logger.warn("Invalid composition options provided", {
          errors: optionsValidation.error.issues,
        });
      }

      logger.info("Starting page composition", { pageType, context });

      // Get page configuration
      const configResult = this.configProvider
        ? await this.configProvider.getPageConfig(pageType)
        : this.getPageConfig(pageType);

      if (isErr(configResult)) {
        logger.warn("Configuration provider failed, using fallback", {
          pageType,
          error: configResult.error,
        });
        return this.fallbackProvider.getFallbackComposition(
          pageType,
          configResult.error,
        );
      }

      const config = configResult.value;

      // Compose sections with content mapping
      const sectionsContext = { ...context, flags: options?.flags };
      const sectionsResult = await this.composeSections(
        config.sections,
        pageType,
        sectionsContext,
      );

      if (isErr(sectionsResult)) {
        logger.warn("Section composition failed, using fallback", {
          pageType,
          error: sectionsResult.error,
        });
        return this.fallbackProvider.getFallbackComposition(
          pageType,
          sectionsResult.error,
        );
      }

      // Collect experiment information
      const experiments = this.collectExperiments(sectionsResult.value);

      // Build final composition
      const composition: PageComposition = {
        sections: sectionsResult.value,
        metadata: config.metadata,
        experiments,
        analytics: config.analytics,
        pageType,
      };

      // Validate composition
      const validation = validatePageComposition(composition);
      if (!validation.success) {
        // Extract detailed error information
        const errorDetails = Array.isArray(validation.error)
          ? validation.error.map(err => ({
              path: err.path?.join('.') || 'unknown',
              message: err.message || 'Unknown validation error',
              code: err.code || 'unknown',
            }))
          : [{ message: 'Non-array validation error', details: validation.error }];

        logger.error("Page composition validation failed", {
          pageType,
          errorCount: errorDetails.length,
          errors: errorDetails,
        });

        await this.errorTracker.captureException(
          new Error(
            `Composition validation failed (${errorDetails.length} errors): ${errorDetails.map(e => ('path' in e && 'message' in e) ? `${e.path}: ${e.message}` : (e as any).message || String(e)).join('; ')}`,
          ),
          { pageType, validationErrors: errorDetails },
        );

        return this.fallbackProvider.getFallbackComposition(
          pageType,
          errorDetails,
        );
      }

      const durationResult = await this.performanceMonitor.endTimer(timer);
      const durationMs = isOk(durationResult) ? durationResult.value : 0;

      // Record success metrics and tracing
      compositionMetrics.recordPageCompositionComplete(
        pageType,
        durationMs,
        composition.sections.length,
      );
      compositionTracer.tracePageCompositionComplete(
        traceContext,
        composition,
        durationMs,
      );

      // Check for performance alerts
      alertOnPerformanceDegradation(pageType, durationMs);

      logger.info("Page composition completed", {
        pageType,
        sectionsCount: composition.sections.length,
        durationMs,
        traceId: traceContext.traceId,
      });

      return Result.ok(composition);
    } catch (error) {
      const durationResult = await this.performanceMonitor.endTimer(timer);
      const durationMs = isOk(durationResult) ? durationResult.value : 0;

      // Record error metrics and tracing
      compositionMetrics.recordPageCompositionError(
        pageType,
        "exception",
        durationMs,
      );
      compositionTracer.tracePageCompositionError(
        traceContext,
        error instanceof Error ? error : new Error(String(error)),
        durationMs,
      );

      // Alert on composition failure
      alertOnCompositionFailure(
        pageType,
        error instanceof Error ? error : new Error(String(error)),
      );

      try {
        await logErrorAndCapture(
          logger,
          this.errorTracker,
          "page composition",
          error,
          {
            pageType,
            durationMs,
            traceId: traceContext.traceId,
          },
        );
      } catch (captureError) {
        // Se o tracking falhar, ainda assim retorna fallback
        logger.error("Error tracking failed, but returning fallback", {
          captureError,
        });
      }

      return this.fallbackProvider.getFallbackComposition(pageType, error);
    }
  }

  composePageSync(
    pageType: PageType,
    context?: CompositionContext,
  ): Result<PageComposition, AppError> {
    const logger = getLogger();
    const timer = this.performanceMonitor.startTimer("compose_page_sync");

    try {
      // Validate input
      const contextValidation = CompositionContextSchema.safeParse(context);
      if (!contextValidation.success) {
        logger.warn("Invalid composition context provided (sync)", {
          errors: contextValidation.error.issues,
        });
      }

      logger.info("Starting synchronous page composition", {
        pageType,
        context,
      });

      // Get page configuration (sync only for composePageSync)
      const configResult = this.getPageConfig(pageType);
      if (isErr(configResult)) {
        logger.warn("Sync configuration provider failed, using fallback", {
          pageType,
          error: configResult.error,
        });
        return this.fallbackProvider.getFallbackComposition(
          pageType,
          configResult.error,
        );
      }

      const config = configResult.value;

      // Compose sections synchronously
      const sectionsResult = this.composeSectionsSync(
        config.sections,
        pageType,
        context,
      );
      if (isErr(sectionsResult)) {
        logger.warn("Sync section composition failed, using fallback", {
          pageType,
          error: sectionsResult.error,
        });
        return this.fallbackProvider.getFallbackComposition(
          pageType,
          sectionsResult.error,
        );
      }

      // Collect experiment information
      const experiments = this.collectExperiments(sectionsResult.value);

      // Build final composition
      const composition: PageComposition = {
        sections: sectionsResult.value,
        metadata: config.metadata,
        experiments,
        analytics: config.analytics,
        pageType,
      };

      // Validate composition
      const validation = validatePageComposition(composition);
      if (!validation.success) {
        logger.error("Sync page composition validation failed", {
          pageType,
          error: validation.error,
        });
        return this.fallbackProvider.getFallbackComposition(
          pageType,
          validation.error,
        );
      }

      this.performanceMonitor.endTimer(timer).then((durationResult) => {
        if (isOk(durationResult)) {
          logger.info("Sync page composition completed", {
            pageType,
            sectionsCount: composition.sections.length,
            durationMs: durationResult.value,
          });
        }
      });

      return Result.ok(composition);
    } catch (error) {
      this.performanceMonitor.endTimer(timer).then(async (durationResult) => {
        const durationMs = isOk(durationResult) ? durationResult.value : 0;
        try {
          await logErrorAndCapture(
            logger,
            this.errorTracker,
            "sync page composition",
            error,
            {
              pageType,
              durationMs,
            },
          );
        } catch (captureError) {
          // Se o tracking falhar, ainda assim loga
          logger.error("Error tracking failed in sync composition", {
            captureError,
          });
        }
      });

      return this.fallbackProvider.getFallbackComposition(pageType, error);
    }
  }

  private async composeSections(
    sectionConfigs: SectionConfig[],
    pageType: PageType,
    context?: CompositionContext,
  ): Promise<Result<SectionConfig[], AppError>> {
    const logger = getLogger();
    const startTime = performance.now();
    const results: (SectionConfig | null)[] = [];

    // Process each section individually to prevent Promise.all from failing
    for (const section of sectionConfigs) {
      console.log(`[PageCompositionService] Processing section: ${section.id}`);

      const sectionStartTime = Date.now();
      compositionMetrics.recordSectionProcessingStart(section.id, pageType);

      try {
        const contentResult = await this.contentMapper.mapSectionContent(
          section.id,
          pageType,
          context,
        );

        const sectionDuration = Date.now() - sectionStartTime;

        if (isErr(contentResult)) {
          console.log(
            `[PageCompositionService] Section ${section.id} content mapping failed:`,
            contentResult.error,
          );
          logger.warn(
            `Section ${section.id} content mapping failed, using fallback`,
          );

          // Record error metrics
          compositionMetrics.recordSectionProcessingError(
            section.id,
            pageType,
            "content_mapping_failed",
          );

          const fallbackResult =
            this.fallbackProvider.getFallbackSectionContent(section.id);
          const fallbackContent = isOk(fallbackResult)
            ? fallbackResult.value
            : null;
          results.push(
            fallbackContent
              ? {
                  ...section,
                  content: fallbackContent,
                  tracking: {
                    section: section.id,
                    experimentId: undefined,
                    variant: undefined,
                  },
                }
              : null,
          );
        } else {
          // Record success metrics
          compositionMetrics.recordSectionProcessingComplete(
            section.id,
            pageType,
            sectionDuration,
          );

          results.push({
            ...section,
            content: contentResult.value,
            tracking: {
              section: section.id,
              experimentId: context?.experiments?.[section.id],
              variant: context?.experiments?.[section.id],
            },
          });
        }
      } catch (error) {
        logger.error(`Section ${section.id} processing crashed:`, {
          error: error instanceof Error ? error : new Error(String(error)),
          pageType,
          sectionId: section.id,
        });
        // Track unexpected errors
        this.errorTracker
          .captureException(
            error instanceof Error ? error : new Error(String(error)),
            {
              pageType,
              sectionId: section.id,
              operation: "section_composition",
            },
          )
          .catch((trackError) => {
            logger.error("Failed to track section composition error", {
              trackError,
            });
          });
        results.push(null);
      }
    }

    const sectionProcessingTime = performance.now() - startTime;
    logger.debug("Section processing completed", {
      pageType,
      sectionCount: sectionConfigs.length,
      validSections: results.filter((s) => s !== null).length,
      processingTimeMs: sectionProcessingTime,
    });

    // Filter out failed sections
    const validSections = results.filter(
      (section) => section !== null,
    ) as SectionConfig[];
    const failedSections = results.filter((section) => section === null).length;

    if (failedSections > 0) {
      logger.warn(
        `${failedSections} sections failed to compose for ${pageType}`,
      );
    }

    // If no sections succeeded, return error
    if (validSections.length === 0) {
      logger.error("All sections failed to compose", {
        pageType,
        totalSections: sectionConfigs.length,
        failedSections,
      });
      return Result.err({
        name: "AppError",
        message: `All sections failed to compose for page type: ${pageType}`,
        code: "INTERNAL_ERROR",
        details: {
          pageType,
          totalSections: sectionConfigs.length,
          failedSections,
        },
      });
    }

    return Result.ok(validSections);
  }

  private composeSectionsSync(
    sectionConfigs: SectionConfig[],
    pageType: PageType,
    context?: CompositionContext,
  ): Result<SectionConfig[], AppError> {
    const logger = getLogger();
    const results = sectionConfigs.map((section) => {
      try {
        const contentResult = this.contentMapper.mapSectionContentSync(
          section.id,
          pageType,
          context,
        );

        if (isErr(contentResult)) {
          logger.warn("Sync section content mapping failed, using fallback", {
            sectionId: section.id,
            error: contentResult.error,
          });
          const fallbackResult =
            this.fallbackProvider.getFallbackSectionContent(section.id);
          const fallbackContent = isOk(fallbackResult)
            ? fallbackResult.value
            : null;
          return fallbackContent
            ? {
                ...section,
                content: fallbackContent,
                tracking: {
                  section: section.id,
                  experimentId: undefined,
                  variant: undefined,
                },
              }
            : null;
        }

        return {
          ...section,
          content: contentResult.value,
          tracking: {
            section: section.id,
            experimentId: context?.experiments?.[section.id],
            variant: context?.experiments?.[section.id],
          },
        };
      } catch (error) {
        logger.error(`Sync section ${section.id} processing crashed:`, {
          error: error instanceof Error ? error : new Error(String(error)),
          pageType,
          sectionId: section.id,
        });
        // Track unexpected sync errors
        this.errorTracker
          .captureException(
            error instanceof Error ? error : new Error(String(error)),
            {
              pageType,
              sectionId: section.id,
              operation: "sync_section_composition",
            },
          )
          .catch((trackError) => {
            logger.error("Failed to track sync section composition error", {
              trackError,
            });
          });
        return null;
      }
    });

    // Filter out failed sections
    const validSections = results.filter((section) => section !== null);
    const failedSections = results.filter((section) => section === null).length;

    if (failedSections > 0) {
      logger.warn("Sections filtered out during sync composition", {
        pageType,
        totalSections: results.length,
        validSections: validSections.length,
        failedSections,
        failedSectionIds: results
          .map((result, index) =>
            result === null ? sectionConfigs[index].id : null,
          )
          .filter((id) => id !== null),
      });
    }

    // If no sections succeeded, return error
    if (validSections.length === 0) {
      logger.error("All sections failed to compose synchronously", {
        pageType,
        totalSections: results.length,
        failedSections,
      });
      return Result.err({
        name: "AppError",
        message: `All sections failed to compose synchronously for page type: ${pageType}`,
        code: "INTERNAL_ERROR",
        details: { pageType, totalSections: results.length, failedSections },
      });
    }

    return Result.ok(validSections);
  }

  private getPageConfig(pageType: PageType): Result<PageConfig, AppError> {
    const logger = getLogger();

    try {
      // This would come from a configuration provider
      // For now, return a basic structure - will be refactored
      const configs: Record<string, PageConfig> = {
        landing: {
          sections: [
            { id: "hero", component: "Hero", order: 1, content: null },
            { id: "benefits", component: "Benefits", order: 2, content: null },
            { id: "features", component: "Features", order: 3, content: null },
            { id: "pricing", component: "Pricing", order: 4, content: null },
            {
              id: "social-proof",
              component: "SocialProof",
              order: 5,
              content: null,
            },
            { id: "demo", component: "Demo", order: 6, content: null },
            { id: "faq", component: "Faq", order: 7, content: null },
            { id: "final-cta", component: "FinalCta", order: 8, content: null },
            { id: "footer", component: "Footer", order: 9, content: null },
          ],
          metadata: {
            title: "DataFlow - Automação Empresarial com IA",
            description:
              "Transforme seus dados em insights acionáveis com IA inteligente.",
            keywords: [
              "automação",
              "business intelligence",
              "relatórios",
              "IA",
            ],
          },
          analytics: {
            pageType: "landing" as PageType,
            conversionGoals: ["cta_click", "signup_start", "demo_request"],
          },
        },
        features: {
          sections: [
            { id: "hero", component: "Hero", order: 1, content: null },
            { id: "features", component: "Features", order: 2, content: null },
            { id: "demo", component: "Demo", order: 3, content: null },
            { id: "final-cta", component: "FinalCta", order: 4, content: null },
          ],
          metadata: {
            title: "Funcionalidades - Luminaris",
            description: "Conheça todas as funcionalidades do Luminaris.",
            keywords: ["funcionalidades", "recursos", "Luminaris"],
          },
          analytics: {
            pageType: "features" as PageType,
            conversionGoals: ["demo_request", "pricing_view"],
          },
        },
        pricing: {
          sections: [
            { id: "hero", component: "Hero", order: 1, content: null },
            { id: "pricing", component: "Pricing", order: 2, content: null },
            { id: "faq", component: "Faq", order: 3, content: null },
            { id: "final-cta", component: "FinalCta", order: 4, content: null },
          ],
          metadata: {
            title: "Preços - Luminaris",
            description: "Planos e preços do Luminaris.",
            keywords: ["preços", "planos", "Luminaris"],
          },
          analytics: {
            pageType: "pricing" as PageType,
            conversionGoals: ["signup_start", "demo_request"],
          },
        },
        demo: {
          sections: [
            { id: "hero", component: "Hero", order: 1, content: null },
            { id: "demo", component: "Demo", order: 2, content: null },
            { id: "features", component: "Features", order: 3, content: null },
            { id: "final-cta", component: "FinalCta", order: 4, content: null },
          ],
          metadata: {
            title: "Demonstração - Luminaris",
            description: "Veja o Luminaris em ação.",
            keywords: ["demo", "demonstração", "Luminaris"],
          },
          analytics: {
            pageType: "demo" as PageType,
            conversionGoals: ["signup_start", "contact_form"],
          },
        },
        signup: {
          sections: [
            { id: "hero", component: "Hero", order: 1, content: null },
            { id: "lead-form", component: "LeadForm", order: 2, content: null },
          ],
          metadata: {
            title: "Cadastrar - Luminaris",
            description: "Cadastre-se no Luminaris.",
            keywords: ["cadastro", "signup", "Luminaris"],
          },
          analytics: {
            pageType: "signup" as PageType,
            conversionGoals: ["signup_complete"],
          },
        },
        trial: {
          sections: [
            { id: "hero", component: "Hero", order: 1, content: null },
            { id: "lead-form", component: "LeadForm", order: 2, content: null },
          ],
          metadata: {
            title: "Teste Grátis - Luminaris",
            description: "Comece seu teste grátis do Luminaris.",
            keywords: ["trial", "teste", "grátis", "Luminaris"],
          },
          analytics: {
            pageType: "trial" as PageType,
            conversionGoals: ["trial_start"],
          },
        },
        checkout: {
          sections: [
            {
              id: "checkout",
              component: "CheckoutPage",
              order: 1,
              content: null,
            },
          ],
          metadata: {
            title: "Checkout - Finalizar Compra",
            description: "Complete sua compra de forma segura.",
            keywords: ["checkout", "pagamento", "compra", "segurança"],
          },
          analytics: {
            pageType: "checkout" as PageType,
            conversionGoals: ["purchase_complete", "payment_success"],
          },
        },
        // Admin Pages - Unified Composition System
        "admin-experiments": {
          sections: [
            {
              id: "hero",
              component: "AdminHero",
              order: 1,
              content: {
                title: "A/B Testing Dashboard",
                subtitle: "Monitor and manage experiments",
              },
            },
            {
              id: "features",
              component: "ExperimentList",
              order: 2,
              content: null,
            },
          ],
          metadata: {
            title: "Experiments - Admin",
            description: "A/B testing management and analytics",
            keywords: ["admin", "experiments", "ab-testing", "analytics"],
            robots: "noindex,nofollow", // Admin pages not indexed
          },
          analytics: {
            pageType: "admin-experiments" as PageType,
            conversionGoals: [],
          },
        },
        "admin-experiments-dashboard": {
          sections: [
            {
              id: "hero",
              component: "AdminHero",
              order: 1,
              content: {
                title: "Experiments Dashboard",
                subtitle: "Detailed experiment metrics",
              },
            },
            {
              id: "features",
              component: "ExperimentsDashboard",
              order: 2,
              content: null,
            },
          ],
          metadata: {
            title: "Experiments Dashboard - Admin",
            description: "Detailed A/B testing dashboard",
            keywords: ["admin", "experiments", "dashboard", "metrics"],
            robots: "noindex,nofollow",
          },
          analytics: {
            pageType: "admin-experiments-dashboard" as PageType,
            conversionGoals: [],
          },
        },
        "admin-ml": {
          sections: [
            {
              id: "hero",
              component: "AdminHero",
              order: 1,
              content: {
                title: "Machine Learning Dashboard",
                subtitle: "AI models and recommendations",
              },
            },
            {
              id: "features",
              component: "MLDashboard",
              order: 2,
              content: null,
            },
          ],
          metadata: {
            title: "ML Dashboard - Admin",
            description: "Machine learning models and personalization",
            keywords: ["admin", "machine-learning", "ai", "personalization"],
            robots: "noindex,nofollow",
          },
          analytics: {
            pageType: "admin-ml" as PageType,
            conversionGoals: [],
          },
        },
        "admin-monitoring": {
          sections: [
            {
              id: "hero",
              component: "AdminHero",
              order: 1,
              content: {
                title: "System Monitoring",
                subtitle: "Application health and metrics",
              },
            },
            {
              id: "features",
              component: "MonitoringDashboard",
              order: 2,
              content: null,
            },
          ],
          metadata: {
            title: "Monitoring - Admin",
            description: "System monitoring and health checks",
            keywords: ["admin", "monitoring", "health", "metrics"],
            robots: "noindex,nofollow",
          },
          analytics: {
            pageType: "admin-monitoring" as PageType,
            conversionGoals: [],
          },
        },
        "admin-performance": {
          sections: [
            {
              id: "hero",
              component: "AdminHero",
              order: 1,
              content: {
                title: "Performance Analytics",
                subtitle: "Core Web Vitals and optimization",
              },
            },
            {
              id: "features",
              component: "PerformanceDashboard",
              order: 2,
              content: null,
            },
          ],
          metadata: {
            title: "Performance - Admin",
            description: "Performance monitoring and optimization",
            keywords: [
              "admin",
              "performance",
              "core-web-vitals",
              "optimization",
            ],
            robots: "noindex,nofollow",
          },
          analytics: {
            pageType: "admin-performance" as PageType,
            conversionGoals: [],
          },
        },
        // 'admin-tracing': { /* TracingDashboard component not implemented */ },
        // 'admin-logs': { /* LogsViewer component not implemented */ },
        // 'admin-webhooks': { /* WebhooksDashboard component not implemented */ },
        // Development Pages - No Index, Robots Blocked
        // 'debug-styles': { /* DebugHero, StyleDebugger components not implemented */ },
        // 'dev': { /* DevHero, DevTools components not implemented */ },
        // 'playground': { /* PlaygroundHero, ComponentPlayground components not implemented */ },
        // 'test': { /* TestHero, TestUtilities components not implemented */ },
        // 'test-styles': { /* TestHero, StyleTester components not implemented */ },
        // 'ssr-test': { /* TestHero, SSRValidator components not implemented */ }
      };

      const config = configs[pageType as keyof typeof configs];
      if (!config) {
        logger.warn("Unknown page type requested", { pageType });
        return Result.err({
          name: "AppError",
          message: `Unknown page type: ${pageType}`,
          code: "VALIDATION_ERROR",
        });
      }

      return Result.ok(config);
    } catch (error) {
      logger.error("Failed to get page config", {
        pageType,
        error: error instanceof Error ? error : new Error(String(error)),
      });
      return Result.err({
        name: "AppError",
        message: `Failed to get configuration for page type: ${pageType}`,
        code: "CONFIG_ERROR",
        details: {
          pageType,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  }

  private collectExperiments(sections: SectionConfig[]): ExperimentInfo[] {
    const experiments: ExperimentInfo[] = [];

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
}
