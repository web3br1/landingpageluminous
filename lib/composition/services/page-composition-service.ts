/**
 * Page Composition Service - Sprint T6
 * Service for composing pages from content and experiments
 */

import { ContentMapperService } from "./content-mapper";
import { ExperimentService } from "./experiment-service";
import { ValidationService } from "./validation-service";

/**
 * Composition options for page composition
 */
export interface CompositionOptions {
  skipCache?: boolean;
  includeExperiments?: boolean;
  validateContent?: boolean;
  maxCompositionTime?: number;
  fallbackOnError?: boolean;
}

/**
 * Page composition context
 */
export interface PageCompositionContext {
  pageId: string;
  locale?: string;
  userId?: string;
  experimentId?: string;
  variant?: string;
  preview?: boolean;
  timestamp: number;
}

/**
 * Composed page result
 */
export interface ComposedPage {
  id: string;
  sections: ComposedSection[];
  metadata: {
    title: string;
    description: string;
    canonicalUrl: string;
    ogImage?: string;
  };
  experiments: Array<{
    id: string;
    variant: string;
    section: string;
  }>;
  performance: {
    compositionTime: number;
    cacheHit: boolean;
  };
}

/**
 * Composed section
 */
export interface ComposedSection {
  id: string;
  type: string;
  content: Record<string, unknown>;
  experiment?: {
    id: string;
    variant: string;
  };
  performance?: {
    renderTime?: number;
    cacheHit?: boolean;
  };
}

/**
 * Page composition service
 */
export class PageCompositionService {
  private static instance: PageCompositionService;
  private contentMapper: ContentMapperService;
  private experimentService: ExperimentService;
  private validationService: ValidationService;

  private constructor() {
    this.contentMapper = ContentMapperService.getInstance();
    this.experimentService = ExperimentService.getInstance();
    this.validationService = ValidationService.getInstance();
  }

  static getInstance(): PageCompositionService {
    if (!PageCompositionService.instance) {
      PageCompositionService.instance = new PageCompositionService();
    }
    return PageCompositionService.instance;
  }

  /**
   * Compose a page from content and experiments
   */
  async composePage(
    context: PageCompositionContext,
    sectionConfigs: Array<{
      type: string;
      config?: Record<string, unknown>;
    }>
  ): Promise<ComposedPage> {
    const startTime = Date.now();

    try {
      // Validate context
      await this.validationService.validateContext(context);

      // Get experiment assignments
      const experiments = await this.experimentService.getExperimentsForPage(context);

      // Compose sections
      const sections = await Promise.all(
        sectionConfigs.map(async (config, index) => {
          const experiment = experiments.find(exp => exp.section === config.type);

          const section: ComposedSection = {
            id: `${config.type}-${index}`,
            type: config.type,
            content: await this.contentMapper.mapContent(
              config.type,
              {
                ...config.config,
                experimentId: experiment?.id,
                variant: experiment?.variant,
              },
              context
            ),
            experiment,
          };

          return section;
        })
      );

      // Generate metadata
      const metadata = await this.generateMetadata(context, sections);

      const compositionTime = Date.now() - startTime;

      return {
        id: context.pageId,
        sections,
        metadata,
        experiments: experiments.map(exp => ({
          id: exp.id,
          variant: exp.variant,
          section: exp.section,
        })),
        performance: {
          compositionTime,
          cacheHit: false, // TODO: Implement caching
        },
      };
    } catch (error) {
      console.error("[PageCompositionService] Failed to compose page:", error);
      throw error;
    }
  }

  /**
   * Generate page metadata
   */
  private async generateMetadata(
    context: PageCompositionContext,
    sections: ComposedSection[]
  ): Promise<ComposedPage['metadata']> {
    // Get hero section for primary metadata
    const heroSection = sections.find(s => s.type === 'hero');
    const title = heroSection?.content?.headline as string || "Default Title";
    const description = heroSection?.content?.subheadline as string || "Default Description";

    return {
      title,
      description,
      canonicalUrl: `/${context.locale || 'pt-BR'}/${context.pageId}`,
      ogImage: heroSection?.content?.visual as string,
    };
  }

  /**
   * Warm up composition cache
   */
  async warmUpCache(pages: string[]): Promise<void> {
    console.log(`[PageCompositionService] Warming up cache for ${pages.length} pages`);

    await Promise.all(
      pages.map(async (pageId) => {
        try {
          await this.composePage(
            {
              pageId,
              timestamp: Date.now(),
            },
            [] // Empty sections for cache warming
          );
        } catch (error) {
          console.warn(`[PageCompositionService] Failed to warm up cache for ${pageId}:`, error);
        }
      })
    );
  }

  /**
   * Invalidate composition cache
   */
  async invalidateCache(pattern?: string): Promise<void> {
    // TODO: Implement cache invalidation
    console.log(`[PageCompositionService] Invalidating cache with pattern: ${pattern || '*'}`);
  }
}
