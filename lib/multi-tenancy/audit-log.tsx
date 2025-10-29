"use client";

import React from "react";
import { useTenant } from "./tenant-context";

export type AuditEventType =
  | "user.login"
  | "user.logout"
  | "experiment.created"
  | "experiment.updated"
  | "experiment.deleted"
  | "experiment.started"
  | "experiment.ended"
  | "analytics.viewed"
  | "analytics.exported"
  | "tenant.settings.updated"
  | "tenant.branding.updated"
  | "content.published"
  | "content.updated"
  | "permission.granted"
  | "permission.revoked";

export interface AuditEvent {
  id: string;
  tenantId: string;
  userId: string;
  userEmail: string;
  eventType: AuditEventType;
  resourceType: string;
  resourceId: string;
  action: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  sessionId: string;
}

// Audit logger hook
export function useAuditLog() {
  const { currentTenant } = useTenant();

  const logEvent = async (
    eventType: AuditEventType,
    resourceType: string,
    resourceId: string,
    action: string,
    details: Record<string, any> = {},
  ) => {
    if (!currentTenant) {
      console.warn("Cannot log audit event: no tenant context");
      return;
    }

    try {
      const event: Omit<AuditEvent, "id"> = {
        tenantId: currentTenant.id,
        userId: getCurrentUserId(),
        userEmail: getCurrentUserEmail(),
        eventType,
        resourceType,
        resourceId,
        action,
        details,
        ipAddress: getClientIP(),
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        timestamp: new Date(),
        sessionId: getSessionId(),
      };

      // In production, send to audit API
      console.log("[AUDIT]", event);

      // Store locally for demo purposes
      storeAuditEventLocally(event);

      // Send to analytics service if available
      if (typeof window !== "undefined" && (window as any).analytics) {
        (window as any).analytics.track("audit_event", {
          ...event,
          timestamp: event.timestamp.toISOString(),
        });
      }
    } catch (error) {
      console.error("Failed to log audit event:", error);
    }
  };

  return { logEvent };
}

// Helper functions
function getCurrentUserId(): string {
  if (typeof window === "undefined") return "server-user";

  try {
    const session = localStorage.getItem("user_session");
    if (session) {
      const user = JSON.parse(session);
      return user.id || "anonymous";
    }
  } catch (error) {
    console.warn("Failed to get user ID from session:", error);
  }

  return "anonymous";
}

function getCurrentUserEmail(): string {
  if (typeof window === "undefined") return "server@example.com";

  try {
    const session = localStorage.getItem("user_session");
    if (session) {
      const user = JSON.parse(session);
      return user.email || "anonymous@example.com";
    }
  } catch (error) {
    console.warn("Failed to get user email from session:", error);
  }

  return "anonymous@example.com";
}

function getClientIP(): string {
  // In a real implementation, this would be provided by the server
  // For client-side, we can't reliably get the real IP
  return "client-ip-unknown";
}

function getSessionId(): string {
  if (typeof window === "undefined") return "server-session";

  let sessionId = sessionStorage.getItem("session_id");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem("session_id", sessionId);
  }
  return sessionId;
}

function storeAuditEventLocally(event: Omit<AuditEvent, "id">) {
  if (typeof window === "undefined") return;

  try {
    const auditLog = JSON.parse(localStorage.getItem("audit_log") || "[]");
    auditLog.push({
      ...event,
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });

    // Keep only last 1000 events to prevent localStorage bloat
    if (auditLog.length > 1000) {
      auditLog.splice(0, auditLog.length - 1000);
    }

    localStorage.setItem("audit_log", JSON.stringify(auditLog));
  } catch (error) {
    console.warn("Failed to store audit event locally:", error);
  }
}

// Audit log viewer component (admin only)
export function AuditLogViewer() {
  const [events, setEvents] = React.useState<AuditEvent[]>([]);
  const [filter, setFilter] = React.useState("");
  const [eventTypeFilter, setEventTypeFilter] = React.useState<
    AuditEventType | "all"
  >("all");

  React.useEffect(() => {
    loadAuditEvents();
  }, []);

  const loadAuditEvents = () => {
    if (typeof window === "undefined") return;

    try {
      const auditLog = JSON.parse(localStorage.getItem("audit_log") || "[]");
      const parsedEvents = auditLog.map((event: any) => ({
        ...event,
        timestamp: new Date(event.timestamp),
      }));
      setEvents(parsedEvents.reverse()); // Most recent first
    } catch (error) {
      console.warn("Failed to load audit events:", error);
      setEvents([]);
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesText =
      filter === "" ||
      event.userEmail.toLowerCase().includes(filter.toLowerCase()) ||
      event.action.toLowerCase().includes(filter.toLowerCase()) ||
      event.resourceType.toLowerCase().includes(filter.toLowerCase());

    const matchesType =
      eventTypeFilter === "all" || event.eventType === eventTypeFilter;

    return matchesText && matchesType;
  });

  const formatTimestamp = (date: Date) => {
    return date.toLocaleString("pt-BR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getEventTypeColor = (eventType: AuditEventType) => {
    const colors = {
      "user.login": "text-green-600",
      "user.logout": "text-gray-600",
      "experiment.created": "text-blue-600",
      "experiment.updated": "text-blue-500",
      "experiment.deleted": "text-red-600",
      "experiment.started": "text-green-500",
      "experiment.ended": "text-orange-600",
      "analytics.viewed": "text-purple-600",
      "analytics.exported": "text-purple-500",
      "tenant.settings.updated": "text-yellow-600",
      "tenant.branding.updated": "text-pink-600",
      "content.published": "text-indigo-600",
      "content.updated": "text-indigo-500",
      "permission.granted": "text-emerald-600",
      "permission.revoked": "text-red-500",
    };
    return colors[eventType] || "text-gray-600";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Audit Log</h2>
        <button
          onClick={loadAuditEvents}
          className="px-3 py-1 text-sm border border-border rounded-md hover:bg-accent"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search users, actions, resources..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-1 px-3 py-2 border border-border rounded-md"
        />
        <select
          value={eventTypeFilter}
          onChange={(e) =>
            setEventTypeFilter(e.target.value as AuditEventType | "all")
          }
          className="px-3 py-2 border border-border rounded-md"
        >
          <option value="all">All Events</option>
          <option value="user.login">User Login</option>
          <option value="user.logout">User Logout</option>
          <option value="experiment.created">Experiment Created</option>
          <option value="experiment.updated">Experiment Updated</option>
          <option value="experiment.deleted">Experiment Deleted</option>
          <option value="experiment.started">Experiment Started</option>
          <option value="experiment.ended">Experiment Ended</option>
          <option value="analytics.viewed">Analytics Viewed</option>
          <option value="analytics.exported">Analytics Exported</option>
          <option value="tenant.settings.updated">Settings Updated</option>
          <option value="tenant.branding.updated">Branding Updated</option>
          <option value="content.published">Content Published</option>
          <option value="content.updated">Content Updated</option>
          <option value="permission.granted">Permission Granted</option>
          <option value="permission.revoked">Permission Revoked</option>
        </select>
      </div>

      {/* Events List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No audit events found
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div
              key={event.id}
              className="p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-medium ${getEventTypeColor(event.eventType)}`}
                  >
                    {event.eventType
                      .replace(".", " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatTimestamp(event.timestamp)}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {event.userEmail}
                </div>
              </div>

              <div className="text-sm">
                <span className="font-medium">{event.action}</span>
                <span className="text-muted-foreground"> on </span>
                <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
                  {event.resourceType}:{event.resourceId}
                </span>
              </div>

              {Object.keys(event.details).length > 0 && (
                <details className="mt-2">
                  <summary className="text-xs text-muted-foreground cursor-pointer">
                    Show details
                  </summary>
                  <pre className="text-xs mt-1 p-2 bg-muted rounded overflow-x-auto">
                    {JSON.stringify(event.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
