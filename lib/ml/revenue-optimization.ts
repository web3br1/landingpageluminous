// Revenue Optimization Engine using Price Elasticity and ML
// Optimizes pricing strategies to maximize revenue and profit

export interface PricingData {
  price: number;
  conversions: number;
  visitors: number;
  revenue: number;
  profit: number;
  segment: string;
  timeRange: string;
  competitorPrice?: number;
  marketConditions: string;
}

export interface PriceElasticity {
  segment: string;
  elasticity: number; // Price elasticity of demand (-∞ to 0)
  optimalPrice: number;
  expectedRevenue: number;
  confidence: number;
}

export interface RevenueOptimization {
  currentRevenue: number;
  optimalRevenue: number;
  revenueIncrease: number;
  priceRecommendations: PriceRecommendation[];
  segmentOptimizations: SegmentOptimization[];
  riskAssessment: string;
  implementationPlan: string[];
}

export interface PriceRecommendation {
  segment: string;
  currentPrice: number;
  recommendedPrice: number;
  expectedRevenueIncrease: number;
  confidence: number;
  riskLevel: "low" | "medium" | "high";
}

export interface SegmentOptimization {
  segment: string;
  elasticity: number;
  optimalPrice: number;
  revenueImpact: number;
  conversionImpact: number;
}

// Revenue optimization using price elasticity analysis
class RevenueOptimizer {
  private pricingData: PricingData[] = [];
  private maxDataPoints = 5000;

  // Add pricing performance data
  addPricingData(data: PricingData): void {
    this.pricingData.push(data);

    // Keep only recent and relevant data
    if (this.pricingData.length > this.maxDataPoints) {
      this.pricingData = this.pricingData
        .sort(
          (a, b) =>
            new Date(b.timeRange).getTime() - new Date(a.timeRange).getTime(),
        )
        .slice(0, this.maxDataPoints);
    }
  }

  // Calculate price elasticity of demand
  calculatePriceElasticity(segment?: string): PriceElasticity[] {
    const segmentData = segment
      ? this.pricingData.filter((d) => d.segment === segment)
      : this.pricingData;

    if (segmentData.length < 5) {
      return [];
    }

    // Group by price points
    const priceGroups = segmentData.reduce(
      (acc, item) => {
        const priceKey = Math.round(item.price / 10) * 10; // Round to nearest 10
        if (!acc[priceKey]) {
          acc[priceKey] = [];
        }
        acc[priceKey].push(item);
        return acc;
      },
      {} as Record<number, PricingData[]>,
    );

    // Calculate elasticity for each price range
    const elasticities: PriceElasticity[] = [];

    Object.entries(priceGroups).forEach(([priceStr, data]) => {
      const price = parseInt(priceStr);
      if (data.length < 2) return;

      // Calculate average conversion rate and revenue
      const avgConversionRate =
        data.reduce((sum, d) => sum + d.conversions / d.visitors, 0) /
        data.length;
      const avgRevenue =
        data.reduce((sum, d) => sum + d.revenue, 0) / data.length;

      // Find nearby price points for elasticity calculation
      const nearbyPrices = Object.keys(priceGroups)
        .map((p) => parseInt(p))
        .filter((p) => Math.abs(p - price) <= 50 && p !== price)
        .sort((a, b) => Math.abs(a - price) - Math.abs(b - price));

      if (nearbyPrices.length === 0) return;

      const comparePrice = nearbyPrices[0];
      const compareData = (priceGroups as unknown)[
        comparePrice.toString()
      ] as unknown[];
      if (!compareData) return;

      const compareConversionRate =
        compareData.reduce((sum, d) => sum + d.conversions / d.visitors, 0) /
        compareData.length;

      // Calculate price elasticity: %ΔQuantity / %ΔPrice
      const priceChange = (comparePrice - price) / price;
      const quantityChange =
        (compareConversionRate - avgConversionRate) / avgConversionRate;

      const elasticity = quantityChange / priceChange;

      // Only consider elasticities in reasonable range
      if (Math.abs(elasticity) > 10 || elasticity > 0) return; // Invalid elasticity

      // Calculate optimal price (where marginal revenue = 0)
      const optimalPrice =
        price * (Math.abs(elasticity) / (Math.abs(elasticity) + 1));
      const expectedRevenue =
        avgRevenue * (optimalPrice / price) ** Math.abs(elasticity);

      elasticities.push({
        segment: segment || "all",
        elasticity,
        optimalPrice: Math.round(optimalPrice),
        expectedRevenue: Math.round(expectedRevenue),
        confidence: Math.min(data.length / 10, 1), // Confidence based on sample size
      });
    });

    return elasticities;
  }

  // Generate revenue optimization recommendations
  generateOptimization(): RevenueOptimization | null {
    if (this.pricingData.length < 20) return null;

    const currentRevenue = this.pricingData.reduce(
      (sum, d) => sum + d.revenue,
      0,
    );
    const currentAvgPrice =
      this.pricingData.reduce((sum, d) => sum + d.price, 0) /
      this.pricingData.length;

    // Get elasticity analysis
    const elasticities = this.calculatePriceElasticity();

    // Generate price recommendations
    const priceRecommendations: PriceRecommendation[] = elasticities
      .map((elasticity) => {
        const currentPrice =
          this.pricingData
            .filter((d) => d.segment === elasticity.segment)
            .reduce((sum, d) => sum + d.price, 0) /
          this.pricingData.filter((d) => d.segment === elasticity.segment)
            .length;

        const priceChange =
          ((elasticity.optimalPrice - currentPrice) / currentPrice) * 100;
        const expectedRevenueIncrease =
          priceChange * Math.abs(elasticity.elasticity);

        return {
          segment: elasticity.segment,
          currentPrice,
          recommendedPrice: elasticity.optimalPrice,
          expectedRevenueIncrease,
          confidence: elasticity.confidence,
          riskLevel: (Math.abs(priceChange) > 20
            ? "high"
            : Math.abs(priceChange) > 10
              ? "medium"
              : "low") as "low" | "medium" | "high",
        };
      })
      .filter((rec) => rec.expectedRevenueIncrease > 5); // Only recommend if >5% improvement

    // Calculate segment optimizations
    const segmentOptimizations: SegmentOptimization[] = elasticities.map(
      (elasticity) => {
        const segmentData = this.pricingData.filter(
          (d) => d.segment === elasticity.segment,
        );
        const avgRevenue =
          segmentData.reduce((sum, d) => sum + d.revenue, 0) /
          segmentData.length;
        const revenueImpact =
          ((elasticity.expectedRevenue - avgRevenue) / avgRevenue) * 100;

        return {
          segment: elasticity.segment,
          elasticity: elasticity.elasticity,
          optimalPrice: elasticity.optimalPrice,
          revenueImpact,
          conversionImpact:
            elasticity.elasticity *
            ((elasticity.optimalPrice - currentAvgPrice) / currentAvgPrice),
        };
      },
    );

    const optimalRevenue =
      currentRevenue *
      (1 +
        priceRecommendations.reduce(
          (sum, rec) => sum + rec.expectedRevenueIncrease,
          0,
        ) /
          100);

    return {
      currentRevenue,
      optimalRevenue,
      revenueIncrease: optimalRevenue - currentRevenue,
      priceRecommendations: priceRecommendations.sort(
        (a, b) => b.expectedRevenueIncrease - a.expectedRevenueIncrease,
      ),
      segmentOptimizations,
      riskAssessment: this.assessRisk(priceRecommendations),
      implementationPlan: this.generateImplementationPlan(priceRecommendations),
    };
  }

  // Assess risk of price changes
  private assessRisk(recommendations: PriceRecommendation[]): string {
    const highRiskCount = recommendations.filter(
      (r) => r.riskLevel === "high",
    ).length;
    const totalRecommendations = recommendations.length;

    if (highRiskCount / totalRecommendations > 0.5) {
      return "HIGH: Many recommendations involve significant price changes. Consider phased rollout and monitor closely.";
    } else if (highRiskCount / totalRecommendations > 0.2) {
      return "MEDIUM: Some recommendations involve notable price changes. Test with small segments first.";
    } else {
      return "LOW: Recommendations involve moderate price changes with low risk of negative impact.";
    }
  }

  // Generate implementation plan
  private generateImplementationPlan(
    recommendations: PriceRecommendation[],
  ): string[] {
    const plan: string[] = [];

    // Sort by risk level and impact
    const sorted = recommendations.sort((a, b) => {
      const riskOrder = { low: 0, medium: 1, high: 2 };
      const riskDiff = riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      if (riskDiff !== 0) return riskDiff;
      return b.expectedRevenueIncrease - a.expectedRevenueIncrease;
    });

    // Group by risk level
    const lowRisk = sorted.filter((r) => r.riskLevel === "low");
    const mediumRisk = sorted.filter((r) => r.riskLevel === "medium");
    const highRisk = sorted.filter((r) => r.riskLevel === "high");

    if (lowRisk.length > 0) {
      plan.push(
        `Phase 1 (Low Risk): Implement ${lowRisk.length} low-risk price changes immediately`,
      );
    }

    if (mediumRisk.length > 0) {
      plan.push(
        `Phase 2 (Medium Risk): Test ${mediumRisk.length} medium-risk changes with 20% of traffic for 2 weeks`,
      );
    }

    if (highRisk.length > 0) {
      plan.push(
        `Phase 3 (High Risk): Pilot ${highRisk.length} high-risk changes with 5% of traffic for 4 weeks`,
      );
    }

    plan.push("Monitor conversion rates and revenue impact weekly");
    plan.push("Be prepared to rollback changes if conversion drops >10%");

    return plan;
  }

  // Predict revenue at different price points
  predictRevenue(
    price: number,
    segment?: string,
  ): {
    predictedRevenue: number;
    predictedConversions: number;
    confidence: number;
  } {
    const relevantData = segment
      ? this.pricingData.filter((d) => d.segment === segment)
      : this.pricingData;

    if (relevantData.length < 5) {
      return { predictedRevenue: 0, predictedConversions: 0, confidence: 0 };
    }

    // Simple linear regression for price vs conversion relationship
    const n = relevantData.length;
    const sumX = relevantData.reduce((sum, d) => sum + d.price, 0);
    const sumY = relevantData.reduce(
      (sum, d) => sum + d.conversions / d.visitors,
      0,
    );
    const sumXY = relevantData.reduce(
      (sum, d) => sum + d.price * (d.conversions / d.visitors),
      0,
    );
    const sumXX = relevantData.reduce((sum, d) => sum + d.price * d.price, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Predict conversion rate at new price
    const predictedConversionRate = slope * price + intercept;
    const avgVisitors =
      relevantData.reduce((sum, d) => sum + d.visitors, 0) / n;

    const predictedConversions = Math.max(
      0,
      predictedConversionRate * avgVisitors,
    );
    const predictedRevenue = predictedConversions * price;

    // Confidence based on data quality and prediction reasonableness
    const confidence = Math.min(
      relevantData.length / 50, // More data = more confidence
      predictedConversionRate > 0 && predictedConversionRate < 0.5 ? 0.8 : 0.4, // Reasonable conversion rate
    );

    return {
      predictedRevenue: Math.round(predictedRevenue),
      predictedConversions: Math.round(predictedConversions),
      confidence,
    };
  }

  // Get revenue analytics
  getRevenueAnalytics(): {
    totalRevenue: number;
    avgPrice: number;
    avgConversionRate: number;
    topSegments: Array<{ segment: string; revenue: number; share: number }>;
    priceElasticity: Record<string, number>;
    revenueTrends: unknown[];
  } {
    if (this.pricingData.length === 0) {
      return {
        totalRevenue: 0,
        avgPrice: 0,
        avgConversionRate: 0,
        topSegments: [],
        priceElasticity: {},
        revenueTrends: [],
      };
    }

    const totalRevenue = this.pricingData.reduce(
      (sum, d) => sum + d.revenue,
      0,
    );
    const totalVisitors = this.pricingData.reduce(
      (sum, d) => sum + d.visitors,
      0,
    );
    const totalConversions = this.pricingData.reduce(
      (sum, d) => sum + d.conversions,
      0,
    );

    const avgPrice =
      this.pricingData.reduce((sum, d) => sum + d.price, 0) /
      this.pricingData.length;
    const avgConversionRate = totalConversions / totalVisitors;

    // Segment analysis
    const segmentRevenue = this.pricingData.reduce(
      (acc, d) => {
        acc[d.segment] = (acc[d.segment] || 0) + d.revenue;
        return acc;
      },
      {} as Record<string, number>,
    );

    const topSegments = Object.entries(segmentRevenue)
      .map(([segment, revenue]) => ({
        segment,
        revenue,
        share: (revenue / totalRevenue) * 100,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Price elasticity by segment
    const elasticities = this.calculatePriceElasticity();
    const priceElasticity = elasticities.reduce(
      (acc, e) => {
        acc[e.segment] = e.elasticity;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Revenue trends (last 30 days grouped by week)
    const weeklyRevenue = this.pricingData.reduce(
      (acc, d) => {
        const week = Math.floor(
          new Date(d.timeRange).getTime() / (7 * 24 * 60 * 60 * 1000),
        );
        acc[week] = (acc[week] || 0) + d.revenue;
        return acc;
      },
      {} as Record<number, number>,
    );

    const revenueTrends = Object.entries(weeklyRevenue)
      .map(([week, revenue]) => ({ week: parseInt(week), revenue }))
      .sort((a, b) => a.week - b.week);

    return {
      totalRevenue,
      avgPrice,
      avgConversionRate,
      topSegments,
      priceElasticity,
      revenueTrends,
    };
  }
}

// Global revenue optimizer instance
export const revenueOptimizer = new RevenueOptimizer();

// Utility functions for revenue optimization
export const revenueUtils = {
  // Add pricing data
  addPricingData: (data: PricingData) => {
    revenueOptimizer.addPricingData(data);
  },

  // Get optimization recommendations
  getOptimization: () => {
    return revenueOptimizer.generateOptimization();
  },

  // Predict revenue at price point
  predictRevenue: (price: number, segment?: string) => {
    return revenueOptimizer.predictRevenue(price, segment);
  },

  // Get revenue analytics
  getAnalytics: () => {
    return revenueOptimizer.getRevenueAnalytics();
  },

  // Generate sample pricing data for testing
  generateSamplePricingData: (segments: string[], months: number = 12) => {
    const data: PricingData[] = [];
    const basePrices = [29, 59, 99, 199, 399];

    segments.forEach((segment) => {
      basePrices.forEach((price) => {
        for (let month = 0; month < months; month++) {
          const date = new Date();
          date.setMonth(date.getMonth() - month);

          // Simulate price elasticity (higher prices = lower conversion)
          const elasticity = -1.5; // Example elasticity
          const baseConversionRate = 0.05; // 5% base conversion
          const priceEffect = Math.pow(price / 99, elasticity); // Price elasticity formula
          const conversionRate = Math.max(
            0.001,
            baseConversionRate * priceEffect,
          );

          const visitors = Math.floor(Math.random() * 1000) + 100;
          const conversions = Math.floor(visitors * conversionRate);
          const revenue = conversions * price;
          const profit = revenue * 0.7; // 70% profit margin

          data.push({
            price,
            conversions,
            visitors,
            revenue,
            profit,
            segment,
            timeRange: date.toISOString(),
            competitorPrice: price * (0.9 + Math.random() * 0.2), // ±10% of our price
            marketConditions: Math.random() > 0.5 ? "competitive" : "normal",
          });
        }
      });
    });

    // Add data to optimizer
    data.forEach((item) => revenueOptimizer.addPricingData(item));

    return data;
  },
};
