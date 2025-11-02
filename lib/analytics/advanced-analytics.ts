// ===== ADVANCED ANALYTICS SYSTEM =====
// Comprehensive user journey tracking and analytics

// Removed progressive enhancement import - simplified
import { logger } from "@/lib/logger";

// ===== ANALYTICS LOGGING HELPERS =====

export interface AnalyticsMetadata {
  // User interaction details
  elementId?: string;
  elementType?: string;
  elementText?: string;
  position?: { x: number; y: number };
  // Form interaction details
  formId?: string;
  fieldName?: string;
  fieldValue?: string;
  validationErrors?: string[];
  // Navigation details
  targetUrl?: string;
  navigationType?: "link" | "button" | "form" | "programmatic";
  // Performance details
  loadTime?: number;
  responseTime?: number;
  errorCode?: string | number;
  // Business context
  productId?: string;
  categoryId?: string;
  searchQuery?: string;
  filterApplied?: string[];
  // Custom metadata
  [key: string]: unknown;
}

// ===== ANALYTICS API RESPONSE TYPES =====

export interface AnalyticsApiRequest {
  events: Array<{
    eventType: string;
    eventCategory?: string;
    eventAction?: string;
    eventLabel?: string;
    eventValue?: number;
    userId?: string;
    sessionId?: string;
    timestamp: number;
    pagePath?: string;
    componentName?: string;
    experimentId?: string;
    experimentVariant?: string;
    funnelStep?: number;
    conversionType?: string;
    conversionValue?: number;
    scrollDepth?: number;
    timeOnPage?: number;
    userAgent?: string;
    url?: string;
    referrer?: string;
    metadata?: AnalyticsMetadata;
  }>;
  sessionId: string;
  userId?: string;
  timestamp: number;
}

export interface AnalyticsApiResponse {
  success: boolean;
  processedEvents: number;
  errors?: Array<{
    eventIndex: number;
    error: string;
    code?: string;
  }>;
  requestId: string;
  processingTime: number;
  timestamp: number;
}

export interface AnalyticsBatchResponse extends AnalyticsApiResponse {
  batchId: string;
  totalEvents: number;
  queuedEvents: number;
  failedEvents: number;
}

interface AnalyticsLogContext {
  eventType: string;
  eventCategory?: string;
  eventAction?: string;
  eventLabel?: string;
  eventValue?: number;
  userId?: string;
  sessionId?: string;
  pagePath?: string;
  componentName?: string;
  experimentId?: string;
  experimentVariant?: string;
  funnelStep?: number;
  conversionType?: string;
  conversionValue?: number;
  scrollDepth?: number;
  timeOnPage?: number;
  userAgent?: string;
  url?: string;
  referrer?: string;
  metadata?: AnalyticsMetadata;
  traceId?: string;
}

function logAnalyticsEvent(context: AnalyticsLogContext): void {
  logger.info("Analytics event tracked", {
    event: "analytics_event",
    eventType: context.eventType,
    eventCategory: context.eventCategory,
    eventAction: context.eventAction,
    eventLabel: context.eventLabel,
    eventValue: context.eventValue,
    userId: context.userId,
    sessionId: context.sessionId,
    pagePath: context.pagePath,
    componentName: context.componentName,
    experimentId: context.experimentId,
    experimentVariant: context.experimentVariant,
    funnelStep: context.funnelStep,
    conversionType: context.conversionType,
    conversionValue: context.conversionValue,
    scrollDepth: context.scrollDepth,
    timeOnPage: context.timeOnPage,
    userAgent: context.userAgent,
    url: context.url,
    referrer: context.referrer,
    metadata: context.metadata,
    traceId: context.traceId || generateAnalyticsTraceId(),
  });
}

function logUserJourney(context: {
  sessionId: string;
  userId?: string;
  journeyLength?: number;
  pageCount?: number;
  totalTime?: number;
  conversions?: number;
  experimentIds?: string[];
  traceId?: string;
}): void {
  logger.info("User journey analyzed", {
    event: "user_journey",
    sessionId: context.sessionId,
    userId: context.userId,
    journeyLength: context.journeyLength,
    pageCount: context.pageCount,
    totalTime: context.totalTime,
    conversions: context.conversions,
    experimentIds: context.experimentIds,
    traceId: context.traceId || generateAnalyticsTraceId(),
  });
}

function logFunnelProgress(context: {
  funnelId: string;
  funnelName: string;
  step: number;
  totalSteps: number;
  userId?: string;
  sessionId?: string;
  timeInFunnel?: number;
  dropOffRate?: number;
  conversionRate?: number;
  traceId?: string;
}): void {
  logger.info("Funnel progress tracked", {
    event: "funnel_progress",
    funnelId: context.funnelId,
    funnelName: context.funnelName,
    step: context.step,
    totalSteps: context.totalSteps,
    userId: context.userId,
    sessionId: context.sessionId,
    timeInFunnel: context.timeInFunnel,
    dropOffRate: context.dropOffRate,
    conversionRate: context.conversionRate,
    traceId: context.traceId || generateAnalyticsTraceId(),
  });
}

function logConsentChange(context: {
  previousState: Record<string, boolean>;
  newState: Record<string, boolean>;
  changedBy: "user" | "auto" | "import";
  userId?: string;
  sessionId?: string;
  traceId?: string;
}): void {
  logger.info("Consent state changed", {
    event: "consent_change",
    previousState: context.previousState,
    newState: context.newState,
    changedBy: context.changedBy,
    userId: context.userId,
    sessionId: context.sessionId,
    traceId: context.traceId || generateAnalyticsTraceId(),
  });
}

function generateAnalyticsTraceId(): string {
  return `ana_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ===== TYPES & INTERFACES =====

interface UserJourney {
  sessionId: string;
  userId?: string;
  anonymousId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  pages: PageVisit[];
  events: UserEvent[];
  conversions: Conversion[];
  deviceInfo: DeviceInfo;
  attribution: AttributionData;
  segments: string[];
}

interface PageVisit {
  url: string;
  referrer?: string;
  timestamp: number;
  timeSpent?: number;
  scrollDepth?: number;
  interactions: number;
  loadTime?: number;
  errorCount?: number;
}

interface UserEvent {
  type: string;
  category: string;
  action: string;
  label?: string;
  value?: number;
  timestamp: number;
  element?: ElementInfo;
  context?: Record<string, unknown>;
}

interface Conversion {
  type: string;
  value?: number;
  currency?: string;
  timestamp: number;
  source?: string;
  campaign?: string;
  metadata?: AnalyticsMetadata;
}

interface DeviceInfo {
  userAgent: string;
  language: string;
  timezone: string;
  screenResolution: string;
  viewportSize: string;
  deviceType: "mobile" | "tablet" | "desktop";
  os: string;
  browser: string;
  connectionType?: string;
}

interface AttributionData {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
  gclid?: string;
  fbclid?: string;
  utmParams: Record<string, string>;
  firstTouch: {
    timestamp: number;
    source?: string;
    campaign?: string;
  };
  lastTouch: {
    timestamp: number;
    source?: string;
    campaign?: string;
  };
}

interface ElementInfo {
  tagName: string;
  className?: string;
  id?: string;
  textContent?: string;
  position: {
    x: number;
    y: number;
  };
  size: {
    width: number;
    height: number;
  };
}

interface AnalyticsConfig {
  enabled: boolean;
  trackingId?: string;
  endpoint?: string;
  batchSize: number;
  flushInterval: number;
  sampleRate: number;
  anonymizeIp: boolean;
  respectDoNotTrack: boolean;
  cookieDomain?: string;
  cookieExpires: number;
}

interface FunnelStep {
  id: string;
  name: string;
  url?: string;
  event?: string;
  required: boolean;
}

interface Funnel {
  id: string;
  name: string;
  steps: FunnelStep[];
  conversions: number;
  dropOffs: Record<string, number>;
}

// ===== ANALYTICS ENGINE =====

class AdvancedAnalyticsEngine {
  private static instance: AdvancedAnalyticsEngine;
  private config: AnalyticsConfig;
  private currentJourney: UserJourney | null = null;
  private eventQueue: UserEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private funnels: Map<string, Funnel> = new Map();

  private constructor() {
    this.config = {
      enabled: true,
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
      sampleRate: 1.0, // 100% sampling
      anonymizeIp: true,
      respectDoNotTrack: true,
      cookieExpires: 365 * 24 * 60 * 60 * 1000, // 1 year
    };

    // Only initialize on client side
    if (typeof window !== "undefined") {
      this.initializeAnalytics();
    }
  }

  // Public flush method for external calls
  async flush(): Promise<void> {
    await this.flushEvents();
  }

  static getInstance(): AdvancedAnalyticsEngine {
    if (!AdvancedAnalyticsEngine.instance) {
      AdvancedAnalyticsEngine.instance = new AdvancedAnalyticsEngine();
    }
    return AdvancedAnalyticsEngine.instance;
  }

  private async initializeAnalytics(): Promise<void> {
    if (!this.config.enabled) return;

    // Check Do Not Track
    if (this.config.respectDoNotTrack && this.isDoNotTrackEnabled()) {
      console.log("[Analytics] Respecting Do Not Track setting");
      this.config.enabled = false;
      return;
    }

    // Initialize user journey
    await this.initializeUserJourney();

    // Setup periodic flush
    this.scheduleFlush();

    // Setup event listeners
    this.setupEventListeners();

    // Load existing funnels
    await this.loadFunnels();

    console.log("[Analytics] Advanced analytics initialized");
  }

  private isDoNotTrackEnabled(): boolean {
    return (
      navigator.doNotTrack === "1" ||
      (window as any).doNotTrack === "1" ||
      navigator.doNotTrack === "yes"
    );
  }

  private async initializeUserJourney(): Promise<void> {
    const anonymousId = this.getOrCreateAnonymousId();
    const sessionId = this.generateSessionId();
    const attribution = this.parseAttributionData();

    this.currentJourney = {
      sessionId,
      anonymousId,
      startTime: Date.now(),
      pages: [],
      events: [],
      conversions: [],
      deviceInfo: this.collectDeviceInfo(),
      attribution,
      segments: [],
    };

    // Track initial page visit (SSR safe)
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      await this.trackPageVisit(window.location.href, document.referrer);
    }
  }

  private getOrCreateAnonymousId(): string {
    const cookieName = "_analytics_aid";
    let anonymousId = this.getCookie(cookieName);

    if (!anonymousId) {
      anonymousId = this.generateId();
      this.setCookie(cookieName, anonymousId, this.config.cookieExpires);
    }

    return anonymousId;
  }

  private generateSessionId(): string {
    return this.generateId();
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private parseAttributionData(): AttributionData {
    const urlParams = new URLSearchParams(window.location?.search || "");
    const utmParams: Record<string, string> = {};

    // Extract UTM parameters
    [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
    ].forEach((param) => {
      const value = urlParams.get(param);
      if (value) utmParams[param] = value;
    });

    // Extract click IDs
    const gclid = urlParams.get("gclid");
    const fbclid = urlParams.get("fbclid");

    // Get stored first touch data
    const firstTouch = this.getStoredFirstTouch();

    return {
      source: utmParams.utm_source,
      medium: utmParams.utm_medium,
      campaign: utmParams.utm_campaign,
      term: utmParams.utm_term,
      content: utmParams.utm_content,
      gclid: gclid || undefined,
      fbclid: fbclid || undefined,
      utmParams,
      firstTouch,
      lastTouch: {
        timestamp: Date.now(),
        source: utmParams.utm_source || undefined,
        campaign: utmParams.utm_campaign || undefined,
      },
    };
  }

  private getStoredFirstTouch(): {
    timestamp: number;
    source?: string;
    campaign?: string;
  } {
    const stored =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("_analytics_first_touch")
        : null;
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (error) {
        console.warn("[Analytics] Error parsing stored first touch:", error);
      }
    }

    // Create new first touch
    const firstTouch = {
      timestamp: Date.now(),
      source:
        new URLSearchParams(window.location.search).get("utm_source") ||
        undefined,
      campaign:
        new URLSearchParams(window.location.search).get("utm_campaign") ||
        undefined,
    };

    if (typeof localStorage !== "undefined") {
      localStorage.setItem(
        "_analytics_first_touch",
        JSON.stringify(firstTouch),
      );
    }
    return firstTouch;
  }

  private collectDeviceInfo(): DeviceInfo {
    const ua = navigator.userAgent;
    const screen = window.screen;
    const connection = (navigator as any).connection;

    return {
      userAgent: ua,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      deviceType: this.getDeviceType(),
      os: this.getOS(ua),
      browser: this.getBrowser(ua),
      connectionType: connection?.effectiveType,
    };
  }

  private getDeviceType(): "mobile" | "tablet" | "desktop" {
    const ua = navigator.userAgent;
    if (/Mobi|Android/i.test(ua)) return "mobile";
    if (/Tablet|iPad/i.test(ua)) return "tablet";
    return "desktop";
  }

  private getOS(ua: string): string {
    if (ua.includes("Windows")) return "Windows";
    if (ua.includes("Mac OS X")) return "macOS";
    if (ua.includes("Linux")) return "Linux";
    if (ua.includes("Android")) return "Android";
    if (ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad"))
      return "iOS";
    return "Unknown";
  }

  private getBrowser(ua: string): string {
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
    if (ua.includes("Edge")) return "Edge";
    if (ua.includes("Opera")) return "Opera";
    return "Unknown";
  }

  private setupEventListeners(): void {
    // Track page visibility changes
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.trackEvent("engagement", "page_hidden", "visibility");
      } else {
        this.trackEvent("engagement", "page_visible", "visibility");
      }
    });

    // Track scroll depth
    let maxScrollDepth = 0;
    window.addEventListener("scroll", () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollDepth = Math.round(
        ((scrollTop + windowHeight) / documentHeight) * 100,
      );

      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;
        this.updateCurrentPageScrollDepth(maxScrollDepth);
      }
    });

    // Track errors
    window.addEventListener("error", (event) => {
      this.trackEvent("error", "javascript_error", event.message);
    });

    // Track unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.trackEvent(
        "error",
        "unhandled_promise_rejection",
        event.reason?.toString() || "Unknown",
      );
    });

    // Track page unload
    window.addEventListener("beforeunload", () => {
      this.finalizeJourney();
    });
  }

  // ===== PUBLIC API =====

  async trackPageVisit(url: string, referrer?: string): Promise<void> {
    if (!this.currentJourney) return;

    const pageVisit: PageVisit = {
      url,
      referrer,
      timestamp: Date.now(),
      interactions: 0,
    };

    this.currentJourney.pages.push(pageVisit);

    // Track pageview event
    await this.trackEvent("page", "view", url, undefined, { referrer });
  }

  async trackEvent(
    category: string,
    action: string,
    label?: string,
    value?: number,
    context?: Record<string, unknown>,
  ): Promise<void> {
    if (!this.currentJourney) return;

    const event: UserEvent = {
      type: "custom",
      category,
      action,
      label,
      value,
      timestamp: Date.now(),
      context,
    };

    this.currentJourney.events.push(event);
    this.eventQueue.push(event);

    // Update current page interactions
    if (this.currentJourney.pages.length > 0) {
      this.currentJourney.pages[this.currentJourney.pages.length - 1]
        .interactions++;
    }

    // Check if we should flush
    if (this.eventQueue.length >= this.config.batchSize) {
      await this.flushEvents();
    }
  }

  async trackConversion(
    type: string,
    value?: number,
    currency: string = "BRL",
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    if (!this.currentJourney) return;

    const conversion: Conversion = {
      type,
      value,
      currency,
      timestamp: Date.now(),
      metadata,
    };

    this.currentJourney.conversions.push(conversion);

    // Track conversion event
    await this.trackEvent("conversion", type, undefined, value, metadata);

    // Update funnel conversions
    this.updateFunnelConversion(type);
  }

  private updateCurrentPageScrollDepth(depth: number): void {
    if (this.currentJourney && this.currentJourney.pages.length > 0) {
      this.currentJourney.pages[
        this.currentJourney.pages.length - 1
      ].scrollDepth = depth;
    }
  }

  private finalizeJourney(): void {
    if (!this.currentJourney) return;

    this.currentJourney.endTime = Date.now();
    this.currentJourney.duration =
      this.currentJourney.endTime - this.currentJourney.startTime;

    // Calculate time spent on each page
    for (let i = 0; i < this.currentJourney.pages.length; i++) {
      const page = this.currentJourney.pages[i];
      const nextPage = this.currentJourney.pages[i + 1];

      if (nextPage) {
        page.timeSpent = nextPage.timestamp - page.timestamp;
      } else {
        // Last page - calculate from end time
        page.timeSpent =
          (this.currentJourney.endTime || Date.now()) - page.timestamp;
      }
    }

    // Flush any remaining events
    this.flushEvents();

    console.log(
      "[Analytics] Journey finalized:",
      this.currentJourney.duration,
      "ms",
    );
  }

  private scheduleFlush(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }

    this.flushTimer = setTimeout(async () => {
      await this.flushEvents();
      this.scheduleFlush();
    }, this.config.flushInterval);
  }

  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToFlush = [...this.eventQueue];
    this.eventQueue.length = 0;

    try {
      await this.sendEventsToServer(eventsToFlush);
    } catch (error) {
      console.error("[Analytics] Failed to flush events:", error);
      // Re-queue events for retry
      this.eventQueue.unshift(...eventsToFlush);
    }
  }

  private async sendEventsToServer(events: UserEvent[]): Promise<void> {
    if (!this.config.endpoint) {
      if (process.env.NODE_ENV === "production") {
        console.warn("[Analytics] No endpoint configured for sending events");
      }
      return;
    }

    const payload = {
      sessionId: this.currentJourney?.sessionId,
      anonymousId: this.currentJourney?.anonymousId,
      events,
      timestamp: Date.now(),
    };

    const response = await fetch(this.config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Analytics-Key": this.config.trackingId || "",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Analytics API returned ${response.status}`);
    }
  }

  // ===== FUNNEL MANAGEMENT =====

  defineFunnel(id: string, name: string, steps: FunnelStep[]): void {
    this.funnels.set(id, {
      id,
      name,
      steps,
      conversions: 0,
      dropOffs: {},
    });
  }

  private updateFunnelConversion(conversionType: string): void {
    for (const funnel of this.funnels.values()) {
      const stepIndex = funnel.steps.findIndex(
        (step) => step.event === conversionType,
      );
      if (stepIndex !== -1) {
        funnel.conversions++;
      }
    }
  }

  private async loadFunnels(): Promise<void> {
    // Load funnel definitions from server or local storage
    // This would typically come from a CMS or configuration service
    const defaultFunnels = [
      {
        id: "signup",
        name: "User Registration",
        steps: [
          {
            id: "hero_view",
            name: "Hero Section View",
            event: "page_view",
            required: true,
          },
          {
            id: "cta_click",
            name: "CTA Click",
            event: "cta_click",
            required: true,
          },
          {
            id: "form_start",
            name: "Form Start",
            event: "form_start",
            required: true,
          },
          {
            id: "form_complete",
            name: "Form Complete",
            event: "form_complete",
            required: true,
          },
        ],
      },
      {
        id: "purchase",
        name: "Purchase Flow",
        steps: [
          {
            id: "product_view",
            name: "Product View",
            event: "page_view",
            required: true,
          },
          {
            id: "add_to_cart",
            name: "Add to Cart",
            event: "add_to_cart",
            required: true,
          },
          {
            id: "checkout_start",
            name: "Checkout Start",
            event: "checkout_start",
            required: true,
          },
          {
            id: "payment_complete",
            name: "Payment Complete",
            event: "purchase",
            required: true,
          },
        ],
      },
    ];

    defaultFunnels.forEach((funnel) => {
      this.defineFunnel(funnel.id, funnel.name, funnel.steps);
    });
  }

  // ===== UTILITY METHODS =====

  private getCookie(name: string): string | null {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop()?.split(";").shift() || null;
    }
    return null;
  }

  private setCookie(name: string, value: string, expires: number): void {
    const date = new Date();
    date.setTime(date.getTime() + expires);
    document.cookie = `${name}=${value}; expires=${date.toUTCString()}; path=/; SameSite=Lax`;
  }

  // ===== CONFIGURATION =====

  updateConfig(newConfig: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): AnalyticsConfig {
    return { ...this.config };
  }

  // ===== DEBUGGING =====

  getCurrentJourney(): UserJourney | null {
    return this.currentJourney ? { ...this.currentJourney } : null;
  }

  getFunnels(): Record<string, Funnel> {
    const result: Record<string, Funnel> = {};
    this.funnels.forEach((funnel, id) => {
      result[id] = { ...funnel };
    });
    return result;
  }

  forceFlush(): Promise<void> {
    return this.flushEvents();
  }
}

// ===== EXPORT =====

export const advancedAnalytics = AdvancedAnalyticsEngine.getInstance();

// Utility functions for easy tracking
export const trackEvent = (
  category: string,
  action: string,
  label?: string,
  value?: number,
) => {
  logAnalyticsEvent({
    eventType: "custom_event",
    eventCategory: category,
    eventAction: action,
    eventLabel: label,
    eventValue: value,
    pagePath:
      typeof window !== "undefined" ? window.location.pathname : undefined,
    url: typeof window !== "undefined" ? window.location.href : undefined,
    userAgent:
      typeof navigator !== "undefined" ? navigator.userAgent : undefined,
  });

  return advancedAnalytics.trackEvent(category, action, label, value);
};

export const trackConversion = (
  type: string,
  value?: number,
  currency?: string,
) => {
  logAnalyticsEvent({
    eventType: "conversion",
    conversionType: type,
    conversionValue: value,
    metadata: { currency },
    pagePath:
      typeof window !== "undefined" ? window.location.pathname : undefined,
    url: typeof window !== "undefined" ? window.location.href : undefined,
  });

  return advancedAnalytics.trackConversion(type, value, currency);
};

export const trackPageView = (url: string, referrer?: string) => {
  logAnalyticsEvent({
    eventType: "page_view",
    url,
    referrer,
    pagePath: url,
  });

  return advancedAnalytics.trackPageVisit(url, referrer);
};
