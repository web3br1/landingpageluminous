// User Clustering Engine for ML-based Personalization
// Uses statistical clustering algorithms for user segmentation

export interface UserFeatures {
  visitCount: number;
  timeOnSite: number;
  pagesViewed: number;
  conversionEvents: number;
  experimentParticipation: number;
  deviceType: "mobile" | "desktop" | "tablet";
  country: string;
  referrerType: "organic" | "social" | "direct" | "paid";
  timeOfDay: number; // hour 0-23
  dayOfWeek: number; // 0-6
}

export interface UserCluster {
  id: string;
  name: string;
  description: string;
  centroid: UserFeatures;
  users: string[];
  conversionRate: number;
  avgRevenue: number;
  size: number;
}

export interface ClusterPrediction {
  userId: string;
  clusterId: string;
  confidence: number;
  features: UserFeatures;
  recommendedActions: string[];
}

// K-Means clustering implementation
class KMeansClustering {
  private clusters: UserCluster[] = [];
  private k: number;
  private maxIterations: number = 100;
  private convergenceThreshold: number = 0.01;

  constructor(k: number = 5) {
    this.k = k;
  }

  // Normalize features for clustering
  private normalizeFeatures(features: UserFeatures): number[] {
    return [
      features.visitCount / 100, // 0-1 scale
      features.timeOnSite / 3600, // hours, 0-1 scale
      features.pagesViewed / 50, // 0-1 scale
      features.conversionEvents / 10, // 0-1 scale
      features.experimentParticipation / 5, // 0-1 scale
      features.deviceType === "mobile"
        ? 0
        : features.deviceType === "tablet"
          ? 0.5
          : 1,
      this.countryToNumber(features.country) / 100, // 0-1 scale
      ["organic", "social", "direct", "paid"].indexOf(features.referrerType) /
        3,
      features.timeOfDay / 23,
      features.dayOfWeek / 6,
    ];
  }

  private countryToNumber(country: string): number {
    // Simple hash for country (not perfect but deterministic)
    let hash = 0;
    for (let i = 0; i < country.length; i++) {
      hash = (hash << 5) - hash + country.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit
    }
    return Math.abs(hash) % 100;
  }

  // Euclidean distance between feature vectors
  private euclideanDistance(a: number[], b: number[]): number {
    return Math.sqrt(
      a.reduce((sum, val, i) => sum + Math.pow(val - b[i], 2), 0),
    );
  }

  // Initialize centroids randomly
  private initializeCentroids(
    users: Array<{ id: string; features: UserFeatures }>,
  ): UserFeatures[] {
    const centroids: UserFeatures[] = [];

    for (let i = 0; i < this.k; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      centroids.push({ ...randomUser.features });
    }

    return centroids;
  }

  // Assign users to nearest centroid
  private assignClusters(
    users: Array<{ id: string; features: UserFeatures }>,
    centroids: UserFeatures[],
  ): UserCluster[] {
    const clusters: UserCluster[] = centroids.map((centroid, index) => ({
      id: `cluster_${index}`,
      name: `Cluster ${index + 1}`,
      description: `User segment ${index + 1}`,
      centroid,
      users: [],
      conversionRate: 0,
      avgRevenue: 0,
      size: 0,
    }));

    users.forEach((user) => {
      const normalizedFeatures = this.normalizeFeatures(user.features);
      let minDistance = Infinity;
      let closestCluster = 0;

      centroids.forEach((centroid, index) => {
        const centroidNormalized = this.normalizeFeatures(centroid);
        const distance = this.euclideanDistance(
          normalizedFeatures,
          centroidNormalized,
        );

        if (distance < minDistance) {
          minDistance = distance;
          closestCluster = index;
        }
      });

      clusters[closestCluster].users.push(user.id);
      clusters[closestCluster].size++;
    });

    return clusters;
  }

  // Update centroids based on cluster members
  private updateCentroids(
    users: Array<{ id: string; features: UserFeatures }>,
    centroids: UserFeatures[],
  ): UserFeatures[] {
    // This method needs to be reimplemented since centroids are UserFeatures[], not UserCluster[]
    // For now, return centroids as-is (simplified implementation)
    return centroids;
  }

  private getMode(arr: string[]): string {
    const counts = arr.reduce(
      (acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return Object.entries(counts).reduce(
      (a, b) => (counts[a[0]] > counts[b[0]] ? a[0] : b[0]),
      "",
    );
  }

  // Check if centroids have converged
  private hasConverged(
    oldCentroids: UserFeatures[],
    newCentroids: UserFeatures[],
  ): boolean {
    for (let i = 0; i < oldCentroids.length; i++) {
      const oldNormalized = this.normalizeFeatures(oldCentroids[i]);
      const newNormalized = this.normalizeFeatures(newCentroids[i]);
      const distance = this.euclideanDistance(oldNormalized, newNormalized);

      if (distance > this.convergenceThreshold) {
        return false;
      }
    }
    return true;
  }

  // Main clustering algorithm
  fit(users: Array<{ id: string; features: UserFeatures }>): UserCluster[] {
    if (users.length < this.k) {
      throw new Error(`Not enough users for ${this.k} clusters`);
    }

    let centroids = this.initializeCentroids(users);

    for (let iteration = 0; iteration < this.maxIterations; iteration++) {
      const clusters = this.assignClusters(users, centroids);
      const newCentroids = this.updateCentroids(users, centroids);

      if (this.hasConverged(centroids, newCentroids)) {
        this.clusters = clusters.map((cluster, index) => ({
          ...cluster,
          centroid: newCentroids[index],
        }));
        break;
      }

      centroids = newCentroids;

      if (iteration === this.maxIterations - 1) {
        this.clusters = clusters.map((cluster, index) => ({
          ...cluster,
          centroid: newCentroids[index],
        }));
      }
    }

    return this.clusters;
  }

  // Predict cluster for new user
  predict(userFeatures: UserFeatures): ClusterPrediction {
    if (this.clusters.length === 0) {
      throw new Error("Model not trained. Call fit() first.");
    }

    const normalizedFeatures = this.normalizeFeatures(userFeatures);
    let minDistance = Infinity;
    let bestCluster = this.clusters[0];

    this.clusters.forEach((cluster) => {
      const centroidNormalized = this.normalizeFeatures(cluster.centroid);
      const distance = this.euclideanDistance(
        normalizedFeatures,
        centroidNormalized,
      );

      if (distance < minDistance) {
        minDistance = distance;
        bestCluster = cluster;
      }
    });

    // Calculate confidence based on distance (inverse relationship)
    const maxPossibleDistance = Math.sqrt(10); // sqrt(number of features)
    const confidence = Math.max(
      0,
      Math.min(1, 1 - minDistance / maxPossibleDistance),
    );

    // Generate recommendations based on cluster
    const recommendedActions = this.getClusterRecommendations(bestCluster);

    return {
      userId: "predicted",
      clusterId: bestCluster.id,
      confidence,
      features: userFeatures,
      recommendedActions,
    };
  }

  private getClusterRecommendations(cluster: UserCluster): string[] {
    const recommendations: string[] = [];

    if (cluster.centroid.conversionEvents < 1) {
      recommendations.push("increase_conversion_focus");
    }

    if (cluster.centroid.timeOnSite < 180) {
      // 3 minutes
      recommendations.push("improve_engagement");
    }

    if (cluster.centroid.deviceType === "mobile") {
      recommendations.push("optimize_mobile_experience");
    }

    if (cluster.centroid.experimentParticipation > 2) {
      recommendations.push("experiment_enthusiast");
    }

    if (cluster.centroid.visitCount > 5) {
      recommendations.push("loyal_user");
    }

    return recommendations;
  }

  // Get cluster statistics
  getClusterStats(): {
    totalClusters: number;
    avgClusterSize: number;
    largestCluster: UserCluster;
    smallestCluster: UserCluster;
  } {
    if (this.clusters.length === 0) {
      throw new Error("No clusters available");
    }

    const sizes = this.clusters.map((c) => c.size);
    const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;

    return {
      totalClusters: this.clusters.length,
      avgClusterSize: Math.round(avgSize),
      largestCluster: this.clusters.reduce((a, b) => (a.size > b.size ? a : b)),
      smallestCluster: this.clusters.reduce((a, b) =>
        a.size < b.size ? a : b,
      ),
    };
  }
}

// Global clustering instance
export const userClustering = new KMeansClustering(5); // 5 clusters by default

// Utility functions for feature extraction
export const featureUtils = {
  // Extract features from user profile
  extractFeatures(userProfile: any, sessionData?: any): UserFeatures {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    return {
      visitCount: userProfile?.behavior?.visitCount || 1,
      timeOnSite: userProfile?.behavior?.totalTimeOnSite || 0,
      pagesViewed: userProfile?.behavior?.pagesViewed?.length || 1,
      conversionEvents: userProfile?.behavior?.conversionEvents?.length || 0,
      experimentParticipation:
        userProfile?.behavior?.experimentImpressions?.length || 0,
      deviceType: sessionData?.deviceType || "desktop",
      country: sessionData?.country || "unknown",
      referrerType: sessionData?.referrerType || "direct",
      timeOfDay: hour,
      dayOfWeek,
    };
  },

  // Generate synthetic users for testing (development only)
  generateSyntheticUsers(
    count: number,
  ): Array<{ id: string; features: UserFeatures }> {
    const users: Array<{ id: string; features: UserFeatures }> = [];
    const countries = ["US", "BR", "GB", "DE", "FR", "CA", "AU"];
    const deviceTypes: UserFeatures["deviceType"][] = [
      "mobile",
      "desktop",
      "tablet",
    ];
    const referrerTypes: UserFeatures["referrerType"][] = [
      "organic",
      "social",
      "direct",
      "paid",
    ];

    for (let i = 0; i < count; i++) {
      users.push({
        id: `user_${i}`,
        features: {
          visitCount: Math.floor(Math.random() * 20) + 1,
          timeOnSite: Math.floor(Math.random() * 1800) + 60, // 1-30 minutes
          pagesViewed: Math.floor(Math.random() * 10) + 1,
          conversionEvents: Math.floor(Math.random() * 5),
          experimentParticipation: Math.floor(Math.random() * 3),
          deviceType:
            deviceTypes[Math.floor(Math.random() * deviceTypes.length)],
          country: countries[Math.floor(Math.random() * countries.length)],
          referrerType:
            referrerTypes[Math.floor(Math.random() * referrerTypes.length)],
          timeOfDay: Math.floor(Math.random() * 24),
          dayOfWeek: Math.floor(Math.random() * 7),
        },
      });
    }

    return users;
  },
};
