"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "./utils";

// Tipos de notificação
export type NotificationType = "success" | "error" | "warning" | "info";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Contexto para notificações
interface NotificationContextType {
  notifications: Notification[];
  showNotification: (notification: Omit<Notification, "id">) => void;
  hideNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

// Hook para usar notificações
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
}

// Hook para notificações - deve ser usado dentro de componentes React
export function useNotify() {
  const context = useContext(NotificationContext);

  return {
    success: (
      title: string,
      message?: string,
      options?: Partial<Notification>,
    ) => {
      if (context) {
        context.showNotification({
          type: "success",
          title,
          message,
          duration: 5000,
          ...options,
        });
      } else {
        console.log(`🟢 SUCCESS: ${title}${message ? ` - ${message}` : ""}`);
      }
    },

    error: (
      title: string,
      message?: string,
      options?: Partial<Notification>,
    ) => {
      if (context) {
        context.showNotification({
          type: "error",
          title,
          message,
          duration: 8000,
          ...options,
        });
      } else {
        console.error(`🔴 ERROR: ${title}${message ? ` - ${message}` : ""}`);
      }
    },

    warning: (
      title: string,
      message?: string,
      options?: Partial<Notification>,
    ) => {
      if (context) {
        context.showNotification({
          type: "warning",
          title,
          message,
          duration: 6000,
          ...options,
        });
      } else {
        console.warn(`🟡 WARNING: ${title}${message ? ` - ${message}` : ""}`);
      }
    },

    info: (
      title: string,
      message?: string,
      options?: Partial<Notification>,
    ) => {
      if (context) {
        context.showNotification({
          type: "info",
          title,
          message,
          duration: 5000,
          ...options,
        });
      } else {
        console.info(`🔵 INFO: ${title}${message ? ` - ${message}` : ""}`);
      }
    },
  };
}

// Funções utilitárias para notificações rápidas (deprecated - use useNotify hook)
// Mantidas para compatibilidade, mas não usam hooks
export const notify = {
  success: (
    title: string,
    message?: string,
    options?: Partial<Notification>,
  ) => {
    console.log(`🟢 SUCCESS: ${title}${message ? ` - ${message}` : ""}`);
  },

  error: (title: string, message?: string, options?: Partial<Notification>) => {
    console.error(`🔴 ERROR: ${title}${message ? ` - ${message}` : ""}`);
  },

  warning: (
    title: string,
    message?: string,
    options?: Partial<Notification>,
  ) => {
    console.warn(`🟡 WARNING: ${title}${message ? ` - ${message}` : ""}`);
  },

  info: (title: string, message?: string, options?: Partial<Notification>) => {
    console.info(`🔵 INFO: ${title}${message ? ` - ${message}` : ""}`);
  },
};

// Componente de notificação individual
interface NotificationItemProps {
  notification: Notification;
  onClose: (id: string) => void;
}

function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const getIcon = (type: NotificationType) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "error":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "warning":
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case "info":
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getStyles = (type: NotificationType) => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800";
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-800";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative flex items-start p-4 border rounded-lg shadow-lg max-w-md",
        getStyles(notification.type),
      )}
    >
      <div className="flex-shrink-0 mr-3">{getIcon(notification.type)}</div>

      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm">{notification.title}</h4>
        {notification.message && (
          <p className="text-sm opacity-90 mt-1">{notification.message}</p>
        )}

        {notification.action && (
          <button
            onClick={notification.action.onClick}
            className="mt-2 text-sm font-medium underline hover:no-underline"
          >
            {notification.action.label}
          </button>
        )}
      </div>

      <button
        onClick={() => onClose(notification.id)}
        className="flex-shrink-0 ml-3 opacity-70 hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// Container de notificações
function NotificationContainer() {
  const { notifications, hideNotification } = useNotifications();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onClose={hideNotification}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Provider de notificações
interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const hideNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showNotification = useCallback(
    (notificationData: Omit<Notification, "id">) => {
      const id = Math.random().toString(36).substr(2, 9);
      const notification: Notification = {
        id,
        duration: 5000,
        ...notificationData,
      };

      setNotifications((prev) => [...prev, notification]);

      // Auto-hide after duration
      if (notification.duration && notification.duration > 0) {
        setTimeout(() => {
          hideNotification(id);
        }, notification.duration);
      }
    },
    [hideNotification],
  );

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const value: NotificationContextType = {
    notifications,
    showNotification,
    hideNotification,
    clearAll,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}
