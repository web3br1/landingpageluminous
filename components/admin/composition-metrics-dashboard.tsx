"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BarChart3,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Activity,
  Zap,
  RefreshCw,
} from "lucide-react";
import {
  useCompositionMetrics,
  CompositionMetrics,
} from "@/lib/hooks/use-composition-metrics";

interface CompositionMetricsDashboardProps {
  refreshInterval?: number; // em segundos
  className?: string;
}

export function CompositionMetricsDashboard({
  refreshInterval = 30,
  className = "",
}: CompositionMetricsDashboardProps) {
  const { metrics, loading, error, refetch, lastUpdated } =
    useCompositionMetrics({
      refreshInterval,
      enabled: true,
    });

  const loadMetrics = async () => {
    await refetch();
  };

  if (loading && !metrics) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Carregando métricas...</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar métricas: {error}
          <Button
            variant="outline"
            size="sm"
            onClick={loadMetrics}
            className="ml-2"
          >
            Tentar novamente
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (!metrics) return null;

  const successRate =
    (metrics.successfulCompositions / metrics.totalRequests) * 100;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Dashboard de Composição
          </h2>
          <p className="text-muted-foreground">
            Métricas de performance e saúde do sistema de composição de páginas
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {lastUpdated && (
            <span className="text-sm text-muted-foreground">
              Atualizado em {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Requisições
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.totalRequests.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Últimas 24 horas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Taxa de Sucesso
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
            <Progress value={successRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.averageResponseTime.toFixed(1)}ms
            </div>
            <p className="text-xs text-muted-foreground">
              P95: {metrics.p95ResponseTime.toFixed(1)}ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Cache Hit Rate
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.cacheHitRate.toFixed(1)}%
            </div>
            <Progress value={metrics.cacheHitRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="breakdown" className="space-y-4">
        <TabsList>
          <TabsTrigger value="breakdown">Por Tipo de Página</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="errors">Erros Recentes</TabsTrigger>
        </TabsList>

        <TabsContent value="breakdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Desempenho por Tipo de Página</CardTitle>
              <CardDescription>
                Métricas detalhadas para cada tipo de página composta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(metrics.pageTypeBreakdown)
                  .sort(([, a], [, b]) => b.count - a.count)
                  .map(([pageType, stats]) => (
                    <div
                      key={pageType}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium capitalize">
                            {pageType}
                          </span>
                          <Badge
                            variant={
                              stats.successRate > 95 ? "default" : "secondary"
                            }
                          >
                            {stats.count} reqs
                          </Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm text-muted-foreground">
                          <div>
                            <span className="font-medium">
                              {stats.avgTime.toFixed(1)}ms
                            </span>
                            <span className="ml-1">tempo médio</span>
                          </div>
                          <div>
                            <span className="font-medium">
                              {stats.successRate.toFixed(1)}%
                            </span>
                            <span className="ml-1">taxa de sucesso</span>
                          </div>
                          <div>
                            <Activity className="inline h-3 w-3 mr-1" />
                            <span>{stats.count} composições</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendências de Performance</CardTitle>
              <CardDescription>
                Evolução das métricas nas últimas 24 horas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {metrics.performanceTrends[
                        metrics.performanceTrends.length - 1
                      ].avgResponseTime.toFixed(1)}
                      ms
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Tempo Médio Atual
                    </div>
                    <TrendingUp className="h-4 w-4 mx-auto mt-1 text-green-600" />
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {metrics.performanceTrends[
                        metrics.performanceTrends.length - 1
                      ].errorRate.toFixed(1)}
                      %
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Taxa de Erro Atual
                    </div>
                    <Activity className="h-4 w-4 mx-auto mt-1 text-blue-600" />
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {metrics.performanceTrends[
                        metrics.performanceTrends.length - 1
                      ].cacheHitRate.toFixed(1)}
                      %
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Cache Hit Rate
                    </div>
                    <Zap className="h-4 w-4 mx-auto mt-1 text-purple-600" />
                  </div>
                </div>

                {/* Simple trend visualization */}
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-2">
                    Tendência de Tempo de Resposta (24h)
                  </h4>
                  <div className="h-20 flex items-end space-x-1">
                    {metrics.performanceTrends
                      .slice(-12)
                      .map((trend, index) => (
                        <div
                          key={index}
                          className="bg-blue-200 flex-1 rounded-t"
                          style={{
                            height: `${(trend.avgResponseTime / 200) * 100}%`,
                            minHeight: "4px",
                          }}
                          title={`${trend.avgResponseTime.toFixed(1)}ms`}
                        />
                      ))}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>12h atrás</span>
                    <span>Agora</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Erros Recentes</CardTitle>
              <CardDescription>
                Últimos erros de composição registrados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.recentErrors.map((error, index) => (
                  <div
                    key={index}
                    className="flex items-start space-x-4 p-4 border rounded-lg"
                  >
                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-red-900">
                          {error.error}
                        </p>
                        <Badge variant="outline" className="text-red-600">
                          {error.pageType}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(error.timestamp).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Duração: {error.duration.toFixed(1)}ms
                      </p>
                    </div>
                  </div>
                ))}

                {metrics.recentErrors.length === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum erro recente</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
