"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AdminHeroProps {
  content: {
    title: string;
    subtitle: string;
  };
  variant?: "default";
  id?: string;
}

export function AdminHero({
  content,
  variant = "default",
  id,
}: AdminHeroProps) {
  return (
    <section id={id} className="py-8 md:py-12">
      <div className="container mx-auto max-w-6xl px-4 md:px-6">
        <Card className="bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 border-blue-200 dark:border-blue-800">
          <CardContent className="p-8 md:p-12">
            <div className="text-center">
              <Badge
                variant="secondary"
                className="mb-4 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              >
                Admin Dashboard
              </Badge>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                {content.title}
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                {content.subtitle}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
