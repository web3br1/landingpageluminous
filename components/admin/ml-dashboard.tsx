"use client";

import React, { useState, useEffect, useCallback } from "react";
import { userClustering, featureUtils } from "@/lib/ml/user-clustering";
import { contentRecommendation } from "@/lib/ml/content-recommendation";
import {
  contentOptimizer,
  optimizationUtils,
} from "@/lib/ml/content-optimization";
import { revenueOptimizer, revenueUtils } from "@/lib/ml/revenue-optimization";
import {
  predictiveAnalytics,
  predictiveUtils,
} from "@/lib/ml/predictive-analytics";

export function MLDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isGenerating, setIsGenerating] = useState(false);

  const tabs = [
    { id: "overview", name: "Visão Geral", icon: "📊" },
    { id: "clustering", name: "Segmentação", icon: "👥" },
    { id: "recommendations", name: "Recomendações", icon: "🎯" },
    { id: "optimization", name: "Otimização", icon: "⚡" },
    { id: "revenue", name: "Receita", icon: "💰" },
    { id: "predictions", name: "Previsões", icon: "🔮" },
  ];

  const generateSampleData = async () => {
    setIsGenerating(true);
    try {
      // Generate sample data for all ML systems
      console.log("Generating sample data for ML systems...");

      // User clustering data
      const users = featureUtils.generateSyntheticUsers(200);
      users.forEach((user) => {
        const cluster = userClustering.fit([user]);
        console.log(`User ${user.id} assigned to cluster ${cluster[0]?.id}`);
      });

      // Content recommendation data
      contentRecommendation.addContentItems([
        {
          id: "hero_main",
          type: "page",
          title: "Hero Section",
          category: "conversion",
          tags: ["hero", "conversion"],
          targetAudience: ["all"],
          performance: {
            views: 1000,
            conversions: 50,
            conversionRate: 5.0,
            avgTimeOnPage: 120,
          },
        },
      ]);

      // Content optimization data
      optimizationUtils.generateSampleData(
        ["hero_main", "pricing_main", "features_main"],
        30,
      );

      // Revenue optimization data
      revenueUtils.generateSamplePricingData(
        ["enterprise", "startup", "individual"],
        6,
      );

      // Predictive analytics data
      predictiveUtils.generateSampleBehaviorData(150, 30);

      console.log("Sample data generation completed!");
      alert(
        "Dados de exemplo gerados com sucesso! Atualize a página para ver os resultados.",
      );
    } catch (error) {
      console.error("Error generating sample data:", error);
      alert("Erro ao gerar dados de exemplo. Verifique o console.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Machine Learning Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Insights e previsões baseadas em IA para otimizar performance
          </p>
        </div>
        <button
          onClick={generateSampleData}
          disabled={isGenerating}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {isGenerating ? "Gerando..." : "Gerar Dados de Exemplo"}
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "clustering" && <ClusteringTab />}
        {activeTab === "recommendations" && <RecommendationsTab />}
        {activeTab === "optimization" && <OptimizationTab />}
        {activeTab === "revenue" && <RevenueTab />}
        {activeTab === "predictions" && <PredictionsTab />}
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab() {
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    const analyticsSummary = predictiveAnalytics.getAnalyticsSummary();
    const clusteringStats = userClustering.getClusterStats();
    const contentStats = contentRecommendation.getContentStats();
    const optimization = contentOptimizer.analyzeContent("hero_main");

    setSummary({
      analytics: analyticsSummary,
      clustering: clusteringStats,
      content: contentStats,
      optimization,
    });
  }, []);

  if (!summary) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Analytics Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Analytics</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total Users:</span>
              <span className="font-medium">
                {summary.analytics.totalUsers}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Conversion Rate:</span>
              <span className="font-medium">
                {(summary.analytics.conversionRate * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Clustering Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Clusters</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total Clusters:</span>
              <span className="font-medium">
                {summary.clustering.totalClusters}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Avg Size:</span>
              <span className="font-medium">
                {summary.clustering.avgClusterSize}
              </span>
            </div>
          </div>
        </div>

        {/* Content Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Content</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total Items:</span>
              <span className="font-medium">{summary.content.totalItems}</span>
            </div>
            <div className="flex justify-between">
              <span>Avg Conv Rate:</span>
              <span className="font-medium">
                {(summary.content.avgConversionRate * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Optimization Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Optimization</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Status:</span>
              <span
                className={`font-medium ${summary.optimization ? "text-green-600" : "text-red-600"}`}
              >
                {summary.optimization ? "Active" : "No Data"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Confidence:</span>
              <span className="font-medium">
                {summary.optimization
                  ? (summary.optimization.confidence * 100).toFixed(1) + "%"
                  : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Clustering Tab Component
function ClusteringTab() {
  const [clusters, setClusters] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const clusterData = userClustering.getClusterStats();
    setStats(clusterData);
    // In a real app, we'd have access to the actual clusters
    setClusters([]);
  }, []);

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Cluster Statistics</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total Clusters:</span>
                <span className="font-medium">{stats.totalClusters}</span>
              </div>
              <div className="flex justify-between">
                <span>Average Size:</span>
                <span className="font-medium">{stats.avgClusterSize}</span>
              </div>
              <div className="flex justify-between">
                <span>Largest Cluster:</span>
                <span className="font-medium">
                  {stats.largestCluster?.size || 0} users
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">
          Como Funciona a Segmentação
        </h3>
        <div className="prose dark:prose-invert max-w-none">
          <p>
            O sistema de clustering usa K-Means para agrupar usuários baseado
            em:
          </p>
          <ul>
            <li>Contagem de visitas</li>
            <li>Tempo gasto no site</li>
            <li>Páginas visualizadas</li>
            <li>Eventos de conversão</li>
            <li>Participação em experimentos</li>
            <li>Tipo de dispositivo</li>
            <li>País de origem</li>
          </ul>
          <p>
            Cada cluster representa um segmento de usuário com comportamentos
            similares, permitindo personalização direcionada e previsões mais
            precisas.
          </p>
        </div>
      </div>
    </div>
  );
}

// Recommendations Tab Component
function RecommendationsTab() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [userId, setUserId] = useState("user_0");

  const getRecommendations = useCallback(() => {
    const recs = contentRecommendation.getRecommendations(userId, 5);
    setRecommendations(recs);
  }, [userId]);

  useEffect(() => {
    getRecommendations();
  }, [getRecommendations]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Sistema de Recomendações</h3>
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="User ID"
            className="px-3 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600"
          />
          <button
            onClick={getRecommendations}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Get Recommendations
          </button>
        </div>

        {recommendations.length > 0 ? (
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <div key={index} className="border rounded p-3">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Content: {rec.contentId}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Reason: {rec.reason}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-green-600">
                      {rec.score.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {(rec.confidence * 100).toFixed(1)}% confidence
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">
            No recommendations available. Try generating sample data first.
          </p>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Como Funciona</h3>
        <div className="prose dark:prose-invert max-w-none">
          <p>
            O sistema de recomendações usa Collaborative Filtering para sugerir
            conteúdo baseado em:
          </p>
          <ul>
            <li>Similaridade entre usuários (Pearson Correlation)</li>
            <li>Histórico de interações com conteúdo</li>
            <li>Padrões de comportamento coletivos</li>
            <li>Feedback implícito (tempo gasto, cliques)</li>
          </ul>
          <p>
            Recomendações são calculadas em tempo real considerando preferências
            similares de outros usuários com comportamentos parecidos.
          </p>
        </div>
      </div>
    </div>
  );
}

// Optimization Tab Component
function OptimizationTab() {
  const [insights, setInsights] = useState<any>(null);
  const [optimizations, setOptimizations] = useState<any[]>([]);

  useEffect(() => {
    const contentInsights = optimizationUtils.getInsights();
    setInsights(contentInsights);

    // Get optimizations for top content
    const topContent = contentInsights.topPerforming?.[0]?.contentId;
    if (topContent) {
      const opt = contentOptimizer.analyzeContent(topContent);
      setOptimizations(opt ? [opt] : []);
    }
  }, []);

  return (
    <div className="space-y-6">
      {insights && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">
              Top Performing Content
            </h3>
            {insights.topPerforming
              ?.slice(0, 3)
              .map((item: any, index: number) => (
                <div key={index} className="mb-2">
                  <div className="font-medium">{item.contentId}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {(item.performance.conversionRate * 100).toFixed(1)}%
                    conversion
                  </div>
                </div>
              ))}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Content Insights</h3>
            {insights.segmentBreakdown &&
              Object.entries(insights.segmentBreakdown)
                .slice(0, 3)
                .map(([segment, data]: [string, any]) => (
                  <div key={segment} className="mb-2">
                    <div className="font-medium capitalize">
                      {segment.replace("_", " ")}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {(data.conversionRate * 100).toFixed(1)}% conversion
                    </div>
                  </div>
                ))}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Device Performance</h3>
            {insights.deviceBreakdown &&
              Object.entries(insights.deviceBreakdown)
                .slice(0, 3)
                .map(([device, data]: [string, any]) => (
                  <div key={device} className="mb-2">
                    <div className="font-medium capitalize">{device}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {(data.conversionRate * 100).toFixed(1)}% conversion
                    </div>
                  </div>
                ))}
          </div>
        </div>
      )}

      {optimizations.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">
            Optimization Recommendations
          </h3>
          {optimizations.map((opt, index) => (
            <div key={index} className="border rounded p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium">{opt.contentId}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Expected improvement: +{opt.expectedImprovement.toFixed(1)}%
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    opt.priority === "high"
                      ? "bg-red-100 text-red-800"
                      : opt.priority === "medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                  }`}
                >
                  {opt.priority} priority
                </span>
              </div>

              <div className="space-y-2">
                {opt.recommendedChanges.map(
                  (change: any, changeIndex: number) => (
                    <div
                      key={changeIndex}
                      className="bg-gray-50 dark:bg-gray-700 p-3 rounded"
                    >
                      <div className="font-medium">
                        {change.type.replace("_", " ")}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {change.recommendedValue}
                      </div>
                      <div className="text-sm text-green-600">
                        +{change.impact}% expected improvement
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Revenue Tab Component
function RevenueTab() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [optimization, setOptimization] = useState<any>(null);

  useEffect(() => {
    const revenueAnalytics = revenueOptimizer.getRevenueAnalytics();
    setAnalytics(revenueAnalytics);

    const revenueOptimization = revenueOptimizer.generateOptimization();
    setOptimization(revenueOptimization);
  }, []);

  return (
    <div className="space-y-6">
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Revenue</h3>
            <div className="text-2xl font-bold text-green-600">
              ${analytics.totalRevenue?.toLocaleString() || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total revenue
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Avg Price</h3>
            <div className="text-2xl font-bold text-blue-600">
              ${analytics.avgPrice?.toFixed(2) || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Average price
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Conversion</h3>
            <div className="text-2xl font-bold text-purple-600">
              {(analytics.avgConversionRate * 100)?.toFixed(1) || 0}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Conversion rate
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Top Segment</h3>
            <div className="text-lg font-bold text-orange-600">
              {analytics.topSegments?.[0]?.segment || "None"}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {analytics.topSegments?.[0]
                ? `${analytics.topSegments[0].share.toFixed(1)}% share`
                : ""}
            </div>
          </div>
        </div>
      )}

      {optimization && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Optimization</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                ${optimization.currentRevenue?.toLocaleString() || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Current Revenue
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ${optimization.optimalRevenue?.toLocaleString() || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Optimal Revenue
              </div>
            </div>

            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                +${optimization.revenueIncrease?.toLocaleString() || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Revenue Increase
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Price Recommendations</h4>
            {optimization.priceRecommendations?.map(
              (rec: any, index: number) => (
                <div key={index} className="border rounded p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium capitalize">
                        {rec.segment}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        ${rec.currentPrice} → ${rec.recommendedPrice}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-green-600">
                        +{rec.expectedRevenueIncrease.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {(rec.confidence * 100).toFixed(1)}% confidence
                      </div>
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Predictions Tab Component
function PredictionsTab() {
  const [predictions, setPredictions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    const businessPredictions = predictiveAnalytics.predictBusinessMetrics(30);
    setPredictions(businessPredictions);

    const analyticsSummary = predictiveAnalytics.getAnalyticsSummary();
    setSummary(analyticsSummary);
  }, []);

  return (
    <div className="space-y-6">
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Users</h3>
            <div className="text-2xl font-bold text-blue-600">
              {summary.totalUsers}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total tracked
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Active Users</h3>
            <div className="text-2xl font-bold text-green-600">
              {summary.activeUsers}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Low churn risk
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Conversion</h3>
            <div className="text-2xl font-bold text-purple-600">
              {(summary.conversionRate * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Average rate
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Churn Risk</h3>
            <div className="text-2xl font-bold text-red-600">
              {(summary.avgChurnRisk * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Average risk
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">
          Business Predictions (30 days)
        </h3>

        {predictions.length > 0 ? (
          <div className="space-y-4">
            {predictions.map((prediction, index) => (
              <div key={index} className="border rounded p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="capitalize font-medium">
                      {prediction.metric}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        prediction.trend === "increasing"
                          ? "bg-green-100 text-green-800"
                          : prediction.trend === "decreasing"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {prediction.trend}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Current
                    </div>
                    <div className="font-medium">
                      {prediction.metric === "revenue" ? "$" : ""}
                      {prediction.currentValue.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Predicted in {prediction.timeframe} days
                    </div>
                    <div className="font-semibold">
                      {prediction.metric === "revenue" ? "$" : ""}
                      {prediction.predictedValue.toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {(prediction.confidence * 100).toFixed(1)}% confidence
                    </div>
                  </div>
                </div>

                <div className="mt-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Factors: {prediction.factors.join(", ")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">
            No predictions available. Try generating sample data first.
          </p>
        )}
      </div>

      {summary?.topRiskFactors && summary.topRiskFactors.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Top Churn Risk Factors</h3>
          <div className="flex flex-wrap gap-2">
            {summary.topRiskFactors.map((factor: string, index: number) => (
              <span
                key={index}
                className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full text-sm"
              >
                {factor.replace("_", " ")}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
