import type { SectionId } from "../registry/section-registry";
import { SectionRegistry } from "../registry/section-registry";

// ===== LOADING PRIORITIES =====
export enum LoadingPriority {
  IMMEDIATE = 0, // Load immediately (critical sections)
  HIGH = 1, // Load soon after (important sections)
  MEDIUM = 2, // Load on viewport (secondary sections)
  LOW = 3, // Load on user interaction (rarely used)
  DEFERRED = 4, // Load only when needed (very rarely used)
}

// ===== LOADING TRIGGERS =====
export enum LoadingTrigger {
  IMMEDIATE = "immediate", // Load right away
  VIEWPORT = "viewport", // Load when in viewport
  SCROLL_POSITION = "scroll_position", // Load at specific scroll position
  USER_INTERACTION = "user_interaction", // Load on user action
  TIME_DELAY = "time_delay", // Load after time delay
  NETWORK_IDLE = "network_idle", // Load when network is idle
  DEVICE_CAPABLE = "device_capable", // Load based on device capabilities
}

// ===== LOADING CONTEXT =====
export interface LoadingContext {
  pageType: string;
  scrollPosition: number;
  viewportHeight: number;
  devicePixelRatio: number;
  connectionSpeed: "slow" | "fast" | "unknown";
  hasUserInteracted: boolean;
  timeSincePageLoad: number;
  sectionsAboveFold: SectionId[];
  criticalPathCompleted: boolean;
}

// ===== LOADING RULE =====
export interface LoadingRule {
  priority: LoadingPriority;
  trigger: LoadingTrigger;
  condition: (context: LoadingContext) => boolean;
  rootMargin?: string;
  threshold?: number;
  delay?: number;
  dependencies?: SectionId[];
}

// ===== SECTION LOADING POLICY =====
export interface SectionLoadingPolicy {
  sectionId: SectionId;
  rules: LoadingRule[];
  fallbackRule: LoadingRule;
}

// ===== LAZY LOADING POLICY CLASS =====
export class LazyLoadingPolicy {
  private static readonly policies = new Map<SectionId, SectionLoadingPolicy>();

  // Initialize policies for all sections
  static initializePolicies(): void {
    console.log(
      "[LazyLoadingPolicy] Initializing loading policies for all sections",
    );

    // Get all sections from registry
    const allSections = SectionRegistry.getAllSectionIds();

    for (const sectionId of allSections) {
      this.createPolicyForSection(sectionId);
    }

    console.log(
      `[LazyLoadingPolicy] Initialized policies for ${this.policies.size} sections`,
    );
  }

  /**
   * Create loading policy for a specific section
   */
  private static createPolicyForSection(sectionId: SectionId): void {
    const criticality = SectionRegistry.getCriticality(sectionId);

    let rules: LoadingRule[] = [];
    let fallbackRule: LoadingRule;

    switch (criticality) {
      case "critical":
        // Critical sections: Always load immediately
        rules = [
          {
            priority: LoadingPriority.IMMEDIATE,
            trigger: LoadingTrigger.IMMEDIATE,
            condition: () => true,
          },
        ];
        fallbackRule = rules[0];
        break;

      case "important":
        // Important sections: Load on viewport or scroll position
        rules = [
          {
            priority: LoadingPriority.HIGH,
            trigger: LoadingTrigger.VIEWPORT,
            condition: (context) => this.isSectionAboveFold(sectionId, context),
            rootMargin: "100px",
            threshold: 0.1,
          },
          {
            priority: LoadingPriority.HIGH,
            trigger: LoadingTrigger.SCROLL_POSITION,
            condition: (context) => context.scrollPosition > 100,
            rootMargin: "200px",
          },
          {
            priority: LoadingPriority.MEDIUM,
            trigger: LoadingTrigger.TIME_DELAY,
            condition: (context) => context.timeSincePageLoad > 1000,
            delay: 1000,
          },
        ];
        fallbackRule = {
          priority: LoadingPriority.MEDIUM,
          trigger: LoadingTrigger.VIEWPORT,
          condition: () => true,
          rootMargin: "300px",
          threshold: 0.1,
        };
        break;

      case "secondary":
        // Secondary sections: Load on viewport or user interaction
        rules = [
          {
            priority: LoadingPriority.MEDIUM,
            trigger: LoadingTrigger.VIEWPORT,
            condition: (context) =>
              !context.hasUserInteracted ||
              this.isSectionNearViewport(sectionId, context),
            rootMargin: "300px",
            threshold: 0.1,
          },
          {
            priority: LoadingPriority.LOW,
            trigger: LoadingTrigger.USER_INTERACTION,
            condition: (context) => context.hasUserInteracted,
            dependencies: ["hero", "benefits"], // Wait for key sections
          },
          {
            priority: LoadingPriority.LOW,
            trigger: LoadingTrigger.NETWORK_IDLE,
            condition: (context) =>
              context.connectionSpeed === "fast" &&
              context.timeSincePageLoad > 3000,
            delay: 3000,
          },
        ];
        fallbackRule = {
          priority: LoadingPriority.DEFERRED,
          trigger: LoadingTrigger.USER_INTERACTION,
          condition: () => true,
        };
        break;
    }

    this.policies.set(sectionId, {
      sectionId,
      rules,
      fallbackRule,
    });
  }

  /**
   * Get loading decision for a section
   */
  static getLoadingDecision(
    sectionId: SectionId,
    context: LoadingContext,
  ): {
    shouldLoad: boolean;
    priority: LoadingPriority;
    trigger: LoadingTrigger;
    config: {
      rootMargin?: string;
      threshold?: number;
      delay?: number;
    };
  } {
    const policy = this.policies.get(sectionId);

    if (!policy) {
      console.warn(
        `[LazyLoadingPolicy] No policy found for section: ${sectionId}`,
      );
      return {
        shouldLoad: true, // Default to loading
        priority: LoadingPriority.MEDIUM,
        trigger: LoadingTrigger.VIEWPORT,
        config: { rootMargin: "300px", threshold: 0.1 },
      };
    }

    // Evaluate rules in priority order
    for (const rule of policy.rules) {
      if (rule.condition(context)) {
        console.log(`[LazyLoadingPolicy] Section ${sectionId} matches rule:`, {
          priority: rule.priority,
          trigger: rule.trigger,
        });

        return {
          shouldLoad: true,
          priority: rule.priority,
          trigger: rule.trigger,
          config: {
            rootMargin: rule.rootMargin,
            threshold: rule.threshold,
            delay: rule.delay,
          },
        };
      }
    }

    // Fallback rule
    console.log(`[LazyLoadingPolicy] Section ${sectionId} using fallback rule`);

    return {
      shouldLoad: true,
      priority: policy.fallbackRule.priority,
      trigger: policy.fallbackRule.trigger,
      config: {
        rootMargin: policy.fallbackRule.rootMargin,
        threshold: policy.fallbackRule.threshold,
        delay: policy.fallbackRule.delay,
      },
    };
  }

  /**
   * Get loading priority for a section
   */
  static getLoadingPriority(
    sectionId: SectionId,
    context: LoadingContext,
  ): LoadingPriority {
    return this.getLoadingDecision(sectionId, context).priority;
  }

  /**
   * Check if section should be lazy loaded
   */
  static shouldLazyLoad(
    sectionId: SectionId,
    context: LoadingContext,
  ): boolean {
    // Critical sections are never lazy loaded
    if (SectionRegistry.getCriticality(sectionId) === "critical") {
      return false;
    }

    const decision = this.getLoadingDecision(sectionId, context);
    return decision.priority > LoadingPriority.IMMEDIATE;
  }

  /**
   * Get intersection observer config for a section
   */
  static getIntersectionConfig(
    sectionId: SectionId,
    context: LoadingContext,
  ): IntersectionObserverInit | null {
    const decision = this.getLoadingDecision(sectionId, context);

    if (decision.trigger !== LoadingTrigger.VIEWPORT) {
      return null;
    }

    return {
      rootMargin: decision.config.rootMargin || "300px",
      threshold: decision.config.threshold || 0.1,
    };
  }

  /**
   * Check if section dependencies are met
   */
  static areDependenciesMet(
    sectionId: SectionId,
    loadedSections: Set<SectionId>,
  ): boolean {
    const policy = this.policies.get(sectionId);

    if (!policy) {
      return true; // No dependencies defined
    }

    // Check if all dependencies are loaded
    for (const rule of policy.rules) {
      if (rule.dependencies) {
        const allDepsLoaded = rule.dependencies.every((dep) =>
          loadedSections.has(dep),
        );
        if (!allDepsLoaded) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Get sections that should be loaded immediately
   */
  static getImmediateLoadSections(context: LoadingContext): SectionId[] {
    return SectionRegistry.getAllSectionIds().filter((sectionId) => {
      const decision = this.getLoadingDecision(sectionId, context);
      return decision.priority === LoadingPriority.IMMEDIATE;
    });
  }

  /**
   * Get sections that should be loaded on viewport
   */
  static getViewportLoadSections(context: LoadingContext): SectionId[] {
    return SectionRegistry.getAllSectionIds().filter((sectionId) => {
      const decision = this.getLoadingDecision(sectionId, context);
      return decision.trigger === LoadingTrigger.VIEWPORT;
    });
  }

  // ===== HELPER METHODS =====

  private static isSectionAboveFold(
    sectionId: SectionId,
    context: LoadingContext,
  ): boolean {
    return context.sectionsAboveFold.includes(sectionId);
  }

  private static isSectionNearViewport(
    sectionId: SectionId,
    context: LoadingContext,
  ): boolean {
    // This would need actual DOM measurement in a real implementation
    // For now, assume sections are near viewport if user has scrolled
    return context.scrollPosition > 50;
  }

  /**
   * Update loading context based on current page state
   */
  static createLoadingContext(
    pageType: string,
    scrollPosition: number = 0,
    viewportHeight: number = 768,
    devicePixelRatio: number = 1,
    connectionSpeed: "slow" | "fast" | "unknown" = "unknown",
    hasUserInteracted: boolean = false,
    timeSincePageLoad: number = 0,
    sectionsAboveFold: SectionId[] = [],
    criticalPathCompleted: boolean = false,
  ): LoadingContext {
    return {
      pageType,
      scrollPosition,
      viewportHeight,
      devicePixelRatio,
      connectionSpeed,
      hasUserInteracted,
      timeSincePageLoad,
      sectionsAboveFold,
      criticalPathCompleted,
    };
  }

  /**
   * Get policy statistics for debugging
   */
  static getPolicyStats(): {
    totalSections: number;
    immediateLoadSections: number;
    viewportLoadSections: number;
    deferredLoadSections: number;
  } {
    const allSections = SectionRegistry.getAllSectionIds();
    const context = this.createLoadingContext("landing");

    const immediateLoadSections = allSections.filter(
      (sectionId) =>
        this.getLoadingDecision(sectionId, context).priority ===
        LoadingPriority.IMMEDIATE,
    ).length;

    const viewportLoadSections = allSections.filter(
      (sectionId) =>
        this.getLoadingDecision(sectionId, context).trigger ===
        LoadingTrigger.VIEWPORT,
    ).length;

    const deferredLoadSections = allSections.filter(
      (sectionId) =>
        this.getLoadingDecision(sectionId, context).priority >=
        LoadingPriority.LOW,
    ).length;

    return {
      totalSections: allSections.length,
      immediateLoadSections,
      viewportLoadSections,
      deferredLoadSections,
    };
  }
}
