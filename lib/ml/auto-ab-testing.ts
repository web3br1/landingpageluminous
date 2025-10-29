// Automated A/B Testing Engine using Bayesian Statistics
// Automatically determines winners and stops tests when statistical significance is reached

export interface ABTestVariant {
  id: string;
  name: string;
  traffic: number; // percentage 0-100
  conversions: number;
  visitors: number;
  conversionRate: number;
  confidence: number; // 0-1
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  status: "running" | "completed" | "stopped";
  variants: ABTestVariant[];
  winner?: string;
  startDate: Date;
  endDate?: Date;
  confidenceThreshold: number; // 0.95 = 95% confidence
  minimumVisitors: number;
  minimumConversions: number;
  goal: string; // 'conversion_rate', 'revenue', etc.
  results?: ABTestResults;
}

export interface ABTestResults {
  winner: string;
  confidence: number;
  improvement: number; // percentage improvement over control
  significance: "high" | "medium" | "low";
  recommendations: string[];
  statisticalPower: number;
}

// Bayesian A/B testing calculator
class BayesianABTest {
  private alpha = 1; // Beta distribution alpha parameter (prior successes)
  private beta = 1; // Beta distribution beta parameter (prior failures)

  // Calculate conversion rate distribution using Beta distribution
  private getBetaDistribution(successes: number, trials: number) {
    const a = this.alpha + successes;
    const b = this.beta + (trials - successes);

    return {
      alpha: a,
      beta: b,
      mean: a / (a + b),
      variance: (a * b) / ((a + b) ** 2 * (a + b + 1)),
      // 95% confidence interval
      lowerBound: this.betaQuantile(0.025, a, b),
      upperBound: this.betaQuantile(0.975, a, b),
    };
  }

  // Calculate probability that variant A is better than variant B
  private probabilityABetterThanB(a: ABTestVariant, b: ABTestVariant): number {
    const distA = this.getBetaDistribution(a.conversions, a.visitors);
    const distB = this.getBetaDistribution(b.conversions, b.visitors);

    // Monte Carlo simulation for probability
    const samples = 10000;
    let aBetter = 0;

    for (let i = 0; i < samples; i++) {
      const sampleA = this.betaSample(distA.alpha, distA.beta);
      const sampleB = this.betaSample(distB.alpha, distB.beta);

      if (sampleA > sampleB) {
        aBetter++;
      }
    }

    return aBetter / samples;
  }

  // Sample from Beta distribution
  private betaSample(alpha: number, beta: number): number {
    const u = Math.random();
    const v = Math.random();

    // Using Cheng's algorithm for Beta sampling
    const x = Math.pow(u, 1 / alpha);
    const y = Math.pow(v, 1 / beta);

    return x / (x + y);
  }

  // Beta quantile function (approximation)
  private betaQuantile(p: number, alpha: number, beta: number): number {
    // Using Wilson-Hilferty approximation for Beta quantiles
    if (alpha <= 0 || beta <= 0 || p <= 0 || p >= 1) return 0.5;

    const mu = alpha / (alpha + beta);
    const sigma2 = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1));
    const sigma = Math.sqrt(sigma2);

    // Normal approximation for large samples
    const z = this.normalQuantile(p);
    const quantile = mu + z * sigma;

    return Math.max(0, Math.min(1, quantile));
  }

  // Normal quantile function
  private normalQuantile(p: number): number {
    // Approximation using inverse error function
    const a1 = -3.969683028665376e1;
    const a2 = 2.209460984245205e2;
    const a3 = -2.759285104469687e2;
    const a4 = 1.38357751867269e2;
    const a5 = -3.066479806614716e1;
    const a6 = 2.506628277459239;

    const b1 = -5.447609879822406e1;
    const b2 = 1.615858368580409e2;
    const b3 = -1.556989798598866e2;
    const b4 = 6.680131188771972e1;
    const b5 = -1.328068155288572e1;

    const c1 = -7.784894002430293e-3;
    const c2 = -3.223964580411365e-1;
    const c3 = -2.400758277161838;
    const c4 = -2.549732539343734;
    const c5 = 4.374664141464968;
    const c6 = 2.938163982698783;

    const d1 = 7.784695709041462e-3;
    const d2 = 3.224671290700398e-1;
    const d3 = 2.445134137142996;
    const d4 = 3.754408661907416;

    const p_low = 0.02425;
    const p_high = 1 - p_low;

    let q: number;
    let r: number;

    if (p < p_low) {
      q = Math.sqrt(-2 * Math.log(p));
      q =
        (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
        ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
    } else if (p > p_high) {
      q = Math.sqrt(-2 * Math.log(1 - p));
      q =
        -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
        ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
    } else {
      q = p - 0.5;
      r = q * q;
      q =
        (q * (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6)) /
        (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
    }

    return q;
  }

  // Check if test has reached statistical significance
  checkSignificance(test: ABTest): ABTestResults | null {
    if (test.variants.length < 2) return null;

    const control = test.variants.find((v) => v.id === "control");
    if (!control || control.visitors < test.minimumVisitors) return null;

    // Check if all variants have minimum visitors
    const allVariantsQualified = test.variants.every(
      (v) =>
        v.visitors >= test.minimumVisitors &&
        v.conversions >= test.minimumConversions,
    );

    if (!allVariantsQualified) return null;

    // Find winner with highest probability of being better than control
    let bestVariant = control;
    let highestProbability = 0;
    let bestConfidence = 0;

    for (const variant of test.variants) {
      if (variant.id === "control") continue;

      const probability = this.probabilityABetterThanB(variant, control);

      if (probability > highestProbability) {
        highestProbability = probability;
        bestVariant = variant;
        bestConfidence = probability;
      }
    }

    // Check if winner has sufficient confidence
    if (bestConfidence >= test.confidenceThreshold) {
      const improvement =
        ((bestVariant.conversionRate - control.conversionRate) /
          control.conversionRate) *
        100;

      return {
        winner: bestVariant.id,
        confidence: bestConfidence,
        improvement,
        significance:
          bestConfidence > 0.99
            ? "high"
            : bestConfidence > 0.95
              ? "medium"
              : "low",
        recommendations: this.generateRecommendations(bestVariant, improvement),
        statisticalPower: this.calculateStatisticalPower(test),
      };
    }

    return null;
  }

  // Generate recommendations based on test results
  private generateRecommendations(
    winner: ABTestVariant,
    improvement: number,
  ): string[] {
    const recommendations: string[] = [];

    if (improvement > 20) {
      recommendations.push(
        "🚀 Roll out winner immediately - significant improvement detected",
      );
    } else if (improvement > 10) {
      recommendations.push(
        "✅ Consider gradual rollout - moderate improvement with low risk",
      );
    } else {
      recommendations.push(
        "⚖️ Monitor long-term impact - small improvement may not justify changes",
      );
    }

    if (winner.conversionRate > 0.1) {
      recommendations.push(
        "📈 High-performing variant - consider testing similar variations",
      );
    }

    recommendations.push(
      "🔍 Run follow-up tests to validate results across different segments",
    );
    recommendations.push(
      "📊 Monitor performance metrics for at least 2 weeks after rollout",
    );

    return recommendations;
  }

  // Calculate statistical power of the test
  private calculateStatisticalPower(test: ABTest): number {
    // Simplified statistical power calculation
    const totalVisitors = test.variants.reduce((sum, v) => sum + v.visitors, 0);
    const avgConversionRate =
      test.variants.reduce((sum, v) => sum + v.conversionRate, 0) /
      test.variants.length;

    // Power increases with sample size and effect size
    const effectSize = Math.abs(
      test.variants[0].conversionRate - test.variants[1]?.conversionRate || 0,
    );
    const sampleSize = Math.min(...test.variants.map((v) => v.visitors));

    // Rough approximation of statistical power
    const power = Math.min(1, Math.sqrt(sampleSize * effectSize) / 10);

    return Math.max(0.1, Math.min(1, power));
  }

  // Estimate required sample size for desired statistical power
  estimateRequiredSampleSize(
    baselineConversionRate: number,
    minimumDetectableEffect: number,
    desiredPower: number = 0.8,
    confidenceLevel: number = 0.95,
  ): number {
    // Using simplified formula for sample size calculation
    const zAlpha = 1.96; // 95% confidence
    const zBeta = 0.84; // 80% power

    const p1 = baselineConversionRate;
    const p2 = baselineConversionRate + minimumDetectableEffect;

    const numerator =
      (zAlpha * Math.sqrt(2 * p1 * (1 - p1)) +
        zBeta * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2))) **
      2;
    const denominator = (p2 - p1) ** 2;

    return Math.ceil(numerator / denominator);
  }
}

// Automated A/B testing manager
class AutomatedABTesting {
  private tests: Map<string, ABTest> = new Map();
  private bayesianCalculator = new BayesianABTest();

  // Create a new A/B test
  createTest(config: {
    id: string;
    name: string;
    description: string;
    variants: Omit<
      ABTestVariant,
      "conversions" | "visitors" | "conversionRate" | "confidence"
    >[];
    confidenceThreshold?: number;
    minimumVisitors?: number;
    minimumConversions?: number;
    goal?: string;
  }): ABTest {
    const test: ABTest = {
      id: config.id,
      name: config.name,
      description: config.description,
      status: "running",
      variants: config.variants.map((v) => ({
        ...v,
        conversions: 0,
        visitors: 0,
        conversionRate: 0,
        confidence: 0,
      })),
      startDate: new Date(),
      confidenceThreshold: config.confidenceThreshold || 0.95,
      minimumVisitors: config.minimumVisitors || 1000,
      minimumConversions: config.minimumConversions || 50,
      goal: config.goal || "conversion_rate",
    };

    this.tests.set(test.id, test);
    return test;
  }

  // Record visitor for a test variant
  recordVisitor(testId: string, variantId: string): void {
    const test = this.tests.get(testId);
    if (!test || test.status !== "running") return;

    const variant = test.variants.find((v) => v.id === variantId);
    if (variant) {
      variant.visitors++;
    }
  }

  // Record conversion for a test variant
  recordConversion(testId: string, variantId: string, value: number = 1): void {
    const test = this.tests.get(testId);
    if (!test || test.status !== "running") return;

    const variant = test.variants.find((v) => v.id === variantId);
    if (variant) {
      variant.conversions += value;
      variant.conversionRate = variant.conversions / variant.visitors;
    }

    // Check if test should be stopped
    this.checkTestCompletion(test);
  }

  // Check if test has reached completion criteria
  private checkTestCompletion(test: ABTest): void {
    const results = this.bayesianCalculator.checkSignificance(test);

    if (results) {
      test.status = "completed";
      test.winner = results.winner;
      test.endDate = new Date();
      test.results = results;

      console.log(`A/B Test "${test.name}" completed!`, {
        winner: results.winner,
        confidence: results.confidence,
        improvement: results.improvement,
      });
    }
  }

  // Get test results
  getTest(testId: string): ABTest | undefined {
    return this.tests.get(testId);
  }

  // Get all tests
  getAllTests(): ABTest[] {
    return Array.from(this.tests.values());
  }

  // Stop a test manually
  stopTest(testId: string, winner?: string): void {
    const test = this.tests.get(testId);
    if (!test) return;

    test.status = "stopped";
    test.endDate = new Date();
    if (winner) {
      test.winner = winner;
    }
  }

  // Get test recommendations
  getTestRecommendations(testId: string): string[] {
    const test = this.tests.get(testId);
    if (!test?.results) return [];

    return test.results.recommendations;
  }

  // Estimate required sample size for new tests
  estimateSampleSize(baselineRate: number, minEffect: number): number {
    return this.bayesianCalculator.estimateRequiredSampleSize(
      baselineRate,
      minEffect,
    );
  }

  // Get test statistics
  getTestStats(): {
    totalTests: number;
    runningTests: number;
    completedTests: number;
    avgImprovement: number;
    bestPerformingTest?: ABTest;
  } {
    const tests = this.getAllTests();
    const completedTests = tests.filter(
      (t) => t.status === "completed" && t.results,
    );

    const avgImprovement =
      completedTests.length > 0
        ? completedTests.reduce(
            (sum, t) => sum + (t.results?.improvement || 0),
            0,
          ) / completedTests.length
        : 0;

    const bestPerformingTest = completedTests
      .filter((t) => t.results)
      .sort(
        (a, b) => (b.results?.improvement || 0) - (a.results?.improvement || 0),
      )[0];

    return {
      totalTests: tests.length,
      runningTests: tests.filter((t) => t.status === "running").length,
      completedTests: completedTests.length,
      avgImprovement,
      bestPerformingTest,
    };
  }
}

// Global automated A/B testing instance
export const automatedABTesting = new AutomatedABTesting();

// Utility functions for A/B testing
export const abTestingUtils = {
  // Create a standard A/B test
  createStandardTest: (id: string, name: string, variants: string[]) => {
    const testVariants = [
      { id: "control", name: "Control", traffic: 50 },
      ...variants.map((variant, index) => ({
        id: `variant_${index + 1}`,
        name: variant,
        traffic: Math.floor(50 / variants.length),
      })),
    ];

    return automatedABTesting.createTest({
      id,
      name,
      description: `Automated A/B test for ${name}`,
      variants: testVariants,
    });
  },

  // Get variant for user (consistent hashing)
  getUserVariant: (testId: string, userId: string): string => {
    const test = automatedABTesting.getTest(testId);
    if (!test || test.status !== "running") return "control";

    // Use userId for consistent variant assignment
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = (hash << 5) - hash + userId.charCodeAt(i);
      hash = hash & hash;
    }

    const userBucket = Math.abs(hash) % 100;
    let cumulativeTraffic = 0;

    for (const variant of test.variants) {
      cumulativeTraffic += variant.traffic;
      if (userBucket < cumulativeTraffic) {
        return variant.id;
      }
    }

    return test.variants[0]?.id || "control";
  },

  // Track events for A/B testing
  trackEvent: (
    testId: string,
    variantId: string,
    eventType: "visitor" | "conversion",
    value = 1,
  ) => {
    if (eventType === "visitor") {
      automatedABTesting.recordVisitor(testId, variantId);
    } else if (eventType === "conversion") {
      automatedABTesting.recordConversion(testId, variantId, value);
    }
  },

  // Get test status
  getTestStatus: (testId: string) => {
    const test = automatedABTesting.getTest(testId);
    return test
      ? {
          status: test.status,
          winner: test.winner,
          confidence: test.results?.confidence,
          improvement: test.results?.improvement,
          recommendations: automatedABTesting.getTestRecommendations(testId),
        }
      : null;
  },
};
