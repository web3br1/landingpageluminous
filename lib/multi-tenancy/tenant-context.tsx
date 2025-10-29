"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  brand: {
    logo: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
    fonts: {
      heading: string;
      body: string;
    };
  };
  features: {
    abTesting: boolean;
    analytics: boolean;
    customBranding: boolean;
    whiteLabel: boolean;
  };
  limits: {
    monthlyVisitors: number;
    experiments: number;
    customDomains: number;
  };
  settings: {
    timezone: string;
    language: string;
    currency: string;
  };
}

interface TenantContextType {
  currentTenant: Tenant | null;
  tenants: Tenant[];
  switchTenant: (tenantId: string) => void;
  isLoading: boolean;
  error: string | null;
  isMultiTenantMode: boolean;
}

const TenantContext = createContext<TenantContextType | null>(null);

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}

interface TenantProviderProps {
  children: React.ReactNode;
  defaultTenantId?: string;
}

// Mock tenant data - in production, this would come from API/database
const mockTenants: Tenant[] = [
  {
    id: "default",
    name: "DataFlow",
    domain: "dataflow.com",
    brand: {
      logo: "/images/logo.svg",
      colors: {
        primary: "#3b82f6",
        secondary: "#64748b",
        accent: "#8b5cf6",
      },
      fonts: {
        heading: "Inter Tight",
        body: "Inter",
      },
    },
    features: {
      abTesting: true,
      analytics: true,
      customBranding: true,
      whiteLabel: true,
    },
    limits: {
      monthlyVisitors: 100000,
      experiments: 10,
      customDomains: 5,
    },
    settings: {
      timezone: "America/Sao_Paulo",
      language: "pt-BR",
      currency: "BRL",
    },
  },
  {
    id: "enterprise-a",
    name: "TechCorp Solutions",
    domain: "techcorp.com",
    brand: {
      logo: "/images/tenants/techcorp-logo.svg",
      colors: {
        primary: "#10b981",
        secondary: "#374151",
        accent: "#f59e0b",
      },
      fonts: {
        heading: "Poppins",
        body: "Roboto",
      },
    },
    features: {
      abTesting: true,
      analytics: true,
      customBranding: true,
      whiteLabel: true,
    },
    limits: {
      monthlyVisitors: 500000,
      experiments: 25,
      customDomains: 10,
    },
    settings: {
      timezone: "America/New_York",
      language: "en-US",
      currency: "USD",
    },
  },
  {
    id: "startup-b",
    name: "InnovateLab",
    domain: "innovatelab.io",
    brand: {
      logo: "/images/tenants/innovatelab-logo.svg",
      colors: {
        primary: "#8b5cf6",
        secondary: "#6b7280",
        accent: "#06b6d4",
      },
      fonts: {
        heading: "Manrope",
        body: "Inter",
      },
    },
    features: {
      abTesting: true,
      analytics: false,
      customBranding: false,
      whiteLabel: false,
    },
    limits: {
      monthlyVisitors: 10000,
      experiments: 3,
      customDomains: 1,
    },
    settings: {
      timezone: "Europe/London",
      language: "en-GB",
      currency: "GBP",
    },
  },
];

export function TenantProvider({
  children,
  defaultTenantId = "default",
}: TenantProviderProps) {
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [tenants] = useState<Tenant[]>(mockTenants);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMultiTenantMode] = useState(true); // In production, detect based on environment

  // Load tenant based on domain or URL parameter
  useEffect(() => {
    const loadTenant = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Determine tenant from domain or URL param
        const hostname =
          typeof window !== "undefined" ? window.location.hostname : "";
        const urlParams =
          typeof window !== "undefined"
            ? new URLSearchParams(window.location.search)
            : new URLSearchParams();

        const tenantParam = urlParams.get("tenant");
        const subdomain = hostname.split(".")[0];

        let tenantId = defaultTenantId;

        // Check for tenant parameter
        if (tenantParam) {
          tenantId = tenantParam;
        }
        // Check for subdomain (e.g., techcorp.dataflow.com)
        else if (subdomain && subdomain !== "www" && subdomain !== hostname) {
          const tenantBySubdomain = tenants.find((t) => t.id === subdomain);
          if (tenantBySubdomain) {
            tenantId = tenantBySubdomain.id;
          }
        }
        // Check for custom domain
        else {
          const tenantByDomain = tenants.find((t) => t.domain === hostname);
          if (tenantByDomain) {
            tenantId = tenantByDomain.id;
          }
        }

        const tenant = tenants.find((t) => t.id === tenantId) || tenants[0];
        setCurrentTenant(tenant);

        // Apply tenant-specific styling
        applyTenantStyling(tenant);
      } catch (err) {
        console.error("Failed to load tenant:", err);
        setError("Failed to load tenant configuration");
        // Fallback to default tenant
        setCurrentTenant(tenants[0]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTenant();
  }, [defaultTenantId, tenants]);

  const switchTenant = (tenantId: string) => {
    const tenant = tenants.find((t) => t.id === tenantId);
    if (tenant) {
      setCurrentTenant(tenant);
      applyTenantStyling(tenant);

      // Update URL parameter for persistence
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        url.searchParams.set("tenant", tenantId);
        window.history.replaceState({}, "", url.toString());
      }
    }
  };

  // Apply tenant-specific CSS variables and styling
  const applyTenantStyling = (tenant: Tenant) => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;

    // Apply brand colors
    root.style.setProperty("--tenant-primary", tenant.brand.colors.primary);
    root.style.setProperty("--tenant-secondary", tenant.brand.colors.secondary);
    root.style.setProperty("--tenant-accent", tenant.brand.colors.accent);

    // Apply fonts (if different from default)
    if (tenant.brand.fonts.heading !== "Inter Tight") {
      root.style.setProperty(
        "--tenant-heading-font",
        tenant.brand.fonts.heading,
      );
    }
    if (tenant.brand.fonts.body !== "Inter") {
      root.style.setProperty("--tenant-body-font", tenant.brand.fonts.body);
    }

    // Store tenant ID for analytics
    localStorage.setItem("current_tenant", tenant.id);
  };

  const value: TenantContextType = {
    currentTenant,
    tenants,
    switchTenant,
    isLoading,
    error,
    isMultiTenantMode,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Configuration Error</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

// Hook for tenant-aware feature flags
export function useTenantFeature(feature: keyof Tenant["features"]): boolean {
  const { currentTenant } = useTenant();
  return currentTenant?.features[feature] ?? false;
}

// Hook for tenant limits
export function useTenantLimits() {
  const { currentTenant } = useTenant();
  return (
    currentTenant?.limits ?? {
      monthlyVisitors: 0,
      experiments: 0,
      customDomains: 0,
    }
  );
}

// Hook for tenant settings
export function useTenantSettings() {
  const { currentTenant } = useTenant();
  return (
    currentTenant?.settings ?? {
      timezone: "UTC",
      language: "en-US",
      currency: "USD",
    }
  );
}

// Tenant selector component for admin/demo purposes
export function TenantSelector() {
  const { currentTenant, tenants, switchTenant, isMultiTenantMode } =
    useTenant();

  if (!isMultiTenantMode) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <select
        value={currentTenant?.id || ""}
        onChange={(e) => switchTenant(e.target.value)}
        className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
      >
        {tenants.map((tenant) => (
          <option key={tenant.id} value={tenant.id}>
            {tenant.name}
          </option>
        ))}
      </select>
    </div>
  );
}
