// ===== REAL USER MONITORING (RUM) =====
// Advanced Real User Monitoring with comprehensive metrics and insights

import { advancedAnalytics } from "../analytics/advanced-analytics";
// Removed webVitalsMonitor import - using basic monitoring

interface UserExperienceMetrics {
  // Performance metrics
  lcp: number;
  fid: number;
  cls: number;
  inp: number;
  fcp: number;
  ttfb: number;

  // User interaction metrics
  rageClicks: number;
  deadClicks: number;
  hesitationTime: number;
  scrollDepth: number;
  timeToFirstInteraction: number;

  // Error metrics
  javascriptErrors: number;
  networkErrors: number;
  resourceErrors: number;

  // Business metrics
  conversions: number;
  revenue: number;
  bounceRate: number;
  sessionDuration: number;
}

interface UserSession {
  sessionId: string;
  userId?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  pageViews: PageView[];
  interactions: UserInteraction[];
  errors: ErrorEvent[];
  performance: PerformanceMetrics;
  device: DeviceInfo;
  location?: GeoLocation;
  customMetrics: Record<string, any>;
}

interface PageView {
  url: string;
  timestamp: number;
  referrer?: string;
  loadTime: number;
  domContentLoaded: number;
  firstPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  interactionToNextPaint: number;
  scrollDepth?: number;
}

interface ElementInfo {
  tagName: string;
  className: string;
  id: string;
  textContent?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  attributes: Record<string, string>;
}

interface UserInteraction {
  type:
    | "click"
    | "scroll"
    | "keypress"
    | "touch"
    | "hover"
    | "rage_click"
    | "dead_click";
  timestamp: number;
  element?: ElementInfo;
  position: { x: number; y: number };
  context: Record<string, any>;
}

interface ErrorEvent {
  type: "javascript" | "network" | "resource";
  message: string;
  stack?: string;
  url?: string;
  line?: number;
  column?: number;
  timestamp: number;
  userAgent: string;
  context: Record<string, any>;
}

interface PerformanceMetrics {
  navigation: PerformanceNavigationTiming;
  resources: PerformanceResourceTiming[];
  paint: PerformanceEntry[];
  largestContentfulPaint: PerformanceEntry[];
  layoutShift: PerformanceEntry[];
  firstInput: PerformanceEventTiming[];
  interaction: PerformanceEventTiming[];
}

interface DeviceInfo {
  userAgent: string;
  platform: string;
  language: string;
  timezone: string;
  screenResolution: string;
  viewportSize: string;
  devicePixelRatio: number;
  touchSupport: boolean;
  connectionType?: string;
  memoryInfo?: {
    deviceMemory?: number;
    hardwareConcurrency: number;
  };
}

interface GeoLocation {
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
}

interface RUMConfig {
  enabled: boolean;
  sampleRate: number; // 0-1, percentage of sessions to monitor
  endpoint?: string;
  batchSize: number;
  flushInterval: number;
  trackUserInteractions: boolean;
  trackPerformanceMetrics: boolean;
  trackErrors: boolean;
  enableSessionRecording: boolean;
  maxSessionDuration: number; // minutes
  rageClickThreshold: number; // clicks per second
  deadClickThreshold: number; // ms without response
  customMetrics: string[];
}

interface RUMAlert {
  type: "performance" | "error" | "ux" | "business";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  sessionId: string;
  timestamp: number;
  metrics: Record<string, any>;
  context: Record<string, any>;
}

// ===== RUM ENGINE =====

class RealUserMonitoring {
  private static instance: RealUserMonitoring;
  private config: RUMConfig;
  private currentSession: UserSession | null = null;
  private eventBuffer: UserInteraction[] = [];
  private errorBuffer: ErrorEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private sessionTimeout: NodeJS.Timeout | null = null;
  private interactionTracker: InteractionTracker;
  private performanceObserver: PerformanceObserver | null = null;
  private alerts: RUMAlert[] = [];

  private constructor() {
    this.config = {
      enabled: true,
      sampleRate: 0.1, // Monitor 10% of sessions
      batchSize: 50,
      flushInterval: 30000, // 30 seconds
      trackUserInteractions: true,
      trackPerformanceMetrics: true,
      trackErrors: true,
      enableSessionRecording: false, // Disabled by default for privacy
      maxSessionDuration: 120, // 2 hours
      rageClickThreshold: 3, // 3 clicks per second
      deadClickThreshold: 5000, // 5 seconds
      customMetrics: [],
    };

    this.interactionTracker = new InteractionTracker(this.config);

    this.initializeRUM();
  }

  static getInstance(): RealUserMonitoring {
    if (!RealUserMonitoring.instance) {
      RealUserMonitoring.instance = new RealUserMonitoring();
    }
    return RealUserMonitoring.instance;
  }

  private async initializeRUM(): Promise<void> {
    if (!this.config.enabled) return;

    // SSR Safety: Only initialize on client side
    if (typeof window === "undefined") return;

    // Check if we should monitor this session
    if (Math.random() > this.config.sampleRate) {
      console.log("[RUM] Session not selected for monitoring");
      return;
    }

    await this.startSession();

    if (this.config.trackUserInteractions) {
      this.interactionTracker.startTracking();
    }

    if (this.config.trackPerformanceMetrics) {
      this.setupPerformanceMonitoring();
    }

    if (this.config.trackErrors) {
      this.setupErrorTracking();
    }

    this.scheduleFlush();
    this.setupSessionTimeout();

    console.log("[RUM] Real User Monitoring initialized");
  }

  private async startSession(): Promise<void> {
    const sessionId = this.generateSessionId();
    const deviceInfo = await this.collectDeviceInfo();

    this.currentSession = {
      sessionId,
      userId: this.getUserId(),
      startTime: Date.now(),
      pageViews: [],
      interactions: [],
      errors: [],
      performance: {
        navigation: {} as PerformanceNavigationTiming,
        resources: [],
        paint: [],
        largestContentfulPaint: [],
        layoutShift: [],
        firstInput: [],
        interaction: [],
      },
      device: deviceInfo,
      location: await this.getGeoLocation(),
      customMetrics: {},
    };

    // Track initial page view
    await this.trackPageView(window.location.href, document.referrer);
  }

  private async collectDeviceInfo(): Promise<DeviceInfo> {
    const connection = (navigator as any).connection;

    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      devicePixelRatio: window.devicePixelRatio,
      touchSupport: "ontouchstart" in window,
      connectionType: connection?.effectiveType,
      memoryInfo: {
        deviceMemory: (navigator as any).deviceMemory,
        hardwareConcurrency: navigator.hardwareConcurrency,
      },
    };
  }

  private async getGeoLocation(): Promise<GeoLocation | undefined> {
    // Note: This would typically use a geolocation service
    // For privacy reasons, we don't collect actual location data
    // unless explicitly consented to
    return undefined;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getUserId(): string | undefined {
    // Try to get from analytics or authentication
    return advancedAnalytics.getCurrentJourney()?.anonymousId;
  }

  // ===== PAGE VIEW TRACKING =====

  async trackPageView(url: string, referrer?: string): Promise<void> {
    if (!this.currentSession) return;

    const pageView: PageView = {
      url,
      timestamp: Date.now(),
      referrer,
      loadTime: performance.now(),
      domContentLoaded: 0,
      firstPaint: 0,
      largestContentfulPaint: 0,
      cumulativeLayoutShift: 0,
      firstInputDelay: 0,
      interactionToNextPaint: 0,
    };

    // Get performance metrics for this page
    const navigation = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming;
    if (navigation) {
      pageView.loadTime = navigation.loadEventEnd - navigation.fetchStart;
      pageView.domContentLoaded =
        navigation.domContentLoadedEventEnd - navigation.fetchStart;
    }

    // Get Web Vitals
    const vitals: any[] = []; // Simplified - removed webVitalsMonitor
    vitals.forEach((vital) => {
      switch (vital.name) {
        case "LCP":
          pageView.largestContentfulPaint = vital.value;
          break;
        case "FID":
          pageView.firstInputDelay = vital.value;
          break;
        case "CLS":
          pageView.cumulativeLayoutShift = vital.value;
          break;
        case "INP":
          pageView.interactionToNextPaint = vital.value;
          break;
        case "FCP":
          pageView.firstPaint = vital.value;
          break;
      }
    });

    this.currentSession.pageViews.push(pageView);

    // Track in analytics
    await advancedAnalytics.trackEvent("page", "view", url, undefined, {
      referrer,
    });
  }

  // ===== INTERACTION TRACKING =====

  private setupInteractionTracking(): void {
    this.interactionTracker.onInteraction((interaction: UserInteraction) => {
      if (this.currentSession) {
        this.currentSession.interactions.push(interaction);
        this.eventBuffer.push(interaction);
      }
    });
  }

  // ===== PERFORMANCE MONITORING =====

  private setupPerformanceMonitoring(): void {
    // SSR Safety: Only setup on client side
    if (typeof window === "undefined") return;

    // Observe various performance metrics
    try {
      // Largest Contentful Paint
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.recordPerformanceMetric(entry);
        });
      });

      this.performanceObserver.observe({
        entryTypes: [
          "largest-contentful-paint",
          "layout-shift",
          "first-input",
          // 'interaction' removed - not supported in all browsers
        ],
      });
    } catch (error) {
      console.warn("[RUM] Performance observer not supported:", error);
    }

    // Monitor navigation timing
    window.addEventListener("load", () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType(
          "navigation",
        )[0] as PerformanceNavigationTiming;
        if (navigation && this.currentSession) {
          this.currentSession.performance.navigation = navigation;
        }
      }, 0);
    });
  }

  private recordPerformanceMetric(entry: PerformanceEntry): void {
    if (!this.currentSession) return;

    switch (entry.entryType) {
      case "largest-contentful-paint":
        this.currentSession.performance.largestContentfulPaint.push(entry);
        break;
      case "layout-shift":
        this.currentSession.performance.layoutShift.push(entry);
        break;
      case "first-input":
        this.currentSession.performance.firstInput.push(
          entry as PerformanceEventTiming,
        );
        break;
      // case 'interaction': removed - not supported in all browsers
    }
  }

  // ===== ERROR TRACKING =====

  private setupErrorTracking(): void {
    // JavaScript errors
    window.addEventListener("error", (event) => {
      const errorEvent: ErrorEvent = {
        type: "javascript",
        message: event.message,
        stack: event.error?.stack,
        url: event.filename,
        line: event.lineno,
        column: event.colno,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        context: {
          url: window.location.href,
          userAgent: navigator.userAgent,
        },
      };

      this.recordError(errorEvent);
    });

    // Unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      const errorEvent: ErrorEvent = {
        type: "javascript",
        message: event.reason?.toString() || "Unhandled promise rejection",
        stack: event.reason?.stack,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        context: {
          url: window.location.href,
          reason: event.reason,
        },
      };

      this.recordError(errorEvent);
    });

    // Network errors (for fetch requests)
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (!response.ok && response.status >= 400) {
          const errorEvent: ErrorEvent = {
            type: "network",
            message: `HTTP ${response.status}: ${response.statusText}`,
            url: args[0] as string,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            context: {
              url: window.location.href,
              method: args[1]?.method || "GET",
              status: response.status,
            },
          };
          this.recordError(errorEvent);
        }
        return response;
      } catch (error) {
        const errorEvent: ErrorEvent = {
          type: "network",
          message: (error as Error).message,
          url: args[0] as string,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          context: {
            url: window.location.href,
            method: args[1]?.method || "GET",
          },
        };
        this.recordError(errorEvent);
        throw error;
      }
    };
  }

  private recordError(errorEvent: ErrorEvent): void {
    if (this.currentSession) {
      this.currentSession.errors.push(errorEvent);
      this.errorBuffer.push(errorEvent);
    }

    // Check for alert conditions
    this.checkErrorAlerts(errorEvent);
  }

  // ===== ALERT SYSTEM =====

  private checkErrorAlerts(errorEvent: ErrorEvent): void {
    // Alert on critical errors
    if (
      errorEvent.type === "javascript" &&
      errorEvent.message.includes("ChunkLoadError")
    ) {
      this.createAlert({
        type: "error",
        severity: "critical",
        message: "Critical JavaScript loading error detected",
        sessionId: this.currentSession?.sessionId || "",
        timestamp: Date.now(),
        metrics: { errorType: errorEvent.type, message: errorEvent.message },
        context: errorEvent.context,
      });
    }

    // Alert on high error rates
    const recentErrors = this.errorBuffer.filter(
      (e) => Date.now() - e.timestamp < 60000, // Last minute
    );

    if (recentErrors.length > 10) {
      this.createAlert({
        type: "error",
        severity: "high",
        message: "High error rate detected",
        sessionId: this.currentSession?.sessionId || "",
        timestamp: Date.now(),
        metrics: { errorCount: recentErrors.length, timeWindow: "1min" },
        context: { recentErrors: recentErrors.length },
      });
    }
  }

  private createAlert(alert: RUMAlert): void {
    this.alerts.push(alert);

    // Send alert to monitoring system
    this.sendAlertToMonitoring(alert);

    // Log locally
    console.warn("[RUM Alert]", alert);
  }

  private sendAlertToMonitoring(alert: RUMAlert): void {
    // This would integrate with your monitoring/alerting system
    // e.g., DataDog, New Relic, Sentry, etc.

    if (this.config.endpoint) {
      fetch(`${this.config.endpoint}/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alert),
      }).catch((error) => {
        console.error("[RUM] Failed to send alert:", error);
      });
    }
  }

  // ===== DATA FLUSHING =====

  private scheduleFlush(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }

    this.flushTimer = setTimeout(async () => {
      await this.flushData();
      this.scheduleFlush();
    }, this.config.flushInterval);
  }

  private async flushData(): Promise<void> {
    if (!this.config.endpoint) return;

    const data = {
      session: this.currentSession,
      interactions: [...this.eventBuffer],
      errors: [...this.errorBuffer],
      alerts: [...this.alerts],
      timestamp: Date.now(),
    };

    // Clear buffers after successful send
    if (
      data.interactions.length > 0 ||
      data.errors.length > 0 ||
      data.alerts.length > 0
    ) {
      try {
        const response = await fetch(this.config.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          this.eventBuffer.length = 0;
          this.errorBuffer.length = 0;
          this.alerts.length = 0;
        }
      } catch (error) {
        console.error("[RUM] Failed to flush data:", error);
      }
    }
  }

  private setupSessionTimeout(): void {
    this.sessionTimeout = setTimeout(
      () => {
        this.endSession();
      },
      this.config.maxSessionDuration * 60 * 1000,
    );
  }

  private endSession(): void {
    if (!this.currentSession) return;

    this.currentSession.endTime = Date.now();
    this.currentSession.duration =
      this.currentSession.endTime - this.currentSession.startTime;

    // Final flush
    this.flushData();

    console.log("[RUM] Session ended:", this.currentSession.duration, "ms");
  }

  // ===== PUBLIC API =====

  updateConfig(newConfig: Partial<RUMConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): RUMConfig {
    return { ...this.config };
  }

  getCurrentSession(): UserSession | null {
    return this.currentSession ? { ...this.currentSession } : null;
  }

  getAlerts(): RUMAlert[] {
    return [...this.alerts];
  }

  recordCustomMetric(key: string, value: any): void {
    if (this.currentSession) {
      this.currentSession.customMetrics[key] = value;
    }
  }

  forceFlush(): Promise<void> {
    return this.flushData();
  }
}

// ===== INTERACTION TRACKER =====

class InteractionTracker {
  private config: RUMConfig;
  private clickCounts: Map<string, { count: number; timestamp: number }> =
    new Map();
  private interactionCallback?: (interaction: UserInteraction) => void;

  constructor(config: RUMConfig) {
    this.config = config;
  }

  startTracking(): void {
    // SSR Safety: Only track on client side
    if (typeof window === "undefined") return;

    // Click tracking
    document.addEventListener("click", this.handleClick.bind(this), {
      passive: true,
    });

    // Scroll tracking
    let scrollTimeout: NodeJS.Timeout;
    window.addEventListener(
      "scroll",
      () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          this.trackInteraction("scroll", {
            scrollY: window.scrollY,
            scrollPercent:
              (window.scrollY /
                (document.documentElement.scrollHeight - window.innerHeight)) *
              100,
          });
        }, 100);
      },
      { passive: true },
    );

    // Keyboard tracking
    document.addEventListener("keydown", this.handleKeydown.bind(this), {
      passive: true,
    });

    // Touch tracking
    document.addEventListener("touchstart", this.handleTouch.bind(this), {
      passive: true,
    });
  }

  private handleClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const element = target.closest(
      'button, a, [role="button"], [data-track-click]',
    );

    if (element) {
      const elementKey = `${element.tagName}[${element.className || element.id}]`;
      const now = Date.now();

      // Check for rage clicks
      const clickData = this.clickCounts.get(elementKey);
      if (clickData && now - clickData.timestamp < 1000) {
        clickData.count++;
        if (clickData.count >= this.config.rageClickThreshold) {
          this.trackInteraction("rage_click", {
            element: this.getElementInfo(element as HTMLElement),
            clickCount: clickData.count,
            timeWindow: now - clickData.timestamp,
          });
        }
      } else {
        this.clickCounts.set(elementKey, { count: 1, timestamp: now });
      }

      this.trackInteraction("click", {
        element: this.getElementInfo(element as HTMLElement),
        position: { x: event.clientX, y: event.clientY },
      });
    }
  }

  private handleKeydown(event: KeyboardEvent): void {
    // Track only meaningful key interactions
    if (
      event.key.length === 1 ||
      ["Enter", "Space", "Tab", "Escape"].includes(event.key)
    ) {
      this.trackInteraction("keypress", {
        key: event.key,
        ctrlKey: event.ctrlKey,
        altKey: event.altKey,
        shiftKey: event.shiftKey,
      });
    }
  }

  private handleTouch(event: TouchEvent): void {
    const touch = event.touches[0];
    if (touch) {
      this.trackInteraction("touch", {
        position: { x: touch.clientX, y: touch.clientY },
        force: touch.force,
        radius: { x: touch.radiusX, y: touch.radiusY },
      });
    }
  }

  private trackInteraction(
    type: UserInteraction["type"],
    context: Record<string, any>,
  ): void {
    const interaction: UserInteraction = {
      type,
      timestamp: Date.now(),
      position: context.position || { x: 0, y: 0 },
      context,
    };

    if (this.interactionCallback) {
      this.interactionCallback(interaction);
    }
  }

  private getElementInfo(element: HTMLElement): ElementInfo {
    const rect = element.getBoundingClientRect();

    return {
      tagName: element.tagName,
      className: element.className,
      id: element.id,
      textContent: element.textContent?.substring(0, 100),
      position: {
        x: rect.left + window.scrollX,
        y: rect.top + window.scrollY,
      },
      size: {
        width: rect.width,
        height: rect.height,
      },
      attributes: Object.fromEntries(
        Array.from(element.attributes).map((attr) => [attr.name, attr.value]),
      ),
    };
  }

  onInteraction(callback: (interaction: UserInteraction) => void): void {
    this.interactionCallback = callback;
  }
}

// ===== EXPORT =====

// SSR-safe export - only initialize on client side
export const realUserMonitoring =
  typeof window === "undefined" ? null : RealUserMonitoring.getInstance();

// Utility functions - SSR safe
export const trackRUMEvent = (type: string, data: Record<string, any>) => {
  try {
    if (realUserMonitoring) {
      realUserMonitoring.recordCustomMetric(type, data);
    }
  } catch (error) {
    // Prevent infinite loops - don't use console.error as it might trigger error tracking
    if (typeof console !== "undefined" && console.warn) {
      console.warn("[RUM] Failed to track event:", type, error);
    }
  }
};

export const getRUMSession = () => {
  return realUserMonitoring ? realUserMonitoring.getCurrentSession() : null;
};

export const getRUMAlerts = () => {
  return realUserMonitoring ? realUserMonitoring.getAlerts() : [];
};
