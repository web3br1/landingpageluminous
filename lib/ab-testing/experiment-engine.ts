"use client";

import React from "react";
import { getSSRAdapter } from "../composition/container";

// Experiment types and interfaces
export interface ExperimentVariant {
  id: string;
  name: string;
  weight: number; // 0-100 percentage
  component?: React.ComponentType<any>;
  props?: Record<string, any>;
  style?: Record<string, any>;
  content?: any;
}

export interface Experiment {
  id: string;
  name: string;
  description?: string;
  status: "draft" | "active" | "paused" | "completed";
  variants: ExperimentVariant[];
  trafficAllocation: number; // 0-100 percentage of total traffic
  targetAudience?: {
    userTypes?: string[];
    countries?: string[];
    devices?: ("mobile" | "tablet" | "desktop")[];
    browsers?: string[];
  };
  goals: {
    primary: string; // e.g., 'cta_click', 'signup_conversion'
    secondary?: string[];
  };
  startDate?: Date;
  endDate?: Date;
  minSampleSize?: number;
  statisticalSignificance?: number; // 0-100
  winner?: string; // variant ID
  results?: ExperimentResults;
}

export interface ExperimentResults {
  variant: string;
  visitors: number;
  conversions: number;
  conversionRate: number;
  confidence: number;
  statisticalSignificance: boolean;
  uplift: number; // percentage improvement
  timestamp: Date;
}

// Core experiment engine
export class ExperimentEngine {
  private experiments: Map<string, Experiment> = new Map();
  private userAssignments: Map<string, Map<string, string>> = new Map(); // userId -> experimentId -> variantId

  constructor() {
    this.loadExperiments();
  }

  // Load experiments from storage/API
  private async loadExperiments(): Promise<void> {
    try {
      // In production, load from database/API
      // For now, load from localStorage or default config
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("ab_experiments");
        if (stored) {
          const experiments = JSON.parse(stored);
          Object.entries(experiments).forEach(([id, exp]: [string, any]) => {
            this.experiments.set(id, {
              ...exp,
              startDate: exp.startDate ? new Date(exp.startDate) : undefined,
              endDate: exp.endDate ? new Date(exp.endDate) : undefined,
            });
          });
        }
      }
      this.loadDefaultExperiments();
    } catch (error) {
      console.warn("Failed to load experiments:", error);
      this.loadDefaultExperiments();
    }
  }

  // Load default experiments for demonstration
  private loadDefaultExperiments(): void {
    const defaultExperiments: Experiment[] = [
      {
        id: "hero_headline_test",
        name: "Hero Headline Optimization",
        description: "Test different hero headlines for better engagement",
        status: "active",
        trafficAllocation: 100,
        variants: [
          {
            id: "control",
            name: "Control",
            weight: 50,
            content: {
              headline: "Automatize seus dados. Acelere seus resultados.",
              subheadline:
                "Conecte, orquestre e acelere seus fluxos — sem fricção.",
            },
          },
          {
            id: "variant_a",
            name: "Benefit Focused",
            weight: 25,
            content: {
              headline: "Transforme Dados em Decisões Inteligentes",
              subheadline: "Da entrevista ao sistema operacional em minutos.",
            },
          },
          {
            id: "variant_b",
            name: "Social Proof",
            weight: 25,
            content: {
              headline: "Junte-se a 10.000+ Empresas",
              subheadline:
                "Confiam na DataFlow para automatizar seus processos.",
            },
          },
        ],
        goals: {
          primary: "cta_click",
          secondary: ["hero_scroll", "time_on_page"],
        },
        minSampleSize: 1000,
        statisticalSignificance: 95,
      },
      {
        id: "pricing_layout_test",
        name: "Pricing Table Layout",
        description: "Test different pricing table layouts",
        status: "draft",
        trafficAllocation: 50,
        variants: [
          {
            id: "control",
            name: "Current Layout",
            weight: 70,
            content: { layout: "standard" },
          },
          {
            id: "variant_a",
            name: "Simplified",
            weight: 30,
            content: { layout: "simplified" },
          },
        ],
        goals: {
          primary: "pricing_interaction",
          secondary: ["plan_selection", "signup_start"],
        },
      },
    ];

    defaultExperiments.forEach((exp) => {
      if (!this.experiments.has(exp.id)) {
        this.experiments.set(exp.id, exp);
      }
    });
  }

  // Get active experiment for user
  getExperimentForUser(
    experimentId: string,
    userId: string,
  ): Experiment | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== "active") {
      return null;
    }

    // Check if user should see this experiment (traffic allocation)
    if (Math.random() * 100 > experiment.trafficAllocation) {
      return null;
    }

    return experiment;
  }

  // Assign variant to user
  assignVariantToUser(experimentId: string, userId: string): string | null {
    const experiment = this.getExperimentForUser(experimentId, userId);
    if (!experiment) return null;

    // Check if user already assigned
    if (!this.userAssignments.has(userId)) {
      this.userAssignments.set(userId, new Map());
    }

    const userExps = this.userAssignments.get(userId)!;
    if (userExps.has(experimentId)) {
      return userExps.get(experimentId)!;
    }

    // Assign variant based on weights
    const variant = this.selectVariantByWeight(experiment.variants);
    userExps.set(experimentId, variant.id);

    // Persist assignment
    this.persistUserAssignments();

    return variant.id;
  }

  // Select variant based on weights
  private selectVariantByWeight(
    variants: ExperimentVariant[],
  ): ExperimentVariant {
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    let random = Math.random() * totalWeight;

    for (const variant of variants) {
      random -= variant.weight;
      if (random <= 0) {
        return variant;
      }
    }

    return variants[0]; // fallback
  }

  // Track experiment event
  trackExperimentEvent(
    experimentId: string,
    variantId: string,
    userId: string,
    event: string,
    metadata?: Record<string, any>,
  ): void {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return;

    // In production, send to analytics service
    console.log(
      `[Experiment:${experimentId}] User:${userId} Variant:${variantId} Event:${event}`,
      metadata,
    );

    if (typeof window !== "undefined" && (window as any).analytics) {
      (window as any).analytics.track("experiment_event", {
        experimentId,
        variantId,
        userId,
        event,
        metadata,
        timestamp: new Date().toISOString(),
      });
    }

    // Update results if it's a goal event
    if (
      experiment.goals.primary === event ||
      experiment.goals.secondary?.includes(event)
    ) {
      this.updateExperimentResults(experimentId, variantId, event);
    }
  }

  // Update experiment results
  private updateExperimentResults(
    experimentId: string,
    variantId: string,
    event: string,
  ): void {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return;

    // Initialize results if not exists
    if (!experiment.results) {
      experiment.results = {
        variant: variantId,
        visitors: 0,
        conversions: 0,
        conversionRate: 0,
        confidence: 0,
        statisticalSignificance: false,
        uplift: 0,
        timestamp: new Date(),
      };
    }

    // Update metrics (simplified)
    if (event === "page_view") {
      experiment.results.visitors++;
    } else if (experiment.goals.primary === event) {
      experiment.results.conversions++;
    }

    experiment.results.conversionRate =
      experiment.results.visitors > 0
        ? (experiment.results.conversions / experiment.results.visitors) * 100
        : 0;

    // Calculate statistical significance (simplified)
    experiment.results.statisticalSignificance =
      experiment.results.visitors >= (experiment.minSampleSize || 1000);

    this.persistExperiments();
  }

  // Get experiment results
  getExperimentResults(experimentId: string): ExperimentResults | null {
    const experiment = this.experiments.get(experimentId);
    return experiment?.results || null;
  }

  // Check if experiment should end (statistical significance reached)
  shouldEndExperiment(experimentId: string): boolean {
    const results = this.getExperimentResults(experimentId);
    if (!results) return false;

    const experiment = this.experiments.get(experimentId);
    if (!experiment) return false;

    return (
      results.visitors >= (experiment.minSampleSize || 1000) &&
      results.confidence >= (experiment.statisticalSignificance || 95)
    );
  }

  // End experiment and declare winner
  endExperiment(experimentId: string, winnerVariantId?: string): void {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return;

    experiment.status = "completed";

    if (winnerVariantId) {
      experiment.winner = winnerVariantId;
    } else {
      // Auto-select winner based on best conversion rate
      const variants = experiment.variants;
      let bestVariant = variants[0];
      let bestRate = 0;

      // This is a simplified calculation - in reality would use proper statistical testing
      variants.forEach((variant) => {
        const results = this.getExperimentResults(experimentId);
        if (
          results &&
          results.variant === variant.id &&
          results.conversionRate > bestRate
        ) {
          bestVariant = variant;
          bestRate = results.conversionRate;
        }
      });

      experiment.winner = bestVariant.id;
    }

    this.persistExperiments();
  }

  // Persist experiments to storage
  private persistExperiments(): void {
    if (typeof window === "undefined") return;

    try {
      const experimentsObj = Object.fromEntries(this.experiments);
      localStorage.setItem("ab_experiments", JSON.stringify(experimentsObj));
    } catch (error) {
      console.warn("Failed to persist experiments:", error);
    }
  }

  // Persist user assignments
  private persistUserAssignments(): void {
    if (typeof window === "undefined") return;

    try {
      const assignments = Object.fromEntries(
        Array.from(this.userAssignments.entries()).map(([userId, exps]) => [
          userId,
          Object.fromEntries(exps),
        ]),
      );
      localStorage.setItem("ab_user_assignments", JSON.stringify(assignments));
    } catch (error) {
      console.warn("Failed to persist user assignments:", error);
    }
  }

  // Get all experiments
  getAllExperiments(): Experiment[] {
    return Array.from(this.experiments.values());
  }

  // Get experiments map (for internal use)
  get experimentsMap(): Map<string, Experiment> {
    return this.experiments;
  }

  // Get active experiments
  getActiveExperiments(): Experiment[] {
    return Array.from(this.experiments.values()).filter(
      (exp) => exp.status === "active",
    );
  }

  // Create new experiment
  createExperiment(experiment: Omit<Experiment, "id">): string {
    const id = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newExperiment: Experiment = {
      ...experiment,
      id,
      status: experiment.status || "draft",
    };

    this.experiments.set(id, newExperiment);
    this.persistExperiments();

    return id;
  }

  // Update experiment
  updateExperiment(id: string, updates: Partial<Experiment>): void {
    const experiment = this.experiments.get(id);
    if (!experiment) return;

    this.experiments.set(id, { ...experiment, ...updates });
    this.persistExperiments();
  }

  // Delete experiment
  deleteExperiment(id: string): void {
    this.experiments.delete(id);
    this.persistExperiments();
  }
}

// Singleton instance
export const experimentEngine = new ExperimentEngine();

// Export useExperimentEngine for compatibility
export const useExperimentEngine = () => ({
  experimentEngine,
  getExperimentForUser: (id: string, userId: string) =>
    experimentEngine.getExperimentForUser(id, userId),
  assignVariantToUser: (id: string, userId: string) =>
    experimentEngine.assignVariantToUser(id, userId),
  trackExperimentEvent: (
    id: string,
    variantId: string,
    userId: string,
    event: string,
    metadata?: any,
  ) =>
    experimentEngine.trackExperimentEvent(
      id,
      variantId,
      userId,
      event,
      metadata,
    ),
});

// React hook for using experiments
export function useExperiment(experimentId: string) {
  const ssrAdapter = getSSRAdapter();
  const [variantId, setVariantId] = React.useState<string | null>(null);
  const [experiment, setExperiment] = React.useState<Experiment | null>(null);

  React.useEffect(() => {
    if (ssrAdapter.isServerContext()) return;

    // Get user ID (simplified - in production use proper user identification)
    const userId = getUserId();

    // Get experiment
    const exp = experimentEngine.getExperimentForUser(experimentId, userId);
    setExperiment(exp);

    if (exp) {
      // Assign variant
      const assignedVariant = experimentEngine.assignVariantToUser(
        experimentId,
        userId,
      );
      setVariantId(assignedVariant);

      // Track page view
      experimentEngine.trackExperimentEvent(
        experimentId,
        assignedVariant || "",
        userId,
        "page_view",
      );
    }
  }, [experimentId, ssrAdapter]);

  const trackEvent = React.useCallback(
    (event: string, metadata?: Record<string, any>) => {
      if (variantId && experiment) {
        const userId = getUserId();
        experimentEngine.trackExperimentEvent(
          experiment.id,
          variantId,
          userId,
          event,
          metadata,
        );
      }
    },
    [variantId, experiment],
  );

  return {
    variantId,
    experiment,
    trackEvent,
    isInExperiment: !!experiment && !!variantId,
  };
}

// Utility function to get user ID
function getUserId(): string {
  if (typeof window === "undefined") return "server-user";

  let userId = sessionStorage.getItem("ab_user_id");
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem("ab_user_id", userId);
  }
  return userId;
}

// HOC for experiment components
export function withExperiment<P extends object>(
  experimentId: string,
  componentMap: Record<string, React.ComponentType<P>>,
) {
  return function ExperimentComponent(props: P) {
    const { variantId } = useExperiment(experimentId);

    if (!variantId || !componentMap[variantId]) {
      const DefaultComponent = componentMap.default || componentMap.control;
      return DefaultComponent
        ? React.createElement(DefaultComponent, props)
        : null;
    }

    const VariantComponent = componentMap[variantId];
    return React.createElement(VariantComponent, props);
  };
}

// Utility to get variant content
export function getVariantContent(
  experimentId: string,
  variantId: string,
): any {
  const experiment = experimentEngine.experimentsMap.get(experimentId);
  if (!experiment) return null;

  const variant = experiment.variants.find((v) => v.id === variantId);
  return variant?.content || null;
}
