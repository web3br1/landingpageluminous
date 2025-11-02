// User Service - Basic user management for Stripe webhooks
// Temporary implementation until full user system is ready

import { edgeCache as cache } from "../cache/edge-cache";

export interface UserSubscription {
  customerId: string;
  subscriptionId: string;
  status: "active" | "canceled" | "incomplete" | "suspended";
  planId?: string;
  periodStart?: number;
  periodEnd?: number;
  cancelledAt?: number;
}

export interface UserProfile {
  customerId: string;
  email?: string;
  name?: string;
  createdAt: number;
  updatedAt: number;
  subscriptions: UserSubscription[];
}

export class UserService {
  private static instance: UserService;
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  private constructor() {}

  static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  async getUser(customerId: string): Promise<Result<UserProfile, Error>> {
    try {
      const cacheKey = `user:${customerId}`;
      const cached = await cache.get<UserProfile>(cacheKey);

      if (cached) {
        return Result.ok(cached);
      }

      // User not found - return default profile
      const defaultProfile: UserProfile = {
        customerId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        subscriptions: [],
      };

      return Result.ok(defaultProfile);
    } catch (error) {
      console.error("Error getting user:", error);
      return Result.err(new Error(`Failed to get user: ${error}`));
    }
  }

  async updateUserSubscription(
    customerId: string,
    subscriptionData: Partial<UserSubscription>,
  ): Promise<Result<boolean, Error>> {
    try {
      const userResult = await this.getUser(customerId);
      if (isErr(userResult)) {
        return Result.err(userResult.error);
      }

      const user = userResult.value;
      const subscriptionId = subscriptionData.subscriptionId!;

      // Find existing subscription or create new one
      const existingIndex = user.subscriptions.findIndex(
        (sub) => sub.subscriptionId === subscriptionId,
      );

      if (existingIndex >= 0) {
        // Update existing subscription
        user.subscriptions[existingIndex] = {
          ...user.subscriptions[existingIndex],
          ...subscriptionData,
        };
      } else {
        // Add new subscription
        user.subscriptions.push({
          customerId,
          subscriptionId,
          status: "active",
          ...subscriptionData,
        } as UserSubscription);
      }

      user.updatedAt = Date.now();

      // Cache updated user
      const cacheKey = `user:${customerId}`;
      await cache.set(cacheKey, user, { ttl: this.CACHE_TTL });

      console.log(
        `[UserService] Updated subscription for customer ${customerId}:`,
        subscriptionData,
      );
      return Result.ok(true);
    } catch (error) {
      console.error("Error updating user subscription:", error);
      return Result.err(new Error(`Failed to update subscription: ${error}`));
    }
  }

  async updateUserEmail(
    customerId: string,
    email: string,
  ): Promise<Result<boolean, Error>> {
    try {
      const userResult = await this.getUser(customerId);
      if (isErr(userResult)) {
        return Result.err(userResult.error);
      }

      const user = userResult.value;
      user.email = email;
      user.updatedAt = Date.now();

      const cacheKey = `user:${customerId}`;
      await cache.set(cacheKey, user, { ttl: this.CACHE_TTL });

      console.log(
        `[UserService] Updated email for customer ${customerId}: ${email}`,
      );
      return Result.ok(true);
    } catch (error) {
      console.error("Error updating user email:", error);
      return Result.err(new Error(`Failed to update email: ${error}`));
    }
  }
}

export const userService = UserService.getInstance();
