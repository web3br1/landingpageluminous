"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, TrendingUp, Users, Target } from "lucide-react";

interface ExperimentListProps {
  content?: unknown;
  variant?: "default";
  id?: string;
}

export function ExperimentList({
  content,
  variant = "default",
  id,
}: ExperimentListProps) {
  // Mock data for experiments
  const experiments = [
    {
      id: "hero_headline",
      name: "Hero Headline Test",
      status: "running",
      variants: ["A", "B"],
      winner: null,
      confidence: 87,
      startDate: "2025-01-15",
    },
    {
      id: "cta_color",
      name: "CTA Color Test",
      status: "completed",
      variants: ["blue", "green"],
      winner: "blue",
      confidence: 95,
      startDate: "2025-01-01",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return <Badge className="bg-green-100 text-green-800">Running</Badge>;
      case "completed":
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      case "paused":
        return <Badge variant="secondary">Paused</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <section id={id} className="py-8">
      <div className="container mx-auto max-w-6xl px-4 md:px-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {/* Stats Cards */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Experiments
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">Currently running</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Conversions
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">
                +12% from last week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Test Audience
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45.2K</div>
              <p className="text-xs text-muted-foreground">
                Users in experiments
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Experiments List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Experiments</h2>
            <Button>
              <Target className="mr-2 h-4 w-4" />
              New Experiment
            </Button>
          </div>

          {experiments.map((experiment) => (
            <Card key={experiment.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{experiment.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      ID: {experiment.id}
                    </p>
                  </div>
                  {getStatusBadge(experiment.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Variants</p>
                    <p className="font-medium">
                      {experiment.variants.join(", ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Winner</p>
                    <p className="font-medium">
                      {experiment.winner || "Pending"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Confidence</p>
                    <p className="font-medium">{experiment.confidence}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Started</p>
                    <p className="font-medium">{experiment.startDate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
