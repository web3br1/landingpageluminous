// Predictive Analytics Engine using Time Series and ML
// Predicts user behavior, conversion likelihood, and business metrics

export interface UserBehavior {
  userId: string;
  events: BehaviorEvent[];
  lastActivity: number;
  totalSessions: number;
  totalTimeSpent: number;
  conversionProbability: number;
  churnRisk: number;
  lifetimeValue: number;
}

export interface BehaviorEvent {
  type: "view" | "click" | "convert" | "bounce" | "return";
  contentId?: string;
  timestamp: number;
  value?: number;
  metadata?: Record<string, unknown>;
}

export interface ConversionPrediction {
  userId: string;
  probability: number;
  confidence: number;
  predictedValue: number;
  timeToConvert: number; // days
  factors: string[];
}

export interface ChurnPrediction {
  userId: string;
  risk: number;
  confidence: number;
  riskFactors: string[];
  retentionStrategies: string[];
}

export interface BusinessPrediction {
  metric: "revenue" | "conversions" | "users" | "retention";
  currentValue: number;
  predictedValue: number;
  confidence: number;
  timeframe: number; // days
  factors: string[];
  trend: "increasing" | "decreasing" | "stable";
}

// Predictive analytics using statistical models and ML
class PredictiveAnalytics {
  private userBehaviors: Map<string, UserBehavior> = new Map();
  private historicalData: BehaviorEvent[] = [];
  private maxHistoricalData = 50000;

  // Add user behavior data
  addUserBehavior(userId: string, event: BehaviorEvent): void {
    // Update user behavior record
    let userBehavior = this.userBehaviors.get(userId);

    if (!userBehavior) {
      userBehavior = {
        userId,
        events: [],
        lastActivity: 0,
        totalSessions: 0,
        totalTimeSpent: 0,
        conversionProbability: 0,
        churnRisk: 0,
        lifetimeValue: 0,
      };
      this.userBehaviors.set(userId, userBehavior);
    }

    userBehavior.events.push(event);
    userBehavior.lastActivity = Math.max(
      userBehavior.lastActivity,
      event.timestamp,
    );

    // Keep only recent events (last 90 days)
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
    userBehavior.events = userBehavior.events.filter(
      (e) => e.timestamp > ninetyDaysAgo,
    );

    // Update derived metrics
    this.updateUserMetrics(userBehavior);

    // Add to historical data
    this.historicalData.push(event);
    if (this.historicalData.length > this.maxHistoricalData) {
      this.historicalData = this.historicalData.slice(-this.maxHistoricalData);
    }
  }

  // Update derived user metrics
  private updateUserMetrics(userBehavior: UserBehavior): void {
    const events = userBehavior.events;
    const now = Date.now();

    // Calculate sessions (group events within 30 minutes)
    const sessions = events.reduce((acc, event, index) => {
      if (
        index === 0 ||
        event.timestamp - events[index - 1].timestamp > 30 * 60 * 1000
      ) {
        acc.push([event]);
      } else {
        acc[acc.length - 1].push(event);
      }
      return acc;
    }, [] as BehaviorEvent[][]);

    userBehavior.totalSessions = sessions.length;

    // Calculate total time spent
    userBehavior.totalTimeSpent = sessions.reduce((total, session) => {
      if (session.length > 1) {
        const sessionDuration =
          session[session.length - 1].timestamp - session[0].timestamp;
        return total + Math.min(sessionDuration, 2 * 60 * 60 * 1000); // Max 2 hours per session
      }
      return total + 30 * 1000; // Default 30 seconds for single-event sessions
    }, 0);

    // Calculate conversion probability
    const conversionEvents = events.filter((e) => e.type === "convert");
    const recentEvents = events.filter(
      (e) => e.timestamp > now - 7 * 24 * 60 * 60 * 1000,
    ); // Last 7 days

    if (recentEvents.length > 0) {
      const recentConversions = recentEvents.filter(
        (e) => e.type === "convert",
      ).length;
      userBehavior.conversionProbability =
        recentConversions / Math.max(recentEvents.length, 1);
    }

    // Calculate churn risk
    const daysSinceLastActivity =
      (now - userBehavior.lastActivity) / (24 * 60 * 60 * 1000);
    const sessionFrequency =
      userBehavior.totalSessions / Math.max(daysSinceLastActivity / 7, 1); // Sessions per week

    userBehavior.churnRisk = Math.min(
      1,
      Math.max(
        0,
        0.3 + // Base risk
          (daysSinceLastActivity > 30 ? 0.4 : 0) + // High risk if inactive > 30 days
          (sessionFrequency < 0.5 ? 0.3 : 0), // High risk if < 0.5 sessions/week
      ),
    );

    // Calculate lifetime value
    const totalValue = conversionEvents.reduce(
      (sum, e) => sum + (e.value || 0),
      0,
    );
    const avgOrderValue = totalValue / Math.max(conversionEvents.length, 1);
    const predictedPurchases = Math.max(
      1,
      userBehavior.conversionProbability * 12,
    ); // Annual prediction
    userBehavior.lifetimeValue = avgOrderValue * predictedPurchases;
  }

  // Predict conversion probability for user
  predictConversion(userId: string): ConversionPrediction | null {
    const userBehavior = this.userBehaviors.get(userId);
    if (!userBehavior || userBehavior.events.length < 3) return null;

    const probability = userBehavior.conversionProbability;
    const confidence = Math.min(userBehavior.events.length / 20, 1); // More events = more confidence

    // Predict time to convert based on behavior patterns
    const avgTimeBetweenEvents = this.calculateAvgTimeBetweenEvents(
      userBehavior.events,
    );
    const timeToConvert = probability > 0.1 ? avgTimeBetweenEvents * 7 : 30; // 30 days default

    // Identify key factors
    const factors = this.identifyConversionFactors(userBehavior);

    return {
      userId,
      probability,
      confidence,
      predictedValue: userBehavior.lifetimeValue,
      timeToConvert,
      factors,
    };
  }

  // Predict churn risk
  predictChurn(userId: string): ChurnPrediction | null {
    const userBehavior = this.userBehaviors.get(userId);
    if (!userBehavior) return null;

    const risk = userBehavior.churnRisk;
    const confidence = Math.min(userBehavior.totalSessions / 10, 1);

    const riskFactors = this.identifyChurnFactors(userBehavior);
    const retentionStrategies = this.generateRetentionStrategies(userBehavior);

    return {
      userId,
      risk,
      confidence,
      riskFactors,
      retentionStrategies,
    };
  }

  // Predict business metrics
  predictBusinessMetrics(timeframe: number = 30): BusinessPrediction[] {
    const predictions: BusinessPrediction[] = [];

    // Revenue prediction
    const revenuePrediction = this.predictRevenue(timeframe);
    if (revenuePrediction) {
      predictions.push(revenuePrediction);
    }

    // User acquisition prediction
    const userPrediction = this.predictUserAcquisition(timeframe);
    if (userPrediction) {
      predictions.push(userPrediction);
    }

    // Conversion rate prediction
    const conversionPrediction = this.predictConversionRate(timeframe);
    if (conversionPrediction) {
      predictions.push(conversionPrediction);
    }

    // Retention prediction
    const retentionPrediction = this.predictRetention(timeframe);
    if (retentionPrediction) {
      predictions.push(retentionPrediction);
    }

    return predictions;
  }

  // Predict revenue
  private predictRevenue(timeframe: number): BusinessPrediction | null {
    if (this.historicalData.length < 30) return null;

    // Simple time series analysis - linear trend
    const dailyRevenue = this.calculateDailyRevenue();
    const recentDays = dailyRevenue.slice(-14); // Last 2 weeks

    if (recentDays.length < 7) return null;

    // Calculate trend
    const n = recentDays.length;
    const sumX = recentDays.reduce((sum, _, i) => sum + i, 0);
    const sumY = recentDays.reduce((sum, day) => sum + day.revenue, 0);
    const sumXY = recentDays.reduce((sum, day, i) => sum + i * day.revenue, 0);
    const sumXX = recentDays.reduce((sum, _, i) => sum + i * i, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const currentRevenue = recentDays[recentDays.length - 1].revenue;

    // Extrapolate for timeframe
    const futureRevenue = currentRevenue + slope * (timeframe / n);
    const confidence = Math.min(recentDays.length / 30, 1);

    return {
      metric: "revenue",
      currentValue: currentRevenue,
      predictedValue: Math.max(0, futureRevenue),
      confidence,
      timeframe,
      factors: ["historical_trend", "seasonal_patterns", "market_conditions"],
      trend: slope > 0 ? "increasing" : slope < 0 ? "decreasing" : "stable",
    };
  }

  // Calculate daily revenue from historical data
  private calculateDailyRevenue(): Array<{ date: string; revenue: number }> {
    const dailyData = this.historicalData.reduce(
      (acc, event) => {
        const date = new Date(event.timestamp).toDateString();
        if (!acc[date]) {
          acc[date] = { revenue: 0, conversions: 0 };
        }

        if (event.type === "convert" && event.value) {
          acc[date].revenue += event.value;
          acc[date].conversions++;
        }

        return acc;
      },
      {} as Record<string, { revenue: number; conversions: number }>,
    );

    return Object.entries(dailyData)
      .map(([date, data]) => ({ date, revenue: data.revenue }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // Predict user acquisition
  private predictUserAcquisition(timeframe: number): BusinessPrediction | null {
    // Simplified prediction based on recent growth
    const recentUsers = Array.from(this.userBehaviors.values()).filter(
      (user) => user.lastActivity > Date.now() - 7 * 24 * 60 * 60 * 1000,
    ); // Last 7 days

    if (recentUsers.length < 10) return null;

    const avgDailyUsers = recentUsers.length / 7;
    const predictedUsers = avgDailyUsers * (timeframe / 7);
    const confidence = 0.6; // Lower confidence for user acquisition predictions

    return {
      metric: "users",
      currentValue: avgDailyUsers,
      predictedValue: predictedUsers,
      confidence,
      timeframe,
      factors: ["recent_growth", "seasonal_trends", "marketing_efforts"],
      trend: "stable", // Could be calculated from historical data
    };
  }

  // Predict conversion rate
  private predictConversionRate(timeframe: number): BusinessPrediction | null {
    const recentConversions = this.historicalData.filter(
      (event) =>
        event.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000 &&
        event.type === "convert",
    );

    const recentViews = this.historicalData.filter(
      (event) =>
        event.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000 &&
        event.type === "view",
    );

    if (recentViews.length < 100) return null;

    const currentRate = recentConversions.length / recentViews.length;
    const confidence = Math.min(recentViews.length / 1000, 1);

    // Assume stable conversion rate for prediction
    return {
      metric: "conversions",
      currentValue: currentRate,
      predictedValue: currentRate, // Stable prediction
      confidence,
      timeframe,
      factors: ["current_performance", "market_conditions"],
      trend: "stable",
    };
  }

  // Predict retention
  private predictRetention(timeframe: number): BusinessPrediction | null {
    const activeUsers = Array.from(this.userBehaviors.values()).filter(
      (user) => user.churnRisk < 0.5,
    ); // Low churn risk

    if (activeUsers.length < 10) return null;

    const avgRetentionRate = activeUsers.length / this.userBehaviors.size;
    const confidence = Math.min(this.userBehaviors.size / 100, 1);

    return {
      metric: "retention",
      currentValue: avgRetentionRate,
      predictedValue: avgRetentionRate * 0.95, // Slight expected decline
      confidence,
      timeframe,
      factors: ["current_retention", "user_engagement", "product_satisfaction"],
      trend: "stable",
    };
  }

  // Helper methods
  private calculateAvgTimeBetweenEvents(events: BehaviorEvent[]): number {
    if (events.length < 2) return 7 * 24 * 60 * 60 * 1000; // 7 days default

    const intervals = [];
    for (let i = 1; i < events.length; i++) {
      intervals.push(events[i].timestamp - events[i - 1].timestamp);
    }

    return (
      intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
    );
  }

  private identifyConversionFactors(userBehavior: UserBehavior): string[] {
    const factors: string[] = [];

    if (userBehavior.totalSessions > 5) factors.push("high_engagement");
    if (userBehavior.totalTimeSpent > 600) factors.push("long_sessions"); // 10+ minutes
    if (userBehavior.events.some((e) => e.type === "return"))
      factors.push("repeat_visits");

    const recentEvents = userBehavior.events.filter(
      (e) => e.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000,
    );

    if (recentEvents.length > 10) factors.push("recent_activity");
    if (recentEvents.filter((e) => e.type === "click").length > 5)
      factors.push("high_interaction");

    return factors;
  }

  private identifyChurnFactors(userBehavior: UserBehavior): string[] {
    const factors: string[] = [];

    const daysSinceLastActivity =
      (Date.now() - userBehavior.lastActivity) / (24 * 60 * 60 * 1000);

    if (daysSinceLastActivity > 30) factors.push("long_inactivity");
    if (userBehavior.totalSessions < 3) factors.push("low_engagement");
    if (userBehavior.conversionProbability < 0.01)
      factors.push("no_conversion_signals");

    return factors;
  }

  private generateRetentionStrategies(userBehavior: UserBehavior): string[] {
    const strategies: string[] = [];

    if (userBehavior.churnRisk > 0.7) {
      strategies.push("immediate_reengagement_campaign");
      strategies.push("personalized_email_sequence");
    } else if (userBehavior.churnRisk > 0.5) {
      strategies.push("winback_offer");
      strategies.push("feature_reminder");
    } else {
      strategies.push("loyalty_program");
      strategies.push("upgrade_incentives");
    }

    return strategies;
  }

  // Get analytics summary
  getAnalyticsSummary(): {
    totalUsers: number;
    activeUsers: number;
    conversionRate: number;
    avgChurnRisk: number;
    topRiskFactors: string[];
    businessPredictions: BusinessPrediction[];
  } {
    const users = Array.from(this.userBehaviors.values());
    const activeUsers = users.filter((u) => u.churnRisk < 0.5);

    const totalConversions = users.reduce(
      (sum, u) => sum + u.events.filter((e) => e.type === "convert").length,
      0,
    );
    const totalEvents = users.reduce((sum, u) => sum + u.events.length, 0);
    const conversionRate = totalEvents > 0 ? totalConversions / totalEvents : 0;

    const avgChurnRisk =
      users.length > 0
        ? users.reduce((sum, u) => sum + u.churnRisk, 0) / users.length
        : 0;

    // Top risk factors
    const riskFactors = users.flatMap((u) => this.identifyChurnFactors(u));
    const factorCounts = riskFactors.reduce(
      (acc, factor) => {
        acc[factor] = (acc[factor] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const topRiskFactors = Object.entries(factorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([factor]) => factor);

    const businessPredictions = this.predictBusinessMetrics(30);

    return {
      totalUsers: users.length,
      activeUsers: activeUsers.length,
      conversionRate,
      avgChurnRisk,
      topRiskFactors,
      businessPredictions,
    };
  }
}

// Global predictive analytics instance
export const predictiveAnalytics = new PredictiveAnalytics();

// Utility functions for predictive analytics
export const predictiveUtils = {
  // Add user behavior event
  trackBehavior: (userId: string, event: BehaviorEvent) => {
    predictiveAnalytics.addUserBehavior(userId, event);
  },

  // Get conversion prediction
  predictConversion: (userId: string) => {
    return predictiveAnalytics.predictConversion(userId);
  },

  // Get churn prediction
  predictChurn: (userId: string) => {
    return predictiveAnalytics.predictChurn(userId);
  },

  // Get business predictions
  predictBusiness: (timeframe?: number) => {
    return predictiveAnalytics.predictBusinessMetrics(timeframe);
  },

  // Get analytics summary
  getSummary: () => {
    return predictiveAnalytics.getAnalyticsSummary();
  },

  // Generate sample behavior data for testing
  generateSampleBehaviorData: (userCount: number = 100, days: number = 30) => {
    const events: Array<{ userId: string; event: BehaviorEvent }> = [];
    const eventTypes: BehaviorEvent["type"][] = [
      "view",
      "click",
      "convert",
      "bounce",
      "return",
    ];

    for (let userIndex = 0; userIndex < userCount; userIndex++) {
      const userId = `user_${userIndex}`;

      // Generate random events over time period
      for (let day = 0; day < days; day++) {
        const eventsPerDay = Math.floor(Math.random() * 5) + 1; // 1-5 events per day

        for (let eventIndex = 0; eventIndex < eventsPerDay; eventIndex++) {
          const timestamp =
            Date.now() -
            day * 24 * 60 * 60 * 1000 +
            Math.random() * 24 * 60 * 60 * 1000;
          const eventType =
            eventTypes[Math.floor(Math.random() * eventTypes.length)];

          const event: BehaviorEvent = {
            type: eventType,
            timestamp,
            contentId: `content_${Math.floor(Math.random() * 10)}`,
            value: eventType === "convert" ? Math.random() * 100 : undefined,
          };

          events.push({ userId, event });
        }
      }
    }

    // Add events to analytics engine
    events.forEach(({ userId, event }) => {
      predictiveAnalytics.addUserBehavior(userId, event);
    });

    return events;
  },
};
