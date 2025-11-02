"use client";

import { logger } from "../../observability/logger";
import { storageManager, AtomicStorage } from "./storage-manager";

/**
 * Performance Profiler - Phase 3 Correction
 * Solves H3.15: Performance profiling granular
 */

export interface PerformanceProfile {
  id: string;
  sessionId: string;
  timestamp: number;
  componentBreakdown: ComponentProfile[];
  pipelineMetrics: PipelineMetrics;
  resourceUsage: ResourceUsage;
  bottlenecks: Bottleneck[];
  recommendations: PerformanceRecommendation[];
  overall: {
    totalDuration: number;
    criticalPath: string[];
    score: number; // 0-100 performance score
  };
}

export interface ComponentProfile {
  componentId: string;
  componentType: "intersection_observer" | "dynamic_import" | "image_loading" | "script_loading" | "rendering" | "network_request" | "cache_lookup" | "rule_evaluation" | "threshold_calculation";
  startTime: number;
  endTime?: number;
  duration?: number;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  metadata: Record<string, any>;

  // Performance metrics
  cpuTime?: number; // CPU time used
  networkTime?: number; // Network time (for network operations)
  renderTime?: number; // Rendering time
  memoryDelta?: number; // Memory usage change

  // Sub-components (for nested operations)
  subComponents?: ComponentProfile[];
}

export interface PipelineMetrics {
  totalPipelineTime: number;
  stageBreakdown: {
    detection: number; // Intersection observer, etc.
    decision: number; // Rule evaluation, threshold calculation
    loading: number; // Dynamic imports, asset loading
    rendering: number; // Component rendering
    cleanup: number; // Memory cleanup, cache updates
  };
  parallelOperations: number;
  sequentialOperations: number;
  idleTime: number; // Time spent waiting
}

export interface ResourceUsage {
  memoryUsage: {
    peak: number;
    average: number;
    delta: number;
  };
  cpuUsage: {
    userTime: number;
    systemTime: number;
    totalTime: number;
  };
  networkUsage: {
    requests: number;
    bytesTransferred: number;
    cacheHitRate: number;
  };
  batteryImpact?: {
    powerConsumption: number;
    thermalState: "nominal" | "fair" | "serious" | "critical";
  };
}

export interface Bottleneck {
  type: "cpu_bound" | "memory_bound" | "network_bound" | "render_bound" | "concurrent_limit";
  severity: "low" | "medium" | "high" | "critical";
  componentId: string;
  description: string;
  impact: number; // Performance impact percentage
  evidence: string[];
  mitigation?: string;
}

export interface PerformanceRecommendation {
  type: "optimization" | "parallelization" | "caching" | "lazy_loading" | "code_splitting";
  priority: "low" | "medium" | "high";
  componentId: string;
  description: string;
  expectedBenefit: number; // Expected performance improvement %
  implementationEffort: "minimal" | "moderate" | "significant";
  codeExample?: string;
}

/**
 * Performance Profiler Core
 */
export class PerformanceProfiler {
  private activeProfiles: Map<string, PerformanceProfile> = new Map();
  private componentStack: ComponentProfile[] = [];
  private static instance: PerformanceProfiler;
  private initialized = false;

  constructor() {
    this.activeProfiles = new Map();
    this.componentStack = [];
  }

  static getInstance(): PerformanceProfiler {
    if (!PerformanceProfiler.instance) {
      PerformanceProfiler.instance = new PerformanceProfiler();
    }
    return PerformanceProfiler.instance;
  }

  /**
   * Initialize the profiler
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Set up performance observer if available
    this.setupPerformanceObserver();

    this.initialized = true;

    logger.info("Performance Profiler initialized", {
      event: "ll_performance_profiler_initialized",
    });
  }

  /**
   * Start profiling a new session
   */
  async startSession(sessionId: string): Promise<string> {
    await this.initialize();

    const profileId = `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const profile: PerformanceProfile = {
      id: profileId,
      sessionId,
      timestamp: Date.now(),
      componentBreakdown: [],
      pipelineMetrics: {
        totalPipelineTime: 0,
        stageBreakdown: {
          detection: 0,
          decision: 0,
          loading: 0,
          rendering: 0,
          cleanup: 0,
        },
        parallelOperations: 0,
        sequentialOperations: 0,
        idleTime: 0,
      },
      resourceUsage: {
        memoryUsage: {
          peak: 0,
          average: 0,
          delta: 0,
        },
        cpuUsage: {
          userTime: 0,
          systemTime: 0,
          totalTime: 0,
        },
        networkUsage: {
          requests: 0,
          bytesTransferred: 0,
          cacheHitRate: 0,
        },
      },
      bottlenecks: [],
      recommendations: [],
      overall: {
        totalDuration: 0,
        criticalPath: [],
        score: 0,
      },
    };

    this.activeProfiles.set(profileId, profile);

    // Record initial memory usage
    this.recordMemoryUsage(profileId);

    logger.info("Started performance profiling session", {
      event: "ll_performance_session_started",
      ll_profile_id: profileId,
      ll_session_id: sessionId,
    });

    return profileId;
  }

  /**
   * Start profiling a component
   */
  startComponent(
    profileId: string,
    componentId: string,
    componentType: ComponentProfile["componentType"],
    metadata: Record<string, any> = {}
  ): void {
    const profile = this.activeProfiles.get(profileId);
    if (!profile) return;

    const component: ComponentProfile = {
      componentId,
      componentType,
      startTime: performance.now(),
      status: "running",
      metadata,
    };

    // Add to current component's sub-components if we have a parent
    if (this.componentStack.length > 0) {
      const parent = this.componentStack[this.componentStack.length - 1];
      if (!parent.subComponents) parent.subComponents = [];
      parent.subComponents.push(component);
    } else {
      // Top-level component
      profile.componentBreakdown.push(component);
    }

    this.componentStack.push(component);

    logger.debug("Started component profiling", {
      event: "ll_component_profiling_started",
      ll_profile_id: profileId,
      ll_component_id: componentId,
      ll_component_type: componentType,
    });
  }

  /**
   * End profiling a component
   */
  endComponent(
    profileId: string,
    componentId: string,
    status: ComponentProfile["status"] = "completed",
    additionalMetrics: {
      cpuTime?: number;
      networkTime?: number;
      renderTime?: number;
      memoryDelta?: number;
    } = {}
  ): void {
    const profile = this.activeProfiles.get(profileId);
    if (!profile) return;

    // Find the component (could be nested)
    const component = this.findComponent(componentId, profile.componentBreakdown);
    if (!component) {
      logger.warn("Component not found for profiling end", {
        event: "ll_component_not_found",
        ll_profile_id: profileId,
        ll_component_id: componentId,
      });
      return;
    }

    component.endTime = performance.now();
    component.duration = component.endTime - component.startTime;
    component.status = status;

    // Add additional metrics
    Object.assign(component, additionalMetrics);

    // Pop from stack
    if (this.componentStack.length > 0) {
      this.componentStack.pop();
    }

    logger.debug("Ended component profiling", {
      event: "ll_component_profiling_ended",
      ll_profile_id: profileId,
      ll_component_id: componentId,
      ll_duration: component.duration,
      ll_status: status,
    });
  }

  /**
   * Record a performance event
   */
  recordEvent(
    profileId: string,
    eventType: "cache_hit" | "cache_miss" | "network_request" | "render_block" | "memory_spike",
    data: Record<string, any>
  ): void {
    const profile = this.activeProfiles.get(profileId);
    if (!profile) return;

    // Update resource usage based on event
    switch (eventType) {
      case "cache_hit":
        profile.resourceUsage.networkUsage.requests++;
        profile.resourceUsage.networkUsage.cacheHitRate =
          (profile.resourceUsage.networkUsage.cacheHitRate * (profile.resourceUsage.networkUsage.requests - 1) + 1) /
          profile.resourceUsage.networkUsage.requests;
        break;

      case "cache_miss":
        profile.resourceUsage.networkUsage.requests++;
        profile.resourceUsage.networkUsage.cacheHitRate =
          (profile.resourceUsage.networkUsage.cacheHitRate * (profile.resourceUsage.networkUsage.requests - 1)) /
          profile.resourceUsage.networkUsage.requests;
        break;

      case "network_request":
        profile.resourceUsage.networkUsage.requests++;
        if (data.bytesTransferred) {
          profile.resourceUsage.networkUsage.bytesTransferred += data.bytesTransferred;
        }
        break;

      case "memory_spike":
        this.recordMemoryUsage(profileId);
        break;
    }

    logger.debug("Recorded performance event", {
      event: "ll_performance_event_recorded",
      ll_profile_id: profileId,
      ll_event_type: eventType,
      ll_event_data: data,
    });
  }

  /**
   * Complete profiling session and generate analysis
   */
  async completeSession(profileId: string): Promise<PerformanceProfile | null> {
    const profile = this.activeProfiles.get(profileId);
    if (!profile) return null;

    // Calculate final metrics
    this.calculateFinalMetrics(profile);

    // Identify bottlenecks
    this.identifyBottlenecks(profile);

    // Generate recommendations
    this.generateRecommendations(profile);

    // Calculate overall performance score
    profile.overall.score = this.calculatePerformanceScore(profile);

    // Remove from active profiles
    this.activeProfiles.delete(profileId);

    // Persist profile for analysis
    await this.persistProfile(profile);

    logger.info("Completed performance profiling session", {
      event: "ll_performance_session_completed",
      ll_profile_id: profileId,
      ll_overall_score: profile.overall.score,
      ll_bottlenecks_found: profile.bottlenecks.length,
      ll_recommendations_count: profile.recommendations.length,
    });

    return profile;
  }

  /**
   * Calculate final metrics for the profile
   */
  private calculateFinalMetrics(profile: PerformanceProfile): void {
    const components = profile.componentBreakdown;
    const pipeline = profile.pipelineMetrics;

    // Calculate total pipeline time
    pipeline.totalPipelineTime = components.reduce((total, comp) => {
      return total + (comp.duration || 0);
    }, 0);

    // Calculate stage breakdown
    pipeline.stageBreakdown = {
      detection: this.sumComponentsByType(components, ["intersection_observer"]),
      decision: this.sumComponentsByType(components, ["rule_evaluation", "threshold_calculation"]),
      loading: this.sumComponentsByType(components, ["dynamic_import", "image_loading", "script_loading", "network_request"]),
      rendering: this.sumComponentsByType(components, ["rendering"]),
      cleanup: this.sumComponentsByType(components, ["cache_lookup"]),
    };

    // Count parallel vs sequential operations
    const operations = this.flattenComponents(components);
    pipeline.parallelOperations = operations.filter(comp => comp.metadata?.parallel === true).length;
    pipeline.sequentialOperations = operations.length - pipeline.parallelOperations;

    // Calculate idle time (simplified)
    const totalComponentTime = operations.reduce((sum, comp) => sum + (comp.duration || 0), 0);
    pipeline.idleTime = Math.max(0, pipeline.totalPipelineTime - totalComponentTime);

    // Update resource usage
    this.recordMemoryUsage(profile.id);

    // Calculate overall duration
    profile.overall.totalDuration = pipeline.totalPipelineTime;

    // Identify critical path (simplified - longest chain)
    profile.overall.criticalPath = this.findCriticalPath(components);
  }

  /**
   * Identify performance bottlenecks
   */
  private identifyBottlenecks(profile: PerformanceProfile): void {
    const components = this.flattenComponents(profile.componentBreakdown);
    const totalTime = profile.pipelineMetrics.totalPipelineTime;

    for (const component of components) {
      if (!component.duration) continue;

      const impactPercent = (component.duration / totalTime) * 100;
      let bottleneck: Bottleneck | null = null;

      // CPU-bound bottleneck
      if (component.cpuTime && component.cpuTime > component.duration * 0.8) {
        bottleneck = {
          type: "cpu_bound",
          severity: impactPercent > 20 ? "high" : impactPercent > 10 ? "medium" : "low",
          componentId: component.componentId,
          description: `High CPU usage in ${component.componentType}`,
          impact: impactPercent,
          evidence: [
            `CPU time: ${component.cpuTime}ms`,
            `Total duration: ${component.duration}ms`,
            `CPU ratio: ${(component.cpuTime / component.duration * 100).toFixed(1)}%`,
          ],
          mitigation: "Consider offloading heavy computations or optimizing algorithm",
        };
      }

      // Memory-bound bottleneck
      else if (component.memoryDelta && component.memoryDelta > 5 * 1024 * 1024) { // 5MB
        bottleneck = {
          type: "memory_bound",
          severity: impactPercent > 15 ? "high" : "medium",
          componentId: component.componentId,
          description: `High memory usage in ${component.componentType}`,
          impact: impactPercent,
          evidence: [
            `Memory delta: ${(component.memoryDelta / 1024 / 1024).toFixed(2)}MB`,
            `Duration: ${component.duration}ms`,
          ],
          mitigation: "Implement memory cleanup or reduce data processing",
        };
      }

      // Network-bound bottleneck
      else if (component.networkTime && component.networkTime > component.duration * 0.7) {
        bottleneck = {
          type: "network_bound",
          severity: impactPercent > 25 ? "high" : "medium",
          componentId: component.componentId,
          description: `Network bottleneck in ${component.componentType}`,
          impact: impactPercent,
          evidence: [
            `Network time: ${component.networkTime}ms`,
            `Total duration: ${component.duration}ms`,
            `Network ratio: ${(component.networkTime / component.duration * 100).toFixed(1)}%`,
          ],
          mitigation: "Optimize caching, reduce payload size, or use CDN",
        };
      }

      // Render-bound bottleneck
      else if (component.renderTime && component.renderTime > 16) { // > 1 frame at 60fps
        bottleneck = {
          type: "render_bound",
          severity: impactPercent > 10 ? "medium" : "low",
          componentId: component.componentId,
          description: `Rendering bottleneck in ${component.componentType}`,
          impact: impactPercent,
          evidence: [
            `Render time: ${component.renderTime}ms`,
            `Expected frame time: 16ms at 60fps`,
          ],
          mitigation: "Optimize rendering, reduce DOM manipulations, or virtualize",
        };
      }

      // Concurrent limit bottleneck
      else if (component.metadata?.concurrentLimitReached) {
        bottleneck = {
          type: "concurrent_limit",
          severity: "medium",
          componentId: component.componentId,
          description: `Concurrent operation limit reached`,
          impact: impactPercent * 1.5, // Extra impact due to queuing
          evidence: [
            "Concurrent limit was reached",
            `Operations queued: ${component.metadata.queuedOperations || 0}`,
          ],
          mitigation: "Increase concurrent limits or implement better queuing",
        };
      }

      if (bottleneck) {
        profile.bottlenecks.push(bottleneck);
      }
    }

    // Sort bottlenecks by impact
    profile.bottlenecks.sort((a, b) => b.impact - a.impact);
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(profile: PerformanceProfile): void {
    const recommendations: PerformanceRecommendation[] = [];

    // Recommendations based on bottlenecks
    for (const bottleneck of profile.bottlenecks) {
      switch (bottleneck.type) {
        case "cpu_bound":
          recommendations.push({
            type: "optimization",
            priority: bottleneck.severity === "high" ? "high" : "medium",
            componentId: bottleneck.componentId,
            description: "Optimize CPU-intensive operations",
            expectedBenefit: bottleneck.impact * 0.6, // 60% of bottleneck impact
            implementationEffort: "moderate",
            codeExample: "// Use Web Workers for heavy computations\nconst worker = new Worker('heavy-task.js');",
          });
          break;

        case "memory_bound":
          recommendations.push({
            type: "optimization",
            priority: bottleneck.severity === "high" ? "high" : "medium",
            componentId: bottleneck.componentId,
            description: "Implement memory cleanup and optimization",
            expectedBenefit: bottleneck.impact * 0.5,
            implementationEffort: "moderate",
            codeExample: "// Clean up unused references\nunusedArray = null;\nif (window.gc) window.gc();",
          });
          break;

        case "network_bound":
          recommendations.push({
            type: "caching",
            priority: "high",
            componentId: bottleneck.componentId,
            description: "Improve caching strategy for network requests",
            expectedBenefit: bottleneck.impact * 0.8,
            implementationEffort: "moderate",
            codeExample: "// Implement service worker caching\ncaches.open('v1').then(cache => cache.add(request));",
          });
          break;

        case "render_bound":
          recommendations.push({
            type: "optimization",
            priority: "medium",
            componentId: bottleneck.componentId,
            description: "Optimize rendering performance",
            expectedBenefit: bottleneck.impact * 0.4,
            implementationEffort: "minimal",
            codeExample: "// Use requestAnimationFrame for DOM updates\nrequestAnimationFrame(() => element.style.transform = 'translateX(100px)');",
          });
          break;
      }
    }

    // General recommendations based on pipeline metrics
    const pipeline = profile.pipelineMetrics;

    // High idle time suggests parallelization opportunities
    if (pipeline.idleTime > pipeline.totalPipelineTime * 0.3) {
      recommendations.push({
        type: "parallelization",
        priority: "medium",
        componentId: "pipeline",
        description: "Parallelize sequential operations to reduce idle time",
        expectedBenefit: (pipeline.idleTime / pipeline.totalPipelineTime) * 40,
        implementationEffort: "moderate",
        codeExample: "// Use Promise.all for parallel operations\nconst [result1, result2] = await Promise.all([op1(), op2()]);",
      });
    }

    // Low cache hit rate suggests caching improvements
    if (profile.resourceUsage.networkUsage.cacheHitRate < 0.7) {
      recommendations.push({
        type: "caching",
        priority: "high",
        componentId: "cache_system",
        description: "Improve cache hit rate through better caching strategies",
        expectedBenefit: (1 - profile.resourceUsage.networkUsage.cacheHitRate) * 30,
        implementationEffort: "significant",
      });
    }

    // Sort recommendations by priority and expected benefit
    recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];

      if (aPriority !== bPriority) return bPriority - aPriority;
      return b.expectedBenefit - a.expectedBenefit;
    });

    profile.recommendations = recommendations.slice(0, 10); // Top 10 recommendations
  }

  /**
   * Calculate overall performance score
   */
  private calculatePerformanceScore(profile: PerformanceProfile): number {
    let score = 100;

    // Deduct points based on various factors
    const pipeline = profile.pipelineMetrics;

    // Time-based deductions (LCP-like scoring)
    if (pipeline.totalPipelineTime > 4000) score -= 25;
    else if (pipeline.totalPipelineTime > 2500) score -= 15;
    else if (pipeline.totalPipelineTime > 1500) score -= 5;

    // Bottleneck deductions
    for (const bottleneck of profile.bottlenecks) {
      if (bottleneck.severity === "critical") score -= 15;
      else if (bottleneck.severity === "high") score -= 10;
      else if (bottleneck.severity === "medium") score -= 5;
    }

    // Resource usage deductions
    const memoryMB = profile.resourceUsage.memoryUsage.peak / (1024 * 1024);
    if (memoryMB > 100) score -= 10;
    else if (memoryMB > 50) score -= 5;

    // Network efficiency
    if (profile.resourceUsage.networkUsage.cacheHitRate < 0.5) score -= 10;
    else if (profile.resourceUsage.networkUsage.cacheHitRate < 0.7) score -= 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Helper methods
   */
  private findComponent(componentId: string, components: ComponentProfile[]): ComponentProfile | null {
    for (const component of components) {
      if (component.componentId === componentId) {
        return component;
      }
      if (component.subComponents) {
        const found = this.findComponent(componentId, component.subComponents);
        if (found) return found;
      }
    }
    return null;
  }

  private flattenComponents(components: ComponentProfile[]): ComponentProfile[] {
    const flattened: ComponentProfile[] = [];

    function flatten(comp: ComponentProfile) {
      flattened.push(comp);
      if (comp.subComponents) {
        comp.subComponents.forEach(flatten);
      }
    }

    components.forEach(flatten);
    return flattened;
  }

  private sumComponentsByType(components: ComponentProfile[], types: string[]): number {
    return this.flattenComponents(components)
      .filter(comp => types.includes(comp.componentType))
      .reduce((sum, comp) => sum + (comp.duration || 0), 0);
  }

  private findCriticalPath(components: ComponentProfile[]): string[] {
    // Simplified: find the chain with longest total duration
    const chains = this.findAllChains(components);
    let longestChain: string[] = [];
    let maxDuration = 0;

    for (const chain of chains) {
      const duration = chain.reduce((sum, compId) => {
        const comp = this.findComponent(compId, components);
        return sum + (comp?.duration || 0);
      }, 0);

      if (duration > maxDuration) {
        maxDuration = duration;
        longestChain = chain;
      }
    }

    return longestChain;
  }

  private findAllChains(components: ComponentProfile[]): string[][] {
    // Simplified: just return top-level component IDs
    return [components.map(c => c.componentId)];
  }

  private recordMemoryUsage(profileId: string): void {
    const profile = this.activeProfiles.get(profileId);
    if (!profile) return;

    if (performance.memory) {
      const currentUsage = (performance as any).memory.usedJSHeapSize;
      profile.resourceUsage.memoryUsage.peak = Math.max(
        profile.resourceUsage.memoryUsage.peak,
        currentUsage
      );

      // Update average (simplified rolling average)
      const count = profile.componentBreakdown.length || 1;
      profile.resourceUsage.memoryUsage.average =
        (profile.resourceUsage.memoryUsage.average * (count - 1) + currentUsage) / count;
    }
  }

  /**
   * Set up Performance Observer for automatic metrics collection
   */
  private setupPerformanceObserver(): void {
    if (typeof window === "undefined" || !window.PerformanceObserver) return;

    try {
      // Observe long tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          // Find active profile and record long task
          for (const [profileId, profile] of this.activeProfiles) {
            this.recordEvent(profileId, "render_block", {
              duration: entry.duration,
              startTime: entry.startTime,
            });
          }
        }
      });

      longTaskObserver.observe({ entryTypes: ["longtask"] });

      // Observe layout shifts
      const layoutShiftObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          for (const [profileId, profile] of this.activeProfiles) {
            profile.resourceUsage.memoryUsage.delta += entry.value || 0;
          }
        }
      });

      layoutShiftObserver.observe({ entryTypes: ["layout-shift"] });

    } catch (error) {
      logger.warn("Failed to set up performance observers", {
        event: "ll_performance_observers_failed",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Persist profile for analysis
   */
  private async persistProfile(profile: PerformanceProfile): Promise<void> {
    try {
      const profiles = storageManager.getItem("performance_profiles") || [];
      profiles.push(profile);

      // Keep only last 20 profiles
      if (profiles.length > 20) {
        profiles.splice(0, profiles.length - 20);
      }

      await AtomicStorage.atomicUpdate(
        "performance_profiles",
        () => profiles,
        []
      );
    } catch (error) {
      logger.error("Failed to persist performance profile", {
        event: "ll_performance_profile_persist_error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get profiling statistics
   */
  getStats() {
    return {
      initialized: this.initialized,
      activeProfiles: this.activeProfiles.size,
      componentStackDepth: this.componentStack.length,
    };
  }

  /**
   * Get recent profiles for analysis
   */
  getRecentProfiles(limit = 5): PerformanceProfile[] {
    const profiles = storageManager.getItem("performance_profiles") || [];
    return profiles.slice(-limit);
  }
}

// Export singleton
export const performanceProfiler = PerformanceProfiler.getInstance();
