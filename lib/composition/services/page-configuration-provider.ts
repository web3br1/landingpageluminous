// Page Configuration Provider
// Single Responsibility: Provide page configurations
// Application Layer Service implementing IPageConfigurationProvider

import { AppError, PageType, Result, SectionId } from "../ports";
import { getLogger } from "../container";

// Internal types for configuration
export interface PageConfig {
  sections: SectionConfig[];
  metadata: PageMetadata;
  analytics: AnalyticsInfo;
}

export interface SectionConfig {
  id: SectionId;
  component: string;
  content: any;
  order: number;
}

export interface PageMetadata {
  title: string;
  description: string;
  keywords: readonly string[];
  robots?: string;
}

export interface AnalyticsInfo {
  pageType: PageType;
  conversionGoals: string[];
}

export interface IPageConfigurationProvider {
  getPageConfig(pageType: PageType): Result<PageConfig, AppError>;
}

// Configuration provider implementation
export class PageConfigurationProvider implements IPageConfigurationProvider {
  getPageConfig(pageType: PageType): Result<PageConfig, AppError> {
    const logger = getLogger();

    try {
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
        logger.warn("Unknown page type requested", {
          pageType,
          availableTypes: Object.keys(configs),
        });
        return Result.err({
          name: "AppError",
          message: `Unknown page type: ${pageType}`,
          code: "VALIDATION_ERROR",
        });
      }

      logger.debug("Configuration found", {
        pageType,
        sectionsCount: config.sections.length,
      });
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
}
