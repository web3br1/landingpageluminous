/**
 * Experiment Service - Sprint T6
 * Manages A/B testing experiments for page composition
 */

import { PageCompositionContext } from "./page-composition-service";

export interface Experiment {
  id: string;
  name: string;
  section: string;
  variants: Array<{
    id: string;
    name: string;
    weight: number;
  }>;
  status: 'active' | 'paused' | 'completed';
  startDate: Date;
  endDate?: Date;
  metrics: Array<{
    name: string;
    type: 'conversion' | 'engagement' | 'performance';
  }>;
}

export interface ExperimentAssignment {
  id: string;
  section: string;
  variant: string;
  experimentId: string;
}

/**
 * Experiment service
 */
export class ExperimentService {
  private static instance: ExperimentService;
  private experiments: Map<string, Experiment> = new Map();

  private constructor() {
    this.initializeDefaultExperiments();
  }

  static getInstance(): ExperimentService {
    if (!ExperimentService.instance) {
      ExperimentService.instance = new ExperimentService();
    }
    return ExperimentService.instance;
  }

  /**
   * Get experiments for a page
   */
  async getExperimentsForPage(context: PageCompositionContext): Promise<ExperimentAssignment[]> {
    const assignments: ExperimentAssignment[] = [];

    // Get active experiments
    const activeExperiments = Array.from(this.experiments.values())
      .filter(exp => exp.status === 'active');

    // Mock experiment assignment logic
    for (const experiment of activeExperiments) {
      const variant = this.assignVariant(experiment, context);
      if (variant) {
        assignments.push({
          id: `${experiment.id}_${context.userId || 'anonymous'}`,
          section: experiment.section,
          variant: variant.id,
          experimentId: experiment.id,
        });
      }
    }

    return assignments;
  }

  /**
   * Assign variant to user (mock implementation)
   */
  private assignVariant(experiment: Experiment, context: PageCompositionContext): Experiment['variants'][0] | null {
    // Simple deterministic assignment based on user ID
    const userIdentifier = context.userId || context.pageId;
    const hash = this.simpleHash(userIdentifier + experiment.id);
    const totalWeight = experiment.variants.reduce((sum, v) => sum + v.weight, 0);
    let cumulativeWeight = 0;

    for (const variant of experiment.variants) {
      cumulativeWeight += variant.weight;
      if (hash % totalWeight < cumulativeWeight) {
        return variant;
      }
    }

    return null;
  }

  /**
   * Simple hash function for deterministic assignment
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Track experiment conversion
   */
  async trackConversion(experimentId: string, variant: string, metric: string, value?: number): Promise<void> {
    // Mock tracking - in real implementation, this would send to analytics service
    console.log(`[ExperimentService] Conversion tracked: ${experimentId} - ${variant} - ${metric}`, { value });
  }

  /**
   * Get experiment results
   */
  async getExperimentResults(experimentId: string): Promise<{
    experiment: Experiment;
    variants: Array<{
      id: string;
      conversions: number;
      visitors: number;
      conversionRate: number;
    }>;
    winner?: string;
    confidence?: number;
  }> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    // Mock results
    const results = experiment.variants.map(variant => ({
      id: variant.id,
      conversions: Math.floor(Math.random() * 100) + 10,
      visitors: Math.floor(Math.random() * 1000) + 100,
      conversionRate: 0,
    }));

    // Calculate conversion rates
    results.forEach(result => {
      result.conversionRate = result.visitors > 0 ? result.conversions / result.visitors : 0;
    });

    // Determine winner (simple implementation)
    const winner = results.reduce((best, current) =>
      current.conversionRate > best.conversionRate ? current : best
    );

    return {
      experiment,
      variants: results,
      winner: winner.id,
      confidence: 0.95, // Mock confidence
    };
  }

  /**
   * Initialize default experiments
   */
  private initializeDefaultExperiments(): void {
    const defaultExperiments: Experiment[] = [
      {
        id: "hero_headline_test",
        name: "Hero Headline Test",
        section: "hero",
        variants: [
          { id: "control", name: "Control", weight: 50 },
          { id: "variant_a", name: "Variant A", weight: 25 },
          { id: "variant_b", name: "Variant B", weight: 25 },
        ],
        status: "active",
        startDate: new Date(),
        metrics: [
          { name: "cta_click", type: "conversion" },
          { name: "time_on_page", type: "engagement" },
        ],
      },
      {
        id: "pricing_layout_test",
        name: "Pricing Layout Test",
        section: "pricing",
        variants: [
          { id: "default", name: "Default", weight: 70 },
          { id: "featured", name: "Featured Plan", weight: 30 },
        ],
        status: "active",
        startDate: new Date(),
        metrics: [
          { name: "plan_selection", type: "conversion" },
          { name: "scroll_depth", type: "engagement" },
        ],
      },
    ];

    defaultExperiments.forEach(exp => {
      this.experiments.set(exp.id, exp);
    });
  }

  /**
   * Create new experiment
   */
  async createExperiment(experiment: Omit<Experiment, 'id'>): Promise<string> {
    const id = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.experiments.set(id, { ...experiment, id });
    return id;
  }

  /**
   * Update experiment
   */
  async updateExperiment(id: string, updates: Partial<Experiment>): Promise<void> {
    const experiment = this.experiments.get(id);
    if (!experiment) {
      throw new Error(`Experiment ${id} not found`);
    }

    this.experiments.set(id, { ...experiment, ...updates });
  }

  /**
   * Delete experiment
   */
  async deleteExperiment(id: string): Promise<void> {
    this.experiments.delete(id);
  }

  /**
   * Get all experiments
   */
  getAllExperiments(): Experiment[] {
    return Array.from(this.experiments.values());
  }
}
