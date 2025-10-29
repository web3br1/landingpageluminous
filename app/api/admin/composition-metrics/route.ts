import { NextRequest, NextResponse } from "next/server";
import { getLogger } from "@/lib/composition/container";

// Tipos para métricas (mantém consistência com o hook)
interface CompositionMetrics {
  totalRequests: number;
  successfulCompositions: number;
  failedCompositions: number;
  averageResponseTime: number;
  medianResponseTime: number;
  p95ResponseTime: number;
  errorRate: number;
  cacheHitRate: number;
  pageTypeBreakdown: Record<
    string,
    {
      count: number;
      avgTime: number;
      successRate: number;
    }
  >;
  recentErrors: Array<{
    timestamp: number;
    pageType: string;
    error: string;
    duration: number;
  }>;
  performanceTrends: Array<{
    timestamp: number;
    avgResponseTime: number;
    errorRate: number;
    cacheHitRate: number;
  }>;
}

// Mock data generator - em produção, isso viria de um sistema de métricas real
function generateMockMetrics(): CompositionMetrics {
  const now = Date.now();
  const baseRequests = 12000 + Math.random() * 2000;

  // Gerar dados realistas baseados em tipos de página
  const pageTypes = [
    "landing",
    "features",
    "pricing",
    "demo",
    "signup",
    "trial",
    "checkout",
  ];
  const pageTypeBreakdown: Record<
    string,
    { count: number; avgTime: number; successRate: number }
  > = {};

  let totalRequests = 0;
  let totalSuccessful = 0;
  let totalFailed = 0;
  let weightedTimeSum = 0;

  pageTypes.forEach((pageType) => {
    const count = Math.floor(baseRequests * (0.1 + Math.random() * 0.3));
    const baseTime = 100 + Math.random() * 100;
    const avgTime = Math.round(baseTime + Math.random() * 50);
    const successRate = 94 + Math.random() * 5; // 94-99%

    pageTypeBreakdown[pageType] = {
      count,
      avgTime,
      successRate: Math.round(successRate * 10) / 10,
    };

    totalRequests += count;
    const successful = Math.floor(count * (successRate / 100));
    totalSuccessful += successful;
    totalFailed += count - successful;
    weightedTimeSum += avgTime * count;
  });

  // Calcular métricas agregadas
  const averageResponseTime = Math.round(weightedTimeSum / totalRequests);
  const errorRate = Math.round((totalFailed / totalRequests) * 1000) / 10;

  // Gerar erros recentes
  const recentErrors = Array.from(
    { length: 3 + Math.floor(Math.random() * 3) },
    (_, i) => ({
      timestamp: now - (i + 1) * (5 + Math.random() * 10) * 60000, // 5-15 min atrás
      pageType: pageTypes[Math.floor(Math.random() * pageTypes.length)],
      error: [
        "Content mapping timeout",
        "Fallback provider error",
        "Performance monitor failure",
        "Configuration validation error",
        "Cache miss timeout",
      ][Math.floor(Math.random() * 5)],
      duration: Math.round((200 + Math.random() * 300) * 10) / 10,
    }),
  );

  // Gerar tendências das últimas 24 horas
  const performanceTrends = Array.from({ length: 24 }, (_, i) => {
    const hourOffset = 23 - i;
    const baseTime = averageResponseTime - 20 + Math.random() * 40;
    const baseErrorRate = errorRate - 2 + Math.random() * 4;

    return {
      timestamp: now - hourOffset * 3600000,
      avgResponseTime: Math.round(baseTime * 10) / 10,
      errorRate: Math.round(baseErrorRate * 10) / 10,
      cacheHitRate: Math.round((70 + Math.random() * 20) * 10) / 10,
    };
  });

  return {
    totalRequests,
    successfulCompositions: totalSuccessful,
    failedCompositions: totalFailed,
    averageResponseTime,
    medianResponseTime: Math.round(averageResponseTime * 0.9), // Estimativa
    p95ResponseTime: Math.round(averageResponseTime * 2.1), // Estimativa
    errorRate,
    cacheHitRate: Math.round((75 + Math.random() * 15) * 10) / 10,
    pageTypeBreakdown,
    recentErrors,
    performanceTrends,
  };
}

export async function GET(request: NextRequest) {
  const logger = getLogger();

  try {
    // Verificar autenticação/autorização (simplificada)
    // Em produção, implementar verificação de admin role

    // Simular latência de API
    await new Promise((resolve) =>
      setTimeout(resolve, 200 + Math.random() * 300),
    );

    const metrics = generateMockMetrics();

    logger.info("Composition metrics requested", {
      totalRequests: metrics.totalRequests,
      errorRate: metrics.errorRate,
      cacheHitRate: metrics.cacheHitRate,
    });

    return NextResponse.json(metrics, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.error("Failed to generate composition metrics", {
      error: errorObj,
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// POST endpoint para receber métricas do sistema (webhook style)
export async function POST(request: NextRequest) {
  const logger = getLogger();

  try {
    const body = await request.json();

    // Validar dados recebidos
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 },
      );
    }

    // Em produção, salvar métricas no banco/cache
    logger.info("Composition metrics received", {
      pageType: body.pageType,
      duration: body.duration,
      success: body.success,
      cacheHit: body.cacheHit,
    });

    // Aqui seria implementada a lógica para:
    // 1. Validar dados
    // 2. Armazenar métricas
    // 3. Atualizar agregações
    // 4. Trigger alerts se necessário

    return NextResponse.json({ status: "ok", received: true }, { status: 200 });
  } catch (error) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logger.error("Failed to process composition metrics", {
      error: errorObj,
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
