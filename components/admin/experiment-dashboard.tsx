"use client";

import React, { useState, useEffect } from "react";
import {
  experimentEngine,
  type Experiment,
  type ExperimentResults,
} from "@/lib/ab-testing/experiment-engine";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Play,
  Pause,
  TrendingUp,
  Users,
  Target,
} from "lucide-react";

interface ExperimentDashboardProps {
  className?: string;
}

export function ExperimentDashboard({ className }: ExperimentDashboardProps) {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedExperiment, setSelectedExperiment] =
    useState<Experiment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadExperiments();
  }, []);

  const loadExperiments = () => {
    setIsLoading(true);
    try {
      const exps = experimentEngine.getAllExperiments();
      setExperiments(exps);
      if (exps.length > 0 && !selectedExperiment) {
        setSelectedExperiment(exps[0]);
      }
    } catch (error) {
      console.error("Failed to load experiments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = (
    experimentId: string,
    newStatus: Experiment["status"],
  ) => {
    experimentEngine.updateExperiment(experimentId, { status: newStatus });
    loadExperiments();
  };

  const handleEndExperiment = (experimentId: string) => {
    if (
      window.confirm(
        "Are you sure you want to end this experiment? This action cannot be undone.",
      )
    ) {
      experimentEngine.endExperiment(experimentId);
      loadExperiments();
    }
  };

  const getStatusBadge = (status: Experiment["status"]) => {
    const statusConfig = {
      draft: { variant: "secondary" as const, icon: Clock, text: "Draft" },
      active: { variant: "default" as const, icon: Play, text: "Active" },
      paused: { variant: "outline" as const, icon: Pause, text: "Paused" },
      completed: {
        variant: "secondary" as const,
        icon: CheckCircle,
        text: "Completed",
      },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  const getExperimentStats = (experiment: Experiment) => {
    const results = experiment.results;
    if (!results) return null;

    const progress = experiment.minSampleSize
      ? Math.min((results.visitors / experiment.minSampleSize) * 100, 100)
      : 0;

    return {
      visitors: results.visitors,
      conversions: results.conversions,
      conversionRate: results.conversionRate.toFixed(2),
      progress,
      isSignificant: results.statisticalSignificance,
      uplift: results.uplift.toFixed(1),
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">A/B Testing Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and monitor your experiments to optimize user experience
          </p>
        </div>
        <Button onClick={loadExperiments} variant="outline">
          Refresh Data
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Summary Cards */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Experiments
            </CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {experiments.filter((e) => e.status === "active").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Visitors
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {experiments
                .reduce((sum, exp) => sum + (exp.results?.visitors || 0), 0)
                .toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {experiments.filter((e) => e.status === "completed").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Conversion
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {experiments.length > 0
                ? (
                    experiments.reduce(
                      (sum, exp) => sum + (exp.results?.conversionRate || 0),
                      0,
                    ) / experiments.length
                  ).toFixed(1)
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="experiments">All Experiments</TabsTrigger>
          <TabsTrigger value="results">Results</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {experiments.slice(0, 4).map((experiment) => {
              const stats = getExperimentStats(experiment);
              return (
                <Card key={experiment.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {experiment.name}
                      </CardTitle>
                      {getStatusBadge(experiment.status)}
                    </div>
                    <CardDescription>{experiment.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {stats && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span>
                            Visitors: {stats.visitors.toLocaleString()}
                          </span>
                          <span>Conversions: {stats.conversions}</span>
                        </div>
                        <Progress value={stats.progress} className="w-full" />
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">
                            {stats.conversionRate}% conversion
                          </span>
                          {stats.isSignificant && (
                            <Badge variant="secondary" className="text-xs">
                              Statistically Significant
                            </Badge>
                          )}
                        </div>
                      </>
                    )}

                    <div className="flex gap-2">
                      {experiment.status === "draft" && (
                        <Button
                          size="sm"
                          onClick={() =>
                            handleStatusChange(experiment.id, "active")
                          }
                        >
                          Start
                        </Button>
                      )}
                      {experiment.status === "active" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleStatusChange(experiment.id, "paused")
                            }
                          >
                            Pause
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleEndExperiment(experiment.id)}
                          >
                            End
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="experiments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Experiments</CardTitle>
              <CardDescription>
                Detailed view of all experiments and their configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {experiments.map((experiment) => {
                  const stats = getExperimentStats(experiment);
                  return (
                    <div key={experiment.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold">{experiment.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {experiment.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            {getStatusBadge(experiment.status)}
                            <span className="text-sm text-muted-foreground">
                              {experiment.trafficAllocation}% traffic
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">
                            Variants
                          </div>
                          <div className="font-semibold">
                            {experiment.variants.length}
                          </div>
                        </div>
                      </div>

                      {stats && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <div className="text-sm text-muted-foreground">
                              Visitors
                            </div>
                            <div className="font-semibold">
                              {stats.visitors.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">
                              Conversions
                            </div>
                            <div className="font-semibold">
                              {stats.conversions}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">
                              Conversion Rate
                            </div>
                            <div className="font-semibold">
                              {stats.conversionRate}%
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">
                              Progress
                            </div>
                            <div className="font-semibold">
                              {stats.progress.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        {experiment.status === "draft" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              handleStatusChange(experiment.id, "active")
                            }
                          >
                            Start Experiment
                          </Button>
                        )}
                        {experiment.status === "active" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                handleStatusChange(experiment.id, "paused")
                              }
                            >
                              Pause
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleEndExperiment(experiment.id)}
                            >
                              End Experiment
                            </Button>
                          </>
                        )}
                        {experiment.status === "paused" && (
                          <Button
                            size="sm"
                            onClick={() =>
                              handleStatusChange(experiment.id, "active")
                            }
                          >
                            Resume
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Experiment Results</CardTitle>
              <CardDescription>
                Statistical analysis and recommendations for completed
                experiments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {experiments
                  .filter((exp) => exp.results)
                  .map((experiment) => {
                    const stats = getExperimentStats(experiment);
                    return (
                      <div
                        key={experiment.id}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold">{experiment.name}</h3>
                          <div className="flex items-center gap-2">
                            {stats?.isSignificant && (
                              <Badge variant="secondary">Significant</Badge>
                            )}
                            {experiment.winner && (
                              <Badge variant="default">
                                Winner: {experiment.winner}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {stats && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-muted rounded-lg">
                              <div className="text-2xl font-bold">
                                {stats.visitors.toLocaleString()}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Total Visitors
                              </div>
                            </div>
                            <div className="text-center p-4 bg-muted rounded-lg">
                              <div className="text-2xl font-bold">
                                {stats.conversions}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Conversions
                              </div>
                            </div>
                            <div className="text-center p-4 bg-muted rounded-lg">
                              <div className="text-2xl font-bold">
                                {stats.conversionRate}%
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Conversion Rate
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-blue-900 dark:text-blue-100">
                                Recommendation
                              </h4>
                              <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                                {experiment.winner
                                  ? `Implement variant "${experiment.winner}" as the new default.`
                                  : stats?.isSignificant
                                    ? "Results are statistically significant. Consider implementing the winning variant."
                                    : "Continue running the experiment to reach statistical significance."}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                {experiments.filter((exp) => exp.results).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No experiment results available yet. Run some experiments to
                    see results here.
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
