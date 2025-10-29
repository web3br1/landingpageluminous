import { UserSegment } from "@/lib/personalization/types";
import { analytics } from "@/lib/analytics-core";

export interface ProductRecommendation {
  id: string;
  type: "feature" | "plan" | "integration" | "resource";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  relevance_score: number;
  reason: string;
  cta_text: string;
  cta_url: string;
  visual?: {
    icon?: string;
    image?: string;
    badge?: string;
  };
  metadata?: {
    category?: string;
    tags?: string[];
    estimated_value?: string;
    complexity?: "low" | "medium" | "high";
  };
}

export interface UserContext {
  segments: UserSegment[];
  profile: {
    role?: string;
    goals?: string[];
    experience_level?: "beginner" | "intermediate" | "advanced";
    timeline?: string;
    preferred_features?: string[];
  };
  behavior: {
    page_views: string[];
    time_spent: Record<string, number>;
    interactions: Array<{
      type: string;
      element: string;
      timestamp: Date;
    }>;
    conversion_events: string[];
  };
  current_page: string;
}

export class ProductRecommendationEngine {
  private readonly features = {
    automation: {
      id: "automation",
      title: "Automação Avançada",
      description: "Automatize relatórios complexos e processos manuais",
      category: "core",
    },
    ai_insights: {
      id: "ai_insights",
      title: "Insights com IA",
      description: "Análises inteligentes e previsões automatizadas",
      category: "ai",
    },
    real_time: {
      id: "real_time",
      title: "Dashboards em Tempo Real",
      description: "Monitore KPIs e métricas instantaneamente",
      category: "monitoring",
    },
    integrations: {
      id: "integrations",
      title: "Integrações Enterprise",
      description: "Conecte com 50+ sistemas e APIs",
      category: "integration",
    },
    mobile_app: {
      id: "mobile_app",
      title: "App Mobile Nativo",
      description: "Acesse dados de qualquer lugar",
      category: "mobile",
    },
    api_access: {
      id: "api_access",
      title: "API Programática",
      description: "Integre dados em seus sistemas",
      category: "developer",
    },
  };

  private readonly plans = {
    starter: {
      id: "starter",
      title: "Plano Starter",
      description: "Perfeito para pequenos times começarem",
      price: "R$ 97/mês",
      features: ["automation", "real_time", "basic_integrations"],
    },
    professional: {
      id: "professional",
      title: "Plano Professional",
      description: "Para times em crescimento",
      price: "R$ 297/mês",
      features: [
        "automation",
        "ai_insights",
        "real_time",
        "advanced_integrations",
      ],
    },
    enterprise: {
      id: "enterprise",
      title: "Plano Enterprise",
      description: "Soluções personalizadas para grandes empresas",
      price: "Personalizado",
      features: [
        "all_features",
        "white_label",
        "dedicated_support",
        "custom_integrations",
      ],
    },
  };

  async generateRecommendations(
    context: UserContext,
    limit: number = 3,
  ): Promise<ProductRecommendation[]> {
    const recommendations: ProductRecommendation[] = [];

    // Analyze user profile and behavior
    const profileScore = this.analyzeUserProfile(context.profile);
    const behaviorScore = this.analyzeUserBehavior(context.behavior);
    const pageContext = this.analyzePageContext(context.current_page);

    // Combine scores with weights
    const combinedScores = this.combineScores(
      profileScore,
      behaviorScore,
      pageContext,
    );

    // Generate feature recommendations
    recommendations.push(
      ...this.generateFeatureRecommendations(combinedScores, context),
    );

    // Generate plan recommendations
    recommendations.push(
      ...this.generatePlanRecommendations(combinedScores, context),
    );

    // Generate integration recommendations
    recommendations.push(
      ...this.generateIntegrationRecommendations(combinedScores, context),
    );

    // Sort by relevance and priority
    recommendations.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      const aScore = a.relevance_score * priorityWeight[a.priority];
      const bScore = b.relevance_score * priorityWeight[b.priority];
      return bScore - aScore;
    });

    // Limit results and track analytics
    const topRecommendations = recommendations.slice(0, limit);

    analytics.track("recommendations_generated", {
      user_segments: context.segments,
      total_recommendations: recommendations.length,
      top_recommendations: topRecommendations.map((r) => ({
        id: r.id,
        type: r.type,
        relevance_score: r.relevance_score,
        priority: r.priority,
      })),
      context_page: context.current_page,
    });

    return topRecommendations;
  }

  private analyzeUserProfile(
    profile: UserContext["profile"],
  ): Record<string, number> {
    const scores: Record<string, number> = {};

    // Role-based scoring
    switch (profile.role) {
      case "analyst":
        scores.automation = 0.9;
        scores.real_time = 0.8;
        scores.ai_insights = 0.7;
        break;
      case "manager":
        scores.real_time = 0.9;
        scores.ai_insights = 0.8;
        scores.automation = 0.6;
        break;
      case "director":
      case "executive":
        scores.ai_insights = 0.9;
        scores.integrations = 0.8;
        scores.automation = 0.7;
        break;
      default:
        // Default balanced scoring
        scores.automation = 0.6;
        scores.ai_insights = 0.6;
        scores.real_time = 0.6;
    }

    // Goals-based scoring
    profile.goals?.forEach((goal) => {
      switch (goal) {
        case "automation":
          scores.automation = (scores.automation || 0) + 0.3;
          break;
        case "insights":
          scores.ai_insights = (scores.ai_insights || 0) + 0.3;
          break;
        case "efficiency":
          scores.automation = (scores.automation || 0) + 0.2;
          scores.real_time = (scores.real_time || 0) + 0.2;
          break;
      }
    });

    // Experience level adjustments
    const expMultiplier = {
      beginner: 1.2, // Recommend simpler features
      intermediate: 1.0,
      advanced: 0.8, // Recommend advanced features
    }[profile.experience_level || "intermediate"];

    Object.keys(scores).forEach((key) => {
      scores[key] *= expMultiplier;
      scores[key] = Math.min(1, scores[key]); // Cap at 1.0
    });

    return scores;
  }

  private analyzeUserBehavior(
    behavior: UserContext["behavior"],
  ): Record<string, number> {
    const scores: Record<string, number> = {};

    // Page view analysis
    behavior.page_views.forEach((page) => {
      if (page.includes("features"))
        scores.automation = (scores.automation || 0) + 0.2;
      if (page.includes("pricing"))
        scores.professional_plan = (scores.professional_plan || 0) + 0.3;
      if (page.includes("demo"))
        scores.ai_insights = (scores.ai_insights || 0) + 0.2;
    });

    // Time spent analysis
    Object.entries(behavior.time_spent).forEach(([page, time]) => {
      if (time > 60) {
        // More than 1 minute
        if (page.includes("features"))
          scores.automation = (scores.automation || 0) + 0.1;
        if (page.includes("pricing"))
          scores.professional_plan = (scores.professional_plan || 0) + 0.2;
      }
    });

    // Interaction analysis
    behavior.interactions.forEach((interaction) => {
      if (
        interaction.type === "click" &&
        interaction.element.includes("demo")
      ) {
        scores.ai_insights = (scores.ai_insights || 0) + 0.2;
      }
      if (
        interaction.type === "scroll" &&
        interaction.element.includes("pricing")
      ) {
        scores.professional_plan = (scores.professional_plan || 0) + 0.1;
      }
    });

    return scores;
  }

  private analyzePageContext(currentPage: string): Record<string, number> {
    const scores: Record<string, number> = {};

    // Page-specific recommendations
    if (currentPage.includes("features")) {
      scores.ai_insights = 0.8;
      scores.integrations = 0.6;
    } else if (currentPage.includes("pricing")) {
      scores.professional_plan = 0.9;
      scores.enterprise_plan = 0.4;
    } else if (currentPage.includes("demo")) {
      scores.automation = 0.7;
      scores.real_time = 0.6;
    } else if (currentPage === "/" || currentPage.includes("landing")) {
      scores.automation = 0.6;
      scores.ai_insights = 0.5;
      scores.starter_plan = 0.4;
    }

    return scores;
  }

  private combineScores(
    profile: Record<string, number>,
    behavior: Record<string, number>,
    pageContext: Record<string, number>,
  ): Record<string, number> {
    const combined: Record<string, number> = {};

    // Get all unique keys
    const allKeys = new Set([
      ...Object.keys(profile),
      ...Object.keys(behavior),
      ...Object.keys(pageContext),
    ]);

    // Combine with weights: profile (40%), behavior (35%), page context (25%)
    allKeys.forEach((key) => {
      const profileScore = profile[key] || 0;
      const behaviorScore = behavior[key] || 0;
      const pageScore = pageContext[key] || 0;

      combined[key] =
        profileScore * 0.4 + behaviorScore * 0.35 + pageScore * 0.25;
    });

    return combined;
  }

  private generateFeatureRecommendations(
    scores: Record<string, number>,
    context: UserContext,
  ): ProductRecommendation[] {
    const recommendations: ProductRecommendation[] = [];

    // Check high-scoring features
    Object.entries(scores).forEach(([featureId, score]) => {
      if (
        score > 0.6 &&
        this.features[featureId as keyof typeof this.features]
      ) {
        const feature = this.features[featureId as keyof typeof this.features];

        recommendations.push({
          id: `feature_${featureId}`,
          type: "feature",
          title: feature.title,
          description: feature.description,
          priority: score > 0.8 ? "high" : score > 0.7 ? "medium" : "low",
          relevance_score: score,
          reason: this.generateReason(featureId, context),
          cta_text: "Saiba Mais",
          cta_url: `/features#${featureId}`,
          visual: {
            icon: this.getFeatureIcon(featureId),
            badge: score > 0.8 ? "Recomendado" : undefined,
          },
          metadata: {
            category: feature.category,
            tags: [feature.category, "feature"],
            complexity: this.getFeatureComplexity(featureId),
          },
        });
      }
    });

    return recommendations;
  }

  private generatePlanRecommendations(
    scores: Record<string, number>,
    context: UserContext,
  ): ProductRecommendation[] {
    const recommendations: ProductRecommendation[] = [];

    // Check plan recommendations
    const planKeys = Object.keys(scores).filter((key) => key.includes("_plan"));
    const highestPlanScore = Math.max(...planKeys.map((key) => scores[key]), 0);

    if (highestPlanScore > 0.5) {
      const recommendedPlan = planKeys
        .reduce((best, current) =>
          scores[current] > scores[best] ? current : best,
        )
        .replace("_plan", "") as keyof typeof this.plans;

      if (this.plans[recommendedPlan]) {
        const plan = this.plans[recommendedPlan];

        recommendations.push({
          id: `plan_${recommendedPlan}`,
          type: "plan",
          title: plan.title,
          description: plan.description,
          priority: highestPlanScore > 0.8 ? "high" : "medium",
          relevance_score: highestPlanScore,
          reason: `Baseado no seu perfil de ${context.profile.role || "usuário"} e objetivos`,
          cta_text: "Ver Plano",
          cta_url: `/pricing?plan=${recommendedPlan}`,
          visual: {
            icon: "💎",
            badge: recommendedPlan === "enterprise" ? "Popular" : "Recomendado",
          },
          metadata: {
            category: "pricing",
            tags: ["plan", recommendedPlan],
            estimated_value: plan.price,
          },
        });
      }
    }

    return recommendations;
  }

  private generateIntegrationRecommendations(
    scores: Record<string, number>,
    context: UserContext,
  ): ProductRecommendation[] {
    const recommendations: ProductRecommendation[] = [];

    if (scores.integrations && scores.integrations > 0.6) {
      recommendations.push({
        id: "integration_erp",
        type: "integration",
        title: "Integração com SAP/Oracle",
        description: "Conecte seus dados ERP diretamente ao Luminaris",
        priority: "medium",
        relevance_score: scores.integrations,
        reason: "Para usuários enterprise que precisam de integração avançada",
        cta_text: "Ver Integrações",
        cta_url: "/integrations",
        visual: {
          icon: "🔗",
          badge: "Enterprise",
        },
        metadata: {
          category: "integration",
          tags: ["erp", "enterprise", "api"],
          complexity: "high",
        },
      });
    }

    return recommendations;
  }

  private generateReason(featureId: string, context: UserContext): string {
    const reasons = {
      automation: `Ideal para ${context.profile.role === "analyst" ? "analistas" : "profissionais"} que trabalham com dados`,
      ai_insights: "Proporciona insights inteligentes para tomada de decisão",
      real_time:
        "Monitoramento contínuo para equipes que precisam de agilidade",
      integrations: "Conectividade enterprise para máxima eficiência",
    };

    return (
      reasons[featureId as keyof typeof reasons] ||
      "Recomendação personalizada baseada no seu perfil"
    );
  }

  private getFeatureIcon(featureId: string): string {
    const icons = {
      automation: "⚡",
      ai_insights: "🤖",
      real_time: "📊",
      integrations: "🔗",
      mobile_app: "📱",
      api_access: "🔌",
    };

    return icons[featureId as keyof typeof icons] || "✨";
  }

  private getFeatureComplexity(featureId: string): "low" | "medium" | "high" {
    const complexities = {
      automation: "low",
      real_time: "low",
      mobile_app: "low",
      ai_insights: "medium",
      integrations: "medium",
      api_access: "high",
    };

    return (
      (complexities[featureId as keyof typeof complexities] as
        | "high"
        | "medium"
        | "low") || "medium"
    );
  }
}

export const recommendationEngine = new ProductRecommendationEngine();
