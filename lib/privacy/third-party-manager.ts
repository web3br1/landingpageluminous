import { ConsentManager } from "./consent-manager";
import type { ConsentState } from "@/components/cookie-banner";
import {
  safeWindowAccess,
  safeDocumentAccess,
  safeNavigatorAccess,
} from "@/lib/utils/browser-api-helpers";

export interface ThirdPartyScript {
  id: string;
  category: keyof Omit<ConsentState, "essential">;
  src?: string;
  html?: string;
  async?: boolean;
  defer?: boolean;
  loadCondition?: () => boolean;
}

export class ThirdPartyManager {
  private static loadedScripts = new Set<string>();

  private static readonly SCRIPTS: ThirdPartyScript[] = [
    // Google Analytics
    {
      id: "google-analytics",
      category: "analytics",
      html: `
        <!-- Google Analytics -->
        <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
        <script>
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'GA_MEASUREMENT_ID');
        </script>
      `,
      loadCondition: () =>
        typeof window !== "undefined" && !((window as any).gtag),
    },

    // Facebook Pixel
    {
      id: "facebook-pixel",
      category: "marketing",
      html: `
        <!-- Facebook Pixel Code -->
        <script>
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', 'YOUR_PIXEL_ID');
          fbq('track', 'PageView');
        </script>
      `,
      loadCondition: () =>
        typeof window !== "undefined" && !((window as any).fbq),
    },

    // Hotjar
    {
      id: "hotjar",
      category: "analytics",
      html: `
        <!-- Hotjar Tracking Code -->
        <script>
          (function(h,o,t,j,a,r){
              h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
              h._hjSettings={hjid:YOUR_HOTJAR_ID,hjsv:6};
              a=o.getElementsByTagName('head')[0];
              r=o.createElement('script');r.async=1;
              r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
              a.appendChild(r);
          })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
        </script>
      `,
      loadCondition: () =>
        typeof window !== "undefined" && !((window as any).hj),
    },
  ];

  static hasCategoryConsent(category: string): boolean {
    switch (category) {
      case 'analytics':
        return ConsentManager.hasAnalyticsConsent();
      case 'marketing':
        return ConsentManager.hasMarketingConsent();
      case 'functional':
        return ConsentManager.hasFunctionalConsent();
      case 'essential':
        return ConsentManager.hasEssentialConsent();
      default:
        return false;
    }
  }

  static loadScriptIfConsented(scriptId: string): boolean {
    const script = this.SCRIPTS.find((s) => s.id === scriptId);
    if (!script) {
      console.warn(`Script ${scriptId} not found in registry`);
      return false;
    }

    // Check consent for this category
    if (!ConsentManager.hasCategoryConsent(script.category)) {
      console.log(`Script ${scriptId} blocked: no ${script.category} consent`);
      return false;
    }

    // Check custom load condition
    if (script.loadCondition && !script.loadCondition()) {
      console.log(`Script ${scriptId} not loaded: condition not met`);
      return false;
    }

    // Check if already loaded
    if (this.loadedScripts.has(scriptId)) {
      console.log(`Script ${scriptId} already loaded`);
      return true;
    }

    try {
      if (script.html) {
        // Inject HTML
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = script.html;
        const scripts = tempDiv.querySelectorAll("script");

        scripts.forEach((scriptElement) => {
          const newScript = document.createElement("script");
          if (scriptElement.src) newScript.src = scriptElement.src;
          if (script.async) newScript.async = true;
          if (script.defer) newScript.defer = true;
          newScript.textContent = scriptElement.textContent;

          document.head.appendChild(newScript);
        });
      } else if (script.src) {
        // Load external script
        const newScript = document.createElement("script");
        newScript.src = script.src;
        if (script.async) newScript.async = true;
        if (script.defer) newScript.defer = true;

        document.head.appendChild(newScript);
      }

      this.loadedScripts.add(scriptId);
      console.log(`Script ${scriptId} loaded successfully`);
      return true;
    } catch (error) {
      console.error(`Failed to load script ${scriptId}:`, error);
      return false;
    }
  }

  static init(): void {
    if (typeof window === "undefined") return;

    // Load all consented scripts
    this.SCRIPTS.forEach((script) => {
      this.loadScriptIfConsented(script.id);
    });

    console.log("ThirdPartyManager initialized");
  }

  static reloadScripts(): void {
    if (typeof window === "undefined") return;

    // Clear loaded scripts set
    this.loadedScripts.clear();

    // Re-initialize
    this.init();
  }

  static getLoadedScripts(): string[] {
    return Array.from(this.loadedScripts);
  }

  static getAvailableScripts(): ThirdPartyScript[] {
    return [...this.SCRIPTS];
  }
}
