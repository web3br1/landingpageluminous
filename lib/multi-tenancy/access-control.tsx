"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useTenant } from "./tenant-context";

export type UserRole = "admin" | "editor" | "viewer" | "guest";

export type Permission =
  | "experiment.create"
  | "experiment.edit"
  | "experiment.delete"
  | "experiment.view"
  | "analytics.view"
  | "analytics.export"
  | "tenant.settings.edit"
  | "tenant.branding.edit"
  | "tenant.users.manage"
  | "content.publish"
  | "content.edit";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
  permissions: Permission[];
  lastLogin?: Date;
  isActive: boolean;
}

interface AccessControlContextType {
  user: User | null;
  isAuthenticated: boolean;
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: UserRole) => boolean;
  canAccessFeature: (feature: string) => boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AccessControlContext = createContext<AccessControlContextType | null>(
  null,
);

export function useAccessControl() {
  const context = useContext(AccessControlContext);
  if (!context) {
    throw new Error(
      "useAccessControl must be used within an AccessControlProvider",
    );
  }
  return context;
}

// Role-based permissions mapping
const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    "experiment.create",
    "experiment.edit",
    "experiment.delete",
    "experiment.view",
    "analytics.view",
    "analytics.export",
    "tenant.settings.edit",
    "tenant.branding.edit",
    "tenant.users.manage",
    "content.publish",
    "content.edit",
  ],
  editor: [
    "experiment.create",
    "experiment.edit",
    "experiment.view",
    "analytics.view",
    "content.publish",
    "content.edit",
  ],
  viewer: ["experiment.view", "analytics.view"],
  guest: [],
};

interface AccessControlProviderProps {
  children: React.ReactNode;
}

// Mock users for different tenants
const mockUsers: User[] = [
  {
    id: "admin-default",
    email: "admin@dataflow.com",
    name: "Admin User",
    role: "admin",
    tenantId: "default",
    permissions: rolePermissions.admin,
    lastLogin: new Date(),
    isActive: true,
  },
  {
    id: "editor-techcorp",
    email: "editor@techcorp.com",
    name: "TechCorp Editor",
    role: "editor",
    tenantId: "enterprise-a",
    permissions: rolePermissions.editor,
    lastLogin: new Date(),
    isActive: true,
  },
  {
    id: "viewer-innovate",
    email: "viewer@innovatelab.io",
    name: "InnovateLab Viewer",
    role: "viewer",
    tenantId: "startup-b",
    permissions: rolePermissions.viewer,
    lastLogin: new Date(),
    isActive: true,
  },
];

export function AccessControlProvider({
  children,
}: AccessControlProviderProps) {
  const { currentTenant } = useTenant();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage or mock based on tenant
  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoading(true);

        if (typeof window === "undefined") {
          setUser(null);
          return;
        }

        // Check for stored session
        const storedUser = localStorage.getItem("user_session");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          // Verify tenant matches
          if (parsedUser.tenantId === currentTenant?.id) {
            setUser(parsedUser);
            return;
          }
        }

        // Auto-login based on tenant for demo purposes
        if (currentTenant) {
          const tenantUser = mockUsers.find(
            (u) => u.tenantId === currentTenant.id,
          );
          if (tenantUser) {
            setUser(tenantUser);
            localStorage.setItem("user_session", JSON.stringify(tenantUser));
          }
        }
      } catch (error) {
        console.error("Failed to load user:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, [currentTenant]);

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission);
  };

  const hasRole = (role: UserRole): boolean => {
    if (!user) return false;
    return user.role === role;
  };

  const canAccessFeature = (feature: string): boolean => {
    if (!user || !currentTenant) return false;

    // Map features to permissions
    const featurePermissions: Record<string, Permission[]> = {
      "ab-testing": ["experiment.view"],
      analytics: ["analytics.view"],
      "tenant-settings": ["tenant.settings.edit"],
      branding: ["tenant.branding.edit"],
      "user-management": ["tenant.users.manage"],
      "content-management": ["content.edit"],
    };

    const requiredPermissions = featurePermissions[feature];
    if (!requiredPermissions) return true; // Feature not protected

    return requiredPermissions.some((permission) => hasPermission(permission));
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Mock authentication - in production, call API
      const foundUser = mockUsers.find(
        (u) => u.email === email && u.tenantId === currentTenant?.id,
      );

      if (foundUser) {
        setUser(foundUser);
        localStorage.setItem("user_session", JSON.stringify(foundUser));
        return true;
      }

      return false;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user_session");
  };

  const value: AccessControlContextType = {
    user,
    isAuthenticated: !!user,
    hasPermission,
    hasRole,
    canAccessFeature,
    login,
    logout,
    isLoading,
  };

  return (
    <AccessControlContext.Provider value={value}>
      {children}
    </AccessControlContext.Provider>
  );
}

// Higher-order component for protected routes
export function withPermission<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  permission: Permission,
) {
  return function ProtectedComponent(props: P) {
    const { hasPermission, isLoading } = useAccessControl();

    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!hasPermission(permission)) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have permission to access this resource.
            </p>
          </div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };
}

// Component for role-based rendering
interface RoleGuardProps {
  children: React.ReactNode;
  roles: UserRole[];
  fallback?: React.ReactNode;
}

export function RoleGuard({ children, roles, fallback }: RoleGuardProps) {
  const { hasRole, isLoading } = useAccessControl();

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-muted rounded mb-2"></div>
        <div className="h-4 bg-muted rounded w-3/4"></div>
      </div>
    );
  }

  const hasAccess = roles.some((role) => hasRole(role));

  if (!hasAccess) {
    return fallback || null;
  }

  return <>{children}</>;
}

// Component for permission-based rendering
interface PermissionGuardProps {
  children: React.ReactNode;
  permission: Permission;
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  children,
  permission,
  fallback,
}: PermissionGuardProps) {
  const { hasPermission, isLoading } = useAccessControl();

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-muted rounded mb-2"></div>
        <div className="h-4 bg-muted rounded w-3/4"></div>
      </div>
    );
  }

  if (!hasPermission(permission)) {
    return fallback || null;
  }

  return <>{children}</>;
}

// User menu component
export function UserMenu() {
  const { user, logout } = useAccessControl();

  if (!user) return null;

  return (
    <div className="flex items-center gap-4">
      <div className="text-sm">
        <div className="font-medium">{user.name}</div>
        <div className="text-muted-foreground capitalize">{user.role}</div>
      </div>
      <button
        onClick={logout}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        Logout
      </button>
    </div>
  );
}
