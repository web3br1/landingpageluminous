"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  MousePointer,
  Clock,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  Target,
  DollarSign,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
} from "lucide-react";

interface AnalyticsData {
  realtime: {
    activeUsers: number;
    pageViews: number;
    events: number;
    bounceRate: number;
  };
  conversion: {
    funnel: {
      visitors: number;
      heroViews: number;
      ctaClicks: number;
      signups: number;
      conversions: number;
    };
    rates: {
      heroViewRate: number;
      ctaClickRate: number;
      signupRate: number;
      conversionRate: number;
    };
  };
  abTesting: {
    experiments: Array<{
      id: string;
      name: string;
      status: "active" | "completed";
      variants: Array<{
        id: string;
        name: string;
        visitors: number;
        conversions: number;
        conversionRate: number;
        confidence: number;
        uplift: number;
      }>;
      winner?: string;
      totalVisitors: number;
      totalConversions: number;
    }>;
  };
  traffic: {
    sources: Array<{
      name: string;
      visitors: number;
      percentage: number;
      trend: "up" | "down" | "stable";
    }>;
    devices: {
      desktop: number;
      mobile: number;
      tablet: number;
    };
    locations: Array<{
      country: string;
      visitors: number;
      percentage: number;
    }>;
  };
  performance: {
    lcp: number;
    cls: number;
    inp: number;
    fcp: number;
    ttfb: number;
    lighthouse: {
      performance: number;
      accessibility: number;
      bestPractices: number;
      seo: number;
      pwa: number;
    };
  };
}

interface AdvancedAnalyticsDashboardProps {
  className?: string;
  refreshInterval?: number; // in milliseconds
}

export function AdvancedAnalyticsDashboard({
  className,
  refreshInterval = 30000,
}: AdvancedAnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Mock data generation (replace with real API calls)
  const generateMockData = (): AnalyticsData => {
    const baseVisitors = Math.floor(Math.random() * 1000) + 500;
    const heroViews = Math.floor(baseVisitors * 0.85);
    const ctaClicks = Math.floor(heroViews * 0.15);
    const signups = Math.floor(ctaClicks * 0.25);
    const conversions = Math.floor(signups * 0.8);

    return {
      realtime: {
        activeUsers: Math.floor(Math.random() * 50) + 10,
        pageViews: Math.floor(Math.random() * 100) + 50,
        events: Math.floor(Math.random() * 200) + 100,
        bounceRate: Math.floor(Math.random() * 30) + 20,
      },
      conversion: {
        funnel: {
          visitors: baseVisitors,
          heroViews,
          ctaClicks,
          signups,
          conversions,
        },
        rates: {
          heroViewRate: (heroViews / baseVisitors) * 100,
          ctaClickRate: (ctaClicks / heroViews) * 100,
          signupRate: (signups / ctaClicks) * 100,
          conversionRate: (conversions / signups) * 100,
        },
      },
      abTesting: {
        experiments: [
          {
            id: "hero_headline_test",
            name: "Hero Headline Test",
            status: "active",
            variants: [
              {
                id: "control",
                name: "Control",
                visitors: 1250,
                conversions: 45,
                conversionRate: 3.6,
                confidence: 85,
                uplift: 0,
              },
              {
                id: "variant_a",
                name: "Benefit Focused",
                visitors: 1180,
                conversions: 52,
                conversionRate: 4.4,
                confidence: 92,
                uplift: 22.2,
              },
              {
                id: "variant_b",
                name: "Social Proof",
                visitors: 1120,
                conversions: 38,
                conversionRate: 3.4,
                confidence: 78,
                uplift: -5.6,
              },
            ],
            totalVisitors: 3550,
            totalConversions: 135,
          },
        ],
      },
      traffic: {
        sources: [
          {
            name: "Organic Search",
            visitors: 1250,
            percentage: 35,
            trend: "up",
          },
          { name: "Direct", visitors: 980, percentage: 27, trend: "stable" },
          { name: "Social Media", visitors: 720, percentage: 20, trend: "up" },
          { name: "Email", visitors: 450, percentage: 12, trend: "down" },
          { name: "Paid Ads", visitors: 320, percentage: 9, trend: "up" },
        ],
        devices: {
          desktop: 45,
          mobile: 42,
          tablet: 13,
        },
        locations: [
          { country: "Brazil", visitors: 1800, percentage: 50 },
          { country: "United States", visitors: 720, percentage: 20 },
          { country: "Portugal", visitors: 360, percentage: 10 },
          { country: "Mexico", visitors: 270, percentage: 8 },
          { country: "Argentina", visitors: 180, percentage: 5 },
        ],
      },
      performance: {
        lcp: 2.1,
        cls: 0.05,
        inp: 85,
        fcp: 1.2,
        ttfb: 120,
        lighthouse: {
          performance: 92,
          accessibility: 98,
          bestPractices: 95,
          seo: 100,
          pwa: 100,
        },
      },
    };
  };

  // Load data
  const loadData = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setData(generateMockData());
      setLastUpdated(new Date());
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    loadData();

    // Set up refresh interval
    const interval = setInterval(loadData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const formatNumber = (num: number) => num.toLocaleString();
  const formatPercentage = (num: number) => `${num.toFixed(1)}%`;

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Advanced Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time insights and conversion optimization
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
          <Button onClick={loadData} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="conversion">Conversion</TabsTrigger>
          <TabsTrigger value="ab-testing">A/B Testing</TabsTrigger>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Real-time Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(data.realtime.activeUsers)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently online
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Page Views
                </CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(data.realtime.pageViews)}
                </div>
                <p className="text-xs text-muted-foreground">Last 5 minutes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Events</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(data.realtime.events)}
                </div>
                <p className="text-xs text-muted-foreground">
                  User interactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Bounce Rate
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.realtime.bounceRate}%
                </div>
                <p className="text-xs text-muted-foreground">
                  Single page visits
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Insights</CardTitle>
              <CardDescription>Key metrics at a glance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-500" />
                  <span className="text-sm">
                    Conversion rate:{" "}
                    <strong>
                      {formatPercentage(data.conversion.rates.conversionRate)}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">
                    Top traffic source:{" "}
                    <strong>{data.traffic.sources[0]?.name}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-purple-500" />
                  <span className="text-sm">
                    Desktop users:{" "}
                    <strong>{data.traffic.devices.desktop}%</strong>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversion" className="space-y-4">
          {/* Conversion Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Conversion Funnel</CardTitle>
              <CardDescription>
                User journey from visit to conversion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {[
                  {
                    label: "Visitors",
                    value: data.conversion.funnel.visitors,
                    rate: 100,
                  },
                  {
                    label: "Hero Views",
                    value: data.conversion.funnel.heroViews,
                    rate: data.conversion.rates.heroViewRate,
                  },
                  {
                    label: "CTA Clicks",
                    value: data.conversion.funnel.ctaClicks,
                    rate: data.conversion.rates.ctaClickRate,
                  },
                  {
                    label: "Signups",
                    value: data.conversion.funnel.signups,
                    rate: data.conversion.rates.signupRate,
                  },
                  {
                    label: "Conversions",
                    value: data.conversion.funnel.conversions,
                    rate: data.conversion.rates.conversionRate,
                  },
                ].map((step, index) => (
                  <div key={step.label} className="flex items-center gap-4">
                    <div className="w-24 text-sm font-medium">{step.label}</div>
                    <div className="flex-1">
                      <Progress value={step.rate} className="h-8" />
                    </div>
                    <div className="w-20 text-right text-sm font-mono">
                      {formatNumber(step.value)}
                    </div>
                    <div className="w-16 text-right text-sm text-muted-foreground">
                      {formatPercentage(step.rate)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Conversion Rates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Micro Conversions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Hero View Rate</span>
                  <span className="font-semibold">
                    {formatPercentage(data.conversion.rates.heroViewRate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>CTA Click Rate</span>
                  <span className="font-semibold">
                    {formatPercentage(data.conversion.rates.ctaClickRate)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Macro Conversions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Signup Rate</span>
                  <span className="font-semibold">
                    {formatPercentage(data.conversion.rates.signupRate)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Conversion Rate</span>
                  <span className="font-semibold">
                    {formatPercentage(data.conversion.rates.conversionRate)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ab-testing" className="space-y-4">
          {data.abTesting.experiments.map((experiment) => (
            <Card key={experiment.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{experiment.name}</CardTitle>
                    <CardDescription>{experiment.id}</CardDescription>
                  </div>
                  <Badge
                    variant={
                      experiment.status === "active" ? "default" : "secondary"
                    }
                  >
                    {experiment.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {experiment.variants.map((variant) => (
                    <div key={variant.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{variant.name}</h4>
                        {experiment.winner === variant.id && (
                          <Badge variant="default">Winner</Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Visitors</div>
                          <div className="font-semibold">
                            {formatNumber(variant.visitors)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">
                            Conversions
                          </div>
                          <div className="font-semibold">
                            {variant.conversions}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Rate</div>
                          <div className="font-semibold">
                            {formatPercentage(variant.conversionRate)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Uplift</div>
                          <div
                            className={`font-semibold ${variant.uplift > 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {variant.uplift > 0 ? "+" : ""}
                            {formatPercentage(variant.uplift)}
                          </div>
                        </div>
                      </div>
                      <Progress value={variant.confidence} className="mt-2" />
                      <div className="text-xs text-muted-foreground mt-1">
                        Confidence: {variant.confidence}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="traffic" className="space-y-4">
          {/* Traffic Sources */}
          <Card>
            <CardHeader>
              <CardTitle>Traffic Sources</CardTitle>
              <CardDescription>Where your visitors come from</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.traffic.sources.map((source) => (
                  <div
                    key={source.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          source.trend === "up"
                            ? "bg-green-500"
                            : source.trend === "down"
                              ? "bg-red-500"
                              : "bg-gray-500"
                        }`}
                      />
                      <span>{source.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatNumber(source.visitors)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatPercentage(source.percentage)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Devices */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Device Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-blue-500" />
                  <span>Desktop</span>
                  <div className="flex-1">
                    <Progress value={data.traffic.devices.desktop} />
                  </div>
                  <span className="text-sm font-semibold">
                    {data.traffic.devices.desktop}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-green-500" />
                  <span>Mobile</span>
                  <div className="flex-1">
                    <Progress value={data.traffic.devices.mobile} />
                  </div>
                  <span className="text-sm font-semibold">
                    {data.traffic.devices.mobile}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Tablet className="w-4 h-4 text-purple-500" />
                  <span>Tablet</span>
                  <div className="flex-1">
                    <Progress value={data.traffic.devices.tablet} />
                  </div>
                  <span className="text-sm font-semibold">
                    {data.traffic.devices.tablet}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.traffic.locations.slice(0, 5).map((location) => (
                    <div
                      key={location.country}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <span>{location.country}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatNumber(location.visitors)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatPercentage(location.percentage)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {/* Core Web Vitals */}
          <Card>
            <CardHeader>
              <CardTitle>Core Web Vitals</CardTitle>
              <CardDescription>
                Google's user experience metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {data.performance.lcp}s
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Largest Contentful Paint
                  </div>
                  <Badge
                    variant={
                      data.performance.lcp < 2.5 ? "default" : "destructive"
                    }
                    className="mt-2"
                  >
                    {data.performance.lcp < 2.5 ? "Good" : "Needs Improvement"}
                  </Badge>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {data.performance.cls}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Cumulative Layout Shift
                  </div>
                  <Badge
                    variant={
                      data.performance.cls < 0.1 ? "default" : "destructive"
                    }
                    className="mt-2"
                  >
                    {data.performance.cls < 0.1 ? "Good" : "Needs Improvement"}
                  </Badge>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {data.performance.inp}ms
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Interaction to Next Paint
                  </div>
                  <Badge
                    variant={
                      data.performance.inp < 200 ? "default" : "destructive"
                    }
                    className="mt-2"
                  >
                    {data.performance.inp < 200 ? "Good" : "Needs Improvement"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lighthouse Scores */}
          <Card>
            <CardHeader>
              <CardTitle>Lighthouse Performance</CardTitle>
              <CardDescription>
                Automated performance audit scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  {
                    name: "Performance",
                    score: data.performance.lighthouse.performance,
                    color: "text-green-600",
                  },
                  {
                    name: "Accessibility",
                    score: data.performance.lighthouse.accessibility,
                    color: "text-blue-600",
                  },
                  {
                    name: "Best Practices",
                    score: data.performance.lighthouse.bestPractices,
                    color: "text-yellow-600",
                  },
                  {
                    name: "SEO",
                    score: data.performance.lighthouse.seo,
                    color: "text-purple-600",
                  },
                  {
                    name: "PWA",
                    score: data.performance.lighthouse.pwa,
                    color: "text-indigo-600",
                  },
                ].map((metric) => (
                  <div key={metric.name} className="text-center">
                    <div className={`text-3xl font-bold ${metric.color}`}>
                      {metric.score}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {metric.name}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
