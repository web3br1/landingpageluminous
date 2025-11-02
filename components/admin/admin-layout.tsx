"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Brain,
  Palette,
  Settings,
  Menu,
  X,
  Bell,
  User,
  LogOut,
  ChevronDown,
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const navItems: NavItem[] = [
  {
    href: "/admin/monitoring",
    label: "Monitoring",
    icon: AlertTriangle,
    description: "Monitor errors and performance",
  },
  {
    href: "/admin/performance",
    label: "Performance",
    icon: TrendingUp,
    description: "Global performance metrics",
  },
  {
    href: "/admin/experiments",
    label: "Experiments",
    icon: BarChart3,
    description: "A/B testing and personalization",
  },
  {
    href: "/admin/experiment-builder",
    label: "Visual Builder",
    icon: Palette,
    description: "Create experiments visually",
  },
  {
    href: "/admin/ml",
    label: "Machine Learning",
    icon: Brain,
    description: "ML insights and predictions",
  },
];

export function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="flex flex-col h-full">
          {/* Logo and branding */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  Admin Panel
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Luminaris
                </p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200
                    ${
                      isActive
                        ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 dark:from-blue-900/50 dark:to-purple-900/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }
                  `}
                >
                  <Icon
                    className={`w-5 h-5 mr-3 transition-colors ${
                      isActive
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200"
                    }`}
                  />
                  <div className="flex-1">
                    <div className={isActive ? "font-semibold" : ""}>
                      {item.label}
                    </div>
                    <div
                      className={`text-xs mt-0.5 ${
                        isActive
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {item.description}
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                v1.0.0
              </div>
              <div
                className="w-2 h-2 bg-green-500 rounded-full"
                title="System Online"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Page title - hidden on mobile when sidebar is collapsed */}
              <div className="hidden lg:block">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {subtitle}
                  </p>
                )}
              </div>

              {/* Right side actions */}
              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Bell className="w-5 h-5" />
                </button>

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            Admin User
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            admin@luminaris.com
                          </div>
                        </div>
                        <Link
                          href="/admin/settings"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Settings
                        </Link>
                        <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                          <LogOut className="w-4 h-4 mr-2" />
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Mobile page title */}
            <div className="lg:hidden mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {subtitle}
                </p>
              )}
            </div>

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
