// Analytics types - Shared type definitions for analytics system

export interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, unknown>;
  timestamp?: number;
  sessionId?: string;
  userId?: string;
}

export interface PageComposition {
  component: string;
  id?: string;
  content?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  experimentId?: string;
  variant?: string;
}
