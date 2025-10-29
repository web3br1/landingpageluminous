// Content Mapper - Single Responsibility: Map section content from domain
// Application Layer Service implementing IContentMapper

import {
  AppError,
  SectionId,
  PageType,
  SectionContent,
  CompositionContext,
  Result,
} from "../ports";
import {
  IContentMapper,
  IExperimentService,
  IPerformanceMonitor,
  IErrorTracker,
} from "../ports";
import { logger } from "@/lib/logger";
import { ContentNormalizer } from "../content/content-normalizer";

// ===== COMPOSITION LOGGING HELPERS =====

interface CompositionLogContext {
  sectionId: SectionId;
  pageType: PageType;
  context?: CompositionContext;
  traceId?: string;
  experimentId?: string;
  variantId?: string;
  duration?: number;
  cacheStatus?: "hit" | "miss";
  fallbackUsed?: boolean;
  error?: string;
}

function logCompositionStart(context: CompositionLogContext): void {
  logger.info("Composer execution started", {
    event: "composer_start",
    sectionId: context.sectionId,
    pageType: context.pageType,
    traceId: context.traceId || generateTraceId(),
    experimentId: context.experimentId,
    cacheStatus: context.cacheStatus,
    contextExperiments: context.context?.experiments
      ? Object.keys(context.context.experiments)
      : undefined,
    hasFeatureFlags: !!context.context?.featureFlags,
  });
}

function logCompositionSuccess(context: CompositionLogContext): void {
  logger.info("Composer execution completed", {
    event: "composer_success",
    sectionId: context.sectionId,
    pageType: context.pageType,
    traceId: context.traceId || generateTraceId(),
    experimentId: context.experimentId,
    variantId: context.variantId,
    duration: context.duration,
    cacheStatus: context.cacheStatus,
    fallbackUsed: context.fallbackUsed,
  });
}

function logCompositionError(context: CompositionLogContext): void {
  const logEntry = {
    event: "composer_error",
    sectionId: context.sectionId,
    pageType: context.pageType,
    traceId: context.traceId || generateTraceId(),
    experimentId: context.experimentId,
    duration: context.duration,
    error: context.error,
    fallbackUsed: context.fallbackUsed,
  };

  logger.error("Composer execution failed", logEntry);

  // Process for alerts
  try {
    const { processLogForAlerts } = require("@/lib/monitoring/smart-alerts");
    processLogForAlerts(logEntry);
  } catch (e) {
    // Alert system not available, continue
  }
}

function logComposerValidation(
  context: Omit<CompositionLogContext, "sectionId"> & {
    composerId: string;
    result: "success" | "failure";
  },
): void {
  logger.info("Composer validation completed", {
    event: "composer_validation",
    composerId: context.composerId,
    pageType: context.pageType,
    traceId: context.traceId || generateTraceId(),
    result: context.result,
    duration: context.duration,
    error: context.result === "failure" ? context.error : undefined,
  });
}

function generateTraceId(): string {
  return `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ===== COMPOSER EXECUTION HELPER =====

async function executeComposerWithLogging<T>(
  composerId: string,
  composerFn: () => T,
  pageType: PageType,
  traceId: string,
): Promise<T> {
  const startTime = performance.now();

  try {
    const result = composerFn();
    const duration = performance.now() - startTime;

    // Handle both Result<T, E> and direct return types
    const isResult =
      result && typeof result === "object" && "success" in result;
    const success = isResult ? (result as any).success : true;
    const error =
      isResult && !(result as any).success
        ? (result as any).error?.message
        : undefined;

    logComposerValidation({
      composerId,
      pageType,
      traceId,
      result: success ? "success" : "failure",
      duration,
      error,
    });

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;

    logComposerValidation({
      composerId,
      pageType,
      traceId,
      result: "failure",
      duration,
      error: error instanceof Error ? error.message : String(error),
    });

    throw error;
  }
}

export class ContentMapper implements IContentMapper {
  constructor(
    private readonly experimentService: IExperimentService,
    private readonly performanceMonitor: IPerformanceMonitor,
    private readonly errorTracker: IErrorTracker,
  ) {}

  // @timed('content_mapper.map_section')
  async mapSectionContent(
    sectionId: SectionId,
    pageType: PageType,
    context?: CompositionContext,
  ): Promise<Result<SectionContent, AppError>> {
    const traceId = generateTraceId();
    const timer = this.performanceMonitor.startTimer(
      `map_section_${sectionId}`,
    );

    try {
      // Log composition start with structured data
      logCompositionStart({
        sectionId,
        pageType,
        context,
        traceId,
      });

      // Apply experiments first
      const experimentContext = await this.applyExperiments(sectionId, context);

      // Map content based on section type
      const contentResult = await this.mapContentBySection(
        sectionId,
        pageType,
        experimentContext,
        traceId,
      );

      if (!contentResult.success) {
        const durationResult = await this.performanceMonitor.endTimer(timer);

        // Log structured error
        logCompositionError({
          sectionId,
          pageType,
          context,
          traceId,
          duration: 0,
          error:
            (contentResult as any).error?.message || "Unknown mapping error",
          fallbackUsed: false,
        });

        await this.errorTracker.captureException(
          new Error(`Content mapping failed for section ${sectionId}`),
          { sectionId, pageType, error: (contentResult as any).error, traceId },
        );
        return contentResult;
      }

      // Duration not available in sync method
      const durationValue = 0;

      // Log successful composition
      logCompositionSuccess({
        sectionId,
        pageType,
        context,
        traceId,
        duration: durationValue,
        cacheStatus: "miss", // TODO: Implement cache status tracking
        fallbackUsed: false,
      });

      await this.performanceMonitor.recordMetric(
        "section_content_mapping_duration",
        durationValue,
        { section_id: sectionId, page_type: pageType },
      );

      return contentResult;
    } catch (error) {
      // Duration not available in sync method
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Log structured error
      logCompositionError({
        sectionId,
        pageType,
        context,
        traceId,
        duration: 0,
        error: errorMessage,
        fallbackUsed: false,
      });

      await this.errorTracker.captureException(error as Error, {
        sectionId,
        pageType,
        operation: "map_section_content",
        traceId,
      });

      return {
        success: false,
        error: {
          name: "AppError",
          message: `Failed to map content for section ${sectionId}`,
          code: "INTERNAL_ERROR",
          cause: error as Error,
        },
      };
    }
  }

  mapSectionContentSync(
    sectionId: SectionId,
    pageType: PageType,
    context?: CompositionContext,
  ): Result<SectionContent, AppError> {
    const traceId = generateTraceId();
    const timer = this.performanceMonitor.startTimer(
      `map_section_${sectionId}`,
    );

    try {
      // Log composition start with structured data
      logCompositionStart({
        sectionId,
        pageType,
        context,
        traceId,
      });

      // Apply experiments first
      const experimentContext = this.applyExperimentsSync(sectionId, context);

      // Map content based on section type
      const contentResult = this.mapContentBySectionSync(
        sectionId,
        pageType,
        experimentContext,
      );

      if (!contentResult.success) {
        // Log structured error (sync version for sync method)
        logCompositionError({
          sectionId,
          pageType,
          context,
          traceId,
          duration: 0, // Duration not available in sync method
          error:
            (contentResult as any).error?.message || "Unknown mapping error",
          fallbackUsed: false,
        });

        this.errorTracker.captureException(
          new Error(`Content mapping failed for section ${sectionId}`),
          { sectionId, pageType, error: (contentResult as any).error, traceId },
        );
        return contentResult;
      }

      const durationResult = this.performanceMonitor.endTimer(timer);

      // Log successful composition (sync version)
      logCompositionSuccess({
        sectionId,
        pageType,
        context,
        traceId,
        duration: 0, // Duration not available in sync method
        cacheStatus: "miss", // TODO: Implement cache status tracking
        fallbackUsed: false,
      });

      this.performanceMonitor.recordMetric(
        "section_content_mapping_duration",
        0, // Duration not available in sync method
        { section_id: sectionId, page_type: pageType },
      );

      return contentResult;
    } catch (error) {
      // Duration not available in sync method
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      // Log structured error
      logCompositionError({
        sectionId,
        pageType,
        context,
        traceId,
        duration: 0,
        error: errorMessage,
        fallbackUsed: false,
      });

      this.errorTracker.captureException(error as Error, {
        sectionId,
        pageType,
        operation: "map_section_content",
        traceId,
      });

      return {
        success: false,
        error: {
          name: "AppError",
          message: `Failed to map content for section ${sectionId}`,
          code: "INTERNAL_ERROR",
          cause: error as Error,
        },
      };
    }
  }

  private async applyExperiments(
    sectionId: SectionId,
    context?: CompositionContext,
  ): Promise<CompositionContext> {
    // Sync version - simplified experiment application
    return context || {};
  }

  private applyExperimentsSync(
    sectionId: SectionId,
    context?: CompositionContext,
  ): CompositionContext {
    // Sync version - simplified experiment application
    return context || {};
  }

  private async mapContentBySection(
    sectionId: SectionId,
    pageType: PageType,
    context?: CompositionContext,
    traceId?: string,
  ): Promise<Result<SectionContent, AppError>> {
    // Dynamic import to avoid circular dependencies and enable code splitting
    try {
      // Import composer based on section ID
      let composedContent: any;

      const transformComposerResult = (result: any): SectionContent => {
        // If result is already in SectionContent format, return as-is
        if (result && typeof result === "object" && result.content) {
          return {
            ...result.content,
            envelope: result.envelope,
          };
        }
        // Return as-is if already in correct format
        return result;
      };

      switch (sectionId) {
        case "hero":
          const { composeHeroContent } = await import(
            "@/domains/marketing/composers/hero-composer"
          );
          const heroResult = await executeComposerWithLogging(
            "hero-composer",
            composeHeroContent,
            pageType,
            traceId || generateTraceId(),
          );
          composedContent = transformComposerResult(heroResult);
          break;
        case "benefits":
          const { composeBenefitsContent } = await import(
            "@/domains/marketing/composers/benefits-composer"
          );
          const benefitsResult = await executeComposerWithLogging(
            "benefits-composer",
            composeBenefitsContent,
            pageType,
            traceId || generateTraceId(),
          );
          composedContent = transformComposerResult(benefitsResult);
          break;
        case "features":
          const { composeFeaturesContent } = await import(
            "@/domains/marketing/composers/features-composer"
          );
          const featuresResult = await executeComposerWithLogging(
            "features-composer",
            composeFeaturesContent,
            pageType,
            traceId || generateTraceId(),
          );
          composedContent = transformComposerResult(featuresResult);
          break;
        case "pricing":
          const { composePricingContent } = await import(
            "@/domains/marketing/composers/pricing-composer"
          );
          const pricingResult = await executeComposerWithLogging(
            "pricing-composer",
            composePricingContent,
            pageType,
            traceId || generateTraceId(),
          );
          composedContent = transformComposerResult(pricingResult);
          break;
        case "social-proof":
          const { defaultSocialProofComposer } = await import(
            "@/domains/marketing/composers/social-proof-composer"
          );
          const socialProofResult = await executeComposerWithLogging(
            "social-proof-composer",
            defaultSocialProofComposer,
            pageType,
            traceId || generateTraceId(),
          );
          composedContent = transformComposerResult(socialProofResult);
          break;
        case "faq":
          const { composeFaqContent } = await import(
            "@/domains/marketing/composers/faq-composer"
          );
          const faqResult = await executeComposerWithLogging(
            "faq-composer",
            composeFaqContent,
            pageType,
            traceId || generateTraceId(),
          );
          composedContent = transformComposerResult(faqResult);
          break;
        case "demo":
          const { composeDemoContent } = await import(
            "@/domains/marketing/composers/demo-composer"
          );
          const demoResult = await executeComposerWithLogging(
            "demo-composer",
            composeDemoContent,
            pageType,
            traceId || generateTraceId(),
          );
          composedContent = transformComposerResult(demoResult);
          break;
        case "final-cta":
          const { defaultFinalCtaComposer } = await import(
            "@/domains/marketing/composers/final-cta-composer"
          );
          const finalCtaResult = await executeComposerWithLogging(
            "final-cta-composer",
            defaultFinalCtaComposer,
            pageType,
            traceId || generateTraceId(),
          );
          composedContent = transformComposerResult(finalCtaResult);
          break;
        case "footer":
          const { composeFooterContent } = await import(
            "@/domains/marketing/composers/footer-composer"
          );
          const footerResult = await executeComposerWithLogging(
            "footer-composer",
            composeFooterContent,
            pageType,
            traceId || generateTraceId(),
          );
          composedContent = transformComposerResult(footerResult);
          break;
        default:
          // Return fallback content for unknown sections
          console.warn("Unknown section ID, using fallback", { sectionId });
          const mockContent = ContentNormalizer.getDefaultContent(sectionId);
          return Result.ok(this.wrapWithVariant(mockContent, sectionId));
      }

      // Normalize content before returning
      const normalizedContent = ContentNormalizer.normalizeContent(
        sectionId,
        composedContent,
      );
      return Result.ok(this.wrapWithVariant(normalizedContent, sectionId));
    } catch (error) {
      console.error("Section content mapping failed", {
        sectionId,
        pageType,
        error: error instanceof Error ? error.message : String(error),
      });

      this.errorTracker.captureException(error as Error, {
        sectionId,
        pageType,
        operation: "map_content_by_section",
      });

      return {
        success: false,
        error: {
          name: "AppError",
          message: `Failed to map content for section ${sectionId}`,
          code: "INTERNAL_ERROR",
          cause: error as Error,
        },
      };
    }
  }

  private mapContentBySectionSync(
    sectionId: SectionId,
    pageType: PageType,
    context?: CompositionContext,
  ): Result<SectionContent, AppError> {
    try {
      // Import composer based on section ID
      let composedContent: any;

      const transformComposerResult = (result: any): SectionContent => {
        // If result is already in SectionContent format, return as-is
        if (result && typeof result === "object" && result.content) {
          return {
            ...result.content,
            envelope: result.envelope,
          };
        }
        // Return as-is if already in correct format
        return result;
      };

      switch (sectionId) {
        case "hero":
          const {
            composeHeroContent,
          } = require("@/domains/marketing/composers/hero-composer");
          composedContent = transformComposerResult(composeHeroContent());
          break;
        case "benefits":
          const {
            composeBenefitsContent,
          } = require("@/domains/marketing/composers/benefits-composer");
          composedContent = transformComposerResult(composeBenefitsContent());
          break;
        case "features":
          const {
            composeFeaturesContent,
          } = require("@/domains/marketing/composers/features-composer");
          composedContent = transformComposerResult(composeFeaturesContent());
          break;
        case "pricing":
          const {
            composePricingContent,
          } = require("@/domains/marketing/composers/pricing-composer");
          composedContent = transformComposerResult(composePricingContent());
          break;
        case "social-proof":
          const {
            defaultSocialProofComposer,
          } = require("@/domains/marketing/composers/social-proof-composer");
          composedContent = transformComposerResult(
            defaultSocialProofComposer(),
          );
          break;
        case "faq":
          const {
            composeFaqContent,
          } = require("@/domains/marketing/composers/faq-composer");
          composedContent = transformComposerResult(composeFaqContent());
          break;
        case "demo":
          const {
            composeDemoContent,
          } = require("@/domains/marketing/composers/demo-composer");
          composedContent = transformComposerResult(composeDemoContent());
          break;
        case "final-cta":
          const {
            defaultFinalCtaComposer,
          } = require("@/domains/marketing/composers/final-cta-composer");
          composedContent = transformComposerResult(defaultFinalCtaComposer());
          break;
        case "footer":
          const {
            composeFooterContent,
          } = require("@/domains/marketing/composers/footer-composer");
          composedContent = transformComposerResult(composeFooterContent());
          break;
        default:
          // Return fallback content for unknown sections
          console.warn("Unknown section ID, using fallback", { sectionId });
          const mockContent = ContentNormalizer.getDefaultContent(sectionId);
          return Result.ok(this.wrapWithVariant(mockContent, sectionId));
      }

      // Normalize content before returning
      const normalizedContent = ContentNormalizer.normalizeContent(
        sectionId,
        composedContent,
      );
      return Result.ok(this.wrapWithVariant(normalizedContent, sectionId));
    } catch (error) {
      console.error("Section content mapping failed", {
        sectionId,
        pageType,
        error: error instanceof Error ? error.message : String(error),
      });

      this.errorTracker.captureException(error as Error, {
        sectionId,
        pageType,
        operation: "map_content_by_section_sync",
      });

      return {
        success: false,
        error: {
          name: "AppError",
          message: `Failed to map content for section ${sectionId}`,
          code: "INTERNAL_ERROR",
          cause: error as Error,
        },
      };
    }
  }

  private async applyHeroExperiments(
    content: SectionContent,
    context?: CompositionContext,
  ): Promise<Result<SectionContent, AppError>> {
    return Result.ok(content);
  }

  private applyHeroExperimentsSync(
    content: SectionContent,
    context?: CompositionContext,
  ): Result<SectionContent, AppError> {
    return Result.ok(content);
  }

  private applyHeroHeadlineVariant(
    content: SectionContent,
    variant: string,
  ): SectionContent {
    // Apply variant logic here
    return content;
  }

  private wrapWithVariant(content: any, sectionId: string): SectionContent {
    return {
      ...content,
      _variant: {
        id: "default",
        name: "Default Variant",
        description: `Default variant for ${sectionId}`,
        weight: 100,
      },
      _metadata: {
        sectionId,
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      },
    };
  }
}
