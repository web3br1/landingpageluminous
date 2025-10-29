// Lazy-loaded charts components for experiment dashboard
// Separated to improve initial load performance

"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { type ExperimentAnalytics } from "@/lib/ab-testing/real-time-experiments";

interface ChartsSectionProps {
  analytics: ExperimentAnalytics | null;
}

export function ChartsSection({ analytics }: ChartsSectionProps) {
  if (!analytics) return null;

  const chartData = Object.entries(analytics.variantStats).map(
    ([variantId, stats]) => ({
      variant:
        REAL_TIME_EXPERIMENTS[analytics.experimentId]?.variants[variantId]
          ?.name || variantId,
      users: stats.users,
      conversions: stats.conversions,
      conversionRate: stats.conversionRate * 100,
      uplift: stats.uplift,
    }),
  );

  return (
    <div className="space-y-6">
      {/* Conversion Rates Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="variant" />
            <YAxis />
            <Tooltip
              formatter={(value: number) => [
                `${value.toFixed(1)}%`,
                "Conversion Rate",
              ]}
            />
            <Bar dataKey="conversionRate" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* User Distribution Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="users"
              nameKey="variant"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ variant, users }) => `${variant}: ${users}`}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`hsl(${index * 60}, 70%, 50%)`}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Timeline Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={analytics.timeSeries || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="users" stroke="#3b82f6" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Import here to avoid circular dependencies
import { REAL_TIME_EXPERIMENTS } from "@/lib/ab-testing/real-time-experiments";
