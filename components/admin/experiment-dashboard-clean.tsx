// Real-Time Experiment Dashboard
// Admin interface for monitoring A/B test results and managing rollouts

"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import {
  REAL_TIME_EXPERIMENTS,
  getExperimentAnalytics,
  checkAutoRollout,
  type ExperimentAnalytics,
} from "@/lib/ab-testing/real-time-experiments";
import { useExperimentAnalytics } from "@/lib/hooks/use-real-time-experiment";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Zap,
  AlertTriangle,
} from "lucide-react";

interface ExperimentCardProps {
  experimentId: string;
  analytics: ExperimentAnalytics | null;
  onRefresh: () => void;
}

function ExperimentCard({
  experimentId,
  analytics,
  onRefresh,
}: ExperimentCardProps) {
  const experiment = REAL_TIME_EXPERIMENTS[experimentId];
  if (!experiment) return null;

  const winner = analytics?.winner;
  const winnerStats = winner ? analytics.variantStats[winner] : null;

  const chartData = analytics
    ? Object.entries(analytics.variantStats).map(([variantId, stats]) => ({
        variant: experiment.variants[variantId]?.name || variantId,
        users: stats.users,
        conversions: stats.conversions,
        conversionRate: stats.conversionRate * 100,
        uplift: stats.uplift,
      }))
    : [];

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {experiment.name}
              <Badge
                variant={
                  experiment.status === "running" ? "default" : "secondary"
                }
              >
                {experiment.status}
              </Badge>
            </CardTitle>
            <CardDescription>{experiment.description}</CardDescription>
          </div>
          <Button onClick={onRefresh} size="sm">
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {analytics?.totalUsers || 0}
            </div>
            <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <Users className="w-4 h-4" />
              Total Users
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {winnerStats?.conversionRate
                ? (winnerStats.conversionRate * 100).toFixed(1)
                : 0}
              %
            </div>
            <div className="text-sm text-muted-foreground">
              Best Conversion Rate
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {winnerStats?.uplift ? `${winnerStats.uplift.toFixed(1)}%` : "0%"}
            </div>
            <div className="text-sm text-muted-foreground">
              Uplift vs Control
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {experiment.rollout.percentage}%
            </div>
            <div className="text-sm text-muted-foreground">Rollout</div>
          </div>
        </div>

        {/* Winner Alert */}
        {winner &&
          analytics?.confidence >=
            (experiment.rollout.confidenceThreshold || 95) && (
            <Alert>
              <TrendingUp className="h-4 w-4" />
              <AlertTitle>Winner Detected!</AlertTitle>
              <AlertDescription>
                Variant <strong>{experiment.variants[winner]?.name}</strong> is
                the winner with{" "}
                <strong>{winnerStats?.uplift.toFixed(1)}%</strong> uplift and{" "}
                <strong>{analytics.confidence.toFixed(0)}%</strong> confidence.
              </AlertDescription>
            </Alert>
          )}

        {/* Progress to statistical significance */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress to Statistical Significance</span>
            <span>{analytics?.confidence.toFixed(0) || 0}%</span>
          </div>
          <Progress value={analytics?.confidence || 0} className="w-full" />
        </div>

        {/* Charts */}
        <Tabs defaultValue="conversion" className="w-full">
          <TabsList>
            <TabsTrigger value="conversion">Conversion Rates</TabsTrigger>
            <TabsTrigger value="users">User Distribution</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="conversion" className="h-64">
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
          </TabsContent>

          <TabsContent value="users" className="h-64">
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
          </TabsContent>

          <TabsContent value="timeline" className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.timeSeries || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="#3b82f6" />
              </LineChart>
            </ResponsiveContainer>
          </TabsContent>
        </Tabs>

        {/* Variant Details */}
        <div className="space-y-4">
          <h4 className="font-semibold">Variant Performance</h4>
          <div className="grid gap-4">
            {Object.entries(experiment.variants).map(([variantId, variant]) => {
              const stats = analytics?.variantStats[variantId];
              const isWinner = winner === variantId;

              return (
                <div
                  key={variantId}
                  className={`p-4 rounded-lg border ${isWinner ? "border-green-500 bg-green-50" : "border-gray-200"}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{variant.name}</span>
                      {isWinner && (
                        <Badge className="bg-green-500">Winner</Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Theme: {variant.themeId}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-medium">{stats?.users || 0}</div>
                      <div className="text-muted-foreground">Users</div>
                    </div>
                    <div>
                      <div className="font-medium">
                        {stats?.conversions || 0}
                      </div>
                      <div className="text-muted-foreground">Conversions</div>
                    </div>
                    <div>
                      <div className="font-medium">
                        {stats?.conversionRate
                          ? (stats.conversionRate * 100).toFixed(1)
                          : 0}
                        %
                      </div>
                      <div className="text-muted-foreground">Rate</div>
                    </div>
                    <div>
                      <div
                        className={`font-medium ${stats?.uplift && stats.uplift > 0 ? "text-green-600" : "text-red-600"}`}
                      >
                        {stats?.uplift
                          ? `${stats.uplift > 0 ? "+" : ""}${stats.uplift.toFixed(1)}%`
                          : "0%"}
                      </div>
                      <div className="text-muted-foreground">Uplift</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ExperimentDashboard() {
  const [selectedExperiment, setSelectedExperiment] = useState<string>(
    Object.keys(REAL_TIME_EXPERIMENTS)[0] || "",
  );

  const { analytics, isLoading, refreshAnalytics, checkRollout } =
    useExperimentAnalytics(selectedExperiment);

  const experiments = Object.values(REAL_TIME_EXPERIMENTS);
  const runningExperiments = experiments.filter(
    (exp) => exp.status === "running",
  );
  const completedExperiments = experiments.filter(
    (exp) => exp.status === "completed",
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Experiment Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time A/B testing results and theme optimization
          </p>
        </div>

        <div className="flex gap-2">
          <Button onClick={refreshAnalytics} disabled={isLoading}>
            <Zap className="w-4 h-4 mr-2" />
            Refresh All
          </Button>
          <Button onClick={checkRollout} variant="outline">
            <TrendingUp className="w-4 h-4 mr-2" />
            Check Rollouts
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Target className="w-8 h-8 text-blue-500" />
              <div>
                <div className="text-2xl font-bold">
                  {runningExperiments.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Running Experiments
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="w-8 h-8 text-green-500" />
              <div>
                <div className="text-2xl font-bold">
                  {runningExperiments.reduce((acc, exp) => {
                    const expAnalytics = getExperimentAnalytics(exp.id);
                    return acc + (expAnalytics?.totalUsers || 0);
                  }, 0)}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Test Users
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-purple-500" />
              <div>
                <div className="text-2xl font-bold">
                  {
                    runningExperiments.filter(
                      (exp) => getExperimentAnalytics(exp.id)?.winner,
                    ).length
                  }
                </div>
                <div className="text-sm text-muted-foreground">
                  Winners Found
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-8 h-8 text-orange-500" />
              <div>
                <div className="text-2xl font-bold">
                  {
                    runningExperiments.filter((exp) => {
                      const analytics = getExperimentAnalytics(exp.id);
                      return analytics && analytics.confidence < 80;
                    }).length
                  }
                </div>
                <div className="text-sm text-muted-foreground">
                  Low Confidence
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Experiment Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Experiment</CardTitle>
          <CardDescription>
            Choose an experiment to view detailed analytics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(REAL_TIME_EXPERIMENTS).map(([id, experiment]) => (
              <Button
                key={id}
                variant={selectedExperiment === id ? "default" : "outline"}
                onClick={() => setSelectedExperiment(id)}
                className="flex items-center gap-2"
              >
                <Badge
                  variant={
                    experiment.status === "running" ? "default" : "secondary"
                  }
                >
                  {experiment.status}
                </Badge>
                {experiment.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Experiment Details */}
      {selectedExperiment && (
        <ExperimentCard
          experimentId={selectedExperiment}
          analytics={analytics}
          onRefresh={refreshAnalytics}
        />
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                // Simulate user interactions for demo
                const events = [
                  "cta_click",
                  "scroll_25",
                  "scroll_50",
                  "conversion",
                ];
                events.forEach((event) => {
                  // This would normally come from real user interactions
                  console.log(`Simulating ${event} event`);
                });
                setTimeout(refreshAnalytics, 1000);
              }}
              variant="outline"
            >
              Simulate User Events
            </Button>

            <Button
              onClick={() => {
                Object.keys(REAL_TIME_EXPERIMENTS).forEach((id) => {
                  checkAutoRollout(id);
                });
                refreshAnalytics();
              }}
              variant="outline"
            >
              Run Auto-Rollout Check
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
