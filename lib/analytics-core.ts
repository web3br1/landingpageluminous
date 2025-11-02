// Core analytics utilities - No JSX, No React, No Next.js components
// Only browser-safe utilities that can be imported in server code

// Configuração GA4
const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-XXXXXXXXXX";

// Consentimento LGPD - agora gerenciado pelo ConsentManager

// Tipos para propriedades customizadas do window
interface WindowExtensions {
  __csp_nonce?: string;
  // eslint-disable-next-line no-unused-vars
  gtag?: (..._args: unknown[]) => void;
  dataLayer?: unknown[];

  plausible?: (
    event: string,
    props?: { props?: Record<string, unknown> },
  ) => void;
}

interface AnalyticsProperties {
  [key: string]: unknown;
}

// Import ConsentState from cookie-banner to maintain consistency
import type { ConsentState } from "@/components/cookie-banner";
export type { ConsentState };

// Funções de consentimento - usar ConsentManager centralizado com cache
export const consent = {
  get: async (): Promise<ConsentState> => {
    // Import dinâmico para evitar dependências circulares
    if (typeof window === "undefined") {
      return {
        essential: true,
        analytics: false,
        marketing: false,
        functional: false,
      };
    }

    try {
      // Sempre usar ConsentManager para consistência e cache
      const { ConsentManager } = await import("@/lib/privacy/consent-manager");
      const consentData = ConsentManager.getConsent();
      return {
        essential: true,
        ...consentData,
      };
    } catch (error) {
      console.warn("Failed to load ConsentManager, using defaults:", error);
      return {
        essential: true,
        analytics: false,
        marketing: false,
        functional: false,
      };
    }
  },

  set: async (consentData: ConsentState) => {
    try {
      const { ConsentManager } = await import("@/lib/privacy/consent-manager");
      // Remove essential before saving (ConsentManager adds it back)
      const { essential, ...nonEssential } = consentData;
      ConsentManager.setConsent(nonEssential, "api");
    } catch (error) {
      console.warn("Failed to save consent via ConsentManager:", error);
    }
  },

  hasAnalytics: async (): Promise<boolean> => {
    const consentData = await consent.get();
    return consentData.analytics;
  },

  hasMarketing: async (): Promise<boolean> => {
    const consentData = await consent.get();
    return consentData.marketing;
  },
};

// Analytics utilities conforme regras
export const analytics = {
  // Inicialização (only call on client side)
  init: () => {
    if (typeof window === "undefined") return;

    if (
      consent.hasAnalytics() &&
      typeof window !== "undefined" &&
      typeof document !== "undefined"
    ) {
      try {
        // Get CSP nonce from global variable set by layout
        const win = window as Window & WindowExtensions;
        const nonce = win.__csp_nonce;

        // Google Analytics 4
        if (
          GA_MEASUREMENT_ID &&
          !document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`)
        ) {
          const script = document.createElement("script");
          script.async = true;
          script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
          if (nonce) script.setAttribute("nonce", nonce);
          script.onerror = () => {
            console.warn("Analytics script failed to load");
          };
          document.head.appendChild(script);

          const configScript = document.createElement("script");
          if (nonce) configScript.setAttribute("nonce", nonce);
          configScript.innerHTML = `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              anonymize_ip: true,
              allow_ad_features: false
            });
          `;
          document.head.appendChild(configScript);
        }
      } catch (error) {
        console.error("Erro ao inicializar analytics:", error);
      }
    }
  },

  // Tracking principal
  track: (event: string, properties?: AnalyticsProperties) => {
    if (typeof window !== "undefined" && consent.hasAnalytics()) {
      const win = window as Window & WindowExtensions;

      // Google Analytics 4
      if (win.gtag) {
        win.gtag("event", event, {
          ...properties,
          custom_parameter_1: "landing_page",
          page_location: window.location.href,
        });
      }

      // Plausible (will be handled by PlausibleProvider if loaded)
      if (win.plausible) {
        win.plausible(event, { props: properties });
      }

      console.log("Analytics event:", event, properties);
    }
  },

  // Eventos específicos
  trackView: (section: string) => {
    if (typeof window === "undefined") return;

    analytics.track("view_section", {
      section,
      page_path: window.location.pathname,
      timestamp: new Date().toISOString(),
    });
  },

  trackCtaClick: (cta: string, location: string) => {
    if (typeof window === "undefined") return;

    analytics.track("cta_click", {
      cta_text: cta,
      cta_location: location,
      page_path: window.location.pathname,
      timestamp: new Date().toISOString(),
    });
  },

  trackScroll: (depth: number) => {
    if (typeof window === "undefined") return;

    analytics.track("scroll_depth", {
      scroll_depth: depth,
      page_path: window.location.pathname,
    });
  },

  trackTimeOnPage: (time: number) => {
    if (typeof window === "undefined") return;

    analytics.track("time_on_page", {
      time_seconds: time,
      page_path: window.location.pathname,
    });
  },

  trackSubmit: (form: string, success: boolean, error?: string) => {
    if (typeof window === "undefined") return;

    analytics.track("form_submit", {
      form_name: form,
      form_success: success,
      form_error: error,
      page_path: window.location.pathname,
      timestamp: new Date().toISOString(),
    });
  },

  trackExperiment: (experimentId: string, variant: string, action?: string) => {
    // Only track on client side where window is available
    if (typeof window === "undefined") return;

    analytics.track("experiment_impression", {
      experiment_id: experimentId,
      variant,
      action: action || "view",
      page_path: window.location.pathname,
      timestamp: new Date().toISOString(),
    });
  },

  // Personalization tracking
  trackPersonalization: (
    segmentId: string,
    contentKey: string,
    action: string,
  ) => {
    if (typeof window === "undefined") return;

    analytics.track("personalization_event", {
      segment_id: segmentId,
      content_key: contentKey,
      action, // 'view', 'click', 'convert'
      page_path: window.location.pathname,
      timestamp: new Date().toISOString(),
    });
  },

  trackSegmentActivation: (segmentIds: string[]) => {
    if (typeof window === "undefined") return;

    analytics.track("segment_activation", {
      active_segments: segmentIds,
      segment_count: segmentIds.length,
      page_path: window.location.pathname,
      timestamp: new Date().toISOString(),
    });
  },

  // Scroll storytelling analytics
  trackChapterEnter: (
    chapterId: string,
    previousChapter?: string,
    direction?: string,
  ) => {
    if (typeof window === "undefined") return;

    analytics.track("chapter_enter", {
      chapter_id: chapterId,
      previous_chapter: previousChapter,
      direction,
      page_path: window.location.pathname,
      timestamp: new Date().toISOString(),
    });
  },

  trackStepChange: (chapterId: string, step: number, stepProgress?: number) => {
    if (typeof window === "undefined") return;

    analytics.track("step_change", {
      chapter: chapterId,
      step,
      step_progress: stepProgress,
      page_path: window.location.pathname,
      timestamp: new Date().toISOString(),
    });
  },

  trackCtaExposed: (ctaId: string, chapterId: string, dwellTime?: number) => {
    if (typeof window === "undefined") return;

    analytics.track("cta_exposed", {
      cta_id: ctaId,
      chapter: chapterId,
      dwell_ms: dwellTime,
      page_path: window.location.pathname,
      timestamp: new Date().toISOString(),
    });
  },

  trackOverlayOpen: (overlayId: string, trigger: string) => {
    if (typeof window === "undefined") return;

    analytics.track("overlay_open", {
      overlay_id: overlayId,
      trigger,
      page_path: window.location.pathname,
      timestamp: new Date().toISOString(),
    });
  },

  trackOverlayClose: (overlayId: string, dwellTime: number, action: string) => {
    if (typeof window === "undefined") return;

    analytics.track("overlay_close", {
      overlay_id: overlayId,
      dwell_ms: dwellTime,
      action, // 'timeout', 'click_outside', 'esc', 'manual'
      page_path: window.location.pathname,
      timestamp: new Date().toISOString(),
    });
  },

  trackScrollDepth: (depth: number, chapterId?: string) => {
    if (typeof window === "undefined") return;

    analytics.track("scroll_depth", {
      scroll_depth: depth,
      chapter: chapterId,
      page_path: window.location.pathname,
      timestamp: new Date().toISOString(),
    });
  },
};
