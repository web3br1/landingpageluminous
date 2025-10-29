"use client";

import React, { useEffect, useState } from "react";
import { compositionMetrics, CompositionMetrics } from "./composition-metrics";
import { compositionAlerts, Alert, AlertSeverity } from "./composition-alerts";

// ===== DASHBOARD COMPONENT =====

export function CompositionObservabilityDashboard() {
  const [metrics, setMetrics] = useState<Record<string, any>>({});
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const updateData = () => {
      // Get current metrics
      const currentMetrics =
        (compositionMetrics as any).getCurrentMetrics?.() || {};

      // Get active alerts
      const activeAlerts = compositionAlerts.getActiveAlerts();

      setMetrics(currentMetrics);
      setAlerts(activeAlerts);
      setIsLoading(false);
    };

    // Update immediately
    updateData();

    // Update every 5 seconds
    const interval = setInterval(updateData, 5000);

    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm border">
      <h2 className="text-2xl font-bold mb-6 text-gray-900">
        Sistema de Composição - Observabilidade
      </h2>

      {/* Alerts Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Alertas Ativos
        </h3>
        {alerts.length === 0 ? (
          <div className="text-green-600 bg-green-50 p-4 rounded-lg">
            ✅ Nenhum alerta ativo - sistema funcionando normalmente
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        )}
      </div>

      {/* Performance Metrics */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Métricas de Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Composições Totais"
            value={metrics.pageCompositionStarted || 0}
            icon="📄"
            color="blue"
          />
          <MetricCard
            title="Composições Concluídas"
            value={metrics.pageCompositionCompleted || 0}
            icon="✅"
            color="green"
          />
          <MetricCard
            title="Erros de Composição"
            value={metrics.pageCompositionErrors || 0}
            icon="❌"
            color="red"
          />
          <MetricCard
            title="Seções Processadas"
            value={metrics.sectionProcessingStarted || 0}
            icon="🔧"
            color="purple"
          />
        </div>
      </div>

      {/* System Health */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Saúde do Sistema
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <HealthCard
            title="Disponibilidade"
            status={metrics.serviceAvailability ? "healthy" : "degraded"}
            value={`${metrics.serviceAvailability || 0}%`}
          />
          <HealthCard
            title="Taxa de Sucesso"
            status={getSuccessRate(metrics) >= 95 ? "healthy" : "degraded"}
            value={`${getSuccessRate(metrics)}%`}
          />
          <HealthCard
            title="Latência Média"
            status={getAverageLatency(metrics) <= 2000 ? "healthy" : "degraded"}
            value={`${getAverageLatency(metrics)}ms`}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Atividade Recente
        </h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-sm text-gray-600">
            Última atualização: {new Date().toLocaleTimeString()}
          </div>
          <div className="mt-2 text-xs text-gray-500">
            Dashboard atualizado automaticamente a cada 5 segundos
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== SUB-COMPONENTS =====

function AlertCard({ alert }: { alert: Alert }) {
  const severityColors = {
    [AlertSeverity.LOW]: "bg-yellow-50 border-yellow-200 text-yellow-800",
    [AlertSeverity.MEDIUM]: "bg-orange-50 border-orange-200 text-orange-800",
    [AlertSeverity.HIGH]: "bg-red-50 border-red-200 text-red-800",
    [AlertSeverity.CRITICAL]: "bg-red-100 border-red-300 text-red-900",
  };

  return (
    <div className={`p-4 rounded-lg border ${severityColors[alert.severity]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-semibold">{alert.title}</span>
            <span className="text-xs uppercase px-2 py-1 rounded bg-white bg-opacity-50">
              {alert.severity}
            </span>
          </div>
          <p className="text-sm mb-2">{alert.description}</p>
          <div className="text-xs opacity-75">
            <div>ID: {alert.id}</div>
            <div>Tipo: {alert.type}</div>
            <div>Início: {new Date(alert.timestamp).toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: string;
  color: "blue" | "green" | "red" | "purple";
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
    red: "bg-red-50 text-red-700 border-red-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
  };

  return (
    <div className={`p-4 rounded-lg border ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-2xl font-bold">{value.toLocaleString()}</div>
          <div className="text-sm opacity-75">{title}</div>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
}

function HealthCard({
  title,
  status,
  value,
}: {
  title: string;
  status: "healthy" | "degraded" | "unhealthy";
  value: string;
}) {
  const statusColors = {
    healthy: "bg-green-50 text-green-700 border-green-200",
    degraded: "bg-yellow-50 text-yellow-700 border-yellow-200",
    unhealthy: "bg-red-50 text-red-700 border-red-200",
  };

  const statusIcons = {
    healthy: "🟢",
    degraded: "🟡",
    unhealthy: "🔴",
  };

  return (
    <div className={`p-4 rounded-lg border ${statusColors[status]}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-lg">{statusIcons[status]}</div>
      </div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}

// ===== UTILITY FUNCTIONS =====

function getSuccessRate(metrics: Record<string, any>): number {
  const total = metrics.pageCompositionStarted || 0;
  const successful = metrics.pageCompositionCompleted || 0;

  if (total === 0) return 100;
  return Math.round((successful / total) * 100);
}

function getAverageLatency(metrics: Record<string, any>): number {
  // This would need to be calculated from histogram data
  // For now, return a placeholder
  return 1200; // ms
}

// ===== DASHBOARD EXPORT =====

export default CompositionObservabilityDashboard;
