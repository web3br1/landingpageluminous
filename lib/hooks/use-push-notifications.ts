"use client";

import { useState, useEffect, useCallback } from "react";
import {
  pushNotifications,
  PushNotification,
} from "@/lib/notifications/push-notifications";
import { usePersonalization } from "@/lib/personalization/personalization-context";

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const { activeSegments, trackUserAction } = usePersonalization();

  // Initialize on mount
  useEffect(() => {
    pushNotifications.loadPreferences();
    setIsSupported(pushNotifications.isEnabled());
    setIsEnabled(pushNotifications.getPreferences().enabled);
  }, []);

  // Track user activity for smart notifications
  useEffect(() => {
    // SSR safety: only run on client-side
    if (typeof window === "undefined") return;

    let activityTimer: NodeJS.Timeout;

    const resetActivityTimer = () => {
      clearTimeout(activityTimer);
      activityTimer = setTimeout(
        () => {
          // Schedule smart notifications after inactivity
          pushNotifications.scheduleSmartNotifications(
            activeSegments.map((segment) => segment.id),
            new Date(),
          );
        },
        5 * 60 * 1000,
      ); // 5 minutes of inactivity
    };

    const handleActivity = () => {
      resetActivityTimer();
      trackUserAction("activity", { type: "page_interaction" });
    };

    // Listen for user activity
    window.addEventListener("click", handleActivity);
    window.addEventListener("scroll", handleActivity);
    window.addEventListener("keydown", handleActivity);

    resetActivityTimer();

    return () => {
      clearTimeout(activityTimer);
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("scroll", handleActivity);
      window.removeEventListener("keydown", handleActivity);
    };
  }, [activeSegments, trackUserAction]);

  // Request permission and initialize
  const requestPermission = useCallback(async () => {
    setIsInitializing(true);
    try {
      const success = await pushNotifications.initialize();
      setIsEnabled(success);
      setIsSupported(true);

      if (success) {
        // Subscribe to push notifications
        await pushNotifications.subscribe();

        // Update preferences with current segments
        pushNotifications.updatePreferences({
          type: "engage",
          segments: activeSegments.map((segment) => segment.id),
        });

        trackUserAction("notification_permission", { granted: true });
      } else {
        trackUserAction("notification_permission", { granted: false });
      }
    } catch (error) {
      console.error("Failed to initialize push notifications:", error);
      setIsEnabled(false);
    } finally {
      setIsInitializing(false);
    }

    return isEnabled;
  }, [isEnabled, activeSegments, trackUserAction]);

  // Send a notification
  const sendNotification = useCallback(
    async (notification: PushNotification) => {
      if (!isEnabled) return false;

      const success = await pushNotifications.send(notification);

      if (success) {
        trackUserAction("notification_sent", {
          notification_id: notification.id,
          title: notification.title,
        });
      }

      return success;
    },
    [isEnabled, trackUserAction],
  );

  // Send welcome notification after permission granted
  const sendWelcomeNotification = useCallback(async () => {
    if (!isEnabled) return;

    await sendNotification({
      id: "welcome",
      title: "🎉 Bem-vindo à Luminaris!",
      body: "Obrigado por permitir notificações. Vamos manter você informado sobre suas automações!",
      requireInteraction: false,
    });
  }, [isEnabled, sendNotification]);

  // Send re-engagement notification
  const sendReEngagementNotification = useCallback(async () => {
    if (!isEnabled) return;

    const messages = [
      {
        title: "📊 Seus relatórios estão prontos!",
        body: "Confira as últimas atualizações automáticas do seu sistema.",
      },
      {
        title: "🚀 Nova funcionalidade disponível",
        body: "Descubra como otimizar ainda mais seus processos.",
      },
      {
        title: "💡 Dica da Luminaris",
        body: "Economize tempo automatizando relatórios recorrentes.",
      },
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    await sendNotification({
      id: `reengagement_${Date.now()}`,
      ...randomMessage,
      actions: [
        { action: "view", title: "Ver Agora" },
        { action: "later", title: "Mais Tarde" },
      ],
      requireInteraction: true,
    });
  }, [isEnabled, sendNotification]);

  // Handle notification action clicks
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "notification_action") {
          const { action, notificationId } = event.data;

          pushNotifications.updatePreferences({
            type: action === "dismiss" ? "dismiss" : "click",
            notificationId,
          });

          trackUserAction("notification_action", {
            action,
            notification_id: notificationId,
          });

          // Handle specific actions
          switch (action) {
            case "demo":
              window.location.href = "/demo";
              break;
            case "contact":
              window.location.href = "/contact";
              break;
            case "login":
              window.location.href = "/login";
              break;
            case "view":
              // Stay on current page or redirect to relevant section
              break;
          }
        }
      });
    }
  }, [trackUserAction]);

  return {
    isSupported,
    isEnabled,
    isInitializing,
    requestPermission,
    sendNotification,
    sendWelcomeNotification,
    sendReEngagementNotification,
    preferences: pushNotifications.getPreferences(),
  };
}
