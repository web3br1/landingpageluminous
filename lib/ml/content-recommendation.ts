// Content Recommendation Engine using Collaborative Filtering
// Recommends content based on similar user behavior patterns

export interface ContentItem {
  id: string;
  type: "page" | "feature" | "cta" | "offer";
  title: string;
  category: string;
  tags: string[];
  targetAudience: string[];
  performance: {
    views: number;
    conversions: number;
    conversionRate: number;
    avgTimeOnPage: number;
  };
}

export interface UserContentInteraction {
  userId: string;
  contentId: string;
  interactionType: "view" | "click" | "convert" | "dismiss";
  timestamp: number;
  duration?: number; // for views
  value?: number; // for conversions
}

export interface ContentRecommendation {
  contentId: string;
  score: number;
  confidence: number;
  reason: string;
  predictedConversionRate: number;
}

// User-Item Matrix for Collaborative Filtering
class CollaborativeFiltering {
  private userItemMatrix: Map<string, Map<string, number>> = new Map();
  private itemSimilarities: Map<string, Map<string, number>> = new Map();
  private contentItems: Map<string, ContentItem> = new Map();

  // Add content items to the system
  addContentItems(items: ContentItem[]): void {
    items.forEach((item) => {
      this.contentItems.set(item.id, item);
    });
  }

  // Record user interaction with content
  recordInteraction(interaction: UserContentInteraction): void {
    const { userId, contentId, interactionType, duration, value } = interaction;

    // Initialize user row if not exists
    if (!this.userItemMatrix.has(userId)) {
      this.userItemMatrix.set(userId, new Map());
    }

    const userRow = this.userItemMatrix.get(userId)!;

    // Calculate interaction score
    let score = 0;
    switch (interactionType) {
      case "view":
        score = Math.min((duration || 0) / 60, 1); // Max 1 minute = score 1
        break;
      case "click":
        score = 0.7;
        break;
      case "convert":
        score = 1.0 + (value || 0) / 100; // Higher value = higher score
        break;
      case "dismiss":
        score = -0.3; // Negative feedback
        break;
    }

    // Update or accumulate score
    const currentScore = userRow.get(contentId) || 0;
    userRow.set(contentId, currentScore + score);
  }

  // Calculate item similarities using cosine similarity
  calculateItemSimilarities(): void {
    const items = Array.from(this.contentItems.keys());

    items.forEach((itemA) => {
      const similarities = new Map<string, number>();

      items.forEach((itemB) => {
        if (itemA !== itemB) {
          const similarity = this.cosineSimilarity(itemA, itemB);
          if (similarity > 0) {
            similarities.set(itemB, similarity);
          }
        }
      });

      // Keep only top 10 most similar items
      const topSimilar = Array.from(similarities.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);

      this.itemSimilarities.set(itemA, new Map(topSimilar));
    });
  }

  // Cosine similarity between two items based on user preferences
  private cosineSimilarity(itemA: string, itemB: string): number {
    const usersA = new Set<string>();
    const usersB = new Set<string>();

    // Find users who interacted with both items
    this.userItemMatrix.forEach((userRow, userId) => {
      if (userRow.has(itemA)) usersA.add(userId);
      if (userRow.has(itemB)) usersB.add(userId);
    });

    const commonUsers = new Set([...usersA].filter((x) => usersB.has(x)));
    if (commonUsers.size === 0) return 0;

    // Calculate cosine similarity
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    commonUsers.forEach((userId) => {
      const userRow = this.userItemMatrix.get(userId)!;
      const scoreA = userRow.get(itemA) || 0;
      const scoreB = userRow.get(itemB) || 0;

      dotProduct += scoreA * scoreB;
      normA += scoreA * scoreA;
      normB += scoreB * scoreB;
    });

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Get content recommendations for a user
  getRecommendations(
    userId: string,
    limit: number = 5,
    excludeViewed: boolean = true,
  ): ContentRecommendation[] {
    const userRow = this.userItemMatrix.get(userId);
    if (!userRow) return [];

    const viewedItems = new Set(userRow.keys());
    const recommendations: ContentRecommendation[] = [];

    // Find similar users and their highly rated items
    const similarUsers = this.findSimilarUsers(userId, 10);

    similarUsers.forEach(({ userId: similarUserId, similarity }) => {
      const similarUserRow = this.userItemMatrix.get(similarUserId);
      if (!similarUserRow) return;

      similarUserRow.forEach((score, contentId) => {
        if (excludeViewed && viewedItems.has(contentId)) return;
        if (score <= 0) return; // Skip negative or zero scores

        const existingRec = recommendations.find(
          (r) => r.contentId === contentId,
        );
        const weightedScore = score * similarity;

        if (existingRec) {
          // Update existing recommendation with weighted average
          const totalWeight = existingRec.confidence + similarity;
          existingRec.score =
            (existingRec.score * existingRec.confidence + weightedScore) /
            totalWeight;
          existingRec.confidence = Math.min(totalWeight, 1);
        } else {
          const contentItem = this.contentItems.get(contentId);
          if (contentItem) {
            recommendations.push({
              contentId,
              score: weightedScore,
              confidence: similarity,
              reason: `Based on similar users' preferences`,
              predictedConversionRate:
                contentItem.performance.conversionRate * similarity,
            });
          }
        }
      });
    });

    // Sort by score and return top recommendations
    return recommendations.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  // Find similar users using Pearson correlation
  private findSimilarUsers(
    userId: string,
    limit: number = 10,
  ): Array<{ userId: string; similarity: number }> {
    const targetUser = this.userItemMatrix.get(userId);
    if (!targetUser) return [];

    const similarities: Array<{ userId: string; similarity: number }> = [];

    this.userItemMatrix.forEach((userRow, otherUserId) => {
      if (otherUserId === userId) return;

      const similarity = this.pearsonCorrelation(targetUser, userRow);
      if (similarity > 0) {
        similarities.push({ userId: otherUserId, similarity });
      }
    });

    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  // Pearson correlation coefficient
  private pearsonCorrelation(
    userA: Map<string, number>,
    userB: Map<string, number>,
  ): number {
    const commonItems = new Set(
      [...userA.keys()].filter((key) => userB.has(key)),
    );
    if (commonItems.size < 2) return 0;

    const commonArray = Array.from(commonItems);
    const n = commonArray.length;

    let sumA = 0,
      sumB = 0,
      sumAB = 0;
    let sumA2 = 0,
      sumB2 = 0;

    commonArray.forEach((item) => {
      const a = userA.get(item) || 0;
      const b = userB.get(item) || 0;

      sumA += a;
      sumB += b;
      sumAB += a * b;
      sumA2 += a * a;
      sumB2 += b * b;
    });

    const numerator = n * sumAB - sumA * sumB;
    const denominator = Math.sqrt(
      (n * sumA2 - sumA * sumA) * (n * sumB2 - sumB * sumB),
    );

    if (denominator === 0) return 0;

    return Math.max(0, Math.min(1, numerator / denominator)); // Clamp to [0, 1]
  }

  // Get content performance statistics
  getContentStats(): {
    totalItems: number;
    avgConversionRate: number;
    topPerforming: ContentItem[];
    worstPerforming: ContentItem[];
  } {
    const items = Array.from(this.contentItems.values());

    if (items.length === 0) {
      return {
        totalItems: 0,
        avgConversionRate: 0,
        topPerforming: [],
        worstPerforming: [],
      };
    }

    const avgConversionRate =
      items.reduce((sum, item) => sum + item.performance.conversionRate, 0) /
      items.length;

    const sortedByConversion = items.sort(
      (a, b) => b.performance.conversionRate - a.performance.conversionRate,
    );

    return {
      totalItems: items.length,
      avgConversionRate,
      topPerforming: sortedByConversion.slice(0, 5),
      worstPerforming: sortedByConversion.slice(-5).reverse(),
    };
  }
}

// Global recommendation engine
export const contentRecommendation = new CollaborativeFiltering();

// Sample content items for the system
export const sampleContentItems: ContentItem[] = [
  {
    id: "hero_enterprise",
    type: "page",
    title: "Enterprise Solutions",
    category: "enterprise",
    tags: ["b2b", "enterprise", "security"],
    targetAudience: ["enterprise", "large_business"],
    performance: {
      views: 1250,
      conversions: 89,
      conversionRate: 7.1,
      avgTimeOnPage: 180,
    },
  },
  {
    id: "pricing_startup",
    type: "page",
    title: "Startup Pricing",
    category: "pricing",
    tags: ["startup", "affordable", "growth"],
    targetAudience: ["startup", "small_business"],
    performance: {
      views: 2100,
      conversions: 156,
      conversionRate: 7.4,
      avgTimeOnPage: 120,
    },
  },
  {
    id: "demo_interactive",
    type: "feature",
    title: "Interactive Demo",
    category: "demo",
    tags: ["demo", "interactive", "trial"],
    targetAudience: ["all"],
    performance: {
      views: 890,
      conversions: 134,
      conversionRate: 15.1,
      avgTimeOnPage: 300,
    },
  },
  {
    id: "cta_free_trial",
    type: "cta",
    title: "Start Free Trial",
    category: "conversion",
    tags: ["trial", "free", "conversion"],
    targetAudience: ["all"],
    performance: {
      views: 5200,
      conversions: 312,
      conversionRate: 6.0,
      avgTimeOnPage: 0,
    },
  },
  {
    id: "features_advanced",
    type: "page",
    title: "Advanced Features",
    category: "features",
    tags: ["advanced", "premium", "ai"],
    targetAudience: ["technical", "enterprise"],
    performance: {
      views: 780,
      conversions: 67,
      conversionRate: 8.6,
      avgTimeOnPage: 240,
    },
  },
];

// Initialize with sample content
contentRecommendation.addContentItems(sampleContentItems);

// Utility functions
export const recommendationUtils = {
  // Record user interaction
  recordInteraction: (interaction: UserContentInteraction) => {
    contentRecommendation.recordInteraction(interaction);
  },

  // Get recommendations for user
  getRecommendations: (userId: string, limit = 5) => {
    return contentRecommendation.getRecommendations(userId, limit);
  },

  // Update content similarities (should be called periodically)
  updateSimilarities: () => {
    contentRecommendation.calculateItemSimilarities();
  },

  // Get content statistics
  getStats: () => {
    return contentRecommendation.getContentStats();
  },

  // Generate synthetic interactions for testing
  generateSyntheticInteractions: (
    userCount: number = 100,
    interactionsPerUser: number = 10,
  ) => {
    const interactions: UserContentInteraction[] = [];
    const contentIds = sampleContentItems.map((item) => item.id);

    for (let userIndex = 0; userIndex < userCount; userIndex++) {
      const userId = `user_${userIndex}`;

      // Each user interacts with random content
      for (let i = 0; i < interactionsPerUser; i++) {
        const contentId =
          contentIds[Math.floor(Math.random() * contentIds.length)];
        const interactionTypes: UserContentInteraction["interactionType"][] = [
          "view",
          "click",
          "convert",
          "dismiss",
        ];
        const interactionType =
          interactionTypes[Math.floor(Math.random() * interactionTypes.length)];

        interactions.push({
          userId,
          contentId,
          interactionType,
          timestamp: Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000, // Random time in last 30 days
          duration:
            interactionType === "view" ? Math.random() * 300 : undefined,
          value:
            interactionType === "convert" ? Math.random() * 100 : undefined,
        });
      }
    }

    // Record all interactions
    interactions.forEach((interaction) => {
      contentRecommendation.recordInteraction(interaction);
    });

    return interactions;
  },
};
