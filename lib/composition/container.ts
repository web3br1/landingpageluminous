// Composition Container - Dependency Injection Container
// Manages service instantiation and dependency injection

import { PageCompositionService } from "./services/page-composition-service";
import { ContentMapperService } from "./services/content-mapper";
import { FallbackProvider } from "./services/fallback-provider";
import { SSRAdapter } from "./services/ssr-adapter";
import { createFallbackComposition } from "./page-composer";
import {
  createExperimentService,
  createAnalyticsService,
  createPerformanceMonitor,
  createErrorTracker,
  createSSRPerformanceMonitor,
  createSSRAnalyticsService,
  createSSRErrorTracker,
} from "./adapters/infrastructure-adapters";
import {
  getCompositionCache,
  getContentCache,
} from "./performance/content-cache";
import {
  IPageCompositionService,
  IContentMapper,
  IFallbackProvider,
  ISSRAdapter,
  IPerformanceMonitor,
  IAnalyticsService,
  IErrorTracker,
  IExperimentService,
} from "./ports";
import {
  IPageConfigurationProvider,
  PageConfigurationProvider,
} from "./services/page-configuration-provider";
import { Result } from "@/shared/core";

// Observability imports
import { logger } from "../observability/logger";
import { metrics } from "../observability/metrics";
import { tracer } from "../observability/tracer";

// Composition Container - Singleton pattern for service management
class CompositionContainer {
  private static instance: CompositionContainer;
  private services = new Map<string, unknown>();
  private initialized = false;

  private constructor() {
    // Initialize only core services that don't depend on window
    this.initializeCoreServices();
  }

  static getInstance(): CompositionContainer {
    if (!CompositionContainer.instance) {
      CompositionContainer.instance = new CompositionContainer();
    }
    return CompositionContainer.instance;
  }

  private initializeCoreServices(): void {
    // Core services that work on server and client
    const ssrAdapter = new SSRAdapter();

    // Ensure services map is initialized
    if (!this.services) {
      this.services = new Map<string, unknown>();
    }

    this.services.set("ISSRAdapter", ssrAdapter);
    this.services.set("IPageCompositionService", null); // Lazy initialized
    this.services.set("IContentMapper", null); // Lazy initialized
    this.services.set("IFallbackProvider", null); // Lazy initialized
  }

  private initializeInfrastructureServices(): void {
    if (this.initialized) return;

    // On server side, use SSR-safe implementations
    if (typeof window === "undefined") {
      const experimentService = createExperimentService();
      const analyticsService = createSSRAnalyticsService();
      const performanceMonitor = createSSRPerformanceMonitor();
      const errorTracker = createSSRErrorTracker();

      this.services.set("IExperimentService", experimentService);
      this.services.set("IAnalyticsService", analyticsService);
      this.services.set("IPerformanceMonitor", performanceMonitor);
      this.services.set("IErrorTracker", errorTracker);
      this.initialized = true;
      return;
    }

    // Infrastructure services (client side)
    const experimentService = createExperimentService();
    const analyticsService = createAnalyticsService();
    const performanceMonitor = createPerformanceMonitor();
    const errorTracker = createErrorTracker();

    this.services.set("IExperimentService", experimentService);
    this.services.set("IAnalyticsService", analyticsService);
    this.services.set("IPerformanceMonitor", performanceMonitor);
    this.services.set("IErrorTracker", errorTracker);

    this.initialized = true;
  }

  private initializeApplicationServices(): void {
    if (!this.services.get("IPageCompositionService")) {
      // Ensure infrastructure services are initialized
      this.initializeInfrastructureServices();

      const experimentService = this.services.get(
        "IExperimentService",
      ) as IExperimentService;
      const performanceMonitor = this.services.get(
        "IPerformanceMonitor",
      ) as IPerformanceMonitor;
      const errorTracker = this.services.get("IErrorTracker") as IErrorTracker;

      const fallbackProvider = new FallbackProvider();
      const contentMapper = ContentMapperService.getInstance();

      // Initialize configuration provider
      const configProvider = new PageConfigurationProvider();

      const pageCompositionService = PageCompositionService.getInstance();

      this.services.set("IFallbackProvider", fallbackProvider);
      this.services.set("IContentMapper", contentMapper);
      this.services.set("IPageConfigurationProvider", configProvider);
      this.services.set("IPageCompositionService", pageCompositionService);
    }
  }

  // Get service by interface
  getService<T>(interfaceName: string): T {
    const service = this.services.get(interfaceName);
    if (!service) {
      throw new Error(`Service not found for interface: ${interfaceName}`);
    }
    return service as T;
  }

  // Get specific services with proper typing
  get pageCompositionService(): IPageCompositionService {
    try {
      this.initializeApplicationServices();
      const service = this.getService<IPageCompositionService>(
        "IPageCompositionService",
      );
      if (!service) {
        throw new Error("PageCompositionService failed to initialize");
      }
      return service;
    } catch (error) {
      console.error("Failed to get PageCompositionService:", error);
      // Return a minimal stub that always returns a fallback
      return {
        composePage: async (pageType) =>
          Result.ok(createFallbackComposition(pageType, error)),
        composePageSync: (pageType) =>
          Result.ok(createFallbackComposition(pageType, error)),
      } as IPageCompositionService;
    }
  }

  get contentMapper(): IContentMapper {
    this.initializeApplicationServices();
    return this.getService<IContentMapper>("IContentMapper");
  }

  get fallbackProvider(): IFallbackProvider {
    this.initializeApplicationServices();
    return this.getService<IFallbackProvider>("IFallbackProvider");
  }

  get ssrAdapter(): ISSRAdapter {
    return this.getService<ISSRAdapter>("ISSRAdapter");
  }

  // Observability services
  get logger() {
    return logger;
  }

  get metrics() {
    return metrics;
  }

  get tracer() {
    return tracer;
  }

  get performanceMonitor() {
    this.initializeInfrastructureServices();
    return this.getService<IPerformanceMonitor>("IPerformanceMonitor");
  }

  get analyticsService() {
    this.initializeInfrastructureServices();
    return this.getService<IAnalyticsService>("IAnalyticsService");
  }

  get errorTracker() {
    this.initializeInfrastructureServices();
    return this.getService<IErrorTracker>("IErrorTracker");
  }

  // Utility methods for testing and development
  reset(): void {
    this.services.clear();
    this.initialized = false;
    this.initializeCoreServices();
  }

  replaceService<T>(interfaceName: string, service: T): void {
    this.services.set(interfaceName, service);
  }

  hasService(interfaceName: string): boolean {
    return this.services.has(interfaceName);
  }
}

// Export singleton instance
export const compositionContainer = CompositionContainer.getInstance();

// Convenience functions for accessing services
export function getPageCompositionService(): IPageCompositionService {
  return compositionContainer.pageCompositionService;
}

export function getContentMapper(): IContentMapper {
  return compositionContainer.contentMapper;
}

export function getFallbackProvider(): IFallbackProvider {
  return compositionContainer.fallbackProvider;
}

export function getSSRAdapter(): ISSRAdapter {
  return compositionContainer.ssrAdapter;
}

// Observability service getters
export function getLogger() {
  return compositionContainer.logger;
}

export function getMetrics() {
  return compositionContainer.metrics;
}

export function getTracer() {
  return compositionContainer.tracer;
}

export function getPerformanceMonitor() {
  return compositionContainer.performanceMonitor;
}

export { getCompositionCache, getContentCache };
