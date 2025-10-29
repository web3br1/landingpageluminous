"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

interface BundleData {
  analysis: {
    chunks: Record<string, { size: number; chunks: number; assets: string[] }>;
    total: { size: number; chunks: number; compressedSize: number };
    performance: { lcp: number; fid: number; cls: number; ttfb: number };
  };
  comparisons: Record<
    string,
    {
      sizeDiff: number;
      sizePercent: number;
      status: string;
    }
  >;
}

export default function BundleDashboard() {
  const [bundleData, setBundleData] = useState<BundleData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento de dados (em produção, faria fetch da API)
    const loadData = async () => {
      try {
        // Mock data - em produção, isso viria de uma API
        const mockData: BundleData = {
          analysis: {
            chunks: {
              marketing: {
                size: 285000,
                chunks: 13,
                assets: ["marketing.js", "marketing.css"],
              },
              product: {
                size: 340000,
                chunks: 7,
                assets: ["product.js", "pricing.js"],
              },
              admin: {
                size: 620000,
                chunks: 14,
                assets: ["admin.js", "dashboard.js"],
              },
              framework: { size: 175000, chunks: 5, assets: ["framework.js"] },
            },
            total: { size: 1150000, chunks: 42, compressedSize: 850000 },
            performance: { lcp: 2.1, fid: 45, cls: 0.05, ttfb: 180 },
          },
          comparisons: {
            marketing: {
              sizeDiff: 5000,
              sizePercent: 1.8,
              status: "Increased",
            },
            product: {
              sizeDiff: -10000,
              sizePercent: -2.9,
              status: "Decreased",
            },
            admin: { sizeDiff: -30000, sizePercent: -4.6, status: "Decreased" },
            framework: {
              sizeDiff: -5000,
              sizePercent: -2.8,
              status: "Decreased",
            },
          },
        };

        setBundleData(mockData);
      } catch (error) {
        console.error("Failed to load bundle data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const formatBytes = (bytes: number) => {
    const sizes = ["Bytes", "KB", "MB", "GB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusColor = (percent: number) => {
    if (percent > 5) return "destructive";
    if (percent > 0) return "secondary";
    return "default";
  };

  const getStatusIcon = (percent: number) => {
    if (percent > 5) return <AlertTriangle className="w-4 h-4" />;
    if (percent > 0) return <TrendingUp className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!bundleData) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              Bundle Data Unavailable
            </h2>
            <p className="text-gray-600 mb-4">
              Unable to load bundle analysis data.
            </p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { analysis, comparisons } = bundleData;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          📊 Bundle Analysis Dashboard
        </h1>
        <p className="text-xl text-muted-foreground">
          Monitor bundle sizes, performance metrics, and optimization progress
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Bundle Size
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBytes(analysis.total.size)}
            </div>
            <p className="text-xs text-muted-foreground">
              {analysis.total.chunks} chunks total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Compressed Size
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBytes(analysis.total.compressedSize)}
            </div>
            <p className="text-xs text-muted-foreground">
              {(
                (analysis.total.compressedSize / analysis.total.size) *
                100
              ).toFixed(1)}
              % compression
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LCP Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analysis.performance.lcp}s
            </div>
            <p className="text-xs text-muted-foreground">Target: &lt; 2.5s</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bundle Health</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Healthy</div>
            <p className="text-xs text-muted-foreground">All budgets met</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <Tabs defaultValue="chunks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chunks">Bundle Chunks</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="chunks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bundle Chunk Analysis</CardTitle>
              <CardDescription>
                Detailed breakdown of bundle sizes by feature area
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analysis.chunks).map(([chunk, data]) => {
                  const comparison = comparisons[chunk];
                  const budget =
                    chunk === "marketing"
                      ? 350000
                      : chunk === "product"
                        ? 400000
                        : chunk === "admin"
                          ? 800000
                          : 200000;
                  const usagePercent = (data.size / budget) * 100;

                  return (
                    <div key={chunk} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium capitalize">
                            {chunk}
                          </span>
                          {comparison && (
                            <Badge
                              variant={getStatusColor(comparison.sizePercent)}
                              className="flex items-center gap-1"
                            >
                              {getStatusIcon(comparison.sizePercent)}
                              {comparison.sizePercent > 0 ? "+" : ""}
                              {comparison.sizePercent.toFixed(1)}%
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {formatBytes(data.size)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {data.chunks} chunks
                          </div>
                        </div>
                      </div>
                      <Progress value={usagePercent} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0KB</span>
                        <span>{usagePercent.toFixed(1)}% of budget</span>
                        <span>{formatBytes(budget)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Core Web Vitals</CardTitle>
              <CardDescription>
                Performance metrics tracked automatically
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {analysis.performance.lcp}s
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Largest Contentful Paint
                  </div>
                  <Badge variant="secondary" className="mt-2">
                    Good
                  </Badge>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {analysis.performance.fid}ms
                  </div>
                  <div className="text-sm text-muted-foreground">
                    First Input Delay
                  </div>
                  <Badge variant="secondary" className="mt-2">
                    Good
                  </Badge>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {analysis.performance.cls}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Cumulative Layout Shift
                  </div>
                  <Badge variant="secondary" className="mt-2">
                    Good
                  </Badge>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {analysis.performance.ttfb}ms
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Time to First Byte
                  </div>
                  <Badge variant="secondary" className="mt-2">
                    Good
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Bundle Size Trends</CardTitle>
              <CardDescription>
                Track bundle size changes over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-4" />
                <p>Trend analysis coming soon</p>
                <p className="text-sm">
                  Historical data will be displayed here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="mt-8 flex gap-4">
        <Button onClick={() => window.open("/api/bundle-analysis", "_blank")}>
          📊 Generate New Report
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            window.open("https://github.com/your-repo/actions", "_blank")
          }
        >
          🔗 View CI Results
        </Button>
      </div>
    </div>
  );
}
