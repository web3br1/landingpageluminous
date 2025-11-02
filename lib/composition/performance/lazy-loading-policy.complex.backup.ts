import type { SectionId } from "../registry/section-registry";
import { SectionRegistry } from "../registry/section-registry";

// ===== LOADING PRIORITIES =====
export enum LoadingPriority {
  IMMEDIATE = 0, // Load immediately (critical sections)
  MEDIUM = 2, // Load on viewport (secondary sections)
  LOW = 3, // Load on user interaction (rarely used)
  DEFERRED = 4, // Load only when needed (very rarely used)
}

// ===== LOADING TRIGGERS =====
export enum LoadingTrigger {
  IMMEDIATE = "immediate", // Load right away
  VIEWPORT = "viewport", // Load when in viewport
  SCROLL_POSITION = "scroll_position", // Load at specific scroll position
  USER_INTERACTION = "user_interaction", // Load on user action
  TIME_DELAY = "time_delay", // Load after time delay
  NETWORK_IDLE = "network_idle", // Load when network is idle
  DEVICE_CAPABLE = "device_capable", // Load based on device capabilities
  // Advanced triggers
  PERFORMANCE_METRIC = "performance_metric", // Load based on performance metrics
  USER_ENGAGEMENT = "user_engagement", // Load based on user engagement patterns
  NAVIGATION_HISTORY = "navigation_history", // Load based on navigation history
  MEMORY_AVAILABLE = "memory_available", // Load based on available memory
  DATA_SAVER_MODE = "data_saver_mode", // Load respecting data saver preferences
  VIEWPORT_SIZE = "viewport_size", // Load based on viewport dimensions
  DEVICE_ORIENTATION = "device_orientation", // Load based on device orientation
  CONTENT_TYPE = "content_type", // Load based on content type priority
  BATTERY_LEVEL = "battery_level", // Load based on battery status
  THERMAL_STATE = "thermal_state", // Load based on device thermal state
  MEMORY_PRESSURE = "memory_pressure", // Load based on memory pressure
  AB_TEST_VARIANT = "ab_test_variant", // Load based on A/B test variant
  USER_PREFERENCES = "user_preferences", // Load respecting user accessibility prefs
  TIME_OF_DAY = "time_of_day", // Load based on time of day patterns
  GEO_LOCATION = "geo_location", // Load based on geographical context
  INTERSECTION_RATIO = "intersection_ratio", // Load based on intersection observer ratio
  PLACEHOLDER_READY = "placeholder_ready", // Load when placeholder/skeleton is ready
  PREVIEW_LOADED = "preview_loaded", // Load when low-quality preview is loaded
  RESOURCE_HINTS = "resource_hints", // Load based on resource hints (preload/prefetch)
  SERVICE_WORKER_CACHE = "service_worker_cache", // Load from service worker cache
  WEBP_SUPPORT = "webp_support", // Load based on WebP/AVIF support
  JS_EXECUTION_TIME = "js_execution_time", // Load based on JavaScript execution time
  CRITICAL_RESOURCE_BLOCKING = "critical_resource_blocking", // Load when critical resources unblock
  USER_JOURNEY_STAGE = "user_journey_stage", // Load based on user journey progress
  A11Y_NAVIGATION = "a11y_navigation", // Load for accessibility navigation
  RESPONSIVE_BREAKPOINT = "responsive_breakpoint", // Load based on responsive breakpoints
  HARDWARE_CONCURRENCY = "hardware_concurrency", // Load based on CPU cores available
  WEBRTC_SUPPORT = "webrtc_support", // Load based on WebRTC capabilities
  COOKIE_CONSENT_STATUS = "cookie_consent_status", // Load based on cookie consent status
  NETWORK_CHANGE_EVENT = "network_change_event", // Load on network change events
  VISIBILITY_CHANGE = "visibility_change", // Load on page visibility changes
  MEMORY_WARNING = "memory_warning", // Load based on memory warnings
  BATTERY_SAVER_MODE = "battery_saver_mode", // Load based on OS battery saver
  WEBGL_VERSION = "webgl_version", // Load based on WebGL version support
  TOUCH_CAPABILITIES = "touch_capabilities", // Load based on touch capabilities
  VOICE_RECOGNITION = "voice_recognition", // Load based on speech recognition support
  GEOLOCATION_ACCURACY = "geolocation_accuracy", // Load based on geolocation accuracy
  AMBIENT_LIGHT_LEVEL = "ambient_light_level", // Load based on ambient light sensor
  DEVICE_POSTURE = "device_posture", // Load based on device posture (foldable)
  NETWORK_LATENCY_ESTIMATE = "network_latency_estimate", // Load based on network latency
  CONTENT_SECURITY_POLICY = "content_security_policy", // Load respecting CSP constraints
  THIRD_PARTY_SCRIPT_LOAD = "third_party_script_load", // Load when third-party scripts ready
  WEB_ASSEMBLY_SUPPORT = "web_assembly_support", // Load based on WASM support
  SHARED_WORKER_AVAILABLE = "shared_worker_available", // Load based on shared worker support
  INDEXEDDB_SUPPORT = "indexeddb_support", // Load based on IndexedDB availability
  WEB_AUDIO_API = "web_audio_api", // Load based on Web Audio API support
  GAMEPAD_SUPPORT = "gamepad_support", // Load based on gamepad API support
  WEB_BLUETOOTH = "web_bluetooth", // Load based on Bluetooth API support
  NFC_SUPPORT = "nfc_support", // Load based on NFC support
  USB_DEVICE_SUPPORT = "usb_device_support", // Load based on WebUSB support
  SERIAL_PORT_SUPPORT = "serial_port_support", // Load based on Web Serial API
  HYDRATION_STATUS = "hydration_status", // Load based on React hydration status
  VIRTUAL_KEYBOARD_VISIBLE = "virtual_keyboard_visible", // Load based on virtual keyboard state
  SCREEN_WAKE_LOCK = "screen_wake_lock", // Load based on screen wake lock capability
  MEDIA_SESSION_SUPPORT = "media_session_support", // Load based on Media Session API
  WEB_SHARE_API = "web_share_api", // Load based on Web Share API support
  PAYMENT_REQUEST_API = "payment_request_api", // Load based on Payment Request API
  CREDENTIAL_MANAGEMENT = "credential_management", // Load based on Credential Management API
  WEB_AUTHENTICATION = "web_authentication", // Load based on WebAuthn support
  PUSH_NOTIFICATIONS = "push_notifications", // Load based on push notification support
  BACKGROUND_SYNC = "background_sync", // Load based on Background Sync API
  PERIODIC_BACKGROUND_SYNC = "periodic_background_sync", // Load based on periodic sync
  WEB_APP_MANIFEST = "web_app_manifest", // Load based on PWA manifest status
  SERVICE_WORKER_UPDATE = "service_worker_update", // Load on service worker updates
  STORAGE_QUOTA = "storage_quota", // Load based on storage quota availability
  NETWORK_INFORMATION_API = "network_information_api", // Load based on Network Information API
  DEVICE_MEMORY_API = "device_memory_api", // Load based on Device Memory API
  PERFORMANCE_MEMORY_API = "performance_memory_api", // Load based on Performance Memory API
  LAYOUT_INSTABILITY_API = "layout_instability_api", // Load based on Layout Instability API
  EVENT_TIMING_API = "event_timing_api", // Load based on Event Timing API
  LONG_TASK_API = "long_task_api", // Load based on Long Task API
  NAVIGATION_TIMING_API = "navigation_timing_api", // Load based on Navigation Timing API
  RESOURCE_TIMING_API = "resource_timing_api", // Load based on Resource Timing API
  USER_TIMING_API = "user_timing_api", // Load based on User Timing API
  PAINT_TIMING_API = "paint_timing_api", // Load based on Paint Timing API
  LARGEST_CONTENTFUL_PAINT_API = "largest_contentful_paint_api", // Load based on LCP API
  FIRST_INPUT_DELAY_API = "first_input_delay_api", // Load based on FID API
  CUMULATIVE_LAYOUT_SHIFT_API = "cumulative_layout_shift_api", // Load based on CLS API
  INTERSECTION_OBSERVER_API = "intersection_observer_api", // Load based on Intersection Observer
  RESIZE_OBSERVER_API = "resize_observer_api", // Load based on Resize Observer API
  MUTATION_OBSERVER_API = "mutation_observer_api", // Load based on Mutation Observer API
  PERFORMANCE_OBSERVER_API = "performance_observer_api", // Load based on Performance Observer API
  REPORTING_OBSERVER_API = "reporting_observer_api", // Load based on Reporting Observer API
  INTERSECTION_RATIO = "intersection_ratio", // More granular intersection control
  PLACEHOLDER_READY = "placeholder_ready", // Progressive loading stages
  PREVIEW_LOADED = "preview_loaded", // Progressive loading stages
}

// ===== LOADING CONTEXT =====
export interface LoadingContext {
  pageType: string;
  scrollPosition: number;
  devicePixelRatio: number;
  connectionSpeed: "slow" | "fast" | "unknown";
  hasUserInteracted: boolean;
  timeSincePageLoad: number;
  sectionsAboveFold: SectionId[];
  criticalPathCompleted: boolean;
  isLowPowerMode?: boolean;

  // Fase 1: Sinais essenciais para adaptação básica
  effectiveType?: "slow-2g" | "2g" | "3g" | "4g";
  hardwareConcurrency?: number;
  cookieConsent?: {
    analytics: boolean;
    necessary: boolean;
  };
  // Extended context for advanced loading decisions
  userNavigationHistory?: string[]; // Previous pages visited
  timeSpentOnPage?: number; // Total time user has been on page
  interactionCount?: number; // Number of user interactions
  scrollDepth?: number; // Maximum scroll depth reached (0-100)
  hasScrolledRecently?: boolean; // User scrolled in last 5 seconds
  lcpScore?: number; // Largest Contentful Paint score in ms
  clsScore?: number; // Cumulative Layout Shift score
  deviceMemory?: number; // Device memory in GB
  isDataSaver?: boolean; // Data saver mode enabled
  networkEffectiveType?: "slow-2g" | "2g" | "3g" | "4g"; // Network type
  // Advanced context for intelligent loading decisions
  viewportWidth?: number; // Viewport width in pixels
  viewportHeight?: number; // Viewport height in pixels
  deviceOrientation?: "portrait" | "landscape"; // Device orientation
  prefersReducedMotion?: boolean; // User prefers reduced motion
  isPrefersColorSchemeDark?: boolean; // User prefers dark mode
  sectionContentType?: "text" | "media" | "interactive" | "form"; // Content type
  abTestVariant?: string; // A/B test variant identifier
  userTimeZone?: string; // User's timezone
  userLanguage?: string; // User's language preference
  isIncognitoMode?: boolean; // Browser in incognito/private mode
  hasWebGLSupport?: boolean; // Device supports WebGL
  isTouchDevice?: boolean; // Touch-capable device
  batteryLevel?: number; // Battery level (0-100)
  thermalState?: "nominal" | "fair" | "serious" | "critical"; // Device thermal state
  memoryPressure?: "low" | "medium" | "high"; // Memory pressure level

  // Progressive Loading Context
  intersectionRatio?: number; // Intersection Observer ratio (0-1)
  isIntersecting?: boolean; // Currently intersecting viewport
  placeholderRendered?: boolean; // Skeleton/placeholder shown
  loadingStage?: "skeleton" | "preview" | "full"; // Current loading stage
  lowQualityPreviewLoaded?: boolean; // Preview image loaded
  aboveFoldContentLoaded?: boolean; // Above fold content ready

  // Advanced Device & Browser Capabilities
  hardwareConcurrency?: number; // CPU cores available
  webGLVersion?: 1 | 2; // WebGL version support
  webpSupport?: boolean; // WebP image format support
  webAssemblySupport?: boolean; // WebAssembly support
  webAudioSupport?: boolean; // Web Audio API support
  webRTCSupport?: boolean; // WebRTC support
  indexedDBSupport?: boolean; // IndexedDB support
  sharedWorkerSupport?: boolean; // Shared Worker support
  serviceWorkerSupport?: boolean; // Service Worker support
  webShareSupport?: boolean; // Web Share API support
  webBluetoothSupport?: boolean; // Web Bluetooth support
  nfcSupport?: boolean; // NFC support
  usbSupport?: boolean; // WebUSB support
  serialPortSupport?: boolean; // Web Serial API support
  gamepadSupport?: boolean; // Gamepad API support
  voiceRecognitionSupport?: boolean; // Speech recognition support
  screenWakeLockSupport?: boolean; // Screen wake lock support
  credentialManagementSupport?: boolean; // Credential Management API
  webAuthnSupport?: boolean; // WebAuthn support
  pushNotificationSupport?: boolean; // Push notifications support
  backgroundSyncSupport?: boolean; // Background Sync API support
  periodicSyncSupport?: boolean; // Periodic background sync support

  // Performance & Timing Context
  jsExecutionTime?: number; // JavaScript execution time in ms
  longTasksCount?: number; // Number of long tasks (>50ms)
  resourceTimingData?: any[]; // Resource timing data
  navigationTimingData?: any; // Navigation timing data
  paintTimingData?: any; // Paint timing data
  eventTimingData?: any[]; // Event timing data

  // Network & Connectivity Context
  networkLatencyEstimate?: number; // Estimated network latency in ms
  connectionDownlink?: number; // Connection downlink in Mbps
  connectionEffectiveType?: "slow-2g" | "2g" | "3g" | "4g"; // Effective connection type
  connectionRtt?: number; // Round trip time in ms
  connectionType?: string; // Connection type (wifi, cellular, etc)

  // User Journey & Behavior Context
  userJourneyStage?: "awareness" | "consideration" | "decision" | "retention"; // User journey stage
  timeSinceLastInteraction?: number; // Time since last user interaction
  scrollVelocity?: number; // Current scroll velocity
  mouseMovementIntensity?: number; // Mouse movement activity level
  keyboardActivity?: boolean; // Recent keyboard activity
  touchActivity?: boolean; // Recent touch activity
  voiceActivity?: boolean; // Recent voice activity

  // Accessibility & Preferences Context
  a11yNavigationActive?: boolean; // Accessibility navigation in use
  virtualKeyboardVisible?: boolean; // Virtual keyboard is visible
  prefersHighContrast?: boolean; // User prefers high contrast
  prefersReducedTransparency?: boolean; // User prefers reduced transparency
  forcedColorsMode?: boolean; // Forced colors mode active

  // Environmental Context
  ambientLightLevel?: number; // Ambient light level (0-100)
  devicePosture?: "flat" | "folded" | "half-folded"; // Device posture (foldables)
  geolocationAccuracy?: number; // Geolocation accuracy in meters
  timezoneOffset?: number; // Timezone offset in minutes

  // Security & Privacy Context
  cookieConsentGiven?: boolean; // Cookie consent has been given
  doNotTrackEnabled?: boolean; // Do Not Track is enabled
  globalPrivacyControl?: boolean; // Global Privacy Control enabled
  contentSecurityPolicyLevel?: "strict" | "moderate" | "permissive"; // CSP strictness level

  // Storage & Cache Context
  storageQuotaUsed?: number; // Storage quota used in bytes
  storageQuotaAvailable?: number; // Storage quota available in bytes
  serviceWorkerCacheSize?: number; // Service worker cache size
  indexedDBSize?: number; // IndexedDB storage size

  // Third-party & External Context
  thirdPartyScriptsLoaded?: boolean; // Third-party scripts have loaded
  adsBlocked?: boolean; // Ad blocker detected
  trackerBlocked?: boolean; // Tracker blocker detected

  // React & Framework Context
  hydrationCompleted?: boolean; // React hydration completed
  reactVersion?: string; // React version
  nextVersion?: string; // Next.js version

  // Media & Content Context
  mediaSessionSupported?: boolean; // Media Session API supported
  pictureInPictureSupported?: boolean; // Picture-in-picture supported
  mediaCapabilitiesScore?: number; // Media capabilities score (0-100)

  // Advanced Interaction Context
  pointerType?: "mouse" | "touch" | "pen" | "unknown"; // Primary pointer type
  hoverCapability?: boolean; // Device supports hover
  anyPointerCoarse?: boolean; // Device has coarse pointer
  anyPointerFine?: boolean; // Device has fine pointer

  // Platform & OS Context
  platform?: string; // Platform/OS string
  userAgentData?: any; // User agent data (modern API)
  isStandalone?: boolean; // Running as PWA
  manifestLoaded?: boolean; // Web app manifest loaded

  // Advanced Memory Context
  usedJSHeapSize?: number; // Used JavaScript heap size
  totalJSHeapSize?: number; // Total JavaScript heap size
  jsHeapSizeLimit?: number; // JavaScript heap size limit

  // Advanced Battery Context
  batteryCharging?: boolean; // Battery is charging
  batteryChargingTime?: number; // Time until battery fully charged
  batteryDischargingTime?: number; // Time until battery depleted

  // Advanced Thermal Context
  thermalStateDetail?: "nominal" | "fair" | "serious" | "critical"; // Detailed thermal state

  // Advanced Network Context
  networkSaveData?: boolean; // Save-Data header sent
  networkDownlinkMax?: number; // Maximum downlink speed
  networkType?: "bluetooth" | "cellular" | "ethernet" | "none" | "wifi" | "wimax" | "other" | "unknown"; // Network type

  // Advanced Performance Context
  firstContentfulPaint?: number; // First Contentful Paint time
  firstMeaningfulPaint?: number; // First Meaningful Paint time
  speedIndex?: number; // Speed Index score
  firstCPUIdle?: number; // First CPU Idle time
  firstInputDelay?: number; // First Input Delay (replaced by INP)
  interactionToNextPaint?: number; // Interaction to Next Paint
  timeToFirstByte?: number; // Time to First Byte
  domContentLoaded?: number; // DOM Content Loaded time
  domInteractive?: number; // DOM Interactive time
  domComplete?: number; // DOM Complete time
  loadEventEnd?: number; // Load event end time

  // Advanced Layout Context
  viewportSegments?: number; // Number of viewport segments (foldables)
  safeAreaInsets?: { top: number; right: number; bottom: number; left: number }; // Safe area insets
  visualViewportOffset?: { x: number; y: number }; // Visual viewport offset

  // Advanced Interaction Context
  lastInteractionType?: "click" | "touch" | "keyboard" | "scroll" | "hover" | "focus" | "voice"; // Last interaction type
  interactionFrequency?: number; // Interactions per minute
  rageClickDetected?: boolean; // Rage clicking detected
  attentionSpanEstimate?: number; // Estimated attention span in seconds

  // Advanced Content Context
  contentReadabilityScore?: number; // Content readability score
  contentLength?: number; // Content length in characters
  contentImageCount?: number; // Number of images in content
  contentVideoCount?: number; // Number of videos in content
  contentInteractiveCount?: number; // Number of interactive elements

  // Advanced A/B Testing Context
  abTestGroup?: string; // A/B test group assignment
  featureFlags?: Record<string, boolean>; // Active feature flags
  experimentOverrides?: Record<string, any>; // Experiment overrides

  // Advanced Analytics Context
  sessionId?: string; // User session identifier
  userId?: string; // User identifier (if available)
  pageViewId?: string; // Page view identifier
  referrer?: string; // Referring page
  utmParameters?: Record<string, string>; // UTM parameters

  // Advanced Error Context
  jsErrorCount?: number; // Number of JavaScript errors
  networkErrorCount?: number; // Number of network errors
  resourceLoadErrorCount?: number; // Number of resource load errors

  // Advanced Cache Context
  httpCacheHitRate?: number; // HTTP cache hit rate (0-1)
  serviceWorkerCacheHitRate?: number; // Service worker cache hit rate (0-1)
  browserCacheSize?: number; // Browser cache size estimate

  // Advanced Privacy Context
  fingerprintingProtection?: boolean; // Anti-fingerprinting measures active
  trackingProtectionLevel?: "none" | "basic" | "strict"; // Tracking protection level

  // Advanced Progressive Web App Context
  isInstallable?: boolean; // App is installable as PWA
  installPromptShown?: boolean; // Install prompt has been shown
  isInstalled?: boolean; // App is installed as PWA
  offlineCapability?: boolean; // App works offline
  backgroundSyncEnabled?: boolean; // Background sync is enabled
}

// ===== LOADING RULE =====
export interface LoadingRule {
  priority: LoadingPriority;
  trigger: LoadingTrigger;
  condition: (context: LoadingContext) => boolean;
  rootMargin?: string;
  threshold?: number;
  delay?: number;
  dependencies?: SectionId[];
}

// ===== SECTION LOADING POLICY =====
export interface SectionLoadingPolicy {
  sectionId: SectionId;
  rules: LoadingRule[];
  fallbackRule: LoadingRule;
}

// ===== LAZY LOADING POLICY CLASS =====
export class LazyLoadingPolicy {
  private static readonly policies = new Map<SectionId, SectionLoadingPolicy>();
  private static decisionCache = new Map<
    string,
    {
      decision: any;
      timestamp: number;
      context: LoadingContext;
    }
  >();
  private static readonly CACHE_TTL = 30000; // 30 seconds cache TTL

  // Initialize policies for all sections
  static initializePolicies(): void {
    console.log(
      "[LazyLoadingPolicy] Initializing loading policies for all sections",
    );

    // Get all sections from registry
    const allSections = SectionRegistry.getAllSectionIds();

    for (const sectionId of allSections) {
      this.createPolicyForSection(sectionId);
    }

    console.log(
      `[LazyLoadingPolicy] Initialized policies for ${this.policies.size} sections`,
    );
  }

  /**
   * Create loading policy for a specific section
   */
  private static createPolicyForSection(sectionId: SectionId): void {
    const criticality = SectionRegistry.getCriticality(sectionId);

    let rules: LoadingRule[] = [];
    let fallbackRule: LoadingRule;

    switch (criticality) {
      case "critical":
        // Critical sections: Always load immediately
        rules = [
          {
            priority: LoadingPriority.IMMEDIATE,
            trigger: LoadingTrigger.IMMEDIATE,
            condition: () => true,
          },
        ];
        fallbackRule = rules[0];
        break;

      case "important":
        // Important sections: Load on viewport or scroll position
        rules = [
          {
            priority: LoadingPriority.HIGH,
            trigger: LoadingTrigger.VIEWPORT,
            condition: (context) => this.isSectionAboveFold(sectionId, context),
            rootMargin: "100px",
            threshold: 0.1,
          },
          {
            priority: LoadingPriority.HIGH,
            trigger: LoadingTrigger.SCROLL_POSITION,
            condition: (context) => context.scrollPosition > 100,
            rootMargin: "200px",
          },
          {
            priority: LoadingPriority.MEDIUM,
            trigger: LoadingTrigger.TIME_DELAY,
            condition: (context) => context.timeSincePageLoad > 1000,
            delay: 1000,
          },
        ];
        fallbackRule = {
          priority: LoadingPriority.MEDIUM,
          trigger: LoadingTrigger.VIEWPORT,
          condition: () => true,
          rootMargin: "300px",
          threshold: 0.1,
        };
        break;

      case "secondary":
        // Secondary sections: Load on viewport or user interaction
        rules = [
          {
            priority: LoadingPriority.MEDIUM,
            trigger: LoadingTrigger.VIEWPORT,
            condition: (context) =>
              !context.hasUserInteracted ||
              this.isSectionNearViewport(sectionId, context),
            rootMargin: "300px",
            threshold: 0.1,
          },
          {
            priority: LoadingPriority.LOW,
            trigger: LoadingTrigger.USER_INTERACTION,
            condition: (context) => context.hasUserInteracted,
            dependencies: ["hero", "benefits"], // Wait for key sections
          },
          {
            priority: LoadingPriority.MEDIUM,
            trigger: LoadingTrigger.PERFORMANCE_METRIC,
            condition: (context) =>
              context.lcpScore &&
              context.lcpScore < 3000 && // Good performance
              context.timeSincePageLoad > 3000, // Give time for metrics
            delay: 2000,
          },
          {
            priority: LoadingPriority.MEDIUM,
            trigger: LoadingTrigger.USER_ENGAGEMENT,
            condition: (context) =>
              (context.interactionCount && context.interactionCount > 3) ||
              (context.timeSpentOnPage && context.timeSpentOnPage > 15000),
            dependencies: ["hero", "benefits"],
          },
          {
            priority: LoadingPriority.HIGH,
            trigger: LoadingTrigger.VIEWPORT_SIZE,
            condition: (context) =>
              context.viewportWidth &&
              context.viewportWidth >= 1440 && // Large desktop screens
              context.connectionSpeed === "fast",
            rootMargin: "200px", // Load earlier on large screens
          },
          {
            priority: LoadingPriority.LOW,
            trigger: LoadingTrigger.BATTERY_LEVEL,
            condition: (context) =>
              context.batteryLevel &&
              context.batteryLevel > 50 && // Good battery level
              context.thermalState === "nominal", // Normal thermal state
            delay: 1000,
          },
          {
            priority: LoadingPriority.MEDIUM,
            trigger: LoadingTrigger.CONTENT_TYPE,
            condition: (context) =>
              context.sectionContentType === "text" || // Lightweight content
              (context.sectionContentType === "interactive" &&
                context.hasUserInteracted),
            dependencies: ["hero"],
          },
          {
            priority: LoadingPriority.LOW,
            trigger: LoadingTrigger.NETWORK_IDLE,
            condition: (context) =>
              context.connectionSpeed === "fast" &&
              context.timeSincePageLoad > 3000,
            delay: 3000,
          },
          {
            priority: LoadingPriority.MEDIUM,
            trigger: LoadingTrigger.MEMORY_AVAILABLE,
            condition: (context) =>
              context.deviceMemory &&
              context.deviceMemory >= 2 && // At least 2GB RAM
              context.timeSincePageLoad > 5000,
            delay: 3000,
          },
          {
            priority: LoadingPriority.LOW,
            trigger: LoadingTrigger.NAVIGATION_HISTORY,
            condition: (context) =>
              context.userNavigationHistory &&
              context.userNavigationHistory.length > 2 && // Experienced user
              context.timeSincePageLoad > 4000,
            delay: 2000,
          },
          {
            priority: LoadingPriority.HIGH,
            trigger: LoadingTrigger.DEVICE_ORIENTATION,
            condition: (context) =>
              context.deviceOrientation === "landscape" && // Landscape mode
              context.viewportWidth &&
              context.viewportWidth >= 1024, // Large viewport
            rootMargin: "150px", // Load more aggressively in landscape
          },
          {
            priority: LoadingPriority.MEDIUM,
            trigger: LoadingTrigger.USER_PREFERENCES,
            condition: (context) =>
              context.prefersReducedMotion === false && // User doesn't mind motion
              context.isPrefersColorSchemeDark === false, // Light mode preference
            delay: 1500,
          },
          {
            priority: LoadingPriority.LOW,
            trigger: LoadingTrigger.TIME_OF_DAY,
            condition: (context) =>
              context.userTimeZone &&
              new Date().getHours() >= 9 &&
              new Date().getHours() <= 17, // Business hours
            delay: 2500,
          },
        ];
        fallbackRule = {
          priority: LoadingPriority.DEFERRED,
          trigger: LoadingTrigger.USER_INTERACTION,
          condition: () => true,
        };
        break;
    }

    this.policies.set(sectionId, {
      sectionId,
      rules,
      fallbackRule,
    });
  }

  /**
   * Get cached loading decision or compute new one
   */
  private static getCachedDecision(
    sectionId: SectionId,
    context: LoadingContext,
  ): {
    shouldLoad: boolean;
    priority: LoadingPriority;
    trigger: LoadingTrigger;
    config: {
      rootMargin?: string;
      threshold?: number;
      delay?: number;
    };
  } | null {
    const cacheKey = `${sectionId}_${JSON.stringify(context)}`;
    const cached = this.decisionCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log(`[LazyLoadingPolicy] Using cached decision for ${sectionId}`);
      return cached.decision;
    }

    return null;
  }

  /**
   * Cache a loading decision
   */
  private static cacheDecision(
    sectionId: SectionId,
    context: LoadingContext,
    decision: any,
  ): void {
    const cacheKey = `${sectionId}_${JSON.stringify(context)}`;
    this.decisionCache.set(cacheKey, {
      decision,
      timestamp: Date.now(),
      context,
    });

    // Clean up old cache entries
    if (this.decisionCache.size > 100) {
      const oldestKey = this.decisionCache.keys().next().value;
      this.decisionCache.delete(oldestKey);
    }
  }

  /**
   * Get loading decision for a section with detailed logging
   */
  static getLoadingDecision(
    sectionId: SectionId,
    context: LoadingContext,
  ): {
    shouldLoad: boolean;
    priority: LoadingPriority;
    trigger: LoadingTrigger;
    config: {
      rootMargin?: string;
      threshold?: number;
      delay?: number;
    };
  } {
    // Check cache first
    const cachedDecision = this.getCachedDecision(sectionId, context);
    if (cachedDecision) {
      return cachedDecision;
    }

    const policy = this.policies.get(sectionId);

    if (!policy) {
      console.warn(
        `[LazyLoadingPolicy] No policy found for section: ${sectionId}`,
      );
      const fallbackDecision = {
        shouldLoad: true, // Default to loading
        priority: LoadingPriority.MEDIUM,
        trigger: LoadingTrigger.VIEWPORT,
        config: { rootMargin: "300px", threshold: 0.1 },
      };
      this.cacheDecision(sectionId, context, fallbackDecision);
      return fallbackDecision;
    }

    console.log(`[LazyLoadingPolicy] Computing decision for ${sectionId}`, {
      contextSummary: {
        connectionSpeed: context.connectionSpeed,
        hasUserInteracted: context.hasUserInteracted,
        timeSincePageLoad: context.timeSincePageLoad,
        scrollPosition: context.scrollPosition,
      },
      ruleCount: policy.rules.length,
    });

    // Evaluate rules in priority order
    for (const rule of policy.rules) {
      if (rule.condition(context)) {
        console.log(`[LazyLoadingPolicy] Section ${sectionId} matches rule:`, {
          priority: rule.priority,
          trigger: rule.trigger,
          dependencies: rule.dependencies,
        });

        const decision = {
          shouldLoad: true,
          priority: rule.priority,
          trigger: rule.trigger,
          config: {
            rootMargin: rule.rootMargin,
            threshold: rule.threshold,
            delay: rule.delay,
          },
        };

        this.cacheDecision(sectionId, context, decision);
        return decision;
      }
    }

    // Fallback rule
    console.log(
      `[LazyLoadingPolicy] Section ${sectionId} using fallback rule`,
      {
        fallbackPriority: policy.fallbackRule.priority,
        fallbackTrigger: policy.fallbackRule.trigger,
      },
    );

    const fallbackDecision = {
      shouldLoad: true,
      priority: policy.fallbackRule.priority,
      trigger: policy.fallbackRule.trigger,
      config: {
        rootMargin: policy.fallbackRule.rootMargin,
        threshold: policy.fallbackRule.threshold,
        delay: policy.fallbackRule.delay,
      },
    };

    this.cacheDecision(sectionId, context, fallbackDecision);
    return fallbackDecision;
  }

  /**
   * Advanced loading condition evaluation with multiple factors
   */
  static evaluateAdvancedLoadingConditions(context: LoadingContext): {
    isOptimal: boolean;
    reasons: string[];
    score: number; // 0-100
    recommendedTriggers: LoadingTrigger[];
  } {
    const reasons: string[] = [];
    let score = 50; // Base score
    const recommendedTriggers: LoadingTrigger[] = [];

    // Connection speed factor
    if (context.connectionSpeed === "fast") {
      score += 20;
      recommendedTriggers.push(LoadingTrigger.DEVICE_CAPABLE);
    } else if (context.connectionSpeed === "slow") {
      score -= 15;
      reasons.push("Slow connection detected");
      recommendedTriggers.push(LoadingTrigger.USER_INTERACTION);
    }

    // Network effective type (more granular)
    if (context.networkEffectiveType === "4g") {
      score += 15;
      recommendedTriggers.push(LoadingTrigger.PERFORMANCE_METRIC);
    } else if (
      context.networkEffectiveType === "slow-2g" ||
      context.networkEffectiveType === "2g"
    ) {
      score -= 20;
      reasons.push("Poor network conditions");
      recommendedTriggers.push(LoadingTrigger.TIME_DELAY);
    }

    // Device capability factor
    if (context.devicePixelRatio >= 2) {
      score += 15;
      recommendedTriggers.push(LoadingTrigger.MEMORY_AVAILABLE);
    } else if (context.devicePixelRatio < 1) {
      score -= 10;
      reasons.push("Low DPI device");
    }

    // Memory availability
    if (context.deviceMemory && context.deviceMemory >= 4) {
      score += 10;
      recommendedTriggers.push(LoadingTrigger.DEVICE_CAPABLE);
    } else if (context.deviceMemory && context.deviceMemory < 2) {
      score -= 10;
      reasons.push("Limited device memory");
    }

    // Battery/memory factor
    if (context.isLowPowerMode) {
      score -= 20;
      reasons.push("Device in power-saving mode");
      recommendedTriggers.push(LoadingTrigger.USER_INTERACTION);
    }

    // Data saver mode
    if (context.isDataSaver) {
      score -= 25;
      reasons.push("Data saver mode enabled");
      recommendedTriggers.push(LoadingTrigger.DATA_SAVER_MODE);
    }

    // User engagement factors
    if (context.hasUserInteracted) {
      score += 10;
      recommendedTriggers.push(LoadingTrigger.USER_ENGAGEMENT);
    }

    if (context.interactionCount && context.interactionCount > 5) {
      score += 15;
      recommendedTriggers.push(LoadingTrigger.USER_ENGAGEMENT);
    }

    // Time factors
    if (context.timeSincePageLoad < 2000) {
      score += 15; // Bonus for early loading
    } else if (context.timeSincePageLoad > 10000) {
      score -= 10; // Penalty for late loading
    }

    if (context.timeSpentOnPage && context.timeSpentOnPage > 30000) {
      score += 20; // User engaged for extended time
      recommendedTriggers.push(LoadingTrigger.USER_ENGAGEMENT);
    }

    // Scroll factors
    if (context.scrollPosition > 200) {
      score += 10;
      recommendedTriggers.push(LoadingTrigger.SCROLL_POSITION);
    }

    if (context.scrollDepth && context.scrollDepth > 50) {
      score += 15; // User has scrolled deeply
      recommendedTriggers.push(LoadingTrigger.USER_ENGAGEMENT);
    }

    if (context.hasScrolledRecently) {
      score += 10;
      recommendedTriggers.push(LoadingTrigger.SCROLL_POSITION);
    }

    // Performance factors
    if (context.lcpScore && context.lcpScore < 2500) {
      score += 10; // Good LCP score
      recommendedTriggers.push(LoadingTrigger.PERFORMANCE_METRIC);
    } else if (context.lcpScore && context.lcpScore > 4000) {
      score -= 15; // Poor LCP score, be conservative
      reasons.push("Poor LCP performance");
    }

    if (context.clsScore && context.clsScore < 0.1) {
      score += 5; // Good CLS score
    } else if (context.clsScore && context.clsScore > 0.25) {
      score -= 10; // Poor CLS score
      reasons.push("High CLS detected");
    }

    // Navigation history factor
    if (
      context.userNavigationHistory &&
      context.userNavigationHistory.length > 3
    ) {
      score += 10; // Experienced user
      recommendedTriggers.push(LoadingTrigger.NAVIGATION_HISTORY);
    }

    // Viewport size factors
    if (context.viewportWidth && context.viewportWidth >= 1200) {
      score += 8; // Desktop/large screens can handle more
      recommendedTriggers.push(LoadingTrigger.VIEWPORT_SIZE);
    } else if (context.viewportWidth && context.viewportWidth < 768) {
      score -= 5; // Mobile screens need optimization
    }

    // Device orientation
    if (context.deviceOrientation === "landscape") {
      score += 5; // Landscape often indicates focused usage
      recommendedTriggers.push(LoadingTrigger.DEVICE_ORIENTATION);
    }

    // Content type priority
    if (context.sectionContentType === "text") {
      score += 5; // Text is lightweight
      recommendedTriggers.push(LoadingTrigger.CONTENT_TYPE);
    } else if (context.sectionContentType === "media") {
      score -= 8; // Media is heavy
    } else if (context.sectionContentType === "interactive") {
      score -= 3; // Interactive needs user engagement
    }

    // Battery and thermal factors
    if (context.batteryLevel && context.batteryLevel < 20) {
      score -= 15; // Low battery, be conservative
      reasons.push("Low battery level detected");
      recommendedTriggers.push(LoadingTrigger.BATTERY_LEVEL);
    }

    if (
      context.thermalState === "serious" ||
      context.thermalState === "critical"
    ) {
      score -= 20; // Device overheating
      reasons.push("Device thermal throttling active");
      recommendedTriggers.push(LoadingTrigger.THERMAL_STATE);
    }

    // Memory pressure
    if (context.memoryPressure === "high") {
      score -= 12; // High memory pressure
      reasons.push("High memory pressure detected");
      recommendedTriggers.push(LoadingTrigger.MEMORY_PRESSURE);
    }

    // User preferences
    if (context.prefersReducedMotion) {
      score += 3; // Reduced motion users may prefer faster loading
      recommendedTriggers.push(LoadingTrigger.USER_PREFERENCES);
    }

    // Device capabilities
    if (context.hasWebGLSupport) {
      score += 5; // WebGL support indicates capable device
    }

    if (context.isTouchDevice) {
      score += 2; // Touch devices often need optimized loading
    }

    // A/B testing variant
    if (context.abTestVariant) {
      // Different variants might have different loading priorities
      recommendedTriggers.push(LoadingTrigger.AB_TEST_VARIANT);
    }

    // Time of day patterns (based on timezone)
    if (context.userTimeZone) {
      const hour = new Date().getHours();
      // Business hours might indicate more focused users
      if (hour >= 9 && hour <= 17) {
        score += 3;
        recommendedTriggers.push(LoadingTrigger.TIME_OF_DAY);
      }
    }

    // Incognito mode (privacy-conscious users)
    if (context.isIncognitoMode) {
      score -= 5; // Be more conservative with privacy-focused users
    }

    // Clamp score between 0-100
    score = Math.max(0, Math.min(100, score));

    const isOptimal = score >= 70;

    // Remove duplicate triggers
    const uniqueTriggers = Array.from(new Set(recommendedTriggers));

    return {
      isOptimal,
      reasons,
      score,
      recommendedTriggers: uniqueTriggers,
    };
  }

  /**
   * Clear decision cache (useful for testing or memory management)
   */
  static clearDecisionCache(): void {
    this.decisionCache.clear();
    console.log("[LazyLoadingPolicy] Decision cache cleared");
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): {
    size: number;
    hitRate?: number;
    oldestEntry?: number;
    newestEntry?: number;
  } {
    const entries = Array.from(this.decisionCache.values());
    const now = Date.now();

    if (entries.length === 0) {
      return { size: 0 };
    }

    const timestamps = entries.map((e) => e.timestamp);
    const oldestEntry = Math.min(...timestamps);
    const newestEntry = Math.max(...timestamps);

    return {
      size: this.decisionCache.size,
      oldestEntry: now - oldestEntry,
      newestEntry: now - newestEntry,
    };
  }

  /**
   * Get loading priority for a section
   */
  static getLoadingPriority(
    sectionId: SectionId,
    context: LoadingContext,
  ): LoadingPriority {
    return this.getLoadingDecision(sectionId, context).priority;
  }

  /**
   * Check if section should be lazy loaded
   */
  static shouldLazyLoad(
    sectionId: SectionId,
    context: LoadingContext,
  ): boolean {
    // Critical sections are never lazy loaded
    if (SectionRegistry.getCriticality(sectionId) === "critical") {
      return false;
    }

    const decision = this.getLoadingDecision(sectionId, context);
    return decision.priority > LoadingPriority.IMMEDIATE;
  }

  /**
   * Get intersection observer config for a section
   */
  static getIntersectionConfig(
    sectionId: SectionId,
    context: LoadingContext,
  ): IntersectionObserverInit | null {
    const decision = this.getLoadingDecision(sectionId, context);

    if (decision.trigger !== LoadingTrigger.VIEWPORT) {
      return null;
    }

    return {
      rootMargin: decision.config.rootMargin || "300px",
      threshold: decision.config.threshold || 0.1,
    };
  }

  /**
   * Check if section dependencies are met
   */
  static areDependenciesMet(
    sectionId: SectionId,
    loadedSections: Set<SectionId>,
  ): boolean {
    const policy = this.policies.get(sectionId);

    if (!policy) {
      return true; // No dependencies defined
    }

    // Check if all dependencies are loaded
    for (const rule of policy.rules) {
      if (rule.dependencies) {
        const allDepsLoaded = rule.dependencies.every((dep) =>
          loadedSections.has(dep),
        );
        if (!allDepsLoaded) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Get sections that should be loaded immediately
   */
  static getImmediateLoadSections(context: LoadingContext): SectionId[] {
    return SectionRegistry.getAllSectionIds().filter((sectionId) => {
      const decision = this.getLoadingDecision(sectionId, context);
      return decision.priority === LoadingPriority.IMMEDIATE;
    });
  }

  /**
   * Get sections that should be loaded on viewport
   */
  static getViewportLoadSections(context: LoadingContext): SectionId[] {
    return SectionRegistry.getAllSectionIds().filter((sectionId) => {
      const decision = this.getLoadingDecision(sectionId, context);
      return decision.trigger === LoadingTrigger.VIEWPORT;
    });
  }

  // ===== HELPER METHODS =====

  private static isSectionAboveFold(
    sectionId: SectionId,
    context: LoadingContext,
  ): boolean {
    return context.sectionsAboveFold.includes(sectionId);
  }

  private static isSectionNearViewport(
    sectionId: SectionId,
    context: LoadingContext,
  ): boolean {
    // This would need actual DOM measurement in a real implementation
    // For now, assume sections are near viewport if user has scrolled
    return context.scrollPosition > 50;
  }

  /**
   * Update loading context based on current page state
   */
  static createLoadingContext(
    pageType: string,
    scrollPosition: number = 0,
    viewportHeight: number = 768,
    devicePixelRatio: number = 1,
    connectionSpeed: "slow" | "fast" | "unknown" = "unknown",
    hasUserInteracted: boolean = false,
    timeSincePageLoad: number = 0,
    sectionsAboveFold: SectionId[] = [],
    criticalPathCompleted: boolean = false,
  ): LoadingContext {
    return {
      pageType,
      scrollPosition,
      viewportHeight,
      devicePixelRatio,
      connectionSpeed,
      hasUserInteracted,
      timeSincePageLoad,
      sectionsAboveFold,
      criticalPathCompleted,
    };
  }

  /**
   * Get policy statistics for debugging
   */
  static getPolicyStats(): {
    totalSections: number;
    immediateLoadSections: number;
    viewportLoadSections: number;
    deferredLoadSections: number;
  } {
    const allSections = SectionRegistry.getAllSectionIds();
    const context = this.createLoadingContext("landing");

    const immediateLoadSections = allSections.filter(
      (sectionId) =>
        this.getLoadingDecision(sectionId, context).priority ===
        LoadingPriority.IMMEDIATE,
    ).length;

    const viewportLoadSections = allSections.filter(
      (sectionId) =>
        this.getLoadingDecision(sectionId, context).trigger ===
        LoadingTrigger.VIEWPORT,
    ).length;

    const deferredLoadSections = allSections.filter(
      (sectionId) =>
        this.getLoadingDecision(sectionId, context).priority >=
        LoadingPriority.LOW,
    ).length;

    return {
      totalSections: allSections.length,
      immediateLoadSections,
      viewportLoadSections,
      deferredLoadSections,
    };
  }
}
