import { analytics } from "@/lib/analytics-core";

export interface PushNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
  tag?: string;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface UserNotificationPreferences {
  enabled: boolean;
  segments: string[];
  lastInteraction: Date;
  dismissedNotifications: string[];
  engagementScore: number;
}

export class PushNotificationManager {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private isSupported: boolean = false;
  private userPreferences: UserNotificationPreferences = {
    enabled: false,
    segments: [],
    lastInteraction: new Date(),
    dismissedNotifications: [],
    engagementScore: 0,
  };

  constructor() {
    this.isSupported = "serviceWorker" in navigator && "Notification" in window;
  }

  // Initialize push notifications
  async initialize(): Promise<boolean> {
    if (!this.isSupported) {
      console.log("Push notifications not supported");
      return false;
    }

    try {
      // Register service worker if not already registered
      if (!this.swRegistration) {
        this.swRegistration = await navigator.serviceWorker.register("/sw.js");
        console.log("Service Worker registered for notifications");
      }

      // Request permission
      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        console.log("Push notifications permission granted");
        this.userPreferences.enabled = true;
        this.savePreferences();
        return true;
      } else {
        console.log("Push notifications permission denied");
        return false;
      }
    } catch (error) {
      console.error("Failed to initialize push notifications:", error);
      return false;
    }
  }

  // Subscribe to push notifications
  async subscribe(): Promise<PushSubscription | null> {
    if (!this.swRegistration) return null;

    try {
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "",
        ) as any,
      });

      analytics.track("push_subscription_success", {
        endpoint: subscription.endpoint,
        user_agent: navigator.userAgent,
      });

      return subscription;
    } catch (error) {
      console.error("Failed to subscribe to push notifications:", error);
      analytics.track("push_subscription_failed", {
        error: error instanceof Error ? error.message : "unknown",
      });
      return null;
    }
  }

  // Send notification
  async send(notification: PushNotification): Promise<boolean> {
    if (!this.isSupported || Notification.permission !== "granted") {
      return false;
    }

    try {
      const options: NotificationOptions = {
        body: notification.body,
        icon: notification.icon || "/images/brand/logo-192.png",
        badge: notification.badge || "/images/brand/logo-192.png",
        // image: notification.image, // Not supported in NotificationOptions
        data: notification.data,
        // actions: notification.actions, // Not supported in NotificationOptions
        requireInteraction: notification.requireInteraction || false,
        silent: notification.silent || false,
        tag: notification.tag,
      };

      const n = new Notification(notification.title, options);

      // Track notification shown
      analytics.track("push_notification_shown", {
        notification_id: notification.id,
        title: notification.title,
        has_actions: !!notification.actions?.length,
        require_interaction: notification.requireInteraction,
      });

      // Handle notification click
      n.onclick = () => {
        analytics.track("push_notification_clicked", {
          notification_id: notification.id,
          action: "click",
        });

        // Focus window or open new one
        window.focus();

        // Close notification
        n.close();
      };

      // Handle notification close
      n.onclose = () => {
        analytics.track("push_notification_closed", {
          notification_id: notification.id,
        });
      };

      // Auto-close after 5 seconds if not requiring interaction
      if (!notification.requireInteraction) {
        setTimeout(() => n.close(), 5000);
      }

      return true;
    } catch (error) {
      console.error("Failed to send notification:", error);
      return false;
    }
  }

  // Intelligent notification scheduling based on user behavior
  async scheduleSmartNotifications(
    segments: string[],
    lastActivity: Date,
  ): Promise<void> {
    if (!this.userPreferences.enabled) return;

    const now = new Date();
    const hoursSinceActivity =
      (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

    // Don't spam recent users
    if (hoursSinceActivity < 1) return;

    // Schedule notifications based on segments and time
    const notifications: PushNotification[] = [];

    if (segments.includes("enterprise")) {
      if (hoursSinceActivity > 24) {
        notifications.push({
          id: "enterprise_followup",
          title: "Solução Corporativa Luminaris",
          body: "Como podemos ajudar sua empresa com automação avançada?",
          requireInteraction: true,
          actions: [
            { action: "demo", title: "Agendar Demo" },
            { action: "contact", title: "Falar com Especialista" },
          ],
        });
      }
    } else if (segments.includes("mobile_user")) {
      if (hoursSinceActivity > 4) {
        notifications.push({
          id: "mobile_reminder",
          title: "Luminaris no Seu Bolso",
          body: "Acesse seus relatórios de qualquer lugar com nosso app mobile!",
          tag: "mobile",
        });
      }
    } else {
      // General re-engagement
      if (hoursSinceActivity > 6) {
        notifications.push({
          id: "general_reengagement",
          title: "Não esqueça da Luminaris!",
          body: "Seus relatórios automáticos estão esperando por você.",
          actions: [{ action: "login", title: "Acessar Sistema" }],
        });
      }
    }

    // Send notifications with delays to avoid spam
    notifications.forEach((notification, index) => {
      setTimeout(() => {
        // Check if user has dismissed similar notifications
        if (
          !this.userPreferences.dismissedNotifications.includes(notification.id)
        ) {
          this.send(notification);
        }
      }, index * 2000); // 2 second delays
    });
  }

  // Update user preferences based on interaction
  updatePreferences(interaction: {
    type: "click" | "dismiss" | "engage";
    notificationId?: string;
    segments?: string[];
  }): void {
    this.userPreferences.lastInteraction = new Date();

    if (interaction.notificationId) {
      if (interaction.type === "dismiss") {
        this.userPreferences.dismissedNotifications.push(
          interaction.notificationId,
        );
      }

      // Update engagement score
      if (interaction.type === "click") {
        this.userPreferences.engagementScore += 0.2;
      } else if (interaction.type === "dismiss") {
        this.userPreferences.engagementScore -= 0.1;
      }

      this.userPreferences.engagementScore = Math.max(
        0,
        Math.min(1, this.userPreferences.engagementScore),
      );
    }

    if (interaction.segments) {
      this.userPreferences.segments = interaction.segments;
    }

    this.savePreferences();
  }

  // Save preferences to localStorage
  private savePreferences(): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "luminaris_notifications",
        JSON.stringify(this.userPreferences),
      );
    }
  }

  // Load preferences from localStorage
  loadPreferences(): void {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("luminaris_notifications");
        if (stored) {
          this.userPreferences = {
            ...this.userPreferences,
            ...JSON.parse(stored),
          };
        }
      } catch (error) {
        console.error("Failed to load notification preferences:", error);
      }
    }
  }

  // Check if notifications are supported and enabled
  isEnabled(): boolean {
    return (
      this.isSupported &&
      this.userPreferences.enabled &&
      Notification.permission === "granted"
    );
  }

  // Get user preferences
  getPreferences(): UserNotificationPreferences {
    return { ...this.userPreferences };
  }

  // Utility function to convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Test notification (for development)
  async testNotification(): Promise<void> {
    await this.send({
      id: "test",
      title: "🧪 Teste de Notificação",
      body: "Esta é uma notificação de teste do Luminaris!",
      tag: "test",
    });
  }
}

// Global instance
export const pushNotifications = new PushNotificationManager();
