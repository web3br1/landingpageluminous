"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  UserProfile,
  UserSegment,
  PersonalizationRule,
  PersonalizedContent,
} from "./types";
import { validateEnvelopeStrict } from "@/lib/composition/composer-validation";
import { analytics } from "@/lib/analytics-core";

// Default user segments
const DEFAULT_SEGMENTS: UserSegment[] = [
  {
    id: "new_visitor",
    name: "Novo Visitante",
    description: "Primeira visita ao site",
    criteria: {
      visitCount: { min: 0, max: 1 },
      conversionStage: "awareness",
    },
    priority: 1,
  },
  {
    id: "returning_visitor",
    name: "Visitante Recorrente",
    description: "Já visitou o site várias vezes",
    criteria: {
      visitCount: { min: 2, max: 10 },
    },
    priority: 2,
  },
  {
    id: "enterprise",
    name: "Empresa Grande",
    description: "Visitantes de grandes empresas",
    criteria: {
      companySize: "enterprise",
    },
    priority: 10,
  },
  {
    id: "mobile_user",
    name: "Usuário Mobile",
    description: "Acessando via dispositivo móvel",
    criteria: {
      deviceType: "mobile",
    },
    priority: 5,
  },
  {
    id: "desktop_user",
    name: "Usuário Desktop",
    description: "Acessando via computador",
    criteria: {
      deviceType: "desktop",
    },
    priority: 5,
  },
];

// Default personalization rules
const DEFAULT_RULES: PersonalizationRule[] = [
  {
    id: "hero_mobile_optimization",
    name: "Hero Mobile Optimization",
    conditions: [
      { type: "segment", key: "mobile_user", operator: "equals", value: true },
    ],
    actions: [
      {
        type: "content_override",
        target: "hero.headline",
        value: "Relatórios Inteligentes no Seu Bolso",
      },
    ],
    priority: 10,
    active: true,
  },
  {
    id: "enterprise_focus",
    name: "Enterprise Focus",
    conditions: [
      { type: "segment", key: "enterprise", operator: "equals", value: true },
    ],
    actions: [
      {
        type: "content_override",
        target: "hero.subheadline",
        value:
          "Soluções corporativas para grandes volumes de dados e equipes distribuídas.",
      },
    ],
    priority: 15,
    active: true,
  },
  {
    id: "new_visitor_simplification",
    name: "New Visitor Simplification",
    conditions: [
      { type: "segment", key: "new_visitor", operator: "equals", value: true },
    ],
    actions: [
      {
        type: "element_hide",
        target: ".advanced-features",
        value: true,
      },
    ],
    priority: 5,
    active: true,
  },
];

interface PersonalizationContextType {
  userProfile: UserProfile | null;
  activeSegments: UserSegment[];
  isLoading: boolean;
  personalizeContent: (content: any, contentKey: string) => any;
  trackUserAction: (action: string, metadata?: Record<string, any>) => void;
  updateUserAttribute: (key: string, value: any) => void;
}

const PersonalizationContext = createContext<PersonalizationContextType | null>(
  null,
);

export function PersonalizationProvider({ children }: { children: ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeSegments, setActiveSegments] = useState<UserSegment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const matchesCriteria = useCallback(
    (profile: UserProfile, criteria: any): boolean => {
      // Device type check
      if (
        criteria.deviceType &&
        profile.attributes.deviceType !== criteria.deviceType
      ) {
        return false;
      }

      // Visit count check
      if (criteria.visitCount) {
        const { min, max } = criteria.visitCount;
        const visits = profile.behavior.visitCount;
        if (visits < min || (max && visits > max)) {
          return false;
        }
      }

      // Company size check (would come from form data or UTM params)
      if (
        criteria.companySize &&
        profile.attributes.companySize !== criteria.companySize
      ) {
        return false;
      }

      // Add more criteria checks as needed...

      return true;
    },
    [],
  );

  const determineActiveSegments = useCallback(
    (profile: UserProfile): UserSegment[] => {
      const activeSegments: UserSegment[] = [];

      for (const segment of DEFAULT_SEGMENTS) {
        if (matchesCriteria(profile, segment.criteria)) {
          activeSegments.push(segment);
        }
      }

      // Sort by priority (highest first)
      return activeSegments.sort((a, b) => b.priority - a.priority);
    },
    [matchesCriteria],
  );

  const createBaseProfile = (userId: string): UserProfile => {
    const now = new Date();
    return {
      id: userId,
      segments: [],
      attributes: {
        deviceType: getDeviceType(),
        language: navigator.language || "pt-BR",
        browser: getBrowserInfo(),
        os: getOSInfo(),
        screenSize: `${screen.width}x${screen.height}`,
      },
      preferences: {
        theme: "system",
        language: navigator.language?.split("-")[0] || "pt",
        notifications: false,
        marketingEmails: false,
        contentTypes: ["videos", "blogs"],
      },
      behavior: {
        visitCount: 1,
        totalTimeOnSite: 0,
        pagesViewed: [window.location.pathname],
        lastVisit: now,
        conversionEvents: [],
        experimentImpressions: [],
      },
      createdAt: now,
      updatedAt: now,
    };
  };

  const updateProfileWithSessionData = (profile: UserProfile): UserProfile => {
    const now = new Date();
    const currentPath = window.location.pathname;

    // Update visit count and time
    profile.behavior.visitCount += 1;
    profile.behavior.lastVisit = now;
    profile.updatedAt = now;

    // Add current page if not already viewed
    if (!profile.behavior.pagesViewed.includes(currentPath)) {
      profile.behavior.pagesViewed.push(currentPath);
    }

    // Update device info
    profile.attributes.deviceType = getDeviceType();

    // Persist updated profile
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(
        `dataflow_profile_${profile.id}`,
        JSON.stringify(profile),
      );
    }

    return profile;
  };

  const initializeUserProfile = useCallback(() => {
    try {
      // Get or create anonymous user ID
      let userId =
        typeof localStorage !== "undefined"
          ? localStorage.getItem("dataflow_user_id")
          : null;
      if (!userId) {
        userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("dataflow_user_id", userId);
        }
      }

      // Get existing profile or create new one
      const storedProfile =
        typeof localStorage !== "undefined"
          ? localStorage.getItem(`dataflow_profile_${userId}`)
          : null;
      const baseProfile: UserProfile = storedProfile
        ? JSON.parse(storedProfile)
        : createBaseProfile(userId);

      // Update with current session data
      const updatedProfile = updateProfileWithSessionData(baseProfile);

      // Determine active segments
      const segments = determineActiveSegments(updatedProfile);

      setUserProfile(updatedProfile);
      setActiveSegments(segments);
      setIsLoading(false);

      // Track profile initialization
      analytics.track("profile_initialized", {
        user_id: userId,
        segments: segments.map((s) => s.id),
        visit_count: updatedProfile.behavior.visitCount,
      });
    } catch (error) {
      console.error("Failed to initialize user profile:", error);
      setIsLoading(false);
    }
  }, [determineActiveSegments]);

  // Initialize user profile on mount
  useEffect(() => {
    initializeUserProfile();
  }, [initializeUserProfile]);

  const personalizeContent = (content: any, contentKey: string): any => {
    if (!userProfile || activeSegments.length === 0) {
      return content;
    }

    let personalizedContent = { ...content };

    // Apply personalization rules
    for (const rule of DEFAULT_RULES) {
      if (!rule.active) continue;

      // Check if rule conditions are met
      const conditionsMet = rule.conditions.every((condition) => {
        switch (condition.type) {
          case "segment":
            return activeSegments.some((s) => s.id === condition.value);
          default:
            return true; // Add more condition types as needed
        }
      });

      if (conditionsMet) {
        // Apply rule actions
        for (const action of rule.actions) {
          if (
            action.type === "content_override" &&
            action.target === contentKey
          ) {
            personalizedContent = { ...personalizedContent, ...action.value };
          }
        }
      }
    }

    // Validate envelope post-transformation when applicable
    const validation = validateEnvelopeStrict(personalizedContent);
    if (!validation.success) {
      console.warn(
        "Personalization produced invalid envelope for",
        contentKey,
        validation.error,
      );
      return content;
    }

    return personalizedContent;
  };

  const trackUserAction = (action: string, metadata?: Record<string, any>) => {
    if (!userProfile) return;

    analytics.track("user_action", {
      user_id: userProfile.id,
      action,
      segments: activeSegments.map((s) => s.id),
      metadata,
      timestamp: new Date().toISOString(),
    });
  };

  const updateUserAttribute = (key: string, value: any) => {
    if (!userProfile) return;

    const updatedProfile = {
      ...userProfile,
      attributes: {
        ...userProfile.attributes,
        [key]: value,
      },
      updatedAt: new Date(),
    };

    setUserProfile(updatedProfile);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(
        `dataflow_profile_${userProfile.id}`,
        JSON.stringify(updatedProfile),
      );
    }

    // Re-evaluate segments
    const newSegments = determineActiveSegments(updatedProfile);
    setActiveSegments(newSegments);
  };

  const value: PersonalizationContextType = {
    userProfile,
    activeSegments,
    isLoading,
    personalizeContent,
    trackUserAction,
    updateUserAttribute,
  };

  return (
    <PersonalizationContext.Provider value={value}>
      {children}
    </PersonalizationContext.Provider>
  );
}

export function usePersonalization() {
  const context = useContext(PersonalizationContext);
  if (!context) {
    throw new Error(
      "usePersonalization must be used within a PersonalizationProvider",
    );
  }
  return context;
}

// Utility functions
function getDeviceType(): "mobile" | "tablet" | "desktop" {
  const width = window.innerWidth;
  if (width <= 768) return "mobile";
  if (width <= 1024) return "tablet";
  return "desktop";
}

function getBrowserInfo(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Edge")) return "Edge";
  return "Unknown";
}

function getOSInfo(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac")) return "macOS";
  if (ua.includes("Linux")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iOS")) return "iOS";
  return "Unknown";
}
