// Jest mock for lib/analytics.tsx
export interface ConsentState {
  analytics: boolean;
  marketing: boolean;
  necessary: boolean;
}

export const consent = {
  state: (): ConsentState => ({
    analytics: true,
    marketing: true,
    necessary: true,
  }),
  update: (newState: Partial<ConsentState>) => {
    // Mock implementation
  },
  acceptAll: () => {
    // Mock implementation
  },
  rejectAll: () => {
    // Mock implementation
  },
};

export const analytics = {
  track: (event: string, properties?: Record<string, any>) => {
    // Mock implementation - just log for tests
    console.log("Analytics track:", event, properties);
  },
  trackView: (page: string, properties?: Record<string, any>) => {
    console.log("Analytics trackView:", page, properties);
  },
  trackClick: (element: string, properties?: Record<string, any>) => {
    console.log("Analytics trackClick:", element, properties);
  },
  trackConversion: (
    action: string,
    value?: number,
    properties?: Record<string, any>,
  ) => {
    console.log("Analytics trackConversion:", action, value, properties);
  },
  trackOverlayClose: (overlayId: string, dwellTime: number, action: string) => {
    console.log("Analytics trackOverlayClose:", overlayId, dwellTime, action);
  },
};

export const PlausibleProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  // Mock provider - just return children
  return children;
};
