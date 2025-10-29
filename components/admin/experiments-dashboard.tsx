"use client";

import React, { useState, useEffect } from "react";
import {
  useExperimentResults,
  useABTestingConfig,
} from "@/lib/ab-testing/use-experiment";
import {
  getExperimentById,
  getExperimentsByGroup,
  EXPERIMENT_GROUPS,
} from "@/lib/experiments/experiments-registry";
import type { ExperimentVariant } from "@/lib/ab-testing/ab-testing-framework";
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
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Zap,
  Eye,
} from "lucide-react";

interface ExperimentsDashboardProps {
  className?: string;
}

export function ExperimentsDashboard({ className }: ExperimentsDashboardProps) {
  const {
    experiments,
    activeExperiments,
    loading: configLoading,
  } = useABTestingConfig();
  const [selectedExperiment, setSelectedExperiment] = useState<string | null>(
    null,
  );

  const selectedExperimentData = selectedExperiment
    ? getExperimentById(selectedExperiment)
    : null;
  const experimentResults = useExperimentResults(selectedExperiment || "");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-green-500";
      case "completed":
        return "bg-blue-500";
      case "paused":
        return "bg-yellow-500";
      case "draft":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.95) return "text-green-600";
    if (confidence >= 0.8) return "text-yellow-600";
    return "text-red-600";
  };

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;
  const formatNumber = (value: number) => value.toLocaleString();

  if (configLoading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            A/B Testing Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Monitor and manage your conversion optimization experiments
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {activeExperiments.length}
            </div>
            <div className="text-sm text-gray-600">Active Experiments</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {experiments.filter((e) => e.status === "completed").length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Visitors
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(
                activeExperiments.reduce(
                  (sum, exp) => sum + (exp.sampleSize || 0),
                  0,
                ),
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all active experiments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Improvement
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+12.3%</div>
            <p className="text-xs text-muted-foreground">
              Across winning variants
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Statistical Power
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">95.2%</div>
            <p className="text-xs text-muted-foreground">
              Average confidence level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Revenue Impact
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+$24.5K</div>
            <p className="text-xs text-muted-foreground">
              Estimated monthly uplift
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Experiments by Category */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="hero">Hero Section</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="social">Social Proof</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="ux">UX</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Experiments</CardTitle>
              <CardDescription>
                Currently running A/B tests across your landing page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeExperiments.map((experiment) => (
                  <div
                    key={experiment.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedExperiment(experiment.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-3 h-3 rounded-full ${getStatusColor(experiment.status)}`}
                      />
                      <div>
                        <h3 className="font-semibold">{experiment.name}</h3>
                        <p className="text-sm text-gray-600">
                          {experiment.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-xs text-gray-500">
                            <Clock className="w-3 h-3 inline mr-1" />
                            Started{" "}
                            {experiment.startDate
                              ? new Date(
                                  experiment.startDate,
                                ).toLocaleDateString()
                              : "N/A"}
                          </span>
                          <span className="text-xs text-gray-500">
                            <Target className="w-3 h-3 inline mr-1" />
                            {experiment.sampleSize || 1000} sample size
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          experiment.status === "running"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {experiment.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {Object.entries(EXPERIMENT_GROUPS).map(([groupKey, experimentIds]) => (
          <TabsContent key={groupKey} value={groupKey} className="space-y-4">
            <div className="grid gap-4">
              {experimentIds.map((experimentId) => {
                const experiment = getExperimentById(experimentId);
                if (!experiment) return null;

                return (
                  <Card key={experimentId}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {experiment.name}
                            <Badge
                              variant={
                                experiment.status === "running"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {experiment.status}
                            </Badge>
                          </CardTitle>
                          <CardDescription>
                            {experiment.description}
                          </CardDescription>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedExperiment(experimentId)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <h4 className="text-sm font-medium mb-2">Variants</h4>
                          <div className="space-y-2">
                            {experiment.variants.map(
                              (variant: ExperimentVariant) => (
                                <div
                                  key={variant.id}
                                  className="flex items-center justify-between text-sm"
                                >
                                  <span>{variant.name}</span>
                                  <span className="text-gray-500">
                                    {variant.weight}%
                                  </span>
                                </div>
                              ),
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-2">Goal</h4>
                          <p className="text-sm text-gray-600">
                            {experiment.goals.primary.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Target: {experiment.minimumDetectableEffect}%
                            improvement
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-2">Progress</h4>
                          <div className="space-y-2">
                            <Progress value={75} className="w-full" />
                            <p className="text-xs text-gray-500">
                              1,234 / {experiment.sampleSize || 1000} visitors
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Detailed Experiment View */}
      {selectedExperiment && selectedExperimentData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {selectedExperimentData.name}
              <Badge
                variant={
                  selectedExperimentData.status === "running"
                    ? "default"
                    : "secondary"
                }
              >
                {selectedExperimentData.status}
              </Badge>
            </CardTitle>
            <CardDescription>
              {selectedExperimentData.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {experimentResults.loading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Results Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {experimentResults.results.length}
                    </div>
                    <div className="text-sm text-gray-600">Variants Tested</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {experimentResults.results
                        .find((r) => r.confidence >= 0.8)
                        ?.metrics?.[
                          Object.keys(
                            experimentResults.results[0]?.metrics || {},
                          )[0]
                        ]?.improvement?.toFixed(1) || "0.0"}
                      %
                    </div>
                    <div className="text-sm text-gray-600">
                      Best Improvement
                    </div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div
                      className={`text-2xl font-bold ${experimentResults.results.some((r) => r.confidence >= 0.95) ? "text-green-600" : "text-yellow-600"}`}
                    >
                      {(
                        (experimentResults.results.reduce(
                          (sum, r) => sum + r.confidence,
                          0,
                        ) /
                          Math.max(experimentResults.results.length, 1)) *
                        100
                      ).toFixed(1)}
                      %
                    </div>
                    <div className="text-sm text-gray-600">Avg Confidence</div>
                  </div>
                </div>

                {/* Variant Results */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Variant Performance</h3>
                  {experimentResults.results.map((result) => {
                    const primaryMetric = Object.values(result.metrics)[0];
                    const isWinner =
                      result.recommendedAction === "declare_winner";

                    return (
                      <div
                        key={result.variantId}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">
                              {selectedExperimentData.variants.find(
                                (v: ExperimentVariant) =>
                                  v.id === result.variantId,
                              )?.name || result.variantId}
                            </h4>
                            {isWinner && (
                              <Badge className="bg-green-500">
                                <Zap className="w-3 h-3 mr-1" />
                                Winner
                              </Badge>
                            )}
                          </div>
                          <div
                            className={`text-sm font-medium ${getConfidenceColor(result.confidence)}`}
                          >
                            {formatPercentage(result.confidence)} confidence
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-sm text-gray-600">
                              Conversion Rate
                            </div>
                            <div className="text-lg font-semibold">
                              {formatPercentage(primaryMetric.value)}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">
                              Improvement
                            </div>
                            <div
                              className={`text-lg font-semibold ${primaryMetric.improvement >= 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              {primaryMetric.improvement >= 0 ? "+" : ""}
                              {primaryMetric.improvement.toFixed(1)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">
                              Sample Size
                            </div>
                            <div className="text-lg font-semibold">
                              {formatNumber(primaryMetric.sampleSize)}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">
                              Significance
                            </div>
                            <div
                              className={`text-lg font-semibold ${primaryMetric.statisticalSignificance ? "text-green-600" : "text-yellow-600"}`}
                            >
                              {primaryMetric.statisticalSignificance
                                ? "Significant"
                                : "Not Significant"}
                            </div>
                          </div>
                        </div>

                        {result.recommendedAction !== "continue" && (
                          <Alert className="mt-4">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              Recommendation:{" "}
                              {result.recommendedAction
                                .replace("_", " ")
                                .toUpperCase()}
                              {result.recommendedAction === "declare_winner" &&
                                " - This variant shows statistically significant improvement!"}
                              {result.recommendedAction === "stop" &&
                                " - This variant is underperforming and should be stopped."}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
