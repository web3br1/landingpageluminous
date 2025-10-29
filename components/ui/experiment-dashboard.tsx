"use client";

import React from "react";
import {
  useExperimentResults,
  useABTestingConfig,
} from "@/lib/ab-testing/use-experiment";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Users, Target, Clock } from "lucide-react";

interface ExperimentDashboardProps {
  experimentId?: string;
  showAllExperiments?: boolean;
}

export function ExperimentDashboard({
  experimentId,
  showAllExperiments = false,
}: ExperimentDashboardProps) {
  const {
    experiments,
    activeExperiments,
    loading: configLoading,
  } = useABTestingConfig();

  if (configLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (showAllExperiments) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">A/B Testing Dashboard</h2>
          <div className="flex gap-2">
            <Badge variant="secondary">
              <Users className="w-4 h-4 mr-1" />
              {activeExperiments.length} Active
            </Badge>
            <Badge variant="outline">
              <Target className="w-4 h-4 mr-1" />
              {experiments.length} Total
            </Badge>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {experiments.map((experiment) => (
            <ExperimentCard key={experiment.id} experimentId={experiment.id} />
          ))}
        </div>
      </div>
    );
  }

  if (!experimentId) {
    return <div>Select an experiment to view results</div>;
  }

  return <ExperimentDetail experimentId={experimentId} />;
}

function ExperimentCard({ experimentId }: { experimentId: string }) {
  const { experiment, loading, results, winner } =
    useExperimentResults(experimentId);

  if (loading || !experiment) {
    return (
      <Card>
        <CardHeader>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardHeader>
      </Card>
    );
  }
  const totalVisitors = results.reduce(
    (sum, r) => sum + (r.metrics[Object.keys(r.metrics)[0]]?.sampleSize || 0),
    0,
  );
  const daysRunning = experiment?.startDate
    ? Math.floor(
        (Date.now() - new Date(experiment.startDate).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{experiment.name}</CardTitle>
          <Badge
            variant={experiment.status === "running" ? "default" : "secondary"}
          >
            {experiment.status}
          </Badge>
        </div>
        <CardDescription>{experiment.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              {totalVisitors} visitors
            </span>
            <span className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              {daysRunning} days
            </span>
          </div>

          {results.length > 0 && (
            <div className="space-y-2">
              {results.map((result: any) => {
                const metric = Object.values(result.metrics)[0] as any;
                const isWinner = result.recommendedAction === "declare_winner";

                return (
                  <div
                    key={result.variantId}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm font-medium">
                      Variant {result.variantId}
                      {isWinner && (
                        <Badge variant="default" className="ml-2">
                          Winner
                        </Badge>
                      )}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-sm ${(metric as any).improvement > 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {(metric as any).improvement > 0 ? "+" : ""}
                        {(metric as any).improvement.toFixed(1)}%
                      </span>
                      {(metric as any).improvement > 0 ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {winner && (
            <div className="pt-2 border-t">
              <Badge variant="default" className="w-full justify-center">
                🎉 Winner: Variant {winner.variantId}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ExperimentDetail({ experimentId }: { experimentId: string }) {
  const { results, experiment, loading } = useExperimentResults(experimentId);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!experiment) {
    return (
      <div className="text-center p-8">
        <h3 className="text-lg font-semibold mb-2">Experiment not found</h3>
        <p className="text-gray-600">
          The requested experiment could not be loaded.
        </p>
      </div>
    );
  }

  const totalVisitors = results.reduce(
    (sum, r) => sum + (r.metrics[Object.keys(r.metrics)[0]]?.sampleSize || 0),
    0,
  );
  const daysRunning = experiment?.startDate
    ? Math.floor(
        (Date.now() - new Date(experiment.startDate).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{experiment.name}</h1>
          <p className="text-gray-600 mt-2">{experiment.description}</p>
        </div>
        <Badge
          variant={experiment.status === "running" ? "default" : "secondary"}
          className="text-lg px-3 py-1"
        >
          {experiment.status}
        </Badge>
      </div>

      {/* Experiment Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Visitors
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalVisitors.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Days Running</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{daysRunning}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goal</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {experiment.goals.primary.name}
            </div>
            <div className="text-xs text-muted-foreground">
              {experiment.goals.primary.type}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Variant Results */}
      <Card>
        <CardHeader>
          <CardTitle>Variant Performance</CardTitle>
          <CardDescription>
            Statistical analysis of experiment variants against the control
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {results.map((result) => {
              const metric = Object.values(result.metrics)[0];
              const variant = experiment.variants.find(
                (v) => v.id === result.variantId,
              );

              return (
                <div key={result.variantId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">
                        {variant?.name || `Variant ${result.variantId}`}
                        {variant?.isControl && (
                          <Badge variant="outline" className="ml-2">
                            Control
                          </Badge>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {variant?.config.headline || "Default"}
                      </p>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-2xl font-bold ${metric.improvement >= 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {metric.improvement >= 0 ? "+" : ""}
                        {metric.improvement.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">improvement</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <div className="text-sm font-medium">Visitors</div>
                      <div className="text-lg">{metric.sampleSize}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Conversions</div>
                      <div className="text-lg">{metric.conversion}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Conversion Rate</div>
                      <div className="text-lg">
                        {(metric.value * 100).toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Confidence</div>
                      <div className="text-lg">
                        {(metric.confidence * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">Statistical Significance:</span>
                      <Badge
                        variant={
                          metric.statisticalSignificance
                            ? "default"
                            : "secondary"
                        }
                      >
                        {metric.statisticalSignificance
                          ? "Significant"
                          : "Not Significant"}
                      </Badge>
                    </div>

                    <Badge
                      variant={
                        result.recommendedAction === "declare_winner"
                          ? "default"
                          : result.recommendedAction === "stop"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {result.recommendedAction === "declare_winner"
                        ? "🎉 Winner"
                        : result.recommendedAction === "stop"
                          ? "Stop Test"
                          : "Continue"}
                    </Badge>
                  </div>

                  {result.recommendedAction === "declare_winner" && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-800">
                        This variant shows statistically significant improvement
                        and should be implemented.
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Experiment Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Experiment Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">Variants</h4>
              <div className="space-y-2">
                {experiment.variants.map((variant) => (
                  <div
                    key={variant.id}
                    className="flex items-center justify-between"
                  >
                    <span>{variant.name}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        {variant.weight}%
                      </span>
                      {variant.isControl && (
                        <Badge variant="outline">Control</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Goals</h4>
              <div className="space-y-2">
                <div>
                  <div className="font-medium">
                    {experiment.goals.primary.name}
                  </div>
                  <div className="text-sm text-gray-600">
                    {experiment.goals.primary.type} •{" "}
                    {experiment.goals.primary.direction}
                  </div>
                </div>
                {experiment.goals.secondary?.map((goal) => (
                  <div key={goal.id}>
                    <div className="font-medium">{goal.name}</div>
                    <div className="text-sm text-gray-600">
                      {goal.type} • {goal.direction}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Mini dashboard for embedding in other components
export function ExperimentMiniDashboard({
  experimentId,
}: {
  experimentId: string;
}) {
  const { results, experiment, loading } = useExperimentResults(experimentId);

  if (loading || !experiment) {
    return (
      <div className="flex items-center space-x-2 p-4 border rounded-lg">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        <span className="text-sm">Loading experiment data...</span>
      </div>
    );
  }

  const winner = results.find((r) => r.recommendedAction === "declare_winner");
  const bestVariant = results.reduce((best, current) => {
    const bestImprovement =
      best.metrics[Object.keys(best.metrics)[0]]?.improvement || 0;
    const currentImprovement =
      current.metrics[Object.keys(current.metrics)[0]]?.improvement || 0;
    return currentImprovement > bestImprovement ? current : best;
  }, results[0]);

  const totalVisitors = results.reduce(
    (sum, r) => sum + (r.metrics[Object.keys(r.metrics)[0]]?.sampleSize || 0),
    0,
  );
  const daysRunning = experiment?.startDate
    ? Math.floor(
        (Date.now() - new Date(experiment.startDate).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;

  return (
    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">{experiment.name}</h3>
        <Badge
          variant={experiment.status === "running" ? "default" : "secondary"}
        >
          {experiment.status}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold">{totalVisitors}</div>
          <div className="text-xs text-gray-600">Visitors</div>
        </div>
        <div>
          <div className="text-2xl font-bold">
            {bestVariant
              ? `${Object.values(bestVariant.metrics)[0].improvement.toFixed(1)}%`
              : "0%"}
          </div>
          <div className="text-xs text-gray-600">Best Lift</div>
        </div>
        <div>
          <div className="text-2xl font-bold">{daysRunning}</div>
          <div className="text-xs text-gray-600">Days</div>
        </div>
      </div>

      {winner && (
        <div className="mt-3 p-2 bg-green-100 border border-green-300 rounded text-center">
          <div className="text-sm font-medium text-green-800">
            Winner Found!
          </div>
          <div className="text-xs text-green-700">
            Variant {winner.variantId}
          </div>
        </div>
      )}
    </div>
  );
}
