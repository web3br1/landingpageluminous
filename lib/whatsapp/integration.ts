import { analytics } from "@/lib/analytics-core";

export interface WhatsAppConfig {
  phoneNumber: string;
  businessAccountId?: string;
  accessToken?: string;
  apiVersion?: string;
}

export interface WhatsAppMessage {
  to: string;
  message: string;
  context?: {
    segments: string[];
    intent: string;
    page: string;
    conversation_id?: string;
  };
}

export class WhatsAppIntegration {
  private config: WhatsAppConfig;

  constructor(config: WhatsAppConfig) {
    this.config = {
      apiVersion: "v18.0",
      ...config,
    };

    // Validate phone number format
    this.validatePhoneNumber();
  }

  private validatePhoneNumber(): void {
    const phone = this.config.phoneNumber;
    // Remove any non-digit characters for validation
    const cleanPhone = phone.replace(/\D/g, "");

    // Brazilian phone validation (adjust as needed for other countries)
    if (!/^55\d{10,11}$/.test(cleanPhone)) {
      console.warn(
        "WhatsApp phone number may not be in correct format. Expected: 5511999999999",
      );
    }

    // Ensure it doesn't start with + for wa.me URLs
    if (phone.startsWith("+")) {
      console.warn(
        "Phone number should not include + prefix for WhatsApp URLs",
      );
    }
  }

  // Generate WhatsApp URL for direct messaging
  generateWhatsAppUrl(
    message: string,
    context?: WhatsAppMessage["context"],
  ): string {
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${this.config.phoneNumber}?text=${encodedMessage}`;

    // Track WhatsApp redirect
    analytics.track("whatsapp_redirect", {
      message_length: message.length,
      has_context: !!context,
      segments: context?.segments || [],
      intent: context?.intent || "unknown",
      page: context?.page || "unknown",
    });

    return url;
  }

  // Generate personalized WhatsApp message based on user context
  generatePersonalizedMessage(context: WhatsAppMessage["context"]): string {
    const { segments = [], intent, page } = context || {};

    let baseMessage = "Olá! Fui direcionado do site da Luminaris.";

    // Personalize based on intent
    switch (intent) {
      case "pricing":
        baseMessage =
          "Olá! Tenho interesse nos planos da Luminaris e gostaria de mais detalhes sobre preços.";
        break;
      case "demo":
        baseMessage =
          "Olá! Gostaria de agendar uma demonstração do sistema Luminaris.";
        break;
      case "contact":
        baseMessage =
          "Olá! Preciso de mais informações sobre o sistema Luminaris.";
        break;
      case "support":
        baseMessage =
          "Olá! Tenho uma dúvida técnica sobre o sistema Luminaris.";
        break;
      default:
        baseMessage = "Olá! Tenho interesse no sistema de automação Luminaris.";
    }

    // Add context about user segments
    if (segments.includes("enterprise")) {
      baseMessage +=
        " Represento uma empresa e preciso de uma solução corporativa.";
    } else if (segments.includes("mobile_user")) {
      baseMessage += " Acesso principalmente pelo celular.";
    }

    // Add page context
    if (page && page.includes("pricing")) {
      baseMessage += " (Vindo da página de preços)";
    } else if (page && page.includes("features")) {
      baseMessage += " (Vindo da página de funcionalidades)";
    } else if (page && page.includes("demo")) {
      baseMessage += " (Vindo da página de demo)";
    }

    return baseMessage;
  }

  // Check if Business API is properly configured
  isBusinessAPIConfigured(): boolean {
    return !!(this.config.businessAccountId && this.config.accessToken);
  }

  // Validate message data before sending
  private validateMessageData(messageData: WhatsAppMessage): {
    valid: boolean;
    error?: string;
  } {
    if (!messageData.to) {
      return { valid: false, error: "Recipient phone number is required" };
    }

    if (!messageData.message || messageData.message.trim().length === 0) {
      return { valid: false, error: "Message cannot be empty" };
    }

    if (messageData.message.length > 4096) {
      return { valid: false, error: "Message too long (max 4096 characters)" };
    }

    // Basic phone validation (recipient)
    const cleanPhone = messageData.to.replace(/\D/g, "");
    if (!/^55\d{10,11}$/.test(cleanPhone)) {
      return { valid: false, error: "Invalid recipient phone number format" };
    }

    return { valid: true };
  }

  // Send message via WhatsApp Business API (if configured)
  async sendMessage(
    messageData: WhatsAppMessage,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Validate input
    const validation = this.validateMessageData(messageData);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // If no Business API credentials, fall back to URL generation
    if (!this.isBusinessAPIConfigured()) {
      console.log("WhatsApp Business API not configured, using URL fallback");
      return {
        success: false,
        error: "Business API not configured",
      };
    }

    try {
      const url = `https://graph.facebook.com/${this.config.apiVersion}/${this.config.businessAccountId}/messages`;

      const payload = {
        messaging_product: "whatsapp",
        to: messageData.to,
        type: "text",
        text: {
          body: messageData.message,
        },
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.messages?.[0]?.id) {
        analytics.track("whatsapp_api_message_sent", {
          message_id: result.messages[0].id,
          recipient: messageData.to,
          message_length: messageData.message.length,
          context: messageData.context,
        });

        return {
          success: true,
          messageId: result.messages[0].id,
        };
      } else {
        const errorMessage =
          result.error?.message ||
          `HTTP ${response.status}: ${response.statusText}`;
        console.error("WhatsApp API error:", result);

        analytics.track("whatsapp_api_error", {
          error_code: result.error?.code,
          error_message: errorMessage,
          http_status: response.status,
          context: messageData.context,
        });

        return {
          success: false,
          error: errorMessage,
        };
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown network error";
      console.error("WhatsApp API request failed:", error);

      analytics.track("whatsapp_api_error", {
        error_type: "network",
        error_message: errorMessage,
        context: messageData.context,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // Check if WhatsApp is available on user's device (client-side only)
  isWhatsAppAvailable(): Promise<boolean> {
    return new Promise((resolve) => {
      // SSR safety check
      if (typeof window === "undefined" || typeof navigator === "undefined") {
        resolve(false);
        return;
      }

      try {
        // Check for WhatsApp Web support
        const whatsappUrl = `https://web.whatsapp.com/`;
        const iframe = document.createElement("iframe");
        iframe.src = whatsappUrl;
        iframe.style.display = "none";
        iframe.style.position = "absolute";
        iframe.style.left = "-9999px";

        let resolved = false;

        const cleanup = () => {
          if (!resolved && document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        };

        iframe.onload = () => {
          if (!resolved) {
            resolved = true;
            resolve(true);
            cleanup();
          }
        };

        iframe.onerror = () => {
          if (!resolved) {
            resolved = true;
            resolve(false);
            cleanup();
          }
        };

        document.body.appendChild(iframe);

        // Timeout fallback (increased for better reliability)
        setTimeout(() => {
          if (!resolved) {
            resolved = true;
            resolve(false);
            cleanup();
          }
        }, 5000);
      } catch (error) {
        console.warn("WhatsApp availability check failed:", error);
        resolve(false);
      }
    });
  }

  // Get optimal contact method based on device and user preferences
  getOptimalContactMethod(
    context: WhatsAppMessage["context"],
  ): "whatsapp" | "phone" | "email" {
    const { segments = [] } = context || {};

    // Prefer WhatsApp for mobile users
    if (segments.includes("mobile_user")) {
      return "whatsapp";
    }

    // Default to WhatsApp for most cases
    return "whatsapp";
  }

  // Test Business API connectivity
  async testAPIConnection(): Promise<{
    success: boolean;
    error?: string;
    details?: unknown;
  }> {
    if (!this.isBusinessAPIConfigured()) {
      return {
        success: false,
        error: "Business API not configured",
      };
    }

    try {
      const url = `https://graph.facebook.com/${this.config.apiVersion}/${this.config.businessAccountId}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          Accept: "application/json",
        },
      });

      const result = await response.json();

      if (response.ok) {
        return {
          success: true,
          details: {
            account_id: result.id,
            name: result.name,
            status: "connected",
          },
        };
      } else {
        return {
          success: false,
          error: result.error?.message || `HTTP ${response.status}`,
          details: result,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Connection failed",
      };
    }
  }

  // Generate contact URLs for different methods
  generateContactUrls(context?: WhatsAppMessage["context"]) {
    const message = this.generatePersonalizedMessage(context);

    return {
      whatsapp: this.generateWhatsAppUrl(message, context),
      phone: `tel:${this.config.phoneNumber}`,
      email: `mailto:contato@luminaris.com?subject=Contato%20Site&body=${encodeURIComponent(message)}`,
    };
  }
}

// Default configuration (should be loaded from environment)
export const whatsappIntegration = new WhatsAppIntegration({
  phoneNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "5511999999999",
  businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
  apiVersion: process.env.WHATSAPP_API_VERSION || "v18.0",
});
