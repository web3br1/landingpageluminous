import { ConsentState } from "@/components/cookie-banner";

const CONSENT_STORAGE_KEY = "dataflow-consent";
const CONSENT_VERSION = "1.0";

interface StoredConsent extends ConsentState {
  version: string;
  timestamp: number;
  source: "banner" | "api" | "imported";
}

export interface CookieCategory {
  id: keyof Omit<ConsentState, "essential">;
  title: string;
  description: string;
  required: boolean;
  details: string[];
  impact: "low" | "medium" | "high";
}

export class ConsentManager {
  static readonly CATEGORIES: Record<
    keyof Omit<ConsentState, "essential">,
    CookieCategory
  > = {
    analytics: {
      id: "analytics",
      title: "Analytics e Performance",
      description: "Cookies que nos ajudam a entender como você usa nosso site",
      required: false,
      impact: "medium",
      details: [
        "Acompanhar páginas visitadas e tempo gasto",
        "Identificar problemas de performance",
        "Melhorar a experiência do usuário",
        "Dados anonimizados e agregados",
      ],
    },
    marketing: {
      id: "marketing",
      title: "Marketing e Publicidade",
      description: "Cookies para personalizar anúncios e campanhas",
      required: false,
      impact: "high",
      details: [
        "Mostrar anúncios relevantes",
        "Acompanhar conversões de campanhas",
        "Personalizar conteúdo promocional",
        "Integrar com redes sociais",
      ],
    },
    functional: {
      id: "functional",
      title: "Funcionalidades Avançadas",
      description: "Cookies para recursos adicionais do site",
      required: false,
      impact: "low",
      details: [
        "Lembrar suas preferências",
        "Funcionalidades interativas avançadas",
        "Suporte ao chat e atendimento",
        "Personalização de interface",
      ],
    },
  };

  static getConsent(): ConsentState {
    if (typeof window === "undefined") {
      return {
        essential: true,
        analytics: false,
        marketing: false,
        functional: false,
      };
    }

    try {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (!stored) {
        return {
          essential: true,
          analytics: false,
          marketing: false,
          functional: false,
        };
      }

      const parsed: StoredConsent = JSON.parse(stored);

      // Check if consent version is current
      if (parsed.version !== CONSENT_VERSION) {
        console.warn("Consent version mismatch, resetting to defaults");
        return {
          essential: true,
          analytics: false,
          marketing: false,
          functional: false,
        };
      }

      return {
        essential: parsed.essential,
        analytics: parsed.analytics,
        marketing: parsed.marketing,
        functional: parsed.functional,
      };
    } catch (error) {
      console.warn("Failed to load consent from storage:", error);
      return {
        essential: true,
        analytics: false,
        marketing: false,
        functional: false,
      };
    }
  }

  static setConsent(
    consent: ConsentState,
    source: StoredConsent["source"] = "banner",
  ): void {
    if (typeof window === "undefined") return;

    try {
      const storedConsent: StoredConsent = {
        ...consent,
        version: CONSENT_VERSION,
        timestamp: Date.now(),
        source,
      };

      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(storedConsent));

      // Dispatch custom event for other parts of the app
      window.dispatchEvent(
        new CustomEvent("consentChanged", {
          detail: { consent, source, timestamp: storedConsent.timestamp },
        }),
      );

      console.log("Cookie consent saved:", consent, `(${source})`);
    } catch (error) {
      console.error("Failed to save consent:", error);
    }
  }

  static hasConsent(category: keyof ConsentState): boolean {
    const consent = this.getConsent();
    return consent[category];
  }

  static hasCategoryConsent(
    categoryId: keyof Omit<ConsentState, "essential">,
  ): boolean {
    return this.hasConsent(categoryId);
  }

  static hasAnyNonEssentialConsent(): boolean {
    const consent = this.getConsent();
    return consent.analytics || consent.marketing || consent.functional;
  }

  static getConsentDetails() {
    const consent = this.getConsent();
    const grantedCategories = Object.entries(consent)
      .filter(([key, value]) => key !== "essential" && value === true)
      .map(([key]) => key as keyof Omit<ConsentState, "essential">);

    return {
      consent,
      grantedCategories,
      hasAnyConsent: this.hasAnyNonEssentialConsent(),
      timestamp: this.getLastUpdateTimestamp(),
    };
  }

  static getLastUpdateTimestamp(): number | null {
    if (typeof window === "undefined") return null;

    try {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (!stored) return null;

      const parsed: StoredConsent = JSON.parse(stored);
      return parsed.timestamp;
    } catch {
      return null;
    }
  }

  static clearConsent(): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.removeItem(CONSENT_STORAGE_KEY);

      // Dispatch clear event
      window.dispatchEvent(new CustomEvent("consentCleared"));

      console.log("Cookie consent cleared");
    } catch (error) {
      console.error("Failed to clear consent:", error);
    }
  }

  static exportConsent(): StoredConsent | null {
    if (typeof window === "undefined") return null;

    try {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  static importConsent(storedConsent: StoredConsent): boolean {
    try {
      // Validate the imported consent
      if (storedConsent.version !== CONSENT_VERSION) {
        console.warn("Cannot import consent: version mismatch");
        return false;
      }

      this.setConsent(
        {
          essential: storedConsent.essential,
          analytics: storedConsent.analytics,
          marketing: storedConsent.marketing,
          functional: storedConsent.functional,
        },
        "imported",
      );

      return true;
    } catch (error) {
      console.error("Failed to import consent:", error);
      return false;
    }
  }
}
