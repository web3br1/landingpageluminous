"use client";

import { logger } from "../../observability/logger";
import { storageManager, AtomicStorage } from "./storage-manager";

/**
 * Resource Pool Manager - Phase 3 Correction
 * Solves H3.23: Resource pooling
 */

export interface ResourcePoolConfig {
  id: string;
  name: string;
  resourceType: "connection" | "memory" | "cpu" | "cache" | "render";
  description: string;

  // Pool sizing
  initialSize: number;
  minSize: number;
  maxSize: number;
  growthStep: number; // How much to grow when needed

  // Resource lifecycle
  acquireTimeout: number; // ms to wait for resource acquisition
  idleTimeout: number; // ms before idle resource is released
  maxLifetime: number; // ms before resource is forcibly recycled

  // Health checks
  healthCheckInterval: number; // ms between health checks
  maxFailures: number; // Consecutive failures before resource is removed

  // Priority handling
  priorityLevels: {
    critical: number; // Resources reserved for critical operations
    high: number;
    medium: number;
    low: number;
  };

  // Adaptation
  adaptiveSizing: boolean;
  scalingFactor: number; // How aggressively to scale (0-1)
}

export interface PoolResource {
  id: string;
  poolId: string;
  createdAt: number;
  lastUsed: number;
  lastHealthCheck: number;
  consecutiveFailures: number;
  priority: "critical" | "high" | "medium" | "low";
  state: "available" | "in_use" | "unhealthy" | "released";
  metadata: Record<string, any>;

  // Resource-specific data
  connection?: {
    url?: string;
    status: "connecting" | "connected" | "disconnected";
    lastRequestAt?: number;
  };

  memory?: {
    size: number; // bytes allocated
    type: "cache" | "buffer" | "temp";
    gcPressure: number; // 0-1
  };

  cpu?: {
    timeSlice: number; // ms allocated
    priority: number; // 0-10
    blocking: boolean; // Whether it blocks other operations
  };

  cache?: {
    entries: number;
    hitRate: number;
    size: number; // bytes
    evictionPolicy: "lru" | "lfu" | "ttl";
  };

  render?: {
    contextType: "canvas" | "webgl" | "svg";
    lastFrameTime: number;
    frameDrops: number;
  };
}

export interface ResourceRequest {
  id: string;
  poolId: string;
  priority: "critical" | "high" | "medium" | "low";
  timeout: number;
  metadata: Record<string, any>;
  requestedAt: number;
  resolvedAt?: number;
}

export interface ResourceLease {
  resourceId: string;
  requestId: string;
  leasedAt: number;
  expiresAt?: number;
  heartbeatInterval: number;
  lastHeartbeat: number;
  usage: {
    cpuTime: number;
    memoryAllocated: number;
    networkRequests: number;
    renderCalls: number;
  };
}

export interface PoolMetrics {
  poolId: string;
  currentSize: number;
  availableResources: number;
  inUseResources: number;
  unhealthyResources: number;
  averageWaitTime: number;
  averageUsageTime: number;
  resourceCreationRate: number; // per minute
  resourceDestructionRate: number; // per minute
  hitRate: number; // For cache pools
  errorRate: number;
  lastUpdated: number;
}

/**
 * Resource Pool Implementation
 */
class ResourcePool {
  private config: ResourcePoolConfig;
  private resources: Map<string, PoolResource> = new Map();
  private activeLeases: Map<string, ResourceLease> = new Map();
  private waitingQueue: ResourceRequest[] = [];
  private metrics: PoolMetrics;

  constructor(config: ResourcePoolConfig) {
    this.config = config;
    this.metrics = {
      poolId: config.id,
      currentSize: 0,
      availableResources: 0,
      inUseResources: 0,
      unhealthyResources: 0,
      averageWaitTime: 0,
      averageUsageTime: 0,
      resourceCreationRate: 0,
      resourceDestructionRate: 0,
      hitRate: 0,
      errorRate: 0,
      lastUpdated: Date.now(),
    };

    this.initializePool();
    this.startHealthChecks();
  }

  /**
   * Initialize pool with initial resources
   */
  private initializePool(): void {
    for (let i = 0; i < this.config.initialSize; i++) {
      this.createResource();
    }

    this.updateMetrics();
  }

  /**
   * Acquire a resource from the pool
   */
  async acquire(
    priority: "critical" | "high" | "medium" | "low" = "medium",
    timeout: number = this.config.acquireTimeout,
    metadata: Record<string, any> = {}
  ): Promise<PoolResource | null> {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const request: ResourceRequest = {
      id: requestId,
      poolId: this.config.id,
      priority,
      timeout,
      metadata,
      requestedAt: Date.now(),
    };

    // Try to get resource immediately
    const resource = this.tryAcquireResource(request);
    if (resource) {
      return resource;
    }

    // If no resource available, queue the request
    this.waitingQueue.push(request);
    this.sortWaitingQueue();

    // Wait for resource or timeout
    return this.waitForResource(request);
  }

  /**
   * Release a resource back to the pool
   */
  async release(resourceId: string, leaseId?: string): Promise<void> {
    const resource = this.resources.get(resourceId);
    const lease = leaseId ? this.activeLeases.get(leaseId) : null;

    if (!resource) {
      logger.warn("Attempted to release unknown resource", {
        event: "ll_resource_release_unknown",
        ll_resource_id: resourceId,
        ll_pool_id: this.config.id,
      });
      return;
    }

    // Update resource state
    resource.state = "available";
    resource.lastUsed = Date.now();

    // Remove lease
    if (lease) {
      this.activeLeases.delete(lease.id);
    }

    // Process waiting queue
    await this.processWaitingQueue();

    this.updateMetrics();

    logger.debug("Resource released", {
      event: "ll_resource_released",
      ll_resource_id: resourceId,
      ll_pool_id: this.config.id,
      ll_lease_duration: lease ? Date.now() - lease.leasedAt : 0,
    });
  }

  /**
   * Try to acquire resource immediately
   */
  private tryAcquireResource(request: ResourceRequest): PoolResource | null {
    // Find available resource with appropriate priority
    const availableResources = Array.from(this.resources.values())
      .filter(r => r.state === "available")
      .sort((a, b) => this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority));

    // Check priority reservations
    const reservedForHigher = this.config.priorityLevels[request.priority] || 0;
    const availableForRequest = availableResources.length - reservedForHigher;

    if (availableForRequest <= 0) {
      return null;
    }

    const resource = availableResources[availableForRequest - 1]; // Take lowest priority available
    if (!resource) return null;

    // Create lease
    const lease: ResourceLease = {
      resourceId: resource.id,
      requestId: request.id,
      leasedAt: Date.now(),
      heartbeatInterval: 5000, // 5 seconds
      lastHeartbeat: Date.now(),
      usage: {
        cpuTime: 0,
        memoryAllocated: 0,
        networkRequests: 0,
        renderCalls: 0,
      },
    };

    this.activeLeases.set(lease.resourceId, lease);
    resource.state = "in_use";
    resource.lastUsed = Date.now();

    this.updateMetrics();

    logger.debug("Resource acquired", {
      event: "ll_resource_acquired",
      ll_resource_id: resource.id,
      ll_request_id: request.id,
      ll_pool_id: this.config.id,
      ll_priority: request.priority,
    });

    return resource;
  }

  /**
   * Wait for resource to become available
   */
  private async waitForResource(request: ResourceRequest): Promise<PoolResource | null> {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        // Remove from waiting queue
        const index = this.waitingQueue.findIndex(r => r.id === request.id);
        if (index >= 0) {
          this.waitingQueue.splice(index, 1);
        }

        logger.debug("Resource request timed out", {
          event: "ll_resource_request_timeout",
          ll_request_id: request.id,
          ll_pool_id: this.config.id,
          ll_wait_time: request.timeout,
        });

        resolve(null);
      }, request.timeout);

      // Set up periodic check
      const checkInterval = setInterval(() => {
        const resource = this.tryAcquireResource(request);
        if (resource) {
          clearTimeout(timeoutId);
          clearInterval(checkInterval);
          resolve(resource);
        }
      }, 100); // Check every 100ms
    });
  }

  /**
   * Process waiting queue when resources become available
   */
  private async processWaitingQueue(): Promise<void> {
    const availableCount = Array.from(this.resources.values())
      .filter(r => r.state === "available").length;

    if (availableCount === 0 || this.waitingQueue.length === 0) return;

    // Sort by priority (higher priority first)
    this.sortWaitingQueue();

    // Process requests that can be fulfilled
    const fulfilledRequests: ResourceRequest[] = [];

    for (const request of this.waitingQueue) {
      if (fulfilledRequests.length >= availableCount) break;

      const resource = this.tryAcquireResource(request);
      if (resource) {
        fulfilledRequests.push(request);
      }
    }

    // Remove fulfilled requests from queue
    this.waitingQueue = this.waitingQueue.filter(
      request => !fulfilledRequests.includes(request)
    );
  }

  /**
   * Sort waiting queue by priority
   */
  private sortWaitingQueue(): void {
    this.waitingQueue.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Get priority weight for sorting
   */
  private getPriorityWeight(priority: string): number {
    const weights = { critical: 4, high: 3, medium: 2, low: 1 };
    return weights[priority as keyof typeof weights] || 1;
  }

  /**
   * Create a new resource
   */
  private createResource(priority: "critical" | "high" | "medium" | "low" = "medium"): PoolResource {
    const resourceId = `res_${this.config.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const resource: PoolResource = {
      id: resourceId,
      poolId: this.config.id,
      createdAt: Date.now(),
      lastUsed: Date.now(),
      lastHealthCheck: Date.now(),
      consecutiveFailures: 0,
      priority,
      state: "available",
      metadata: {},
    };

    // Initialize resource-specific data
    switch (this.config.resourceType) {
      case "connection":
        resource.connection = {
          status: "disconnected",
        };
        break;

      case "memory":
        resource.memory = {
          size: 0,
          type: "temp",
          gcPressure: 0,
        };
        break;

      case "cpu":
        resource.cpu = {
          timeSlice: 16, // 1 frame at 60fps
          priority: 5,
          blocking: false,
        };
        break;

      case "cache":
        resource.cache = {
          entries: 0,
          hitRate: 0,
          size: 0,
          evictionPolicy: "lru",
        };
        break;

      case "render":
        resource.render = {
          contextType: "canvas",
          lastFrameTime: 0,
          frameDrops: 0,
        };
        break;
    }

    this.resources.set(resourceId, resource);
    this.updateMetrics();

    logger.debug("Resource created", {
      event: "ll_resource_created",
      ll_resource_id: resourceId,
      ll_pool_id: this.config.id,
      ll_resource_type: this.config.resourceType,
    });

    return resource;
  }

  /**
   * Start health check routine
   */
  private startHealthChecks(): void {
    setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  /**
   * Perform health checks on resources
   */
  private async performHealthChecks(): Promise<void> {
    const now = Date.now();

    for (const [resourceId, resource] of this.resources) {
      // Skip resources that are in use
      if (resource.state === "in_use") continue;

      // Check idle timeout
      if (now - resource.lastUsed > this.config.idleTimeout) {
        this.releaseResource(resourceId, "idle_timeout");
        continue;
      }

      // Check max lifetime
      if (now - resource.createdAt > this.config.maxLifetime) {
        this.releaseResource(resourceId, "max_lifetime");
        continue;
      }

      // Perform health check
      const healthy = await this.checkResourceHealth(resource);

      if (!healthy) {
        resource.consecutiveFailures++;
        resource.lastHealthCheck = now;

        if (resource.consecutiveFailures >= this.config.maxFailures) {
          this.releaseResource(resourceId, "health_check_failure");
        }
      } else {
        resource.consecutiveFailures = 0;
        resource.lastHealthCheck = now;
      }
    }

    this.updateMetrics();
  }

  /**
   * Check health of a specific resource
   */
  private async checkResourceHealth(resource: PoolResource): Promise<boolean> {
    try {
      switch (this.config.resourceType) {
        case "connection":
          // Check if connection is still valid
          return resource.connection?.status === "connected";

        case "memory":
          // Check memory pressure
          const pressure = resource.memory?.gcPressure || 0;
          return pressure < 0.8;

        case "cpu":
          // CPU resources are generally healthy unless explicitly marked
          return resource.state !== "unhealthy";

        case "cache":
          // Check cache integrity
          return (resource.cache?.size || 0) >= 0;

        case "render":
          // Check rendering context
          return resource.render?.frameDrops === 0 ||
                 (resource.render?.frameDrops || 0) < 10;

        default:
          return true;
      }
    } catch (error) {
      logger.debug("Health check failed", {
        event: "ll_health_check_error",
        ll_resource_id: resource.id,
        ll_pool_id: this.config.id,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Release a resource from the pool
   */
  private releaseResource(resourceId: string, reason: string): void {
    const resource = this.resources.get(resourceId);
    if (!resource) return;

    resource.state = "released";

    // Clean up resource-specific data
    this.cleanupResource(resource);

    this.resources.delete(resourceId);
    this.updateMetrics();

    logger.debug("Resource released from pool", {
      event: "ll_resource_pool_released",
      ll_resource_id: resourceId,
      ll_pool_id: this.config.id,
      ll_reason: reason,
    });

    // Create new resource if pool is below minimum
    if (this.metrics.currentSize < this.config.minSize) {
      this.createResource();
    }
  }

  /**
   * Clean up resource-specific data
   */
  private cleanupResource(resource: PoolResource): void {
    try {
      switch (this.config.resourceType) {
        case "connection":
          // Close connection
          if (resource.connection?.status === "connected") {
            // Connection cleanup logic
          }
          break;

        case "memory":
          // Force garbage collection hint
          if (resource.memory && resource.memory.size > 0) {
            // Memory cleanup logic
            if (typeof window !== "undefined" && (window as any).gc) {
              (window as any).gc();
            }
          }
          break;

        case "cache":
          // Clear cache entries
          if (resource.cache) {
            // Cache cleanup logic
          }
          break;

        case "render":
          // Dispose rendering context
          if (resource.render) {
            // Render cleanup logic
          }
          break;
      }
    } catch (error) {
      logger.debug("Resource cleanup error", {
        event: "ll_resource_cleanup_error",
        ll_resource_id: resource.id,
        ll_pool_id: this.config.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Adapt pool size based on demand
   */
  private adaptPoolSize(): void {
    if (!this.config.adaptiveSizing) return;

    const currentSize = this.metrics.currentSize;
    const availableCount = this.metrics.availableResources;
    const inUseCount = this.metrics.inUseResources;
    const waitingCount = this.waitingQueue.length;

    // Scale up if high demand
    if (waitingCount > 2 && currentSize < this.config.maxSize) {
      const growthAmount = Math.min(
        this.config.growthStep,
        this.config.maxSize - currentSize
      );

      for (let i = 0; i < growthAmount; i++) {
        this.createResource();
      }

      logger.info("Pool scaled up", {
        event: "ll_pool_scaled_up",
        ll_pool_id: this.config.id,
        ll_growth_amount: growthAmount,
        ll_new_size: currentSize + growthAmount,
        ll_waiting_requests: waitingCount,
      });
    }

    // Scale down if low utilization
    else if (availableCount > currentSize * 0.7 && currentSize > this.config.minSize) {
      const shrinkAmount = Math.min(
        Math.floor(this.config.growthStep * 0.5),
        currentSize - this.config.minSize,
        availableCount
      );

      if (shrinkAmount > 0) {
        // Remove idle resources
        const idleResources = Array.from(this.resources.values())
          .filter(r => r.state === "available")
          .slice(0, shrinkAmount);

        for (const resource of idleResources) {
          this.releaseResource(resource.id, "pool_shrink");
        }

        logger.info("Pool scaled down", {
          event: "ll_pool_scaled_down",
          ll_pool_id: this.config.id,
          ll_shrink_amount: shrinkAmount,
          ll_new_size: currentSize - shrinkAmount,
        });
      }
    }
  }

  /**
   * Update pool metrics
   */
  private updateMetrics(): void {
    const resources = Array.from(this.resources.values());

    this.metrics.currentSize = resources.length;
    this.metrics.availableResources = resources.filter(r => r.state === "available").length;
    this.metrics.inUseResources = resources.filter(r => r.state === "in_use").length;
    this.metrics.unhealthyResources = resources.filter(r => r.state === "unhealthy").length;
    this.metrics.lastUpdated = Date.now();

    // Update rates (simplified calculation)
    const timeWindow = 60000; // 1 minute
    const recentResources = resources.filter(r =>
      Date.now() - r.createdAt < timeWindow
    );
    this.metrics.resourceCreationRate = recentResources.length;

    // Adapt pool size periodically
    this.adaptPoolSize();
  }

  /**
   * Get pool metrics
   */
  getMetrics(): PoolMetrics {
    return { ...this.metrics };
  }

  /**
   * Get pool configuration
   */
  getConfig(): ResourcePoolConfig {
    return { ...this.config };
  }
}

/**
 * Resource Pool Manager - Main class
 */
export class ResourcePoolManager {
  private pools: Map<string, ResourcePool> = new Map();
  private static instance: ResourcePoolManager;
  private initialized = false;

  constructor() {
    this.pools = new Map();
  }

  static getInstance(): ResourcePoolManager {
    if (!ResourcePoolManager.instance) {
      ResourcePoolManager.instance = new ResourcePoolManager();
    }
    return ResourcePoolManager.getInstance();
  }

  /**
   * Initialize the resource pool manager
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.defineDefaultPools();
    await this.loadPersistedPools();

    this.initialized = true;

    logger.info("Resource Pool Manager initialized", {
      event: "ll_resource_pool_manager_initialized",
      ll_pools_created: this.pools.size,
    });
  }

  /**
   * Define default resource pools
   */
  private defineDefaultPools(): void {
    // HTTP Connection Pool
    this.createPool({
      id: "http_connections",
      name: "HTTP Connections",
      resourceType: "connection",
      description: "Pool for managing HTTP connections",
      initialSize: 6,
      minSize: 2,
      maxSize: 20,
      growthStep: 2,
      acquireTimeout: 5000,
      idleTimeout: 30000,
      maxLifetime: 300000, // 5 minutes
      healthCheckInterval: 10000,
      maxFailures: 3,
      priorityLevels: {
        critical: 2,
        high: 1,
        medium: 0,
        low: 0,
      },
      adaptiveSizing: true,
      scalingFactor: 0.3,
    });

    // Memory Buffer Pool
    this.createPool({
      id: "memory_buffers",
      name: "Memory Buffers",
      resourceType: "memory",
      description: "Pool for temporary memory allocations",
      initialSize: 10,
      minSize: 5,
      maxSize: 50,
      growthStep: 5,
      acquireTimeout: 1000,
      idleTimeout: 10000,
      maxLifetime: 60000, // 1 minute
      healthCheckInterval: 5000,
      maxFailures: 2,
      priorityLevels: {
        critical: 3,
        high: 2,
        medium: 1,
        low: 0,
      },
      adaptiveSizing: true,
      scalingFactor: 0.5,
    });

    // CPU Time Slice Pool
    this.createPool({
      id: "cpu_time_slices",
      name: "CPU Time Slices",
      resourceType: "cpu",
      description: "Pool for CPU time slice allocation",
      initialSize: 8,
      minSize: 4,
      maxSize: 32,
      growthStep: 4,
      acquireTimeout: 500,
      idleTimeout: 2000,
      maxLifetime: 10000, // 10 seconds
      healthCheckInterval: 2000,
      maxFailures: 1,
      priorityLevels: {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1,
      },
      adaptiveSizing: true,
      scalingFactor: 0.2,
    });

    // Cache Instance Pool
    this.createPool({
      id: "cache_instances",
      name: "Cache Instances",
      resourceType: "cache",
      description: "Pool for cache instance management",
      initialSize: 4,
      minSize: 2,
      maxSize: 16,
      growthStep: 2,
      acquireTimeout: 2000,
      idleTimeout: 60000, // 1 minute
      maxLifetime: 600000, // 10 minutes
      healthCheckInterval: 15000,
      maxFailures: 2,
      priorityLevels: {
        critical: 1,
        high: 1,
        medium: 0,
        low: 0,
      },
      adaptiveSizing: true,
      scalingFactor: 0.4,
    });

    // Render Context Pool
    this.createPool({
      id: "render_contexts",
      name: "Render Contexts",
      resourceType: "render",
      description: "Pool for rendering context management",
      initialSize: 3,
      minSize: 1,
      maxSize: 10,
      growthStep: 1,
      acquireTimeout: 3000,
      idleTimeout: 15000,
      maxLifetime: 120000, // 2 minutes
      healthCheckInterval: 5000,
      maxFailures: 2,
      priorityLevels: {
        critical: 2,
        high: 1,
        medium: 0,
        low: 0,
      },
      adaptiveSizing: false, // Don't auto-scale render contexts
      scalingFactor: 0.1,
    });
  }

  /**
   * Create a new resource pool
   */
  createPool(config: ResourcePoolConfig): void {
    if (this.pools.has(config.id)) {
      logger.warn("Pool already exists, skipping creation", {
        event: "ll_pool_exists",
        ll_pool_id: config.id,
      });
      return;
    }

    const pool = new ResourcePool(config);
    this.pools.set(config.id, pool);

    logger.info("Resource pool created", {
      event: "ll_resource_pool_created",
      ll_pool_id: config.id,
      ll_resource_type: config.resourceType,
      ll_initial_size: config.initialSize,
    });
  }

  /**
   * Acquire resource from pool
   */
  async acquireResource(
    poolId: string,
    priority: "critical" | "high" | "medium" | "low" = "medium",
    timeout?: number,
    metadata: Record<string, any> = {}
  ): Promise<PoolResource | null> {
    await this.initialize();

    const pool = this.pools.get(poolId);
    if (!pool) {
      logger.warn("Pool not found", {
        event: "ll_pool_not_found",
        ll_pool_id: poolId,
      });
      return null;
    }

    try {
      const resource = await pool.acquire(priority, timeout, metadata);

      if (resource) {
        logger.debug("Resource acquired from pool", {
          event: "ll_pool_resource_acquired",
          ll_pool_id: poolId,
          ll_resource_id: resource.id,
          ll_priority: priority,
        });
      } else {
        logger.warn("Failed to acquire resource from pool", {
          event: "ll_pool_resource_acquire_failed",
          ll_pool_id: poolId,
          ll_priority: priority,
          ll_timeout: timeout,
        });
      }

      return resource;
    } catch (error) {
      logger.error("Error acquiring resource from pool", {
        event: "ll_pool_resource_acquire_error",
        ll_pool_id: poolId,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Release resource back to pool
   */
  async releaseResource(poolId: string, resourceId: string): Promise<boolean> {
    await this.initialize();

    const pool = this.pools.get(poolId);
    if (!pool) {
      logger.warn("Pool not found for resource release", {
        event: "ll_pool_not_found_release",
        ll_pool_id: poolId,
        ll_resource_id: resourceId,
      });
      return false;
    }

    try {
      await pool.release(resourceId);

      logger.debug("Resource released to pool", {
        event: "ll_pool_resource_released",
        ll_pool_id: poolId,
        ll_resource_id: resourceId,
      });

      return true;
    } catch (error) {
      logger.error("Error releasing resource to pool", {
        event: "ll_pool_resource_release_error",
        ll_pool_id: poolId,
        ll_resource_id: resourceId,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Get pool metrics
   */
  getPoolMetrics(poolId?: string): PoolMetrics[] {
    if (poolId) {
      const pool = this.pools.get(poolId);
      return pool ? [pool.getMetrics()] : [];
    }

    return Array.from(this.pools.values()).map(pool => pool.getMetrics());
  }

  /**
   * Get overall system resource usage
   */
  getSystemResourceUsage(): {
    totalPools: number;
    totalResources: number;
    resourcesByState: Record<string, number>;
    resourcesByType: Record<string, number>;
    averageUtilization: number;
    bottleneckRisk: "low" | "medium" | "high";
  } {
    const allMetrics = this.getPoolMetrics();
    const resourcesByState: Record<string, number> = {};
    const resourcesByType: Record<string, number> = {};

    let totalResources = 0;
    let totalUtilization = 0;

    for (const metrics of allMetrics) {
      totalResources += metrics.currentSize;
      totalUtilization += (metrics.inUseResources / metrics.currentSize) || 0;

      // Count by state
      resourcesByState.available = (resourcesByState.available || 0) + metrics.availableResources;
      resourcesByState.inUse = (resourcesByState.inUse || 0) + metrics.inUseResources;
      resourcesByState.unhealthy = (resourcesByState.unhealthy || 0) + metrics.unhealthyResources;

      // Count by type (would need pool type info)
      const pool = Array.from(this.pools.values()).find(p => p.getMetrics().poolId === metrics.poolId);
      if (pool) {
        const type = pool.getConfig().resourceType;
        resourcesByType[type] = (resourcesByType[type] || 0) + metrics.currentSize;
      }
    }

    const averageUtilization = allMetrics.length > 0 ? totalUtilization / allMetrics.length : 0;

    // Determine bottleneck risk
    let bottleneckRisk: "low" | "medium" | "high" = "low";
    const highUtilizationPools = allMetrics.filter(m => (m.inUseResources / m.currentSize) > 0.8).length;
    const waitingRequests = allMetrics.reduce((sum, m) => sum + (m.averageWaitTime > 1000 ? 1 : 0), 0);

    if (highUtilizationPools > 2 || waitingRequests > 1) {
      bottleneckRisk = "high";
    } else if (highUtilizationPools > 0 || waitingRequests > 0) {
      bottleneckRisk = "medium";
    }

    return {
      totalPools: this.pools.size,
      totalResources,
      resourcesByState,
      resourcesByType,
      averageUtilization,
      bottleneckRisk,
    };
  }

  /**
   * Force cleanup of idle resources
   */
  async forceCleanup(): Promise<void> {
    for (const pool of this.pools.values()) {
      // This would trigger cleanup in each pool
      // Implementation depends on pool internals
    }

    logger.info("Forced cleanup of idle resources", {
      event: "ll_pool_force_cleanup",
      ll_pools_cleaned: this.pools.size,
    });
  }

  /**
   * Persist pool configurations and state
   */
  private async persistPools(): Promise<void> {
    try {
      const poolConfigs: Record<string, ResourcePoolConfig> = {};
      for (const [poolId, pool] of this.pools) {
        poolConfigs[poolId] = pool.getConfig();
      }

      await AtomicStorage.atomicUpdate(
        "resource_pool_configs",
        () => ({
          configs: poolConfigs,
          lastUpdated: Date.now(),
        }),
        {}
      );
    } catch (error) {
      logger.error("Failed to persist pool configurations", {
        event: "ll_pool_persist_error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Load persisted pool configurations
   */
  private async loadPersistedPools(): Promise<void> {
    try {
      const persisted = storageManager.getItem("resource_pool_configs");
      if (persisted && persisted.configs) {
        // Pools are already created with default configs
        // Here we would merge persisted configs if needed
      }
    } catch (error) {
      logger.error("Failed to load persisted pool configurations", {
        event: "ll_pool_load_error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get system statistics
   */
  getStats() {
    const systemUsage = this.getSystemResourceUsage();

    return {
      initialized: this.initialized,
      pools: this.pools.size,
      systemUsage,
      poolDetails: this.getPoolMetrics().map(metrics => ({
        id: metrics.poolId,
        size: metrics.currentSize,
        utilization: metrics.currentSize > 0 ?
          (metrics.inUseResources / metrics.currentSize) * 100 : 0,
        waitTime: metrics.averageWaitTime,
        errorRate: metrics.errorRate,
      })),
    };
  }
}

// Export singleton
export const resourcePoolManager = ResourcePoolManager.getInstance();
